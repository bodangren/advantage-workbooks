# Plan: Primary injector

Track: `primary_injector_20261001`

## Phase 1: Field map

- [x] Legacy, new, and Tutor field inventory → `docs/content-plans/primary-db-field-map.md` (from the code)
- [~] JSON shapes of `sentences`, `words`, the translations, and the flashcard rows: from the code (types and generators); the read-only production samples wait for Daniel's decision on database access

## Phase 2: Contract and tests

- [x] Pure mapping functions: package → legacy rows, bucket objects, upsert SQL (`lib/inject/`, 13 tests); package → new rows comes with `--target new`
- [x] Real Postgres with the legacy schema: PGlite in the test process loads the 62 Prisma migrations (a Podman pull from Docker Hub did not get through); integration tests: insert, second run, update in place, verify, rollback, stored types

## Phase 3: Implement

- [x] `inject-lessons.ts`: backup, dry run, transaction, upload, verify, ids back into the package, run log
- [x] `verify-lessons.ts` (read-only session)
- [~] E12: dry run done. The real run waits for Daniel's lesson approval and his decision on production database access

## Phase 4: Cutover support

- [~] Verify on the cutover test database (Oct 7) and after the deploy (Sunday Oct 11); calendar of 2026-10-06. Rehearsal 1 (2026-10-08, local copies): `primary_legacy_20261008` 250 of 250 match; `primary_rehearsal1_20261008` 239 of 250 match, and the 11 others differ only in the question `order` (the ETL numbers tied `createdAt` rows with no tie-breaker; fix `ORDER BY "createdAt", id` sent to the monorepo session). Open: rehearsal 2 and the deploy
- [~] `--target new` with `legacy_id_map`: inject (dry run only) and verify (`verify-lessons.ts --target new`, `verifyPackageNew`, tests). Open: a real write after the cutover
- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`
