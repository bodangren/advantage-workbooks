#!/usr/bin/env python3
"""Runs one command in the repository root and saves a Thai-filtered capture (Phase 13 acceptance).

Usage: python3 -I -B p13-accept-capture.py <capture file> <command>

The command runs through bash. Every output line that holds a character from
U+0E00 to U+0E7F is dropped (the same rule as `grep -v -P '[\\x{0E00}-\\x{0E7F}]'`),
and the capture records how many lines were dropped. The capture holds a header,
the standard output, the standard error, then the last line `exit: <n>` with the
exit code of the command (not of the filter). The script prints only the capture
path, the dropped-line count, and the exit code, each free of Thai characters.
"""

import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
THAI = re.compile("[฀-๿]")


def main(argv):
    """Runs the command and writes the filtered capture."""
    capture_path, command = argv[0], argv[1]
    done = subprocess.run(["bash", "-c", command], capture_output=True, text=True,
                          cwd=REPO)
    text = done.stdout
    if done.stderr:
        text += ("\n" if text and not text.endswith("\n") else "") + done.stderr
    lines = text.split("\n")
    kept = [ln for ln in lines if not THAI.search(ln)]
    dropped = len(lines) - len(kept)
    body = "\n".join(kept)
    if body and not body.endswith("\n"):
        body += "\n"
    header = "CAPTURE p13-accept\nCOMMAND: %s\nTHAI_LINES_DROPPED: %d\n\n" % (command, dropped)
    with open(capture_path, "w", encoding="utf-8") as handle:
        handle.write(header + body + "\nexit: %d\n" % done.returncode)
    print("CAPTURE_FILE " + capture_path)
    print("THAI_LINES_DROPPED: %d" % dropped)
    print("exit: %d" % done.returncode)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
