#!/usr/bin/env bash
# S5.G8 G6 mutant: remove the F26 rule, show the Red test fails, restore.
set -uo pipefail
RUNS=/home/daniebo/Desktop/Workbooks/measure/runs/primary_v2_look_20261020
FILE=/home/daniebo/Desktop/Workbooks/dashboard/lib/document-wrapper/chibi-quest-styles.ts
BACKUP=/tmp/opencode/g6-chibi-styles-backup.ts
OUT=$RUNS/green-s5g8-g6.txt

{
  echo "S5.G8 G6 mutant: remove F26 rule .look-chibi-quest .chibi-hero-row .paragraph"
  echo "before_sha256 $(sha256sum "$FILE" | cut -d' ' -f1)"
  echo "backup_sha256 $(sha256sum "$BACKUP" | cut -d' ' -f1)"
} > "$OUT" 2>&1

python3 - "$FILE" << 'PY'
import sys
path = sys.argv[1]
text = open(path, encoding='utf8').read()
rule = ("/* F26 (review A r7): paragraph 1 shares the hero row and sits outside the article-text\n"
        "   element in the template. Give it the same print type as paragraphs 2+ (template :1387-1390).\n"
        "   Drop its bottom margin so the taller 24 pt paragraph keeps the row on page 3 (P17). */\n"
        ".look-chibi-quest .chibi-hero-row .paragraph { font-size: 12pt; line-height: 2; margin-bottom: 0; }\n")
assert text.count(rule) == 1, 'F26 rule not found exactly once'
open(path, 'w', encoding='utf8').write(text.replace(rule, ''))
PY
echo "mutant_applied=$?" >> "$OUT"

echo "mutant_sha256 $(sha256sum "$FILE" | cut -d' ' -f1)" >> "$OUT"
echo "--- targeted test on mutant (expect failure) ---" >> "$OUT"
HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 \
  bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c \
  'set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/chibi-quest-hero-row-type.test.ts' \
  >> "$OUT" 2>&1
echo "MUTANT_TEST_EXIT=$?" >> "$OUT"

cp "$BACKUP" "$FILE"
echo "restored_sha256 $(sha256sum "$FILE" | cut -d' ' -f1)" >> "$OUT"
git -C /home/daniebo/Desktop/Workbooks diff --exit-code -- dashboard/lib/document-wrapper/chibi-quest-styles.ts >> "$OUT" 2>&1
echo "RESTORE_DIFF_EXIT=$?" >> "$OUT"
echo "G6_DONE" >> "$OUT"
