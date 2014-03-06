function Monitor(node) {

    var stager = new node.Stager();

    stager.setOnInit(function() {
        var refreshBtn;
        var widgetList = [];

        // Add refresh button:
        refreshBtn = document.createElement('button');
        refreshBtn.innerHTML = 'Refresh';
        document.body.appendChild(refreshBtn);
        refreshBtn.onclick = function() {
            // Tell widgets to refresh themselves:
            widgetList.forEach(function(w) { w.refresh(); });
        };

        // Add widgets:
        widgetList.push(node.widgets.append('ChannelList'));
        widgetList.push(node.widgets.append('RoomList'));
        widgetList.push(node.widgets.append('ClientList'));
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
