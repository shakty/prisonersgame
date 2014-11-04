/**
 * # ChannelList widget for nodeGame
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Shows list of channels on the server.
 *
 * www.nodegame.org
 * ---
 */
(function(node) {

    "use strict";

    node.widgets.register('ChannelList', ChannelList);

    var JSUS = node.JSUS,
        Table = node.window.Table;

    // ## Meta-data

    ChannelList.version = '0.1.0';
    ChannelList.description = 'Visually display all channels on the server.';

    ChannelList.title = 'Channels';
    ChannelList.className = 'channellist';

    // ## Dependencies

    ChannelList.dependencies = {
        JSUS: {},
        Table: {}
    };

    function renderCell(o) {
        var content;
        var textElem;

        content = o.content;
        textElem = document.createElement('span');

        if (o.y === 0) {
            textElem.innerHTML =
                '<a class="ng_clickable">' + content + '</a>';
            textElem.onclick = function() {
                // Signal the RoomList to switch channels:
                node.emit('USECHANNEL', content);
            };
        }
        else {
            textElem.innerHTML = content;
        }

        if (o.y >= 2) {  // number of clients/players/admins
            textElem.title = 'Connected (+ Disconnected)';
        }

        return textElem;
    }

    function ChannelList(options) {
        this.id = options.id;

        this.table = new Table({
            render: {
                pipeline: renderCell,
                returnAt: 'first'
            }
        });

        // Create header:
        this.table.setHeader(['Name', 'Rooms',
                              'Clients', 'Players', 'Admins']);

        this.waitingForServer = false;
    }

    ChannelList.prototype.refresh = function() {
        // Ask server for channel list:
        this.waitingForServer = true;
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: {
                type:      'CHANNELS',
                extraInfo: true
            }
        }));

        this.table.parse();
    };

    ChannelList.prototype.append = function() {
        this.bodyDiv.appendChild(this.table.table);

        // Query server:
        this.refresh();
    };

    ChannelList.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_CHANNELS', function(msg) {
            if (that.waitingForServer) {
                that.waitingForServer = false;
                that.writeChannels(msg.data);
            }
        });
    };

    ChannelList.prototype.writeChannels = function(channels) {
        var chanKey, chanObj;

        this.table.clear(true);

        // Create a row for each channel:
        for (chanKey in channels) {
            if (channels.hasOwnProperty(chanKey)) {
                chanObj = channels[chanKey];

                this.table.addRow(
                 [chanObj.name, '' + chanObj.nGameRooms,
                  chanObj.nConnClients + ' (+' + chanObj.nDisconnClients + ')',
                  chanObj.nConnPlayers + ' (+' + chanObj.nDisconnPlayers + ')',
                  chanObj.nConnAdmins + ' (+' + chanObj.nDisconnAdmins + ')']);
            }
        }

        this.table.parse();
    };

})(node);
