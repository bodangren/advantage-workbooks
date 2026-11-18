# Spec: Review page for lesson packages

Track: `review_page_20261001` | Type: feature | Date: 2026-10-01 | Source: Origins 3.2 plan v1.2 task C8

## Why

Daniel has no editors and very little time, so he tweaks and approves every lesson himself. An earlier review app (`reading-advantage-monorepo/apps/workbooks`) was never used. This page must take less effort than reading a PDF proof.

## Design rules

1. One page per lesson. The top shows only what needs Daniel: FAIL and WARN results, and the parts that are not approved.
2. Every text field edits in place. A save writes the package file and runs the checks again at once.
3. One key per action: Ctrl+S saves, Ctrl+Enter approves the current part, J and K go to the next and the previous lesson.
4. It runs locally in the dashboard (`npm run dev`). No login.

## Pages

- `/review`: the books. For each book, one row per lesson with status chips (text, Thai, bank, images, audio, lesson) and the FAIL and WARN counts.
- `/review/[book]/[lesson]`, in this order:
  - Checks
  - Article: 3 paragraphs and the summary, glossed words marked, live text-check results
  - Glossary: word, English, Thai
  - Question bank: 10 MCQ, 5 SAQ, 5 LAQ; a star marks the print set; a counter shows 4 MCQ + 1 SAQ
  - Activities
  - Thai: English and Thai side by side, sentence by sentence
  - Images: the 3 images with their prompts; buttons "Approve" and "Make again"
  - Audio: a player with sentence highlight from the timing
- `/review/cast`: character-sheet candidates for each character. Daniel picks one.

## API (Next.js route handlers on the local file system)

- `GET` and `PUT /api/packages/[book]/[lesson]`: read and write. `PUT` validates with the package schema and returns the check report.
- `POST /api/packages/[book]/[lesson]/approve`: body is the part; sets the approval and the date.
- `POST /api/media/regenerate`: runs the media script for one image (needs `lesson_media_20261001`).
- Paths stay inside `content/primary/` (path guard).

## Out of scope

Hosting, login, more than one user at a time, and print layout.

## Acceptance

- Route tests for read, write (valid and invalid), and approve.
- Daniel approves the E12 pilot on this page and needs no other tool.
