#!/bin/sh
# Prepare the external table directory. Then, start MariaDB.
set -eu

mkdir -p /var/lib/mysqlext
chown mysql:mysql /var/lib/mysqlext

exec /usr/local/bin/docker-entrypoint.sh "$@"
