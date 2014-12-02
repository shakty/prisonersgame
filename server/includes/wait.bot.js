/**
 * # Antechamber for Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Displays a simple waiting page for clients about to start a game.
 */

var ngc = module.parent.exports.ngc;
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var constants = ngc.constants;

module.exports = function() {
    var stager = new Stager();
    var game = {};

    // Functions

    function waiting2start() {
    }

    // Setting the game plot

    stager.addStage({
        id: 'waiting2start',
        cb: waiting2start,
        steprule: stepRules.WAIT
    });

    stager.init()
        .next('waiting2start');


    // Exporting the data.

    game.plot = stager.getState();

    game.metadata = {
        name: 'Waiting 2 Start - Client',
        description: 'Presents a simple interface while the client waits to start a game.',
        version: '0.1'
    };

    game.nodename = 'bot_wait';

    return game;
};
