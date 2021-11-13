/**
 * # Functions used by the client of prisoner Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = {
    init: init,
    endgame: endgame
};

function init() {
    var header;

    this.node.log('Init.');

    // Setup the header (by default on the left side).
    header = W.generateHeader();

    // Uncomment to visualize the name of the stages.
    //node.game.visualStage = node.widgets.append('VisualStage', header);

    node.game.rounds = node.widgets.append('VisualRound', header, {
        displayModeNames: ['COUNT_UP_STAGES_TO_TOTAL']
    });

    node.game.visualTimer = node.widgets.append('VisualTimer', header);

    // Done button to click.
    node.game.donebutton = node.widgets.append('DoneButton', header);

    // Additional debug information while developing the game.
    // node.game.debugInfo = node.widgets.append('DebugInfo', header)

    // Add the main frame where the pages will be loaded.
    W.generateFrame();

    // Add event listeners valid for the whole game.

    node.on('BID_DONE', function(value, notify) {
        var root, time, offer, submitOffer, timeup;

        timeup = node.game.timer.isTimeup();

        // Save references.
        node.game.lastOffer = value;
        node.game.lastTimup = timeup;
        node.game.lastTime = time;

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
            node.say('OFFER', node.game.partner, node.game.lastOffer);

            // Notify the server.
            node.done({ offer: value });
        }

    });

    node.on('RESPONSE_DONE', function(response) {

        // Tell the other player own response.
        node.say(response, node.game.partner, response);

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
            responseTo: node.game.partner,
            response: response
        });
    });

    // Add other functions are variables used during the game.

    this.partner = null;

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



    // Questionnaire widget (to be created later).
    this.quest = null;


    // Set default language prefix.
    W.setUriPrefix(node.player.lang.path);

    // Listeners for first two stages are put here, so that
    // if there is a reconnection they can be executed by any
    // step.

    node.game.partner = null;
    node.game.offerReceived = null;
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
        W.writeln('', root);
        W.writeln('', root);
        W.writeln('Your bonus in this game is: ' + win, root);
        W.writeln('Your exitcode is: ' + exitcode, root);
    });

    console.log('Game ended');
}
