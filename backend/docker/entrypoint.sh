#!/bin/sh
# Start a compiled program.
set -eu

if [ "$(id -u)" = "0" ] && [ -d /app/config ]; then
    chown -R drivershub:drivershub /app/config
fi

if [ "${1:-}" = "drivershub" ]; then
    shift
    exec gosu drivershub /app/drivershub "$@"
fi

if [ "${1:-}" = "bannergen" ]; then
    shift
    exec gosu drivershub /app/bannergen "$@"
fi

exec gosu drivershub "$@"
