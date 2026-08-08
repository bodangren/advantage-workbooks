#!/usr/bin/env python3
"""Delete opencode sessions inactive >7 days, in batches with checkpoints.

Run against the live DB: batches keep the WAL bounded, each batch commits
atomically, and free space is checked after every batch so we can abort
before filling the disk.
"""
import sqlite3
import sys
import shutil

DB = "/home/daniel-bo/.local/share/opencode/opencode.db"
CUTOFF_DAYS = 7
BATCH = 30000  # rows of `event` per transaction

con = sqlite3.connect(DB, timeout=60)
con.execute("PRAGMA busy_timeout=60000")
con.execute("PRAGMA foreign_keys=OFF")

cutoff_ms = (int(__import__("time").time()) - CUTOFF_DAYS * 86400) * 1000
print(f"cutoff_ms={cutoff_ms} ({(cutoff_ms/1000):.0f} epoch s)")

# Snapshot the old session ids once.
con.execute("DROP TABLE IF EXISTS _old_ids")
con.execute("CREATE TEMP TABLE _old_ids AS SELECT id FROM session WHERE time_updated < ?", (cutoff_ms,))
n_sessions = con.execute("SELECT count(*) FROM _old_ids").fetchone()[0]
print(f"old sessions: {n_sessions}")
if n_sessions == 0:
    print("nothing to delete")
    sys.exit(0)

def check_space(tag):
    total, used, free = shutil.disk_usage("/")
    gb = free / 1e9
    print(f"[{tag}] free={gb:.2f}GB", flush=True)
    if gb < 2.0:
        print("ABORT: free space below 2GB", flush=True)
        sys.exit(2)

def checkpoint():
    # TRUNCATE can be blocked while opencode holds a read lock; loop until it works.
    for _ in range(200):
        busy, log, ckpt = con.execute("PRAGMA wal_checkpoint(TRUNCATE)").fetchone()
        if busy == 0:
            return
        import time as _t
        _t.sleep(0.5)
    print("WARN: checkpoint still busy after retries", flush=True)

# 1. events (biggest table), by session batches
deleted = 0
while True:
    ids = [r[0] for r in con.execute(
        "SELECT id FROM _old_ids LIMIT ?", (BATCH,))]
    if not ids:
        break
    ph = ",".join("?" * len(ids))
    con.execute("BEGIN")
    cur = con.execute(f"DELETE FROM event WHERE aggregate_id IN ({ph})", ids)
    deleted += cur.rowcount
    con.execute("COMMIT")
    con.execute(f"DELETE FROM _old_ids WHERE id IN ({ph})", ids)
    checkpoint()
    check_space("event")
print(f"events deleted: {deleted}", flush=True)

# 2. event_sequence
con.execute("BEGIN")
cur = con.execute(
    "DELETE FROM event_sequence WHERE aggregate_id IN "
    "(SELECT id FROM session WHERE time_updated < ?)", (cutoff_ms,))
print(f"event_sequence deleted: {cur.rowcount}", flush=True)
con.execute("COMMIT")
checkpoint()
check_space("event_sequence")

# 3. message
con.execute("BEGIN")
cur = con.execute(
    "DELETE FROM message WHERE session_id IN "
    "(SELECT id FROM session WHERE time_updated < ?)", (cutoff_ms,))
print(f"message deleted: {cur.rowcount}", flush=True)
con.execute("COMMIT")
checkpoint()
check_space("message")

# 4. part
con.execute("BEGIN")
cur = con.execute(
    "DELETE FROM part WHERE session_id IN "
    "(SELECT id FROM session WHERE time_updated < ?)", (cutoff_ms,))
print(f"part deleted: {cur.rowcount}", flush=True)
con.execute("COMMIT")
checkpoint()
check_space("part")

# 5. todo + session_share + session_message + session_input + session_context_epoch
for tbl in ("todo", "session_share", "session_message", "session_input", "session_context_epoch"):
    con.execute("BEGIN")
    cur = con.execute(
        f"DELETE FROM {tbl} WHERE session_id IN "
        f"(SELECT id FROM session WHERE time_updated < ?)", (cutoff_ms,))
    print(f"{tbl} deleted: {cur.rowcount}", flush=True)
    con.execute("COMMIT")
checkpoint()
check_space("children")

# 6. sessions themselves
con.execute("BEGIN")
cur = con.execute(
    "DELETE FROM session WHERE time_updated < ?", (cutoff_ms,))
print(f"session deleted: {cur.rowcount}", flush=True)
con.execute("COMMIT")
checkpoint()
check_space("session")

# 7. verify
left = con.execute(
    "SELECT count(*) FROM session WHERE time_updated < ?", (cutoff_ms,)).fetchone()[0]
print(f"VERIFY remaining old sessions: {left}", flush=True)
con.close()
print("DONE", flush=True)
