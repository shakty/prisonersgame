/**
 * # Game settings: Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = {

    // Session Counter start from.
    SESSION_ID: 100,

    // Minimum number of players that must be always connected.
    MIN_PLAYERS: 2,

    // Number or rounds to repeat the bidding. *
    REPEAT: 2,

    // Number of coins to split. *
    COINS: 100,

    // Divider ECU / DOLLARS *
    EXCHANGE_RATE: 2000,

    EXCHANGE_RATE_INSTRUCTIONS: 0.01,

    // DEBUG.
    DEBUG: true,

    // AUTO-PLAY.
    AUTO: false,

    // AUTHORIZATION.
    AUTH: 'NO', // MTURK, LOCAL, NO.

    // Available treatments:
    // (there is also the "default" treatment, using the options above)
    treatments: {
        
        standard: {
            fullName: "Standard",
            description:
                "More time to wait and no peer pressure.",
            WAIT_TIME: 60
        },

        pp: {
            fullName: "Peer Pressure",
            description:
                "Introduces peer pressure to players to not disconnect.",
            WAIT_TIME: 30
        }
    }

    // * =  If you change this, you need to update 
    // the instructions and quiz static files in public/
};
