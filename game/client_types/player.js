/**
 * # Player code for Ultimatum Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * Handles bidding, and responds between two players.
 * Extensively documented tutorial.
 *
 * http://www.nodegame.org
 */

var ngc = require('nodegame-client');
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var constants = ngc.constants;

// Export the game-creating function.
module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var game, cbs;
    var channel = gameRoom.channel;
    var node = gameRoom.node;

    var timers = settings.TIMER;

    // The game object to return at the end of the function.
    game = {};

    // Import other functions used in the game.
    cbs = require(__dirname + '/includes/player.callbacks.js');

    // Specify init function, and extend default stages.

    // Init callback.
    stager.setOnInit(cbs.init);

    stager.setOnGameOver(function() {
        // Do something if you like!
    });

    ////////////////////////////////////////////////////////////
    // nodeGame hint: step propreties.
    //
    // A step is a set of properties under a common label (id),
    // i.e. the id of the step.
    //
    // Properties can be defined at multiple levels, and those defined
    // at higher levels are inherited by each nested step, that in
    // turn can overwrite them.
    //
    // For example, if a step is missing a property, it will be looked
    // into the enclosing stage. If it is not defined in the stage,
    // the value set with _setDefaultProperties()_ will be used. If
    // still not found, it will fallback to nodeGame defaults.
    //
    // The property named `cb` is one of the most important.
    //
    // It defines the callback that will be called during the
    // step. By default, each steps inherits an empty callback,
    // so that it is not necessary to implement one, if the
    // player has, for example, just to read a text.
    //
    // Another important property is `stepRule`
    //
    // A step rule is a function deciding what to do when a player has
    // terminated a step and entered the stage level _DONE_.
    //
    // Some of the available step rules are:
    //
    //  - 'SOLO': advances through the steps freely
    //  - 'WAIT': wait for a command from server to go to
    //            next step (Default)
    //
    // To add/modify properties use the commands:
    //
    // `stager.extendStep`: modifies a step
    // `stager.extendStage`: modifies a stage, and all enclosed steps
    // `stager.setDefaultProperty`: modifies all stages and steps
    //
    ////////////////////////////////////////////////////////////

    stager.extendStep('selectLanguage', {
        // Option passed to W.loadFrame (only if executed in the browser).
        frame: 'languageSelection.html',
        cb: cbs.selectLanguage,
        done: function() {
            // The chosen language prefix will be
            // added automatically to every call to W.loadFrame().
            if (node.player.lang.name !== 'English') {
                W.setUriPrefix(node.player.lang.path);
                node.say('mylang', 'SERVER', node.player.lang);
            }
        }
    });

    stager.extendStep('precache', {
        cb: cbs.precache
    });

    stager.extendStep('instructions', {
        frame: settings.instructionsPage
    });

    stager.extendStep('quiz', {
        frame: 'quiz.html',
        // Disable the donebutton widget for this step.
        donebutton: false,
        done: function() {
            var b, QUIZ, answers, isTimeup;

            QUIZ = W.getFrameWindow().QUIZ;
            b = W.getElementById('submitQuiz');

            answers = QUIZ.checkAnswers(b);
            isTimeup = node.game.timer.isTimeup();

            if (!answers.__correct__ && !isTimeup) {
                return false;
            }

            answers.quiz = true;

            // On TimeUp there are no answers.

            node.emit('INPUT_DISABLE');

            return answers;
        }
    });

    stager.extendStage('ultimatum', {
        // Disable the donebutton for this step.
        donebutton: false,
        init: function() {
            node.game.rounds.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL',
                                             'COUNT_UP_ROUNDS_TO_TOTAL']);

            // Hack to avoid double offers. Todo: fix.
            node.game.offerDone = false;

            node.game.role = null;
            node.game.other = null;

            node.game.offerReceived = null;
        }
        // `syncOnLoaded` forces the clients to wait for all the others to be
        // fully loaded before releasing the control of the screen to the
        // players.  This options introduces a little overhead in
        // communications and delay in the execution of a stage. It is probably
        // not necessary in local networks, and it is FALSE by default.
        // syncOnLoaded: true
    });

    stager.extendStep('bidder', {
        timeup: function() {
            if (this.role === 'BIDDER') node.game.bidTimeup();
            //else node.done();
        },
        cb: cbs.bidder
    });

    stager.extendStep('respondent', {
        timeup: function() {
            // debugger
            if (this.role !== 'BIDDER') node.game.resTimeup();
            // else node.done();
        },
        cb: cbs.respondent
    });

    stager.extendStep('matching', {
        cb: cbs.matching
    });

    stager.extendStep('endgame', {
        frame: 'ended.html',
        cb: cbs.endgame,
        donebutton: false
    });

    stager.extendStep('questionnaire', {
        init: function() {
            node.game.rounds.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL']);
        },
        frame: 'postgame.html',
        // `done` is a callback function that is executed as soon as a
        // _DONE_ event is emitted. It can perform clean-up operations (such
        // as disabling all the forms) and only if it returns true, the
        // client will enter the _DONE_ stage level, and the step rule
        // will be evaluated.
        done: function() {
            var q1, q2, q2checked, i, isTimeup;
            q1 = W.getElementById('comment').value;
            q2 = W.getElementById('disconnect_form');
            q2checked = -1;

            for (i = 0; i < q2.length; i++) {
                if (q2[i].checked) {
                    q2checked = i;
                    break;
                }
            }

            isTimeup = node.game.timer.isTimeup();

            // If there is still some time left, let's ask the player
            // to complete at least the second question.
            if (q2checked === -1 && !isTimeup) {
                alert('Please answer Question 2');
                return false;
            }

            node.emit('INPUT_DISABLE');

            return {
                questionnaire: true,
                q1: q1 || '',
                q2: q2checked
            };
        }
    });

    // We serialize the game sequence before sending it.
    game.plot = stager.getState();

    // Other settings, optional.

    game.env = {
        auto: settings.AUTO,
        treatment: treatmentName
    };
    game.verbosity = 1000;

    game.debug = settings.DEBUG;
    game.nodename = 'player';

    return game;
};
