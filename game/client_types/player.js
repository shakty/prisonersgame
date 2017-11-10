/**
 * # Player code for prisoner Game
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * Handles biddings, and responses between two players.
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

    // The game object to return at the end of the function.
    game = {};

    // Import other functions used in the game.
    cbs = require(__dirname + '/includes/player.callbacks.js');

    // Specify init function, and extend steps.

    // Init callback.
    stager.setOnInit(cbs.init);

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

    stager.extendStep('instructions', {
        /////////////////////////////////////////////////////////////
        // nodeGame hint: the settings object
        //
        // The settings object is automatically populated with the
        // settings specified for the treatment chosen by the waiting
        // room. The settings is sent to each remote client and it is
        // available under: `node.game.settings`.
        frame: 'instructions.html'
    });

    stager.extendStage('prisoner', {
        timer: 30000
    });


    stager.extendStep('respond', {
        donebutton: false,
        init: function() {
            node.game.rounds.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL',
                                             'COUNT_UP_ROUNDS_TO_TOTAL']);
        },
        cb: function() {
            // button options
            var cooperateBtn, defectBtn;

            cooperateBtn = W.getElementById('cooperateBtn');
            defectBtn = W.getElementById('defectBtn');
            cooperateBtn.onclick = function() {
                node.done({ choice: 'COOPERATE' });
            }
            defectBtn.onclick = function() {
                node.done({ choice: 'DEFECT' });
            }

        },
        frame: "prisoner.html"
    });

    stager.extendStep('results', {
        donebutton: true,
        init: function() {
            node.game.rounds.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL',
                                             'COUNT_UP_ROUNDS_TO_TOTAL']);
        },
        cb: function() {
            var myEarning, otherEarning, myBank;
            node.on.data('myEarning', function(msg) {
                myEarning = msg.data;
                W.setInnerHTML('myearning', myEarning);
            });
            node.on.data('otherEarning', function(msg) {
                otherEarning = msg.data;
                W.setInnerHTML('otherearning', otherEarning);
            });
            node.on.data('myBank', function(msg) {
                myBank = msg.data;
                W.setInnerHTML('mybank', myBank);
            });
        },
        frame: "results.html"
    });

    stager.extendStep('endgame', {
        // Another widget-step (see the mood step above).
        widget: {
            name: 'EndScreen',
            root: 'container',
            options: {
                panel: false,
                title: false,
                showEmailForm: true,
                email: { errString: 'Please enter a valid email and retry' },
                feedback: { minLength: 50 }
            }
        },
        donebutton: false
    });
};
