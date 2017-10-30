/**
 * # Stages of the Prisoner Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = function(stager, settings) {

    stager
        .next('instructions')
        //.next('quiz')
        .repeat('prisoner', settings.REPEAT)
        .next('endgame')
        .gameover();

    // Divide stage prisoner in 3 steps.

   stager.extendStage('prisoner', {
        steps: [
            'respond',
            'results'
        ]
    }); 

    // Can skip specific stages or steps here.

    // stager.skip('precache');
    // stager.skip('selectLanguage');
    // stager.skip('quiz');
    // stager.skip('instructions');
    // stager.skip('mood');
    // stager.skip('prisoner')
};
