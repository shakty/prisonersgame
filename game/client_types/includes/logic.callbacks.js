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

    // Create matcher and matches.
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

    // If players disconnects and then re-connects within the same round
    // we need to take into account only the final bids within that round.
    this.lastBids = {};

    // "STEPPING" is the last event emitted before the stage is updated.
    node.on('STEPPING', function() {
        var currentStage, db, p, gain, prefix;

        currentStage = node.game.getCurrentGameStage();

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
    node.game.gotoStep('questionnaire');
}

function reconnectUltimatum(p, reconOptions) {
    var offer, matches, other, role, bidder;
    // Get all current matches.
    matches = node.game.matcher.getMatchObject(0);
    other = matches[p.id];
    role = node.game.roleMapper[p.id];

    if (!reconOptions.plot) reconOptions.plot = {};
    reconOptions.role = role;
    reconOptions.other = other;

    if (node.player.stage.step === 3 && role !== 'SOLO') {
        bidder = role === 'RESPONDENT' ? other : p.id;
        offer = node.game.memory.stage[node.game.getPreviousStep()]
            .select('player', '=', bidder).first();
        if (!offer || 'number' !== typeof offer.offer) {
            // Set it to zero for now.
            node.err('ReconnectUltimatum: could not find offer for: ' + p.id);
            offer = 0;
        }
        else {
            offer = offer.offer;
        }

        // Store reference to last offer in game.
        reconOptions.offer = offer;
    }

    // Respondent on respondent stage must get back offer.
    if (role === 'RESPONDENT') {
        reconOptions.cb = function(options) {
            this.plot.tmpCache('frame', 'resp.html');
            this.role = options.role;
            this.other = options.other;
            this.offerReceived = options.offer;
        };
    }

    else if (role === 'BIDDER') {
        reconOptions.cb = function(options) {
            this.plot.tmpCache('frame', 'bidder.html');
            this.role = options.role;
            this.other = options.other;
            if (this.node.player.stage.step === 3) {
                this.lastOffer = options.offer;
                this.node.on('LOADED', function() {
                    this.node.emit('BID_DONE', this.lastOffer, false);
                });
            }
        };        
    }

    else if (role === 'SOLO') {
        reconOptions.cb = function(options) {
            this.plot.tmpCache('frame', 'solo.html');
            this.role = options.role;
        };
    }
}