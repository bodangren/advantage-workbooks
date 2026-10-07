#!/usr/bin/env bash
# Copies the production Primary database (through the Cloud SQL proxy on 127.0.0.1:5433) into a new
# local database in the reading-advantage-postgres container. The ETL in the monorepo reads this copy.
#
# Usage: bash dashboard/scripts/db/copy-legacy-db.sh [<local database name>]
#   Default name: primary_legacy_<today as YYYYMMDD>. The script stops when the database exists.
#
# Needs: the proxy running (see docs/content-plans/primary-db-field-map.md, "Production load"),
# gcloud access to the DATABASE_URL secret, and podman. The URL is never printed.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAME="${1:-primary_legacy_$(date +%Y%m%d)}"
LOG="${TMPDIR:-/tmp}/copy-legacy-db-$NAME.log"

if podman exec reading-advantage-postgres psql -U postgres -tAc "select 1 from pg_database where datname = '$NAME'" | grep -q 1; then
    echo "The local database $NAME exists. Choose a new name or drop it first." >&2
    exit 1
fi
URL="$(gcloud secrets versions access latest --secret=DATABASE_URL --project=primary-advantage | node "$HERE/proxy-url.js")"

echo "Local copy: $NAME (log: $LOG)"
# The dump goes to a private file first, so a broken connection leaves no half-made database. The
# VPN tunnel on this machine reset a dump after 80 s on 2026-10-07; the next try usually works.
umask 077
DUMP="$(mktemp "${TMPDIR:-/tmp}/copy-legacy-db-$NAME.XXXXXX.sql")"
trap 'rm -f "$DUMP"' EXIT
# pg_dump 17 matches the Cloud SQL server. The local server is 16, so "SET transaction_timeout" fails
# in the log; that line is harmless. The image comes from Google's Docker Hub mirror: Docker Hub
# refused an unauthenticated pull with "toomanyrequests" on 2026-10-07.
for try in 1 2 3; do
    if podman run --rm --network host -e U="$URL" mirror.gcr.io/library/postgres:17-alpine sh -c 'pg_dump --no-owner --no-privileges "$U"' > "$DUMP"; then
        break
    fi
    if [ "$try" = 3 ]; then
        echo "pg_dump failed 3 times. Nothing was written to the local server." >&2
        exit 1
    fi
    echo "pg_dump failed (try $try of 3). Trying again in 10 s." >&2
    sleep 10
done
echo "Dump complete ($(du -h "$DUMP" | cut -f1)). Loading it into $NAME."
podman exec reading-advantage-postgres createdb -U postgres "$NAME"
podman exec -i reading-advantage-postgres psql -q -U postgres -d "$NAME" < "$DUMP" > "$LOG" 2>&1
echo "Done. ERROR lines in the log: $(grep -c ERROR "$LOG" || true)"
