/**
 * # Logic code for Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Handles bidding, and responds between two players.
 * Extensively documented tutorial.
 *
 * Info:
 * Matching, and stepping can be done in different ways. It can be
 * centralized, and the logic tells the clients when to step, or
 * clients can synchronize themselves and step automatically.
 *
 * In this game, the logic is synchronized with the clients. The logic
 * will send automatically game-commands to start and step
 * through the game plot whenever it enters a new game step.
 *
 * http://www.nodegame.org
 * ---
 */

var path = require('path');

var Database = require('nodegame-db').Database;
// Variable _node_ is shared by the requiring module
// (game.room.js) through `channel.require` method.
var ngdb = new Database(module.parent.exports.node);
var mdb = ngdb.getLayer('MongoDB');

var ngc = require('nodegame-client');
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var GameStage = ngc.GameStage;
var J = ngc.JSUS;

var stager = new Stager();

// Here we export the logic function. Receives three parameters:
// - node: the NodeGameClient object.
// - channel: the ServerChannel object in which this logic will be running.
// - gameRoom: the GameRoom object in which this logic will be running.
module.exports = function(node, channel, gameRoom, treatmentName, settings) {
    var REPEAT = settings.REPEAT;
    var MIN_PLAYERS = settings.MIN_PLAYERS;
    var COINS = settings.COINS;
    var EXCHANGE_RATE = settings.EXCHANGE_RATE;

    // Variable registered outside of the export function are shared among all
    // instances of game logics.
    var counter = settings.SESSION_ID;

    var DUMP_DIR, DUMP_DIR_JSON, DUMP_DIR_CSV;
    DUMP_DIR = path.resolve(__dirname, 'data') + '/' + counter + '/';
    DUMP_DIR_JSON = DUMP_DIR + 'json/';
    DUMP_DIR_CSV = DUMP_DIR + 'csv/';

    // Recursively create directories, sub-trees and all.
    J.mkdirSyncRecursive(DUMP_DIR_JSON, 0777);
    J.mkdirSyncRecursive(DUMP_DIR_CSV, 0777);

    // Client game to send to reconnecting players.
    // The client function needs to be given a treatment name and
    // the treatment options, and it returns a game object.
    // TODO: Only pass the options from the current treatment; at
    // the moment, the entire game.settings structure is passed.
    var client = require(gameRoom.clientPath)(gameRoom, treatmentName, settings);

    // Reads in descil-mturk configuration.
    var confPath = path.resolve(__dirname, 'descil.conf.js');
    var dk = require('descil-mturk')(confPath);

    function codesNotFound() {
        if (!dk.codes.size()) {
            throw new Error('game.logic: no codes found.');
        }
    }

    if (settings.AUTH === 'MTURK') {
        dk.getCodes(codesNotFound);
    }
    else if (settings.AUTH === 'LOCAL') {
        dk.readCodes(codesNotFound);
    }

    function doMatch() {
        var g, bidder, respondent, data_b, data_r;
        var i;
        // Method shuffle accepts one parameter to update the db, as well as
        // returning a shuffled copy.
        g = node.game.pl.shuffle();

        for (i = 0 ; i < node.game.pl.size() ; i = i + 2) {
            bidder = g.db[i];
            respondent = g.db[i+1];

            data_b = {
                role: 'bidder',
                other: respondent.id
            };
            data_r = {
                role: 'respondent',
                other: bidder.id
            };

            console.log('Group ' + i + ': ', bidder.id, respondent.id);

            // Send a message to each player with their role
            // and the id of the other player.
            node.say('BIDDER', bidder.id, data_b);
            node.say('RESPONDENT', respondent.id, data_r);
        }
        console.log('Matching completed.');
    }

    // Event handler registered in the init function are always valid.
    stager.setOnInit(function() {
        console.log('********************** ultimatum room ' + counter++ + ' **********************');

        node.game.lastStage = node.game.getCurrentGameStage();

        node.game.gameTerminated = false;

        // If players disconnects and then re-connects within the same round
        // we need to take into account only the final bids within that round.
        node.game.lastBids = {};

        // "STEPPING" is the last event emitted before the stage is updated.
        node.on('STEPPING', function() {
            var currentStage, db, p, gain;

            currentStage = node.game.getCurrentGameStage();

            // We do not save stage 0.0.0.
            // Morever, If the last stage is equal to the current one, we are
            // re-playing the same stage cause of a reconnection. In this
            // case we do not update the database, or save files.
            if (!GameStage.compare(currentStage, new GameStage())) {// ||
                //!GameStage.compare(currentStage, node.game.lastStage)) {
                return;
            }
            // Update last stage reference.
            node.game.lastStage = currentStage;

            for (p in node.game.lastBids) {
                if (node.game.lastBids.hasOwnProperty(p)) {

                    // Respondent payoff.
                    code = dk.codes.id.get(p);
                    if (!code) {
                        console.log('AAAH code not found!');
                        return;
                    }
                    gain = node.game.lastBids[p];
                    if (gain) {
                        code.win = !code.win ? gain : code.win + gain;
                        console.log('Added to ' + p + ' ' + gain + ' ECU');
                    }
                }
            }

            db = node.game.memory.stage[currentStage];

            if (db && db.size()) {
                // Saving results to FS.
                node.fs.saveMemory('csv', DUMP_DIR + 'memory_' + currentStage +
                                   '.csv', { flags: 'w' }, db);
                node.fs.saveMemory('json', DUMP_DIR + 'memory_' + currentStage +
                                   '.nddb', null, db);

                console.log('Round data saved ', currentStage);
            }

            // Resets last bids;
            node.game.lastBids = {};
        });

        // Add session name to data in DB.
        node.game.memory.on('insert', function(o) {
            o.session = node.nodename;
        });

        // Register player disconnection, and wait for him...
        node.on.pdisconnect(function(p) {

            delete node.game.memory.stage[node.game.getCurrentGameStage()];

            dk.updateCode(p.id, {
                disconnected: true,
                stage: p.stage
            });
        });

        // Player reconnecting.
        // Reconnections must be handled by the game developer.
        node.on.preconnect(function(p) {
            var code;
            console.log('Oh...somebody reconnected!', p);
            code = dk.codeExists(p.id);

            if (!code) {
                console.log('game.logic: reconnecting player not found in ' +
                            'code db: ' + p.id);
                return;
            }
            if (!code.disconnected) {
                console.log('game.logic: reconnecting player that was not ' +
                            'marked disconnected: ' + p.id);
                return;
            }

            // Mark code as connected.
            code.disconnected = false;

            // Delete countdown to terminate the game.
            clearTimeout(this.countdown);

            // Clear any message in the buffer from.
            node.remoteCommand('erase_buffer', 'ROOM');

            // Notify other player he is back.
            // TODO: add it automatically if we return TRUE? It must be done
            // both in the alias and the real event handler
            node.game.pl.each(function(player) {
                node.socket.send(node.msg.create({
                    target: 'PCONNECT',
                    data: p,
                    to: player.id
                }));
            });

            // Send currently connected players to reconnecting.
            node.socket.send(node.msg.create({
                target: 'PLIST',
                data: node.game.pl.db,
                to: p.id
            }));

            // We could slice the game plot, and send just what we need
            // however here we resend all the stages, and move their game plot.
            console.log('** Player reconnected: ' + p.id + ' **');
            // Setting metadata, settings, and plot.
            node.remoteSetup('game_metadata',  p.id, client.metadata);
            node.remoteSetup('game_settings', p.id, client.settings);
            node.remoteSetup('plot', p.id, client.plot);
            node.remoteSetup('env', p.id, client.env);
            node.remoteSetup('env', p.id, {
                treatment: node.env('treatment')
            });

            // Start the game on the reconnecting client.
            node.remoteCommand('start', p.id);
            // Pause the game on the reconnecting client, will be resumed later.
            // node.remoteCommand('pause', p.id);

            // It is not added automatically.
            // TODO: add it automatically if we return TRUE? It must be done
            // both in the alias and the real event handler.
            node.game.pl.add(p);

            // Will send all the players to current stage
            // (also those who were there already).
            node.game.gotoStep(node.player.stage);

            setTimeout(function() {
                // Pause the game on the reconnecting client, will be resumed later.
                // node.remoteCommand('pause', p.id);
                // Unpause ALL players
                // TODO: add it automatically if we return TRUE? It must be done
                // both in the alias and the real event handler
                node.game.pl.each(function(player) {
                    if (player.id !== p.id) {
                        node.remoteCommand('resume', player.id);
                    }
                });
                // The logic is also reset to the same game stage.
            }, 100);
            // Unpause ALL players
            // node.remoteCommand('resume', 'ALL');
        });

        // Update the Payoffs
        node.on.data('response', function(msg) {
            var resWin, bidWin, code, response;
            response = msg.data;

            if (!response) {
                // TODO handle error.
                return;
            }

            if (response.response === 'ACCEPT') {
                resWin = parseInt(response.value, 10);
                bidWin = COINS - resWin;

                // Save the results in a temporary variables. If the round
                // finishes without a disconnection we will add them to the
                // database.
                node.game.lastBids[msg.from] = resWin;
                node.game.lastBids[response.from] = bidWin;
            }
        });

        console.log('init');
    });

     // Event handler registered in the init function are always valid.
    stager.setOnGameOver(function() {
        console.log('************** GAMEOVER ' + gameRoom.name + ' ****************');

        // Saving all indexes.
        node.fs.saveMemoryIndexes('csv', DUMP_DIR_CSV);
        node.fs.saveMemoryIndexes('json', DUMP_DIR_JSON);

        // TODO: update database.
        channel.destroyGameRoom(gameRoom.name);
    });

    // Functions

    function precache() {
        console.log('Pre-Cache');
    }

    function instructions() {
        console.log('Instructions');
    }

    function quiz() {
        console.log('Quiz');
    }

    function ultimatum() {
        console.log('Ultimatum');
        doMatch();
    }

    function questionnaire() {
        console.log('questionnaire');
    }

    function endgame() {
        var code, exitcode, accesscode;
        var bonusFile, bonus;

        console.log('endgame');

        bonusFile = DUMP_DIR + 'bonus.csv';

        console.log('FINAL PAYOFF PER PLAYER');
        console.log('***********************');

        bonus = node.game.pl.map(function(p) {

            code = dk.codes.id.get(p.id);
            if (!code) {
                console.log('ERROR: no code in endgame:', p.id);
                return ['NA', 'NA'];
            }

            accesscode = code.AccessCode;
            exitcode = code.ExitCode;

            if (node.env('treatment') === 'pp' && node.game.gameTerminated) {
                code.win = 0;
            }
            else {
                code.win = Number((code.win || 0) / EXCHANGE_RATE).toFixed(2);
                code.win = parseFloat(code.win, 10);
            }
            dk.checkOut(accesscode, exitcode, code.win);

            node.say('WIN', p.id, {
                win: code.win,
                exitcode: code.ExitCode
            });

            console.log(p.id, ': ',  code.win, code.ExitCode);
            return [p.id, code.ExitCode, code.win, node.game.gameTerminated];
        });

        console.log('***********************');
        console.log('Game ended');

        // try {
        node.fs.writeCsv(bonusFile, bonus, {
            headers: ["access", "exit", "bonus", "terminated"]
        });
        // }
        // catch(e) {
        //    console.log('ERROR: could not save the bonus file: ',
        //                DUMP_DIR + 'bonus.csv');
        // }

        // Go to gameover.
        // Cannot be called now - it blocks the players too.
        // node.done();
    }

    function notEnoughPlayers() {
        console.log('Warning: not enough players!!');

        this.countdown = setTimeout(function() {
            console.log('Countdown fired. Going to Step: questionnaire.');
            node.remoteCommand('erase_buffer', 'ROOM');
            node.remoteCommand('resume', 'ROOM');
            node.game.gameTerminated = true;
            // if syncStepping = false
            //node.remoteCommand('goto_step', 5);
            node.game.gotoStep(new GameStage('5'));
        }, 30000);
    }

    // Set default step rule.
    stager.setDefaultStepRule(stepRules.OTHERS_SYNC_STEP);

    // Adding the stages. We can later on define the rules and order that
    // will determine their execution.
    stager.addStage({
        id: 'precache',
        cb: precache,
        minPlayers: [ MIN_PLAYERS, notEnoughPlayers ]
    });

    stager.addStage({
        id: 'instructions',
        cb: instructions,
        minPlayers: [ MIN_PLAYERS, notEnoughPlayers ]
    });

    stager.addStage({
        id: 'quiz',
        cb: quiz,
        minPlayers: [ MIN_PLAYERS, notEnoughPlayers ]
    });

    stager.addStage({
        id: 'ultimatum',
        cb: ultimatum,
        minPlayers: [ MIN_PLAYERS, notEnoughPlayers ]
    });

    stager.addStage({
        id: 'questionnaire',
        cb: questionnaire
    });

    stager.addStage({
        id: 'endgame',
        cb: endgame
    });

    // Building the game plot.

    // Here we define the sequence of stages of the game (game plot).
    stager
        .init()
        .next('precache')
        .next('instructions')
        .next('quiz')
        .repeat('ultimatum', REPEAT)
        .next('questionnaire')
        .next('endgame')
        .gameover();

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
        game_metadata: {
            name: 'ultimatum',
            version: '0.1.0'
        },
        game_settings: {
            // Will not publish any update of stage / stageLevel, etc.
            publishLevel: 0,
            // Will send a start / step command to ALL the clients when
            // the logic will start / step through the game.
            // This option requires that the game plots of the clients
            // and logic are symmetric or anyway compatible.
            syncStepping: true
        },
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),
        // If debug is false (default false), exception will be caught and
        // and printed to screen, and the game will continue.
        debug: settings.DEBUG,
        // Controls the amount of information printed to screen.
        verbosity: 0,
        // nodeGame enviroment variables.
        env: {
            auto: settings.AUTO
        }
    };

};
