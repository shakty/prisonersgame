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
module.exports = function(node, gameRoom, treatmentName, settings) {
    var stager;
    var game;
    var MIN_PLAYERS;

    stager = new Stager();
    game = {};
    MIN_PLAYERS = settings.MIN_PLAYERS;

    // GLOBALS

    game.globals = {};

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
            console.log(response, offer, from);
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
            console.log('randomaccept');
            console.log(offer + ' ' + other);
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
        console.log('Precache (bot)');
        node.timer.randomEmit('DONE');
        //node.done();
    }

    function instructions() {
        console.log('Instructions (bot)');

        node.timer.randomEmit('DONE');

        // node.timer.randomExec(function() {
        //     node.done();
        // });

        //node.done();
    }

    function quiz() {
        console.log('Quiz (bot)');
        node.done();
    }

    function ultimatum() {
        var that = this;

        var other;

        // Load the BIDDER interface.
        node.on.data('BIDDER', function(msg) {
            console.log('RECEIVED BIDDER!');
            other = msg.data.other;
            node.set('ROLE', 'BIDDER');
            
            setTimeout(function() {
                node.emit('BID_DONE',
                          Math.floor(1+Math.random()*100),
                          other);
            }, 2000);

//             node.timer.randomExec(function() {
//                 node.emit('BID_DONE',
//                           Math.floor(1+Math.random()*100),
//                           other);
//             }, 4000);

            node.on.data('ACCEPT', function(msg) {
                console.log(' Your offer was accepted.');
                // node.timer.randomEmit('DONE', 3000);
                node.done();
            });

            node.on.data('REJECT', function(msg) {
                console.log(' Your offer was rejected.');
                // node.timer.randomEmit('DONE', 3000);
                node.done();
            });
        });

        // Load the respondent interface.
        node.on.data('RESPONDENT', function(msg) {
            console.log('RECEIVED RESPONDENT!');
            other = msg.data.other;
            node.set('ROLE', 'RESPONDENT');

            node.on.data('OFFER', function(msg) {

                that.randomAccept(msg.data, other);

//                 node.timer.randomExec(function() {
//                     that.randomAccept(msg.data, other);
//                 }, 3000);
            });
        });

        console.log('Ultimatum (bot)');
    }

    function postgame() {
        node.done();
//         node.timer.randomExec(function() {
//             node.game.timer.doTimeUp();
//         });

        console.log('Postgame (bot)');
    }

    function endgame() {
        node.done();
        console.log('Game ended (bot)');
    }

    // Add all the stages into the stager.
    stager.setDefaultStepRule(stepRules.WAIT);

    stager.addStage({
        id: 'precache',
        cb: precache
    });

    stager.addStage({
        id: 'instructions',
        cb: instructions
    });

    stager.addStage({
        id: 'quiz',
        cb: quiz
    });

    stager.addStage({
        id: 'ultimatum',
        cb: ultimatum
    });

    stager.addStage({
        id: 'endgame',
        cb: endgame
    });

    stager.addStage({
        id: 'questionnaire',
        cb: postgame
    });

    // Now that all the stages have been added,
    // we can build the game plot

    stager.init()
        .next('precache')
        .next('instructions')
        .next('quiz')
        .repeat('ultimatum', settings.REPEAT)
        .next('questionnaire')
        .next('endgame')
        .gameover();

    // We serialize the game sequence before sending it.
    game.plot = stager.getState();

    // Let's add the metadata information.
    game.metadata = {
        name: 'ultimatum_bot',
        version: '0.2.0',
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
    game.nodename = 'bot2000';

    return game;
};
