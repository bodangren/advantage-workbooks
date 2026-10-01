#!/usr/bin/env bash
# A local Postgres 17 with the legacy Primary schema, for the injector integration tests
# (track primary_injector_20261001). It loads every migration in ../primary-advantage/prisma/migrations.
# Usage (from dashboard/): bash scripts/inject/test-db.sh; then export the URL it prints and run
#   npx vitest run inject-integration
set -euo pipefail
NAME=primary-inject-test
PORT=${PORT:-55432}
MIGRATIONS=${MIGRATIONS:-../../primary-advantage/prisma/migrations}
RUNTIME=$(command -v podman || command -v docker)
"$RUNTIME" rm -f "$NAME" >/dev/null 2>&1 || true
"$RUNTIME" run -d --name "$NAME" -e POSTGRES_PASSWORD=test -e POSTGRES_DB=primary_test -p "127.0.0.1:$PORT:5432" docker.io/library/postgres:17 >/dev/null
until "$RUNTIME" exec "$NAME" pg_isready -U postgres -d primary_test >/dev/null 2>&1; do sleep 1; done
sleep 1
for dir in $(ls -d "$MIGRATIONS"/*/ | sort); do
  "$RUNTIME" exec -i "$NAME" psql -q -v ON_ERROR_STOP=1 -U postgres -d primary_test < "$dir/migration.sql" >/dev/null
done
echo "export INJECT_TEST_DATABASE_URL=postgresql://postgres:test@127.0.0.1:$PORT/primary_test"
