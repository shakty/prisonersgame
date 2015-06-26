/**
 * # Game setup
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(settings, stages) {
    
    var game = {};

    // Metadata. Taken from package.json. Can be overwritten.    
    // game.metadata = {
    //    name: 'burdenSharingControl',
    //    version: '0.1.0',
    //    description: 'no descr'
    // };

    //auto: true = automatic run, auto: false = user input
    game.env = {
        auto: false
    };

    game.debug = true;

    game.verbosity = 1;

    game.window = {
        promptOnleave: !game.debug,
        disableRightClick: false
    }

    return game;
};
