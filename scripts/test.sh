#!/bin/sh

. 'scripts/preamble.sh'

docker run \
  --rm \
  -t \
  --volume "$(pwd):$(pwd):${1-ro}" \
  --entrypoint yarn \
  --workdir "$(pwd)" \
  --env CI=true \
  "node:${NODE_VERSION}-alpine" \
  run \
  test

  