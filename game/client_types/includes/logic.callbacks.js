/**
 * # Functions used by the client of Ultimatum Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

var ngc = require('nodegame-client');
var GameStage = ngc.GameStage;
var J = ngc.JSUS;
var path = require('path');
var fs = require('fs');
var Matcher = ngc.Matcher;
var DUMP_DIR, DUMP_DIR_JSON, DUMP_DIR_CSV;

module.exports = {
    init: init,
    gameover: gameover,
    doMatch: doMatch,
    endgame: endgame,
    notEnoughPlayers: notEnoughPlayers,
    enoughPlayersAgain: enoughPlayersAgain,
    reconnectUltimatum: reconnectUltimatum
};

var node = module.parent.exports.node;
var channel = module.parent.exports.channel;
var gameRoom = module.parent.exports.gameRoom;
var settings = module.parent.exports.settings;
var counter = module.parent.exports.counter;

function init() {
    DUMP_DIR = path.resolve(channel.getGameDir(), 'data') + '/' + counter + '/';
    
    J.mkdirSyncRecursive(DUMP_DIR, 0777);

    console.log('********************** ultimatum room ' + counter++ +
                ' **********************');

    this.matcher = new Matcher();
    this.matcher.generateMatches('random', node.game.pl.size());
    this.matcher.setIds(node.game.pl.id.getAllKeys());

    this.roles = {
        RESPONDENT: 0,
        BIDDER: 1,
        SOLO: -1
    };

    this.roleMapper = {};

    this.lastStage = this.getCurrentGameStage();

    this.gameTerminated = false;

    this.disconnectStr = 'One or more players disconnected. If they ' +
        'do not reconnect within ' + settings.WAIT_TIME  +
        ' seconds the game will be terminated.';

    // If players disconnects and then re-connects within the same round
    // we need to take into account only the final bids within that round.
    this.lastBids = {};

    // "STEPPING" is the last event emitted before the stage is updated.
    node.on('STEPPING', function() {
        var currentStage, db, p, gain, prefix;

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
                code = channel.registry.getClient(p);
                
                gain = node.game.lastBids[p];
                if (gain) {
                    code.win = !code.win ? gain : code.win + gain;
                    console.log('Added to ' + p + ' ' + gain + ' ECU');
                }
            }
        }

        db = node.game.memory.stage[currentStage];

        if (db && db.size()) {

            prefix = DUMP_DIR + 'memory_' + currentStage;
            db.save(prefix + '.csv', { flags: 'w' }); 
            db.save(prefix + '.nddb', { flags: 'w' }); 

            console.log('Round data saved ', currentStage);
        }

        // Resets last bids;
        node.game.lastBids = {};
    });

    // Add session name to data in DB.
    this.memory.on('insert', function(o) {
        o.session = node.nodename;
    });

    // Register player disconnection, and wait for him...
    node.on.pdisconnect(function(p) {
        var code;
        console.log('Disconnection in Stage: ' + node.player.stage);
        code = channel.registry.getClient(p.id);
        // Time left. Notice that node.game.timer might not be updated
        // if update = milliseconds, therefore we need to compute time again.
        code.timerAtDisconnect = node.game.timer.milliseconds -
            node.timer.getTimeSince('step');
    });

    // Player reconnecting.
    // Reconnections must be handled by the game developer.
    node.on.preconnect(function(p) {
        var code, curStage, reconCb, res;

        console.log('Oh...somebody reconnected!', p);
        code = channel.registry.getClient(p.id);

        // Only within stage reconnections are allowed.
        curStage = node.game.getCurrentGameStage();
        if (GameStage.compare(code.stage, curStage)) {
            node.warn('player reconnected from another stage. ' +
                      'Not allowed. Player: ' + p.id);
            return;
        }

        gameRoom.setupClient(p.id);

        // Clear any message in the buffer from.
        node.remoteCommand('erase_buffer', 'ROOM');

        if (code.lang.name !== 'English') {
            // If lang is different from Eng, remote setup it.
            // TRUE: sets also the URI prefix.
            console.log('CODE LANG SENT');
            node.remoteSetup('lang', p.id, [code.lang, true]);
        }

        // Start the game on the reconnecting client.
        // Need to give step: false, because otherwise pre-caching will
        // call done() on reconnecting stage.
        node.remoteCommand('start', p.id, { step: false } );

        reconCb = this.plot.getProperty(node.player.stage, 'reconnect');

        if (reconCb) {
            res = reconCb.call(this, code);
            if (res === false) {
                node.warn('Reconnect Cb returned false');
                return;
            }
        }
        
        // It is not added automatically.
        // TODO: add it automatically if we return TRUE? It must be done
        // both in the alias and the real event handler.
        node.game.pl.add(p);

        // See if we have enough players now.
        node.game.plChangeHandler();

        // Start the step on reconnecting client.
        node.remoteCommand('goto_step', p.id, node.player.stage);

        setTimeout(function() {
            
            // Do we need delay?
            node.remoteSetup('timer', p.id, {
                options: { 
                    milliseconds: code.timerAtDisconnect,
                    update: code.timerAtDisconnect
                },
                action: 'restart'
            });
            // Do we need delay?
            node.remoteSetup('timer', p.id, {
                name: 'vt',
                options: {
                    milliseconds: code.timerAtDisconnect
                },
                action: 'restart'
            });


        }, 1000);

        // TODO: commented out.
        // Will send all the players to current stage
        // (also those who were there already).
        // node.game.gotoStep(node.player.stage);

        setTimeout(function() {          
            node.game.pl.each(function(player) {
                if (player.id !== p.id) {
                    node.remoteCommand('resume', player.id);
                }
            });
        }, 100);
    });

    // Update the Payoffs
    node.on.data('response', function(msg) {
        var resWin, bidWin, code, response;
        response = msg.data;

        if (response.response === 'ACCEPT') {
            resWin = parseInt(response.value, 10);
            bidWin = settings.COINS - resWin;

            // Save the results in a temporary variables. If the round
            // finishes without a disconnection we will add them to the
            // database.
            node.game.lastBids[msg.from] = resWin;
            node.game.lastBids[response.from] = bidWin;
        }
    });

    // Logging errors from remote clients to console.
    node.on('in.say.LOG', function(msg) {
        if (msg.text === 'error' && msg.stage.stage) {
            console.log('Error from client: ', msg.from);
            console.log('Error msg: ', msg.data);
        }
    });

    console.log('init');
}

function gameover() {
    console.log('************** GAMEOVER ' + gameRoom.name + ' ****************');

    // TODO: fix this.
    // channel.destroyGameRoom(gameRoom.name);
}

function doMatch() {
    var match, id1, id2, soloId;
    
    // Generates new random matches for this round.
    node.game.matcher.match(true)
    match = node.game.matcher.getMatch();

    // Resets all roles.
    node.game.roleMapper = {};

    // While we have matches, send them to clients.
    while (match) {
        id1 = match[node.game.roles.BIDDER];
        id2 = match[node.game.roles.RESPONDENT];
        if (id1 !== 'bot' && id2 !== 'bot') {
            node.say('ROLE', id1, {
                role: 'BIDDER',
                other: id2
            });
            node.say('ROLE', id2, {
                role: 'RESPONDENT',
                other: id1
            });
            node.game.roleMapper[id1] = 'BIDDER';
            node.game.roleMapper[id2] = 'RESPONDENT';
        }
        else {
            soloId = id1 === 'bot' ? id2 : id1;
            node.say('ROLE', soloId, {
                role: 'SOLO',
                other: null
            });
            node.game.roleMapper[soloId] = 'SOLO';

        }
        match = node.game.matcher.getMatch();
    }
    console.log('Matching completed.');
}

function endgame() {
    var code, exitcode, accesscode;
    var filename, bonusFile, bonus;
    var EXCHANGE_RATE;

    EXCHANGE_RATE = settings.EXCHANGE_RATE_INSTRUCTIONS / settings.COINS;;

    console.log('FINAL PAYOFF PER PLAYER');
    console.log('***********************');

    bonus = node.game.pl.map(function(p) {

        code = channel.registry.getClient(p.id);
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
            code.win = Number((code.win || 0) * (EXCHANGE_RATE)).toFixed(2);
            code.win = parseFloat(code.win, 10);
        }
        channel.registry.checkOut(p.id);

        node.say('WIN', p.id, {
            win: code.win,
            exitcode: code.ExitCode
        });

        console.log(p.id, ': ',  code.win, code.ExitCode);
        return [p.id, code.ExitCode || 'na', code.win,
                node.game.gameTerminated];
    });

    console.log('***********************');
    console.log('Game ended');

    // Write down bonus file.
    filename = DUMP_DIR + 'bonus.csv';
    bonusFile = fs.createWriteStream(filename);
    bonusFile.on('error', function(err) {
        console.log('Error while saving bonus file: ', err);
    });
    bonusFile.write(["access", "exit", "bonus", "terminated"].join(', ') + '\n');
    bonus.forEach(function(v) {
        bonusFile.write(v.join(', ') + '\n'); 
    });
    bonusFile.end();

    // Dump all memory.
    node.game.memory.save(DUMP_DIR + 'memory_all.json');

    node.done();
}


function notEnoughPlayers() {
    console.log('Warning: not enough players!!');
    // Pause connected players.
    node.remoteCommand('pause', 'ROOM', this.disconnectStr);
    node.game.timer.pause();
    this.countdown = setTimeout(function() {
        console.log('Countdown fired. Going to Step: questionnaire.');
        node.remoteCommand('erase_buffer', 'ROOM');
        node.remoteCommand('resume', 'ROOM');
        node.game.gameTerminated = true;
        // if syncStepping = false
        // node.remoteCommand('goto_step', 5);
        // Step must be not-skipped if you give the id (else give a number).
        node.game.gotoStep('questionnaire');
    }, settings.WAIT_TIME * 1000);
}

function enoughPlayersAgain() {
    // Delete countdown to terminate the game.
    console.log('Enough players again!');
    clearTimeout(this.countdown);
    node.game.timer.resume();
}

function reconnectUltimatum(p) {
    var offer, matches, other, role;
    // Get all current matches.
    matches = node.game.matcher.getMatchObject(0);
    other = matches[p.id];
    role = node.game.roleMapper[p.id]
    node.say('ROLE', p.id, {
        role: role,
        other: other
    });
    // Respondent on respondent stage must get back offer.
    if (role === 'RESPONDENT' && node.player.stage.step === 3) {
        offer = node.game.memory.stage[node.game.getPreviousStep()]
            .select('player', '=', other).first();

        if (!offer) {
            // Set it to zero for now.
            offer = 0;
            node.err('ReconnectUltimatum: could not find offer ' +
                     'for respondent: ' + p.id);
        }
        else {
            offer = offer.offer;
        }

        // Send the offer.
        node.say('OFFER', p.id, offer); 
    }
}