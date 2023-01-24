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

const ngc = require('nodegame-client');
const path = require('path');

// Export the game-creating function.
module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    let channel = gameRoom.channel;
    let node = gameRoom.node;

    // Import other functions used in the game.
    let cbs = require(path.join(__dirname, 'includes', 'player.callbacks.js'));

    // Specify init function, and extend steps.

    // Init callback.
    stager.setOnInit(cbs.init);

    stager.extendStage('prisoner', {
        timer: 30000
    });


    stager.extendStep('instructions', {
        frame: 'instructions.html'
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

            cooperateBtn = W.gid('cooperateBtn');
            defectBtn = W.gid('defectBtn');
            cooperateBtn.onclick = function() {
                node.done({ choice: 'COOPERATE' });
            };
            defectBtn.onclick = function() {
                node.done({ choice: 'DEFECT' });
            };

        },
        frame: "prisoner.html",
        timeup: function() {
            var id;
            if (Math.random() > 0.5) id = "cooperateBtn";
            else id = "defectBtn";
            W.gid(id).click();
        }
    });

    stager.extendStep('results', {
        donebutton: true,
        frame: "results.html",
        init: function() {
            node.game.rounds.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL',
                                             'COUNT_UP_ROUNDS_TO_TOTAL']);
        },
        cb: function() {
            var myEarning, otherEarning, myBank, otherChoice;
            var progressBar;
            node.on.data('results', function(msg) {
                // Too early, results's page is not there yet.
                progressBar = W.gid('progressBar');
                var barValue = 100 * node.game.rounds.curRound / node.game.rounds.totRound;
                progressBar.setAttribute("aria-valuenow", barValue);
                progressBar.style.width = barValue + "%";
                myEarning = msg.data.myEarning;
                W.setInnerHTML('myearning', myEarning);
                otherEarning = msg.data.otherEarning;
                W.setInnerHTML('otherearning', otherEarning);
                myBank = msg.data.myBank;
                W.setInnerHTML('mybank', myBank);
                otherChoice = msg.data.otherChoice;
                if (otherChoice) {
                    W.setInnerHTML('otherchoice', otherChoice);
                }
            });
        }
    });

    stager.extendStep('endgame', {
        widget: {
            name: 'EndScreen',
            showEmailForm: true,
            email: {
                texts: {
                    label: 'Enter your email (optional):'
                }
            },
            feedback: { minLength: 50 }
        },
        donebutton: false
    });
};
