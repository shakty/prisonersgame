module.exports = function(settings, headers) {
    var coins = settings.pp.COINS;
    return {
        "title": "Anbieter",
        "youAre": "Sie sind der Anbieter",
        "makeAnOffer": "Machen Sie einem anderen Spieler ein Angebot zwischen 0 und " + coins + ".",
        "submit": "Übermitteln"
    };
}

