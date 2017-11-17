/**
 * # Bot code for prisoner Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Code for a bot playing the prisoner game randomly.
 * 
 * http://www.nodegame.org
 */

var ngc = require('nodegame-client');
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var constants = ngc.constants;

// Export the game-creating function.
module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var game;

    var channel = gameRoom.channel;
    var node = gameRoom.node;

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
            var _cb, stepObj, id;
            var decision = {choice: ""};
            // the player's most recent decision;
            
            // Get the previous step callback and execute it.
            stepObj = this.getCurrentStepObj();
            _cb = stepObj._cb;
            _cb.call(this);
            
            // Performs automatic play depending on the step.
            id = stepObj.id;
            
            node.on.data('results', function (msg) {
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
                // node.done({choice: decision.choice});
                node.done({choice: decision.choice});
            }
            else {
                node.timer.randomDone(2000);
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
