#!/usr/bin/env python3
"""Writes p13-testmap.txt: the code files of Phase 13 with their test files.

Section 1 lists the Phase 13 code files of the blast radius (plan.md line 527)
that changed between c42918df and HEAD, with the test files that reference each
one. The last line of the section is `findings: <n>`, the count of Phase 13 code
files with no test file.

Section 2 lists every other code file changed in the same range (other tracks and
Phase 14) with its test files, so the whole range is on the record. A file with
no test file there is named as a cross-track exception, not as a Phase 13 finding.

`dashboard/lib/storytime/schema.ts` holds a JSDoc change only for Phase 13 and is
exempt by the task line; it still lists the test files that parse week files.
"""

import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
OUT = REPO + "/measure/runs/storytime_week_package_20261022/p13-testmap.txt"
BASE = "c42918df"
THAI = re.compile("[฀-๿]")

PHASE13 = [
    "dashboard/lib/storytime/sentence-clips.ts",
    "dashboard/scripts/storytime/make-sentence-clips.ts",
    "dashboard/scripts/storytime/make-word-bank.ts",
    "dashboard/scripts/storytime/set-sentence-clips.ts",
    "dashboard/scripts/storytime/check-weeks.ts",
    "dashboard/lib/storytime/schema.ts",
]

SECONDARY = {
    "manual.ts": ["renderManual", "storytime/manual"],
    "student-book.ts": ["student-book", "studentBook"],
    "cover-quest.ts": ["cover-quest", "questReaderCoverPage"],
    "line-art-fix.ts": ["line-art-fix", "fillStorytimeLineArtHair"],
    "picture-check.ts": ["picture-check", "pictureCheck"],
    "readers.ts": ["storytime/print/readers", "compileReaders"],
    "step-map.ts": ["step-map", "stepMap"],
    "step-pages.ts": ["step-pages", "stepPages"],
    "trace-words.ts": ["trace-words", "traceWords"],
    "schema.ts": ["storytime/schema", "StorytimeWeekSchema"],
    "sentence-clips.ts": ["sentence-clips", "planSentenceClips", "checkSentenceClips"],
    "sound-stages.ts": ["sound-stages", "soundStages"],
    "check-weeks.ts": ["check-weeks", "checkWeeks"],
    "make-line-art-hair-fill.ts": ["make-line-art-hair-fill", "lineArtHairFill"],
    "make-sentence-clips.ts": ["make-sentence-clips", "planSentenceClips"],
    "make-word-bank.ts": ["make-word-bank"],
    "set-sentence-clips.ts": ["set-sentence-clips"],
}


def tests_of(path, tests):
    """The test files that reference the code file, by module name and surface."""
    base = path.split("/")[-1]
    stem = base[:-3]
    patterns = [base, stem] + SECONDARY.get(base, [])
    hits = set()
    for pattern in patterns:
        run = subprocess.run(["grep", "-l", "-e", pattern] + tests,
                             capture_output=True, text=True, cwd=REPO)
        for line in run.stdout.splitlines():
            if line:
                hits.add(line.split("/")[-1])
    return sorted(hits)


def main():
    done = subprocess.run(
        ["git", "diff", "--name-only", BASE + "..HEAD", "--",
         "dashboard/lib", "dashboard/scripts"],
        capture_output=True, text=True, cwd=REPO, check=True)
    changed = sorted(p for p in done.stdout.splitlines()
                     if p.endswith(".ts") and not p.endswith(".test.ts"))
    tests = subprocess.run(["bash", "-c", "ls dashboard/__tests__/*.test.ts"],
                           capture_output=True, text=True, cwd=REPO,
                           check=True).stdout.split()
    phase13 = [p for p in PHASE13 if p in changed]
    other = [p for p in changed if p not in phase13]

    lines = ["Phase 13 code files changed %s..HEAD (plan.md line 527):" % BASE]
    findings = 0
    for path in phase13:
        hits = tests_of(path, tests)
        if hits:
            lines.append("%s -> %s" % (path, ", ".join(hits)))
        else:
            lines.append("%s -> NO TEST FILE" % path)
            findings += 1
    lines.append("schema.ts note: JSDoc change only for Phase 13, exempt by the task line")
    lines.append("findings: %d" % findings)
    lines.append("")
    lines.append("Other code files changed %s..HEAD (other tracks and Phase 14):" % BASE)
    exceptions = 0
    for path in other:
        hits = tests_of(path, tests)
        if hits:
            lines.append("%s -> %s" % (path, ", ".join(hits)))
        else:
            lines.append("%s -> NO TEST FILE (cross-track exception, see note)" % path)
            exceptions += 1
    lines.append("cross-track exceptions: %d" % exceptions)
    lines.append("note: dashboard/scripts/storytime/make-line-art-hair-fill.ts is the print track "
                 "commit e0350881 (storytime_print_r1), not a Phase 13 file; its module surface "
                 "fillStorytimeLineArtHair and readStorytimeLineArtFixTable is tested by "
                 "storytime-print-r6v2-fixes.test.ts (X3 and the fill-function cases), and its "
                 "live check p9a-green-hair.txt prints 'hair fills equal 4 of 4' with exit 0.")
    text = "\n".join(lines) + "\n"
    assert not THAI.search(text), "Thai character in testmap output"
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(text)
    print(text)
    print("phase13 code files: %d, other code files: %d" % (len(phase13), len(other)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
