#!/bin/sh
# Prepare the external table directory. Then, start MariaDB.
set -eu

mkdir -p /var/lib/mysqlext
chown mysql:mysql /var/lib/mysqlext

for config in /drivershub-mariadb-config/*.cnf; do
    [ -f "$config" ] || continue
    cp "$config" /etc/mysql/conf.d/
done

exec /usr/local/bin/docker-entrypoint.sh "$@"
