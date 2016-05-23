window.onload = function() {

    var node = parent.node;
    var W    = parent.W;
    var s    = node.game.settings;

    W.setInnerHTML('rounds', s.REPEAT);
    W.setInnerHTML('coins', s.COINS, 'className');
    W.setInnerHTML('exchange-rate', (s.COINS / s.EXCHANGE_RATE));

    if (s.treatmentName === 'pp') {
        W.setInnerHTML('wait-time', s.WAIT_TIME);
    }
};