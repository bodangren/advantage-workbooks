# Plan: Review page

Track: `review_page_20261001`

## Phase 1: Contract

- [x] API request and response types from the package schema; the approval-part enum (`lib/lesson-package/store.ts`, `lib/review/server.ts`)

## Phase 2: Tests

- [x] Route tests: GET, PUT valid, PUT invalid (400 with the issues), approve, path guard (`app/api/packages/__tests__/routes.test.ts`, 7 tests; store tests, 8)

## Phase 3: Implement

- [x] Route handlers (read and write under `content/primary/`; `/api/files` for media; `/api/cast` for the sheet choice)
- [x] `/review` list page
- [x] `/review/[book]/[lesson]` page with the sections and the keys
- [x] `/review/cast` page
- [x] Picture choice (`POST .../image`) and an "Ask for new pictures" flag (`images[].redo`) that `lesson-images.ts --redo-marked` reads; Claude runs the media scripts, so the page starts no mmx job

## Phase 4: Verify

- [x] Run the dashboard on a scratch copy; a headless Chrome script edits, saves (Ctrl+S), approves (Ctrl+Enter), stars a fifth MCQ (print-set FAIL blocks the bank approval), saves an invalid title (400, file unchanged), and picks a cast sheet
- [ ] Daniel approves the E12 pilot on the page (his review, not an agent's)
- [x] Update `measure/tech-debt.md` and `measure/lessons-learned.md`
