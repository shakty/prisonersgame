/**
 * # Client code for Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Handles bidding, and responds between two players.
 * Extensively documented tutorial.
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
module.exports = function(gameRoom, treatmentName, settings) {
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

        console.log('INIT PLAYER GC!');

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

            //////////////////////////////////////////////
            // nodeGame hint:
            //
            // node.done() communicates to the server that
            // the player has completed the current state.
            //
            // What happens next depends on the game.
            // In this game the player will have to wait
            // until all the other players are also "done".
            //
            // This command is a shorthand for:
            //
            // node.emit('DONE');
            //
            /////////////////////////////////////////////
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

        this.isValidBid = function(n) {
            if (!n) return false;
            n = parseInt(n, 10);
            return !isNaN(n) && isFinite(n) && n >= 0 && n <= 100;
        };

        treatment = node.env('treatment');
    });

    ///// STAGES and STEPS

    function precache() {
        node.done();
    }

    function instructions() {
        console.log('Instructions');
        node.done();
    }

    function quiz() {
        console.log('Quiz');
        node.timer.randomExec(function() {
            node.game.timer.doTimeUp();
        });
    }

    function ultimatum() {
        var that = this;

        var other;

        // Load the BIDDER interface.
        node.on.data('BIDDER', function(msg) {
            console.log('RECEIVED BIDDER!');
            other = msg.data.other;
            node.set('ROLE', 'BIDDER');

            node.timer.randomExec(function() {
                node.emit('BID_DONE',
                          Math.floor(1+Math.random()*100),
                          other);
            }, 4000);

            node.on.data('ACCEPT', function(msg) {
                console.log(' Your offer was accepted.');
                node.timer.randomEmit('DONE', 3000);
            });

            node.on.data('REJECT', function(msg) {
                console.log(' Your offer was rejected.');
                node.timer.randomEmit('DONE', 3000);
            });
        });

        // Load the respondent interface.
        node.on.data('RESPONDENT', function(msg) {
            console.log('RECEIVED RESPONDENT!');
            other = msg.data.other;
            node.set('ROLE', 'RESPONDENT');

            node.on.data('OFFER', function(msg) {
                node.timer.randomExec(function() {
                    that.randomAccept(msg.data, other);
                }, 3000);
            });
        });

        console.log('Ultimatum');
    }

    function postgame() {
        node.timer.randomExec(function() {
            node.game.timer.doTimeUp();
        });

        console.log('Postgame');
    }

    function endgame() {
        console.log('Game ended');
    }

    function clearFrame() {
        node.emit('INPUT_DISABLE');
        // We save also the time to complete the step.
        node.set('timestep', {
            time: node.timer.getTimeSince('step'),
            timeup: node.game.timer.gameTimer.timeLeft <= 0
        });
        return true;
    }

    function notEnoughPlayers() {
        console.log('Not enough players');
        node.game.pause();
    }

    // Add all the stages into the stager.
    stager.setDefaultStepRule(stepRules.WAIT);

    stager.addStage({
        id: 'precache',
        cb: precache,
        minPlayers: [ MIN_PLAYERS, notEnoughPlayers ],
        done: clearFrame
    });

    stager.addStage({
        id: 'instructions',
        cb: instructions,
        minPlayers: [ MIN_PLAYERS, notEnoughPlayers ],
        timer: 90000,
        done: clearFrame
    });

    stager.addStage({
        id: 'quiz',
        cb: quiz,
        minPlayers: [ MIN_PLAYERS, notEnoughPlayers ],
        timer: 60000,
        done: function() {
            /*
            var b, QUIZ, answers, isTimeup;
            QUIZ = W.getFrameWindow().QUIZ;
            b = W.getElementById('submitQuiz');

            answers = QUIZ.checkAnswers(b);
            isTimeUp = node.game.timer.gameTimer.timeLeft <= 0;

            if (!answers.__correct__ && !isTimeUp) {
                return false;
            }

            answers.timeUp = isTimeUp;

            // On TimeUp there are no answers
            node.set('QUIZ', answers);
            node.emit('INPUT_DISABLE');
            // We save also the time to complete the step.
            node.set('timestep', {
                time: node.timer.getTimeSince('step'),
                timeup: isTimeUp
            });
            return true;
            */
        }
    });

    stager.addStage({
        id: 'ultimatum',
        cb: ultimatum,
        minPlayers: [ MIN_PLAYERS, notEnoughPlayers ],
        done: clearFrame
    });

    stager.addStage({
        id: 'endgame',
        cb: endgame,
        done: clearFrame
    });

    stager.addStage({
        id: 'questionnaire',
        cb: postgame,
        timer: 90000,
        done: function() {
            /*
            node.set('questionnaire', {
                q1: '',
                q2: 0
            });

            node.emit('INPUT_DISABLE');
            node.set('timestep', {
                time: node.timer.getTimeSince('step'),
                timeup: isTimeUp
            });
            return true;
            */
        }
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
        name: 'ultimatum',
        version: '0.1.0',
        description: 'no descr'
    };

    // Other settings, optional.
    game.settings = {
        publishLevel: 2
    };
    game.env = {
        auto: settings.AUTO,
        treatment: treatmentName
    };
    game.verbosity = 100;

    game.debug = settings.DEBUG;

    return game;
};
