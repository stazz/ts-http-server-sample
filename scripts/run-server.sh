#!/bin/sh

. 'scripts/preamble.sh'

docker run \
  --rm \
  -t \
  --volume "$(pwd):$(pwd):rw" \
  --entrypoint yarn \
  --workdir "$(pwd)" \
  "node:${NODE_VERSION}-alpine" \
  install \
  --frozen-lockfile \
  --ignore-scripts

docker run \
  --rm \
  -t \
  --volume "$(pwd):$(pwd):ro" \
  --publish 127.0.0.1:3000:3000 \
  --entrypoint yarn \
  --workdir "$(pwd)" \
  "node:${NODE_VERSION}-alpine" \
  run \
  server \
  "$@"
