#!/usr/bin/env bash
# Step 1 of Task (Green, F10): repeat the commands of M-F10-1 to M-F10-13 at the role base.
# Track storytime_cover_options_20261106. Read-only. Run from the repository root.
set -u
Q=dashboard/lib/storytime/print/cover-quest.ts
R=$HOME/Desktop/print-ready/storytime/covers-quest-v1
echo '== M-F10-1 (the call path)'
grep -n "function renderQuestCover\|function frontBody\|function titlePlaqueFront\|function seriesBanner\|function plaqueSvg" "$Q"
echo '== M-F10-2 (where r5 lost the title)'
git show 23f746a4 -- "$Q" | grep -n "logoTile"
git show 23f746a4~1:"$Q" | grep -n "function frontBody" -A22
echo '== M-F10-3 (the r5 Chrome PDFs, counts only)'
python3 -I -B /tmp/opencode/p2f10/thai_count.py
echo '== M-F10-4 (the level plate)'
grep -n "function titlePlaqueFront\|'student-front:title-plaque'\|'teacher-front:title-plaque'\|FRONT_TITLE_FONT_MM =" "$Q"
echo '== M-F10-5 (the first front plate)'
grep -n "student-front:series-banner\|student-front:series-logo\|teacher-front:series-banner" "$Q"
ls -l "$R/student/front.png" "$R/teacher/teacher-front.png"
echo '== M-F10-6 (the plate measure)'
python3 -I -B /tmp/opencode/p2f10/plate_measure.py
echo '== M-F10-7 (the free band)'
python3 -I -B /tmp/opencode/p2f10/free_band.py
echo '== M-F10-8 (the logo colours)'
grep -n "^const LOGO_AMBER\|^const LOGO_BROWN\|^const LOGO_CREAM\|^const LOGO_WHITE\|^const PLAQUE_AMBER_PALETTE\|^const READER_PLAQUE_BAND_INSET_MM" "$Q"
echo '== M-F10-9 (the pins of the r5 front)'
grep -n "series-banner\|seriesNameNodes\|R3_TILE_BOXES\|R3_PARTS" dashboard/__tests__/quest-cover-hlogo.test.ts dashboard/__tests__/quest-cover-f1f2.test.ts | head -40
echo '== M-F10-10 (the reader titles)'
grep -n "function readerTitlePlaque\|function leafTitlePlaque" "$Q"
echo '== M-F10-11 (Thai in the code and quest.json, counts only)'
grep -cP "[\x{0E00}-\x{0E7F}]" "$Q" content/storytime/covers/quest.json
echo '== M-F10-12 (the accepted set)'
sha256sum "$R/MANIFEST.txt"
wc -l "$R/MANIFEST.txt"
grep -n "back-alt-hlogo-r5\|front-alt-hlogo-r5" "$R/MANIFEST.txt"
sha256sum "$R/student/back-alt-hlogo-r5.png" "$R/teacher/teacher-back-alt-hlogo-r5.png" "$R/student/front-alt-hlogo-r5.png" "$R/teacher/teacher-front-alt-hlogo-r5.png"
echo '== M-F10-13 (the scripts of the earlier rounds)'
ls measure/runs/storytime_cover_options_20261106 | grep "copy_2_9j\|contact-2-9j\|gate-functions-2-9l\|link_pictures_2_9c\|fix-back-edge\|prep-teacher"
echo '== the output folder of D-F10-11 (must not exist)'
ls -d "$HOME/Desktop/print-ready/storytime/covers-quest-v1-books-r6" || echo 'ABSENT covers-quest-v1-books-r6'
