/**
 * # Autoplay code for Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Handles bidding, and responds between two players automatically.
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
                id === 'respondent') {

                node.on('PLAYING', function() {
                    node.timer.randomExec(function() {
                        node.game.timer.doTimeUp();
                    });
                });
            }
            else if (id !== 'matching') {
                node.timer.randomDone(2000);
            }
        };
        return o;
    });

    game.plot = stager.getState();

    return game;
};


// function instructions() {
// 
//     ////////////////////////////////////////////////
//     // nodeGame hint:
//     //
//     // node.env executes a function conditionally to
//     // the environments defined in the configuration
//     // options.
//     //
//     // If the 'auto' environment was set to TRUE,
//     // then the function will be executed
//     //
//     ////////////////////////////////////////////////
//     node.env('auto', function() {
// 
//         //////////////////////////////////////////////
//         // nodeGame hint:
//         //
//         // Executes a node.done in a time interval
//         // from 0 to 2000 milliseconds
//         //
//         //////////////////////////////////////////////
//         node.timer.randomDone(2000);
//     });
//     console.log('Instructions');
// }


// BIDDER
//         node.env('auto', function() {
// 
//             //////////////////////////////////////////////
//             // nodeGame hint:
//             //
//             // Execute a function randomly
//             // in a time interval between 0 and 1 second
//             //
//             //////////////////////////////////////////////
//             node.timer.randomExec(function() {
//                 node.emit('BID_DONE',
//                           Math.floor(Math.random() * 101));
//             }, 4000);
//         });



//     node.env('auto', function() {
//         node.timer.randomExec(function() {
//             that.randomAccept();
//         }, 3000);
//     });


// function postgame() {
// 
//     node.env('auto', function() {
//         node.timer.randomExec(function() {
//             node.game.timer.doTimeUp();
//         });
//     });
// 
//     console.log('Postgame');
// }