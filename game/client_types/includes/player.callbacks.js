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
    bidder: bidder,
    respondent: respondent,
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

    node.on('BID_DONE', function(value, notify) {
        var root, time, offer, submitOffer, timeup;        

        timeup = node.game.timer.isTimeup();

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

        root = W.getElementById('container');
        // Leave a space.
        W.writeln(' Your offer: ' +  value +
                  '. Waiting for the respondent... ', root);

        if (notify !== false) {
            // Notify the other player.
            node.say('OFFER', node.game.other, node.game.lastOffer);

            // Notify the server.
            node.done({ offer: value });
        }

    });

    node.on('RESPONSE_DONE', function(response) {

        // Tell the other player own response.
        node.say(response, node.game.other, response);

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
            value: node.game.offerReceived,
            responseTo: node.game.other,
            response: response
        });
    });

    // Add other functions are variables used during the game.

    this.other = null;

    this.bidTimeup = function() {
        node.emit('BID_DONE', Math.floor(Math.random() * 101), true);
    };

    this.resTimeup = function() {
        var root, accepted;
        accepted = Math.round(Math.random());
        console.log('randomaccept');
        root = W.getElementById('container');
        if (accepted) {
            node.emit('RESPONSE_DONE', 'ACCEPT');
            W.write(' You accepted the offer.', root);
        }
        else {
            node.emit('RESPONSE_DONE', 'REJECT');
            W.write(' You rejected the offer.', root);
        }
    };

    this.isValidBid = function(n) {
        return node.JSUS.isInt(n, -1, 101);
    };

    // Quiz widget (to be created later).
    this.quiz = null;

    this.quizTexts = {

        howMuchMainText: 'How many coins will you divide with your partner?',
        howMuchChoices: [
            '50',
            '100',
            '0'
        ],

        rejectMainText: 'If you are a bidder what happens if your partner ' +
            'reject your offer?',
        rejectChoices: [
            'He does not get anything, I keep my share.',
            'I get everything.',
            'He gets what I offered, I get nothing.',
            'Both get nothing.'
        ],

        disconnectMainText: 'Consider the following scenario. Four players ' +
            '(A,B,C,D) are playing. B disconnects for more than 30 seconds, ' +
            'and the game is terminated. What happens then?',
        disconnectChoices: [
            'A,C,D are paid only the show up fee. B is not paid at all.',
            'A,C,D are paid the show up fee plus the bonus collected so far. ' +
                'B is paid only the show up fee.',
            'A,C,D are paid the show up fee plus the bonus collected so far. ' +
                'B is not paid at all.',
            'All players are paid only the show up fee.',
            'All players are paid the show up fee and the bonus ' +
                'collected so far.'
        ]

    };

    // Questionnaire widget (to be created later).
    this.quest = null;

    this.questTexts = {
        mainText: 'If the game was terminated because of a ' +
            'player disconnection, in your opinion, why did the other player ' +
            'disconnect?',
        choices: [
            'He or she was losing.',
            'Technical failure.',
            'The player found a more rewarding task.',
            'The game was boring, not clear, too long, etc.',
            'Not applicable.'
        ],
        freeText: 'Please report any additional comment to the ' +
            'experimenters.'
    };

    // Set default language prefix.
    W.setUriPrefix(node.player.lang.path);

    // Listeners for first two stages are put here, so that
    // if there is a reconnection they can be executed by any
    // step.

    node.game.role = null;
    node.game.other = null;
    node.game.offerReceived = null;

    node.on.data('ROLE', function(msg) {
        that.other = msg.data.other;
        that.role = msg.data.role;
        node.done({ role: that.role });
        
    });

    // For respondent.
    node.on.data('OFFER', function(msg) {
        that.offerReceived = msg.data;     
        node.done();       
    });           
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

        // Instructions are not pre-cached, because in case they are loaded
        // from public/ a js file must modify the content of the DOM.
        // node.game.settings.instructionsPage,

        'quiz2.html', // ('quiz.html' to have version with forms).

        // These two are cached later by loadFrame calls (for demonstration):
        // 'bidder.html',
        // 'resp.html',

        'questionnaire.html', // ('postgame.html' to have version with forms)
        'ended.html'
    ], function() {
        console.log('Precache done.');
        // Pre-Caching done; proceed to the next stage.
        node.done();
    });
}

function selectLanguage() {
    node.game.lang = node.widgets.append('LanguageSelector',
                                         W.getFrameDocument().body);
}

function bidder() {
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

    var b, options, loadFrameOptions;

    loadFrameOptions = { 
        cache: { loadMode: 'cache', storeMode: 'onLoad' }
    };

    if (this.role === 'RESPONDENT') {        
        W.loadFrame('resp.html', function() {
            // It was a reconnection.
            if (that.offerReceived !== null) node.done();
        }, loadFrameOptions);
        return;
    }
    else if (this.role === 'SOLO') {
        W.loadFrame('solo.html', function() {
            node.timer.randomDone();
        }, loadFrameOptions);
        return;
    }

    //////////////////////////////////////////////
    // nodeGame hint:
    //
    // The W object takes care of all
    // visual operation of the game. E.g.,
    //
    // W.loadFrame()
    //
    // loads an HTML file into the game screen, and the executes
    // the callback function passed as second parameter.
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

        b = W.getElementById('submitOffer');
        if (!b) debugger;
        b.onclick = function() {
            var offer, value;
            offer = W.getElementById('offer');
            value = that.isValidBid(offer.value);
            if (value === false) {
                W.writeln('Please enter a number between 0 and 100',
                          W.getElementById('container'));
                return;
            }
            node.emit('BID_DONE', value);
        };

    }, loadFrameOptions);
}

function respondent() {
    
    var that;
    var root, b;
    var theofferSpan, offered, accept, reject;

    that = this;
    root = W.getElementById('container');

    if (this.role === 'BIDDER') {

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
        node.on.data('ACCEPT', function(msg) {
            W.write(' Your offer was accepted.', root);
            node.timer.randomDone(3000);
        });
        node.on.data('REJECT', function(msg) {
            W.write(' Your offer was rejected.', root);
            node.timer.randomDone(3000);
        });
        return;
    }
    else if (this.role === 'SOLO') {
        node.timer.randomDone();
        return;
    }

    W.setInnerHTML('theoffer', node.game.offerReceived);
    W.show('offered');

    accept = W.getElementById('accept');
    accept.onclick = function() {
        node.emit('RESPONSE_DONE', 'ACCEPT');
    };

    reject = W.getElementById('reject');
    reject.onclick = function() {
        node.emit('RESPONSE_DONE', 'REJECT');
    };
}

function endgame() {
    this.visualTimer.switchActiveBoxTo(this.visualTimer.mainBox);
    this.visualTimer.waitBox.hideBox();
    this.visualTimer.setToZero();
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

    console.log('Game ended');
}