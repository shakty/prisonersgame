/**
 * Standard Waiting Room settings.
 */
module.exports = {

    // How many clients must connect before groups are formed.
    POOL_SIZE: 4,

    // The size of each group.
    GROUP_SIZE: 4,

    // Maximum waiting time.
    MAX_WAIT_TIME: 600000,

    // Treatment assigned to groups.
    // If left undefined, a random treatment will be selected.
    // Use "treatment_rotate" for rotating the treatmenrs.
    CHOSEN_TREATMENT: 'sa', // 'treatment_rotate',

    ON_TIMEOUT: function(data) {

        // Enough Time passed, not enough players connected.
        if (data.over === 'Time elapsed!!!') {

            timeOut = "<h3 align='center'>Thank you for your patience.<br>";
            timeOut += "Unfortunately, there are not enough participants in ";
            timeOut += "your group to start the experiment.<br>";

            timeOut += "You will receive the show-up fee for your ";
            timeOut += "participation up to this point.<br><br>";

            timeOut += "Please go back to Amazon Mechanical Turk ";
            timeOut += "web site and submit the hit.<br>";

            timeOut += "We usually pay within 24 hours. <br>For any ";
            timeOut += "problems, please look for a HIT called ";
            timeOut += "<strong>ETH Descil Trouble Ticket</strong> and file ";
            timeOut += "a new trouble ticket.";            
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