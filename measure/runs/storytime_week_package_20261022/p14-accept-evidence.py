#!/usr/bin/env python3
"""Writes p14-accept-evidence.txt: the package, PM and owner evidence (gate 4).

The capture quotes the plan and spec lines that name the P14-D13 differences, the
PM confirmations and the owner record, then proves that the seven Phase 13
package folders hold the Phase 14 week files. Only folders under
~/Desktop/handoff/ are read. No line of the output holds a Thai character.
"""

import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
RUNS = REPO + "/measure/runs/storytime_week_package_20261022/"
TRACK = REPO + "/measure/tracks/storytime_week_package_20261022/"
HANDOFF = "/home/daniebo/Desktop/handoff/"
OUT = RUNS + "p14-accept-evidence.txt"
SOURCE = "e8549b2e"
THAI = re.compile("[฀-๿]")

PLAN_LINES = [599, 610, 615, 617, 618, 619, 699, 700, 705]
SPEC_LINES = [1078, 1079, 1080]
FOLDERS = [
    ("w01-storytime-app-package-r6", 1),
    ("w02-storytime-app-package-r5", 2),
    ("w03-storytime-app-package-r5", 3),
    ("w04-storytime-app-package-r5", 4),
    ("w05-storytime-app-package-r5", 5),
    ("w06-storytime-app-package-r5", 6),
    ("w07-storytime-app-package-r5", 7),
]


def lines_of(path, wanted):
    """The wanted one-based line numbers of a file, Thai lines replaced."""
    body = open(path, encoding="utf-8").read().split("\n")
    out = []
    for number in wanted:
        text = body[number - 1]
        if THAI.search(text):
            text = "<thai line removed>"
        out.append("%s:%d: %s" % (path.split("/")[-1], number, text))
    return out


def sh(args):
    """Runs one command and returns its standard output."""
    return subprocess.run(args, capture_output=True, text=True, cwd=REPO, check=True).stdout


def main():
    """Writes the evidence capture and returns 0 when every item holds."""
    lines = ["# p14-accept-evidence: gate 4, Phase 13 packages hold the Phase 14 week files",
             "# source commit " + SOURCE + " (the Phase 13 Packages Step B build)",
             "",
             "== plan.md lines that name the P14-D13 differences =="]
    lines += lines_of(TRACK + "plan.md", PLAN_LINES)
    lines += ["", "== spec.md P14-D13 =="]
    lines += lines_of(TRACK + "spec.md", SPEC_LINES)

    lines += ["", "== the seven Phase 13 package folders hold the Phase 14 week files =="]
    ok = 0
    for folder, week in FOLDERS:
        root = HANDOFF + folder
        week_file = root + "/l2/w%02d.json" % week
        head = subprocess.run(["git", "show", SOURCE + ":content/storytime/l2/w%02d.json" % week],
                              capture_output=True, text=True, cwd=REPO, check=True).stdout
        with open(week_file, encoding="utf-8") as handle:
            packaged = handle.read()
        same = packaged == head
        has_stage = '"paStage"' in packaged
        manifest = subprocess.run(["bash", "-c", "sha256sum -c --quiet MANIFEST.txt"],
                                  capture_output=True, text=True, cwd=root)
        stage_ok = same and has_stage and manifest.returncode == 0
        ok += 1 if stage_ok else 0
        lines.append("%s: week file equals git show %s (%s), paStage present (%s), "
                     "sha256sum -c exit %d"
                     % (folder, SOURCE, str(same), str(has_stage), manifest.returncode))
        if not stage_ok:
            lines.append("    PROBLEM in " + folder)

    plan = open(TRACK + "plan.md", encoding="utf-8").read()
    need = ["The 7 package folders check OK against their MANIFEST hashes",
            "w08: your default accepted, no w08 app package",
            "Step B plan for 11-16 accepted",
            "Received: proof-books-r6-v2 built at 17:52",
            "Record 11:01 as the receipt time of line 1",
            "Daniel answered \"Ok\" to the 64 Thai rows",
            "content commit 9f168a4e sets `approval.thai`"]
    missing = [item for item in need if item not in plan]
    lines.append("")
    lines.append("PM confirmation and owner record strings present in plan.md: %d of %d, missing: %s"
                 % (len(need) - len(missing), len(need),
                    ", ".join(missing) if missing else "none"))

    text = "\n".join(lines) + "\n"
    dropped = len([ln for ln in lines if THAI.search(ln)])
    if dropped:
        text = "\n".join(ln for ln in lines if not THAI.search(ln)) + "\n"
    text += "THAI CHARS IN OUTPUT: 0\n"
    code = 0 if (ok == len(FOLDERS) and not missing) else 1
    text += "folders holding the Phase 14 week files: %d of %d\n" % (ok, len(FOLDERS))
    text += "exit: %d\n" % code
    with open(OUT, "w", encoding="utf-8") as handle:
        handle.write(text)
    print("CAPTURE_FILE " + OUT)
    print("folders ok: %d of %d" % (ok, len(FOLDERS)))
    print("missing strings: %d" % len(missing))
    print("exit: %d" % code)
    return code


if __name__ == "__main__":
    sys.exit(main())
