"""Make song candidates for storytime L2 unit 2 weeks 9 to 15 with mmx music.

Usage:
  python make.py --weeks 9,10,11 --take 1
  python make.py --weeks 13,14,15 --take 2 --candidates 1,2,3

One mp3 per (week, candidate, take). The output folder is create-only: an existing file
is never overwritten. Before each call the script reads the MiniMax quota and writes a
pending spend row, so an early stop leaves a true spend record.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/home/daniebo/Desktop/Workbooks")
OUT_ROOT = Path.home() / "Desktop/handoff/storytime-l2u2-song-candidates-2026-11-09"
STATE = Path("/tmp/opencode/l2u2-songs/spend.json")
SPEND_MD = ROOT / "measure/runs/storytime_l2_unit2_20261106/songs-spend.md"
ROLE_LOG = ROOT / "measure/runs/storytime_l2_unit2_20261106/jr-green-t113-songs-cc8867b4.log"
QUOTA_URL = "http://127.0.0.1:38307/api/quota/minimax-cn-coding-plan"
MODEL = "music-3.0"
LIST_USD = 0.15
STOP_TRACKS = 40
ERR_WORDS = ("quota", "rate limit", "ratelimit", "budget", "limit", "insufficient", "402", "429")

SPEND_HEADER = """# Song candidate spend (MiniMax plan, `mmx music`, model music-3.0)

- Track: storytime_l2_unit2_20261106, phase P1, task T1.13
- Role base: cc8867b4d93f0415e983be6696d21eee95fb9f74
- List price: 0.15 USD a track. Stop at 40 tracks = 6.00 USD.
- Plan use inside the MiniMax plan: 0 USD billed. The list price shows the value used.
- Quota read before each call: GET http://127.0.0.1:38307/api/quota/minimax-cn-coding-plan
  (`5h` and `weekly` used percent). Stop rule: `5h` 95 or more, or `weekly` 97 or more.

Initial quota read (before the first call): `5h` 29 %, `weekly` 9 %.

| # | Time (UTC) | Week | Cand | Take | Model | List USD | Sum USD | Quota before (5h/wk) | Result |
|---|---|---|---|---|---|---|---|---|---|
"""


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log(msg: str) -> None:
    with ROLE_LOG.open("a") as fh:
        fh.write(msg + "\n")
    print(msg, flush=True)


def quota() -> tuple[int, int, str]:
    with urllib.request.urlopen(QUOTA_URL, timeout=25) as resp:
        data = json.loads(resp.read().decode())
    w = data["usage"]["windows"]
    return int(w["5h"]["usedPercent"]), int(w["weekly"]["usedPercent"]), json.dumps(w, separators=(",", ":"))


def load_state() -> list[dict]:
    if STATE.exists():
        return json.loads(STATE.read_text())
    return []


def save_spend(records: list[dict]) -> None:
    calls = [r for r in records if not r.get("skip")]
    total = round(len(calls) * LIST_USD, 2)
    lines = [SPEND_HEADER.rstrip("\n")]
    for r in records:
        lines.append(
            "| {i} | {time} | w{d:02d} | c{c} | t{take} | {model} | 0.15 | {sum_usd:.2f} | "
            "{q5}/{qw} | {result} |".format(
                i=r["i"],
                time=r["time"],
                d=r["week"],
                c=r["cand"],
                take=r["take"],
                model=r["model"],
                sum_usd=r["sum_usd"],
                q5=r["q5"],
                qw=r["qw"],
                result=r["result"],
            )
        )
    lines.append("")
    lines.append(f"Tracks made (not skipped): {len(calls)}. Spend at the list price: {total:.2f} USD.")
    SPEND_MD.write_text("\n".join(lines) + "\n")


def lyric_ok(lyrics: str) -> None:
    if len(lyrics) > 3500:
        raise SystemExit(f"lyrics too long: {len(lyrics)}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--weeks", required=True)
    ap.add_argument("--take", type=int, required=True)
    ap.add_argument("--candidates", default="1,2,3")
    args = ap.parse_args()

    weeks = [int(w) for w in args.weeks.split(",") if w]
    cands = [int(c) for c in args.candidates.split(",") if c]
    records = load_state()
    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    for week in weeks:
        src = ROOT / f"content/storytime/drafts/l2/w{week:02d}.json"
        song = json.loads(src.read_text())["song"]
        style = song["styleBrief"]
        lyrics = song["lyricSheet"]
        bpm = song["bpm"]
        lyric_ok(lyrics)
        week_dir = OUT_ROOT / f"w{week:02d}"
        week_dir.mkdir(parents=True, exist_ok=True)
        for cand in cands:
            out = week_dir / f"l2-w{week:02d}-song-c{cand}-t{args.take}.mp3"
            if out.exists():
                log(f"[{now()}] SKIP create-only: {out}")
                continue
            if len([r for r in records if not r.get("skip")]) >= STOP_TRACKS:
                log(f"[{now()}] STOP spend stop reached: {STOP_TRACKS} tracks")
                save_spend(records)
                return 0
            q5, qw, qraw = quota()
            if q5 >= 95 or qw >= 97:
                log(f"[{now()}] STOP quota rule: 5h={q5} weekly={qw}")
                save_spend(records)
                return 0
            calls = len([r for r in records if not r.get("skip")])
            rec = {
                "i": len(records) + 1,
                "time": now(),
                "week": week,
                "cand": cand,
                "take": args.take,
                "model": MODEL,
                "sum_usd": round((calls + 1) * LIST_USD, 2),
                "q5": q5,
                "qw": qw,
                "result": "pending",
            }
            records.append(rec)
            save_spend(records)
            log(f"[{rec['time']}] CALL w{week:02d} c{cand} t{args.take} quota 5h={q5} weekly={qw} out={out}")
            argv = [
                "mmx",
                "music",
                "generate",
                "--prompt",
                style,
                "--lyrics",
                lyrics,
                "--bpm",
                str(bpm),
                "--model",
                MODEL,
                "--quiet",
                "--output",
                "json",
                "--out",
                str(out),
            ]
            started = time.time()
            proc = subprocess.run(argv, capture_output=True, text=True)
            took = round(time.time() - started, 1)
            stdout = (proc.stdout or "").strip()
            stderr = (proc.stderr or "").strip()
            with (Path("/tmp/opencode/l2u2-songs") / f"call-w{week:02d}-c{cand}-t{args.take}.json").open("w") as fh:
                fh.write(json.dumps({"argv": argv, "code": proc.returncode, "seconds": took,
                                     "stdout": stdout, "stderr": stderr, "out": str(out)}, indent=2))
            if proc.returncode == 0 and out.exists() and out.stat().st_size > 0:
                rec["result"] = f"ok {took}s"
                save_spend(records)
                log(f"[{now()}] OK w{week:02d} c{cand} t{args.take} {took}s size={out.stat().st_size}")
            else:
                blob = (stdout + "\n" + stderr).lower()
                rec["result"] = f"FAIL exit={proc.returncode}"
                save_spend(records)
                log(f"[{now()}] FAIL w{week:02d} c{cand} t{args.take} exit={proc.returncode}")
                log("STDOUT: " + stdout)
                log("STDERR: " + stderr)
                if any(w in blob for w in ERR_WORDS):
                    log(f"[{now()}] STOP error text has a quota/rate/budget/limit word. No retry.")
                    return 2
                return 3
    save_spend(records)
    return 0


if __name__ == "__main__":
    sys.exit(main())
