/**
 * Standard Waiting Room settings.
 */
module.exports = {

    // How many clients must connect before groups are formed.
    POOL_SIZE: 2,

    // The size of each group.
    GROUP_SIZE: 2,

    // Maximum waiting time.
    MAX_WAIT_TIME: 30000,

    // Treatment assigned to groups.
    // If left undefined, a random treatment will be selected.
    // Use "treatment_rotate" for rotating the treatments.
    CHOSEN_TREATMENT: 'treatment_rotate',


    // In the execution mode ´'TIMEOUT'´, one waits until the time is up, then
    // it will be checked whether enough players are there to start the game.
    // In the execution mode ´'WAIT_FOR_N_PLAYERS'´, the game starts right away
    // if there are the desired number of players. Otherwise, when the time is
    // up, it will be checked if there are at least a certain minimum number of
    // players to start the game.

    EXECUTION_MODE: {
        TYPE: 'WAIT_FOR_N_PLAYERS',
        MIN_PLAYER: 2
    },


    ON_TIMEOUT: function(data) {
        var timeOut;

        // Enough Time passed, not enough players connected.
        if (data.over === 'Time elapsed, disconnect') {

            timeOut = "<h3 align='center'>Thank you for your patience.<br>";
            timeOut += "Unfortunately, there are not enough participants in ";
            timeOut += "your group to start the experiment.<br>";
        }
        else if(data.over === "Time elapsed!!!") {
            if(data.nPlayers && data.nPlayers < POOL_SIZE) {
                return; // Text here?
            }
            else {
                return;
            }
        }
        // Too much time passed, but no message from server received.
        else {
            timeOut = "An error has occurred. You seem to be ";
            timeOut += "waiting for too long. Please look for a HIT called ";
            timeOut += "<strong>ETH Descil Trouble Ticket</strong> and file ";
            timeOut += "a new trouble ticket reporting your experience."
        }

        if (data.exit) {
            timeOut += "<br>Please report this exit code: " + data.exit;
        }

        timeOut += "<br></h3>";

        this.bodyDiv.innerHTML = timeOut;
    }
};
