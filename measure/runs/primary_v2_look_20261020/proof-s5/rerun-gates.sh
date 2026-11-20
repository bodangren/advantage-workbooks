#!/usr/bin/env bash
# S5.G8: rerun every gate after the last product commit (6bee5de2).
set -uo pipefail
RUNS=/home/daniebo/Desktop/Workbooks/measure/runs/primary_v2_look_20261020
HR=/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh

echo "GATES_RERUN_START $(date -u +%Y-%m-%dT%H:%M:%SZ) HEAD=$(git -C /home/daniebo/Desktop/Workbooks rev-parse HEAD)"

HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash "$HR" -c 'set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/chibi-quest-hero-row-type.test.ts' > "$RUNS/green-s5g8-g1.txt" 2>&1
echo "G1=$?"
HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash "$HR" -c 'set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/chibi-quest-page-flow.test.ts __tests__/chibi-quest-print-sizes.test.ts __tests__/chibi-quest-picture-keep.test.ts __tests__/chibi-quest-picture-keep.adversarial.test.ts __tests__/chibi-quest-print-floor.adversarial.test.ts' > "$RUNS/green-s5g8-g2.txt" 2>&1
echo "G2=$?"
HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash "$HR" -c 'set -o pipefail; cd dashboard && CI=true npx vitest run --exclude __tests__/storytime-unit2-sound-stage.test.ts --exclude __tests__/constants.test.ts --exclude __tests__/origins-thai-support.test.ts' > "$RUNS/green-s5g8-g3.txt" 2>&1
echo "G3=$?"
HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash "$HR" -c 'set -o pipefail; cd dashboard && npx eslint lib/document-wrapper/chibi-quest-styles.ts lib/workbook-document-wrapper.ts --no-error-on-unmatched-pattern' > "$RUNS/green-s5g8-g4.txt" 2>&1
echo "G4=$?"
HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash "$HR" -c 'set -o pipefail; cd dashboard && npx tsc --noEmit' > "$RUNS/green-s5g8-g5.txt" 2>&1
echo "G5=$?"
bash "$RUNS/proof-s5/run-g6-mutant.sh"
echo "G6=$?"

# G7: classic golden, teacher manual, styles.ts diff from phase base.
git -C /home/daniebo/Desktop/Workbooks diff --stat 04275398c9411b45685733e20fc003945524ad72..HEAD -- dashboard/lib/document-wrapper/styles.ts dashboard/lib/teacher-manual content/primary/origins-3.2/print/golden pnpm-lock.yaml > "$RUNS/green-s5g8-g7.txt" 2>&1
sha256sum /home/daniebo/Desktop/Workbooks/content/primary/origins-3.2/print/golden/lesson-05.html /home/daniebo/Desktop/Workbooks/content/primary/origins-3.2/print/golden/lesson-05-no-key.html /home/daniebo/Desktop/Workbooks/dashboard/lib/document-wrapper/styles.ts >> "$RUNS/green-s5g8-g7.txt" 2>&1
echo "G7=$?"

# G8: Thai count in added lines of every product commit.
{
  echo "S5.G8 G8: Thai characters in added lines of product commits"
  echo "commits: 679bca36 3d53b37e 33b24d0c 6bee5de2"
  for c in 679bca36 3d53b37e 33b24d0c 6bee5de2; do
    git -C /home/daniebo/Desktop/Workbooks --no-pager show --format= --unified=0 "$c" | grep '^+' | grep -v '^+++' | python3 -c "import sys,re; d=sys.stdin.read(); print('$c thai_added', len(re.findall(r'[\\u0E00-\\u0E7F]', d)))"
  done
} > "$RUNS/green-s5g8-g8.txt" 2>&1
echo "G8=$?"
echo "GATES_RERUN_DONE $(date -u +%Y-%m-%dT%H:%M:%SZ)"
