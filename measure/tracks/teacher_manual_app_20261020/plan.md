# Plan: Origins 3.1 Teacher's Manual for the new Primary app

Track: `teacher_manual_app_20261020`. Spec: [spec.md](./spec.md).

Dates: Thai draft PDF to PR and Daniel by 2026-10-23; fact check 10-24 and 10-25; final PDF 2026-10-26; delivery 10-27. A sub-agent drafts each phase; this session checks and commits.

## Phase 1: Office print path

- [x] Task: Tests (first): the Thai output has no CJK character; the print HTML has no emoji, gradient, `rgba(`, or shadow, and no Google Fonts link; the A4 mode gives `@page { size: A4 }` with margins of 15 mm or more [470b9c7]
- [x] Task: Implement: an A4 option in `lib/teacher-manual/document-wrapper.ts`; SVG icons for the emoji in `period-plan.ts`; static print fonts; `scripts/print/make-teacher-manual-pdf.ts <project> --lang th|en` (Paged.js from `node_modules`, system Chrome, under the lock) to `~/Desktop/print-ready/teacher-manual/` [470b9c7]
- [x] Task: Fix the Chinese characters in `i18n/th.ts` [470b9c7]: "思考" on 9 lines, "遵循" on 1 line, and English words inside Thai on 5 lines; a test fails on any CJK ideograph (mutation-checked)
- [x] Task: Verify: a baseline Thai PDF of Origins 3.1 (before the text changes); `pdffonts` shows no Type 3 font; page count recorded
    - Baseline 167 pages, all A4, 11 embedded fonts (Open Sans, Sarabun, and Liberation Sans for the arrow "→"), no Type 3
- [ ] Task: Measure - User Manual Verification 'Phase 1: Office print path' (Protocol in workflow.md)

## Phase 2: App text

- [x] Task: List every app line of `en.ts` and `th.ts` (line, old meaning, new meaning, facts.md section) — in the sub-agent report of 2026-10-20 (summary in the commit message of 470b9c7)
- [x] Task: Rewrite the lines in both languages; remove features that facts.md does not confirm; keep the 13 printed steps [470b9c7]
- [x] Task: Tests: no "Reading Advantage app"; no "AI chatbot"; the online box of each period names a real app action [470b9c7]
- [x] Task: Message the monorepo session before the commit (pinned i18n), and send the commit id (2026-10-20: no blocker; commit id 470b9c7 sent). Production guides change only at a re-import with Daniel's go; the re-import also brings the app-line changes of steps 2, 3, 11, 12, and 13
- [ ] Task: Measure - User Manual Verification 'Phase 2: App text' (Protocol in workflow.md)

## Phase 3: The new app section

- [x] Task: The section "The Primary Advantage app" in `front-matter.ts` with its text in `en.ts` and `th.ts`, in the order of the PR teacher guide; the 14-to-13 step map [d45b82c]
    - Change: the text is in `lib/teacher-manual/app-section.ts`, not in the pinned i18n files, so the in-app guide import does not read it
- [x] Task: Screenshot slots with placeholders; the Monorepo Thai captures when they arrive [d45b82c]: 12 marked screens (byte-identical to advantage-pr 7d17431); the teacher sign-in stays a placeholder until the M2 retake
- [x] Task: Tests: the section is present in both languages; each screenshot slot has a caption [d45b82c] (`teacher-manual-app-section.test.ts`, 6 tests)
- [~] Task: Draft: the Thai A4 PDF of Origins 3.1 to the PR session and Daniel by 2026-10-23
    - 2026-10-20: `~/Desktop/print-ready/teacher-manual/DRAFT-2026-10-20-Primary-Advantage-Origins-3.1-Teachers-Manual-TH.pdf` (177 A4 pages, no Type 3) sent to PR for the fact check; every page looked at on contact sheets. Daniel: morning of 10-21
- [ ] Task: Measure - User Manual Verification 'Phase 3: The new app section' (Protocol in workflow.md)

## Phase 4: Fixes and final PDF

