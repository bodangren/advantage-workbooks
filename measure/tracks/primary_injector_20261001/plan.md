# Plan: Primary injector

Track: `primary_injector_20261001`

## Phase 1: Field map

- [x] Legacy, new, and Tutor field inventory → `docs/content-plans/primary-db-field-map.md` (from the code)
- [~] JSON shapes of `sentences`, `words`, the translations, and the flashcard rows: from the code (types and generators); the read-only production samples wait for Daniel's decision on database access

## Phase 2: Contract and tests

- [x] Pure mapping functions: package → legacy rows, bucket objects, upsert SQL (`lib/inject/`, 13 tests); package → new rows comes with `--target new`
- [~] Local database from the Prisma migrations (`scripts/inject/test-db.sh`, Podman); integration tests written (insert, second run, update in place, verify, rollback); the image pull is slow

## Phase 3: Implement

- [x] `inject-lessons.ts`: backup, dry run, transaction, upload, verify, ids back into the package, run log
- [x] `verify-lessons.ts` (read-only session)
- [~] E12: dry run done. The real run waits for Daniel's lesson approval and his decision on production database access

## Phase 4: Cutover support

- [ ] Verify on the rehearsal databases (Oct 8–9, Oct 12–13)
- [ ] `--target new` with `legacy_id_map`; verify after the cutover
- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`
