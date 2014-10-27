/**
 * # RoomList widget for nodeGame
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Shows list of rooms in a channel.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('RoomList', RoomList);

    var JSUS = node.JSUS,
        Table = node.window.Table;

    // ## Meta-data

    RoomList.version = '0.1.0';
    RoomList.description = 'Visually display all rooms in a channel.';

    RoomList.title = 'Rooms';
    RoomList.className = 'roomlist';

    // ## Dependencies

    RoomList.dependencies = {
        JSUS: {},
        Table: {}
    };

    function renderCell(o) {
        var elem;

        if (o.y === 0) {
            //elem = document.createElement('span');
            //elem.innerHTML =
            //    '<a class="ng_clickable">' + o.content.name + '</a>';

            //elem.onclick = function() {
            //    // Signal the ClientList to switch rooms:
            //    node.emit('USEROOM', {
            //        id: o.content.id,
            //        name: o.content.name
            //    });
            //};

            elem = document.createTextNode(o.content.name);
        }
        else {
            elem = document.createTextNode(o.content);
        }

        return elem;
    }

    function RoomList(options) {
        this.id = options.id;

        this.channelName = options.channel || null;
        this.table = new Table({
            render: {
                pipeline: renderCell,
                returnAt: 'first'
            }
        });

        // Create header:
        this.table.setHeader(['Name', 'ID',
                              'Clients', 'Players', 'Admins']);

        this.waitingForServer = false;
    }

    RoomList.prototype.setChannel = function(channelName) {
        this.channelName = channelName;
    };

    RoomList.prototype.refresh = function() {
        if ('string' !== typeof this.channelName) return;

        // Ask server for room list:
        this.waitingForServer = true;
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: {
                type:    'ROOMS',
                channel: this.channelName
            }
        }));

        this.table.parse();
    };

    RoomList.prototype.append = function() {
        // Hide the panel initially:
        this.panelDiv.style.display = 'none';

        this.bodyDiv.appendChild(this.table.table);

        // Query server:
        this.refresh();
    };

    RoomList.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_ROOMS', function(msg) {
            if (that.waitingForServer) {
                that.waitingForServer = false;

                // Update the contents:
                that.writeRooms(msg.data);
                that.updateTitle();

                // Show the panel:
                that.panelDiv.style.display = '';
            }
        });

        // Listen for events from ChannelList saying to switch channels:
        node.on('USECHANNEL', function(channel) {
            that.setChannel(channel);

            // Query server:
            that.refresh();
        });
    };

    RoomList.prototype.writeRooms = function(rooms) {
        var roomName, roomObj;

        this.table.clear(true);

        // Create a row for each room:
        for (roomName in rooms) {
            if (rooms.hasOwnProperty(roomName)) {
                roomObj = rooms[roomName];

                this.table.addRow(
                        [{id: roomObj.id, name: roomObj.name}, roomObj.id,
                         '' + roomObj.nClients, '' + roomObj.nPlayers,
                         '' + roomObj.nAdmins]);
            }
        }

        this.table.parse();
    };

    RoomList.prototype.updateTitle = function() {
        var ol, li;

        // Use breadcrumbs of the form "<channelname> / Rooms".
        ol = document.createElement('ol');
        ol.className = 'breadcrumb';

        li = document.createElement('li');
        li.innerHTML = this.channelName;
        li.className = 'active';
        ol.appendChild(li);

        li = document.createElement('li');
        li.innerHTML = 'Rooms';
        ol.appendChild(li);

        this.setTitle(ol);
    };

})(node);
