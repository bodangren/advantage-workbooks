#!/usr/bin/env bash
# Task 2.10 fast gates (the commands of the plan text), run from the repository root.
# Gate 2 exits 1 when the count is 0, so the script records the grep exit code next to the count.
LOOK=measure/tracks/storytime_cover_options_20261106/look-phase2.md
OUT=~/Desktop/print-ready/storytime/covers-quest-v1

echo "GATE_1 (must print 32):"
grep -oE '^page ([1-9]|[12][0-9]|3[0-2]): pass' "$LOOK" | sort -u | wc -l

echo "GATE_2 (must print 0; grep exits 1 for a count of 0):"
grep -cE '^page [0-9]+: fault' "$LOOK"
echo "GATE_2_GREP_EXIT=$?"

echo "GATE_3 (must print 32):"
grep -E '^page [0-9]+: pass' "$LOOK" | cut -d, -f2 | tr -d ' ' | sort -u | while read -r f; do test -f ~/Desktop/print-ready/storytime/covers-quest-v1/"$f" && echo ok; done | wc -l

echo "MANIFEST_SHA256 (must begin 8f1901a39d9decc6):"
sha256sum "$OUT"/MANIFEST.txt
