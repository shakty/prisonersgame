/**
 * # Stages of the Ultimatum Game
 * Copyright(c) 2016 Stefano Balietti
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
        .next('mood')
        .repeat('ultimatum', settings.REPEAT)
        .next('questionnaire')
        .next('endgame')
        .gameover();

    // Divide stage ultimatum in 3 steps.

    stager.extendStage('ultimatum', {
        steps: [
            'bidder',
            'respondent'
        ]
        // TODO: this needs to be valid (empty roles).
        // roles: [ 'BIDDER', 'RESPONDENT', 'SOLO' ]
    });

    // Can skip specific stages or steps here.

    // stager.skip('precache');
    // stager.skip('selectLanguage');
    // stager.skip('quiz');
    // stager.skip('instructions');
    // stager.skip('mood');
    // stager.skip('ultimatum')
};
