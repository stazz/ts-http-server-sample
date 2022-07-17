#!/bin/sh

NODE_VERSION="${1-16}"

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