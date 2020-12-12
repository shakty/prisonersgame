/**
 * # Bot code for prisoner Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Code for a bot playing the prisoner game randomly.
 *
 * http://www.nodegame.org
 */

const ngc = require('nodegame-client');
const Stager = ngc.Stager;
const stepRules = ngc.stepRules;
const constants = ngc.constants;

// Export the game-creating function.
module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    let game;

    let channel = gameRoom.channel;
    let node = gameRoom.node;

    // Import other functions used in the game.
    ///////////////////////////////////////////

    cbs = require(__dirname + '/includes/bot.callbacks.js');

    // Specify init function, and extend default stages.
    ////////////////////////////////////////////////////

    stager.setOnInit(cbs.init);

    // Set the default step rule for all the stages.
    stager.setDefaultStepRule(stepRules.WAIT);

    stager.extendAllSteps(function(o) {

        // Store a reference to previous step callback.
        o._cb = o.cb;
        // Create a new step callback.
        o.cb = function() {
            let _cb, stepObj, id;
            let decision = {choice: ""};
            // the player's most recent decision;

            // Get the previous step callback and execute it.
            stepObj = this.getCurrentStepObj();
            _cb = stepObj._cb;
            _cb.call(this);

            // Performs automatic play depending on the step.
            id = stepObj.id;
            console.log('BOT step: ' + id);
            this.node.on.data('results', function (msg) {
                this.lastDecision = msg.data.otherChoice;
            });

            if (id === 'respond') {
                if (this.settings.BOTTYPE === 'titfortat') {
                    // LAST OPPONENT DECISION  |   NEW DECISION
                    // COOPERATE               |   COOPERATE
                    // DEFECT                  |   DEFECT
                    decision.choice = this.lastDecision;
                }
                if (this.settings.BOTTYPE === 'invertlast') {
                    // LAST OPPONENT DECISION  |   NEW DECISION
                    // COOPERATE               |   DEFECT
                    // DEFECT                  |   COOPERATE
                    this.strategy = {
                        'COOPERATE': 'DEFECT',
                        'DEFECT' : 'COOPERATE'
                    };
                    decision.choice = this.strategy[this.lastDecision];
                }
                if (this.settings.BOTTYPE === 'random' || !this.lastDecision) {
                    decision.choice = Math.random() > 0.5 ?
                                      'COOPERATE' : 'DEFECT';
                }
                this.node.done({choice: decision.choice});
            }
            else {
                this.node.timer.random(2000).done();
            }
        };

        // Return the extended step.
        return o;
    });

    // Prepare the game object to return.
    /////////////////////////////////////

    game = {};

    // We serialize the game sequence before sending it.
    game.plot = stager.getState();

    // Let's add the metadata information.
    game.metadata = {
        name: 'prisoner_bot',
        version: '0.4.0',
        description: 'Bot playing the prisoner game by repeating the ' +
                     'actions of the player.'
    };

    game.nodename = 'bot';

    return game;
};
