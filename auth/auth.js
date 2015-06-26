/**
 * # Authorization functions for Ultimatum Game
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * Sets authorizations for accessing the Ultimatum channels.
 * ---
 */
module.exports = function(auth, settings) {


    // Creating an authorization function for the players.
    // This is executed before the client the PCONNECT listener.
    // Here direct messages to the client can be sent only using
    // his socketId property, since no clientId has been created yet.

    function authPlayers(channel, info) {

        var code, player, token;
        playerId = info.cookies.player;
        token = info.cookies.token;


        // Code not existing.
        if (!code) {
            console.log('not existing token: ', token);
            return false;
        }

        if (code.checkedOut) {
            console.log('token was already checked out: ', token);
            return false;
        }

        // Code in use.
        //  usage is for LOCAL check, IsUsed for MTURK
        if (code.valid === false) {
            if (code.disconnected) {
                return true;
            }
            else {
                console.log('token already in use: ', token);
                return false;
            }
        }

        // Client Authorized
        return true;
    }

    // Assigns Player Ids based on cookie token.
    function idGen(channel, info) {
        var cid = channel.registry.generateClientId();
        var cookies;
        var ids;


        // Return the id only if token was validated.
        // More checks could be done here to ensure that token is unique in ids.
        ids = channel.registry.getIds();
        cookies = info.cookies;
        if (cookies.player) {

            if (!ids[cookies.player] || ids[cookies.player].disconnected) {
                return cookies.player;
            }
            else {
                console.log("already in ids", cookies.player);
                return false;
            }
        }
    }

    function decorateClientObj(clientObject, info) {
        if (info.headers) clientObject.userAgent = info.headers['user-agent'];
    }

    // Assigning the auth callbacks to the player server.
    // auth.authorization('player', authPlayers);
    // auth.clientIdGenerator('player', idGen);
    auth.clientObjDecorator('player', decorateClientObj);

};
