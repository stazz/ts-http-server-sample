#!/bin/sh

docker run \
  --rm \
  -it \
  --volume "$(pwd):$(pwd):ro" \
  --publish 127.0.0.1:3000:3000 \
  --entrypoint sh \
  --workdir "$(pwd)" \
  node:16-alpine \
  -c \
  'yarn install --frozen-lockfile && yarn run server $@' \
  -- \
  "$@"
