var fs = require('fs');
var should = require('should');
var NDDB = require('NDDB').NDDB;

var filePath = './data/100/memory_all.json';
var db;
var gameSettings;

describe('The file "' + filePath + '"', function() {
    it('should exist', function(done) {
        fs.exists(filePath, function(exists) {
            exists.should.be.true;
            done();
        });
    });

    it('should be loadable with NDDB', function() {
        db = new NDDB();
        db.load(filePath);
        db.size().should.be.above(0);
    });
});

describe('File contents', function() {
    before(function() {
        gameSettings = require('../server/game.settings.js');
    });

    it('should have the right number of entries', function() {
        // Assuming two players.
        db.size().should.equal(4 + 4 * gameSettings.REPEAT + 4);
    });

    it('should have consistent player IDs', function() {
        var i;
        var group;

        // Assuming two players.
        group = db.groupBy('player');
        group.length.should.equal(2,
            'Invalid number of players!');

        // Check for ID data-type.
        for (i = 0; i < 2; ++i) {
            group[i].db[0].player.should.be.String;
        }
    });
});

describe('Bidding rounds', function() {
    var bidDb;

    before(function() {
        bidDb = db.select('stage.stage', '=', 5).breed();
    });

    it('should have the correct number of repetitions', function() {
        // Maximum round should equal the repetition number in the settings.
        Math.max.apply(null,
            bidDb.fetchValues('stage.round')['stage.round']
        ).should.equal(gameSettings.REPEAT);
    });

    it('should have valid offers', function() {
        var i, roundDb;
        var offer, response;

        for (i = 1; i <= gameSettings.REPEAT; ++i) {
            roundDb = bidDb.select('stage.round', '=', i).breed();

            // Get offer and response.
            offer = roundDb.select('key', '=', 'offer').fetch()[0].value;
            response = roundDb.select('key', '=', 'response').fetch()[0].value;

            // Check value ranges.
            offer.should.be.within(0, 100, 'Offer not in [0, 100]!');
            ['ACCEPT', 'REJECT'].should.containEql(response.response,
                'Invalid response!');

            // Check offer/response correspondence.
            offer.should.equal(response.value, 'Response contains incorrect offer!');
        }
    });

    it('should have players in the correct roles', function() {
        var i, roundDb;
        var bidderId, respondentId, responseObj;

        for (i = 1; i <= gameSettings.REPEAT; ++i) {
            roundDb = bidDb.select('stage.round', '=', i).breed();

            // Check role IDs.
            bidderId = roundDb
                .select('key', '=', 'ROLE')
                .and('value', '=', 'BIDDER')
                .fetch()[0].player;
            respondentId = roundDb
                .select('key', '=', 'ROLE')
                .and('value', '=', 'RESPONDENT')
                .fetch()[0].player;

            bidderId.should.not.equal(respondentId,
                'Bidder same as respondent!');

            // Check offer/response correspondence.
            roundDb.select('key', '=', 'offer').fetch()[0].player.should.equal(
                bidderId, 'Bid did not come from bidder!');

            responseObj = roundDb.select('key', '=', 'response').fetch()[0];
            responseObj.player.should.equal(
                respondentId, 'Response did not come from respondent!');
            responseObj.value.from.should.equal(
                bidderId, 'Response contains incorrect bidder ID!');
        }
    });
});
