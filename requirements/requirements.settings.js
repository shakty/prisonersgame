/**
 * # Requirements settings
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = {

    enabled: true, // [false] Default: TRUE.

    logicPath: './requirements.room.js',

    mode: 'auto', // 'remote', 'local' 

    page: 'requirements.htm',

    maxExecTime: 8000,

    excludeBrowsers: {
        browser: 'netscape'
    }

};