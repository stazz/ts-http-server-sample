#!/bin/sh

. 'scripts/preamble.sh'

docker run \
  --rm \
  -it \
  --volume "$(pwd):$(pwd):rw" \
  --entrypoint yarn \
  --workdir "$(pwd)" \
  "node:${NODE_VERSION}-alpine" \
  install \
  --ignore-scripts \
  "$@"