#!/bin/sh
set -eu
# PEM is public; mount it separately because Docker env files are single-line.
if [ -n "${DATABASE_SSL_CA_FILE:-}" ]; then
  DATABASE_SSL_CA="$(cat "$DATABASE_SSL_CA_FILE")"
  export DATABASE_SSL_CA
fi
cd /app/apps/worker
exec node --import tsx src/indexer/run.ts --watch
