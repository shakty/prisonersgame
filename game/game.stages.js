/**
 * # Stages of the Ultimatum Game
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = function(stager, settings) {

    stager
        .next('precache')
        .next('selectLanguage')
        .next('instructions')
        .next('quiz')
        .repeat('ultimatum', settings.REPEAT)
        .next('questionnaire')
        .next('endgame')
        .gameover();

    stager.extendStage('ultimatum', {
        steps: [
            'matching',
            'bidder',
            'respondent'
        ]
    });

    stager.skip('precache');
    stager.skip('selectLanguage');
    stager.skip('quiz');
    // stager.skip('instructions');
};
