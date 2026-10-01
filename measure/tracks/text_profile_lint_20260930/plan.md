# Plan: Text-profile lint

Track: `text_profile_lint_20260930`

## Phase 1: Library (`dashboard/lib/text-profile/`)

- [x] Tests first: `__tests__/text-profile.test.ts` with a fixed vocabulary (tokens, sentences, lemmas, checks, draft parser)
- [x] `text.ts`: tokens, sentences, paragraphs, lemma candidates
- [x] `vocabulary.ts`: index from the graph JSON (form → lowest level; phrases; number words)
- [x] `sources.ts`: parse draft Markdown and lesson JSON; load a folder in order
- [x] `check.ts`: profiles and the per-lesson and book checks
- [x] `report.ts`: text report

## Phase 2: CLI and real data

- [x] `scripts/lint-text-profile.ts` (`--graph`, `--prior`, `--json`)
- [x] Graph test on the insert v0 text (skips when the graph file is absent)
- [x] Draft folder `docs/content-plans/origins-3.2-drafts/` with the insert v0 text; run the script on it
- [x] Update `measure/lessons-learned.md`, `measure/tech-debt.md`, and the 3.2 plan (task C3 done)

## Phase 3: Follow-up (2026-10-01, Daniel's review answers)

- [x] Test first: fewer new words than the target gives WARN; the level-3 profile has glossed Starters minimum 10
- [x] `check.ts`: `new` check gives WARN below the target; `glossedStartersMin` 11 → 10 (P08 glosses 2 Movers words and could never pass)
- [x] Spec table updated; 39 tests pass; ESLint clean
