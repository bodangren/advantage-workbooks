# Plan: v2 workbook look (Chibi Quest) for Primary levels 5–9

Track: `primary_v2_look_20261020`. Spec: [spec.md](./spec.md).

Dates (printer file due 2026-11-06): S1–S4 by 2026-10-27; proofs to Daniel on 2026-10-28 (S5); Quest 5 build 2026-11-02 to 05 (S6). Every heavy command (every vitest run, every tsc run, every book PDF) runs through ONE wrapper, never nested: `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'` (PM rule, advantage-pr 0e091de, 2026-10-25). Exit 75 means: the pre-flight hold outlasted its wait. Every commit on a template path: send the id to the monorepo session through the PM (S7).

## Gate commands (orchestrator environment)

```bash
RED_TEST_COMMAND='set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/chibi-quest-step-names.test.ts'    # must fail after Red, before Green
GREEN_TEST_COMMAND='set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/chibi-quest-step-names.test.ts'  # must pass after Green
PROJECT_TESTS='set -o pipefail; cd dashboard && CI=true npx vitest run --exclude __tests__/storytime-unit2-sound-stage.test.ts'   # the whole dashboard suite; the exclude skips the open Red file of storytime_l2_unit2_20261106 (PM 2026-11-18); take the exclude out when that track's Task 3.6 Green closes. 3 tests of other tracks fail at afbfcf0e and later: __tests__/constants.test.ts 'includes Adventures 1.0 as a primary workbook option', and __tests__/origins-thai-support.test.ts origins-2-a0 and origins-3.1-a0; evidence measure/runs/levels_5_9_20261006/green-g2-baseline-r2.txt; the phase acceptance records them as earlier failures, outside this track
PROJECT_LINT='set -o pipefail; cd dashboard && npx eslint lib/document-wrapper/sections/teacher-guide.ts lib/workbook-document-wrapper.ts __tests__/chibi-quest-step-names.test.ts --no-error-on-unmatched-pattern'   # eslint does not lint the .html template, so the template is covered by the tests, not by this gate
PROJECT_CHECKS='set -o pipefail; cd dashboard && npx tsc --noEmit'   # one heavy-run; no nested heavy-run
```

