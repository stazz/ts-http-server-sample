#!/bin/sh

. 'scripts/preamble.sh'

docker run \
  --rm \
  -it \
  --volume "$(pwd):$(pwd):${1-ro}" \
  --entrypoint yarn \
  --workdir "$(pwd)" \
  "node:${NODE_VERSION}-alpine" \
  run \
  test

  