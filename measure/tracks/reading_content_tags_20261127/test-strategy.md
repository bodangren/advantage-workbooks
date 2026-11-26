# Test strategy: Reading content tags

Track: `reading_content_tags_20261127`. Runner: vitest in `dashboard/` (`CI=true npx vitest run <files>`), one heavy-run wrapper, never nested.

## Phase 1: Key adoption (`dashboard/__tests__/reading-key-adoption.test.ts`)
- The committed snapshot hashes to its recorded sha256; a changed byte fails.
- The snapshot has the schema `reading-objectives-l1-6.v1` and unique ids.
- An `AR` id and an `AL` id from the snapshot pass `LessonPackageSchema`, `tagExportEntry` (no problem), and the `tags` check.
- An id not in the snapshot fails each of the three.
- A young `R` id gives the same result as before.
- Regeneration of `tags.json` into a temp path is byte-identical to `content/primary/tags.json` (the `generatedAt` field is the only allowed difference, and the test fixes it).
- Existing `lesson-package-tag-export.test.ts` stays green.

## Phase 2: Question-bank rule (`dashboard/__tests__/reading-bank-rule.test.ts`)
- A Reading fixture with 10 MCQ, 3 SAQ, 1 LAQ, all tagged, 2+ per target: passes.
- Edge cases: 9 MCQ, 2 SAQ, 0 LAQ each fail with the count in the message; one untagged question fails; a target with 1 question fails.
- A Primary fixture with 5 questions gives no result from this check.
- Run over every committed Primary package: no new fail.

## Phase 3: Pass plan
- A file review, no code. The reviewer confirms: the source is named with a path; each locked field is listed; each Daniel gate is one of the four; no Thai text in the file (a grep for U+0E00 to U+0E7F returns 0).

## Phase 4: Prune script (`dashboard/__tests__/propose-library-prune.test.ts`)
- Fixture list in, proposal out, deterministic order.
- The script has no database client import and no network call (a static test on the source file).
- The script writes only to the path that the caller gives.
- The proposal holds no hide action, only candidates.

## Track-wide
- No Thai characters in any track file.
- `git status` shows no change in `/mastery-advantage` (read only).
- No company-facing text in this track holds a count or a caveat.
