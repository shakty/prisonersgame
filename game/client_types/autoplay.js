/**
 * # Autoplay code for prisoner Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    const channel = gameRoom.channel;
    const node = gameRoom.node;
    const ngc = require('nodegame-client');

    let game, stager;

    game = gameRoom.getClientType('player');
    game.nodename = 'autoplay';

    stager = ngc.getStager(game.plot);

    stager.extendAllSteps(function(o) {
        o._cb = o.cb;
        o.cb = function() {
            let _cb, stepObj, id;
            stepObj = this.getCurrentStepObj();
            id = stepObj.id;

            _cb = stepObj._cb;
            _cb.call(this);

            if (id === 'respond') {
                node.on('PLAYING', function() {
                    node.timer.random.exec(function() {
                        node.game.timer.doTimeUp();
                    });
                });
            }
            else if (id !== 'precache' || id !== 'endgame') {
                node.timer.random(2000).done();
            }
        };

        return o;
    });

    game.plot = stager.getState();

    return game;
};
