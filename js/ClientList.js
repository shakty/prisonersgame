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

    function renderCell(o) {
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
        this.table = new Table({
            render: {
                pipeline: renderCell,
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

        // Create header:
        this.table.setHeader([this.selectAll, 'ID', 'Type', 'Stage',
                              'Connection', 'SID']);
    }

    ClientList.prototype.setChannel = function(channelName) {
        if (!channelName || channelName !== this.channelName) {
            this.setRoom(null, null);
        }

        this.channelName = channelName;
    };

    ClientList.prototype.setRoom = function(roomId, roomName) {
        this.roomId = roomId;
        this.roomName = roomName;

        if (!this.roomId || !this.roomName) {
            // Hide this panel if no room is selected:
            if (this.panelDiv) {
                this.panelDiv.style.display = 'none';
            }
        }
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
    };

    ClientList.prototype.append = function() {
        var that;
        var button;

        that = this;

        // Hide the panel initially:
        this.setRoom(null, null);

        // Add client table:
        this.bodyDiv.appendChild(this.table.table);

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
        this.bodyDiv.appendChild(button);

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
        this.bodyDiv.appendChild(button);

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
        this.bodyDiv.appendChild(button);

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
        this.bodyDiv.appendChild(button);

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
        this.bodyDiv.appendChild(button);

        // Query server:
        this.refresh();
    };

    ClientList.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_CLIENTS', function(msg) {
            // Update the contents:
            that.writeClients(msg.data);
            that.updateTitle();

            // Show the panel:
            that.panelDiv.style.display = '';
        });

        // Listen for events from ChannelList saying to switch channels:
        node.on('USECHANNEL', function(channel) {
            that.setChannel(channel);
        });

        // Listen for events from RoomList saying to switch rooms:
        node.on('USEROOM', function(roomInfo) {
            that.setRoom(roomInfo.id, roomInfo.name);

            // Query server:
            that.refresh();
        });
    };

    ClientList.prototype.writeClients = function(clients) {
        var i;
        var clientName, clientObj;
        var prevSel;

        // Save previous state of selection:
        prevSel = {};
        for (i in this.checkboxes) {
            if (this.checkboxes.hasOwnProperty(i)) {
                prevSel[i] = this.checkboxes[i].checked;
            }
        }

        this.checkboxes = {};
        this.table.clear(true);

        // Create a row for each client:
        for (clientName in clients) {
            if (clients.hasOwnProperty(clientName)) {
                clientObj = clients[clientName];

                this.table.addRow(
                    [{id: clientObj.id, prevSel: prevSel, that: this},
                     clientObj.id,
                     {id: clientObj.id, admin: clientObj.admin},
                     GameStage.toHash(clientObj.stage, 'S.s.r'),
                     clientObj.disconnected ? 'disconnected' : 'connected',
                     clientObj.sid]);
            }
        }

        this.table.parse();
        this.updateSelection(false);
    };

    ClientList.prototype.updateTitle = function() {
        var ol, li;

        // Use breadcrumbs of the form "<channelname> / <roomname> / Clients".
        ol = document.createElement('ol');
        ol.className = 'breadcrumb';

        li = document.createElement('li');
        li.innerHTML = this.channelName;
        li.className = 'active';
        ol.appendChild(li);

        li = document.createElement('li');
        li.innerHTML = this.roomName;
        li.className = 'active';
        ol.appendChild(li);

        li = document.createElement('li');
        li.innerHTML = 'Clients';
        ol.appendChild(li);

        this.setTitle(ol);
    };

    ClientList.prototype.updateSelection = function(useSelectAll) {
        var i;
        var allSelected, noneSelected;
        var recipientsElem, recipients;

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

        // Apply selection to the MsgBar:
        recipientsElem = document.getElementById('msgbar_to');
        if (recipientsElem) {
            recipients = [];
            for (i in this.checkboxes) {
                if (this.checkboxes.hasOwnProperty(i)) {
                    if (this.checkboxes[i].checked)
                    {
                        recipients.push(i);
                    }
                }
            }
            recipientsElem.value = JSON.stringify(recipients);
        }
    };

})(node);
