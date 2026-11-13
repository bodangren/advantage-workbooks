#!/usr/bin/env bash
# Task 2.9 close: the named-file check (deviation D-3 of print-gate.txt) and the raw counts of the plan fast gate.
D=~/Desktop/print-ready/storytime/covers-quest-v1
FILES="student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r5_PDFX-1a.pdf
teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r5_PDFX-1a.pdf
readers-a3/Storytime-Advantage-L2-U1-Reader-Covers-A3-v1_PDFX-1a.pdf
readers-leaf/Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v1_PDFX-1a.pdf
contact-sheets/all.png
contact-sheets/readers-a3.png
contact-sheets/readers-leaf.png
contact-sheets/student-alt-hlogo-r5.png
contact-sheets/teacher-alt-hlogo-r5.png"

echo "NAMED_FILES (ls -l):"
ok=0
for f in $FILES; do
  if test -f "$D/$f"; then ls -l "$D/$f"; ok=$((ok+1)); else echo "MISSING $f"; fi
done
echo "NAMED_FILES_EXIST=$ok of 9"

echo "RAW_COUNT_PRINT_FILES (plan fast gate, information for D-3; the plan expects 4):"
ls "$D"/student/*_PDFX-1a.pdf "$D"/teacher/*_PDFX-1a.pdf "$D"/readers-a3/*_PDFX-1a.pdf "$D"/readers-leaf/*_PDFX-1a.pdf | wc -l
echo "RAW_COUNT_CONTACT_SHEETS (plan fast gate, information for D-3; the plan expects 5):"
ls "$D"/contact-sheets/*.png | wc -l
