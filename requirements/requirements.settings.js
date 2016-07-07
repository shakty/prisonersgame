/**
 * # Requirements settings
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = {

    /**
     * ## enabled
     *
     * If TRUE, it creates a requirements room. Default, TRUE
     */
    enabled: true,

    /**
     * ## doChecking
     *
     * If TRUE, start testing the requirements immediately. Default, TRUE
     */
    doChecking: true,

    /**
     * ## maxExecTime
     *
     * If set, limits the maximum execution time for all requirement tests
     */ 
    maxExecTime: 6000,

    /**
     * ## maxExecTime
     *
     * If set, client must exchange messages with server "quickly enough"
     */ 
    speedTest: {
        messages: 100,
        time: 1000
    }

    /**
     * ## logicPath
     *
     * Alternative path for a custom requirements room.
     */
    // logicPath: './requirements.room.js',

    // # Reserved words for future requirements settings.

    //  mode: 'auto',
    // 
    //  page: 'requirements.htm',

    //  excludeBrowsers: {
    //      browser: 'netscape'
    //  },

};