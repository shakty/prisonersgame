var J = require('JSUS').JSUS;

module.exports = function(settings, headers) {

    var coins = settings.pp.COINS;
    var values = [
        Math.floor(coins/2, 10),
        coins,
        0
    ];

    return {
        "x": 0,
        "title": "Quiz",
        "beforeStarting": "Before starting the game answer the following questions:",
        "Q": "Q",
        "howManyCoins": "How many coins will you divide with your partner?",
        "vals": J.shuffle(values),
        "ifYouAreTheBidder": "If you are a bidder what happens if your partner reject your offer?",
        "howMuchYouGet": [
            "He does not get anything, I keep my share.",
            "I get everything.",
            "He gets what I offered, I get nothing.",
            "Both get nothing."
        ],
        "considerTheFollowing": "Consider the following scenario. Four players (A,B,C,D) are playing. B disconnects for more than " + settings.pp.WAIT_TIME + " seconds, and the game is terminated. What happens then?",
        "disconnect": [
            "A,C,D are paid only the show up fee. B is not paid at all.",
            "A,C,D are paid the show up fee plus the bonus collected so far. B is paid only the show up fee.",
            "A,C,D are paid the show up fee plus the bonus collected so far. B is not paid at all.",
            "All players are paid only the show up fee.",
            "All players are paid the show up fee and the bonus collected so far."
        ],
        "clickHere": "Click here to check your answers, and start the game.",
        "correctAnswers": "Correct Answers:"
    };
};
