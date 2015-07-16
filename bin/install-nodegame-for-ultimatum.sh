#!/bin/bash
# nodeGame install from sources script
# Copyright(c) 2015 Stefano Balietti
# MIT Licensed
#
# To be used in ultimatum testing
#
# Run this from inside the ultimatum directory:
#  $ bin/install-nodegame-for-ultimatum.sh

# Check node.js version, must be higher than 0.8.
node_version=$(node --version)  # e.g. "v0.10.20"
node_version=${node_version#v}  # e.g. "0.10.20"
node_major=$(cut -d. -f1 <<< $node_version)
node_minor=$(cut -d. -f2 <<< $node_version)
if (( node_major <= 0 && node_minor < 10 ))
then
    echo "Found node.js version $node_version, but at least 0.10 required."
    exit 1
fi

# Make dependencies available for Ultimatum.
ln -s nodegame/node_modules .

# Clone the main repo.
git clone https://github.com/nodeGame/nodegame.git
cd nodegame
# Register this Ultimatum game in nodegame.
ln -s ../.. games/ultimatum

# Install the dependencies.
mkdir node_modules; cd node_modules
git clone https://github.com/nodeGame/nodegame-client.git
git clone https://github.com/nodeGame/nodegame-server.git
git clone https://github.com/nodeGame/nodegame-window.git
git clone https://github.com/nodeGame/nodegame-widgets.git
git clone https://github.com/nodeGame/JSUS.git
git clone https://github.com/nodeGame/NDDB.git
git clone https://github.com/nodeGame/shelf.js.git
git clone https://github.com/nodeGame/descil-mturk.git
git clone https://github.com/nodeGame/nodegame-db.git
git clone https://github.com/nodeGame/nodegame-mongodb.git
git clone https://github.com/nodeGame/nodegame-requirements.git
git clone https://github.com/nodeGame/nodegame-monitor.git
npm install smoosh
npm install ya-csv
#npm install commander
#npm install docker

# Add symbolic links to given dependencies that are in nodegame/node_modules
# (e.g. JSUS, NDDB)
function link_deps {
    mkdir -p node_modules
    (
        cd node_modules
        for dep in "$@"
        do  ln -s "../../$dep" .
        done
    )
}

# Install sub-dependencies; link to tracked dependencies.
cd JSUS
npm install

cd ../descil-mturk
link_deps JSUS NDDB
npm install

cd ../nodegame-mongodb
npm install

cd ../nodegame-client
link_deps JSUS NDDB shelf.js
npm install

cd ../nodegame-server
link_deps JSUS NDDB shelf.js nodegame-widgets
npm install

# Patching express connect.
# patch node_modules/express/node_modules/connect/lib/middleware/static.js < bin/ng.connect.static.js.patch

# Rebuild js files.
node bin/make.js build-client -a -o nodegame-full
