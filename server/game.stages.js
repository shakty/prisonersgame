/**
 * # Stages of the Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

var ngc = require('nodegame-client');

module.exports = function(settings) {
    var stager = ngc.getStager();

    stager.init()
        .next('precache')
        .next('selectLanguage')
        .next('instructions')
        .next('quiz')
        .repeat('ultimatum', settings.REPEAT)
        .next('questionnaire')
        .next('endgame')
        .gameover();

  return stager.getState();
};