Defaults chosen on 2026-10-20 for Daniel's check:
- Workbook word: "หนังสือเรียน" in the whole manual (the existing term; the live guides use it). K1 uses "หนังสือแบบฝึกหัด".
- Lesson 12: teach "Hello! I Am Tom"; the printed pages come later, with no date (errata insert: strategy v1.11, Daniel 2026-09-30); meanwhile the projector or "พิมพ์บทเรียนนี้" (7fe2dfd, as PR asked). Daniel decides whether the packet carries the current A4 PDF `print-ready/lessons/Origins-3.1/Primary-Advantage-Origins-3.1-Lesson-12-Hello-I-Am-Tom.pdf` (PR review page).
- App claims checked by code reading on 2026-10-20 (monorepo master = integration for each file): projector "แสดงคำตอบ" per question (`projector-view.tsx`); "เกมสำหรับทั้งชั้น" on the projector page, `save={false}` (`projector-game-panel.tsx`); the guide opens the first unmarked step, so the teacher marks printed step 11 (`guide-overlay.tsx`); "อ่านบทเรียน" when app step 3 is open (student `home/page.tsx`). Every quoted Thai app label is a string of `messages/th.json` on master.
- Sign-in: the live English screens 01a and 02b with marks and a note with the Thai meanings (122cdea); the Thai screens replace them after the M2 retake. The switch `--signin new` has the K1 `v-new` text (b0d7dce).
- The printed QR codes and old app boxes: one note (the QR codes open the article after sign-in; follow the manual, not the old app tasks). No AI feedback, audio, or AI chip in the manual until a browser check.
- Section 6: version-neutral (C14 open); "print 2 copies, keep one" until the one-student password button is deployed (facts v0.5). The switch `--reset new` has the K1 `r-new` text (b0d7dce); K1 has no picture for it, so the manual has none.
- Open: the cover photo of the school's printed manual; the sign-in screens after the M2 retake; the English working copy is not checked (Thai only is printed).

