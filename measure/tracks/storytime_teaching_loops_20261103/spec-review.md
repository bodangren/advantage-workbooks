# Spec Review: storytime_teaching_loops_20261103

Author model: claude-code/claude-sonnet-5-5#high

## Round 1

Date: 2026-11-02
Reviewer: measure-spec-review, model coding-plan/glm-5.3-flash#high
Audited commit: d03d9e7da1d1e0b50b82b9170400c8ddc7a2b806
Verdict: fail (1 Blocker, 4 Major, 4 Nit)
Evidence: `measure/runs/storytime_teaching_loops_20261103/spec-review-d03d9e7d.json` and `.log`

### What this track proposes
The track adds five teaching routines from research item A-42 to the Storytime Level 2 weeks: an oral blend drill on A4, a correct-practise-retest loop on A1 to A3, a fast-way sight-word step on A6 and D2, three fixed questions on each read-along, and a daily recall of five cards. New optional schema fields carry the routines. Six new checks gate them with the status warn, then fail after the content of w01 to w08 lands. The manual prints the routines only with `--loops`, so the week 1 proof of 2026-11-05 stays byte-equal. The day stays 30 minutes, and Daniel approves the English and Thai text before the release proof of 2026-11-20.

### How the current system works, per this spec
A week file holds meta, focus, books, song, five daily scripts with steps, review strips, the Friday check, and approvals. `checkStorytimeWeek` runs the rules, and `check-weeks.ts` prints the reports per level. One accepted FAIL exists: the `published` row of st2/1, because the images, audio, and song parts are draft. `manual.ts` renders the teacher book HTML, and two print scripts build the Thai teacher book PDF. The opening is a fixed 6-minute routine.

### Findings
- F1 [Blocker] spec FR-1 (approval part `loops`): FR-1 adds `StorytimeApprovalsSchema.loops` with the default draft, but FR-1 also says "The `published` check and its message do not change" and the acceptance says the message of st2/1 stays as at the baseline. The published check (dashboard/lib/storytime/checks.ts lines 320-325) iterates every approval part except `print`, so the new draft part adds "loops not approved" to the detail of the accepted FAIL of st2/1 (the print track plan, Green 2 evidence, records the detail `images not approved; audio not approved; song not approved`). The message changes at Phase 1 Green, or the published check code changes, which FR-1 forbids. The spec must pick one: exclude `loops` in the published check like `print`, or drop the message criterion. Rationale: two acceptance criteria cannot both hold; the choice changes code.
- F2 [Major] spec FR-7 + FR-8: the `loops-minutes` acceptance requires `periodMinutes` is 30, but FR-8 applies the checks to Levels 2 to 4, and a Level 3 or 4 week has `periodMinutes` 49 (schema.ts lines 73-74). After the Phase 3 switch, every Level 3 or 4 week fails `loops-minutes`. The check must compare against `meta.periodMinutes`, or skip weeks outside the 30-minute periods. Rationale: the check scope and the check rule contradict.
- F3 [Major] spec FR-6: Comprehension gap: the rule "the item text is in the taught set of that week (`taughtTo`)" is undefined for the recall kinds `frame` and `word`, which FR-6 allows. `taughtTo` (dashboard/lib/storytime/checks.ts lines 54-63) holds only the taught graphemes, the tricky words, and the program week. A frame sentence or a family word is not in that set, so `loops-recall` as written rejects every `frame` and `word` recall item. The spec must define the taught set for each card kind. Rationale: an undefined project-specific term that decides the check result.
- F4 [Major] spec Ownership and overlap: the week_package paragraph states the rule "The orchestrator runs no task of the two tracks at the same time on one file", but the print track paragraph does not. This track edits `make-teacher-book-print.ts`, `manual.ts`, and `i18n.ts` in Phase 2 (2026-11-05 to 11-07), while the print track builds the week 1 proof in its Phase 6 (2026-11-05 to 11-09) and the release proof in its Phase 9 (2026-11-19 to 11-25) from the same files. The spec must state the same serialization rule for this overlap. Rationale: two active tracks can edit one owned file at the same time.
- F5 [Major] spec FR-1 + FR-11: FR-11 says the approved `loops` record has his words and the date, but the app-part shape (`StorytimeAppApprovalSchema`, schema.ts lines 458-461) leaves `date` and `words` optional, and unlike the print part (schema.ts lines 445-450) it has no refine. The spec does not say whether the schema or a loop check refuses an approved `loops` part without the date or the words. Rationale: an edge-case behavior that the plan leaves open, and the consent record (anti-pattern A2) depends on it.
- F6 [Nit] spec Terms (Donor step): the donor list names "the opening", but D7 keeps the opening at 6 minutes, and FR-7 reads the opening minutes from `meta.openingMinutes`, which `loopMinutes` cannot change. The opening can never donate minutes. Rationale: a definition that D7 overrides; it does not change what the implementer builds.
- F7 [Nit] plan Phase 3 Red: the byte-equality test compares the hash of the baseline file with the shipped week "with the new fields removed", but the plan does not name the removal operation. Parse, delete the FR-1 fields, and re-serialize with the original formatting, or the hash differs. Rationale: a test-mechanics detail; the test itself catches a wrong choice.
- F8 [Nit] spec FR-12 vs plan: FR-12 says three messages to the PM session, but the plan sends five (Hand-off 1, the page-count note, Hand-off 2 pin, Hand-off 3 --loops notice, the report). Rationale: a count mismatch in prose; the plan is the superset and the PM confirmations cover all five.
- F9 [Nit] plan Phase 2 Green: the new Thai headings in `i18n.ts` get no named Daniel check, although the NFR says every new English line needs his Thai check. They surface first in the release proof, which Daniel approves on 2026-11-24 in the print track. Rationale: a coverage note; no build change.

