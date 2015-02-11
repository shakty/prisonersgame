#!/bin/bash
# Ultimatum automatic test run
# Copyright(c) 2015 Stefano Balietti
# MIT Licensed
#
# Run this from inside the ultimatum directory:
#  $ bin/run-standalone-test.sh
#
# Should be same as procedure in .travis.yml.
# Returns true if and only if the tests are run successfully.

# Return on failure immediately.
set -e

bin/install-nodegame-for-ultimatum.sh
npm install

cd nodegame
node ../test/launcher-autoplay.js
cd ..

npm test
