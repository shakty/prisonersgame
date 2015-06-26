module.exports = function(settings, headers) {
    var coins = settings.pp.COINS;

    return {
        "title": "Bidder",
        "youAre": "You are the Bidder",
        "makeAnOffer": "Make an offer from 0 to " + coins + " to another player.",
        "submit": "Submit"
    };
};
