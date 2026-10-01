# Plan: Primary injector

Track: `primary_injector_20261001`

## Phase 1: Field map

- [ ] Legacy, new, and Tutor field inventory → `docs/content-plans/primary-db-field-map.md`
- [ ] JSON shapes of `sentences`, `words`, the translations, and the flashcard rows, from production samples (read-only queries)

## Phase 2: Contract and tests

- [ ] Pure mapping functions: package → legacy rows; package → new rows (tested)
- [ ] Local database from a backup export; integration tests: insert, second run, update in place, verify

## Phase 3: Implement

- [ ] `inject-lessons.ts`: backup, dry run, transaction, upload, run log
- [ ] `verify-lessons.ts`
- [ ] E12: dry run, backup, inject into the legacy database, verify, open it in the app

## Phase 4: Cutover support

- [ ] Verify on the rehearsal databases (Oct 8–9, Oct 12–13)
- [ ] `--target new` with `legacy_id_map`; verify after the cutover
- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`
