/**
 * # ClientList widget for nodeGame
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Shows list of clients and allows selection.
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

    // ## Meta-data

    ClientList.version = '0.1.0';
    ClientList.description = 'Visually display all clients in a room.';

    ClientList.title = 'Clients';
    ClientList.className = 'clientlist';

    // ## Dependencies

    ClientList.dependencies = {
        JSUS: {},
        Table: {}
    };

    function renderClientCell(o) {
        var content;
        var elem;

        content = o.content;
        if (JSUS.isElement(content)) {
            return content;
        }
        else if ('object' === typeof content) {
            switch (o.y) {
            case 0:
                elem = document.createElement('input');
                elem.type = 'checkbox';
                elem.onclick = function() {
                    content.that.updateSelection(false);
                };
                if (content.prevSel.hasOwnProperty(content.id)) {
                    elem.checked = content.prevSel[content.id];
                }
                else {
                    elem.checked = !content.that.selectAll.indeterminate &&
                        content.that.selectAll.checked;
                }
                content.that.checkboxes[content.id] = elem;
                break;

            case 2:
                elem = document.createElement('span');
                elem.innerHTML = content.admin ? 'admin' : 'player';
                // Highlight this monitor.
                if (content.id === node.player.id) {
                    elem.innerHTML += '*';
                    elem.title = 'This is the monitor itself.';
                }
                break;

            default:
                elem = document.createElement('span');
                elem.innerHTML = 'N/A';
                break;
            }
        }
        else {
            elem = document.createTextNode(content);
        }

        return elem;
    }

    function ClientList(options) {
        var that;

        that = this;

        this.id = options.id;

        this.channelName = options.channel || null;
        this.roomId = options.roomId || null;
        this.roomName = options.roomName || null;
        this.channelTable = new Table();
        this.roomTable = new Table();
        this.clientTable = new Table({
            render: {
                pipeline: renderClientCell,
                returnAt: 'first'
            }
        });

        // Maps client IDs to the selection checkbox elements:
        this.checkboxes = {};

        // Create "Select All" checkbox:
        this.selectAll = document.createElement('input');
        this.selectAll.type = 'checkbox';
        this.selectAll.checked = true;
        this.selectAll.title = 'Select All';
        this.selectAll.onclick = function() {
            that.updateSelection(true);
        };

        // Create header for client table:
        this.channelTable.setHeader(['Channel']);
        this.roomTable.setHeader(['Room']);
        this.clientTable.setHeader([this.selectAll, 'ID', 'Type', 'Stage',
                                   'Connection', 'SID']);

        this.clientsField = null;
    }

    ClientList.prototype.setChannel = function(channelName) {
        if (!channelName || channelName !== this.channelName) {
            // Hide room table if channel changed or no channel is selected:
            if (this.roomTable && this.roomTable.table.parentNode) {
                this.roomTable.table.parentNode.style.display = 'none';
            }
            this.setRoom(null, null);
        }

        this.channelName = channelName;

        this.refreshRooms();
    };

    ClientList.prototype.setRoom = function(roomId, roomName) {
        this.roomId = roomId;
        this.roomName = roomName;

        if (!this.roomId || !this.roomName) {
            // Hide client table if no room is selected:
            if (this.clientTable && this.clientTable.table.parentNode) {
                this.clientTable.table.parentNode.style.display = 'none';
            }
        }

        this.refreshClients();
    };

    ClientList.prototype.refreshChannels = function() {
        // Ask server for channel list:
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: {
                type:      'CHANNELS',
                extraInfo: true
            }
        }));
    };

    ClientList.prototype.refreshRooms = function() {
        // Ask server for room list:
        if ('string' !== typeof this.channelName) return;
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: {
                type:    'ROOMS',
                channel: this.channelName
            }
        }));
    };

    ClientList.prototype.refreshClients = function() {
        // Ask server for client list:
        if ('string' !== typeof this.roomId) return;
        node.socket.send(node.msg.create({
            target: 'SERVERCOMMAND',
            text:   'INFO',
            data: {
                type:   'CLIENTS',
                roomId: this.roomId
            }
        }));
    };

    ClientList.prototype.refresh = function() {
        this.refreshChannels();
        this.refreshRooms();
        this.refreshClients();
    };

    ClientList.prototype.append = function() {
        var that;
        var tableStructure;
        var buttonDiv, button;
        var buttonTable, tableRow, tableCell;
        var setupOpts, btnLabel;
        var selectionDiv, recipientSelector;

        that = this;

        // Hide the panel initially:
        this.setRoom(null, null);

        // Add tables in a 3x1 table element:
        tableStructure = document.createElement('table');
        this.bodyDiv.appendChild(tableStructure);
        tableRow = document.createElement('tr');
        tableRow.style['vertical-align'] = 'top';
        tableStructure.appendChild(tableRow);

        tableCell = document.createElement('td');
        tableCell.style['border-right'] = '1px solid #ccc';
        tableRow.appendChild(tableCell);
        tableCell.appendChild(this.channelTable.table);

        tableCell = document.createElement('td');
        tableRow.appendChild(tableCell);
        tableCell.style['border-right'] = '1px solid #ccc';
        tableCell.style.display = 'none';
        tableCell.appendChild(this.roomTable.table);

        tableCell = document.createElement('td');
        tableCell.style.display = 'none';
        tableRow.appendChild(tableCell);
        tableCell.appendChild(this.clientTable.table);

        // Add client selection field:
        selectionDiv = document.createElement('div');
        this.bodyDiv.appendChild(selectionDiv);
        selectionDiv.appendChild(document.createTextNode('Selected IDs: '));
        this.clientsField = W.getTextInput();
        selectionDiv.appendChild(this.clientsField);
        recipientSelector = W.getRecipientSelector();
        recipientSelector.onchange = function() {
            that.clientsField.value = recipientSelector.value;
        };
        selectionDiv.appendChild(recipientSelector);

        // Add row for buttons:
        buttonDiv = document.createElement('div');
        this.bodyDiv.appendChild(buttonDiv);

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
        buttonDiv.appendChild(button);

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
        buttonDiv.appendChild(button);

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
        buttonDiv.appendChild(button);

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
        buttonDiv.appendChild(button);

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
        buttonDiv.appendChild(button);


        // Add a table for buttons:
        buttonTable = document.createElement('table');
        this.bodyDiv.appendChild(buttonTable);

        // Add buttons for disable right click/ESC, prompt on leave, waitscreen
        setupOpts = {
            'Disable right-click': 'disableRightClick',
            'Disable Esc': 'noEscape',
            'Prompt on leave': 'promptOnleave',
            'Wait-screen': 'waitScreen'
        };

        for (btnLabel in setupOpts) {
            if (setupOpts.hasOwnProperty(btnLabel)) {
                tableRow = document.createElement('tr');
                buttonTable.appendChild(tableRow);

                tableCell = document.createElement('td');
                tableCell.innerHTML = btnLabel;
                tableRow.appendChild(tableCell);

                tableCell = document.createElement('td');
                tableRow.appendChild(tableCell);

                button = document.createElement('button');
                button.innerHTML = 'On';
                button.onclick = function(optName) {
                    return function() {
                        var opts = {};
                        opts[optName] = true;
                        node.remoteSetup('window', that.getSelectedClients(),
                                         opts);
                    };
                }(setupOpts[btnLabel]);
                tableCell.appendChild(button);

                button = document.createElement('button');
                button.innerHTML = 'Off';
                button.onclick = function(optName) {
                    return function() {
                        var opts = {};
                        opts[optName] = false;
                        node.remoteSetup('window', that.getSelectedClients(),
                                         opts);
                    };
                }(setupOpts[btnLabel]);
                tableCell.appendChild(button);
            }
        }


        // Query server:
        this.refreshChannels();

        this.channelTable.parse();
    };

    ClientList.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_CHANNELS', function(msg) {
            that.writeChannels(msg.data);
            that.updateTitle();
        });

        node.on.data('INFO_ROOMS', function(msg) {
            // Update the contents:
            that.writeRooms(msg.data);
            that.updateTitle();
        });

        node.on.data('INFO_CLIENTS', function(msg) {
            // Update the contents:
            that.writeClients(msg.data);
            that.updateTitle();
        });

        // Listen for events from ChannelList saying to switch channels:
        //node.on('USECHANNEL', function(channel) {
        //    that.setChannel(channel);
        //});

        // Listen for events from RoomList saying to switch rooms:
        //node.on('USEROOM', function(roomInfo) {
        //    that.setRoom(roomInfo.id, roomInfo.name);

        //    // Query server:
        //    that.refresh();
        //});
    };

    ClientList.prototype.writeChannels = function(channels) {
        var chanKey, chanObj;
        var elem;
        var that;

        that = this;

        this.channelTable.clear(true);

        // Create a clickable row for each channel:
        for (chanKey in channels) {
            if (channels.hasOwnProperty(chanKey)) {
                chanObj = channels[chanKey];

                elem = document.createElement('a');
                elem.className = 'ng_clickable';
                elem.innerHTML = chanObj.name;
                elem.onclick = function(o) {
                    return function() {
                        that.setChannel(o.name);
                    };
                }(chanObj);

                this.channelTable.addRow(elem);
            }
        }

        this.channelTable.parse();
    };

    ClientList.prototype.writeRooms = function(rooms) {
        var roomName, roomObj;
        var elem;
        var that;

        that = this;

        // Unhide table cell:
        this.roomTable.table.parentNode.style.display = '';

        this.roomTable.clear(true);

        // Create a clickable row for each room:
        for (roomName in rooms) {
            if (rooms.hasOwnProperty(roomName)) {
                roomObj = rooms[roomName];

                elem = document.createElement('a');
                elem.className = 'ng_clickable';
                elem.innerHTML = roomObj.name;
                elem.onclick = function(o) {
                    return function() {
                        that.setRoom(o.id, o.name);
                    };
                }(roomObj);

                this.roomTable.addRow(elem);
            }
        }

        this.roomTable.parse();
    };

    ClientList.prototype.writeClients = function(clients) {
        var i;
        var clientName, clientObj;
        var prevSel;

        // Unhide table cell:
        this.clientTable.table.parentNode.style.display = '';

        // Save previous state of selection:
        prevSel = {};
        for (i in this.checkboxes) {
            if (this.checkboxes.hasOwnProperty(i)) {
                prevSel[i] = this.checkboxes[i].checked;
            }
        }

        this.checkboxes = {};
        this.clientTable.clear(true);

        // Create a row for each client:
        for (clientName in clients) {
            if (clients.hasOwnProperty(clientName)) {
                clientObj = clients[clientName];

                this.clientTable.addRow(
                    [{id: clientObj.id, prevSel: prevSel, that: this},
                     clientObj.id,
                     {id: clientObj.id, admin: clientObj.admin},
                     GameStage.toHash(clientObj.stage, 'S.s.r'),
                     clientObj.disconnected ? 'disconnected' : 'connected',
                     clientObj.sid]);
            }
        }

        this.clientTable.parse();
        this.updateSelection(false);
    };

    // Returns the array of client IDs that are selected with the checkboxes.
    ClientList.prototype.getSelectedClients = function() {
        var result;
        var id;

        result = [];
        for (id in this.checkboxes) {
            if (this.checkboxes.hasOwnProperty(id)) {
               if (this.checkboxes[id].checked) {
                   result.push(id);
               }
            }
        }
        return result;
    };

    ClientList.prototype.updateTitle = function() {
        var ol, li;

        // Use breadcrumbs of the form "<channelname> / <roomname> / Clients".
        ol = document.createElement('ol');
        ol.className = 'breadcrumb';

        if (this.channelName) {
            li = document.createElement('li');
            li.innerHTML = this.channelName;
            li.className = 'active';
            ol.appendChild(li);
        }

        if (this.roomName) {
            li = document.createElement('li');
            li.innerHTML = this.roomName;
            li.className = 'active';
            ol.appendChild(li);

            li = document.createElement('li');
            li.innerHTML = 'Clients';
            ol.appendChild(li);
        }

        this.setTitle(ol);
    };

    ClientList.prototype.updateSelection = function(useSelectAll) {
        var i;
        var allSelected, noneSelected;
        var recipients;

        // Get state of selections:
        allSelected = true;
        noneSelected = true;
        for (i in this.checkboxes) {
            if (this.checkboxes.hasOwnProperty(i)) {
                if (this.checkboxes[i].checked)
                {
                    noneSelected = false;
                }
                else {
                    allSelected = false;
                }
            }
        }

        if (useSelectAll) {
            // Apply the "Select All" setting to the other checkboxes.
            if (!allSelected && !noneSelected) {
                // The state was indeterminate before; deselect everything:
                this.selectAll.checked = false;
            }
            if (this.selectAll.checked) {
                for (i in this.checkboxes) {
                    if (this.checkboxes.hasOwnProperty(i)) {
                        this.checkboxes[i].checked = true;
                    }
                }
            }
            else {
                for (i in this.checkboxes) {
                    if (this.checkboxes.hasOwnProperty(i)) {
                        this.checkboxes[i].checked = false;
                    }
                }
            }
        }
        else {
            // Apply the setting of the other checkboxes to "Select All".
            this.selectAll.checked = allSelected;
            this.selectAll.indeterminate = !noneSelected && !allSelected;
        }

        // Update the selection field:
        recipients = [];
        for (i in this.checkboxes) {
            if (this.checkboxes.hasOwnProperty(i)) {
                if (this.checkboxes[i].checked)
                {
                    recipients.push(i);
                }
            }
        }
        this.clientsField.value = JSON.stringify(recipients);
    };

})(node);
