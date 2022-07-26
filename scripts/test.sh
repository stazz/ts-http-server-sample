#!/bin/sh

. 'scripts/preamble.sh'

TEST_MODE="$1"
if [ "${TEST_MODE}" = 'coverage' ]; then
  VOLUME_MODE='rw'
else
  TEST_MODE='run'
  VOLUME_MODE='ro'
fi


docker run \
  --rm \
  -t \
  --volume "$(pwd):$(pwd):${VOLUME_MODE}" \
  --entrypoint yarn \
  --workdir "$(pwd)" \
  --env CI \
  "node:${NODE_VERSION}" \
  run \
  "test:${TEST_MODE}" \
  "$@"
  