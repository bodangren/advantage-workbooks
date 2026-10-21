# Plan: storytime_week_package_20261022

## Phase 1: Package

- [x] Task: the schema and a Level 2 fixture week (tests first: the fixture parses; a wrong program, shape, level, or step id is refused). Changed the same day after Monorepo's QR-page review (Storytime agreed): `books[]` with `kind` readalong or decodable, the app's `SentenceTimepointSchema` for book and song times (`page` on book sentences), `meta.status` draft or published, `meta.band` (S15 names).
- [x] Task: the checks (tests first: the fixture is clean; one test for each rule). 9 mutants, all caught (one after a new test).
- [x] Task: the file paths and the URL key (`st<level>/<week>`): `lib/storytime/files.ts`, `content/storytime/README.md`.

## Phase 2: Manual template

- [x] Task: the labels (English and Thai drafts).
- [x] Task: the week and day renderer (tests first: five day sections, minutes, four headings, three lines, the Thai gloss under the English, no CJK).
- [x] Task: the document (title page, wrapper, A4) and one A4 PDF of the fixture (Chrome render under the heavy lock): `scripts/storytime/make-manual-pdf.ts`; the fixture week is 14 A4 pages in Thai, fonts embedded. Contact sheets showed two defects (no day page breaks, a split title word); both fixed.

## Phase 3: Hand-off

- [~] Task: the commit, the commit id and the shape summary to the Storytime session; tech-debt and lessons-learned.

## Phase 4: Level 2 week 1 (S17, approved 2026-10-22)

- [ ] Task: write week 1 from the Storytime sequence row (element n, frame "Hello, I am ___.", names and greetings): the read-along, the decodable, the song lyrics, the five scripts, the strips, the check, and the home card; checks clean; the Storytime review, then Daniel's Thai check.
