module.exports = function(settings, headers) {
    var s, C, R, E, B;

    // Retro-compatibility with nodeGame < 4.0.
    s = settings.pp || s;

    C = settings.COINS;
    R = settings.REPEAT;
    E = settings.EXCHANGE_RATE_INSTRUCTIONS;

    B = (C*R) * (E/C);

    return {
        title: "Instruktionen",
        instructions: "Anleitung zum Ultimatum Spiel",
        readCarefully: "Bitte sorgfältig lesen.",
        thisGame: "This game is played in rounds by two human players randomly paired.",
        inEachRound: 'In each round, one of the them, called <em>BIDDER</em>, makes an offer to the other player, called <em>RESPONDENT</em>, about how to share ' + C + ' ECU (Experimental Currency). ' + C + ' ECU are equal to ' + E + ' USD.',
        theRespondent: "The RESPONDENT can either accept or reject the offer of the BIDDER. If he / she accepts, both players split " + C + " ECU accordingly, else both get 0.",
        theGame: "The game is repeated " + R + " rounds.",
        ifYouUnderstood: "If you understood the instructions correctly press the button to proceed to the game."
    };
};
