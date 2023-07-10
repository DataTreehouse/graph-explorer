#!/bin/sh
set -eu

[ -d ./node_modules/graph-explorer ]
rm -fr dist/examples
BUNDLE_PEERS=true ./node_modules/.bin/webpack --config webpack.demo.config.js
chmod -R g+rwX dist/examples || : ; chmod -R o+rX dist/examples || :
docker build . -t aksw/ontodia