- [~] Task: Daniel's Thai notes and the PR fact notes fixed (date and notes in this plan)
    - 2026-10-20, PR fact check of the 178-page draft: 13 findings (High 1, Medium 4, Low 8); all handled except 8 (captions cover the test data; on Daniel's list). 1: after "ทำเครื่องหมายว่าทำขั้นนี้แล้ว" the button changes to "ยกเลิก", "ถัดไป" goes on. 2: "คู่มือสด" box versus "คู่มือครู" (also pedagogy line 84, pinned). 3: capture 04c. 4 and 9: notes before the steps. 5: BOOK_NOTES (the Origins 3.1 lesson 12 notes print only in that book) and a note box on the lesson 12 plan; E12 print version: confirmed by the Monorepo session (2026-10-20; o3-1/12 is "Hello! I Am Tom" with an approved article and print data, from local copies of the cutover C7b catalogue import, not production), so the notes keep "แอปแสดงบทนี้แล้ว" and "พิมพ์บทเรียนนี้". 6, 7, 10, 13: text. 11: session limits and page reload in the troubleshooting (pinned). 12: "ในแอป" box stays whole. Draft 179 pages.
    - 2026-10-20 night, text sweep of the rebuilt draft for Daniel's 10-23 check: one workbook word ("หนังสือเรียน" 86, "หนังสือแบบฝึกหัด" 0), no CJK. English in Thai lines is lesson content (titles, the English writing prompts), except one style point for Daniel: the objective line names the genre in English ("อ่านและเข้าใจบทความประเภท Animal Adventures เกี่ยวกับ …"; the genre comes from the lesson data). No change without Daniel's Thai (pinned i18n `objectiveRead`).
    - 2026-10-20 night: asked the Monorepo session to prepare the guide re-import for C4 ("思考") as one command with a backup step and a local dry-run diff, next to the deploy summary. No production write. Done by Monorepo: the C7b catalogue build with a new archive; rollback = the same build with workbooks-08bb160.tgz; dry run (local scratch DB) changes 11 of 26 rows (en 2, 3, 11, 12, 13; th 1, 2, 3, 11, 12, 13), th has no CJK after it; diff `~/Desktop/primary-parity-progress/guide-reimport-dryrun-diff.txt` checked by Workbooks (matches 470b9c7 and 55f081e). Window: any time, after Daniel's 10-23 check, from the commit he accepts; Daniel's go.
- [x] Task: App-version switch for the two fixes (b0d7dce)
    - `make-teacher-manual-pdf.ts --signin live|new --reset live|new` (default live; the draft text did not change). `signin new`: Thai labels in steps 3 and 4 (integration b8f4c1371 `th.json`), the note for teachers from the old system, no English-word note, the screens `signin-teacher-tab-th` and `signin-new-password-th`. `reset new`: the warning names "รหัสผ่านใหม่", one printed copy, the new "นักเรียนลืมรหัสผ่าน" note. The script exits 1 while a screen placeholder remains.
    - `mark-captures.ts`: the Thai sign-in specs use the same capture names (Monorepo 2026-10-20: retake4.mjs replaces 01a, 02a, 02b, 02c, keeps the names, and copies the old files to "before-retake4"; box labels "ครู", "ชื่อผู้ใช้", "รหัสผ่าน", "เข้าสู่ระบบ" and "รหัสผ่านใหม่", "พิมพ์รหัสผ่านใหม่อีกครั้ง", "บันทึกและเข้าสู่ระบบ"). A spec with `optional` skips when a label is missing and keeps its JPEG; a marked box outside a fixed crop stops the script. Checked on a simulated retake in the scratch folder.
    - The help box keeps each contact item on one line: the phone number broke over two lines in the draft. The draft was made again at the same path (179 pages; the text differs only in that line).
- [ ] Task: Lesson 12 as Daniel decides
- [~] Task: The final A4 PDF in `~/Desktop/print-ready/teacher-manual/` by 2026-10-26; every page looked at
    - 2026-10-20 night: built at the final name with the overnight defaults (live app; "หนังสือเรียน"; version-neutral section 6; lesson 12 note; current title page): `Primary-Advantage-Origins-3.1-Teachers-Manual-TH.pdf`, 179 A4 pages, all script checks pass. Every page looked at on contact sheets; 3 print defects found and fixed: 058c02c (the fill-in blank printed as `<span class="blank"></span>` on 42 lines), 1862e56 ("คาบที่ 3" alone at the foot of 10 pages), 2d0da94 (a note-box title alone at the foot of 29 pages). The DRAFT at its path is the same file (PR's packet link stays on the DRAFT until Daniel approves).
    - Waits for: Daniel's approval of the defaults and his 10-23 notes; the Monorepo retakes after the rebuild: 01a and 02b (Thai sign-in) and the class-book chain on an Origins 3.1 class (the manual uses 08a, 08b, 09b, 09c, 09f, 09g; today they show Origins 3.2; PR and Workbooks asked on 2026-10-20). The retakes keep the names and the box labels.
    - Steps: (1) get the deploy state of the two fixes from Daniel or the Monorepo session. If the sign-in fix is live: after the M2 retake (the Monorepo session sends one line), run `npx tsx scripts/teacher-manual/mark-captures.ts` in full (not through `head`); it must make `signin-teacher-tab-th` and `signin-new-password-th` (if it stops with "outside the crop", give those 2 specs a new crop); look at both screens; add `--signin new` to the render. If the password button is live: add `--reset new`. After the class-book retakes (Origins 3.1), run mark-captures again and look at the screens assign-book, class-book, lesson-plan, lesson-guide, progress-grid, mark-taught. (2) apply Daniel's choices (workbook word, C14 text of section 6, lesson 12 PDF); (3) before any i18n commit, send the Monorepo session the diff summary; (4) tests, tsc, and the render under the lock: `flock ~/Desktop/primary-parity-progress/heavy.lock npx tsx scripts/print/make-teacher-manual-pdf.ts origins-3.1-a0 --lang th` (default output is the final name); (5) contact sheets of every page; (6) send PR the path: its packet folder `~/Desktop/print-ready/boonyathat-start-kit-2026-10-27/` links to the DRAFT manual and to the lesson 12 PDF, so keep those paths, and PR changes the link to the final; delete the DRAFT file only after Daniel approves the final and PR has changed the link.
- [ ] Task: Measure - User Manual Verification 'Phase 4: Fixes and final PDF' (Protocol in workflow.md)

## Close

- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`