Every gate command above runs inside ONE heavy-run wrapper: `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. The wrapper drops `${PIPESTATUS[0]}`, so a gate capture that needs the true exit code of a piped run takes the pipefail form outside the wrapper (levels_5_9 lesson, `green-g2-tests-exit.txt`). `PROJECT_TESTS` runs the whole dashboard suite, so it also covers `__tests__/workbook-look.test.ts`, `__tests__/chibi-quest-kit.test.ts`, and the new `__tests__/chibi-quest-step-names.test.ts`.

## Phase S1: Look switch per book [checkpoint: 9829649]
_Story ref: spec.md#story-s1_

- [x] Task: Contract `50fdec2`
    - [x] `look?: 'classic' | 'chibi-quest'` in the render options of `lib/template-renderer.ts` (next to `firstLessonNumber` and `headerStrip`); default `classic`
    - [x] The book's look: `look` in `primary/<project>/project.json` (when absent: the look of the book, from series and number); the book-folder map `CHIBI_QUEST_BOOKS` is in `lib/look.ts` (not `files.ts`: the wrapper must not import `fs`)
- [x] Task: Tests (first) `50fdec2` (`__tests__/workbook-look.test.ts`, 10 tests; 5 of 5 mutations caught)
    - [x] Classic is byte-identical: the golden `origins-3.2/print/golden/lesson-05{,-no-key}.html` (a test), 78 of 78 print HTML outputs (8 book compiles, 70 lessons; snapshot before and after), and the 70 print files of 08bb160 (`export-print-data.ts` gives no git change)
    - [x] A Quest 5 package renders with `chibi-quest`; no `look` gives `classic`
- [x] Task: Implement `50fdec2`
    - [x] The chibi-quest CSS goes in a separate block that only the `chibi-quest` look adds (`lib/document-wrapper/chibi-quest-styles.ts`, body class `look-chibi-quest`), so the classic HTML does not change
    - [x] Pass `look` through the compile and render routes, `render-lesson-html.ts` (`--look`), `make-lesson-pdfs.ts`, `export-print-data.ts`, and `print-export.ts`; `make-book-pdf.ts` calls the compile route and needs no change
- [x] Task: Docs: the option in `content/primary/README.md` (v1.3) `50fdec2`
- [x] Task: Measure - User Manual Verification 'Phase S1: Look switch per book' (Protocol in workflow.md) (Daniel: yes, 2026-10-20)

## Phase S2: Static print fonts for the new look [checkpoint: 478e0ea]
_Story ref: spec.md#story-s2_

- [x] Task: Contract: the faces that the kit uses (measure them on a first S3 render): Fredoka 500/600/700, Mitr 400/500/700 (Thai range), Quicksand 400/500/700 `c3ebffc` (`CHIBI_QUEST_FONT_FACES`)
- [x] Task: Tests (first): `print-fonts.ts` lists each new face with an existing file; a `chibi-quest` render embeds only static faces (`pdffonts`, no Type 3); the classic font list does not change `c3ebffc` (4 new tests; 4 of 4 mutations caught; a Chrome font test PDF: 10 CID TrueType faces, Mitr-Bold for bold Thai, no Type 3; the full Paged.js check is in S3)
- [x] Task: Implement `c3ebffc`
    - [x] Static woff2 files (Fontsource 5.3.0 builds of Google Fonts) and the OFL texts in `dashboard/assets/print-fonts/`; each licence read (SIL OFL 1.1; Quicksand has a Reserved Font Name, so the files stay unchanged)
    - [x] Register the faces in `lib/document-wrapper/print-fonts.ts`; add them only for the `chibi-quest` look (with `font-synthesis: none`: no italic faces)
- [x] Task: Docs: `assets/print-fonts/README.md`, `measure/tech-stack.md` `c3ebffc`
- [x] Task: Measure - User Manual Verification 'Phase S2: Static print fonts for the new look' (Protocol in workflow.md) (Daniel: yes, 2026-10-20)

## Phase S3: Chibi Quest print kit
_Story ref: spec.md#story-s3_

- [x] Task: Contract: a token table for print (the `--cq-*` hex values as flat fills) and the part list: wood step sign with rivets, gold step medal, time chip, parchment panel frame, white write-in box, right and wrong boxes with a word or icon, score medal [76b5975]
- [x] Task: Tests (first) [76b5975]: `__tests__/chibi-quest-kit.test.ts` (6 tests)
    - [x] The `chibi-quest` CSS has no `gradient`, `rgba(`, `opacity`, `box-shadow`, `text-shadow`, or emoji
    - [x] The step header HTML has the medal, the title, and the time chip; right and wrong boxes always have a word or an icon
- [x] Task: Implement [76b5975]
    - [x] Tokens, step sign, medal, and chip
    - [x] Panels and write-in boxes (white page, parchment accents)
    - [x] Answer key, score box, self-assessment, glossary, flashcards, and TOC in the kit
    - [x] SVG icons in `icons.ts` for the steps (no emoji): no change needed. The medals show the step number, as in the app; `icons.ts` is SVG already; 0 emoji in the render
    - [x] Tech debt: step 11 (title and writing box on one page) and step 3 (QR block, header, inline pictures), checked on Quest 5 and Adventure 9 lessons
- [x] Task: Verify: a scratch render of Quest 5 lesson 1; `make-pdfx.ts --check` passes; every page on a contact sheet [76b5975]
    - Quest 5 test book (l01, l02, all back matter): 47 pages, PDF/X-1a:2001, 9 fonts, no Type 3, all checks pass; classic: 78 of 78 HTML outputs byte-identical
- [ ] Task: Measure - User Manual Verification 'Phase S3: Chibi Quest print kit' (Protocol in workflow.md)

## Phase S4: App step names in the v2 books
_Story ref: spec.md#story-s4_

S3's open line (the User Manual Verification of the print kit) blocks nothing here. The kit code of 76b5975 is in the tree. S4 changes only the step names, so S3 stays as it is.

- [x] Task S4.1 (Contract, plan-only): the step-name table. The 13 printed steps of the chibi-quest books, the present classic name of each, and the app name of each:

| Step | Classic name (today) | Chibi Quest name | Sources |
|---|---|---|---|
| 1 | Before You Read | Introduction | template line 1555; `step-map.ts` line 21 `{ step: 1, title: "Before You Read", period: 1, appSteps: [1] }`; app title `messages/en.json` line 1586 `"introduction": "Introduction"` |
| 2 | Key Vocabulary | Preview Vocabulary | template line 1589; teacher-guide.ts line 12 (the only step name in the in-book teacher pages); `step-map.ts` line 22 (appSteps [2]); `messages/en.json` line 1587 |
| 3 | Read the Article | First Reading | template line 1654; `step-map.ts` line 23 (appSteps [3]); `messages/en.json` line 1588 |
| 4 | Collect Vocabulary | Vocabulary Collection | template line 1739; `step-map.ts` line 24 (appSteps [4]); `messages/en.json` line 1589 |
| 5 | Deep Reading Notes | Deep Reading | template line 1781; `step-map.ts` line 25 (appSteps [5]); `messages/en.json` line 1590 |
| 6 | Collect Sentences | Sentence Collection | template line 1806 (the title keeps its ` – {{grammar_search_term}}` conditional in both looks); `step-map.ts` line 26 (appSteps [6]); `messages/en.json` line 1591 |
| 7 | Comprehension Check | Multiple Choice | template line 1853; `step-map.ts` line 27 (appSteps [7]); `messages/en.json` line 1592 |
| 8 | Guided Response | Short Answer | template line 1916; `step-map.ts` line 28 (appSteps [8]); `messages/en.json` line 1593 |
| 9 | Vocabulary Practice | keeps its name | template line 1969; `step-map.ts` line 29 (appSteps [9, 10]: Vocabulary Flashcards and Vocabulary Matching; no single app step) |
| 10 | Sentence Practice | keeps its name | template line 2014; `step-map.ts` line 30 (appSteps [11, 12]: Sentence Flashcards and Sentence Activities; no single app step) |
| 11 | Guided Writing | keeps its name | template line 2050; `step-map.ts` line 31 (appSteps []: no app step) |
| 12 | Language Questions | Language Questions (the text does not change) | template line 2179; `step-map.ts` line 32 (appSteps [13]); `messages/en.json` line 1598 |
| 13 | Lesson Reflection | Lesson Summary | template line 2208; `step-map.ts` line 33 (appSteps [14]); `messages/en.json` line 1599 |

  Source records:
  - `step-map.ts` is read-only in the monorepo (`packages/domain/src/primary-books/step-map.ts`). It holds the 13 printed titles and the `appSteps` map to the 14 app steps. It holds no app step titles. The app titles come from the app lesson steps: monorepo `apps/primary-advantage/messages/en.json`, `Lesson.tasks`, lines 1586 to 1599. So each row cites the `step-map.ts` line for the mapping and the `en.json` line for the app title.
  - `step-map.ts` is the source, and no difference stands. Its titles match the template `h2.section-title` names word for word (steps 1 to 13), and its map agrees with spec.md#story-s4 (line 83) on every row. Steps 9, 10, and 11 keep their names, because no single app step maps to them (`step-map.ts` lines 29 to 31). Step 12 already carries its app name.
  - The classic names sit in `dashboard/templates/primary_template.html` (the `h2.section-title` lines above) and, for the in-book teacher pages, in `dashboard/lib/document-wrapper/sections/teacher-guide.ts` line 12 (`Key Vocabulary`). The answer key names steps 7 and 8 through its block labels `Multiple Choice:` and `Short Answer Hint:` (`sections/answer-key.ts` lines 37 and 54); those are the app names already. The TOC lists lesson titles only, so it holds no step name in either look.
  Done when: the table is complete and each row cites its source line. This task changes plan text only.
- [ ] Task S4.2 (Red): the new test file `dashboard/__tests__/chibi-quest-step-names.test.ts`. The tests cover:
  - the chibi-quest lesson render: the fixture `content/primary/quest-5/l01.json` (the package of `chibi-quest-kit.test.ts`), parsed with `LessonPackageSchema` and built with `buildWorkbookLesson`, rendered with `renderMultipleLessons(..., { type: 'primary', look: 'chibi-quest' })` (the same render route as `chibi-quest-kit.test.ts`). The 13 section titles are the 13 app names of the S4.1 table, in order. None of the nine classic-only names appears: Before You Read, Key Vocabulary, Read the Article, Collect Vocabulary, Deep Reading Notes, Collect Sentences, Comprehension Check, Guided Response, Lesson Reflection;
  - the chibi-quest book document: `wrapWorkbookDocument` with `look: 'chibi-quest'`, `tocEntries`, `answerKey`, and `includeTeacherGuide` with a `teacherGuide` entry. The in-book teacher pages show `Preview Vocabulary` (the app name of step 2; teacher-guide.ts line 12 holds the only step name there). The answer key keeps `Multiple Choice:` and `Short Answer Hint:` (the app names of steps 7 and 8). The TOC lists lesson titles only, so it shows no step name and does not change with the look;
  - the classic render keeps every present name: the same fixture with `look: 'classic'` and with no look shows the 13 classic names of the S4.1 table, and shows none of the nine app-only names;
  - byte-identity for classic: the golden `content/primary/origins-3.2/print/golden/lesson-05{,-no-key}.html` stays byte-identical (the S1 rule; the new file repeats the assertion, so its single-file gate covers it);
  - the pinned i18n: the test reads `lib/teacher-manual/i18n/en.ts` and `lib/teacher-manual/app-section.ts` and asserts that the classic step names and the step map in them are unchanged. `lib/teacher-manual/` is pinned (spec 'Pinned paths').
  Done when: `RED_TEST_COMMAND` fails only in the new file. Evidence: automated.
- [ ] Task S4.3 (Green): the names by look. Change `dashboard/templates/primary_template.html` (the 13 `h2.section-title` texts of the S4.1 table, by the `chibi_quest` flag that the render context already sets, `template-renderer.ts` line 148) and `dashboard/lib/document-wrapper/sections/teacher-guide.ts` (the `Key Vocabulary` heading of line 12 reads `Preview Vocabulary` for `chibi-quest`). The look reaches the section through its caller in `lib/workbook-document-wrapper.ts` (line 98, one line). No change in `lib/teacher-manual/`. The ` – {{grammar_search_term}}` conditional of step 6 keeps its place in both looks.
  Done when: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` exit 0 in heavy-runs; each new rule has a mutant that a named test catches; the classic golden stays byte-identical; and the template commit id goes to the PM for the monorepo session (S7). Evidence: automated.
- [ ] Task: Measure - User Manual Verification 'Phase S4: App step names in the v2 books' (Protocol in workflow.md)

Phase gates (roles, not tasks; their results live in measure/runs/primary_v2_look_20261020/):

- Reviews: the review gates that the strategy assigns to this change. Review A (correctness) applies, as the lead review: every name matches the S4.1 table (all 13, in order, in the right look), the classic output stays byte-identical, and `lib/teacher-manual/` does not change. Review B (security) applies, narrow: the change is static print text with no new input; the check is that no look leaks its names into the other, and that no new string takes un-escaped lesson data. Review C (route or CLI contract) does not apply: no route, flag, or option changes; the `look` option of S1 is unchanged. One adversarial round covers the attack surfaces of the strategy (a name misspelled, a step missed, a classic name left in the chibi-quest output, an app name leaked into the classic output, the pinned `lib/teacher-manual/` touched, the golden changed) and reuses the Green mutants. The UX browser review does not apply: S3 reviewed the visual kit, and this phase changes text only. Each review role of a model family other than the Red and Green families audits the head. It reports; it fixes nothing. Result files: `measure/runs/primary_v2_look_20261020/review-a-s4-<sha8>.json`, `measure/runs/primary_v2_look_20261020/review-b-s4-<sha8>.json`, and `measure/runs/primary_v2_look_20261020/adversarial-s4-<sha8>.json`. Done when: no open Blocker, and each finding is fixed or answered in this plan. Evidence: automated and peer-report.
- Phase acceptance: the acceptance role runs on the head after Task S4.3. Gates: `RED_TEST_COMMAND` and `GREEN_TEST_COMMAND` exit 0 (the Red file passes after Green), and `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` exit 0 in heavy-runs. The role states the exit code of each gate. `PROJECT_TESTS` has 3 failures in other tracks' files, and they also fail at afbfcf0e and later: `dashboard/__tests__/constants.test.ts` 'includes Adventures 1.0 as a primary workbook option', and `dashboard/__tests__/origins-thai-support.test.ts` origins-2-a0 and origins-3.1-a0; evidence `measure/runs/levels_5_9_20261006/green-g2-baseline-r2.txt`. The acceptance role records them as earlier failures, outside this track, and does not count them against the phase. Any other failure fails the gate. Result file: `measure/runs/primary_v2_look_20261020/phase-acceptance-s4-<sha8>.json`. Done when: the report holds PASS with 0 open blockers for Tasks S4.1 to S4.3, and this line records the result file. Evidence: peer-report.

## Phase S5: Page proofs for Daniel
_Story ref: spec.md#story-s5_

- [ ] Task: Proofs of Quest 5 lesson 1 and the longest Adventure 9 lesson: every page as a contact sheet, next to the app captures of the same steps (`parity-run2-2026-10-19/student/lesson-step*`)
- [ ] Task: Daniel's notes fixed; new proofs until he approves (date and notes in this plan)
- [ ] Task: Measure - User Manual Verification 'Phase S5: Page proofs for Daniel' (Protocol in workflow.md)

## Phase S6: Quest 5 printer file
_Story ref: spec.md#story-s6_

- [ ] Task: Preconditions: Daniel approved the Quest 5 content (levels 5–9 track); the Quest 5 articles are in the new database (QR); the Quest 5 cover is ready (covers track)
- [ ] Task: Tests (first): the project has 14 lessons, `look` `chibi-quest`, and `article_url` `https://primary.reading-advantage.com/b/q5/<n>` for each lesson
- [ ] Task: Implement
    - [ ] `primary/quest-5-a1/` project from the packages (`scripts/build-workbook-json.ts`)
    - [ ] Book PDF (`make-book-pdf.ts`), PDF/X-1a (`make-pdfx.ts --keep-fonts`), and the 14 lesson PDFs (`make-lesson-pdfs.ts`), under the lock
- [ ] Task: Verify: every `make-pdfx.ts` check passes; every page looked at; answer key on the last page of each lesson PDF; QR codes scanned on 3 lessons
- [ ] Task: Deliver: `~/Desktop/print-ready/Primary-Advantage-Quest-5_PDFX-1a.pdf` by 2026-11-06
- [ ] Task: Measure - User Manual Verification 'Phase S6: Quest 5 printer file' (Protocol in workflow.md)

## Phase S7: Monorepo print kit sync
_Story ref: spec.md#story-s7_

- [ ] Task: After each commit on `primary_template.html`, `icons.ts`, `styles.ts`, `print-fonts.ts`, or `assets/print-fonts/`: check that the classic golden is unchanged, and send the commit id to the monorepo session
- [ ] Task: Tell the monorepo session the option name `look`, its values, and the default `classic`
- [ ] Task: Measure - User Manual Verification 'Phase S7: Monorepo print kit sync' (Protocol in workflow.md)

## Close

- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`
