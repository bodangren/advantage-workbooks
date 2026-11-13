#!/usr/bin/env python3
"""Writes p12-testmap.txt: each Phase 12 code file with its test files.

The code files are the 8 files of Green 1 commit 0c664ccf (make-sentence-clips.ts
also carries the Green R1 fix 6e272b28). For each code file the script greps the
dashboard storytime test files for the module surface and writes one line per
code file: the code file, its test files, and whether a test file references it.
"""
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
OUT = "/home/daniebo/Desktop/Workbooks/measure/runs/storytime_week_package_20261022/p12-testmap.txt"

CODE_FILES = [
    ("dashboard/lib/storytime/word-clips.ts", "word-clips.ts"),
    ("dashboard/lib/storytime/sentence-clips.ts", "sentence-clips.ts"),
    ("dashboard/lib/storytime/schema.ts", "schema"),
    ("dashboard/scripts/storytime/make-word-bank.ts", "make-word-bank"),
    ("dashboard/scripts/storytime/set-word-clips.ts", "set-word-clips"),
    ("dashboard/scripts/storytime/make-sentence-clips.ts", "make-sentence-clips"),
    ("dashboard/scripts/storytime/set-sentence-clips.ts", "set-sentence-clips"),
    ("dashboard/scripts/storytime/check-weeks.ts", "check-weeks"),
]

# Search patterns per code file: exported surface or script name.
PATTERNS = {
    "word-clips.ts": ["word-clips", "openingWordKeys", "practiceWordKeys", "planPracticeClips", "checkPracticeClips"],
    "sentence-clips.ts": ["sentence-clips", "planSentenceClips", "checkSentenceClips", "looksLikeCut", "sentenceHeardPasses"],
    "schema": ["storytime/schema", "StorytimeWeekSchema"],
    "make-word-bank": ["make-word-bank", "--practice"],
    "set-word-clips": ["set-word-clips"],
    "make-sentence-clips": ["make-sentence-clips", "synthesize"],
    "set-sentence-clips": ["set-sentence-clips"],
    "check-weeks": ["check-weeks", "practice-clips", "sentence-clips"],
}


def grep_files(pattern):
    done = subprocess.run(
        ["grep", "-l", pattern, "dashboard/__tests__/storytime-package-practice-clips.test.ts",
         "dashboard/__tests__/storytime-package-clips.test.ts", "dashboard/__tests__/storytime-week.test.ts",
         "dashboard/__tests__/storytime-loops-content.test.ts", "dashboard/__tests__/storytime-loops-share-content.test.ts",
         "dashboard/__tests__/storytime-loops-checks.test.ts", "dashboard/__tests__/storytime-loops-schema.test.ts",
         "dashboard/__tests__/storytime-loops-audio.test.ts"],
        capture_output=True, text=True, cwd=REPO)
    return [line for line in done.stdout.splitlines() if line]


def main():
    lines = []
    missing = 0
    for path, key in CODE_FILES:
        hits = set()
        for pattern in PATTERNS[key]:
            for hit in grep_files(pattern):
                hits.add(hit)
        if hits:
            names = ", ".join(sorted(h.split("/")[-1] for h in hits))
            lines.append(f"{path} -> {names}")
        else:
            lines.append(f"{path} -> NO TEST FILE")
            missing += 1
    lines.append(f"findings: {missing}")
    text = "\n".join(lines) + "\n"
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(text)
    print(text)


if __name__ == "__main__":
    main()
