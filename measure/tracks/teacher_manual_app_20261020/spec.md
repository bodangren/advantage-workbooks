# Spec: Origins 3.1 Teacher's Manual for the new Primary app

Track: `teacher_manual_app_20261020`. Type: feature (classic FR list).

## Overview

Since the cutover of 2026-10-20, the Primary app is the new build (monorepo master `beb904102`). The teachers have never seen it. Daniel (2026-10-20, advantage-pr track `boonyathat_start_kit_20261020`, D3 and D6 to D8): the printed Teacher's Manual "Obviously needs to be completely updated", and it goes to the school (Boonyathat) with the workbooks, target 2026-10-27. Thai only in print. The school prints the PDF on its office printer, in black and white.

Decisions in this session (Daniel, 2026-10-20):

- One manual: Origins 3.1 ("already printed and delivered to the company three months ago").
- The manual is the per-book generated manual (`dashboard/lib/teacher-manual/`, project `primary/origins-3.1-a0`). The PR session agrees.
- Work order: in parallel with the v2 workbook look. A sub-agent drafts; this session checks every change and commits.

Sources (advantage-pr, read only): `measure/tracks/boonyathat_start_kit_20261020/facts.md` v0.2 (sections 1 to 15, "Gaps and risks"), and the PR teacher guide draft `assets/docs/primary-advantage-guides/teacher-guide-th.html`. Thai labels: monorepo `apps/primary-advantage/messages/th.json` (master). Step map: monorepo `packages/domain/src/primary-books/step-map.ts`.

## Functional Requirements

1. **App text:** every app line of the manual (`i18n/en.ts` and `th.ts`: preface, lesson plan structure, pedagogy, the "Online/App Components" box of each period, the teaching notes of steps 2, 3, 11, 12, and 13, troubleshooting) describes the new app as it is today, and agrees with facts.md. No line names "Reading Advantage app". No line promises a feature that facts.md does not confirm.
2. **New section "The Primary Advantage app"** (front matter, Thai; English working copy in `en.ts`): the order of the PR teacher guide: sign in, find the class, start the class (class code, picture passwords, QR cards), the lesson of the day (assign the class book, the 13-step lesson plan, mark a step, the matching student step), homework (an article, the "งานที่กำหนด" button), and the class sheet and QR cards. It explains that the app lesson has 14 steps and the book has 13 (the step map). PR rules: the English-only sign-in and new-password screens show their English labels; for a forgotten password, the teacher asks the school administrator; homework at home needs the class-sheet username and password.
3. **Screenshots:** the Thai captures of the Monorepo session (test accounts; no real names, class codes, or passwords), when they arrive (before 10-22). Until then, a marked placeholder box. Daniel accepts the look of each screen.
4. **Thai defects:** no Chinese characters in `th.ts` ("思考" on 9 lines, "遵循" on 1 line).
5. **Office print:** a script makes the A4 PDF (margins 15 mm or more) of one project and language. The manual meaning does not depend on color alone. No emoji (SVG icons), no request to Google Fonts (static Sarabun), Paged.js from `node_modules`.
6. **Lesson 12 (open, Daniel):** the school's books print the old lesson 12 ("My Happy Holiday" again); the project holds the replacement "Hello I Am Tom", and the insert is in the October print order. The manual follows Daniel's answer.

## Non-Functional Requirements

- Pinned paths (catalogue pin 08bb160): `dashboard/lib/teacher-manual/i18n/*`. The monorepo imports their teaching notes into the in-app lesson guides. Message the monorepo session before the commit, and send the commit id.
- Heavy jobs (Chrome renders, tsc, test sweeps): a message to the monorepo session first, then `flock ~/Desktop/primary-parity-progress/heavy.lock`. No port 3005.
- Daniel checks all Thai. The PR session checks every app fact against the live code.
- The v2 look track files (`templates/primary_template.html`, `lib/document-wrapper/**`, `lib/look.ts`) do not change in this track.

## Acceptance Criteria

- The Thai draft PDF of the Origins 3.1 manual goes to the PR session and Daniel by 2026-10-23.
- The final A4 PDF is in `~/Desktop/print-ready/teacher-manual/` by 2026-10-26, after the fixes of Daniel and the PR session.
- Tests: no CJK character in the Thai output; no "Reading Advantage app"; the new section is present in both languages; the print HTML has no emoji, gradient, rgba, or shadow; the A4 page rule.

## Out of Scope

- `Teacher guide/` (the Reading Advantage secondary manual) and `Teacher guide/Primary/` (the old generic draft).
- Manuals of other books, the English print, and a PDF/X file for the book printer.
- App changes (PR stories S3 and S5).
