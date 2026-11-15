# Print audit of proof-books-r6-v4 (re-audit J1 of the r6-v3 FAIL)

Auditor: print-proof-auditor, claude-code/claude-sonnet-5-5#high, 2026-11-16. I did not build this book and I fixed nothing.
Proof: `~/Desktop/print-ready/storytime/proof-books-r6-v4/`.
MANIFEST SHA-256: `9388dd6d7e7dc05cd70b705b0c5d4e0658c2ea410127e67b6b29eff37a664ec5`.
`sha256sum -c MANIFEST.txt` gives 0 failures (every listed file OK).
Transcription: the auditor could not write a file. The orchestrator's build session saved its final reply here word for word. The auditor's scratch folder /tmp/opencode/print-audit-r6-v4/ is named in the text below.

## Gate verdict: PASS

The audit found 0 blockers, 0 majors and 8 open minors, plus 2 new small notes. The skill rule (0 blockers and 0 majors) is met.
The r6-v3 major G4 is fixed. The r6-v3 minors G2, H1 and B6 are fixed.
The open minors go to Daniel with the default: the print order goes ahead, and Daniel decides each minor.

## Counts (53 items)

| Result | Count |
|---|---|
| pass | 43 |
| fail | 8 (0 blocker, 0 major, 8 minor) |
| n.a. | 2 (B5, I2) |

Faults per section: A 1 (A6); B 1 (B3); C 0; D 3 (D1, D2, D5); E 0; F 1 (F3); G 2 (G1, G3); H 0; I 0; J 0.

All 8 fails are the open minors of D-P9C-4. They are known and owned. None is new.
There are 2 extra notes that are not checklist items (N1 and N2, below).

## 1. J1: each fail of the r6-v3 audit, re-checked on r6-v4

| Item | r6-v3 | r6-v4 result |
|---|---|---|
| G4 (major) | fail | pass |
| G2 (minor) | fail | pass (teacher p220) |
| H1 (minor) | fail | pass |
| B6 (minor) | fail | pass |
| Number circle (new point) | n.a. | minor, open |

### G4: student pages 134, 136, 138 and 140, at 300 dpi
- Sentence dot position. On all 16 rows the sentence dot stands right after the last mark of its text. The measured ink gap is 1.86 to 2.46 mm. The dot is 1.6 to 1.9 mm across.
- Picture dot position. The picture dots are at x = 1822 to 1843 px. They stand 1.9 mm left of each picture box edge, and level with the sentence dot (same y).
- Gap between the two dots. The gap is 74.6 to 91.3 mm. The smallest is p140 row 4 (74.6 mm); the maker reports 74.44 mm, which agrees with a different edge reference. The r6-v3 gap was 5.8 mm.
- Can four crossing lines be read? I drew the lines of the teacher key on pages 140 and 134 and computed pages 136 and 138 from the dot centres. The closest approach of any line to a dot that is not its own is 14.3 mm (p138); 25.4 mm (p134), 25.2 mm (p136) and 27.5 mm (p140) on the other pages. The steepest line is 50 degrees (p138). The lines cross in empty space between the text and the pictures, and they never touch other text. The one pair with an angle of 1.5 degrees (p140, lines 1 and 3) is parallel and 65 mm apart. A teacher can read all four lines on every page.
- Spec note (not a fault). The maker measures 1.50 mm at the text box edge. By ink edge the gap is 1.86 to 2.46 mm. The spec says 2 mm or less. 8 of 16 rows are 2.0 to 2.5 mm by ink, because the "." and "!" glyphs have side space. The dot is clearly joined to its sentence. I do not count this as a fault.
- Key matches the pictures on p134, p136, p138 and p140. p138 row 4 ("Tom can see a top.") shows a small top in the toy chest; the match is valid. p136 sentence 2, "Pam is off Sam!", maps to row 1, which shows a boy and a girl apart: a weak picture, the same page image as r6-v3, not a new fault.

### G2: teacher p220
- The key now reads "<text> = the picture in row k", with k from 1 to 4. 16 lines.
- The rows match the Red list: day 2 is 2, 4, 1, 3; day 3 is 3, 1, 4, 2; day 4 is 4, 3, 2, 1; day 5 is 2, 1, 4, 3.
- Row k is the picture level with sentence k's slot, so the teacher can count it from the top. The key holds no new Thai text. The W08 draft text differs from the r6-v3 draft only on these 16 lines.

### H1
- The note lists 13 teacher pages: 46, 51, 75, 80, 104, 109, 133, 138, 161, 166, 190, 193, 195. I compared the text of every page of TH-v5 with TH-v3 (r6-v2). All 13 pages differ.
- 11 other differing pages: 50, 79, 108, 137, 165, 194 (the P9-B F3 D4 Thai lines), 207, 210, 213, 216 (the week 8 lines T25 to T28), and 220 (the key). All are accounted for in the p9b-thai-change-list.md match of the r6-v3 audit.
- The text gate (0 differences for 8 weeks) compares against drafts built from the same files. It is not the proof. My page diff is the proof.

### B6
p9c-proof-note.md now names the 7 app packages (w01-storytime-app-package-r6 and w02 to w07 -r5; the folders exist in ~/Desktop/handoff/). It also names the covers, the cast, the card kit (not rebuilt, with the default stated) and the fold-test file.

### N1: the number circle
The gap from the circle's right edge to the first letter is 1.6 to 1.95 mm on all 16 rows. The circle does not touch the letter; the number reads as separate. Minor and open (untidy; the teaching works). Owner: the maker, next version (D-P9C-4). It does not block the gate.

