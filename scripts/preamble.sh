NODE_VERSION="${1-16}"
if [ -n "$(echo "$1" | grep --color=never -E '^[0-9]+$')" ]; then
  shift
fi
