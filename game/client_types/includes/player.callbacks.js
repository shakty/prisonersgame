/**
 * # Functions used by the client of Ultimatum Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = {
    init: init,
    precache: precache,
    selectLanguage: selectLanguage,
    instructions: instructions,
    quiz: quiz,
    ultimatum: ultimatum,
    postgame: postgame,
    endgame: endgame
};

function init() {
    var that, header;

    that = this;
    this.node.log('Init.');

    // Setup the header (by default on the left side).
    if (!W.getHeader()) {
        header = W.generateHeader();

        // Uncomment to visualize the name of the stages.
        //node.game.visualStage = node.widgets.append('VisualStage', header);

        node.game.rounds = node.widgets.append('VisualRound', header, {
            displayModeNames: ['COUNT_UP_STAGES_TO_TOTAL'],
            stageOffset: 1
        });

        node.game.visualTimer = node.widgets.append('VisualTimer', header);

        // Done button to click.
        node.game.donebutton = node.widgets.append('DoneButton', header);

        // Additional debug information while developing the game.
        // node.game.debugInfo = node.widgets.append('DebugInfo', header)

    }

    // Add the main frame where the pages will be loaded.
    if (!W.getFrame()) W.generateFrame();    


    // Add event listeners valid for the whole game.

    node.on('BID_DONE', function(value, to, timeup) {
        var root, time, offer, submitOffer;

        // Time to make a bid.
        time = node.timer.getTimeSince('bidder_loaded');
        
        // Avoid double offers.
        if (node.game.offerDone) return;

        node.game.offerDone = true;

        // Save references.
        node.game.lastOffer = value;
        node.game.lastTimup = timeup;
        node.game.lastTime = time;

        node.game.visualTimer.clear();
        node.game.visualTimer.startWaiting({
            milliseconds: node.game.settings.TIMER.response
        });

        offer = W.getElementById('offer');
        if (offer) offer.disabled = 'disabled';
        submitOffer = W.getElementById('submitOffer');
        if (submitOffer) submitOffer.disabled = 'disabled';

        // Notify the server.
        node.set({
            offer: value,
            time: time,
            timeup: timeup
        });

        // Notify the other player.
        node.say('OFFER', to, value);

        root = W.getElementById('container');
        // Leave a space.
        W.writeln(' Your offer: ' +  value +
                  '. Waiting for the respondent... ', root);
    });

    node.on('RESPONSE_DONE', function(response, offer, from) {

        // Tell the other player own response.
        node.say(response, from, response);

//         node.set({
//             response: response,
//             value: offer,
//             from: from
//         });

        //////////////////////////////////////////////
        // nodeGame hint:
        //
        // node.done() communicates to the server that
        // the player has completed the current state.
        //
        // The parameters are send to the server with
        // a SET message. This SET message has two
        // properties by default:
        //
        // - time: time passed since the begin of the step
        // - timeup: if a timeup happened
        //
        // which can be overwritten by the parameter.
        //
        // Any number of additional properties can
        // be added and will be stored in the server.
        //
        /////////////////////////////////////////////
        node.done({
            value: offer,
            from: from,
            response: response,
            // Overwrite default `time` property
            // (since the beginning of the step).
            time: node.timer.getTimeSince('offer_received')
        });
    });


    // Clean up stage upon stepping into the next one.
    node.on('STEPPING', function() {
        W.clearFrame();
    });

    // Add other functions are variables used during the game.

    this.other = null;

    this.randomAccept = function(offer, other) {
        var root, accepted;
        accepted = Math.round(Math.random());
        console.log('randomaccept');
        console.log(offer + ' ' + other);
        root = W.getElementById('container');
        if (accepted) {
            node.emit('RESPONSE_DONE', 'ACCEPT', offer, other);
            W.write(' You accepted the offer.', root);
        }
        else {
            node.emit('RESPONSE_DONE', 'REJECT', offer, other);
            W.write(' You rejected the offer.', root);
        }
    };

    this.isValidBid = function(n) {
        return node.JSUS.isInt(n, -1, 101);
    };

    // Adapting the game to the treatment.
    if (node.game.settings.treatmentName === 'pp') {
        node.game.instructionsPage = 'instructions_pp.html';
    }
    else {
        node.game.instructionsPage = 'instructions.html';
    }

    // Set default language prefix.
    W.setUriPrefix(node.player.lang.path);
}

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
    W.lockScreen('Loading...');
    console.log('pre-caching...');
    W.preCache([
        'languageSelection.html', // no text here.
        node.game.instructionsPage,
        'quiz.html',

        // These two are cached later by loadFrame calls (for demonstration):
        // 'langPath + 'bidder.html',
        // 'langPath + 'resp.html',

        'postgame.html',
        'ended.html'
    ], function() {
        console.log('Precache done.');
        // Pre-Caching done; proceed to the next stage.
        node.done();
    });
}

function selectLanguage() {
    W.loadFrame('languageSelection.html', function() {


        node.game.lang = node.widgets.append('LanguageSelector',
                                             W.getFrameDocument().body);

        node.env('auto', function() {
            node.timer.randomDone();
        });
    });
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
    W.loadFrame(node.game.instructionsPage, function() {

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
            // Execute a node.done in a time interval
            // from 0 to 2000 milliseconds
            //
            //////////////////////////////////////////////
            node.timer.randomDone(2000);
        });
    });
    console.log('Instructions');
}

function quiz() {
    var that = this;
    W.loadFrame('quiz.html', function() {

        var b, QUIZ;
        node.env('auto', function() {
            node.timer.randomExec(function() {
                node.game.visualTimer.doTimeUp();
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

    var root, b, options, other;

    node.game.rounds.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL',
                                     'COUNT_UP_ROUNDS_TO_TOTAL']);


    // Hack to avoid double offers. Todo: fix.
    node.game.offerDone = false;

    // Load the BIDDER interface.
    node.on.data('BIDDER', function(msg) {
        console.log('RECEIVED BIDDER!');
        other = msg.data.other;
        node.set({role: 'BIDDER'});

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
        W.loadFrame('bidder.html', function() {
            // Start the timer after an offer was received.
            options = {
                milliseconds: node.game.settings.TIMER.bidder,
                timeup: function() {
                    node.emit('BID_DONE',
                              Math.floor(Math.random() * 101), other, true);
                }
            };

            node.game.visualTimer.startTiming(options);

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
                              Math.floor(Math.random() * 101), other);
                }, 4000);
            });

            b.onclick = function() {
                var offer, value;
                offer = W.getElementById('offer');
                value = that.isValidBid(offer.value);
                if (value === false) {
                    W.writeln('Please enter a number between 0 and 100',
                              W.getElementById('container'));
                    return;
                }
                node.emit('BID_DONE', value, other);
            };

            root = W.getElementById('container');

            node.on.data('ACCEPT', function(msg) {
                W.write(' Your offer was accepted.', root);
                node.timer.randomDone(3000);
            });

            node.on.data('REJECT', function(msg) {
                W.write(' Your offer was rejected.', root);
                node.timer.randomDone(3000);
            });

            node.timer.setTimestamp('bidder_loaded');

        }, { cache: { loadMode: 'cache', storeMode: 'onLoad' } });
    });

    // Load the respondent interface.
    node.on.data('RESPONDENT', function(msg) {
        console.log('RECEIVED RESPONDENT!');
        other = msg.data.other;
        node.set({role: 'RESPONDENT'});

        W.loadFrame('resp.html', function() {
            options = {
                milliseconds: node.game.settings.TIMER.response,
                timeup: function() {                    
                    var root;
                    setTimeout(function() {
                        root = W.getElementById('container');
                        W.writeln('The other player is taking longer ' + 
                                  'than expected...', root);
                    }, 2000);
                }
            };

            node.game.visualTimer.startWaiting(options);
            node.game.visualTimer.mainBox.hideBox();

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
                node.game.visualTimer.startTiming(options);

                W.setInnerHTML('theoffer', msg.data);
                W.show('offered');

                accept = W.getElementById('accept');
                reject = W.getElementById('reject');

                node.env('auto', function() {
                    node.timer.randomExec(function() {
                        that.randomAccept(msg.data, other);
                    }, 3000);
                });

                accept.onclick = function() {
                    node.emit('RESPONSE_DONE', 'ACCEPT', msg.data, other);
                };

                reject.onclick = function() {
                    node.emit('RESPONSE_DONE', 'REJECT', msg.data, other);
                };

                node.timer.setTimestamp('offer_received');
            });

        }, { cache: { loadMode: 'cache', storeMode: 'onLoad' } });

    });

    console.log('Ultimatum');
}

function postgame() {
    node.game.rounds.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL']);

    W.loadFrame('postgame.html', function() {

        node.env('auto', function() {
            node.timer.randomExec(function() {
                node.game.visualTimer.doTimeUp();
            });
        });
    });
    console.log('Postgame');
}

function endgame() {
    W.loadFrame('ended.html', function() {

        node.game.visualTimer.switchActiveBoxTo(node.game.visualTimer.mainBox);
        node.game.visualTimer.waitBox.hideBox();
        node.game.visualTimer.setToZero();
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