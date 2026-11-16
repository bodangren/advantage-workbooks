#!/usr/bin/env python3
"""Runs one Phase 14 acceptance gate through heavy-run and writes its capture.

Usage: python3 -I -B p14-accept-gates.py <project|lint|checks>
The capture ends with `exit: <code>` (p14-accept-capture.py).
"""

import subprocess
import sys

RUNS = "measure/runs/storytime_week_package_20261022/"
HEAVY = "bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '"
PROJECT = ("cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts "
           "__tests__/covers-*.test.ts __tests__/print-pdfx.test.ts --maxWorkers=1")
LINT = ("cd dashboard && npx eslint lib/storytime scripts/storytime "
        "__tests__/storytime-loops-*.test.ts __tests__/storytime-book-pictures.test.ts "
        "__tests__/storytime-package-*.test.ts __tests__/storytime-print-card-kit.test.ts "
        "__tests__/storytime-print-a48-step2.test.ts")
CHECKS = 'cd dashboard && out=$(npx tsx scripts/storytime/check-weeks.ts --level 2); test "$(printf "%s\n" "$out" | grep -c "  FAIL ")" -le 1 && ! printf "%s\n" "$out" | grep "  FAIL " | grep -v "  FAIL    published" && npx tsc --noEmit'
GATES = {"project": HEAVY + PROJECT + "'", "lint": HEAVY + LINT + "'",
         "checks": HEAVY + CHECKS + "'"}
NAMES = {"project": "p14-accept-project.txt", "lint": "p14-accept-lint.txt",
         "checks": "p14-accept-checks.txt"}


def main(argv):
    """Runs the named gate and prints the capture path and its exit code."""
    key = argv[0]
    cmd = GATES[key]
    run = subprocess.run([sys.executable, "-I", "-B", RUNS + "p14-accept-capture.py",
                          RUNS + NAMES[key], cmd], capture_output=True, text=True)
    sys.stdout.write(run.stdout)
    sys.stderr.write(run.stderr)
    return run.returncode


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
