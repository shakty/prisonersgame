/**
 * # Functions used by the client of Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */


module.exports = {

    precache: precache,
    selectLanguage: selectLanguage,
    instructions: instructions,
    quiz: quiz,
    ultimatum: ultimatum,
    postgame: postgame,
    endgame: endgame,
    clearFrame: clearFrame,
    notEnoughPlayers: notEnoughPlayers

};


//////////////////////////////////////////////
// nodeGame hint:
//
// Pages can be preloaded with this method:
//
// W.preCache()
//
// It loads the content from the URIs given in an array parameter, and the
// next time W.loadFrame() is used with those pages, they can be loaded
// from memory.
//
// W.preCache calls the function given as the second parameter when it's
// done.
//
/////////////////////////////////////////////
function precache() {
    var langPath = node.player.lang.path;
    W.lockScreen('Loading...');
    node.done();
    return;
    // preCache is broken.
    W.preCache([
        '/ultimatum/' + langPath + node.game.instructionsPage,
        '/ultimatum/' + langPath + 'quiz.html',
        //'/ultimatum/' + langPath + 'bidder.html',  // these two are cached by following
        //'/ultimatum/' + langPath + 'resp.html',    // loadFrame calls (for demonstration)
        '/ultimatum/' + langPath + 'postgame.html',
        '/ultimatum/' + langPath + 'ended.html'
    ], function() {
        console.log('Precache done.');
        // Pre-Caching done; proceed to the next stage.
        node.done();
    });
}

function selectLanguage() {
    W.loadFrame('/ultimatum/languageSelection.html', function() {
        var b = W.getElement('input', 'done', {
            type: "button", value: "Choice Made",
            className: "btn btn-lg btn-primary"
        });

        node.game.lang = node.widgets.append('LanguageSelector',
                                             W.getFrameDocument().body);
        W.getFrameDocument().body.appendChild(b);
        b.onclick = function() {
            node.done();
        };

        node.env('auto', function() {
            node.timer.randomEmit('DONE');
        });
    });


    return;
}

function instructions() {
    var that = this;
    var count = 0;

    //////////////////////////////////////////////
    // nodeGame hint:
    //
    // The W object takes care of all
    // visual operation of the game. E.g.,
    //
    // W.loadFrame()
    //
    // loads an HTML file into the game screen,
    // and the execute the callback function
    // passed as second parameter.
    //
    /////////////////////////////////////////////
    W.loadFrame('/ultimatum/' + node.player.lang.path +
                node.game.instructionsPage, function() {

                    var b = W.getElementById('read');
                    b.onclick = function() {
                        node.done();
                    };

                    ////////////////////////////////////////////////
                    // nodeGame hint:
                    //
                    // node.env executes a function conditionally to
                    // the environments defined in the configuration
                    // options.
                    //
                    // If the 'auto' environment was set to TRUE,
                    // then the function will be executed
                    //
                    ////////////////////////////////////////////////
                    node.env('auto', function() {

                        //////////////////////////////////////////////
                        // nodeGame hint:
                        //
                        // Emit an event randomly in a time interval
                        // from 0 to 2000 milliseconds
                        //
                        //////////////////////////////////////////////
                        node.timer.randomEmit('DONE', 2000);
                    });
                });
    console.log('Instructions');
}

function quiz() {
    var that = this;
    W.loadFrame('/ultimatum/' + node.player.lang.path + 'quiz.html',
                function() {
                    var b, QUIZ;
                    node.env('auto', function() {
                        node.timer.randomExec(function() {
                            node.game.timer.doTimeUp();
                        });
                    });
                });
    console.log('Quiz');
}

