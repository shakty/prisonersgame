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
        this.channelName = options.channel || null;
        this.roomName = options.room || null;
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

    ClientList.prototype.setChannel = function(channelName) {
        this.channelName = channelName;
    };

    ClientList.prototype.setRoom = function(roomName) {
        this.roomName = roomName;
    };

    ClientList.prototype.refresh = function() {
        if ('string' !== typeof this.channelName) return;
        if ('string' !== typeof this.roomName) return;

        // Ask server for client list:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: {
                type:    'CLIENTS',
                channel: this.channelName,
                room: this.roomName
            }
        }));

        this.table.parse();
    };

    ClientList.prototype.append = function(root, ids) {
        root.appendChild(this.table.table);

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

        // Listen for events from ChannelList saying to switch channels:
        node.on('USECHANNEL', function(channel) {
            that.setChannel(channel);
            that.setRoom(null);
        });

        // Listen for events from RoomList saying to switch rooms:
        node.on('USEROOM', function(room) {
            that.setRoom(room);

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
