/**
 * # Authorization functions for Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Sets authorizations for accessing the Ultimatum channels.
 * ---
 */
module.exports = function(auth) {

    var path = require('path');

    var J = require('JSUS').JSUS;

    // TODO: receive callback or pass from paramter.
    // Load settings.
    var settings = require(__dirname + '/../server/game.settings.js');

    // Reads in descil-mturk configuration.
    var confPath = path.resolve(__dirname, 'descil.conf.js');

    // Load the code database.
    var dk = require('descil-mturk')(confPath);
    function codesNotFound() {
        if (!dk.codes.size()) {
            throw new Error('game.room: no codes found.');
        }
        // Add a ref to the node obj.
        node.dk = dk;
    }

    if (settings.AUTH === 'MTURK') {
        dk.getCodes(codesNotFound);
    }
    else if (settings.AUTH === 'LOCAL') {
        dk.readCodes(codesNotFound);
    }

    // Creating an authorization function for the players.
    // This is executed before the PCONNECT listener.
    // Here direct messages to the client can be sent only using
    // his socketId property, since no clientId has been created yet.
    function authPlayers(channel, info) {

        var code, player, token;
        var header, cookies, room, clientType;

        header = info.headers;
        cookies = info.cookies;
        room = info.startingRoom;
        clientType = info.clientType;

        if (settings.AUTH === 'NO') {
            return true;
        }

        playerId = cookies.player;
        token = cookies.token;

        console.log('game.room: checking auth.');

        // Weird thing.
        if ('string' !== typeof playerId) {
            console.log('no player: ', player);
            return false;
        }

        // Weird thing.
        if ('string' !== typeof token) {
            console.log('no token: ', token);
            return false;
        }

        code = dk.codeExists(token);

        console.log(code);
        console.log("-------------------");

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
        var cid, cookies, validCookie;
        
        if (settings.AUTH === 'NO') {
            cid = channel.registry.generateClientId();
            
            // If no auth, add the new code to the db.
            dk.codes.insert({
                AccessCode: cid,
                ExitCode: cid + '_exit'
            });
            return cid;
        }

        cookies = info.cookies;
        validCookie = info.validSessionCookie;

        // Return the id only if token was validated.
        // More checks could be done here to ensure that token is unique in ids.
        if (cookies.token && validCookie) {
            return cookies.token;
        }
    }

    // Assigning the auth callbacks to the player server.
    auth.authorization('ultimatum', 'player', authPlayers);
    auth.clientIdGenerator('ultimatum', 'player', idGen);
};