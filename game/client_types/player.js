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

    var cbs;
    var channel = gameRoom.channel;
    var node = gameRoom.node;

    // Import other functions used in the game.
    cbs = require(__dirname + '/includes/player.callbacks.js');

    // Specify init function, and extend steps.

    // Init callback.
    stager.setOnInit(cbs.init);

    stager.extendStep('instructions', {
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
            };
            defectBtn.onclick = function() {
                node.done({ choice: 'DEFECT' });
            };

        },
        frame: "prisoner.html",
        timeup: function() {
            var id, button;
            if (Math.random() > 0.5) {
                id = "cooperateBtn";
            }
            else {
                id = "defectBtn";
            }
            button = W.getElementById(id);
            button.click();
        }
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
