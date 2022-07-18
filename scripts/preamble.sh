NODE_VERSION="${1}"
if [ -n "$(echo "${NODE_VERSION}" | grep --color=never -E '^[0-9]+$')" ]; then
  shift
else
  NODE_VERSION='16'
fi

# Always use Alpine-based image
NODE_VERSION="${NODE_VERSION}-alpine"
