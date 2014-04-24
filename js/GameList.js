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

    // ## Defaults

    GameList.defaults = {};
    GameList.defaults.id = 'gamelist';
    GameList.defaults.fieldset = {
        legend: 'Games',
        id: 'gamelist_fieldset'
    };

    // ## Meta-data

    GameList.version = '0.1.0';
    GameList.description = 'Visually display available games on the server.';

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
            switch (o.x) {
            case 0:
                text = content.info.name;
                break;
            }

            textElem = document.createElement('span');
            textElem.appendChild(document.createTextNode(text));
            textElem.onclick = function() {
                that.selectedGame = content.info.name;
                that.writeGameInfo();
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
        this.root = null;

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
        this.detailTable.setLeft(['Name', 'Aliases', 'Description', 'Treatments']);

        this.gameDetailDiv = document.createElement('div');
        JSUS.style(this.gameDetailDiv, {float: 'left'});
        this.gameDetailDiv.appendChild(this.detailTable.table);

        this.gameData = {};
        this.selectedGame = null;
        this.selectedTreatment = null;
    }

    GameList.prototype.getRoot = function() {
        return this.root;
    };

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

    GameList.prototype.append = function(root, ids) {
        root.appendChild(this.gamesTableDiv);
        root.appendChild(this.gameDetailDiv);

        // Query server:
        this.refresh();

        // DEBUG dummy data, TODO: remove
        this.gameData = {
            gameA: {
                info: {
                    name:  'gameA',
                    alias: ['chess', 'chGame'],
                    descr: 'A game fit for a king!'
                },
                treatments: {
                    standard: {
                        poolSize: 2
                    },
                    extreme: {
                        poolSize: 4,
                        timeLimit: 50
                    }
                }
            },

            gameB: {
                info: {
                    name:  'gameB',
                    alias: [],
                    descr: 'Very fun game, you should play it.'
                },
                treatments: {
                    standard: {
                        poolSize: 3,
                        fizzLevel: 9001
                    }
                }
            }
        };
        this.writeGames();

        return root;
    };

    GameList.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_GAMES', function(msg) {
            this.gameData = msg.data;
            that.writeGames();

            // If currently selected game disappeared, deselect it:
            if (!that.gameData.hasOwnProperty(that.selectedGame)) {
                that.selectedGame = null;
            }

            that.writeGameInfo();
        });
    };

    GameList.prototype.writeGames = function() {
        var gameKey, gameObj;

        this.gamesTable.clear(true);

        // Create a row for each game:
        for (gameKey in this.gameData) {
            if (this.gameData.hasOwnProperty(gameKey)) {
                gameObj = this.gameData[gameKey];

                this.gamesTable.addRow([gameObj]);
            }
        }

        this.gamesTable.parse();
    };

    GameList.prototype.writeGameInfo = function() {
        var selGame;
        var treatment, treatmentList;

        this.detailTable.clear(true);

        selGame = this.gameData[this.selectedGame];
        if (!selGame) return;

        this.detailTable.addRow([selGame.info.name]);
        this.detailTable.addRow([selGame.info.alias.join(', ')]);
        this.detailTable.addRow([selGame.info.descr]);

        treatmentList = [];
        for (treatment in selGame.treatments) {
            if (selGame.treatments.hasOwnProperty(treatment)) {
                treatmentList.push(treatment);
            }
        }
        this.detailTable.addRow([treatmentList.join(', ')]);

        this.detailTable.parse();
    };

})(node);
