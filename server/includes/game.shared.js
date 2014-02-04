/**
 * # Settings shared between logic and clients
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = {

    // Group settings.

    // How many players have to connect before a random subset is drawn.
    POOL_SIZE: 4,
    // How many players in each group ( must be <= POOL_SIZE).
    GROUP_SIZE: 4,
    // Minimum number of players that must be always connected.
    MIN_PLAYERS: 4,

    // Session Counter start from.
    SESSION_ID: 100,

    // Game settings.
    
    // Available treatments.
    TREATMENTS: ['pp', 'normal'],

    // Which treatment to play.
    // Leave undefined for a randomly chosen treatment.
    CHOSEN_TREATMENT: 'pp',

    // Number or rounds to repeat the bidding. *
    REPEAT: 20,

    // Number of coins to split. *
    COINS: 100,

    // Divider ECU / DOLLARS *
    EXCHANGE_RATE: 1000,

    // DEBUG.
    DEBUG: true,

    // AUTO-PLAY.
    AUTO: true,

    // AUTHORIZATION.
    AUTH: 'MTURK' // MTURK, LOCAL, NO.

    // * =  If you change this, you need to update the instructions and quiz
};