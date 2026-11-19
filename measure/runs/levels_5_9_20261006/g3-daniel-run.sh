#!/usr/bin/env bash
# Task 1.G3 part 1 (track levels_5_9_20261006): Daniel's run of the levels 5-9 passages inventory
# and of the read-only cross-check against the monorepo Primary database.
#
# Order of the run:
#   1. make ~/Desktop/handoff/levels-5-9-passages-2026-11-19/ (outside the git tree);
#   2. start the Cloud SQL proxy on 127.0.0.1:5433 in the background and stop it on exit;
#   3. wait until the port answers;
#   4. run scripts/inventory-legacy.ts for levels 5,6,7,8,9 into that folder;
#   5. run g3-crosscheck.ts against the monorepo database.
#
# Names and their sources:
#   - Cloud SQL instance reading-advantage:asia-southeast1:cloud-sql
#     (docs/content-plans/primary-db-field-map.md, "Production load").
#   - legacy secret DATABASE_URL, project primary-advantage (same section, step 2).
#   - monorepo secret PRIMARY_V2_DATABASE_URL, version 1, project primary-advantage,
#     database primary_v2
#     (../reading-advantage-monorepo/docs/deployment/tutor-switch-brief.md, line 55;
#      primary-cutover-migration-spec.md, line 136 pins version 1 for the live service).
#
# Reads only: both tools use one READ ONLY transaction and roll it back. No URL is printed.
# Nothing is written inside the Workbooks git tree: every file goes to the handoff folder.
#
# Usage: bash measure/runs/levels_5_9_20261006/g3-daniel-run.sh
set -euo pipefail

# ─── Fixed names ─────────────────────────────────────────────
REPO="$HOME/Desktop/Workbooks"
OUT_DIR="$HOME/Desktop/handoff/levels-5-9-passages-2026-11-19"
INSTANCE="reading-advantage:asia-southeast1:cloud-sql"
PROXY_BIN="${PROXY_BIN:-cloud-sql-proxy}"
PROXY_ADDR="127.0.0.1"
PROXY_PORT="5433"
LEGACY_SECRET="DATABASE_URL"
LEGACY_PROJECT="primary-advantage"
MONOREPO_SECRET="PRIMARY_V2_DATABASE_URL"
MONOREPO_SECRET_VERSION="1"
MONOREPO_PROJECT="primary-advantage"

INVENTORY="$OUT_DIR/legacy-levels-5-9-passages.json"
CROSSCHECK_JSON="$OUT_DIR/crosscheck-levels-5-9.json"
CROSSCHECK_REPORT="$OUT_DIR/g3-crosscheck.txt"
INVENTORY_LOG="$OUT_DIR/inventory-legacy.log"

PROXY_PID=""

# ─── Helpers ────────────────────────────────────────────────
# True when a process already listens on the proxy address.
port_open() {
    (exec 3<>"/dev/tcp/$PROXY_ADDR/$PROXY_PORT") 2>/dev/null
}

# Stops the proxy this script started. Runs on exit.
cleanup() {
    if [ -n "$PROXY_PID" ]; then
        kill "$PROXY_PID" 2>/dev/null || true
        wait "$PROXY_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

# ─── 1. The handoff folder ──────────────────────────────────
mkdir -p "$OUT_DIR"
printf 'handoff folder: %s\n' "$OUT_DIR"

# ─── 2. The proxy ───────────────────────────────────────────
if port_open; then
    printf 'A process already listens on %s:%s. Stop it first; this script starts its own proxy.\n' "$PROXY_ADDR" "$PROXY_PORT" >&2
    exit 1
fi
command -v "$PROXY_BIN" >/dev/null 2>&1 || {
    printf 'Missing %s. Install the Cloud SQL Auth Proxy, or set PROXY_BIN to its path.\n' "$PROXY_BIN" >&2
    exit 1
}

"$PROXY_BIN" --gcloud-auth --address "$PROXY_ADDR" --port "$PROXY_PORT" "$INSTANCE" >"$OUT_DIR/cloud-sql-proxy.log" 2>&1 &
PROXY_PID=$!

ready=0
for _ in $(seq 1 60); do
    if port_open; then
        ready=1
        break
    fi
    sleep 1
done
if [ "$ready" -ne 1 ]; then
    printf 'The proxy did not answer on %s:%s. See %s.\n' "$PROXY_ADDR" "$PROXY_PORT" "$OUT_DIR/cloud-sql-proxy.log" >&2
    exit 1
fi
printf 'proxy: listening on %s:%s (pid %s)\n' "$PROXY_ADDR" "$PROXY_PORT" "$PROXY_PID"

# ─── 3. The passages inventory ──────────────────────────────
cd "$REPO/dashboard"
LEGACY_URL="$(gcloud secrets versions access latest --secret="$LEGACY_SECRET" --project="$LEGACY_PROJECT" | node scripts/db/proxy-url.js)"

INV_EXIT=0
set +e
LEGACY_DATABASE_URL="$LEGACY_URL" npx tsx scripts/inventory-legacy.ts --levels 5,6,7,8,9 --out "$INVENTORY" >"$INVENTORY_LOG" 2>&1
INV_EXIT=$?
set -e
printf 'inventory-legacy exit: %s\n' "$INV_EXIT"
if [ "$INV_EXIT" -ne 0 ]; then
    printf 'See %s.\n' "$INVENTORY_LOG" >&2
    exit "$INV_EXIT"
fi

INVENTORY_COUNT="$(node -e 'const fs = require("fs"); const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); process.stdout.write(String((j.articles || []).length));' "$INVENTORY")"
printf 'inventory articles: %s\n' "$INVENTORY_COUNT"
printf 'inventory file: %s\n' "$INVENTORY"

# ─── 4. The cross-check ─────────────────────────────────────
MONOREPO_URL="$(gcloud secrets versions access "$MONOREPO_SECRET_VERSION" --secret="$MONOREPO_SECRET" --project="$MONOREPO_PROJECT" | node scripts/db/proxy-url.js)"

CHECK_EXIT=0
set +e
MONOREPO_DATABASE_URL="$MONOREPO_URL" npx tsx ../measure/runs/levels_5_9_20261006/g3-crosscheck.ts \
    --inventory "$INVENTORY" \
    --out "$CROSSCHECK_JSON" \
    --report "$CROSSCHECK_REPORT"
CHECK_EXIT=$?
set -e
printf 'cross-check exit: %s\n' "$CHECK_EXIT"
if [ "$CHECK_EXIT" -ne 0 ]; then
    exit "$CHECK_EXIT"
fi

# ─── 5. Next steps ──────────────────────────────────────────
printf 'crosscheck json: %s\n' "$CROSSCHECK_JSON"
printf 'report: %s\n' "$CROSSCHECK_REPORT"
printf 'merged inventory: %s\n' "${CROSSCHECK_JSON%.json}-merged.json"
printf 'The merged inventory is the input of the plan grouping run in Task 1.G3.\n'
printf 'Copy %s to measure/runs/levels_5_9_20261006/g3-crosscheck.txt, then commit it with the run capture.\n' "$CROSSCHECK_REPORT"
printf 'The run script never writes inside the Workbooks git tree.\n'