### Author Response
- F1=FIX (spec FR-1: the `published` check skips the `loops` part like `print`, as the one code change to it; the st2/1 detail stays `images not approved; audio not approved; song not approved`. Plan Phase 1 Red: guard for a draft `loops` part. Plan Phase 1 Green: the `checks.ts` filter change and a mutant)
- F2=FIX (spec FR-7: `loops-minutes` compares the day total with `meta.periodMinutes` of the week, not a fixed 30. Plan Phase 1 Red 2: minutes cases for a 49-minute Level 3 copy)
- F3=FIX (spec FR-6: the taught set for each card kind, with the acceptance line. Plan Phase 1 Red 2: one pass case and one fail case for each of `sound`, `tricky`, `frame`, and `word`)
- F4=FIX (spec Ownership and overlap, print track paragraph: the serialization rule and the Phase 9 `--loops` build. Plan Phase 2 Green: precondition that the print track commits its 2026-11-05 week 1 proof build first; Green 2 inherits it)
- F5=FIX (spec FR-1 and FR-11: the refine `StorytimeLoopsApprovalSchema` needs `words` and `date` on an approved part. Plan Phase 1 Red: four refine cases. Plan Phase 1 Green: add the refine)
- F6=FIX (spec Terms: the opening leaves the donor list; it is a host for the recall and stays 6 minutes, D7)
- F7=FIX (spec FR-10 and plan Phase 3 Red: parse both files, delete the FR-1 fields, compare the normalized `JSON.stringify` output, not the raw file hash)
- F8=FIX (spec FR-12: five messages to the PM session, named as in the plan)
- F9=FIX (plan Phase 3, Daniel's check task: it names the new Thai headings of `StorytimeLabels` in `i18n.ts`. Plan Phase 2 Green: the commit names the heading keys)

## Round 2

Date: 2026-11-02
Reviewer: measure-spec-review, model coding-plan/glm-5.3-flash#high
Audited commit: 7c7a468278cf551f580bc7d138c6411d7e953008
Verdict: pass (1 Major, no Blocker)
Evidence: `measure/runs/storytime_teaching_loops_20261103/spec-review-7c7a4682.json` and `.log`

F1 to F9 are fixed in the committed text.

### Findings
- F10 [Major] spec FR-6 (word cards): FR-6 uses the term "the text of a day" for `word` cards, but no section defines it. The pass set of `loops-recall` for word cards stays an open implementer decision. The reviewer reads it as the English lines of the steps and asks for one sentence in FR-6.

### Author Response
- F10=FIX (FR-6 defines the text of a day: the English step text; prep, Thai, and reader page text do not count)

The orchestrator checks the F10 fix. No third review round occurs (the round 2 handoff says so).

Post-review edits on 2026-11-02 after the test strategy (ec109f9e): FR-2 (Q1), FR-7 (P9), FR-13 (P7). The orchestrator checked them; no new review round.

## Amendment 1: Phase 3b (2026-11-07)

Author model: claude-code/claude-opus-5-5[1m]

Scope of the amendment:

- spec.md: the Overview paragraph of Amendment 1; the section "Owner request: parent-share moments"; three new rows of "Dates"; two new bullets of "Sources"; the Terms "Share moment", "Shot", "The period of a day", and "Assessment step"; FR-14; the defaults D16 to D28; one bullet of "Ownership and overlap"; item 6 and the contract check of "Interface for the Storytime app (Monorepo)"; two NFR bullets; three "Out of scope" bullets.
- plan.md: the row 3b of "Phases and dates"; the section "Phase 3b: Parent-share moments (2026-11-07 to 2026-11-13)"; one Phase 4 line (Hand-off 3 now names `--loops --share`). No line of Phase 1, 2, or 3 changed.

Review: pending. The orchestrator sends the amendment to a spec reviewer of a model family other than the author family. The amendment holds no Thai text, so the reviewer reads English only.
