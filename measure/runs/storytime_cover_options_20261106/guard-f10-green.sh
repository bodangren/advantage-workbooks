#!/usr/bin/env bash
# Step 11 of Task (Green, F10): guard G-1 (D-F10-15) on each Green commit.
# The Green allowed paths: dashboard/lib/storytime/print/cover-quest.ts,
# measure/runs/storytime_cover_options_20261106/, measure/tracks/storytime_cover_options_20261106/.
# The commits 75c4397e, 008da5fa, 75001cf0, and 5b79514a are the Red retry R1 and are not listed.
# Usage: bash guard-f10-green.sh <sha>... (run from the repository root)
set -u
total=0
outside=0
for sha in "$@"; do
  files=$(git show --name-only --format= "$sha")
  count=$(printf '%s\n' "$files" | grep -c .)
  bad=$(printf '%s\n' "$files" | grep -v -e '^dashboard/lib/storytime/print/cover-quest.ts$' -e '^measure/runs/storytime_cover_options_20261106/' -e '^measure/tracks/storytime_cover_options_20261106/' | grep -c .)
  echo "COMMIT $sha files=$count outside=$bad"
  printf '%s\n' "$files" | sed 's/^/  /'
  total=$((total + 1))
  outside=$((outside + bad))
done
echo "COMMITS $total OUTSIDE_TOTAL $outside"
test "$outside" -eq 0
