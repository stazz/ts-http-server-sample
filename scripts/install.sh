#!/bin/sh

. 'scripts/preamble.sh'

docker run \
  --rm \
  -t \
  --volume "$(pwd):$(pwd):rw" \
  --entrypoint yarn \
  --workdir "$(pwd)" \
  "node:${NODE_VERSION}" \
  install \
  --ignore-scripts \
  "$@"