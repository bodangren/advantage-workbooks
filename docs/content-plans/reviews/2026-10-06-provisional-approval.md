# Provisional approval of the 222 new lessons

Version 1.0 | Date 2026-10-06 | Status: Active | Owner: Daniel Bo | Internal

Daniel (2026-10-06): "The articles have been AI reviewed already. Please approve for now, get them in the DB, and I will manually approve later this week. If we need to make changes, we can update at that time."

Reason: the injector writes only to the legacy Primary database. The cutover (Oct 14–16) copies that database into the new one, so an article must be in the legacy database before the rehearsals (Oct 8).

## What Claude approved

Claude approved every part of 218 lessons with the store's "approve all" function (`approveBook`). That function applies the same checks as the review page. Every lesson had 0 FAIL.

| Book | Approved on 2026-10-06 | Daniel's own approval |
|---|---|---|
| Origins 1 | 10 | L01, L02, L04, L05 (2026-10-04) |
| Origins 3.2 | 14 | — |
| Quest 4 | 14 | — |
| bank-1 | 36 | — |
| bank-2 | 24 | — |
| bank-3 | 84 | — |
| bank-4 | 36 | — |

**Rule:** An approval with the date 2026-10-06 is provisional. Daniel did not see that lesson yet.

## What Daniel must check

1. The 42 workbook lessons: the pre-review log (`2026-10-03-prereview.md`) lists each change. Check every letter on the pictures with sign text (section 2 of that log).
2. The 180 bank articles: no person read them. Only the script checks and the AI review at generation looked at them.
3. Ten bank-3 pictures have sign text with no place on the sign (WARN `image-text`): B011, B028, B029, B030, B031, B032, B033, B034, B035, B048. The script draws the text in stacked boxes. Give each text a place, or make the picture again with the text in the prompt.

## How to change a lesson after the injection

1. Change the lesson on `/review` (or in its source, then convert). The changed part goes back to draft.
2. Approve the part and the lesson again.
3. Run `scripts/inject-lessons.ts` for the lesson. The injector writes only the lessons whose content hash changed.
4. Run `scripts/export-tags.ts` again and commit `content/primary/tags.json`.
