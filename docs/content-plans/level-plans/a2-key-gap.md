# A2 Key gap at the end of level 9

Version 1.1 | Date 2026-10-08 | Status: Decided | Owner: Daniel Bo | Internal

**Decision (Daniel, 2026-10-08): option 1.** Groups C and D are out of the goal (`NOT_TAUGHT` in `dashboard/lib/lesson-package/coverage.ts`). The coverage report now gives A2 Key 496 of 547 (90.7%), and every goal of levels 5–9 is met.

Track: `measure/tracks/levels_5_9_20261006/`. Source: `coverage-5-9.md` of 2026-10-08 (`dashboard/scripts/level-coverage.ts --levels 5-9`).

## 1. Result

The packages of levels 1–9 gloss 496 of the 578 A2 Key words (85.8%). The goal is 90% by level 9 (521 words). Every other goal of levels 5–9 is met: all objectives, all book rules, Movers (355 of 355), Flyers (467 of 476), and the A1 and A2 recycling.

72 of the 82 missing words are in no text of the series. Most of them are British forms, UK money and titles, or adult topics. The series uses US English and a Thai primary-school setting, so the writers did not use these words.

## 2. The 82 missing words

| Group | Words | Count |
|---|---|---|
| A. Glossed, but not counted: the headword has "/" or "!" | cafe/café, congratulations!, lots / a lot, oh dear!, prefer / would prefer | 5 |
| B. British spelling of a US word that the series glosses | advert (ad), colour (color), favourite (favorite), grandad (grandpa), granny (grandma), jumper (sweater), mobile (cell phone), programme (program), sitting room (living room) | 9 |
| C. British-only forms | aeroplane, cheque, city centre, guest-house, harbour, have got to, headteacher, neighbour, penfriend, petrol, petrol station, roundabout, shopping centre, sports centre, till, tights, tourist information centre, trainer, underground, washing-up | 20 |
| D. UK money, titles, and symbols | at / @, dr, euro, mr, mrs, ms, pc, pence, penny, pound, v | 11 |
| E. Adult topics | boyfriend, credit card, dead, die, disco, get married, girlfriend, horror, housewife, kiss, smoke, smoking | 12 |
| F. Plain words that no lesson teaches yet | business person, by post, cola, colleague, department store, dot, flight, footballer, give somebody a call/ring, good-looking, grade, main course, make-up, mineral water, miss, omelette, passport, poor thing/you, rubber, skiing, soccer, steak, surfboarding, windsurfing, yeah! | 25 |

These words are already in a text with no gloss: by post, dead, department store, dot, kiss, miss, ms, rubber, smoke, v.

## 3. Options

1. **Chosen: leave groups C and D out of the goal**, as Daniel did for CD and DVD on 2026-10-06. The list then has 547 words, and the current packages reach 496 (90.7%). No package changes. The rule goes into `NOT_TAUGHT` in `dashboard/lib/lesson-package/coverage.ts`.
2. Also count group B through the US form, and fix the matcher for group A. Then the count is 510 of 547 (93.2%). This needs a code change to the coverage rule and tests.
3. Keep the full list. Then 25 more words need a gloss. Each gloss change makes the word audio of that package invalid, and the audio of levels 8 and 9 is in progress now.
