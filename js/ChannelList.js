/**
 * # ChannelList widget for nodeGame
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
        var text, textElem;

        content = o.content;
        if ('object' === typeof content) {
            switch (o.x) {
            case 0:
                text = content.name;
                break;

            case 1:
                text = '' + content.nGameRooms;
                break;

            case 2:
                text = content.nConnClients +
                       ' (+' + content.nDisconnClients + ')';
                break;

            case 3:
                text = content.nConnPlayers +
                       ' (+' + content.nDisconnPlayers + ')';
                break;

            case 4:
                text = content.nConnAdmins +
                       ' (+' + content.nDisconnAdmins + ')';
                break;
            }

            textElem = document.createElement('span');

            if (o.x === 0) {
                textElem.innerHTML = '<a class="ng_clickable">' + text + '</a>';
                textElem.onclick = function() {
                    // Signal the RoomList to switch channels:
                    node.emit('USECHANNEL', content.name);
                };
            }
            else {
                textElem.innerHTML = text;
            }

            if (o.x >= 2) {  // number of clients/players/admins
                textElem.title = 'Connected (+ Disconnected)';
            }
        }
        else {
            textElem = document.createTextNode(content);
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
        this.table.setHeader(['Name', '# Rooms',
                              '# Clients', '# Players', '# Admins']);
    }

    ChannelList.prototype.refresh = function() {
        // Ask server for channel list:
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
            that.writeChannels(msg.data);
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
                        [chanObj, chanObj, chanObj, chanObj, chanObj]);
            }
        }

        this.table.parse();
    };

})(node);
