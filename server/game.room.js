/**
 * # Waiting Room for Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Handles incoming connections, matches them, sets the Ultimatum game
 * in each client, move them in a separate gaming room, and start the game.
 * ---
 */
module.exports = function(node, channel, room) {

    var path = require('path');

    var J = require('JSUS').JSUS;

    // Load settings.
    var settings = require(__dirname + '/game.settings.js');

    // Reads in descil-mturk configuration.
    var confPath = path.resolve(__dirname, 'descil.conf.js');

    // Load the code database.
    var dk = require('descil-mturk')(confPath);
    function codesNotFound() {
        if (!dk.codes.size()) {
            throw new Error('game.room: no codes found.');
        }
        // Add a ref to the node obj.
        node.dk = dk;
    }

    if (settings.AUTH === 'MTURK') {
        dk.getCodes(codesNotFound);
    }
    else if (settings.AUTH === 'LOCAL') {
        dk.readCodes(codesNotFound);
    }

    // Loads the database layer. If you do not use an external database
    // you do not need these lines.
    var Database = require('nodegame-db').Database;
    var ngdb = new Database(node);
    var mdb = ngdb.getLayer('MongoDB');

    // Load the nodegame-client object.
    var ngc = require('nodegame-client');

    // Creates a Stager object. It will be used to define the sequence of
    // stages for this waiting rooms.
    var stager = new node.Stager();

    // Creating a unique game stage that will handle all incoming connections.
    stager.addStage({
        id: 'waiting',
        cb: function() {
            // Returning true in a stage callback means execution ok.
            return true;
        }
    });

    var clientWait = channel.require(__dirname + '/includes/wait.client', {
        ngc: ngc
    });

    // Assigns a treatment condition to a group.
    function decideRoom(treatment) {
        var treatmentList;

        if ('undefined' === typeof treatment) {
            treatmentList = J.keys(settings.treatments);
            treatmentList.push('default');
            treatment = J.randomInt(0, treatmentList.length);
            treatment = treatmentList[treatment];
        }
        // Implement logic here.
        return treatment;
    }

    // Creating an authorization function for the players.
    // This is executed before the client the PCONNECT listener.
    // Here direct messages to the client can be sent only using
    // his socketId property, since no clientId has been created yet.
    channel.player.authorization(function(header, cookies, room) {
        var code, player, token;

        if (settings.AUTH === 'NO') {
            return true;
        }

        playerId = cookies.player;
        token = cookies.token;

        console.log('game.room: checking auth.');

        // Weird thing.
        if ('string' !== typeof playerId) {
            console.log('no player: ', player)
            return false;
        }

        // Weird thing.
        if ('string' !== typeof token) {
            console.log('no token: ', token)
            return false;
        }

        code = dk.codeExists(token);

        console.log(code);
        console.log("-------------------");

        // Code not existing.
	if (!code) {
            console.log('not existing token: ', token);
            return false;
        }

        if (code.checkedOut) {
            console.log('token was already checked out: ', token);
            return false;
        }

        // Code in use.
        //  usage is for LOCAL check, IsUsed for MTURK
	if (code.valid === false) {
            if (code.disconnected) {
                return true;
            }
            else {
                console.log('token already in use: ', token);
                return false;
            }
	}

        // Client Authorized
        return true;

// Old code.

//         // Code not existing.
//         if (!code) {
//             console.log('not existing token: ', token);
//             return false;
//         }
//
//         // Code in use.
//         //  usage is for LOCAL check, IsUsed for MTURK
//         if (code.usage || code.IsUsed) {
//             if (code.disconnected) {
//                 return true;
//             }
//             else {
//                 console.log('token already in use: ', token);
//                 return false;
//             }
//         }
//
//         // Mark the code as in use.
//         dk.incrementUsage(token);
//
//         if (settings.AUTH === 'MTURK') {
//             dk.checkIn(token);
//         }
//
//         // Client Authorized
//         return true;
    });

    // Assigns Player Ids based on cookie token.
    channel.player.clientIdGenerator(function(headers, cookies, validCookie,
                                              ids, info) {
        var cid;

        if (settings.AUTH === 'NO') {
            cid = channel.registry.generateClientId();

            // If no auth, add the new code to the db.
            dk.codes.insert({
                AccessCode: cid,
                ExitCode: cid + '_exit'
            });
            return cid;
        }

        // Return the id only if token was validated.
        // More checks could be done here to ensure that token is unique in ids.
        if (cookies.token && validCookie) {
            return cookies.token;
        }
    });

    // Creating an init function.
    // Event listeners registered here are valid for all the stages of the game.
    stager.setOnInit(function() {
        var counter = 0;
        var POOL_SIZE = settings.POOL_SIZE;
        var GROUP_SIZE = settings.GROUP_SIZE;

        // references...
        this.room = room;
        this.channel = channel;

        console.log('********Waiting Room Created*****************');

        function connectingPlayer(p) {
            var gameRoom, wRoom, tmpPlayerList;
            var nPlayers, i, len, treatment, runtimeConf;
            var idxs;

            console.log('-----------Player connected ' + p.id);

            dk.markInvalid(p.id);

            // PlayerList object of waiting players.
            wRoom = room.clients.player;
            nPlayers = wRoom.size();

            // Send the client the waiting stage.
            node.remoteSetup('game_metadata',  p.id, clientWait.metadata);
            node.remoteSetup('plot', p.id, clientWait.plot);
            node.remoteCommand('start', p.id);

            node.say('waitingRoom', 'ROOM', {
                poolSize: POOL_SIZE,
                nPlayers: nPlayers
            });

            // Wait to have enough clients connected.
            if (nPlayers < POOL_SIZE) {
                return;
            }

            console.log('-----------We have enough players: ' + wRoom.size());

            i = -1, len = Math.floor(nPlayers / GROUP_SIZE);
            for ( ; ++i < len ; ) {

                // Doing the random matching.
                tmpPlayerList = wRoom.shuffle().limit(GROUP_SIZE);

                // Assigning a treatment to this list of players
                treatment = decideRoom(settings.CHOSEN_TREATMENT);

                // Creating a sub gaming room.
                // The object must contains the following information:
                // - clients: a list of players (array or PlayerList)
                // - group: a name to group together multiple game rooms (string)
                // - gameName: the name of the game to play (string)
                // - treatmentName: the name of the treatment to play (string)
                gameRoom = channel.createGameRoom({
                    group: 'ultimatum',
                    clients: tmpPlayerList,
                    gameName: 'ultimatum',
                    treatmentName: treatment
                });

                gameRoom.setupGame();
                gameRoom.startGame();
            }

            // TODO: node.game.pl.size() is unchanged.
            // We need to check with wRoom.size()
            nPlayers = room.clients.player.size();
            if (nPlayers) {
                // If there are some players left out of the matching, notify
                // them that they have to wait more.
                wRoom.each(function(p) {
                    node.say('waitingRoom', p.id, {
                        poolSize: POOL_SIZE,
                        nPlayers: nPlayers,
                        retry: true
                    });
                });
            }
        }

        // This callback is executed whenever a previously disconnected
        // players reconnects.
        node.on.preconnect(function(p) {
            console.log('Oh...somebody reconnected in the waiting room!', p);
            // Notify other player he is back.
            // TODO: add it automatically if we return TRUE? It must be done
            // both in the alias and the real event handler
            // TODO: Cannot use to: ALL, because this includes the reconnecting
            // player.
            node.game.pl.each(function(player) {
                node.socket.send(node.msg.create({
                    target: 'PCONNECT',
                    data: p,
                    to: player.id
                }));
            });

            node.socket.send(node.msg.create({
                target: 'PLIST',
                data: node.game.pl.db,
                to: p.id
            }));

            node.game.pl.add(p);
            connectingPlayer(p);
        });

        // This must be done manually for now (maybe will change in the future).
        node.on.mreconnect(function(p) {
            node.game.ml.add(p);
        });

        // This callback is executed when a player connects to the channel.
        node.on.pconnect(connectingPlayer);

        // This callback is executed when a player disconnects from the channel.
        node.on.pdisconnect(function(p) {

            // Client really disconnected (not moved into another game room).
            if (channel.registry.clients.disconnected.get(p.id)) {
                // Free up the code.
                dk.markValid(p.id);
            }
        });
    });

    // This function will be executed once node.game.gameover() is called.
    stager.setOnGameOver(function() {
        console.log('^^^^^^^^^^^^^^^^GAME OVER^^^^^^^^^^^^^^^^^^');
    });

    // Defining the game structure:
    // - init: must always be there. It corresponds to the `setOnInit` function.
    // - loop: without a second argument, loops forever on the same function.
    // Other possibilities are: .next(), .repeat(), .gameover().
    // @see node.Stager
    stager
        .init()
        .loop('waiting');

    // Returns all the information about this waiting room.
    return {
        nodename: 'wroom',
        game_metadata: {
            name: 'wroom',
            version: '0.2.0'
        },
        game_settings: {
            publishLevel: 0
        },
        plot: stager.getState(),
        // If debug is true, the ErrorManager will throw errors
        // also for the sub-rooms.
        debug: settings.DEBUG,
        verbosity: 0,
        publishLevel: 2
    };
};
