/**
 * # Logic code for Ultimatum Game
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * Handles bidding, and responds between two players.
 *
 * http://www.nodegame.org
 */

var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var J = ngc.JSUS;

// Variable registered outside of the export function
// are shared among all instances of game logics.
var counter = 0;

// Flag to not cache required files.
var nocache = true;

// Here we export the logic function. Receives three parameters:
// - node: the NodeGameClient object.
// - channel: the ServerChannel object in which this logic will be running.
// - gameRoom: the GameRoom object in which this logic will be running.
module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;

    // Increment counter.
    counter = counter ? ++counter : settings.SESSION_ID;

    // Import other functions used in the game.
    // Some objects are shared.
    var cbs = channel.require(__dirname + '/includes/logic.callbacks.js', {
        node: node,
        gameRoom: gameRoom,
        settings: settings,
        counter: counter
        // Reference to channel added by default.
    }, nocache);

    // Event handler registered in the init function are always valid.
    stager.setOnInit(cbs.init);

    // Event handler registered in the init function are always valid.
    stager.setOnGameOver(cbs.gameover);

    // Extending default stages.

    stager.setDefaultProperty('minPlayers', [
        settings.MIN_PLAYERS,
        cbs.notEnoughPlayers
    ]);

    stager.setDefaultCallback(function() {});

    stager.extendStep('selectLanguage', {
        cb: function() {
            // Storing the language setting.
            node.on.data('mylang', function(msg) {
                if (msg.data && msg.data.name !== 'English') {
                    channel.registry.updateClient(msg.from, { lang: msg.data });
                }
            });
        }
    });

    stager.extendStep('ultimatum', {
        cb: function() {
            this.node.log('Ultimatum');
            cbs.doMatch();
        }
    });

    stager.extendStep('endgame', {
        cb: cbs.endgame,
        minPlayers: undefined,
        steprule: stepRules.SOLO
    });

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
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
