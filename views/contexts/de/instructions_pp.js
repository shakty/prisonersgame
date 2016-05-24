module.exports = function(settings, headers) {

    var C = settings.pp.COINS;
    var R = settings.pp.REPEAT;
    var E = settings.pp.EXCHANGE_RATE_INSTRUCTIONS;
    var W = settings.pp.WAIT_TIME;
    
    return {
        title: "INSTRUKTIONEN",
        instructionsOfTheUltimatumGame: "Anleitung zum Ultimatum Spiel. Bitte sorgfältig lesen.",
        thisGameIsPlayed: "This game is played in rounds by two human players randomly paired.",
        inEachRound: 'In each round, one of the them, called <em>BIDDER</em>, makes an offer to the other player, called <em>RESPONDENT</em>, about how to share ' + C + ' ECU (Experimental Currency). ' + C + ' ECU are equal to ' + E + ' USD.',
        theRespondent: "The RESPONDENT can either accept or reject the offer of the BIDDER. If he / she accepts, both players split " + C + " ECU accordingly, else both get 0.",
        theGameIsRepeated: "The game is repeated " + R + " rounds.",
        important: "Important. If one of the players disconnects for more than " + W + " seconds the game will be terminated.",
        inSuchACase: "In such a case the player who disconnected will not be paid at all, and the remaining ones will be paid only the show up fee.",
        ifYouUnderstood: "If you understood the instructions correctly press the button to proceed to the game."
    };
};
