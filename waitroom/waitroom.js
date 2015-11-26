/**
 * # Standard Waiting Room for a nodeGame Channel
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * Handles incoming connections, matches them, setups the Ultimatum game
 * in each client, move them in a separate gaming room, and start the game.
 */
module.exports = function(settings, waitRoom, runtimeConf) {

    // Load the code database.
    var J = require('JSUS').JSUS;

    var node = waitRoom.node;
    var channel = waitRoom.channel;

    var clientConnects, startGame;

    var GROUP_SIZE = settings.GROUP_SIZE;
    var POOL_SIZE = settings.POOL_SIZE || GROUP_SIZE;
    var ALT_POOL_SIZE = settings.ALT_POOL_SIZE;
    var MAX_WAIT_TIME = settings.MAX_WAIT_TIME;
    var ON_TIMEOUT = settings.ON_TIMEOUT;
    var EXECUTION_MODE = settings.EXECUTION_MODE;
    var START_DATE = settings.START_DATE;

    var treatments = Object.keys(channel.gameInfo.settings);
    var tLen = treatments.length;

    var timeOuts = {};

    var stager = new node.Stager();

    var roomOpen = true;

    // Check whether the execution mode is valid.
    if (EXECUTION_MODE.TYPE !== 'TIMEOUT' &&
        EXECUTION_MODE.TYPE !== 'WAIT_FOR_N_PLAYERS') {

        throw new Error(channel.name + ' waiting room: invalid execution ' +
                        'mode found: ' + EXECUTION_MODE.TYPE);
    }

    // decideTreatment: check if string, or use it.
    function decideTreatment(t) {
        if (t === "treatment_rotate") {
            return treatments[(channel.autoRoomNo) % tLen];
        }
        else if ('undefined' === typeof t) {
            return treatments[J.randomInt(-1,tLen-1)];
        }
        return t;
    }

    function closeRoom() {
        roomOpen = false;
    }
    function openRoom() {
        roomOpen = true;
    }
    function makeTimeOut(playerID,waitTime) {
        timeOuts[playerID] = setTimeout(function() {
            var timeOutData, code, pList, nPlayers;
            channel.sysLogger.log("Timeout has not been cleared!!!");
            pList = waitRoom.clients.player;
            nPlayers = pList.size();

            // For execution modes `'TIMEOUT'` and `'WAIT_FOR_N_PLAYERS'`.
            if (nPlayers >= POOL_SIZE ||
                (EXECUTION_MODE.MIN_PLAYER &&
                nPlayers >= EXECUTION_MODE.MIN_PLAYER)) {

                startGame({
                    over: "Time elapsed!!!",
                    nPlayers: nPlayers
                }, nPlayers, pList);
            }
            else {
                channel.registry.checkOut(playerID);

                // See if an access code is defined, if so checkout remotely
                // also.
                code = channel.registry.getClient(playerID);

                timeOutData = {
                    over: "Time elapsed, disconnect",
                    exit: code.ExitCode
                };
                node.say("TIME", playerID, timeOutData);
            }

        }, waitTime);
    }

    function clearTimeOut(playerID) {
        clearTimeout(timeOuts[playerID]);
        delete timeOuts[playerID];
    }

    function clientReconnects(p) {
        channel.sysLogger.log('Reconnection in the waiting room.', p);

        node.game.pl.each(function(player) {
            node.socket.send(node.msg.create({
                target: 'PCONNECT',
                data: p,
                to: player.id
            }));
        });

        // Send currently connected players to reconnecting one.
        node.socket.send(node.msg.create({
            target: 'PLIST',
            // TODO: this sends a bit too much.
            data: node.game.pl.db,
            to: p.id
        }));
        node.game.pl.add(p);
        clientConnects(p);
    }

    function clientDisconnects(p) {
        var wRoom, i;

        // Clear timeout in any case.
        clearTimeOut(p.id);

        // Client really disconnected (not moved into another game room).
        if (channel.registry.clients.disconnected.get(p.id)) {
            // Free up the code.
            channel.registry.markValid(p.id);
        }
        wRoom = waitRoom.clients.player;
        for (i = 0; i < wRoom.size(); i++) {
            node.say("PLAYERSCONNECTED", wRoom.db[i].id, wRoom.size());
        }
    }

    // Using self-calling function to put `firstTime` into closure.
    clientConnects = function(firstTime) {
        if ("undefined" !== typeof START_DATE) {
           firstTime = new Date().getTime();
           // Everybody has to wait until START_DATE
           MAX_WAIT_TIME = new Date(START_DATE).getTime() - firstTime;
        }

        return function(p) {
            var pList;
            var nPlayers;
            var waitTime;
            if (roomOpen) {
                console.log('Client connected to waiting room: ', p.id);

                // Mark code as used.
                channel.registry.markInvalid(p.id);

                pList = waitRoom.clients.player;
                nPlayers = pList.size();

                node.remoteSetup('page', p.id, {
                    clearBody: true,
                    title: { title: 'Welcome!', addToBody: true }
                });

                node.remoteSetup('widgets', p.id, {
                    destroyAll: true,
                    append: { 'WaitingRoom': {} }
                });

                if (!firstTime) {
                    firstTime = new Date().getTime();
                }
                waitTime = MAX_WAIT_TIME - (new Date().getTime() - firstTime);

                // Send the number of minutes to wait.
                node.remoteSetup('waitroom', p.id, {
                    poolSize: POOL_SIZE,
                    groupSize: GROUP_SIZE,
                    maxWaitTime: waitTime,
                    onTimeout: ON_TIMEOUT
                });

                console.log('NPL ', nPlayers);

                // Notify all players of new connection.
                node.say("PLAYERSCONNECTED", 'ROOM', nPlayers);

                // Start counting a timeout for max stay in waiting room.
                makeTimeOut(p.id, waitTime);

                // Wait for all players to connect.
                if (nPlayers < POOL_SIZE) return;

                if (EXECUTION_MODE.TYPE === 'WAIT_FOR_N_PLAYERS') {
                    startGame({
                        over: "AllPlayersConnected",
                        exit: 0

                    }, nPlayers, pList);
                }
            }
            else {
                node.remoteSetup('page', p.id, {
                    clearBody: true,
                    title: { title: 'Welcome!', addToBody: true }
                });
                node.remoteSetup('widgets', p.id, {
                    destroyAll: true,
                    append: { 'WaitingRoom': {} }
                });

                node.say('ROOM_CLOSED', p.id);
            }
        };
    }();

    // StartGame may only be called once.
    startGame = function(maxCalls) {
        var treatmentName;
        var tmpPlayerList;
        var numCalls;
        numCalls = 0;

        return function (timeOutData, nPlayers, pList) {
            var i, gameRoom;

            if (++numCalls > maxCalls) return;

            for (i = 0; i < nPlayers; i++) {
                node.say("TIME", pList.db[i].id, timeOutData);

                // Clear body.
                node.remoteSetup('page', pList.db[i].id, { clearBody: true });

                // Clear timeout for players.
                clearTimeout(timeOuts[i]);
            }

            // Select a subset of players from pool.
            tmpPlayerList = pList.shuffle().limit(GROUP_SIZE);

            // Decide treatment.
            treatmentName = decideTreatment(settings.CHOSEN_TREATMENT);

            // Create new game room.
            gameRoom = channel.createGameRoom({
                clients: tmpPlayerList,
                treatmentName: treatmentName
            });

            // Setup and start game.
            gameRoom.setupGame();
            gameRoom.startGame(true, []);
        };
    }(1);

    function monitorReconnects(p) {
        node.game.ml.add(p);
    }

    stager.setOnInit(function() {

        // This callback is executed when a player connects to the channel.
        node.on.pconnect(clientConnects);

        // This callback is executed when a player connects to the channel.
        node.on.pdisconnect(clientDisconnects);

        // This callback is executed whenever a player reconnects.
        node.on.preconnect(clientReconnects);

        // This must be done manually for now.
        // (maybe will change in the future).
        node.on.mreconnect(monitorReconnects);

        channel.sysLogger.log('Waiting Room Created');
    });

    stager.setDefaultProperty('publishLevel', 0);

    stager.next('waiting');

    return {
        nodename: 'standard_wroom',
        metadata: {
            name: 'standard_wroom',
            version: '1.0.0'
        },
        plot: stager.getState(),
        debug: settings.debug || false,
        verbosity: 0
    };
};
