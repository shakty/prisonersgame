/**
 * # Game settings: prisoner Game
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = {

    // Session Counter start from.
    SESSION_ID: 100,

    // Minimum number of players that must be always connected.
    MIN_PLAYERS: 2,

    // Number or rounds to repeat the game. *
    REPEAT: 1,
    
    // Rewards for both players cooperating
    COOPERATE: 3,

    // Reward for both players defecting
    DEFECT: 1,

    // Reward for player who cooperates given the other defects
    COOPERATE_BETRAYED: 0,

    // Reward for player who defects given the other cooperates
    BETRAY: 5,

    // TIMER.
    // If the name of a key of the TIMER object matches the name of one
    // of the steps or stages, its value is automatically used as the
    // value of the `timer` property of that step/stage. 
    //
    // The timer property is read by `node.game.timer` and by VisualTimer
    // widgets, if created. It can be:
    // 
    //  - a number (in milliseconds),
    //  - a function returning the number of milliseconds,
    //  - an object containing properties _milliseconds_, and _timeup_
    //      the latter being the name of an event to emit or a function
    //      to execute when the timer expires. If _timeup_ is not set,
    //      property _timeup_ of the game step will be used.
    TIMER: {
        //selectLanguage: 30000,
        instructions: 90000
    },

    // Available treatments:
    // (there is also the "standard" treatment, using the options above)
    treatments: {
        
        standard: {
            fullName: "Standard",
            description:
                "More time to wait and no peer pressure.",
            WAIT_TIME: 20,
            instructionsPage: 'instructions.html'
        },

        pp: {
            fullName: "Peer Pressure",
            description:
                "Introduces peer pressure to players to not disconnect.",
            WAIT_TIME: 10,
            instructionsPage: 'instructions.html'
        }
    }
};
