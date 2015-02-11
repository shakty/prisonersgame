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
        // Assuming two players.
        db.groupBy('player').length.should.equal(2);
    });
});

describe('Bidding rounds', function() {
    it('should have the correct number of repetitions', function() {
        // Maximum round should equal the repetition number in the settings.
        Math.max.apply(null,
            db.select('stage.stage', '=', 5)
              .fetchValues('stage.round')['stage.round']
        ).should.equal(gameSettings.REPEAT);
    });
});
