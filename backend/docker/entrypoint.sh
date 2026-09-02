#!/bin/sh
# Start the compiled program or its source-runtime equivalent.
set -eu

if [ "$(id -u)" = "0" ] && [ -d /app/config ]; then
    chown -R drivershub:drivershub /app/config
fi

if [ "${1:-}" = "drivershub" ]; then
    shift
    if [ "${DRIVERSHUB_SOURCE_RUNTIME:-0}" = "1" ]; then
        exec gosu drivershub /app/.venv/bin/python /app/main.py "$@"
    fi
    exec gosu drivershub /app/drivershub "$@"
fi

if [ "${1:-}" = "bannergen" ]; then
    shift
    if [ "${DRIVERSHUB_SOURCE_RUNTIME:-0}" = "1" ]; then
        cd /app/bannergen
        exec gosu drivershub /app/.venv/bin/python /app/bannergen/main.py "$@"
    fi
    exec gosu drivershub /app/bannergen "$@"
fi

exec gosu drivershub "$@"
