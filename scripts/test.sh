#!/bin/sh

. 'scripts/preamble.sh'

docker run \
  --rm \
  -t \
  --volume "$(pwd):$(pwd):${1-rw}" \
  --entrypoint yarn \
  --workdir "$(pwd)" \
  --env CI \
  "node:${NODE_VERSION}" \
  run \
  test

  