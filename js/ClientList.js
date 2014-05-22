/**
 * # ClientList widget for nodeGame
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

    node.widgets.register('ClientList', ClientList);

    var JSUS = node.JSUS,
        Table = node.window.Table,
        GameStage = node.GameStage;

    // ## Defaults

    ClientList.defaults = {};
    ClientList.defaults.id = 'clientlist';
    ClientList.defaults.fieldset = {
        legend: 'Clients',
        id: 'clientlist_fieldset'
    };

    // ## Meta-data

    ClientList.version = '0.1.0';
    ClientList.description = 'Visually display all clients in a room.';

    // ## Dependencies

    ClientList.dependencies = {
        JSUS: {},
        Table: {}
    };

    function renderCell(o) {
        var content;
        var text, textElem;

        content = o.content;
        textElem = document.createElement('span');
        if ('object' === typeof content) {
            switch (o.x) {
            case 0:
                text = content.id;
                break;

            case 1:
                text = content.admin ? 'admin' : 'player';
                break;
            
            case 2:
                text = GameStage.toHash(content.stage, 'S.s.r');
                break;
            
            case 3:
                text = content.disconnected ? 'disconnected' : 'connected';
                break;
            
            case 4:
                text = content.sid;
                break;

            default:
                text = 'N/A';
                break;
            }

            textElem.appendChild(document.createTextNode(text));
            textElem.onclick = function() {
                alert(content.id);
            };
        }
        else {
            textElem = document.createTextNode(content);
        }

        return textElem;
    }

    function ClientList(options) {
        this.id = options.id;

        this.root = null;
        this.roomId = options.roomId || null;
        this.table = new Table({
            render: {
                pipeline: renderCell,
                returnAt: 'first'
            }
        });

        // Create header:
        this.table.setHeader(['ID', 'Type', 'Stage', 'Connection', 'SID']);
    }

    ClientList.prototype.getRoot = function() {
        return this.root;
    };

    ClientList.prototype.setRoom = function(roomId) {
        this.roomId = roomId;
    };

    ClientList.prototype.refresh = function() {
        if ('string' !== typeof this.roomId) return;

        // Ask server for client list:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: {
                type:   'CLIENTS',
                roomId: this.roomId
            }
        }));

        this.table.parse();
    };

    ClientList.prototype.append = function(root, ids) {
        var that;
        var button;

        that = this;

        this.root = root;

        // Add client table:
        root.appendChild(this.table.table);

        // Add buttons for setup/start/stop/pause/resume:
        button = document.createElement('button');
        button.innerHTML = 'Setup';
        button.onclick = function() {
            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'ROOMCOMMAND',
                data: {
                    type:   'SETUP',
                    roomId: that.roomId
                }
            }));
        };
        root.appendChild(button);

        button = document.createElement('button');
        button.innerHTML = 'Start';
        button.onclick = function() {
            //node.remoteCommand('start', 'ROOM_' + that.roomId);
            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'ROOMCOMMAND',
                data: {
                    type:      'START',
                    roomId:    that.roomId,
                    doPlayers: false
                }
            }));
        };
        root.appendChild(button);

        button = document.createElement('button');
        button.innerHTML = 'Stop';
        button.onclick = function() {
            //node.remoteCommand('stop', 'ROOM_' + that.roomId);
            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'ROOMCOMMAND',
                data: {
                    type:      'STOP',
                    roomId:    that.roomId,
                    doPlayers: true
                }
            }));
        };
        root.appendChild(button);

        button = document.createElement('button');
        button.innerHTML = 'Pause';
        button.onclick = function() {
            //node.remoteCommand('pause', 'ROOM_' + that.roomId);
            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'ROOMCOMMAND',
                data: {
                    type:      'PAUSE',
                    roomId:    that.roomId,
                    doPlayers: true
                }
            }));
        };
        root.appendChild(button);

        button = document.createElement('button');
        button.innerHTML = 'Resume';
        button.onclick = function() {
            //node.remoteCommand('resume', 'ROOM_' + that.roomId);
            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'ROOMCOMMAND',
                data: {
                    type:      'RESUME',
                    roomId:    that.roomId,
                    doPlayers: true
                }
            }));
        };
        root.appendChild(button);

        // Query server:
        this.refresh();

        return root;
    };

    ClientList.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_CLIENTS', function(msg) {
            that.writeClients(msg.data);
        });

        // Listen for events from RoomList saying to switch rooms:
        node.on('USEROOM', function(roomId) {
            that.setRoom(roomId);

            // Query server:
            that.refresh();
        });
    };

    ClientList.prototype.writeClients = function(clients) {
        var clientName, clientObj;

        this.table.clear(true);

        // Create a row for each client:
        for (clientName in clients) {
            if (clients.hasOwnProperty(clientName)) {
                clientObj = clients[clientName];

                this.table.addRow(
                    [clientObj, clientObj, clientObj, clientObj, clientObj]);
            }
        }

        this.table.parse();
    };

})(node);