## 2. Regression scope
Text (pdftotext) and pixels (100 dpi gray, cmp) of every page, r6-v3 against r6-v4:
- Student book (v19 against v20, 140 pages): differ only on pages 134, 136, 138 and 140.
- Teacher book (TH-v4 against TH-v5, 224 pages): differ only on page 220.
- 2 covers and 7 cast pictures: SHA-256 identical to r6-v3.
- 8 Thai drafts: text identical for weeks 1 to 7; week 8 differs only on the 16 key lines of the G2 fix.
- Fold-test v20: pages 3 to 86 match student pages 9 to 92 by text.
Items carried from r6-v3 rest on this pixel identity.

## 3. The checklist A1 to J1 ("carried" = pages pixel-identical to r6-v3)
- A1 pass (A4 portrait 594.96 x 841.92 pt on all files). A2 pass (PDF/X-1a:2001, JC200103, all fonts embedded). A3 pass (C, M, Y = 0 on student 140, teacher 224, fold test 86; covers in colour as agreed). A4 pass (140 and 224 are multiples of 4; spacers 3, 21, 39, 57, 75, 93, 111, 129). A5 pass (no placeholder text). A6 fail, minor (p22, 23, 40, 58, 76, 94, 112, reader p32: pictures cut at the frame edge; known; owner Daniel).
- B1 pass (fold-test page 1 reads "Print at 100 %, both sides, flip on long edge."). B2 pass (simulation from page images and the imposition table; no paper fold). B3 fail, minor (reader leaf p9: scissors icon and "cut out of the book" against the spec; owner the maker, Daniel decides). B4 pass (carried). B5 n.a. (no how-to diagram). B6 pass.
- C1 to C7 pass (model guides, start dots of c, k, d and of "Tom can see a top." and "Is it a ball?" at stroke 1; p22, 41, 77, 95, 113 re-looked; the rest carried; C2 start-table test 6 of 6).
- D1 fail, minor (crater-ball "moon" can read as a ball, p133, 135, 137, 139, 140; "ox" reads as a cow; known; Daniel). D2 fail, minor (p114 "ox" and "ostrich" rare; known; Daniel). D3 pass. D4 pass. D5 fail, minor (p108 "Sam sat on a mat." shows two boys; known; Daniel). D6 pass. D7 pass (Pat black hair, Sam brown).
- E1 to E7 pass (first-sound items on p132, 133, 135; sound-stage tests pass; teacher day-1 pages unchanged).
- F1 pass (step codes B1, C1, D1, E1; teacher A1 p203, B1 p207). F2 pass (w08 page references). F3 fail, minor (student p59 "Trace one." against a script that asks for two traces; owner the content role after Daniel's words). F4 pass. F5 pass. F6 pass (step-system test 57 of 57).
- G1 fail, minor (teacher p207, 210, 213, 216: no script line for the match; content role, Daniel's words first). G2 pass. G3 fail, minor (p77 and teacher p137: the face already has two eye outlines; Daniel). G4 pass. G5 pass. G6 pass.
- H1 pass. H2 pass (one status sentence of the note is wrong, see N2). H3 pass. H4 pass (no new Thai in this batch). H5 pass.
- I1 pass (all 28 codes decoded by the auditor; each address equals the expected path; week 8 review pages hold no code). I2 n.a. (needs the deploy).
- J1 pass, with a limit (every r6-v3 fail re-checked; pages 1 to 133 pixel-identical to r6-v3; no fresh 300 dpi crop of every week and letter).

## 4. Extra notes (not checklist items)
| No. | Where | Note | Severity, owner |
|---|---|---|---|
| N1 | p134, 136, 138, 140 | The number circle stands 1.6 to 1.95 mm from the first letter. | minor; maker, next version |
| N2 | p9c-proof-note.md, "Deviations" | The note says the new fold-test file extracts "flip"; pdftotext of the v20 fold test gives "ip on long edge" on page 1. The print is correct. The fl ligature has no ToUnicode map, the same family as the known ff text-layer item (student p136, teacher p220). | minor; maker, correct the note and fix the map in the next version |

## 5. Open items for Daniel (D-P9C-4)
| Item | Page | Owner |
|---|---|---|
| A6 | p22, 23, 40, 58, 76, 94, 112; reader p32 | Daniel |
| B3 | reader leaves, e.g. p9 | maker; Daniel decides |
| D1 | p133, 135, 137, 139, 140 | Daniel |
| D2 | p114 | Daniel |
| D5 | p108 | Daniel |
| F3 | p59 and teacher p108 | content role, after Daniel's words |
| G1 | teacher p207, 210, 213, 216 | content role, after Daniel's words |
| G3 | p77 and teacher p137 | Daniel |
Also open: N1 and N2 go to the maker. The ff text layer (student p136, teacher p220) goes to the maker, next version.

## 6. Limits of this audit
- B2: simulation from page images and the imposition table; no paper fold.
- I2: needs the deploy.
- Thai: read only to check structure and the p220 key. Daniel checks all Thai.
- The per-item r6-v3 proofs were not available; an item is carried only where the page is pixel-identical.
- The p136 row 1 mapping ("Pam is off Sam!") is weak, as in r6-v3; not a new fault.

## Gate verdict line
PASS. 0 blockers, 0 majors, 8 open minors with owners, 2 extra minor notes. G4 is fixed. G2, H1 and B6 are fixed. The default: the print order goes ahead, and Daniel decides each minor.
