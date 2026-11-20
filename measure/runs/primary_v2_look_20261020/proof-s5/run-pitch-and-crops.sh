#!/usr/bin/env bash
# S5.G8: line-pitch report and before/after page-3 crops for proof round 11.
set -uo pipefail
P=/home/daniebo/Desktop/Workbooks/measure/runs/primary_v2_look_20261020/proof-s5
F=/home/daniebo/Desktop/print-ready/primary-v2-look/proof-s5-r11
OUT=/home/daniebo/Desktop/Workbooks/measure/runs/primary_v2_look_20261020/green-s5g8-pitch-r11.txt
CROPS=$F/before-after

{
  echo "S5.G8 Ghostscript txtwrite line pitch, proof round 11"
  cd "$P"
  python3 -I -B line-pitch.py "$F/quest5-l01.pdf" 3 300 Q5_PARA1
  python3 -I -B line-pitch.py "$F/quest5-l01.pdf" 4 0 Q5_PARA2
  python3 -I -B line-pitch.py "$F/adventure92-l09.pdf" 3 300 A92_PARA1
  python3 -I -B line-pitch.py "$F/adventure92-l09.pdf" 4 0 A92_PARA2
} > "$OUT" 2>&1

mkdir -p "$CROPS"
cp "$F/../proof-s5-r10/before-after/quest5-l01-page3-r10.png" "$CROPS/" 2>/dev/null || true
cp "$F/../proof-s5-r10/before-after/adventure92-l09-page3-r10.png" "$CROPS/" 2>/dev/null || true
cd "$P"
python3 -I -B make-before-after.py --pdf "$F/quest5-l01.pdf" --page 3 --out "$CROPS/quest5-l01-page3-r11.png" >> "$OUT" 2>&1
python3 -I -B make-before-after.py --pdf "$F/adventure92-l09.pdf" --page 3 --out "$CROPS/adventure92-l09-page3-r11.png" >> "$OUT" 2>&1
echo "crops in $CROPS:" >> "$OUT"
ls -1 "$CROPS" >> "$OUT" 2>&1
echo "PITCH_CROPS_DONE" >> "$OUT"
