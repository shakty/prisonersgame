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
        this.roomLogicId = null;
        this.channelTable = new Table();
        this.roomTable = new Table();
        this.clientTable = new Table({
            render: {
                pipeline: renderClientCell,
                returnAt: 'first'
            }
        });

        this.waitingForChannels = false;
        this.waitingForRooms = false;
        this.waitingForClients = false;

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
        this.msgBar = {};
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
        this.roomLogicId = null;

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
        this.waitingForChannels = true;
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
        this.waitingForRooms = true;
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
        this.waitingForClients = true;
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
        var commandPanel, commandPanelHeading, commandPanelBody;
        var buttonDiv, button, forceCheckbox, label;
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
        this.clientsField = W.getTextArea();
        this.clientsField.rows = 1;
        this.clientsField.style['vertical-align'] = 'top';
        selectionDiv.appendChild(this.clientsField);
        recipientSelector = W.getRecipientSelector();
        recipientSelector.onchange = function() {
            that.clientsField.value = recipientSelector.value;
        };
        selectionDiv.appendChild(recipientSelector);
        selectionDiv.style['padding'] = '10px 0px';
        selectionDiv.style['border-top'] = '1px solid #ddd';
        selectionDiv.style['border-bottom'] = '1px solid #ddd';
        selectionDiv.style['margin'] = '10px 0px';

        commandPanel = W.addDiv(this.bodyDiv, undefined,
                {className: ['panel', 'panel-default', 'commandbuttons']});
        commandPanelHeading = W.addDiv(commandPanel, undefined,
                {className: ['panel-heading']});
        commandPanelHeading.innerHTML = 'Commands';
        commandPanelBody = W.addDiv(commandPanel, undefined,
                {className: ['panel-body', 'commandbuttons']});

        // Add row for buttons:
        buttonDiv = document.createElement('div');
        commandPanelBody.appendChild(buttonDiv);

        // Force checkbox:
        label = document.createElement('label');
        forceCheckbox = document.createElement('input');
        forceCheckbox.type = 'checkbox';
        forceCheckbox.style['margin-left'] = '5px';
        label.appendChild(forceCheckbox);
        label.appendChild(document.createTextNode(' Force'));

        // Add buttons for setup/start/stop/pause/resume:
        buttonDiv.appendChild(this.createRoomCommandButton(
                    'SETUP',  'Setup', forceCheckbox));
        buttonDiv.appendChild(this.createRoomCommandButton(
                    'START',  'Start', forceCheckbox));
        buttonDiv.appendChild(this.createRoomCommandButton(
                    'STOP',   'Stop', forceCheckbox));
        buttonDiv.appendChild(this.createRoomCommandButton(
                    'PAUSE',  'Pause', forceCheckbox));
        buttonDiv.appendChild(this.createRoomCommandButton(
                    'RESUME', 'Resume', forceCheckbox));

        buttonDiv.appendChild(label);

        // Add StateBar:
        this.appendStateBar(commandPanelBody);

        // Add a table for buttons:
        buttonTable = document.createElement('table');
        commandPanelBody.appendChild(buttonTable);

        // Add buttons for disable right click/ESC, prompt on leave, waitscreen.
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

        // Add bot-start button:
        button = document.createElement('button');
        button.innerHTML = 'Start bot';
        button.onclick = function() {
            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'STARTBOT',
            }));
        };
        commandPanelBody.appendChild(button);

        // Add MsgBar:
        this.appendMsgBar();


        // Query server:
        this.refreshChannels();

        this.channelTable.parse();
    };

    ClientList.prototype.listeners = function() {
        var that;

        that = this;

        // Listen for server reply:
        node.on.data('INFO_CHANNELS', function(msg) {
            if (that.waitingForChannels) {
                that.waitingForChannels = false;

                // Update the contents:
                that.writeChannels(msg.data);
                that.updateTitle();
            }
        });

        node.on.data('INFO_ROOMS', function(msg) {
            if (that.waitingForRooms) {
                that.waitingForRooms = false;

                // Update the contents:
                that.writeRooms(msg.data);
                that.updateTitle();
            }
        });

        node.on.data('INFO_CLIENTS', function(msg) {
            if (that.waitingForClients) {
                that.waitingForClients = false;

                // Update the contents:
                that.roomLogicId = msg.data.logicId;
                that.writeClients(msg.data);
                that.updateTitle();
            }
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

    ClientList.prototype.writeClients = function(msg) {
        var i;
        var clientName, clientObj, clientType;
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
        for (clientName in msg.clients) {
            if (msg.clients.hasOwnProperty(clientName)) {
                clientObj = msg.clients[clientName];

                // Determine client type.
                if (clientObj.id === node.player.id) {
                    clientType = 'monitor';
                }
                else if (clientObj.id === this.roomLogicId) {
                    clientType = 'logic';
                }
                else if (clientObj.admin) {
                    clientType = 'admin';
                }
                else {
                    clientType = 'player';
                }

                this.clientTable.addRow(
                    [{id: clientObj.id, prevSel: prevSel, that: this},
                     clientObj.id,
                     clientType,
                     GameStage.toHash(clientObj.stage, 'S.s.r'),
                     clientObj.disconnected ? 'disconnected' : 'connected',
                     clientObj.sid]);
            }
        }

        this.clientTable.parse();
        this.updateSelection(false);
    };

    // Returns the array of client IDs that are selected with the checkboxes.
    ClientList.prototype.getSelectedCheckboxes = function() {
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

    // Returns the array of client IDs that are selected using the text-field.
    ClientList.prototype.getSelectedClients = function() {
        try {
            return JSUS.parse(this.clientsField.value);
        }
        catch (ex) {
            return this.clientsField.value;
        }
    };

    ClientList.prototype.updateTitle = function() {
        var ol, li;

        // Use breadcrumbs of the form "<channelname> / <roomname> / Clients".
        ol = document.createElement('ol');
        ol.className = 'breadcrumb';

        li = document.createElement('li');
        li.innerHTML = this.channelName || 'No channel selected';
        li.className = 'active';
        ol.appendChild(li);

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

    ClientList.prototype.appendMsgBar = function() {
        var that;
        var fields, i, field;
        var table, tmpElem;
        var advButton, sendButton;
        var validateTableMsg, parseFunction;

        that = this;

        this.msgBar.id = 'clientlist_msgbar';

        this.msgBar.recipient = null;
        this.msgBar.actionSel = null;
        this.msgBar.targetSel = null;

        this.msgBar.table = new Table();
        this.msgBar.tableAdvanced = new Table();


        // init

        // Create fields.
        fields = ['action', 'target', 'text', 'data', 'from', 'priority',
                  'reliable', 'forward', 'session', 'stage', 'created', 'id'];

        for (i = 0; i < fields.length; ++i) {
            field = fields[i];

            // Put ACTION, TARGET, TEXT, DATA in the first table which is
            // always visible, the other fields in the "advanced" table which
            // is hidden by default.
            table = i < 4 ? this.msgBar.table : this.msgBar.tableAdvanced;

            table.add(field, i, 0);
            if (field === 'data') {
                tmpElem = W.getTextArea(
                        this.msgBar.id + '_' + field, {tabindex: i+1});
                tmpElem.rows = 1;
                table.add(tmpElem, i, 1);
            }
            else {
                table.add(W.getTextInput(
                        this.msgBar.id + '_' + field, {tabindex: i+1}), i, 1);
            }

            if (field === 'action') {
                this.msgBar.actionSel = W.getActionSelector(
                        this.msgBar.id + '_actions');
                W.addAttributes2Elem(this.msgBar.actionSel,
                        {tabindex: fields.length+2});
                table.add(this.msgBar.actionSel, i, 2);
                this.msgBar.actionSel.onchange = function() {
                    W.getElementById(that.msgBar.id + '_action').value =
                        that.msgBar.actionSel.value;
                };
            }
            else if (field === 'target') {
                this.msgBar.targetSel = W.getTargetSelector(
                        this.msgBar.id + '_targets');
                W.addAttributes2Elem(this.msgBar.targetSel,
                        {tabindex: fields.length+3});
                table.add(this.msgBar.targetSel, i, 2);
                this.msgBar.targetSel.onchange = function() {
                    W.getElementById(that.msgBar.id + '_target').value =
                        that.msgBar.targetSel.value;
                };
            }
        }

        this.msgBar.table.parse();
        this.msgBar.tableAdvanced.parse();


        // helper functions
        validateTableMsg = function(e, msg) {
            var key, value;

            if (msg._invalid) return;

            if (e.y === 2) return;

            if (e.y === 0) {
                // Saving the value of last key.
                msg._lastKey = e.content;
                return;
            }

            // Fetching the value of last key.
            key = msg._lastKey;
            value = e.content.value;

            if (key === 'stage' || key === 'to' || key === 'data') {
                try {
                    value = JSUS.parse(e.content.value);
                }
                catch (ex) {
                    value = e.content.value;
                }
            }

            // Validate input.
            if (key === 'action') {
                if (value.trim() === '') {
                    alert('Missing "action" field');
                    msg._invalid = true;
                }
                else {
                    value = value.toLowerCase();
                }

            }
            else if (key === 'target') {
                if (value.trim() === '') {
                    alert('Missing "target" field');
                    msg._invalid = true;
                }
                else {
                    value = value.toUpperCase();
                }
            }

            // Assigning the value.
            msg[key] = value;
        };
        parseFunction = function() {
            var msg, gameMsg;

            msg = {};

            that.msgBar.table.forEach(validateTableMsg, msg);
            if (msg._invalid) return null;
            that.msgBar.tableAdvanced.forEach(validateTableMsg, msg);

            // validate 'to' field:
            msg.to = that.getSelectedClients();
            if ('number' === typeof msg.to) {
                msg.to = '' + msg.to;
            }
            if ((!JSUS.isArray(msg.to) && 'string' !== typeof msg.to) ||
                ('string' === typeof to && to.trim() === '')) {

                alert('Invalid "to" field');
                msg._invalid = true;
            }

            if (msg._invalid) return null;
            delete msg._lastKey;
            delete msg._invalid;
            gameMsg = node.msg.create(msg);
            node.info('MsgBar msg created. ' +  gameMsg.toSMS());
            return gameMsg;
        };



        // append

        // Create sub-panel for MsgBar
        this.msgBar.panelDiv = W.addDiv(this.bodyDiv, undefined,
                {className: ['panel', 'panel-default', 'msgbar']});
        this.msgBar.headingDiv = W.addDiv(this.msgBar.panelDiv, undefined,
                {className: ['panel-heading']});
        this.msgBar.headingDiv.innerHTML = 'Custom Message';
        this.msgBar.bodyDiv = W.addDiv(this.msgBar.panelDiv, undefined,
                {className: ['panel-body', 'msgbar']});

        // Show table of basic fields.
        this.msgBar.bodyDiv.appendChild(this.msgBar.table.table);

        this.msgBar.bodyDiv.appendChild(this.msgBar.tableAdvanced.table);
        this.msgBar.tableAdvanced.table.style.display = 'none';

        // Show 'Send' button.
        sendButton = W.addButton(this.msgBar.bodyDiv);
        sendButton.onclick = function() {
            var msg = parseFunction();

            if (msg) {
                node.socket.send(msg);
            }
        };

        // Show a button that expands the table of advanced fields.
        advButton = W.addButton(this.msgBar.bodyDiv, undefined,
                'Toggle advanced options');
        advButton.onclick = function() {
            that.msgBar.tableAdvanced.table.style.display =
                that.msgBar.tableAdvanced.table.style.display === '' ?
                'none' : '';
        };
    };

    ClientList.prototype.appendStateBar = function(root) {
        var that;
        var div;
        var sendButton, stageField;

        div = document.createElement('div');
        root.appendChild(div);

        div.appendChild(document.createTextNode('Change stage to: '));
        stageField = W.getTextInput();
        div.appendChild(stageField);

        sendButton = node.window.addButton(div);

        that = this;

        sendButton.onclick = function() {
            var to;
            var stage;

            // Should be within the range of valid values
            // but we should add a check
            to = that.getSelectedClients();

            try {
                stage = new node.GameStage(stageField.value);
                node.remoteCommand('goto_step', to, stage);
            }
            catch (e) {
                node.err('Invalid stage, not sent: ' + e);
            }
        };
    };

    /**
     * Make a button that sends a given ROOMCOMMAND.
     */
    ClientList.prototype.createRoomCommandButton =
        function(command, label, forceCheckbox) {

        var that;
        var button;

        that = this;

        button = document.createElement('button');
        button.innerHTML = label;
        button.onclick = function() {
            var clients;
            var doLogic;

            // Get selected clients.
            clients = that.getSelectedClients();
            if (!clients || clients.length === 0) return;
            // If the room's logic client is selected, handle it specially.
            doLogic = !!JSUS.removeElement(that.roomLogicId, clients);

            node.socket.send(node.msg.create({
                target: 'SERVERCOMMAND',
                text:   'ROOMCOMMAND',
                data: {
                    type:    command,
                    roomId:  that.roomId,
                    doLogic: doLogic,
                    clients: clients,
                    force:   forceCheckbox.checked
                }
            }));
        };

        return button;
    };

})(node);
