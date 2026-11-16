#!/usr/bin/env python3
"""Writes p14-testmap.txt: the code files of Phase 14 with their test files.

Section 1 lists the code files that a Phase 14 commit of this track changed
between 76fc13b0 and HEAD, with the test files that reference each one. The last
line of the section is `findings: <n>`, the count of Phase 14 code files with no
test file. schema.ts is tested by S7 of the Phase 14 test file.

Section 2 lists every other code file changed in the same range (other tracks)
with its test files, so the whole range is on the record. A file with no test
file there is named as a cross-track exception, not as a Phase 14 finding.
"""

import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
OUT = REPO + "/measure/runs/storytime_week_package_20261022/p14-testmap.txt"
BASE = "76fc13b0"
THAI = re.compile("[฀-๿]")

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
    "schema.ts": ["storytime/schema", "StorytimeWeekSchema", "paStage"],
    "check-weeks.ts": ["check-weeks", "checkWeeks", "sound-stage-"],
    "sound-stages.ts": ["sound-stages", "plannedSoundStage", "soundPositionsAsked",
                        "SOUND_STAGE_PLAN"],
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


def is_code(path):
    """A TypeScript implementation file under the dashboard code folders."""
    if not (path.startswith("dashboard/lib/") or path.startswith("dashboard/scripts/")):
        return False
    return path.endswith(".ts") and not path.endswith(".test.ts")


def main():
    log = subprocess.run(["git", "log", "--format=%H\t%s", BASE + "..HEAD"],
                         capture_output=True, text=True, cwd=REPO, check=True)
    phase14 = []
    phase14_commits = []
    other_map = {}
    for row in log.stdout.splitlines():
        if not row.strip():
            continue
        sha, subject = row.split("\t", 1)
        show = subprocess.run(["git", "show", "--name-only", "--format=", sha],
                              capture_output=True, text=True, cwd=REPO, check=True)
        code = sorted(p for p in show.stdout.splitlines() if is_code(p))
        if not code:
            continue
        mine = ("(storytime_week_package" in subject and
                ("P14" in subject or "Phase 14" in subject))
        if mine:
            phase14_commits.append(sha[:8] + " " + subject)
            for p in code:
                if p not in phase14:
                    phase14.append(p)
        else:
            for p in code:
                other_map.setdefault(p, []).append(sha[:8] + " " + subject)

    tests = subprocess.run(["bash", "-c", "ls dashboard/__tests__/*.test.ts"],
                           capture_output=True, text=True, cwd=REPO,
                           check=True).stdout.split()

    lines = ["Phase 14 code files changed %s..HEAD:" % BASE]
    for commit in phase14_commits:
        lines.append("commit " + commit)
    findings = 0
    for path in phase14:
        hits = tests_of(path, tests)
        if hits:
            lines.append("%s -> %s" % (path, ", ".join(hits)))
        else:
            lines.append("%s -> NO TEST FILE" % path)
            findings += 1
    lines.append("schema.ts note: S7 of __tests__/storytime-package-sound-stages.test.ts "
                 "parses paStage through StorytimeWeekSchema (spec FR14-5 S7); "
                 "the week-file tests parse every week through the same schema")
    lines.append("findings: %d" % findings)
    lines.append("")
    lines.append("Other code files changed %s..HEAD (other tracks, outside scope):" % BASE)
    exceptions = 0
    for path in sorted(other_map):
        hits = tests_of(path, tests)
        commits = sorted(set(other_map[path]))
        if hits:
            lines.append("%s -> %s" % (path, ", ".join(hits)))
        else:
            lines.append("%s -> NO TEST FILE (cross-track exception)" % path)
            exceptions += 1
        lines.append("    changed by: " + "; ".join(commits))
    lines.append("cross-track findings (outside scope): %d" % exceptions)
    text = "\n".join(lines) + "\n"
    assert not THAI.search(text), "Thai character in testmap output"
    code = 0 if findings == 0 else 1
    text += "exit: %d\n" % code
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(text)
    print(text)
    print("phase14 code files: %d, other code files: %d" % (len(phase14), len(other_map)))
    print("findings: %d" % findings)
    print("exit: %d" % code)
    return code


if __name__ == "__main__":
    sys.exit(main())
