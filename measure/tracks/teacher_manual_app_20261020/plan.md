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
- Sign-in: the live English screens 01a and 02b with marks and a note with the Thai meanings (122cdea); the Thai screens replace them after the M2 retake.
- The printed QR codes and old app boxes: one note (the QR codes open the article after sign-in; follow the manual, not the old app tasks). No AI feedback, audio, or AI chip in the manual until a browser check.
- Section 6: version-neutral (C14 open); "print 2 copies, keep one" until the one-student password button is deployed (facts v0.5).
- Open: the cover photo of the school's printed manual; the sign-in screens after the M2 retake; the English working copy is not checked (Thai only is printed).

- [ ] Task: Daniel's Thai notes and the PR fact notes fixed (date and notes in this plan)
- [ ] Task: Lesson 12 as Daniel decides
- [ ] Task: The final A4 PDF in `~/Desktop/print-ready/teacher-manual/` by 2026-10-26; every page looked at
    - Steps: (1) if the M2 sign-in fix is live, add the Thai retakes to `SCREENS` in `scripts/teacher-manual/mark-captures.ts`, run it in full (not through `head`), and remove the note "คำบนฟอร์มเป็นภาษาอังกฤษ"; if the one-student password button is live, add its text and the retakes 05f–05h, as in K1 `r-new`; (2) apply Daniel's choices (workbook word, C14 text of section 6, lesson 12 PDF); (3) before any i18n commit, send the Monorepo session the diff summary; (4) tests, tsc, and the render under the lock: `flock ~/Desktop/primary-parity-progress/heavy.lock npx tsx scripts/print/make-teacher-manual-pdf.ts origins-3.1-a0 --lang th` (default output is the final name); (5) contact sheets of every page; (6) send PR the path; delete the DRAFT file only after Daniel approves the final.
- [ ] Task: Measure - User Manual Verification 'Phase 4: Fixes and final PDF' (Protocol in workflow.md)

## Close

- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`