function ultimatum() {

    //////////////////////////////////////////////
    // nodeGame hint:
    //
    // var that = this;
    //
    // /this/ is usually a reference to node.game
    //
    // However, unlike in many progamming languages,
    // in javascript the object /this/ assumes
    // different values depending on the scope
    // of the function where it is called.
    //
    /////////////////////////////////////////////
    var that = this;

    var langPath = node.player.lang.path;

    var root, b, options, other;

    node.game.rounds.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL',
                                     'COUNT_UP_ROUNDS_TO_TOTAL']);

    // Load the BIDDER interface.
    node.on.data('BIDDER', function(msg) {
        console.log('RECEIVED BIDDER!');
        other = msg.data.other;
        node.set('ROLE', 'BIDDER');

        //////////////////////////////////////////////
        // nodeGame hint:
        //
        // W.loadFrame takes an optional third 'options' argument which
        // can be used to request caching of the displayed frames (see
        // the end of the following function call). The caching mode
        // can be set with two fields: 'loadMode' and 'storeMode'.
        //
        // 'loadMode' specifies whether the frame should be reloaded
        // regardless of caching (loadMode = 'reload') or whether the
        // frame should be looked up in the cache (loadMode = 'cache',
        // default).  If the frame is not in the cache, it is always
        // loaded from the server.
        //
        // 'storeMode' says when, if at all, to store the loaded frame.
        // By default the cache isn't updated (storeMode = 'off'). The
        // other options are to cache the frame right after it has been
        // loaded (storeMode = 'onLoad') and to cache it when it is
        // closed, that is, when the frame is replaced by other
        // contents (storeMode = 'onClose'). This last mode preserves
        // all the changes done while the frame was open.
        //
        /////////////////////////////////////////////
        W.loadFrame('/ultimatum/' + langPath + 'bidder.html', function() {

            // Start the timer after an offer was received.
            options = {
                milliseconds: 30000,
                timeup: function() {
                    node.emit('BID_DONE', Math.floor(1 +
                                                     Math.random()*100), other);
                }
            };

            node.game.timer.startTiming(options);

            b = W.getElementById('submitOffer');

            node.env('auto', function() {

                //////////////////////////////////////////////
                // nodeGame hint:
                //
                // Execute a function randomly
                // in a time interval between 0 and 1 second
                //
                //////////////////////////////////////////////
                node.timer.randomExec(function() {
                    node.emit('BID_DONE',
                              Math.floor(1+Math.random()*100),
                              other);
                }, 4000);
            });

            b.onclick = function() {
                var offer = W.getElementById('offer');
                if (!that.isValidBid(offer.value)) {
                    W.writeln('Please enter a number between 0 and 100');
                    return;
                }
                node.emit('BID_DONE', offer.value, other);
            };

            root = W.getElementById('container');

            node.on.data('ACCEPT', function(msg) {
                W.write(' Your offer was accepted.', root);
                node.timer.randomEmit('DONE', 3000);
            });

            node.on.data('REJECT', function(msg) {
                W.write(' Your offer was rejected.', root);
                node.timer.randomEmit('DONE', 3000);
            });
        });
        //}, { cache: { loadMode: 'cache', storeMode: 'onLoad' } });

    });

    // Load the respondent interface.
    node.on.data('RESPONDENT', function(msg) {
        console.log('RECEIVED RESPONDENT!');
        other = msg.data.other;
        node.set('ROLE', 'RESPONDENT');

        W.loadFrame('/ultimatum/' + langPath + 'resp.html', function() {
            options = {
                milliseconds: 30000
            };

            node.game.timer.startWaiting(options);
            node.game.timer.mainBox.hideBox();

            //////////////////////////////////////////////
            // nodeGame hint:
            //
            // nodeGame offers several types of event
            // listeners. They are all resemble the syntax
            //
            // node.on.<target>
            //
            // For example: node.on.data(), node.on.plist().
            //
            // The low level event listener is simply
            //
            // node.on
            //
            // For example, node.on('in.say.DATA', cb) can
            // listen to all incoming DATA messages.
            //
            /////////////////////////////////////////////
            node.on.data('OFFER', function(msg) {
                var theofferSpan, offered, accept, reject;

                options = {
                    timeup: function() {
                        that.randomAccept(msg.data, other);
                    }
                };
                node.game.timer.startTiming(options);


                offered = W.getElementById('offered');
                theofferSpan = W.getElementById('theoffer');
                theofferSpan.innerHTML = msg.data;
                offered.style.display = '';

                accept = W.getElementById('accept');
                reject = W.getElementById('reject');

                node.env('auto', function() {
                    node.timer.randomExec(function() {
                        that.randomAccept(msg.data, other);
                    }, 3000);
                });

                accept.onclick = function() {
                    node.emit('RESPONSE_DONE', 'ACCEPT', msg.data,
                              other);
                };

                reject.onclick = function() {
                    node.emit('RESPONSE_DONE', 'REJECT', msg.data,
                              other);
                };
            });
        });
        //}, { cache: { loadMode: 'cache', storeMode: 'onLoad' } });

    });

    console.log('Ultimatum');
}

function postgame() {
    node.game.rounds.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL']);

    W.loadFrame('/ultimatum/' + node.player.lang.path +
                'postgame.html', function() {
                    node.env('auto', function() {
                        node.timer.randomExec(function() {
                            node.game.timer.doTimeUp();
                        });
                    });
                });
    console.log('Postgame');
}

function endgame() {
    W.loadFrame('/ultimatum/' + node.player.lang.path + 'ended.html',
                function() {
                    node.game.timer.switchActiveBoxTo(node.game.timer.mainBox);
                    node.game.timer.waitBox.hideBox();
                    node.game.timer.setToZero();
                    node.on.data('WIN', function(msg) {
                        var win, exitcode, codeErr;
                        var root;
                        root = W.getElementById('container');
                        codeErr = 'ERROR (code not found)';
                        win = msg.data && msg.data.win || 0;
                        exitcode = msg.data && msg.data.exitcode || codeErr;
                        W.writeln('Your bonus in this game is: ' + win, root);
                        W.writeln('Your exitcode is: ' + exitcode, root);
                    });
                });

    console.log('Game ended');
}

function clearFrame() {
    node.emit('INPUT_DISABLE');
    // We save also the time to complete the step.
    node.set('timestep', {
        time: node.timer.getTimeSince('step'),
        timeup: node.game.timer.gameTimer.timeLeft <= 0
    });
    return true;
}

function notEnoughPlayers() {
    console.log('Not enough players');
    node.game.pause();
    W.lockScreen('One player disconnected. We are now waiting to see if ' +
                 'he or she reconnects. If not the game will be terminated.');
}