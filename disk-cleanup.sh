#!/usr/bin/env bash
# Daily disk cleanup — runs at 04:00 via cron.
# Safe: only touches caches and old session data; never running services.
set -u

LOG="$HOME/disk-cleanup.log"
{
  echo "===== $(date '+%F %T') disk cleanup ====="
  df -h / | tail -1

  # 1. opencode DB: prune sessions older than 7 days, then VACUUM (no backup —
  #    DB is a local cache; tool still runs integrity checks before/after).
  DB="$HOME/.local/share/opencode/opencode.db"
  if command -v fuser >/dev/null && ! fuser "$DB" >/dev/null 2>&1; then
    python3 - "$DB" <<'EOF'
import sqlite3, sys, time
db = sys.argv[1]
cutoff = (int(time.time()) - 7*86400) * 1000
con = sqlite3.connect(db, timeout=60)
con.execute("PRAGMA busy_timeout=60000")
con.execute("PRAGMA foreign_keys=OFF")
n = con.execute("DELETE FROM event WHERE aggregate_id IN (SELECT id FROM session WHERE time_updated < ?)", (cutoff,)).rowcount
print(f"events deleted: {n}")
con.execute("DELETE FROM event_sequence WHERE aggregate_id IN (SELECT id FROM session WHERE time_updated < ?)", (cutoff,))
for t in ("message","part","todo","session_share","session_message","session_input","session_context_epoch"):
    con.execute(f"DELETE FROM {t} WHERE session_id IN (SELECT id FROM session WHERE time_updated < ?)", (cutoff,))
n = con.execute("DELETE FROM session WHERE time_updated < ?", (cutoff,)).rowcount
print(f"sessions deleted: {n}")
con.commit()
con.close()
EOF
    # VACUUM separately so a lock failure doesn't abort the deletes
    python3 - "$DB" <<'EOF'
import sqlite3, sys, time
con = sqlite3.connect(sys.argv[1], timeout=120)
con.execute("PRAGMA busy_timeout=120000")
for attempt in range(10):
    try:
        con.execute("VACUUM")
        print("VACUUM ok")
        break
    except sqlite3.OperationalError as e:
        print(f"VACUUM locked ({e}), retry {attempt+1}")
        time.sleep(5)
con.close()
EOF
  else
    echo "skipped opencode DB (in use)"
  fi

  # 2. codex CLI session history older than 7 days
  SESS="$HOME/.codex/sessions"
  if [ -d "$SESS" ]; then
    find "$SESS" -mindepth 3 -maxdepth 3 -type d \
      | awk -v c="$(date -d '7 days ago' +%Y-%m-%d)" '{n=split($0,a,"/"); y=a[n-2]; m=a[n-1]; d=a[n]; if (y"-"m"-"d < c) print $0}' \
      | xargs -r rm -rf
    echo "codex sessions pruned"
  fi

  # 3. regenerable dev caches (npm, pip, uv, pnpm orphaned store)
  npm cache clean --force >/dev/null 2>&1 && echo "npm cache cleaned"
  pip cache purge >/dev/null 2>&1 && echo "pip cache purged"
  uv cache clean >/dev/null 2>&1 && echo "uv cache cleaned"
  pnpm store prune >/dev/null 2>&1 && echo "pnpm store pruned"

  # 4. stale /tmp dirs older than 3 days (skip active lock files)
  find /tmp -mindepth 1 -maxdepth 1 -type d -mtime +3 ! -name '.*' -exec rm -rf {} + 2>/dev/null
  echo "/tmp stale dirs pruned"

  # 5. opencode session snapshots/tool-output older than 30 days
  find "$HOME/.local/share/opencode/snapshot" -type f -mtime +30 -delete 2>/dev/null
  find "$HOME/.local/share/opencode/tool-output" -type f -mtime +30 -delete 2>/dev/null

  df -h / | tail -1
  echo "===== done ====="
} >> "$LOG" 2>&1
