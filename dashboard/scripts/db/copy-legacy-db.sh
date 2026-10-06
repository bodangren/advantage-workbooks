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
podman exec reading-advantage-postgres createdb -U postgres "$NAME"
# pg_dump 17 matches the Cloud SQL server. The local server is 16, so "SET transaction_timeout" fails
# in the log; that line is harmless.
podman run --rm --network host -e U="$URL" docker.io/library/postgres:17-alpine sh -c 'pg_dump --no-owner --no-privileges "$U"' \
    | podman exec -i reading-advantage-postgres psql -q -U postgres -d "$NAME" > "$LOG" 2>&1
echo "Done. ERROR lines in the log: $(grep -c ERROR "$LOG" || true)"
