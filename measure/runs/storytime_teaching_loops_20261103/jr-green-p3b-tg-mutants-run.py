#!/usr/bin/env python3
"""Phase 3b text-gate baseline part 1: the 6 red-log falsifiers on make-manual-pdf.ts.

The runner applies one mutation at a time, runs the 11 Red tests with --bail=1, records
`caught` (non-zero exit) or `SURVIVED`, restores the backup, and asserts the restore is
byte equal. A survivor is a finding for the orchestrator; no test changes here.
"""

import filecmp
import os
import shutil
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
DASHBOARD = os.path.join(REPO, "dashboard")
TARGET = os.path.join(DASHBOARD, "scripts/storytime/make-manual-pdf.ts")
WORK = "/tmp/opencode/p3b-tg-mut"
BACKUP = os.path.join(WORK, "make-manual-pdf.ts.bak")
TEST_FILE = "__tests__/storytime-loops-book-pages.test.ts"

FLAG = "        else if (a === '--book-pages') bookPages = true;\n"
CALL = ", share, studentBookPages }).html"
LIST = (
    "storytimeStudentBookPages(readLevelWeeks(STORYTIME_ROOT, weeks[0].meta.level)"
    ".flatMap((r) => (r.week ? [r.week] : [])))"
)
LIST_BLOCK = (
    "    const studentBookPages = bookPages\n"
    "        ? " + LIST + "\n"
    "        : undefined;"
)

MUTANTS = [
    (
        "M1 B1 flag: remove the branch for --book-pages",
        FLAG,
        "",
    ),
    (
        "M2 B1 call: drop studentBookPages from the compile call",
        CALL,
        ", share }).html",
    ),
    (
        "M3 B2: build the page list from the requested weeks only",
        LIST,
        "storytimeStudentBookPages(weeks)",
    ),
    (
        "M4 B2: pass the list under a changed option name",
        "share, studentBookPages })",
        "share, studentBookPagesList: studentBookPages })",
    ),
    (
        "M5 B3: make the page list the default",
        "const studentBookPages = bookPages",
        "const studentBookPages = bookPages || true",
    ),
    (
        "M6 B3: pass the list while bookPages stays false",
        LIST_BLOCK,
        "    const studentBookPages = " + LIST + ";",
    ),
]


def read_target() -> str:
    with open(TARGET, "r", encoding="utf-8") as handle:
        return handle.read()


def write_target(text: str) -> None:
    with open(TARGET, "w", encoding="utf-8") as handle:
        handle.write(text)


def main() -> int:
    os.makedirs(WORK, exist_ok=True)
    shutil.copy2(TARGET, BACKUP)
    original = read_target()
    caught = 0
    survivors = []
    not_applicable = 0

    print("target: " + os.path.relpath(TARGET, REPO))
    print("tests: " + TEST_FILE)
    print("baseline sha256 file: " + BACKUP)
    print("")

    for index, (name, old, new) in enumerate(MUTANTS, start=1):
        text = original
        count = text.count(old)
        if count != 1:
            print("M%d NOT APPLIED: the old string occurs %d times: %s" % (index, count, name))
            not_applicable += 1
            write_target(original)
            continue
        mutated = text.replace(old, new)
        if mutated == text:
            print("M%d NOT APPLIED: the mutation changes nothing: %s" % (index, name))
            not_applicable += 1
            write_target(original)
            continue
        write_target(mutated)
        log = os.path.join(WORK, "mutant-%d.txt" % index)
        with open(log, "w", encoding="utf-8") as handle:
            result = subprocess.run(
                ["npx", "vitest", "run", TEST_FILE, "--maxWorkers=1", "--bail=1"],
                cwd=DASHBOARD,
                env={**os.environ, "CI": "true"},
                stdout=handle,
                stderr=subprocess.STDOUT,
                timeout=600,
            )
        write_target(original)
        if not filecmp.cmp(BACKUP, TARGET, shallow=False):
            print("M%d RESTORE FAILED" % index)
            return 2
        if result.returncode != 0:
            caught += 1
            print("M%d caught (exit %d): %s  [%s]" % (index, result.returncode, name, os.path.basename(log)))
        else:
            survivors.append(name)
            print("M%d SURVIVED (exit 0): %s  [%s]" % (index, name, os.path.basename(log)))

    write_target(original)
    restore_ok = filecmp.cmp(BACKUP, TARGET, shallow=False)
    status = subprocess.run(
        ["git", "status", "--porcelain", "dashboard/scripts/storytime"],
        cwd=REPO,
        capture_output=True,
        text=True,
        check=False,
    )
    print("")
    print("mutants: %d, caught: %d" % (len(MUTANTS), caught))
    print("n/a: %d" % not_applicable)
    print("restore cmp: %s" % ("ok" if restore_ok else "FAILED"))
    print("git status --porcelain dashboard/scripts/storytime:")
    print(status.stdout, end="")
    if survivors:
        print("")
        for name in survivors:
            print("SURVIVOR: " + name)
    if not restore_ok or survivors or not_applicable or caught != len(MUTANTS):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
