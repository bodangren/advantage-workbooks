#!/usr/bin/env python3
"""Finish deleting opencode sessions inactive >7 days (events already done).

Skips wal_checkpoint(TRUNCATE): opencode checkpoints the WAL itself, and
TRUNCATE contends with its live locks. Deletes the smaller child tables and
the sessions, each in its own committed transaction.
"""
import sqlite3
import sys
import shutil
import time

DB = "/home/daniel-bo/.local/share/opencode/opencode.db"
CUTOFF_DAYS = 7

con = sqlite3.connect(DB, timeout=120)
con.execute("PRAGMA busy_timeout=120000")
con.execute("PRAGMA foreign_keys=OFF")

cutoff_ms = (int(time.time()) - CUTOFF_DAYS * 86400) * 1000

def check_space(tag):
    total, used, free = shutil.disk_usage("/")
    gb = free / 1e9
    print(f"[{tag}] free={gb:.2f}GB", flush=True)
    if gb < 2.0:
        print("ABORT: free space below 2GB", flush=True)
        sys.exit(2)

def run(tag, sql):
    for attempt in range(20):
        try:
            con.execute("BEGIN")
            cur = con.execute(sql, (cutoff_ms,))
            con.execute("COMMIT")
            print(f"{tag} deleted: {cur.rowcount}", flush=True)
            check_space(tag)
            return
        except sqlite3.OperationalError as e:
            con.rollback()
            if "locked" in str(e).lower() or "busy" in str(e).lower():
                print(f"{tag} locked ({e}), retry {attempt+1}", flush=True)
                time.sleep(3)
            else:
                raise
    print(f"ABORT: {tag} could not get lock", flush=True)
    sys.exit(3)

run("event_sequence", "DELETE FROM event_sequence WHERE aggregate_id IN "
    "(SELECT id FROM session WHERE time_updated < ?)")
run("message", "DELETE FROM message WHERE session_id IN "
    "(SELECT id FROM session WHERE time_updated < ?)")
run("part", "DELETE FROM part WHERE session_id IN "
    "(SELECT id FROM session WHERE time_updated < ?)")
for tbl in ("todo", "session_share", "session_message", "session_input", "session_context_epoch"):
    run(tbl, f"DELETE FROM {tbl} WHERE session_id IN "
        f"(SELECT id FROM session WHERE time_updated < ?)")
run("session", "DELETE FROM session WHERE time_updated < ?")

left = con.execute(
    "SELECT count(*) FROM session WHERE time_updated < ?", (cutoff_ms,)).fetchone()[0]
print(f"VERIFY remaining old sessions: {left}", flush=True)
con.close()
print("DONE", flush=True)
