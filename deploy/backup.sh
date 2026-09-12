#!/bin/sh
set -eu
umask 077
export PGPASSWORD="$(cat /run/secrets/postgres_password)"
mkdir -p /backups
while true; do
 stamp=$(date -u +%Y%m%dT%H%M%SZ)
 partial="/backups/coach-$stamp.partial"
 if pg_dump --format=custom --file="$partial" && pg_restore --list "$partial" >/dev/null; then
  mv "$partial" "/backups/coach-$stamp.dump"
  echo "backup completed at $stamp"
  find /backups -name 'coach-*.dump' -mtime +14 -delete
 else
  rm -f "$partial"
  echo "backup failed at $stamp" >&2
 fi
 sleep 86400
done
