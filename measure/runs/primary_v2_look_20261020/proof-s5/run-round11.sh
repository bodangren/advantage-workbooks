#!/usr/bin/env bash
# S5.G8 proof round 11 pipeline (track primary_v2_look_20261020).
# Each render, PDF, rasterize, and check step uses one heavy-run wrapper.
set -uo pipefail

RUNS=/home/daniebo/Desktop/Workbooks/measure/runs/primary_v2_look_20261020
P=$RUNS/proof-s5
DASH=/home/daniebo/Desktop/Workbooks/dashboard
FOLDER=/home/daniebo/Desktop/print-ready/primary-v2-look/proof-s5-r11
CAPTURES=/home/daniebo/Desktop/advantage-pr/assets/screenshots/primary-advantage/parity-run2-2026-10-19/student

heavy() {
  HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 \
    bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c "$1"
}

echo "STEP 1: Thai filter (first command that touches a package)"
python3 -I -B "$P/thai-filter.py" \
  /home/daniebo/Desktop/Workbooks/content/primary/quest-5/l01.json \
  /home/daniebo/Desktop/Workbooks/content/primary/adventure-9.2/l09.json \
  > "$RUNS/green-s5g8-thai-filter.txt" 2>&1
echo "thai_filter_exit=$?"

echo "STEP 2: render both proof HTML files"
heavy 'set -o pipefail; cd /home/daniebo/Desktop/Workbooks/dashboard && npx tsx scripts/render-lesson-html.ts ../content/primary/quest-5/l01.json --out ../measure/runs/primary_v2_look_20261020/proof-s5/quest5-l01.html --look chibi-quest --series "Quest 5" --level A1' > "$RUNS/green-s5g8-render-q5.txt" 2>&1
echo "render_q5_exit=$?"
heavy 'set -o pipefail; cd /home/daniebo/Desktop/Workbooks/dashboard && npx tsx scripts/render-lesson-html.ts ../content/primary/adventure-9.2/l09.json --out ../measure/runs/primary_v2_look_20261020/proof-s5/adventure92-l09.html --look chibi-quest --series "Adventure 9.2" --level A2+' > "$RUNS/green-s5g8-render-a92.txt" 2>&1
echo "render_a92_exit=$?"

echo "STEP 3: make both Chrome PDFs"
heavy "set -o pipefail; cd $DASH && npx tsx ../measure/runs/primary_v2_look_20261020/proof-s5/make-proof-pdf.ts --round-html ../measure/runs/primary_v2_look_20261020/proof-s5/quest5-l01.html --round-html ../measure/runs/primary_v2_look_20261020/proof-s5/adventure92-l09.html --round-package ../content/primary/quest-5/l01.json --round-package ../content/primary/adventure-9.2/l09.json --html ../measure/runs/primary_v2_look_20261020/proof-s5/quest5-l01.html --package ../content/primary/quest-5/l01.json --out $FOLDER/quest5-l01.pdf --folder $FOLDER --tag quest5-l01" > "$RUNS/green-s5g8-pdf-q5.txt" 2>&1
echo "pdf_q5_exit=$?"
heavy "set -o pipefail; cd $DASH && npx tsx ../measure/runs/primary_v2_look_20261020/proof-s5/make-proof-pdf.ts --round-html ../measure/runs/primary_v2_look_20261020/proof-s5/quest5-l01.html --round-html ../measure/runs/primary_v2_look_20261020/proof-s5/adventure92-l09.html --round-package ../content/primary/quest-5/l01.json --round-package ../content/primary/adventure-9.2/l09.json --html ../measure/runs/primary_v2_look_20261020/proof-s5/adventure92-l09.html --package ../content/primary/adventure-9.2/l09.json --out $FOLDER/adventure92-l09.pdf --folder $FOLDER --tag adventure92-l09" > "$RUNS/green-s5g8-pdf-a92.txt" 2>&1
echo "pdf_a92_exit=$?"

echo "STEP 4: contact sheets"
heavy "set -o pipefail; cd $P && python3 -I -B make-contact-sheet.py --pdf $FOLDER/quest5-l01.pdf --tag quest5-l01 --folder $FOLDER --captures $CAPTURES" > "$RUNS/green-s5g8-sheet-q5.txt" 2>&1
echo "sheet_q5_exit=$?"
heavy "set -o pipefail; cd $P && python3 -I -B make-contact-sheet.py --pdf $FOLDER/adventure92-l09.pdf --tag adventure92-l09 --folder $FOLDER --captures $CAPTURES" > "$RUNS/green-s5g8-sheet-a92.txt" 2>&1
echo "sheet_a92_exit=$?"

echo "STEP 5: manifest"
heavy "set -o pipefail; cd $P && S5_FOLDER=$FOLDER python3 -I -B manifest.py --out $P/manifest-r11.txt" > "$RUNS/green-s5g8-manifest.txt" 2>&1
echo "manifest_exit=$?"

echo "STEP 6: checks P1 to P20"
heavy "set -o pipefail; cd $P && export S5_ROUND=r11 S5_FOLDER=$FOLDER && rc=0; for p in \$(seq 1 20); do python3 -I -B checks.py --check P\$p || rc=1; done; python3 -I -B checks.py --assemble || rc=1; exit \$rc" > "$RUNS/green-s5g8-checks-r11.txt" 2>&1
echo "checks_exit=$?"

echo "PIPELINE_DONE"
