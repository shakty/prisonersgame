/**
 * # Authorization codes example file
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * File must export an array of objects containing at the very least two
 * properties: _AccesCode_, and _ExitCode_. The values of such properties
 * must be unique.
 *
 * For real authorization codes use at least 32 random characters and digits.
 * ---
 */

var path = require('path');

module.exports = function(settings, done) {
    var nCodes, i, codes;
    var dk, confPath;

    // Synchronous.

    if (settings.mode === 'auto') {

        nCodes = 100;
        codes = [];

        for (i = 0 ; i < nCodes; i ++) {
            codes.push({
                id: i + '_access',
                // Add pwd field for extra security.
                // pwd: i + '_pwd',
                ExitCode: i + '_exit',
                AccessCode: i + '_access'
            });
        }
        return codes;
    }
    
    // Asynchronous.

    // Reads in descil-mturk configuration.
    confPath = path.resolve(__dirname, 'descil.conf.js');
    dk = require('descil-mturk')();

    dk.readConfiguration(confPath);

    // Load code database.
    if (settings.mode === 'remote') {

        // Convert format.
        dk.codes.on('insert', function(o) {
            o.id = o.AccessCode;
        });

        dk.getCodes(function() {            
            if (!dk.codes.size()) {
                done('Auth.codes: no codes found!');
            }
            console.log(dk.codes.db);
            done(null, dk.codes.db);
        });
    }
    else if (settings.mode === 'local') {
        dk.readCodes(function() {
            if (!dk.codes.size()) {
                done('Auth.codes: no codes found!');
            }
        });
    }
    else {
        done('Auth.codes: Unknown settings.');
    }
    
};
