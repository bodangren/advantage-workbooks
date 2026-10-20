# Plan: Origins 3.1 Teacher's Manual for the new Primary app

Track: `teacher_manual_app_20261020`. Spec: [spec.md](./spec.md).

Dates: Thai draft PDF to PR and Daniel by 2026-10-23; fact check 10-24 and 10-25; final PDF 2026-10-26; delivery 10-27. A sub-agent drafts each phase; this session checks and commits.

## Phase 1: Office print path

- [ ] Task: Tests (first): the Thai output has no CJK character; the print HTML has no emoji, gradient, `rgba(`, or shadow, and no Google Fonts link; the A4 mode gives `@page { size: A4 }` with margins of 15 mm or more
- [ ] Task: Implement: an A4 option in `lib/teacher-manual/document-wrapper.ts`; SVG icons for the emoji in `period-plan.ts`; static print fonts; `scripts/print/make-teacher-manual-pdf.ts <project> --lang th|en` (Paged.js from `node_modules`, system Chrome, under the lock) to `~/Desktop/print-ready/teacher-manual/`
- [ ] Task: Fix the Chinese characters in `i18n/th.ts`
- [ ] Task: Verify: a baseline Thai PDF of Origins 3.1 (before the text changes); `pdffonts` shows no Type 3 font; page count recorded
- [ ] Task: Measure - User Manual Verification 'Phase 1: Office print path' (Protocol in workflow.md)

## Phase 2: App text

- [ ] Task: List every app line of `en.ts` and `th.ts` (line, old meaning, new meaning, facts.md section)
- [ ] Task: Rewrite the lines in both languages; remove features that facts.md does not confirm; keep the 13 printed steps
- [ ] Task: Tests: no "Reading Advantage app"; no "AI chatbot"; the online box of each period names a real app action
- [ ] Task: Message the monorepo session before the commit (pinned i18n), and send the commit id
- [ ] Task: Measure - User Manual Verification 'Phase 2: App text' (Protocol in workflow.md)

## Phase 3: The new app section

- [ ] Task: The section "The Primary Advantage app" in `front-matter.ts` with its text in `en.ts` and `th.ts`, in the order of the PR teacher guide; the 14-to-13 step map
- [ ] Task: Screenshot slots with placeholders; the Monorepo Thai captures when they arrive
- [ ] Task: Tests: the section is present in both languages; each screenshot slot has a caption
- [ ] Task: Draft: the Thai A4 PDF of Origins 3.1 to the PR session and Daniel by 2026-10-23
- [ ] Task: Measure - User Manual Verification 'Phase 3: The new app section' (Protocol in workflow.md)

## Phase 4: Fixes and final PDF

- [ ] Task: Daniel's Thai notes and the PR fact notes fixed (date and notes in this plan)
- [ ] Task: Lesson 12 as Daniel decides
- [ ] Task: The final A4 PDF in `~/Desktop/print-ready/teacher-manual/` by 2026-10-26; every page looked at
- [ ] Task: Measure - User Manual Verification 'Phase 4: Fixes and final PDF' (Protocol in workflow.md)

## Close

- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`
