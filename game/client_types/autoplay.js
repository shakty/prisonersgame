/**
 * # Autoplay code for Ultimatum Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;
    var ngc =  require('nodegame-client');

    var game, stager;

    game = gameRoom.getClientType('player');
    game.env.auto = true;
    game.nodename = 'autoplay';

    stager = ngc.getStager(game.plot);

    stager.extendAllSteps(function(o) {
        o._cb = o.cb;
        o.cb = function() {
            var _cb, stepObj, id;
            stepObj = this.getCurrentStepObj();
            _cb = stepObj._cb;
            _cb.call(this);
            id = stepObj.id

            if (id === 'quiz' ||
                id === 'questionnaire' || 
                id === 'bidder' ||
                id === 'respondent' ||
                id === 'mood') {

                node.on('PLAYING', function() {
                    node.timer.randomExec(function() {
                        node.game.timer.doTimeUp();
                    });
                });
            }
            else if (id !== 'matching' && id !== 'precache') {
                node.timer.randomDone(2000);
            }
        };
        return o;
    });

    game.plot = stager.getState();

    return game;
};