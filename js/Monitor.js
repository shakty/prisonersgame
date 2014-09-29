function Monitor(node) {

    var stager = new node.Stager();

    stager.setOnInit(function() {
        var button, tabList, tmpElem;
        var tabContent, channelList, roomList, clientList;

        // Add refresh button:
        button = document.createElement('button');
        button.innerHTML = 'Refresh';
        button.onclick = function() {
            // Tell widgets to refresh themselves:
            channelList.refresh();
            roomList.refresh();
            clientList.refresh();
        };
        document.body.appendChild(button);

        // Tabs:
        tabList = document.createElement('ul');
        tabList.className = 'nav nav-tabs';
        tabList.setAttribute('role', 'tablist');
        document.body.appendChild(tabList);

        tmpElem = document.createElement('li');
        tmpElem.innerHTML =
            '<a href="#channels" role="tab" data-toggle="tab">Channels</a>';
        tabList.appendChild(tmpElem);

        tmpElem = document.createElement('li');
        tmpElem.className = 'active';
        tmpElem.innerHTML =
            '<a href="#clients" role="tab" data-toggle="tab">Clients</a>';
        tabList.appendChild(tmpElem);

        tmpElem = document.createElement('li');
        tmpElem.innerHTML =
            '<a href="#games" role="tab" data-toggle="tab">Games</a>';
        tabList.appendChild(tmpElem);

        // Add widgets:
        tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        document.body.appendChild(tabContent);

        // Channel and room list:
        tmpElem = document.createElement('div');
        tmpElem.className = 'tab-pane';
        tmpElem.id = 'channels';
        tabContent.appendChild(tmpElem);
        channelList = node.widgets.append('ChannelList', tmpElem);
        roomList = node.widgets.append('RoomList', tmpElem);

        // Client list and controls:
        tmpElem = document.createElement('div');
        tmpElem.className = 'tab-pane active';
        tmpElem.id = 'clients';
        tabContent.appendChild(tmpElem);
        clientList = node.widgets.append('ClientList', tmpElem);

        tmpElem = document.createElement('div');
        tmpElem.className = 'tab-pane';
        tmpElem.id = 'games';
        tabContent.appendChild(tmpElem);
        node.widgets.append('GameList', tmpElem);
    });

    stager.addStage({
        id: 'monitoring',
        cb: function() {
            console.log('Monitoring');
        }
    });

    stager.init()
        .loop('monitoring');

    return {
        io: {
          reconnect: false
        },
        socket: {
            type: 'SocketIo'
        },
        events: {
            dumpEvents: true
        },
        game_metadata: {
            name: 'Monitor Screen',
            description: 'No Description',
            version: '0.3'
        },
        game_settings: {
            publishLevel: 0
        },
        plot: stager.getState(),
        debug: true,
        verbosity: 100
    };
}
