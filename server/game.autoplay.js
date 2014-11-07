/**
 * # Autoplay code for Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Handles bidding, and responds between two players automatically.
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(gameRoom, treatmentName, settings) {
    var game;

    game = require(__dirname + '/game.client.js')
        (gameRoom, treatmentName, settings);
    game.env.auto = true;
    game.nodename = 'autoplay';

    return game;
};
