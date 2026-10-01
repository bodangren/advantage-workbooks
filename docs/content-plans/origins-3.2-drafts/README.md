# Origins 3.2 article drafts

Version 1.0 | Date 2026-09-30 | Status: Active | Owner: Daniel Bo | Internal

This folder holds the article drafts for Primary Advantage Origins 3.2 (P01–P14) and the Origins 3.1 lesson-12 insert (E12). Each lesson has one draft file. A draft goes into the Primary database only after it passes the text check and Daniel approves it (3.2 plan §8).

Keep this folder out of `primary/`. Tutor Advantage's importer reads every folder in `primary/` and fails on a folder without a `project.json`.

## Draft format

```
---
lesson: P05
title: At the Market
profile: origins-3.2
glossed: shop, fruit, mango, banana, coconut, egg, bread, lime, how many, apple, lemon, thirteen
recycle: please, thank you, count, twelve
---
Paragraph one.

Paragraph two.

Paragraph three.
```

- `glossed`: the 12 words from the lesson brief.
- `recycle`: the words from earlier lessons that the brief tells the text to use again.
- `profile`: `origins-3.2` for the book, `origins-3.1-insert` for E12.
- `names`: extra proper names, if a text uses a name that is not in the series bible.
- `allow`: words above Starters that the brief permits (copy the brief's list). The Starters share does not count them.
- A blank line separates paragraphs. End every line of a chant or a sign with `.`, `!` or `?`, so that the check counts it as one sentence.
- File names sort in book order: `e12-…`, then `p01-…` to `p14-…`.

## Run the check

From `Workbooks/dashboard/`:

```
npx tsx scripts/lint-text-profile.ts ../docs/content-plans/origins-3.2-drafts
npx tsx scripts/lint-text-profile.ts ../docs/content-plans/origins-3.2-drafts/p05-at-the-market.md
```

The first command checks every draft and the book rules. The second checks one draft; the drafts before it count as earlier lessons. Earlier books (Origins 2 and Origins 3.1) always count. The checks and targets are in `measure/tracks/text_profile_lint_20260930/spec.md`.
