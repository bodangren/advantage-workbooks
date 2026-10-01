# Plan: Lesson packages

Track: `lesson_packages_20261001`

## Phase 1: Contract

- [x] `dashboard/lib/lesson-package/schema.ts`: Zod schema and types for every part in the spec
- [x] Fixture package for tests (small fixed vocabulary, as in the text-check tests)

## Phase 2: Tests

- [x] Schema tests: the fixture parses; each missing part fails
- [x] Check tests: one or more per check ID
- [x] Builder test: fixture → output passes `WorkbookLessonSchema`; print order and answer letters are correct

## Phase 3: Implement

- [x] `lib/lesson-package/checks.ts` (reuses `lib/text-profile`)
- [x] `lib/lesson-package/build.ts`, `files.ts` (book order, prior texts, objective key), `report.ts`
- [x] `scripts/build-workbook-json.ts`
- [x] `scripts/check-lesson-package.ts`
- [x] E12 package (pilot): text, glossary, bank 10/5/5, print set, activities, Thai, tags; all checks pass

## Phase 4: Docs

- [x] `content/primary/README.md`: format and commands
- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`

Note: no commits yet; Daniel has not answered the commit question (2026-10-01). Tests: 37 new (lesson-package 34, files 3).
