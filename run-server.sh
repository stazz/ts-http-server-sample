#!/bin/sh

docker run \
  --rm \
  -it \
  --volume "$(pwd):$(pwd):rw" \
  --entrypoint yarn \
  --workdir "$(pwd)" \
  node:16-alpine \
  install \
  --frozen-lockfile \
  --ignore-scripts

docker run \
  --rm \
  -it \
  --volume "$(pwd):$(pwd):ro" \
  --publish 127.0.0.1:3000:3000 \
  --entrypoint yarn \
  --workdir "$(pwd)" \
  node:16-alpine \
  run \
  server \
  "$@"
