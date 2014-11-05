/**
 * # Bot code for Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Code for a bot playing the ultimatum game randomly.
 * 
 * http://www.nodegame.org
 * ---
 */

var ngc = require('nodegame-client');
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var constants = ngc.constants;

// Export the game-creating function. It needs the name of the treatment and
// its options.
module.exports = function(gameRoom, treatmentName, settings, node) {

    var game;
    var MIN_PLAYERS;

    stager = new Stager();
    game = {};
    MIN_PLAYERS = settings.MIN_PLAYERS;

    // Import the stager.
    var gameSequence = require(__dirname + '/game.stages.js')(settings);
    var stager = ngc.getStager(gameSequence);

    // INIT and GAMEOVER

    stager.setOnInit(function() {
        var that = this;
        var waitingForPlayers;
        var treatment;
        var header;

        this.other = null;

        node.on('BID_DONE', function(offer, to) {
            node.set('offer', offer);
            node.say('OFFER', to, offer);
        });

        node.on('RESPONSE_DONE', function(response, offer, from) {
            node.info(response + ' ' + offer + ' ' + from);
            node.set('response', {
                response: response,
                value: offer,
                from: from
            });
            node.say(response, from, response);

            node.done();
        });

        this.randomAccept = function(offer, other) {
            var accepted;
            accepted = Math.round(Math.random());
            node.info('randomaccept');
            node.info(offer + ' ' + other);
            if (accepted) {
                node.emit('RESPONSE_DONE', 'ACCEPT', offer, other);
            }
            else {
                node.emit('RESPONSE_DONE', 'REJECT', offer, other);
            }
        };

        treatment = node.env('treatment');
    });

    ///// STAGES and STEPS

    function precache() {
        node.info('Precache');
        node.timer.randomEmit('DONE');
        //node.done();
    }

    function instructions() {
        node.info('Instructions');

        node.timer.randomEmit('DONE');
    }

    function quiz() {
        node.info('Quiz');
        node.done();
    }

    function ultimatum() {
        var that = this;

        var other;

        // Load the BIDDER interface.
        node.on.data('BIDDER', function(msg) {
            node.info('RECEIVED BIDDER!');
            other = msg.data.other;
            node.set('ROLE', 'BIDDER');
            
            setTimeout(function() {
                node.emit('BID_DONE',
                          Math.floor(1+Math.random()*100),
                          other);
            }, 2000);

            node.on.data('ACCEPT', function(msg) {
                node.info(' Your offer was accepted.');
                // node.timer.randomEmit('DONE', 3000);
                node.done();
            });

            node.on.data('REJECT', function(msg) {
                node.info(' Your offer was rejected.');
                // node.timer.randomEmit('DONE', 3000);
                node.done();
            });
        });

        // Load the respondent interface.
        node.on.data('RESPONDENT', function(msg) {
            node.info('RECEIVED RESPONDENT!');
            other = msg.data.other;
            node.set('ROLE', 'RESPONDENT');

            node.on.data('OFFER', function(msg) {
                that.randomAccept(msg.data, other);
            });
        });

        node.info('Ultimatum');
    }

    function postgame() {
        node.info('Postgame');
        node.done();
    }

    function endgame() {
        node.done();
        node.info('Game ended');
        // TODO: disconnect
    }

    // Add all the stages into the stager.
    stager.setDefaultStepRule(stepRules.WAIT);

    stager.extendStage('precache', {
        cb: precache
    });

    stager.extendStage('instructions', {
        cb: instructions
    });

    stager.extendStage('quiz', {
        cb: quiz
    });

    stager.extendStage('ultimatum', {
        cb: ultimatum
    });

    stager.extendStage('endgame', {
        cb: endgame
    });

    stager.extendStage('questionnaire', {
        cb: postgame
    });

    stager.extendStage('selectLanguage', {
        cb: function() { 
            console.log('selectLanguage');
            node.done();
        }
    });

    // We serialize the game sequence before sending it.
    game.plot = stager.getState();

    // Let's add the metadata information.
    game.metadata = {
        name: 'ultimatum_bot',
        version: '0.3.0',
        description: 'Bot randomly playing the ultimatum game'
    };

    // Other settings, optional.
    game.settings = {
        publishLevel: 2
    };

    game.env = {
        auto: settings.AUTO,
        treatment: treatmentName
    };

    game.verbosity = 0;
    game.debug = settings.DEBUG;
    game.nodename = 'bot';

    return game;
};
