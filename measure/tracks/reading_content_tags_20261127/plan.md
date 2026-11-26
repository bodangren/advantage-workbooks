# Plan: Reading content tags

Track: `reading_content_tags_20261127`. Spec: [spec.md](./spec.md). Tests: [test-strategy.md](./test-strategy.md).

Order: P1, P2, P3, P4. P2 needs P1 (the AR and AL ids). P3 and P4 can start after P1. No date is set: the work folds into the semester 2 Reading article regeneration.

## Gate commands (orchestrator environment)

```bash
PROJECT_TESTS='set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/lesson-package-tag-export.test.ts __tests__/reading-key-adoption.test.ts __tests__/reading-bank-rule.test.ts'
PROJECT_LINT='set -o pipefail; cd dashboard && npx eslint lib/lesson-package scripts/export-tags.ts --no-error-on-unmatched-pattern'
PROJECT_CHECKS='set -o pipefail; cd dashboard && npx tsc --noEmit'
```

Every gate command runs inside ONE wrapper: `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. Never nest the wrapper.

## Phase 1: Key adoption

- [ ] Task 1.1: Read the key file and its README.md and RELEASE.md (read only). Record the sha256 and the row counts per prefix in the track notes.
- [ ] Task 1.2: Red. Write `dashboard/__tests__/reading-key-adoption.test.ts`: the snapshot sha256 matches; an `AR` id and an `AL` id pass the schema, `tagExportEntry`, and the checks; an unknown id fails; a young `R` id is unchanged.
- [ ] Task 1.3: Green. Commit the snapshot (for example `docs/content-plans/data/reading-objectives-l1-6.snapshot.json`) with the recorded sha256, in the form of `workbooks-a1-a2-keys.snapshot.json` of the Mastery repository.
- [ ] Task 1.4: Green. Make `schema.ts`, `tag-export.ts`, `export-tags.ts`, and `checks.ts` read the adult ids from the snapshot (key ids are data, not a new pattern in code).
- [ ] Task 1.5: Prove no change: regenerate `content/primary/tags.json` to a temp path and compare it with the committed file. The two are byte-identical for existing books.
- [ ] Task 1.6: Phase gate: PROJECT_TESTS, PROJECT_LINT, PROJECT_CHECKS. Commit the phase.

## Phase 2: Question-bank rule

- [ ] Task 2.1: Decide how a package is a Reading package (a field in `meta`, or the book name). Use an existing field if one exists. Record the choice in the track notes.
- [ ] Task 2.2: Red. Write `dashboard/__tests__/reading-bank-rule.test.ts` for FR-2.1 to FR-2.5, with a Primary package that stays unchanged.
- [ ] Task 2.3: Green. Add the check to `dashboard/lib/lesson-package/checks.ts`, with level `fail` for a Reading package and no entry for a Primary package.
- [ ] Task 2.4: Phase gate: PROJECT_TESTS, PROJECT_LINT, PROJECT_CHECKS. Run the check on every committed Primary package and prove 0 new results. Commit the phase.

## Phase 3: Tag-only pass for printed Reading Advantage Origins 2

- [ ] Task 3.1: Read-only look. Finding to confirm: `content/primary/origins-2/l01.json` to `l14.json` hold the printed Origins 2 lessons of the Primary program (`meta.book` origins-2, locked paragraphs, vocabulary, questions, and activities, with app article ids from the legacy Primary database). The www pages name the Tutor package `Reading Advantage Origins 2`. Check `/home/daniebo/Desktop/primary-advantage` (legacy Prisma `Article`, `prisma/schema.prisma`) and `/home/daniebo/Desktop/reading-advantage-monorepo` (`packages/db/src/schema/`, `apps/reading-advantage`) and write down whether the two names are one book or two programs. Read only. No credential use.
- [ ] Task 3.2: Write `pass-plan.md` in the track folder: the source of the article text, the tag fields to add, the locked fields, the validation commands, and the list of lessons.
- [ ] Task 3.3: Tasks for the pass: map each lesson to AR, AL, or R ids from the snapshot; fill `tags.targetObjectives`, `supportingObjectives`, and objectives per question; validate with the checks.
- [ ] Task 3.4: Mark the Daniel gates in `pass-plan.md`. Known candidates: a Thai title or reason sentence (Thai gate); a paid generation (spend gate); any removal of an old article (deletion gate); a public date for the new edition (date gate). If a task has none of the four, it is no gate.
- [ ] Task 3.5: If Task 3.1 finds that the two names are two programs with different sources, send the question to the PM orchestrator and take the printed Primary Origins 2 default meanwhile. Do not wait.

## Phase 4: Legacy library prune list

- [ ] Task 4.1: Find the lexical and level data that exist as files (the vocabulary graph in `../mastery-advantage`, GSE-to-level map, `docs/content-plans/data/*`). Record the inputs in the track notes. No database credential is used.
- [ ] Task 4.2: Red. Write a test for the script on a small fixture: the keep list rule, the output shape, and no write outside the output path.
- [ ] Task 4.3: Green. Write `dashboard/scripts/propose-library-prune.ts`: input is an exported article list file (a file that a person or the PM supplies; the script never connects to a database); output is `measure/tracks/reading_content_tags_20261127/prune-proposal.json` with keep, hide candidates, and the reason for each.
- [ ] Task 4.4: Daniel gate (deletion class): send `prune-proposal.json` to Daniel as a Google Task with a Drive link. Nothing is hidden before Daniel approves. Take the next item while the gate is open.
- [ ] Task 4.5: Phase gate: PROJECT_TESTS, PROJECT_LINT, PROJECT_CHECKS. Update `measure/lessons-learned.md` and `measure/tech-debt.md`. Report "facts changed" to the PM (an empty list is valid). Commit the phase.

## Daniel gates in this track (the four gates only)

- Task 4.4: the prune proposal before any hide (deletion class).
- Phase 3 candidates: marked in `pass-plan.md` when a task needs a spend, a deletion, Thai text, or a public date.
- Thai titles of the key (`titleTh` null): Daniel's own work, outside this track.
