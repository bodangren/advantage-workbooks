# Spec: Reading content tags

Track: `reading_content_tags_20261127`. Type: feature (classic FR list). Source: `/home/daniebo/Desktop/handoff/2026-11-26-reading-app-upgrade-plan.md`, section 4.7 (content needs) and decision D3. Daniel approved the plan.

## Background

- The D3 objective key is published by Mastery Advantage (2026-11-26): `/home/daniebo/Desktop/mastery-advantage/english/reading-levels/reading-objectives-l1-6.json`, schema `reading-objectives-l1-6.v1`, 258 rows: 145 young ids `R<gse>.<n>`, 48 adult reading ids `AR`, 65 adult listening ids `AL`. `titleTh` is null in every row; Daniel supplies the Thai titles later. Read only: no task writes in `/mastery-advantage`.
- Workbooks tags today: `content/primary/tags.json` (key `objectiveKey` with 300 `R` ids, plus `packages`), written by `dashboard/scripts/export-tags.ts` through `dashboard/lib/lesson-package/tag-export.ts`. Short ids come from `docs/content-plans/data/*-objective-key.json`.
- The package schema `dashboard/lib/lesson-package/schema.ts` already has `tags.targetObjectives`, `tags.supportingObjectives`, `tags.glossedNodes`, and `objectives` per question. `checks.ts` checks the ids against the key given in the context.
- This track runs in the semester 2 Reading article regeneration. The Reading app writes no content (plan 4.7): Workbooks packages are the source.

## Functional requirements

### FR-1 Key adoption (Phase 1)
- FR-1.1 A committed snapshot of `reading-objectives-l1-6.json` lives in the Workbooks repository, with its sha256 recorded in the snapshot and in a test. The sha256 of the published file at the time of writing is `93293897f67b600b16280dd6c31ad214926ab59798ab19b60bddfb9b8711a67e`. The task verifies it again at read time.
- FR-1.2 The Primary package schema, `export-tags.ts`, and the lesson checks accept the adult ids `AR<gse>.<n>` and `AL<gse>.<n>` that the snapshot lists. An id that the key does not list stays an error.
- FR-1.3 Young ids `R<gse>.<n>` behave as before.
- FR-1.4 No existing package changes. `content/primary/tags.json` has no change in its output for existing books. A test proves this by regeneration and comparison.
- FR-1.5 A mismatch between the snapshot file and its recorded sha256 fails a test.

### FR-2 Question-bank rule (Phase 2)
- FR-2.1 A check (lint) applies to Reading article packages only. A Reading package has at least 10 multiple-choice, 3 short-answer, and 1 long-answer question.
- FR-2.2 Every question carries at least one objective.
- FR-2.3 Every target objective of the package has at least 2 questions.
- FR-2.4 Primary books keep their rules. The check does not run on a Primary package. A test proves that a Primary package result does not change.
- FR-2.5 The check message names the package, the question type, the missing count, and the objective, in plain words.

### FR-3 Tag-only pass for printed Reading Advantage Origins 2 (Phase 3)
- FR-3.1 A read-only look finds where the article source of the printed Reading Advantage Origins 2 lives, and records the result in `plan.md` notes or in a file in the track folder.
- FR-3.2 A pass plan lists the tasks for a tag-only pass: tags are added and the printed text, vocabulary, and questions stay locked, as for the printed Primary books (`import-printed.ts`).
- FR-3.3 A task that needs a spend, a deletion, Thai text, or a public date is marked as a Daniel gate. Only these four gates exist.

### FR-4 Legacy library prune proposal (Phase 4)
- FR-4.1 A script proposes the keep list from the lexical and level data. It is read only on databases, uses no credential, and deletes nothing.
- FR-4.2 The proposal file is a Daniel gate (deletion class: hide or removal of library items). No article is hidden before Daniel approves the file.
- FR-4.3 The lexical profile job (plan 4.7) runs on what stays. An article needs no new text for a profile.

## Out of scope

- Thai titles of the key (Daniel, pending).
- New article text, new art, and the Reading app code.
- Any change in `/mastery-advantage`.
- Any write to a database, any deploy.

## Rules

- No Thai text in any file of this track. A non-Claude role does not see week files or Thai fields.
- Company-facing material states no counts and no caveats. Counts in this spec are internal build facts.
- Heavy commands run through the heavy-run wrapper, never nested (see `plan.md`).
