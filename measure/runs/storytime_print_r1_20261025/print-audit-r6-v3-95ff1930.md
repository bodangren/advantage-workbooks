# Print audit of proof-books-r6-v3 (audited head 95ff1930)

Auditor: print-proof-auditor, claude-code/claude-sonnet-5-5#high, 2026-11-16. Proof: ~/Desktop/print-ready/storytime/proof-books-r6-v3/ (MANIFEST SHA-256 07a012675b29f432266878d48ae338229ea9d66ff274a0ff5c0db6f00ed05146; sha256sum -c: 72 of 72 OK).
Transcription: the auditor could not write this file (permission denied on edit). The orchestrator's build session saved its final reply here word for word.

**Gate verdict: FAIL.** The audit found 1 major and 11 minors, and 0 blockers.

## Counts (53 items)

| Result | Count |
|---|---|
| pass | 38 |
| fail | 12 (1 major, 11 minor) |
| n.a. | 3 (B5, I2, J1) |

## The fail that blocks the gate

**G4, major: the "Review N more" pages 134, 136, 138 and 140 cannot be matched cleanly.**
- Each sentence has its dot about 100 mm from its text, right beside the picture dot.
- The sentence dot and the picture dot are 5.8 mm apart, and the rows are 32 mm apart.
- A line from sentence 1 to picture 4 is almost vertical and passes within 2 mm of the dots of rows 2 and 3.
- A teacher cannot read four such lines.
- Crops: crops/p134-dots.png, crops/more-p134.png and more-p136.png, more-p138.png, more-p140.png.
- Fix route: the maker for the layout, after the PM changes spec P9-B9. A bigger gap or a write-the-number box would work. Daniel chooses if the form changes.

## The 11 minors

| Item | Where | Fault | Owner |
|---|---|---|---|
| A6 | p22, 23, 40, 58, 76, 94, 112; reader p32 | Pictures cut at the frame edge. Known open item. | Daniel |
| B3 | reader leaves, e.g. p9 left margin | The scissors icon and "cut out of the book" suggest a cut, but the spec says tear at the perforation with no scissors step. | maker, Daniel decides |
| B6 | p9b-proof-note.md | The note does not name the 7 app packages whose D4 script lines change (spec P9-B7). | maker, PM |
| D1 | p135, 133, 137, 139, 140 | The crater-ball "moon" can read as a ball. "ox" reads as a cow (known). | Daniel |
| D2 | p114 | "ox" (known) and "ostrich" are rare words. | Daniel |
| D5 | p108 | "Sam sat on a mat." shows two boys. Known. | Daniel |
| F3 | p59 and teacher p108 | The page says "Trace one." but the script asks for two traces. | content role |
| G1 | teacher p207, 210, 213, 216 | No script line explains how to do the match. | content role |
| G2 | teacher p220 answer key | The key says "picture 2", but the pictures carry no numbers. | maker |
| G3 | p77, teacher p137 | The face already has two eye outlines, yet the script says "draw your eyes". | Daniel |
| H1 | teacher p46, 51, 75, 80, 104, 109, 133, 138, 161, 166, 190, 193, 195 | These pages differ from v3 through Daniel-approved LP-08 and LP-20 (commit 10a3de6e). The note does not list them. The "0 differences" text gate compares against drafts built from the same files, so it cannot show them. | maker |

## Open items and caveats

- B2 fold: this is a simulation from the page images and the imposition table in the spec. I did no paper fold.
- J1: the r6-v2 fail list was not available. I did a full pass of C and D instead.
- I2: not yet runnable, because it needs the deploy.
- ff text layer: I did not finish confirming whether it also affects the teacher book. The teacher book text shows "Pam is o Sam!" on p220, so it probably does.
- Thai: I checked the Thai only against p9b-thai-change-list.md. The 14 changed lines and 10 moved lines match T1 to T24 on teacher p50, 79, 108, 137, 165 and 194. The 4 w08 lines match T25 to T28 on p207, 210, 213 and 216. Daniel still checks the Thai.

## What passed

- A: settings. A4 portrait at 594.96 x 841.92 pt, with PDF/X-1a:2001 and JC200103 output intent. Fonts are embedded in all 5 print files. C, M and Y are 0 on all 140 student, 224 teacher and 86 fold-test pages. The two covers are in colour as Daniel approved. Page counts are 140 and 224, and the spacer pages are 3, 21, 39, 57, 75, 93, 111 and 129. No placeholder text.
- C: marks the child copies. All 7 model guides (n, a, p, m, s, t, o) match their formation words. The trace-row dots (week 1 to 7 rows, plus c, k, d, S, G, s and T at 600 dpi) sit on the ink at the start of stroke 1.
- D: pictures. Cast match is good: Pat has black hair, Sam has brown. Reader counts check out at ducks 3, cakes 7 and friends 6. The review-more keys match the pictures. "ten" with a numeral is the known open item Q9-1.
- E6 and E7. I read the day-1 openings of weeks 1 to 7 in the teacher book. Only taught sounds are asked, only first sounds, and the new sound is never asked early.
- F: scripts. F3 reads correctly on D4 pages 50, 79, 137, 165 and 194 (the p108 and w1 p21 issues are in the table). The w08 page references 203 to 216 match student pages 130 to 140.
- H2: both covers are byte-identical to r6-v2. Student text of pages 1 to 133 is identical between v18 and v19.
- I1: the maker's test ran 28 of 28. My own decode of the song and book codes on p7, 25, 43, 61, 79, 97 and 115 (14 codes) plus a reader code on p10 gave the expected paths, including week 7.
