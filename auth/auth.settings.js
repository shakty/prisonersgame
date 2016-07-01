/**
 * # Auth settings
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = {

    enabled: true, // [true, false] Default: TRUE.

    mode: 'auto', // ['remote', 'local', 'auto'] Default: 'auto'

    // Must export a function that returns an array of codes synchronously
    // or asynchronously. Default: 'auth.codes.js'
    codes: 'auth.codes.js', 

    page: 'login.htm'
};
