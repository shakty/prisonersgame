/**
 * # GameList widget for nodeGame
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Shows current, previous and next state.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('GameList', GameList);

    var JSUS = node.JSUS,
        Table = node.window.Table;

    // ## Meta-data

    GameList.version = '0.1.0';
    GameList.description = 'Visually display available games on the server.';

    //GameList.title = 'Games';
    GameList.className = 'gamelist';

    // ## Dependencies

    GameList.dependencies = {
        JSUS: {},
        Table: {}
    };

    function renderCell(o, that) {
        var content;
        var text, textElem;

        content = o.content;
        if ('object' === typeof content) {
            switch (o.y) {
            case 0:
                text = content.info.name;
                break;
            }

            textElem = document.createElement('span');
            textElem.innerHTML = '<a class="ng_clickable">' + text + '</a>';
            textElem.onclick = function() {
                that.selectedGame = content.info.name;
                that.writeGameInfo();
                that.selectedTreatment = null;
                that.writeTreatmentInfo();
            };
        }
        else {
            textElem = document.createTextNode(content);
        }

        return textElem;
    }

    function GameList(options) {
        var that;

        that = this;

        this.id = options.id;

        this.gamesTable = new Table({
            render: {
                pipeline: function(o) { return renderCell(o, that); },
                returnAt: 'first'
            }
        });

        this.gamesTableDiv = document.createElement('div');
        JSUS.style(this.gamesTableDiv, {float: 'left'});
        this.gamesTableDiv.appendChild(this.gamesTable.table);

        this.detailTable = new Table();
        this.detailTable.setLeft(
                ['Name', 'Aliases', 'Description', 'Treatments']);

        this.gameDetailDiv = document.createElement('div');
        JSUS.style(this.gameDetailDiv, {float: 'left'});
        this.gameDetailDiv.appendChild(this.detailTable.table);

        this.treatmentTable = new Table();
        this.treatmentTable.setHeader(['Key', 'Value']);

        this.treatmentDiv = document.createElement('div');
        JSUS.style(this.treatmentDiv, {float: 'left'});
        this.treatmentDiv.appendChild(this.treatmentTable.table);

        this.gameData = {};
        this.selectedGame = null;
        this.selectedTreatment = null;
    }

    GameList.prototype.refresh = function() {
        // Ask server for games:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: {
                type: 'GAMES'
            }
        }));

        this.gamesTable.parse();
    };

    GameList.prototype.append = function() {
        this.bodyDiv.appendChild(this.gamesTableDiv);
        this.bodyDiv.appendChild(this.gameDetailDiv);
        this.bodyDiv.appendChild(this.treatmentDiv);

        // Query server:
        this.refresh();
    };

    GameList.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_GAMES', function(msg) {
            that.gameData = msg.data;
            that.writeGames();

            // If currently selected game or treatment disappeared, deselect it:
            if (!that.gameData.hasOwnProperty(that.selectedGame)) {
                that.selectedGame = null;
                that.selectedTreatment = null;
            }
            else if (!that.gameData[that.selectedGame].treatments
                      .hasOwnProperty(that.selectedTreatment)) {

                that.selectedTreatment = null;
            }

            that.writeGameInfo();
            that.writeTreatmentInfo();
        });
    };

    GameList.prototype.writeGames = function() {
        var gameKey, gameObj;

        this.gamesTable.clear(true);

        // Create a row for each game:
        for (gameKey in this.gameData) {
            if (this.gameData.hasOwnProperty(gameKey)) {
                gameObj = this.gameData[gameKey];

                if (gameObj.info.name === gameKey) {  // don't show aliases
                    this.gamesTable.addRow([gameObj]);
                }
            }
        }

        this.gamesTable.parse();
    };

    GameList.prototype.writeGameInfo = function() {
        var selGame;
        var treatment, treatmentList, elem;
        var firstElem;
        var that;

        that = this;
        this.detailTable.clear(true);
        this.detailTable.parse();

        selGame = this.gameData[this.selectedGame];
        if (!selGame) return;

        this.detailTable.addRow([selGame.info.name]);
        this.detailTable.addRow([selGame.info.alias.join(', ')]);
        this.detailTable.addRow([selGame.info.descr]);

        treatmentList = document.createElement('span');
        firstElem = true;
        for (treatment in selGame.treatments) {
            if (selGame.treatments.hasOwnProperty(treatment)) {
                // Add ', ' between elements:
                if (!firstElem) {
                    elem = document.createElement('span');
                    elem.innerHTML = ', ';
                    treatmentList.appendChild(elem);
                }
                else {
                    firstElem = false;
                }

                elem = document.createElement('span');
                elem.innerHTML = '<a class="ng_clickable">' + treatment +'</a>';
                elem.onclick = function(t) {
                    return function() {
                        that.selectedTreatment = t;
                        that.writeTreatmentInfo();
                    };
                }(treatment);
                treatmentList.appendChild(elem);
            }
        }
        this.detailTable.addRow([treatmentList]);

        this.detailTable.parse();
    };

    GameList.prototype.writeTreatmentInfo = function() {
        var selGame;
        var selTreatment;
        var prop;

        this.treatmentTable.clear(true);
        this.treatmentTable.parse();

        selGame = this.gameData[this.selectedGame];
        if (!selGame) return;

        selTreatment = selGame.treatments[this.selectedTreatment];
        if (!selTreatment) return;

        this.treatmentTable.addRow(['<name>', this.selectedTreatment]);
        // Create a row for each option:
        for (prop in selTreatment) {
            if (selTreatment.hasOwnProperty(prop)) {
                this.treatmentTable.addRow([prop, selTreatment[prop]]);
            }
        }

        this.treatmentTable.parse();
    };

})(node);
