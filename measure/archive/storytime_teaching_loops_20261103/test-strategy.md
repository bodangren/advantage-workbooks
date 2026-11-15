# Test Strategy: storytime_teaching_loops_20261103

Written 2026-11-02 by the strategy role at 50070153 (role base `5007015369609dd4bef5425c8f049633ce529772`). Phase 1 has full detail. Phases 2 to 4 have an outline. The strategy role refreshes each outline before its phase starts. Amended 2026-11-07 at 0e632495: section 9 holds Phase 3b (Amendment 1) in full, and section 10 holds its plan_updates.

## 1. Sources and measured facts

Inputs: `spec.md` (rounds 1 and 2 of the spec review passed), `plan.md`, and `measure/anti-patterns.md` (A1 to A10). Also `measure/lessons-learned.md`, `measure/tech-debt.md`, and the print track strategy `storytime_print_r1_20261025/test-strategy.md`. The last input is the code that the plan names.

Facts measured on 2026-11-02 at 50070153. Code facts come from the working tree, which equals HEAD for `dashboard/lib/storytime`, `dashboard/scripts/storytime`, `dashboard/__tests__`, and `content/storytime/l2` (`git log cc7808c5..HEAD` lists no commit for these paths).

- F1. The step, script, book, and approvals schemas are plain `z.object` (`schema.ts` lines 157, 251, 272, 501). Zod strips unknown keys. A test that only asserts "parses" passes before Green, because the new keys vanish (A4; print strategy F9). Every "parses" test must assert the parsed value.
- F2. The `published` check (`checks.ts` lines 320 to 326) lists `Object.entries(w.approval)` and skips only `print`. A default draft `loops` part goes into the list. The check also counts every check with status `fail`, and it runs after all other checks. The six loop checks must be pushed before it. After the Phase 3 switch, a loop `fail` then also fails `published`.
- F3. No existing test counts the warnings or the checks of a shipped week. Measured by `grep` over the five test files that call `checkStorytimeWeek`. Nine tests read the `warn` status of a named check in `storytime-week.test.ts`: `thai`, `moved`, `tricky`, `song-sheet`, `song-pictures`, `decodable`, `check`, `opening-pa`, and `home`. Their ids differ from the six new ids, so six new `warn` checks change none of them. One test reads a count from the `thai` detail by regex (`storytime-week.test.ts` line 220) and compares two differences. It stays valid only if Green does not add the new BiText lines to the `bi` list of the `thai` check (decision Q9).
- F4. Four tests assert zero `fail` checks on a loop-incomplete week. They are in `storytime-week.test.ts`. Line 64 is the fixture week. Line 209 is a review week copy with the exact list `block`, `benchmark`. Line 264 is a published copy that must give `published` pass. Line 342 is the review fixture. They pass at `warn`. All four go red at the Phase 3 switch. The reason is that `fixtureWeek()` and `fixtureReviewWeek()` (`__tests__/fixtures/storytime-week-fixture.ts`) have no routines. The switch task says "Change no test file", so it cannot pass as written (plan_updates P4). Level 1 tests (line 108) are safe: Level 1 skips the checks. Some tests read the `published` detail of the shipped w01. They are `storytime-print-adversarial.test.ts` line 255 and `storytime-print-contract-v2.test.ts` lines 285 to 289. They also go red at the switch until the w01 content lands.
- F5. `check-weeks.ts` passes the known weeks as `others` to `checkStorytimeWeek`. `make-manual-pdf.ts` line 76 calls it with `taught` and `graph` but no `others`. The `others` argument holds the earlier weeks that `loops-recall` needs for `frame` and `word` cards. The test helper `run()` of `storytime-week.test.ts` passes neither `taught` nor `others`.
- F6. The shipped A4 blends by ear with sounds that the week has not taught. Week 1 (taught set `n` only) blends "net", "nut", and "nose" with /e/ /t/ /u/ /o/ /zzz/. Week 2 (taught `n`, `a`) blends "cat", "hat", and "fan" with /k/ /h/ /t/ /f/. Spec FR-2 says the drill words use only the sounds in `taughtTo`. In week 1, `taughtTo.graphemes` is `["n"]`, so no set of 3 to 5 words can pass. Week 2 can have only "an" and "Nan". The strict reading cannot be met in Phase 3. See decision Q1.
- F7. The loop steps by id are A1, A2, A3, A4, A6 (day A), C5 (day C), and D2 (day D). Days B and E have no loop step, and days C and D have one each. The sum rule of FR-7 is per day, so `loopMinutes` can differ from `minutes` only inside day A. In all seven teach weeks the non-moved steps of day A are 24 minutes, the opening is 6, and the period is 30. The steps C5 and D2 cannot give minutes to another step. They can only keep their `minutes`. The donor list of the spec is empty for days C and D. This is a Phase 3 content constraint, not a Phase 1 code risk.
- F8. Vitest cannot import a patched copy of a source file from `/tmp`. The print track adversarial role ran its mutants in the tree, with a backup and a `cmp` restore (log `adversarial-963cdfd8.log`). `checks.ts` imports `../lesson-package/checks`, `../text-profile/check`, `./phonics`, `./print/text-check`, and `./schema`. A lone copy in a temporary folder cannot load them. The plan text of Red 2 ("copies `checks.ts` to a temporary folder") cannot work. In-test mutants can only be data mutants. Code mutants follow the mutant protocol of section 5.6.
- F9. `make-teacher-book-print.ts` requires `--out` inside `<home>/Desktop/print-ready/storytime/` and an approved draft PDF per week (`--drafts`). It exits 1 when the text gate finds any difference, and it refuses an existing output. A build with `--loops` always differs from a draft without the loops, so it exits 1 by design. A test build needs a temporary `HOME` that holds the cached ICC profile (lessons-learned 2026-11-01). This affects Phase 2 only.
- F10. The manual HTML is deterministic. Two runs of `compileStorytimeManual` for w01 and w02 gave equal SHA-256 values. The values at 50070153 are below (first 16 hex digits). The script is `/tmp/opencode/strategy-loops/html-sha.ts`. The Phase 2 Red author measures the full values again at the Red start, with the pre-Green code.
    - w01: `compile th a4` 14ec7ef72bd775e9; `compile en` 88515d027b10727f; `render th` d4ca4e4f6b212c22; `render en` b25bf497cb740624.
    - w02: `compile th a4` fbb2af6a45f2a99c; `compile en` 0d1a89f7b303d6c2; `render th` 0cb8d5f5669e6c79; `render en` c7c3795339951063.
- F11. `tsc --noEmit` covers `__tests__` (`tsconfig.json` includes `**/*.ts`). A Red file that uses a new field with a strict type passes `tsc` only after Green, and Green cannot change a test file. Red must reach the new fields through an untyped helper, so that `tsc` passes before and after Green.
- F12. `BiTextSchema.th` defaults to an empty string. A new BiText without Thai parses. The Thai rule of FR-2 to FR-5 has no check of its own in the six checks. Phase 3 owns it (content test).
- F13. Week 1 has one new sound (`n`) and three tricky words. A day 2 recall of 5 distinct cards from week 1 is possible: the sound n, the tricky words a, and, can, and the frame. A day 1 recall of week 1 has no card (spec D6).
- F14. FR-13 says `git diff --name-only <phase base>..HEAD` shows no change in `student-book.ts`, `readers.ts`, `picture-check.ts`, `pictures.ts`, and `covers.ts`. The print track edits those files in the same checkout. A range diff would fail on the commits of the print track. The guard must test the commits of this track one by one (section 2.4).
- F15. Both tracks' `PROJECT_TESTS` use the glob `__tests__/storytime-*.test.ts`. The glob collects uncommitted files in the shared work tree too. At 50070153 the print track has an untracked `dashboard/__tests__/storytime-print-covers.test.ts` (its Phase 5 Red, `[~]`). A vitest run in this checkout reads it.
- F16. Baseline of `PROJECT_TESTS` at role_base_sha: see section 8.

## 2. Rules across the two active tracks

### 2.1 The deadlock

Each track's Green gate runs `PROJECT_TESTS` (`storytime-*.test.ts` and more). A committed or present Red file of the other track fails that gate. If both tracks are inside a Red window at once, neither Green can pass: each waits for the other. Only an exclude or a serial order breaks the cycle. The `RED_TEST_COMMAND` globs do not cross (`storytime-loops-*` and `storytime-print-*`), so the Red proofs themselves are not affected.

### 2.2 Rule R1: one Red window at a time

A Red window starts when a failing test file first exists in the work tree (committed or not). It ends at the Green commit that passes `PROJECT_TESTS`. At most one window is open across the two tracks. The orchestrator keeps the owner of the open window in its run log.

- Phase 1 Red (and Red 2, Red 3) of this track starts after the print Phase 5 Green passes its four gates. The print Phase 5 Red file is in the work tree now.
- Phase 2 Red starts after the print track has no open window. The Phase 2 Green waits for the print week 1 proof commit (plan, Green precondition).
- Phase 8 of the print track (card kit Red) can open a window at any time from 2026-11-02 to 2026-11-19. Check the print log before each Red of this track.
- The Red author writes the Red file inside its window only. Before the window, the draft stays outside `__tests__/` (for example in `/tmp/opencode/`).
- The Red windows of this track are short: one Red file, then its Green. The orchestrator does not start a second Red of this track before the Green of the first has passed.
- Date risk: Hand-off 1 is due 2026-11-05. If the print Phase 5 Green has not passed by 2026-11-04 12:00 ICT, the orchestrator uses the fallback (2.3) and does not slip the date.

### 2.3 Gate exclude: when it is better

An exclude is worse for short windows. It hides the other track's file from the aggregate gate. That gate exists to find a change in a shared module (plan line 31). A forgotten exclude is an A7-class hole. It needs an edit in the other track's plan, which another session owns.

An exclude is better in one case: the Phase 3 content test. Its Red file stays red from the Red commit until the last week lands (several days, from about 2026-11-07 to 2026-11-09 or later). The print Phases 6 to 9 run their Green gates in that time. Rule R2 for that file only:

- The print track's `PROJECT_TESTS` gets `--exclude "**/storytime-loops-content.test.ts"` from the Phase 3 Red commit to the switch commit. The orchestrator tells the print session in one message and puts the removal in the Phase 3 switch task.
- The `PROJECT_TESTS` of this track runs with the same exclude between the Red commit and the switch commit. A per-week task uses `-t "w0N"` on the content test instead (decision Q12).
- The switch task and each phase closeout run `PROJECT_TESTS` without any exclude. That run is the closing proof.
- Fallback for Phase 1 (only after 2026-11-04 12:00): the later window adds `--exclude "**/<other track Red file>"` to its own Red and Green commands. It asks the other session for the symmetric exclude. Both excludes end at the Green commit of the later window.

Structural alternative, not recommended now: a test name outside `storytime-*` (for example `loops-*.test.ts`) makes the print gate blind to this track's files. The dependency is then one way. It needs a plan edit of four file names and six gate lines.

### 2.4 Shared checkout and the phase checkers

- `phase_base_sha`: the orchestrator runs `git rev-parse HEAD` right after the commit of this file lands, and before the Phase 1 Mid Red role starts. This file holds no SHA for that purpose. Commits of the print track can land between this point and the first Red (rule R1). So the orchestrator also records `red_base=$(git rev-parse HEAD)` right before each Red role starts. It uses `red_base` as `--baseline` of the mid-red and jr-green gates (print strategy probe C and rule G7).
- Review and acceptance roles audit paths, not ranges: `git diff <base>..HEAD -- <paths of this track>`. Paths of Phase 1: `dashboard/lib/storytime/{schema,checks,phonemes}.ts`, `dashboard/scripts/storytime/{check-weeks,set-phoneme-audio}.ts`, `dashboard/__tests__/storytime-loops-*.test.ts`, `dashboard/__tests__/fixtures/` (if touched), and `measure/tracks/storytime_teaching_loops_20261103/`.
- FR-13 guard: for each commit SHA that the plan records for this track, `git show --name-only --format= <sha>` lists none of `lib/storytime/print/{student-book,readers,picture-check,pictures,covers}.ts` and nothing under `video/`. A range diff is not the proof (F14).
- Never stage `video/storytime-song/scripts/render.mjs`, `dashboard/raw.json`, the print files, or `measure/runs/**`. Stage path by path.

## 3. Risk classification and review gates

Review A: code and test quality. Review B: security and data. Review C: contracts and blast radius. Adversarial: break the tests. UX and browser review: `UX_REQUIRED=never`. The outputs are data, a library, and print files. The visual check is the contact-sheet task and Daniel's check. If the orchestrator runs the UX role, the role writes `ux_applicability: not_applicable` and `webbridge_status: not_run`.

Model families (Daniel's routing until 2026-11-03 15:00 ICT): Green and its fix rounds run on Sonnet (Anthropic). Red, Review A, B, C, adversarial, the independent content reviews, and acceptance run on a non-Anthropic family (D14).

| Phase | Risk | Review A | Review B (security and data) | Review C (contracts) | Adversarial | UX / API / browser |
|---|---|---|---|---|---|---|
| 1 Schema and checks | high | yes | yes: validation boundary, approval consent record (A2), unknown keys | yes: 21 schema callers, `published` gate, field names for the app | yes | UX never; API review inside Review C (the five items of the spec interface); browser not applicable |
| 2 Teacher book template and print | high | yes | yes, limited: HTML escape of routine lines, `--loops` argument, output path and temporary `HOME` | yes: `manual.ts` shared with the print track, byte-equal default | yes | UX never (contact sheets, person-checked); API no; browser not applicable |
| 3 Content w01 to w08 | critical | yes | yes: approved lines stay byte-equal (A2), `approval.loops` stays draft, Thai present | yes: switch fallout, fixtures, `published` gate | yes | UX never; API no; browser not applicable |
| 4 Report and release | high | limited (records only) | yes: Daniel's words and date are exact (A2) | no code; the pin hand-off text | no code; one record-tamper probe | UX never; API no; browser not applicable |

Why the classes. Phase 1 changes the shared schema and a publication gate, but it has no network, secret, or paid call. Phase 2 sends bytes to the printer and shares three files with the print track. Phase 3 changes a published, approved week and ends at an owner gate; a print order follows on 2026-11-25. Phase 4 writes the consent record.

## 4. Evidence classes

Each task note names one or more classes:

- owner-approved: Daniel only.
- person-checked: a named person did a physical check.
- automated: a gate command with its exit code.
- peer-report: a peer session reply. A PM relay of Daniel's words is a peer-report.
- model pre-check: never an approval.

A self-report closes no task. Write each SHA as `commit <sha>` on the first line of the task (print strategy G6).

## 5. Phase 1 in full: Schema and checks

### 5.1 Task order and owners

| Order | Task | Owner | Evidence | Closes when |
|---|---|---|---|---|
| 0 | Strategy (this file) | strategy role | automated | committed; the orchestrator records `phase_base_sha` |
| 1 | Red (schema) | Red role, non-Anthropic | automated | Red proof (5.3); commit holds only test files |
| 2 | Green (schema, `published`) | Green role, Sonnet | automated | four gates; mutants S1 to S20 caught |
| 3 | Red 2 (six checks) | Red role | automated | Red proof; commit holds only test files |
| 4 | Green 2 (checks, CLI) | Green role | automated | four gates; mutants C1 to C28 and C31 caught (C29 and C30 close at the Phase 3 switch); live proof |
| 5 | Red 3 (drill audio) | Red role | automated | Red proof |
| 6 | Green 3 (phonemes) | Green role | automated | four gates; mutants A1 to A7 caught |
| 7 | Hand-off 1 | orchestrator | peer-report | PM receipt |
| 8 | Manual Verification | orchestrator | automated | steps in 5.9 |
| 9 | Role gate, Review A, B, C, adversarial, phase acceptance | audit roles | automated | each audit JSON `pass` on one HEAD |

A Red role may not start before rule R1 allows it and before the decisions of 5.2 are answered. A task is `[x]` only with its SHA on the first line.

### 5.2 Decisions to pin before Red (defaults)

The orchestrator answers these before the first Red, or accepts the default. A Red test must not guess.

- Q1 (`loops-blend` taught set, F6). Default: a drill sound is allowed in two cases. Case one: `bankSound(sound)` equals `bankSound` of a grapheme in `taughtTo.graphemes`. Case two: it equals `bankSound` of a sound label that the same week names in its `opening.pa` lines (`soundLabels`). The check reads `sounds`, not `word`. The strict reading leaves w01 and w02 with fewer than 3 possible words, so Phase 3 would fail. If the orchestrator keeps the strict reading, the spec needs a change before Red 2.
- Q2 (`answer.page`). Default: the schema checks an integer and no bound. The check `loops-questions` owns page 0 and a page past the end. A schema bound would turn those edge cases into `schema` failures, and the plan's Red 2 cases could not reach the check.
- Q3 (strictness). Default: `blendDrill`, its word entries, `soundLoop`, `sightWords`, each question and its `answer`, and `recall` are `.strict()`, as the print block is. A misspelled optional key then fails and is not stripped (A7). The field names go to the app (Hand-off 1).
- Q4 (arguments). Default: when `taught` is not given, `loops-recall` still enforces the count, the duplicates, and `week <= file week`. It skips the `sound` and `tricky` taught set and says so in the label. When `others` is not given, it skips earlier-week `frame` and `word` items and says so. A skipped part never reports pass for itself (A4).
- Q5 (day 1 of week 1). Default: the exception applies when `meta.level` is 2, `meta.week` is 1, and `day` is 1. A recall that is present on that day is checked like any other.
- Q6 (duplicates). Default: two items repeat when `kind` and `stem(text)` are equal inside one day. The same item on two days is allowed.
- Q7 (`answer.word`). Default: a whole word of `stem(page text)`, case and punctuation ignored. A substring does not match ("cat" is not in "catch").
- Q8 (Level scope). Default: Levels 2 to 4 (`scriptIdsOf(level)` is `A` to `E`). A Level 1 report holds no `loops-*` id. A review week reports only `loops-recall` and `loops-minutes` (spec D11).
- Q9 (Thai). Default: the six checks do not test Thai. Green does not add the new lines to the `bi` list of the `thai` check (F3). Phase 3 tests the Thai.
- Q10 (`LOOP_CHECK_STATUS`). Default: Red 2 never asserts the literal `'warn'`. It asserts that each loop check problem has the status `LOOP_CHECK_STATUS`, and that the constant is `warn` or `fail`. A literal test would force a test edit at the switch.
- Q11 (questions on a decodable). Default: no rule and no test. Record it as tech debt if a reviewer asks.
- Q12 (Phase 3 test shape). Default: the content test names each test with `w0N`, so `-t "w0N"` selects one week.

### 5.3 Red proof (all Reds of the phase)

All must be true for each Red commit:

1. The command exits non-zero.
2. The output has the labeled line `Tests  <n> failed` with n of 1 or more. It has no `No test files found` (print strategy F1: the glob matches nothing before the first Red).
3. The failing tests are in the new file only. The files of earlier loops Reds pass. Run `npx vitest run __tests__/storytime-loops-<name>.test.ts` for the new file, and `RED_TEST_COMMAND` for the whole glob.
4. Each failure is an assertion failure or a missing export inside a test body. Load a new export with `await import()` inside the test. Reach the new fields through an untyped helper (F11).
5. The Red log lists the characterization tests (they pass at Red) by name. These are "the shipped weeks parse", "the six approval parts are as at the baseline", and the `published` guards (5.4).
6. Every expectation comes from a run of a reference value, not from reasoning alone (lessons-learned 2026-10-26). Where no reference code exists, the Red author states the derivation in the test comment.

### 5.4 Red (schema): `storytime-loops-schema.test.ts`

Tests (labeled ids). New objects load from the shipped w02 as the base (rule 11.3).

- L1. The 8 shipped weeks parse. A copy of each week without an `approval.loops` key parses to `approval.loops` equal to `{ status: 'draft' }`. (Fails at Red: the key is absent.) The test does not read `approval.loops` of the shipped file, because Phase 4 changes it.
- L2. A w02 copy with each new field set to a valid value parses. The test asserts the parsed value with `toEqual` (F1). The fields on a step are `blendDrill`, `soundLoop`, `sightWords`, and `loopMinutes`. The other fields are `questions` on the read-along, `recall` on a script, and `approval.loops` approved with `words` and `date`.
- L3. Bounds, one pair per bound (pass at the edge, fail past it). `blendDrill.words`: 3, 5 pass; 2, 6 fail. `repeats`: 2, 5 pass; 1, 6 fail. `sounds`: 2, 4 pass; 1, 5 fail. `sightWords.words`: 1, 3 pass; 0, 4 fail. `seconds`: 2, 5 pass; 1, 6 fail. `loopMinutes`: 0, 20 pass; 21 fails. `questions`: exactly 3; 2 and 4 fail; a `kind` twice fails; a kind outside `who`, `what`, `where` fails.
- L4. Unknown keys fail in each new object (Q3), and a misspelled key fails (`correcton`).
- L5. `answer.page` 0 parses (Q2). It is the check that fails it (Red 2).
- L6. `recall.items` has no length rule in the schema: 4 and 6 items parse. The items are `StripCardSchema` cards: a card kind outside the four fails.
- L7. Approval guards (characterization at Red). `STORYTIME_APPROVAL_PARTS` equals the exact array `['text','thai','images','audio','song','scripts']`. An approved app part with only `status` and `date` parses to an equal object. An approved app part with `status` only also parses, as at the baseline. This guards against a refine added to the app part by mistake. `loops` is not a key of `STORYTIME_APPROVAL_PARTS`.
- L8. Refine cases of `StorytimeLoopsApprovalSchema`. These fail: approved without `words`; approved without `date`; approved with `date` `''`; approved with `words` of spaces; an unknown key in the part. These parse: approved with both, to an equal object; draft without both. (The cases that fail to parse, and the default of L1, are red at Red.)
- L9. `published` guards. The shipped w01 gives status `fail` and the detail exactly `images not approved; audio not approved; song not approved`. A w01 copy with six approved app parts, `meta.status` `published`, and a draft `loops` part gives `published` pass. A copy with an explicit draft `loops` part gives the same detail as the shipped w01. A copy with a draft `images` part still reports `images not approved` (the exclusion is not over-broad; A7). These pass at Red, because the stripped key changes nothing. They are characterization tests. Mutant S17 and S18 give them their falsification.
- L10. Names contract for Hand-off 1. The key set of each new object equals the spec list, exactly. The sets are: `{words, model, lead, test, repeats, correction}`, `{word, sounds, audio}` for a drill word, `{correct, practise, retest}`, `{words, slide, check, seconds}`, `{kind, ask, answer}`, `{page, word}`, `{items, ask}`. The test parses a full valid value with `.strict()` objects and compares `Object.keys`.

### 5.5 Green (schema): gate and mutants

Changed files: `schema.ts`, `checks.ts` (the one filter line). Export through the existing `StorytimeStep` and `StorytimeBook` types. Gate: `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `PROJECT_LINT`, and `PROJECT_CHECKS` exit 0, inside one heavy-run wrapper each. Run `git checkout -- pnpm-lock.yaml` if the lock file changed. `PROJECT_CHECKS` also gives the first `tsc` result of this track (F11).

Mutants (the Green log records `mutants: <n>, caught: <n>` as labeled integers):

| Id | Mutant | Must fail |
|---|---|---|
| S1 to S2 | `blendDrill.words` max 5 to 6; min 3 to 2 | L3 |
| S3 to S4 | `repeats` max 5 to 6; min 2 to 1 | L3 |
| S5 | `sounds` bounds widened | L3 |
| S6 to S7 | `sightWords.words` and `seconds` bounds widened | L3 |
| S8 | `loopMinutes` max 20 to 21 | L3 |
| S9 | `questions` length rule removed | L3 |
| S10 | unique-kind refine removed | L3 |
| S11 | `loops` default removed | L1 |
| S12 | refine: `date` rule removed | L8 |
| S13 | refine: `words` rule removed | L8 |
| S14 | refine: `trim` removed (spaces pass) | L8 |
| S15 | `loops` part not strict | L8 |
| S16 | `loops` added to `STORYTIME_APPROVAL_PARTS` | L7 |
| S17 | `published` filter loses the `loops` exclusion | L9 |
| S18 | `published` filter skips every draft part | L9 |
| S19 | the refine is put on `StorytimeAppApprovalSchema` | L7 |
| S20 | a new object is not strict | L4 |

### 5.6 Mutant protocol for code (F8)

A code mutant changes a source file in the tree. Keep a copy first, run the target test, restore from the copy, and compare with `cmp` after each mutant. Run one mutant at a time, and never while another session runs a mutant on the same file. Record `mutants: <n>, caught: <n>` and `restore cmp: ok`. If a run is stopped, compare the files with the copies before anything else (lessons-learned 2026-10-22). Data mutants (a change to a copy of a week) run inside the test, in a folder from `fs.mkdtemp`.

### 5.7 Red 2 (six checks): `storytime-loops-checks.test.ts`

Base and builder. The test builds a loop-complete copy of each teach week w01 to w07 from a sample builder. It loads the shipped week as the base. It first removes the FR-1 fields, so that the base is the same before and after Phase 3. The builder writes routines from a hand-written table of drill words and recall items for w01 and w02. It derives them for w03 to w07. The test holds a known answer for w01 and w02, hand-written and checked against the shipped scripts. So the builder cannot agree with the checker by copying it (A3). All data comes from a shared constant file `__tests__/fixtures/storytime-loops-sample.ts` (plan_updates P2). The copy passes each of the six checks with status `pass`. The test asserts six distinct ids and six `pass` values, not only "no failure" (A4).

Checks, with the falsification condition of each (mutant ids from 5.8):

| Id | Test | Falsified when |
|---|---|---|
| B1 | `loops-blend`: a teach week without `blendDrill` on A4 reports; a drill on A3 does not count | C1 survives |
| B2 | an untaught sound reports; a taught sound passes; a taught `a` with the drill label `/a/` passes (alias) | C2 or C3 survives |
| B3 | a w01 drill with oral-base sounds from `opening.pa` passes (Q1) | C2 survives |
| B4 | `loops-sound`: A1, A2, A3 each need `soundLoop`; remove one at a time (3 cases) | C7 survives |
| B5 | `loops-sight`: A6 and D2 both needed (2 cases). Words in another order report. A week without tricky words that has `sightWords` reports. A week without tricky words and without `sightWords` passes | C4, C5, or C6 survives |
| B6 | `loops-questions`: order `what`, `who`, `where` reports. Page 0 and page length+1 report. Page 1 and page length pass (boundary pair). `answer.word` only on another page reports. "cat" against a page with "catch" reports (Q7) | C8 to C12 survives |
| B7 | `loops-recall`: 4 and 6 items report. 5 pass. A repeated item in one day reports. The same item on two days passes. An item of a later week reports. An item with `week` equal to the file week passes | C13, C15, or C20 survives |
| B8 | recall by kind, one pass and one fail each (spec FR-6). `sound` and `tricky` against `taughtTo`: a grapheme of week 1 used in a week 2 recall passes. `frame`: a current or earlier `focus.frame` passes. A later week's frame fails. `word`: a word in the English step text of an earlier day of the same week passes. A word only on a later day fails. A word on the same day fails. A word only on a reader page fails. A word only in a `th` line fails. A word only in `prep` fails. A word in the text of an earlier week passes | C16 to C19 survives |
| B9 | day 1 of week 1 without a recall passes. Day 2 of week 1 without a recall fails. Day 1 of week 2 without a recall fails. A recall present on day 1 of week 1 is checked (Q5) | C14 survives |
| B10 | `loops-minutes`: a Level 2 copy with the day sums 30 passes. Sums 29 and 31 fail. A Level 3 copy (`meta.level` 3, `periodMinutes` 49) with sum 49 passes, with sum 30 or 48 fails. A moved step does not count. The opening counts. A `loopMinutes` on B2 that differs from `minutes` fails. `loopMinutes` equal to `minutes` on B2 passes. A loop step with 1 minute fails, with 2 passes | C21 to C26 survives |
| B11 | scope: a Level 1 copy has no `loops-*` id. A review week (w08) has exactly `loops-recall` and `loops-minutes` (set equality). A w08 copy with `soundLoop` on A1 does not add `loops-sound` | C27 or C28 survives |
| B12 | status: each problem has the status `LOOP_CHECK_STATUS`. The constant is `warn` or `fail` (Q10). A w01 copy with the FR-1 fields removed shows the six checks with a non-pass status and a detail text | the Phase 3 switch (C29) |
| B13 | the existing `minutes` check still passes on `minutes` for a copy that has `loopMinutes` (FR-7) | the `minutes` check reads `loopMinutes` |
| B14 | the shipped weeks w01 to w08 with the FR-1 fields removed (rule 11.3): the loop checks run, and each problem has the status `LOOP_CHECK_STATUS`. The test reads the stripped copy, so Phase 3 content does not break it | the check does not run on a shipped week |
| B15 | the check with `taught` and `others` missing keeps the count rule and prints the skipped parts in the label (Q4) | a skipped part reports pass |

Existing-test effect (F3, F4): the six new `warn` checks change no existing test result in Phase 1 and 2. The Green 2 task reads `storytime-week.test.ts` and `storytime-phonics.test.ts` first, and it reports any change.

The code mutants of Red 2 run by the Green role (5.6), not inside the test file. The plan text about a temporary copy of `checks.ts` is replaced by this protocol.

### 5.8 Green 2: gate and mutants

Changed files: `checks.ts` (six checks, `LOOP_CHECK_STATUS`, pushed before the `published` block), `check-weeks.ts` (format only; it needs no code if the checks run through `checkStorytimeWeek`). Gate: as 5.5. Live proof: `npx tsx scripts/storytime/check-weeks.ts --level 2` in `dashboard/`. The output holds the six `loops-*` ids as `warn` for each teach week w01 to w07, and two ids for w08. It also holds exactly one FAIL line (`published` of st2/1, detail unchanged).

| Id | Mutant | Must fail |
|---|---|---|
| C1 | the A4 rule dropped | B1 |
| C2 | the untaught-sound rule dropped | B2 |
| C3 | labels compared as raw strings, not `bankSound` | B2 |
| C4 | `loops-sight` checks A6 only | B5 |
| C5 | word order ignored (set compare) | B5 |
| C6 | a week without tricky words may hold `sightWords` | B5 |
| C7 | `loops-sound` checks A1 only | B4 |
| C8 | question order ignored | B6 |
| C9 | page 0 accepted | B6 |
| C10 | `page > length` replaced by `page > length + 1` | B6 |
| C11 | `answer.word` searched in all pages | B6 |
| C12 | `answer.word` matched as a substring | B6 |
| C13 | `!== 5` replaced by `< 5` | B7 |
| C14 | day 1 exception widened to every day 1, or to all of week 1 | B9 |
| C15 | `item.week <= week` replaced by `<` | B7 |
| C16 | `sound` set uses the current week only | B8 |
| C17 | `frame` set uses the current frame only | B8 |
| C18 | `word` set includes reader page text | B8 |
| C19 | `word` set includes the same day | B8 |
| C20 | duplicates counted across days | B7 |
| C21 | the sum uses `minutes` | B10 |
| C22 | the sum compares with 30 | B10 |
| C23 | moved steps counted | B10 |
| C24 | the opening left out | B10 |
| C25 | loop step floor 2 replaced by 1 | B10 |
| C26 | any step may differ | B10 |
| C27 | the checks run on Level 1 | B11 |
| C28 | the review week runs all six | B11 |
| C29 | status hard-coded `'warn'` in a check | the Phase 3 switch; not caught in Phase 1 (known gap) |
| C30 | a loop check pushed after `published` | the Phase 3 switch dry run (5.10) |
| C31 | a check reports `pass` when its routine is absent in a skipped branch | B1 to B15 |

### 5.9 Red 3 and Green 3: the drill sounds in the bank

Red 3 file: `storytime-loops-audio.test.ts`. Green 3 changes `phonemes.ts` and `set-phoneme-audio.ts`.

- D1. `phonemeAudioFields` on the loop-complete w02 copy returns one field per drill word. The path is the numeric path to the word (for example `['scripts', 0, 'steps', 3, 'blendDrill', 'words', 0, 'audio']`; the plan's `steps[A4]` is symbolic). The value is the list of bank paths of its `sounds`, in order.
- D2. `phonemeAudioProblems` reports a drill sound that the bank lacks, and a field that is missing or differs.
- D3. A week without `blendDrill` returns the same fields as a frozen baseline. The Red author computes the baseline from the pre-Green code and stores it as a SHA-256 of the JSON.
- D4. Round trip: `setPhonemeAudio` on a raw copy, then `phonemeAudioProblems` gives an empty list. Other bytes of the raw copy stay equal.
- D5. An unresolved drill sound makes `setPhonemeAudio` throw and makes `check-weeks.ts` report `phoneme-audio` with `fail`. This check is `fail` and not `warn`, so Phase 3 content must run `set-phoneme-audio.ts` before `PROJECT_CHECKS`.

| Id | Mutant | Must fail |
|---|---|---|
| A1 | the drill is not listed | D1 |
| A2 | only the first sound of a word | D1 |
| A3 | sounds in reverse order | D1 |
| A4 | an unbanked drill sound is dropped without `unresolved` | D2 |
| A5 | the value is a string, not a list | D1 |
| A6 | `setPhonemeAudio` does not write the drill | D4 |
| A7 | the script index is used for the step index | D1 |

### 5.10 Gates, live proofs, and the switch dry run

- Closeout of Phase 1 needs these results. The command `role-gate --role jr-green` gives PASS (with `--baseline red_base` of the last Red cycle). Review A, B, and C give JSON `pass` on one HEAD. The adversarial role gives `pass` with `PROJECT_TESTS`. Phase acceptance runs on an immutable HEAD. The mutant tables 5.5, 5.8, and 5.9 are complete with every mutant caught, except C29 and C30, which the Phase 3 switch closes.
- Dry run for the switch (feeds Phase 3): do it once, in Phase 1 Green 2. Set `LOOP_CHECK_STATUS` to `'fail'` in the tree with a backup. Run `PROJECT_TESTS`. Restore with `cmp`. Write the list of red tests to `measure/runs/storytime_teaching_loops_20261103/switch-dryrun.txt`. The list must hold the four fixture tests of F4. It may also hold the tests that read the `published` detail of the shipped w01, which the w01 content cures. Any other test in the list goes to the orchestrator.
- Hand-off 1 text: the names of L10 plus the rule "the app shows the routines only when `approval.loops` is approved". The message calls the shapes "Phase 1 version 1, before reviews". A review change sends version 2.

### 5.11 Anti-pattern coverage, Phase 1

| A | Defense | Falsified when |
|---|---|---|
| A2 | L8: an approved `loops` part needs `words` and `date`; S12 to S15 | any of S12 to S15 survives |
| A3 | L3 bound pairs; labeled counts `Tests  <n> failed` and `mutants: <n>, caught: <n>`; B10 exact sums; B11 set equality | a test asserts "has a check" or a total only |
| A4 | L2 asserts parsed values (F1); B1 to B15 assert `pass` by id; the Red proof excludes `No test files found`; B15 refuses a silent skip | S11 or C31 survives |
| A5 | task notes quote measured exit codes only; the `tsc` result is measured at Green | a plan line claims "all pass" without a run |
| A6 | `tracks.md` makes no claim about the loops | a registry note says "resolved" before the Phase 3 switch |
| A7 | L9 (exclusion not over-broad), B8 (a reader-page word fails, a substring fails), L4 strict objects | S18, C12, or C18 survives |
| A9 | the new tests load `content/storytime/l2/*.json` and `lib/`, never a track path | a test reads `measure/tracks/` |
| A10 | none: no generated file in Phase 1 | |

A1 and A8 are retired.

### 5.12 Artifact tests and live tests

Artifact tests read committed files: the shipped weeks, the plan markers, the sample constants. Live tests run the code: the checks on copies, `check-weeks.ts`, the phoneme functions, and the mutant runs. An artifact pass does not prove live behavior. Phase 1 needs both: the live proof is the `check-weeks.ts` output and the mutant tables.

### 5.13 Intentionally red

- `RED_TEST_COMMAND` is red only between a Red commit and its Green commit. No push happens inside that window, and rule R1 applies.
- `PROJECT_TESTS` is red in the same window (the new file fails). The Green gate of the same cycle closes it.
- `check-weeks.ts --level 2` keeps one FAIL, `published` of st2/1, with the detail unchanged. The six loop checks show as `warn` until the Phase 3 switch.
- The full dashboard suite has 3 known failing tests (tech-debt 2026-09-30). `PROJECT_TESTS` does not include them.
- No other test may be committed red.

## 6. Phases 2 to 4: outline

| Phase | Red command | Green gate | Closeout gate | Riskiest behavior and mutant |
|---|---|---|---|---|
| 2 Template and print | `npx vitest run __tests__/storytime-loops-manual.test.ts`, then `storytime-loops-teacher-book.test.ts` | four gates; `PRINT_GATE` and inkcov (C, M, Y all 0) on a `--loops` build of the loop-complete w01 copy | contact sheets of every page, each opened (person-checked); page count recorded; PM receipt | see 6.1 |
| 3 Content w01 to w08 | `npx vitest run __tests__/storytime-loops-content.test.ts` | per week: `-t "w0N"` plus `PROJECT_CHECKS` plus an independent review; switch: four gates without any exclude | Daniel's check (owner-approved); real page count; Review A, B, C, adversarial | see 6.2 |
| 4 Report and release | none (no code) | `PROJECT_CHECKS`; normalized compare of the week files against the Phase 3 end commit with `approval.loops` removed | PM receipts for Hand-off 2, 3, and the report | see 6.3 |

### 6.1 Phase 2

Byte-equal guard (spec FR-9). Two layers, both needed:

1. Pinned layer: for w01 and w02, four hashes each (F10), measured with the pre-Green code at the Red start. `git log cc7808c5..HEAD -- lib/storytime/manual.ts lib/storytime/i18n.ts content/storytime/l2/w01.json w02.json` must be empty at that time. If it is not empty (the print track changed a file), the Red author pins the hashes at the Red-time HEAD. The Red author writes the reason in the test.
2. Differential layer: for a loop-complete copy, `render(copy, loops off)` equals `render(copy with the FR-1 fields removed, no option)`. This holds when the print track changes the base, and when Phase 3 adds fields to the shipped weeks. It also catches a renderer that prints routines because the data holds them, not because the option is true.

Mutants: P2-1 the default of `loops` is true. P2-2 the heading prints when the option is off. P2-3 one extra space in a template string of `renderStep`. P2-4 the routines print when the week holds fields (option ignored). P2-5 one field is not escaped (parameterized, one field per case: model, lead, test, correction, drill word, slide, check, ask.en, ask.th, recall text). P2-6 `loopMinutes || minutes` (a `loopMinutes` of 0 must print 0). P2-7 the recall prints at the end of the day, not in the opening. P2-8 the Thai heading equals the English text (a Thai label must hold a Thai character). P2-9 `--loops` is parsed but not passed to `compileStorytimeManual`. P2-10 an unknown flag exits 0.

Other tests: order inside each step (FR-2 to FR-6 order, by `indexOf` inside the day section). A routine without `th` prints the English line only and does not throw. The labels exist in `StorytimeLabels` for both languages. The `--help` text names `--loops`. The CLI tests parse the source with the TypeScript AST, as `storytime-print-teacher-book.test.ts` does, and they run `--help`. They do not run Chrome in vitest. The live proof is the build.

Live proof (Green 2): Chrome and Ghostscript run only inside one heavy-run wrapper. `make-teacher-book-print.ts` cannot be the proof path as written (F9): its text gate compares with a draft without loops and exits 1. Default (plan_updates P6): build the loops draft with `make-manual-pdf.ts --loops`, then run `make-teacher-book-print.ts --loops --drafts <the loops draft folder>` with a temporary `HOME` that holds the ICC cache. The gate then compares the loops build with the loops draft, and the base build without `--loops` keeps the old behavior. A test also covers the other path: `--loops` with the old draft exits 1 and lists the loop lines as differences.

Shared files with the print track: `manual.ts`, `i18n.ts`, and `make-teacher-book-print.ts`. Green waits for the print week 1 proof commit (2026-11-05). Review C diffs path-scoped (2.4).

Anti-patterns: A3 (exact hashes, labeled page count). A4 (the differential layer is not vacuous: the Red copy must hold at least one field of each of the five kinds). A7 (an escape rule per field, not one global replace). A10 (the contact sheets and the page count are not committed). The run folder keeps them, and the PM message names the commit they came from.

### 6.2 Phase 3

Content test (Red). Reads each shipped week and the baseline blob `git show cc7808c541ca1cac810a7cd74f34520f748aef5b:content/storytime/l2/wNN.json`.

- Normalized compare (spec F7). Parse both files with `StorytimeWeekSchema`. Delete from the shipped side exactly: `scripts[].steps[].{blendDrill,soundLoop,sightWords,loopMinutes}`, `books[].questions`, `scripts[].recall`, `approval.loops`, and the two keys of the print track (`print`, `approval.print`). Each key of the second group is an allow-list entry with a named owner track. Normalize with recursively sorted keys and array order kept. Compare the `JSON.stringify` output. If `git show` fails, the test fails with a message (it never skips; A4).
- Falsifiers (copies): change one character of an existing Thai line. Delete one existing line. Change `minutes` of one step. Reorder two steps. Change a `th` array order. Each must fail. A key reorder alone must pass (the normalizer sorts keys). The deleter removes the FR-1 set only: a mutant deleter that also removes `th` must fail the Thai-change falsifier.
- The print track will change `w01.json` (Phase 6, `approval.print`) and `w02.json` to `w07.json` (Phase 7, `print` blocks) after cc7808c5. The allow-list covers only those two keys. Any other drift fails.
- `approval.loops`: the test accepts draft, or approved with `words` and `date` (the refine). It does not assert the literal `draft`, because Phase 4 sets `approved` (plan_updates P5). The proof that the approved record is Daniel's is Review B and the Phase 4 check.
- Content rules: six checks `pass` for w01 to w07. For w08, two checks pass. Each new BiText has non-empty `th`. Each drill sound has a bank recording. Each day sums to `periodMinutes` with `loopMinutes ?? minutes`. Only the seven loop step ids differ. The repeated lines (`lead`, `test`, `slide`, `check`) have 12 words or less. A 13-word line fails. "don't" is one word. Punctuation is not a word.
- Day A is the only day that can move minutes (F7). The Red test pins the C5 and D2 minutes to their baseline values, so a content author cannot hide a missing minute budget.
- Each content task is `[x]` only with four items. The items: its part of the content test, `PROJECT_CHECKS`, a `set-phoneme-audio.ts` run (D5), and one independent report-only review with no open error. The review role is of a non-Anthropic family. The review checks the new lines against the spec and the existing style rules (pure sounds, short sentences). Lessons-learned 2026-10-22 shows 6 to 10 defects per week after the gate passed.

Switch task (set `LOOP_CHECK_STATUS` to `'fail'`): predicted fallout is the four tests of F4 (dry run in 5.10). Plan_updates P4 moves the fixture upgrade into the Phase 3 Red commit, so the switch needs no test edit. Closing proofs: a broken copy of each teach week reports `fail` for each of the six checks (this closes mutant C29). A published copy with a broken routine gives `published` `fail` with `loops-... fails` in the detail (closes C30). `check-weeks.ts --level 2` shows exactly one FAIL (`published` of st2/1). `PROJECT_TESTS` runs with no exclude (rule R2).

Mutants: P3-1 one existing `en` line edited. P3-2 one Thai line edited. P3-3 a week's `periodMinutes` sum off by one. P3-4 a drill word with an unbanked sound. P3-5 `approval.loops` approved without `words`. P3-6 a `loopMinutes` on B2. P3-7 `LOOP_CHECK_STATUS` left at `warn`. P3-8 a recall item from a later week.

Anti-patterns: A2 (Daniel's checked text stays draft). A3 (exact minute sums, labeled mutant counts). A4 (the normalizer must be shown to fail on a real change). A5 (no "clean" claim in the plan without a run). A7 (the allow-list is exactly two keys).

### 6.3 Phase 4

No code. The checks: (1) the record commit changes only `approval.loops` in the eight files (normalized compare against the Phase 3 end commit with `approval.loops` removed). (2) Each approved record holds Daniel's words and the date exactly as the Phase 3 task line holds them. Review B compares the strings. (3) The refine rejects a record without `words` or `date` (the Phase 1 tests stay green). (4) `PROJECT_CHECKS` passes. (5) The Hand-off 2 message names the commit and the pin rule. (6) Memory files have 50 lines or less. Mutants: a record with the words of another source; a record for 7 weeks only; `meta.status` changed by the record commit. Anti-patterns: A2 (consent words), A5 and A6 (the report and `tracks.md` say "approved" only after Daniel's words exist), A3 (labeled counts: 8 approved records).

Hand-offs 1 to 3 and the report are peer-report evidence: a sent message without a PM reply closes no task.

## 7. plan_updates (recommended; the orchestrator decides)

- P1. Add rule R1 and R2 (section 2) to the plan "Rules for every task". The print Phase 5 Green is the start condition of the Phase 1 Red.
- P2. Phase 1 Red 2: replace "the test copies `checks.ts` to a temporary folder" with the mutant protocol of 5.6. Allow the Red commit to hold the shared sample constant file `__tests__/fixtures/storytime-loops-sample.ts` (test support). The line "the commit holds only the test file" becomes "only files under `__tests__/`".
- P3. Phase 1: add the decisions Q1 to Q12 (5.2) to the plan before Red. Q1 is the most important (the `loops-blend` taught set conflicts with the shipped A4, F6).
- P4. Phase 3 Red: add the fixture upgrade (`fixtureWeek()` and `fixtureReviewWeek()` get the sample routines) to the Red commit, and add the switch dry-run list (5.10). Change the switch task text "Change no test file" to "Change no test file; the Red commit has upgraded the fixtures".
- P5. Phase 3 Red: the `approval.loops` assertion is "draft, or approved with words and date", not the literal draft.
- P6. Phase 2: the `--loops` build with `make-teacher-book-print.ts` needs a loops draft for the text gate (F9). Add a task or a sentence: the loops draft comes from `make-manual-pdf.ts --loops`. The Red 2 test builds with a temporary `HOME`.
- P7. FR-13 acceptance: replace the range `git diff --name-only` with the per-commit check of 2.4 (F14). This is a spec edit.
- P8. The Phase 3 Red file is excluded from the print track `PROJECT_TESTS` (rule R2), and the switch task removes the exclude.
- P9. Spec FR-7 note (F7): the donors C5 and D2 cannot give minutes under a per-day sum. Add one sentence, or accept it.

## 8. Baseline of `PROJECT_TESTS` at role_base_sha

Command (one heavy-run wrapper): `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts __tests__/covers-*.test.ts __tests__/print-pdfx.test.ts'`. The raw output is `measure/runs/storytime_teaching_loops_20261103/strategy-50070153-baseline.txt`.

Measured on 2026-11-02 at 5007015369609dd4bef5425c8f049633ce529772:

- Exit code 1. `Test Files  1 failed | 24 passed (25)`. `Tests  4 failed | 613 passed (617)`.
- Duration 562.60 s in vitest; real time 15 m 42 s. The lock wait was about 6 minutes, under the 600 s limit.
- The 4 failures are all in `__tests__/storytime-print-covers.test.ts`. This file is the uncommitted Red file of the print track Phase 5. It is untracked in the shared work tree. Each failure says `Missing module: lib/storytime/print/teacher-book-cover.ts`. The failing tests are:
    - rejects an unknown teacher-book band in a copied cover data file;
    - applies the cover-track copy check to teacher cover text and catches the specified bypasses;
    - checks each shipped week 1 reader cover for Sprout and catches a copied cover mutation;
    - composes each teacher-book side as an opaque 300 ppi image at the specified trim.
- The baseline of this track without that file is 24 files and 613 tests. All pass. No file of this track failed.
- The plan (line 33) quotes 17 files and 424 tests, measured by the print track on 2026-10-28. The numbers above replace them.
- This run proves rule R1 of section 2: the present Red file of one track fails the `PROJECT_TESTS` of the other track.

## 9. Phase 3b in full: Parent-share moments

Written 2026-11-07 by the strategy role at 0e632495 (role base `0e632495e8e90494e94fbb85698062f9af1f19a7`). Inputs: `spec.md` (FR-14, D16 to D28, Interface item 6; spec review `spec-review-ffd9971c.json` passed), `plan.md` Phase 3b, the author fix `0e632495`, `measure/anti-patterns.md` (A1 to A10; A1 and A8 are retired), and the code that the plan names. Phase 3 (w01 to w08 content) is closed except Daniel's check of 2026-11-16. Sections 1 to 8 stay valid. Section 9 adds the rules for Phase 3b only.

Shorthand. `HR` is `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c`. Each gate below runs as `HR 'set -o pipefail; <command> 2>&1 | tee <log>'`. Logs go to `measure/runs/storytime_teaching_loops_20261103/p3b-*.txt`. `LINT_3B` is `cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/storytime-loops-*.test.ts __tests__/fixtures/storytime-share-sample.ts __tests__/fixtures/storytime-week-fixture.ts __tests__/fixtures/storytime-loops-sample.ts`. `PROJECT_TESTS` passes as Q26 reads it. `PROJECT_LINT` alone does not cover the three fixture files (spec review F2). Every Red and every Green of Phase 3b runs `LINT_3B` and records its exit code. The first Red creates `storytime-share-sample.ts`, so `LINT_3B` is valid from that commit.

### 9.1 Facts measured at 0e632495

- F17. The working tree equals HEAD for `dashboard/lib`, `dashboard/scripts`, `dashboard/__tests__`, and `content/` (`git status --porcelain` lists only the untracked `dashboard/raw.json`). The last week-file commit is `95043edc` (2026-11-06, print track). The print track still changes week files, so the baseline commit of the share compare moves (decision Q21).
- F18. `check-weeks.ts --level 2` at 0e632495: exit 0, 0 FAIL rows, 1 WARN row (`print-missing` of st2/8), and 8 weeks. Log `strategy-p3b-0e632495-check-weeks.txt`. The accepted `published` FAIL of st2/1 is gone since 2026-11-04. The plan line "only the accepted `published` FAIL" is stale. The print track gate accepts 0 FAIL rows (`67be5603`). So in Phase 3b the live gate is: exit 0 and 0 FAIL rows at every commit (plan_updates P11).
- F19. `BiTextSchema` has `en: z.string().min(1)` and `th: z.string().default('')` (`schema.ts` line 55). So an empty `caption.en` fails the parse and never reaches the check. A caption of spaces passes the parse and has 0 words (rule 6). A caption without `th` parses to `th: ''` and rule 6 reports it. `StepSchema.id` is `z.string().regex(/^[A-Z]\d{1,2}$/)` (line 344). `ScriptSchema` is a plain `z.object` (line 394): an unknown key on a script is stripped. The new `share` objects must be `.strict()` (FR-14).
- F20. `manual.ts` prints a step through three paths. Path 1: the main steps (`renderStep` with `loops`, line 259). Path 2: `movedGroup` for the moved steps of the day before (line 258 and 342); it passes no option today. Path 3: the opening-song path (`openingSongs`, line 253); it passes no `loops` today. In w01 the shots D5 and D6 take paths 2 and 3: D5 has `moved` and 1 minute (path 2), D6 has `moved`, 0 minutes, and a "karaoke videos" material (path 3). In w08, E3 has 4 minutes and takes path 1. A Green that adds `share` to path 1 only prints 3 of 6 icons for a teach week. The icon count (6 and 5) and a per-step placement test catch this.
- F21. `compileStorytimeManual` calls `renderStorytimeWeek` with `{ loops, studentBookPages }` (line 406). `make-teacher-book-print.ts` has one compile call, in `renderChromePdf` (line 134), and two call sites of `renderChromePdf` (the full book and the per-week text gate). `make-manual-pdf.ts` has one compile call (line 86). The flag test of the existing file `storytime-loops-teacher-book.test.ts` checks only the compile call.
- F22. `make-teacher-book-print.ts` builds one unit. w01 to w08 are all unit 1, so one build gives one file `Storytime-Advantage-L2-U1-Teachers-Book-TH-v<n>_PDFX-1a.pdf`. It needs one approved draft per week named `Storytime-L2-W0N-Teachers-Book-TH-draft.pdf` in `--drafts`. It refuses an existing output (exit 2; use a new `--version`). It has no `--help`: an unknown flag exits 2 and prints the usage. `--out` must lie inside `<home>/Desktop/print-ready/storytime/`. The default draft folder holds the approved drafts without loops and without share, so a `--loops --share` build needs its own draft folder (section 9.12).
- F23. `STORYTIME_ROOT` has no environment override. A command-line script cannot read other week files. A source-side mutant of the caption cross-check can run only in process (F1 gap G2, section 9.10).
- F24. `compileStorytimeStudentBook(weeks, { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' })` is the call of the existing tests (for example `storytime-print-a48-part2.test.ts` line 32). It needs no Chrome.
- F25. No existing test counts the checks of a shipped week (`checks.length` appears only as `> 0` in `storytime-print-contract.test.ts` lines 193 and 231). Tests that read `published` of the shipped w01 (`storytime-loops-checks.test.ts` line 704, `storytime-print-adversarial.test.ts` line 255, `storytime-print-contract.test.ts` line 185) stay green at `warn`. At `fail` they go red until the content lands (section 9.8).
- F26. The numbers of the baseline are in section 9.17.
- F27. `PROJECT_TESTS` is red at the role base for a reason outside this track. The test `M-icons: each icon is a black line SVG with no color, no transparency, and no gradient, 10 to 12 mm wide` (`storytime-print-step-system.test.ts`, print track) exceeds the 5000 ms default of vitest. It took 5104 ms in the full run and 6314 ms in a rerun of its file alone, and it fails both times with `Test timed out in 5000ms`. So a Phase 3b gate that needs `PROJECT_TESTS` exit 0 cannot pass until the print track fixes the test. Decision Q26 gives the reading of the gate. The orchestrator asks the print session now.

### 9.2 Task order and owners

| Order | Task | Owner | Risk | Evidence | Closes when |
|---|---|---|---|---|---|
| 0 | Strategy (this section) | strategy role | low | automated | committed; the orchestrator captures `phase_base_sha` (9.16) |
| 1 | Red 1 (schema and check) | Red role, non-Anthropic | medium | automated | Red proof (9.4); commit holds only files under `dashboard/__tests__/` |
| 2 | Green 1 (schema, check, constant) | Green role, Sonnet | medium | automated | four gates, `LINT_3B`, mutants MS and MC caught, switch dry run 1 |
| 3 | Hand-off 4 | orchestrator | low | peer-report | PM receipt |
| 4 | Red 2 (content, fixtures, R3) | Red role | medium | automated | Red proof; R3 exclude in place; `PROJECT_TESTS` passes with it |
| 5 | Content (8 week files) and English review | Green role (Sonnet), reviewer non-Anthropic | high | automated, model pre-check | content gates (9.8) and a review with no open error |
| 6 | Switch to `fail` | Green role | high | automated | switch gates (9.9); R3 ends |
| 7 | Red 3 (teacher book, cross-check) | Red role | medium | automated | Red proof |
| 8 | Green 3 (manual, labels, flags, script) | Green role | high | automated | four gates, `LINT_3B`, mutants MB and MX caught |
| 9 | Teacher book build | orchestrator | medium | automated, person-checked, peer-report | build gates (9.12) |
| 10 | Caption list | orchestrator | medium | automated, peer-report | list gates (9.13) |
| 11 | Daniel's check | Daniel | n/a | owner-approved | his words and date in the plan line |
| 12 | Role gate, Review A, B, C, adversarial, phase acceptance | audit roles | n/a | automated | each audit JSON `pass` on one HEAD (9.3) |

Order rule. A Red role does not start before rule R1 allows it and before the decisions of 9.5 are answered. Before each Red role the orchestrator records `red_base=$(git rev-parse HEAD)` (section 2.4). The orchestrator reads the print log for an open Red window. Red 1 and Red 3 are Red windows of this track. Red 2 is a window until the R3 exclude is in place. The print track Phase 8 and its fix rounds can open a window at any time. Green 3 starts only when `git status --porcelain dashboard/lib/storytime/manual.ts dashboard/lib/storytime/i18n.ts dashboard/scripts/storytime/make-teacher-book-print.ts dashboard/scripts/storytime/make-manual-pdf.ts` prints nothing and no print task holds those files.

### 9.3 Review gates and risk

Risk of the phase: high. Reasons: it adds a field to a schema that 21 files read; it adds a check that blocks a published week after the switch; it changes `manual.ts` and `make-teacher-book-print.ts`, which the print track shares; it adds text that a parent group sees and a child photo consent line (A2). The phase has no network call, no secret, and no paid call.

| Gate | Applies | Why and scope |
|---|---|---|
| Review A (code and test quality) | yes, once after Green 3 | The cross-check script and the new tests are new code. Scope: `schema.ts`, `checks.ts`, `manual.ts`, `i18n.ts`, both print scripts, `check-share-captions.ts`, and the five new test files and two fixtures. |
| Review B (security and data) | yes | HTML escape of captions and labels (one escape per field, A7). The consent line prints with every icon (A2). No child name and no file path in any caption (public repository; Monorepo rule 7). The cross-check reads a path from `argv` and writes nothing. The build output stays inside `share-check-v1/` (containment check). The Thai captions do not reach any model (the review pack of 9.8). |
| Review C (contracts and blast radius) | yes | Interface item 6 and the Monorepo passthrough claim; `StorytimeScript` and `StorytimeLabels` readers (tsc is the proof for the labels type); the `published` order; the print track gates (0 FAIL rows); R3 start and end; FR-13 per commit (9.14). The API review of the five Phase 1 items plus item 6 sits inside Review C. |
| Adversarial | yes, once after the switch and Green 3 | The rules of the check (word count, the media regex, rules 2 to 5), the cross-check parser (`\|`, row grammar), and the escape are all edge-case rules. Targets: A4, A7. The adversarial role gets the English captions only. |
| UX and browser review | not applicable | `UX_REQUIRED=never`. The outputs are data, a library, a script, and a print file. The visual check is the contact sheets of the build (person-checked) and LP-28 at Daniel's sitting. Chrome only renders the PDF. If the orchestrator runs the UX role, it writes `ux_applicability: not_applicable` and `webbridge_status: not_run`. |

Role gate: `role-gate --role jr-green` with `--baseline red_base` after Green 1, after the content task, and after Green 3. Model families follow the orchestrator's current routing. Section 3 gave Green on Sonnet and Red, reviews, adversarial, and acceptance on a non-Anthropic family (D14); the orchestrator confirms it before Red 1.

### 9.4 Red proof (all Reds of Phase 3b)

Each Red commit meets all of these (section 5.3 applies; the points below add to it):

1. The command exits non-zero. The log has the labeled line `Tests  <n> failed` with n of 1 or more, and no `No test files found`.
2. Only the new file fails. The earlier loops files pass. Run first `HR 'cd dashboard && CI=true npx vitest run __tests__/<new file>'`, then the whole glob.
3. Each failure is an assertion failure or a missing export inside a test body. New exports load with `await import()` inside the test. New fields are reached through an untyped helper (F11), so `tsc` passes before and after Green.
4. The Red log names the tests that pass at Red (characterization) and gives a falsifier for each (a mutant, or a data falsifier in the test).
5. Expectations come from the spec text or from a run of a reference value. The moment table is typed by hand from spec FR-14, never derived from a week file or from the check (A3).
6. Thai rule. A Phase 3b test holds no Thai wording as an expectation. A test asserts only that a Thai field is present, is not empty, and holds a Thai-script character (`/[฀-๿]/`). The sample file may hold one Thai placeholder constant as test input. No `expect` compares a shipped Thai string with a literal. Review A checks this by `grep -nP '[\x{0E00}-\x{0E7F}]' dashboard/__tests__/storytime-loops-share*.test.ts`: every hit is test input and none is inside an `expect`.
7. Each Red notes its baseline: `Test Files  <n>` and `Tests  <n>` of `PROJECT_TESTS` at its parent (labeled integers, A3).

`RED_TEST_COMMAND` (exact, one wrapper): `HR 'set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/storytime-loops-*.test.ts 2>&1 | tee ../measure/runs/storytime_teaching_loops_20261103/p3b-red-<n>.txt'`. Expected summary lines: Red 1: `Test Files  1 failed | 6 passed (7)`. Red 2: `Test Files  1 failed | 7 passed (8)`. Red 3: `Test Files  1 failed | 8 passed (9)`. If the file count differs, the author names the cause. The glob also matches the share files, so GREEN_TEST_COMMAND is red in the R3 window (9.9); only the content task and the switch task run in that window, and the content task uses `-t "w0"` only.

### 9.5 Decisions to pin before Red (defaults)

The orchestrator answers these before Red 1, or accepts the defaults. A Red test must not guess. Q1 to Q12 stay as in section 5.2.

- Q13 (word count, spec review F3). Default: the spec rule 6 is the counter (trim, split on `/\s+/`, count the non-empty parts). Each test file holds its own counter, typed from the rule. A test never imports the counter of the check (A3). Boundary cases: 40 words pass; 41 fail; 1 word passes; 0 words (spaces only) fail; a 40-word caption with a double space passes; a 40-word caption with a leading space and a newline passes; "don't" is one word.
- Q14 (check order and detail). Default: one check row `share-moment`. Each problem text starts with `day <d>: ` where d is the day of the script. The Red tests assert that the detail names the broken day and does not name a day that is not broken (A7).
- Q15 (the constant). Default: Green declares exactly one line `export const SHARE_CHECK_STATUS: CheckStatus = 'warn';`. The switch fast gate (`grep -c "SHARE_CHECK_STATUS: CheckStatus = 'fail'"`) and the dry run need this form. Green 1 runs `grep -c "^export const SHARE_CHECK_STATUS: CheckStatus = 'warn';$" dashboard/lib/storytime/checks.ts` and expects `1` (A4: a vacuous fast gate otherwise).
- Q16 (the media pattern). Default: the check tests the raw caption string, not a trimmed copy, as the Monorepo `mediaPathsOf` does. Cases: `x.mp4` and `x.MP4` fail; `x mp4` and `x.mp4 y` pass. One case for each of the 17 extensions. The case `x.mp4 ` (a trailing space) is not pinned.
- Q17 (consent line, A2). Default: the English `shareConsent` matches `/consent/i` and `/group/i`. A Green label that drops these words is a Green error. The owner may change the D20 text before Red 3; then the Red author changes the pattern and says so in the Red log. The Thai label holds a Thai-script character. `shareLength` English matches `/second/i`.
- Q18 (consent line edge). Default: the consent line and the length line print once per week part, at the first shot of the first day that has a share. For a complete week this equals the first shot of day 1 (D20). A copy with no share on day 1 still prints the consent line once, so an icon never prints without it. If the orchestrator rejects this default, the Red author drops test T9.
- Q19 (the combination of options). Default: `share` and `loops` are independent. The tests cover all four combinations of the HTML (loops off or on, share off or on).
- Q20 (caption content rules in the content test). Default: each `caption.en` of w01 to w08 has 1 to 40 words; no `|`, no `<`, no `>`, no line break; the 40 English captions are pairwise different; each `caption.th` has a Thai-script character. D19 (names the English of the moment; names no child) is a review-only rule: no honest automated test exists. The English review checks it for each of the 40 rows (9.8).
- Q21 (baseline of the share compare). Default: `SHARE_BASELINE_COMMIT` is `git log -1 --format=%H -- content/storytime/l2` at the start of Red 2 (it is `95043edc` today). Both sides of the compare lose the same allow-list: the keys of `withoutNewFields` in `storytime-loops-content.test.ts` (`print`, `approval.loops`, `approval.print`, `approval.audio`, `approval.song`, `approval.images`, `books[].cover.file`, `books[].pages[].image.file`) and `scripts[].share`. The allow-list has no other key (A7). If the print track commits a week file before the content commit, a test-only commit moves the constant first (plan Red 2 rule).
- Q22 (cross-check, closes the gaps of 9.10). Defaults: the row id is `SC-w<NN>-d<D>` (NN is the week number with 2 digits, D is 1 to 5) or `SL-<n>`; the order of `SL` rows is `sharePhoto`, `shareVideo`, `shareConsent`, `shareLength` (n is 1 to 4). The Week cell is the week number in decimal (`1`). The Day cell is `1` to `5`. The Shots cell is `<step> <media>`, two shots joined by `; `, in the array order. A row is a line that starts with `| SC-` or `| SL-`. A header line, a separator line, and a line that does not start with `|` are not rows. A cell splits on `|` that is not preceded by a backslash; `\|` reads back as `|`; each cell is trimmed. A row with the wrong cell count (6 for `SC`, 4 for `SL`) is a problem of its id. Each problem line starts with the row id and `: `. The last line is `share captions: <rows> rows, <problems> problems`; `<rows>` counts the `SC-`/`SL-` rows read from the list (extra and repeated rows count), and `<problems>` counts the problem lines. The summary line prints at exit 0 and 1. A missing row uses the expected id.
- Q23 (cross-check API). Default: `check-share-captions.ts` exports `shareCaptionProblems(weeks: StorytimeWeek[], labels: { en: StorytimeLabels; th: StorytimeLabels }, list: string): { rows: number; problems: string[] }` with JSDoc, and runs `main` only when the file is the entry point (the pattern of `check-weeks.ts`). The tests use the function for source-side cases and the command line for exit codes.
- Q24 (a day without a share in the source). Default: `shareCaptionProblems` reports `<expected id>: the week file has no share` and does not throw. A week that does not parse (an `error` entry of `readLevelWeeks`) gives one problem line and exit 1, never a skip (A4).
- Q25 (draft folder for the text gate). Default: `~/Desktop/print-ready/storytime/share-check-v1/drafts/`, next to `teacher-book/` (D28). The orchestrator removes nothing from it.
- Q26 (reading of `PROJECT_TESTS`, F27). Default: while `M-icons` times out, a `PROJECT_TESTS` run passes when the failed tests are exactly that one test, the log shows the labeled line `Tests  1 failed`, and every other test passes. The allow-list holds one named test of the print track (A7). The exception ends when the print track raises the timeout of that test. No Phase 3b task edits that test. The log of each gate names the failed test.

### 9.6 Red 1: `storytime-loops-share.test.ts` and `__tests__/fixtures/storytime-share-sample.ts`

Base: the shipped w01 to w08, cloned in memory with `structuredClone`. Share-complete copies come from the sample file, whose hand-written moment table holds, for w01 to w07: `A: [A3 video]`, `B: [B5 video]`, `C: [C4 video]`, `D: [D4 photo, D5 video]`, `E: [D6 video]`; for w08: `A: [A2 video]`, `B: [B1 video]`, `C: [C1 video]`, `D: [D1 video]`, `E: [E3 video]`. The sample has one English caption of 12 words and one Thai placeholder for each day. A temporary folder (`fs.mkdtemp`) is used only where a file is needed; the tests remove it. The sample file is typed with plain object types, not with the new schema types (F11).

| Id | Test | Passes at Red? | Falsified when |
|---|---|---|---|
| J1 | The 8 shipped weeks parse. A copy of each shipped week with `share` deleted from every script parses, and `share` is `undefined` after the parse. | pass (characterization) | MS8 survives |
| J2 | A share-complete copy of each week parses; `toEqual` on the parsed `share` of each script (F1: the parsed value, not "parses"). | fail | MS11 or MS12 survives |
| J3 | Bounds, pairs. `shots`: 1, 2 pass; 0, 3 fail. `media`: `photo`, `video` pass; `audio`, `Photo`, and the empty string fail. `step`: `A1`, `A12`, `Z9` pass; `a3`, `A`, `1A`, `A123`, `AA1`, `A1` followed by a space, a space followed by `A3`, and the empty string fail. | fail | MS1, MS2, MS5, MS6, or MS7 survives |
| J4 | Strict objects. Each of `minutes`, `file`, `path`, `image`, `audio`, `child`, `name`, `note` added to `share` fails the parse; the same eight added to a shot fail the parse. The parsed key set of `share` is exactly `caption`, `shots`; of a shot exactly `media`, `step`. | fail | MS3 or MS4 survives |
| J5 | `caption`: `{ en: '' }` fails the parse (F19); `{ en: '   ', th: 'x' }` parses; `{ en: 'x' }` parses with `th` equal `''`; a plain string fails. | fail | MS9 or MS10 survives |
| J6 | `share-moment` passes on a share-complete copy of each week (8 copies), by id and by status `pass` (A4). | fail | MC1 to MC20 broken together make a copy fail |
| J7 | Rule 1: the share of one day removed (5 cases, one per day) reports, and the detail names that day and no other (Q14). | fail | MC1 survives |
| J8 | Rule 2: a shot `A9`; a day 1 shot `B1` (a step of a later script); a day 3 shot `B5` (a step of the day before that is not moved) each report. A day 5 shot `D6` (moved step of the day before) passes. A day 4 share with `D4` and `D5` passes (`D5` is a moved step of its own script: rule 2 holds, and `D4` gives rule 3). | fail | MC2, MC3, or MC4 survives |
| J9 | Rule 3: a day 2 share with only `B6` reports. A day 2 share with `B6` and `B5` passes. A day 5 share with only `D6` passes (moved step of the day before is in the period). | fail | MC5 or MC6 survives |
| J10 | Rule 4: two shots with the same step and different media report. Two shots with different steps and the same media pass. | fail | MC7 or MC8 survives |
| J11 | Rule 5: a shot `E5` on day 5 of a teach week reports. A shot `A1` on day 1 of a teach week passes. A shot `A1` on day 1 of w08 reports. A shot `E3` of w08 passes. | fail | MC9, MC10, or MC11 survives |
| J12 | Rule 6, words: 1 and 40 words pass; 0 (spaces only) and 41 fail; a 40-word caption with a double space, and one with a leading space and a trailing newline, pass (Q13). `caption.th` of `''` and `'   '` fail; `caption.th` of `x` passes. | fail | MC12 to MC16 survives |
| J13 | Rule 7, media: all 17 extensions fail in `caption.en` and in `caption.th`; `.MP4` fails; `x mp4` and `x.mp4 y` pass (Q16). | fail | MC17 to MC20 survives |
| J14 | Status. Every problem of J7 to J13 has the status `SHARE_CHECK_STATUS`; the constant is `warn` or `fail`; no literal `'warn'` is asserted (Q10 pattern). | fail | MC22 (found by dry run 1) |
| J15 | Scope. A Level 1 copy has no `share-moment` row (pass at Red). A Level 3 copy (`periodMinutes` 49, script ids `A` to `E`) has the row (D27). | partly pass | MC21 survives |
| J16 | Order. In the report of each shipped week the index of `share-moment` is smaller than the index of `published` (w01 has `published`). A published copy with a broken share gives `published` `pass` when the constant is `warn`, and `fail` with `share-moment fails` in the detail when the constant is `fail`. The test branches on the constant. | fail | MC23 survives |
| J17 | Minutes (AC-14.4). For each shipped week, the rows `minutes` and `loops-minutes` have equal status and detail with and without `share`. A self-test of the compare: a copy with one `loopMinutes` changed by 1 gives different rows. | pass (characterization) | the self-test shows the compare can fail |
| J18 | Guard. The SHA-256 of `w01.json` to `w08.json` is equal before and after the run, and `git status --porcelain content/storytime` is empty after the run. | pass | a test writes into `content/` |
| J19 | Content test deleter (AC-14.5, spec). `storytime-loops-content.test.ts` gets `delete script.share` in `withoutNewFields` and one falsifier: a copy with only a changed or added share passes the compare; a copy with a changed existing line next to a share fails it. | fail on the falsifier file only if the deleter is wrong | MN1 survives |

Characterization tests (J1, J15 first half, J17, J18, J19 compare) pass at Red. Each has the falsifier in the last column.

### 9.7 Green 1: gate, mutants, switch dry run 1

Changed files: `schema.ts` and `checks.ts`. Gate (one wrapper each): `GREEN_TEST_COMMAND`, `PROJECT_TESTS`, `LINT_3B`, and `PROJECT_CHECKS` (the plan line, plus the F18 rule of zero FAIL rows). Live proof: `check-weeks.ts --level 2` gives exit 0, `grep -cE "^  WARN +share-moment"` prints `8`, `grep -cE "^  FAIL"` prints `0`, and the total WARN count is 9 (8 and the known `print-missing`). Run `git checkout -- pnpm-lock.yaml` if the lock changed.

Mutants (protocol 5.6: copy, one mutant, `cmp` restore; the log has `mutants: <n>, caught: <n>`):

| Id | Mutant | Must fail |
|---|---|---|
| MS1, MS2 | `shots` max 2 to 3; min 1 to 0 | J3 |
| MS3, MS4 | `ShareSchema` or `ShareShotSchema` not strict | J4 |
| MS5 | `media` accepts `audio` | J3 |
| MS6, MS7 | step regex loses its anchors; `\d{1,2}` to `\d{1,3}` | J3 |
| MS8 | `share` is required | J1 |
| MS9, MS10 | `caption` is a string; `caption` allows an empty `en` | J5 |
| MS11, MS12 | `share` put on `StepSchema`; `shots` renamed `shot` | J2 |
| MC1 | rule 1 dropped | J7 |
| MC2 | rule 2 dropped | J8 |
| MC3 | rule 2 searches every script | J8 |
| MC4 | rule 2 reads the own script only | J8 and J6 (real D6) |
| MC5, MC6 | rule 3 dropped; own moved steps count as in the period | J9 |
| MC7, MC8 | rule 4 compares `media`; rule 4 dropped | J10 |
| MC9, MC10, MC11 | rule 5 dropped; rule 5 bans `E5` and `A1` in both kinds; rule 5 reads teach weeks only | J11 |
| MC12 | word limit 40 to 41, or 1 to 0 | J12 |
| MC13 | split on one space, not `/\s+/` | J12 |
| MC14 | no trim | J12 |
| MC15, MC16 | `caption.th` rule dropped; `caption.th` not trimmed | J12 |
| MC17, MC18 | regex without `i`; regex without one extension | J13 |
| MC19, MC20 | regex without `$`; regex on `caption.en` only | J13 |
| MC21 | the check runs on Level 1 | J15 |
| MC22 | status hard-coded `'warn'` in the check | dry run 1 (J14 red at `fail`) |
| MC23 | the check is pushed after the `published` block | J16 |

Dry run 1 (once, in Green 1). Keep a copy of `checks.ts`. Set `SHARE_CHECK_STATUS` to `'fail'` (the form of Q15). Run `PROJECT_TESTS`. Restore, and `cmp`. Write the red tests to `measure/runs/storytime_teaching_loops_20261103/share-switch-dryrun.txt` in three groups: (a) tests of this track that call `checkStorytimeWeek` on a fixture or a copy (cured by the Red 2 fixture upgrade); (b) tests that read `published` or a `fail` count of a shipped week (cured by the content task); (c) any other test (goes to the orchestrator). Two further results are required: the file `storytime-loops-share.test.ts` has 0 failures at `fail` (this catches MC22), and J16 passes in its `fail` branch. Lesson of Phase 3: dry run 1 cannot predict the fallout of a state that does not exist yet. Dry run 2 (9.8) measures that state.

Hand-off 4 (task 3). The message names the keys of J4 (`share` has `caption`, `shots`; a shot has `media`, `step`), the rule "the app shows a share moment only when `approval.loops` is approved" (D23), and the Monorepo contract answer. The message calls the shape "Phase 3b version 1, before reviews". A receipt without the PM words closes no task.

### 9.8 Red 2 (content), the content task, and dry run 2: `storytime-loops-share-content.test.ts`

Red 2 also upgrades `fixtureWeek()` and `fixtureReviewWeek()` in `__tests__/fixtures/storytime-week-fixture.ts` (a valid share on each script; the shot steps must exist in the fixture week, rules 2 and 3). `LINT_3B` covers this file (the known gap of the author). Week tests have `w0N` in the name. Tests without a week have no `w0` in the name.

| Id | Test | At Red | Falsified when |
|---|---|---|---|
| N1 | Each script of each week has `share`. Labeled count: 40 scripts with `share` (A3). Per week: 5 (w01 to w08 rows). | fail | a script without share |
| N2 | The shots equal the hand-written moment table of the sample (step and media, in order). | fail | a wrong step or media |
| N3 | `share-moment` is `pass` for each week, by id (A4). | fail | any rule 1 to 7 problem |
| N4 | Caption rules (Q20): 1 to 40 words by the test's own counter; no pipe character, no `<`, no `>`, and no line break; `caption.th` has a Thai-script character; the 40 English captions are pairwise different (labeled: `set size 40`). | fail | a copied or long caption |
| N5 | Additive compare (AC-14.5, Q21). Both sides parse with `StorytimeWeekSchema`, lose the allow-list and `scripts[].share`, then compare as `JSON.stringify` of recursively sorted keys. If `git show <SHARE_BASELINE_COMMIT>:<file>` fails, the test fails with a message and never skips (A4). | pass (characterization) | N6 |
| N6 | Falsifiers of N5, on copies. Each must fail the compare: one changed character in an existing Thai line; one deleted existing line; one changed `minutes`; two steps reordered; a `th` array reordered; one changed `recall` item; one changed `loopMinutes`. These must pass: a key reorder; a copy with only a changed or added `share`. Deleter mutants: a deleter that also removes `th` fails the Thai falsifier; a deleter that also removes `recall` fails the recall falsifier. | pass | MN1 to MN3 |
| N7 | Student book (AC-14.7). Each caption of a copy carries a unique marker token (`ZQXSHARE<n>`). `compileStorytimeStudentBook(weeks, { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' })` of w01 to w08 equals the HTML of the copy without share, and holds no marker. Non-vacuity: a copy with one changed reader page text gives different HTML. | pass (characterization) | the marker shows in the student book |
| N8 | Switch (AC-14.6): `SHARE_CHECK_STATUS` equals `'fail'`. No `w0` in the name. | fail until the switch | the constant stays `warn` |
| N9 | Fixtures: `fixtureWeek()` and `fixtureReviewWeek()` pass `share-moment` with `pass`, and each fixture script has a share. | fail | a fixture without share |
| N10 | Guard: the SHA-256 of the 8 week files is equal before and after the run. | pass | a test writes content |

Mutants of the test file (data mutants, in the test; MN1 deleter keeps `share`; MN2 deleter also drops `th`; MN3 deleter also drops `recall`). The Red log gives `mutants: 3, caught: 3` and the integer K (tests for each week) as `tests per week: <K>`.

R3 start (rule R3). The Red 2 commit holds only files under `dashboard/__tests__/` (the test, the fixture, and nothing else). In the R3 window the aggregate gate is `PROJECT_TESTS --exclude "**/storytime-loops-share-content.test.ts"`. The window of Red 2 ends when the orchestrator has told the print session, the exclude is in place, and `PROJECT_TESTS` with it passes. Evidence of the exclude (A4 and A7: a wrong pattern can hide too much): the log holds `Test Files  <F0 + 1> passed (<F0 + 1>)` where F0 is the baseline file count of 9.17 (Red 1 adds one file, and the content file is excluded), `grep -c "storytime-loops-share-content" <log>` prints `0`, and `grep -c "storytime-loops-share.test" <log>` prints `1` or more.

Content task gate (one task, one commit; the commit holds exactly the 8 files `content/storytime/l2/w01.json` to `w08.json`). All must hold:

1. `HR 'cd dashboard && CI=true npx vitest run __tests__/storytime-loops-share-content.test.ts -t "w0"'` exits 0, and the labeled summary is `Tests  <8K> passed` with 0 failed. `-t` with no match exits 0, so the integer is part of the gate (A4).
2. `check-weeks.ts --level 2`: exit 0; `grep -cE "^  PASS +share-moment"` prints `8`; `grep -cE "^  FAIL"` prints `0`; `grep -cE "^  WARN"` prints `1` (the known `print-missing`).
3. The plan fast gate prints `5` eight times, and `git show --name-only --format= <sha>` lists exactly the 8 week files.
4. `PROJECT_TESTS` with the R3 exclude exits 0 (the plan done-when does not ask for it; plan_updates P12 adds it). Reason: Phase 3 lost a day on 8 red tests that appeared only at the switch.
5. `set-phoneme-audio.ts` is not needed (no sound field changes). `git diff <parent> <sha> -- content/storytime/l2` shows added `share` blocks only: the N5 compare is the proof, and `git diff --stat` lists 8 files with insertions only (labeled: `0 deletions`).
6. English review (below) closed with no open error.

Dry run 2 (after the content commit, before the switch). Same method as dry run 1 (copy, set `'fail'`, `PROJECT_TESTS` without any exclude, restore, `cmp`). The red list must be exactly the test N8. Any other red test is a defect of the plan, and the orchestrator decides before the switch commit. The list goes to `measure/runs/storytime_teaching_loops_20261103/share-switch-dryrun-2.txt`.

English review. The reviewer is a non-Anthropic model and gets English only (spec D26). The orchestrator writes a pack `measure/runs/storytime_teaching_loops_20261103/share-english-pack.md`: the spec FR-14 moment table, the rules D19 and rule 6 and 7, and a table of 40 rows (`week`, `day`, shots, `caption.en`), taken from the week files by a script. Gate on the pack: `grep -cP '[\x{0E00}-\x{0E7F}]' <pack>` prints `0`, and `grep -c '^| w0'` prints `40`. The prompt names the pack and forbids reading `content/`. Audit of the review log: `grep -c 'content/storytime' <review log>` prints `0`. The report answers, for each of the 40 rows: names the moment (sound and word, frame sentence, book title, or song title); names no child; at most 40 words; no media file name; plain English that a parent understands (12-word sentences are not required). The report has no open error. Residual risk: a reviewer with file tools can open a week file; the log audit shows it. Review-only rules (D19) have no automated test.

### 9.9 The switch task and the end of rule R3

Preconditions: the content commit exists; dry run 2 lists only N8; `git status --porcelain content/storytime dashboard/lib/storytime/checks.ts` prints nothing; the print track has no open Red window.

The commit changes `checks.ts` only, by one line (`git show --stat --format= <sha>` prints `1 file changed, 1 insertion(+), 1 deletion(-)`). The plan edits (the R3 exclude removed from both `PROJECT_TESTS` lines) go in a separate `measure(plan)` commit by the orchestrator. Gates, with no exclude, one wrapper each:

- `GREEN_TEST_COMMAND` exits 0 with `Test Files  8 passed (8)`.
- `PROJECT_TESTS` exits 0, and its log contains `storytime-loops-share-content.test.ts` (`grep -c` prints 1 or more; A4: the file is not excluded and not silently skipped).
- `LINT_3B` exits 0. `PROJECT_CHECKS` exits 0 with `PASS share-moment` eight times, 0 FAIL rows, and 1 WARN row.
- Fast gate: `grep -c "SHARE_CHECK_STATUS: CheckStatus = 'fail'" dashboard/lib/storytime/checks.ts` prints `1`.
- The tests J14 and J16 pass at `fail` (this closes MC22 and the `published` branch of MC23). N8 passes.

R3 ends at the switch commit. Evidence: `grep '^PROJECT_TESTS=' measure/tracks/storytime_print_r1_20261025/plan.md measure/tracks/storytime_teaching_loops_20261103/plan.md | grep -c 'share-content'` prints `0`, and the print session confirms the removal in one message (peer-report). A forgotten exclude is an A7 hole: the Phase 3b closeout repeats this grep.

Print track check at each commit of the R3 window and after the switch: `check-weeks.ts --level 2` exits 0 with 0 FAIL rows (F18). The warn window gives WARN rows only, so the print `PROJECT_CHECKS` stays green. If the switch commit would give one FAIL row (a week without a valid share), the dry run of the precondition shows it first.

### 9.10 The caption cross-check (spec review F1)

Status of F1. Closed in the documents. The script path is `dashboard/scripts/storytime/check-share-captions.ts` (spec FR-14, "The caption cross-check"). The arguments are `--level <n>` and `--list <path>`, both required. The exit codes are 0 (all rows equal their sources), 1 (a row differs, is missing, is extra, or repeats), and 2 (usage error). The owning tasks are named: Red 3 tests it first (`storytime-loops-share-book.test.ts`, plan "Cross-check cases"), Green 3 writes it, and the caption list task runs it with an exit code and the last output line. Five residual gaps remain. Each has a default in 9.5 and a test below:

- G1. The plan Red lists three exit-2 cases (unknown flag, missing `--list`, missing file). Spec FR-14 also names a missing `--level`. Add: missing `--level`; `--level` without a value; `--level 9`; both arguments missing. Each exits 2.
- G2. Source-side cases (a week without share, a week that does not parse, a label that differs from the list) have no test, because the command line reads the shipped files only (F23). Q23 and Q24 add the exported function `shareCaptionProblems`. The tests X7 to X9 call it.
- G3. The row grammar and the cell formats are open in the spec (the Week cell, the Day cell, the id form, the order of `SL` rows). Q22 pins them. Without Q22 the Red author (who writes the list) and the Green author (who writes the parser) can agree on nothing.
- G4. The meaning of `<rows>` in the last line is open. Q22 pins it as the rows read.
- G5. The plan Red runs ten command-line cases. Each case costs a start of `tsx` and the schema (seconds). The default is: the command line for the exit codes only (X1 to X4), the function for every mutation (X5 to X12). This keeps the file under the time limit of the other CLI tests (25 s for each run).

| Id | Test | Falsified when |
|---|---|---|
| X1 | The command line with a list written from the shipped w01 to w08 and the 4 labels exits 0. The last stdout line matches `^share captions: 44 rows, 0 problems$` (labeled integers, A3). | MX1 or MX2 survives |
| X2 | A list with one changed Thai caption exits 1. The output has exactly one problem line, it starts with the row id, and the last line is `share captions: 44 rows, 1 problems`. The changed text is the source text plus one ASCII character (no Thai literal). | MX3 survives |
| X3 | Exit 2: an unknown flag; a missing `--list`; a missing `--level`; `--level` without a value; `--level 9`; a list path that does not exist. | MX4 survives |
| X4 | The command line on a list with one missing `SC-` row exits 1 with `43 rows, 1 problems`. | MX5 survives |
| X5 | Function: one changed English caption; one changed shot; one changed week cell; one changed day cell; one changed `SL` English; one changed `SL` Thai; one changed `SL` key. Each gives exactly one problem that starts with that row id. | MX6 survives |
| X6 | Function: one extra row (`SC-w09-d1`); one repeated row id (rows count 45, one problem); one row with the wrong cell count; a list with no rows (44 problems, 0 rows). Each problem starts with the row id. | MX7 or MX8 survives |
| X7 | Function: a source day without a share gives `<id>: the week file has no share` and no throw. | MX9 survives |
| X8 | Function: a week with a parse error gives one problem line and no skip (Q24). | MX9 survives |
| X9 | Function: a source label that differs from the list (labels passed as arguments) gives one problem of its `SL` id. | MX6 survives |
| X10 | Cell grammar: a caption that holds a pipe character is written with a backslash before the pipe in the list and equals its source; the same caption written without the backslash gives a problem. Header and separator lines are not rows (rows stays 44). | MX10 or MX11 survives |
| X11 | The two-shot cell: `D4 photo; D5 video` equals the source of day 4. The same shots in the other order give a problem. | MX12 survives |
| X12 | A cell with outer spaces equals its source (trim). A cell with an inner space changed gives a problem (exact text). | MX13 survives |

Mutants MX (Green 3 runs them with protocol 5.6 on `check-share-captions.ts`, a new file; the copy is the committed version):

| Id | Mutant |
|---|---|
| MX1 | exit 0 when the row count differs (only cells compared) |
| MX2 | `SL` rows not compared |
| MX3 | Thai cells not compared |
| MX4 | a missing `--level` returns 1 or 0, not 2 |
| MX5 | a missing row is not reported |
| MX6 | cells compared after lower-casing, or only the first cell of a pair |
| MX7 | an extra row is not reported |
| MX8 | a repeated row id is not reported |
| MX9 | a source without share is skipped |
| MX10 | the split ignores `\|` |
| MX11 | the separator or header line counts as a row |
| MX12 | the shot order is sorted before the compare |
| MX13 | the compare trims inner spaces |

Caption list task gate (9.13) repeats X1 on the real list.

### 9.11 Red 3 and Green 3: the teacher book (`storytime-loops-share-book.test.ts`)

Red 3 runs after the switch, so the shipped w01 and w08 hold their shares. The test compiles with `compileStorytimeManual([week], { lang, loops, share })`. A helper cuts the HTML at each `<div class="st-step` and finds the block of a step by the start of its `st-step-title` (`<id> · ` without `studentBookPages`, the badge code with it). The test file may split into `storytime-loops-share-captions.test.ts` for the cross-check tests of 9.10 (plan_updates P14). The tests below use the shipped Thai strings only through variables.

| Id | Test | At Red | Falsified when |
|---|---|---|---|
| T1 | Guard (AC-14.8). For w01 to w08, in `th` and `en`, with `loops` off and on, and `share` absent and `false`: the HTML of the week with the share fields equals the HTML of the week with the share fields removed, byte for byte. | pass (characterization) | MB1, MB2 |
| T2 | Icons. With `share` on, w01 holds 6 elements with `data-share-media` and w08 holds 5 (labeled integers). The block of each shot step holds exactly one such element, with the media of the shot; a block of a step that is not a shot holds none. This covers path 2 (D5) and path 3 (D6) of F20 and path 1 (A3, E3). | fail | MB3 to MB7, MB24 |
| T3 | Caption. The block of a shot step holds the caption of its day. The Thai book holds `caption.th` before `caption.en` (`indexOf`). The English manual holds `caption.en` and does not hold `caption.th`. | fail | MB10, MB11 |
| T4 | Label. A photo block holds `sharePhoto` and not `shareVideo`; a video block holds the reverse, in the language of the book. | fail | MB22 |
| T5 | Consent (A2). The consent line and the length line print once for a single-week compile, and twice for a two-week compile (w01, w02). The consent line sits in the block of the first shot of day 1. With `share` off the count is 0. | fail | MB12 to MB15 |
| T6 | Labels. The four keys exist in `en` and `th`. English: not empty, no Thai-script character. Thai: not empty, a Thai-script character. English differs from Thai. `shareConsent` matches `/consent/i` and `/group/i`; `shareLength` matches `/second/i` (Q17). | fail | MB16 |
| T7 | Escape. A copy with `<script>alert(1)</script>`, `&`, and `"` in `caption.en` (English manual) and in `caption.th` (Thai book) prints the text escaped and holds no `<script>alert(1)`. One case for each field. | fail | MB8, MB9 |
| T8 | Icon colour (D22). The inline `<svg` of each icon holds only the colours `#000` or `#000000`, `black`, `none`, or `currentColor`; no `rgb(`, no `hsl(`, and no `<img`. | fail | MB17 |
| T9 | Edge. A week without share and `share` on prints no icon and no consent line and does not throw. A week without a day 1 share prints the consent line once (Q18). | fail (the option is unknown) | MB23 |
| T10 | Differential. The visible text (tags removed, white space collapsed) of the share-on HTML, after the removal of each caption, label, consent line, and length line, equals the visible text of the share-off HTML. It holds with `loops` off and on. | fail | MB21 |
| T11 | Wiring. `make-manual-pdf.ts --help` exits 0 and names `--share`. `make-teacher-book-print.ts` with an unknown flag exits 2 and its usage names `--share` and `--loops`. By the TypeScript AST: both files contain `a === '--share'`; the `compileStorytimeManual` call passes `share`; every call of `renderChromePdf` passes an argument named `share`. | fail | MB18 to MB20 |
| T12 | The print path. `compileStorytimeManual([w01], { lang: 'th', share: true, studentBookPages })` still holds 6 icons. | fail | MB24 |
| X1 to X12 | The cross-check of 9.10. | fail | MX1 to MX13 |

Green 3. Changed files: `manual.ts`, `i18n.ts`, `make-manual-pdf.ts`, `make-teacher-book-print.ts`, and the new `check-share-captions.ts` (JSDoc on each export). The commit changes no test file (`git show --name-only --format= <sha> | grep -c '__tests__'` prints `0`). The commit message names the four label keys (`for k in sharePhoto shareVideo shareConsent shareLength; do git log -1 --format=%B <sha> | grep -c "$k"; done` prints a number of 1 or more four times). Gate: `GREEN_TEST_COMMAND` (`Test Files  9 passed (9)`, or 10 if the cross-check tests are split), `PROJECT_TESTS` with no exclude, `LINT_3B`, and `PROJECT_CHECKS` (exit 0, `PASS share-moment` eight times, 0 FAIL rows). `tsc` proves that the two `StorytimeLabels` objects hold the four keys. Run `git checkout -- pnpm-lock.yaml` if the lock changed.

Mutants MB (protocol 5.6, files `manual.ts`, `i18n.ts`, and the two scripts, one at a time):

| Id | Mutant | Must fail |
|---|---|---|
| MB1 | the `share` option is true by default | T1 |
| MB2 | the option is ignored: shares print when the data holds them | T1 |
| MB3 | share is passed to path 1 only | T2 |
| MB4 | share is not passed to `movedGroup` (D5 has no icon) | T2 |
| MB5 | the icon prints only at the first shot of a day | T2 |
| MB6 | the media attribute is always `video` | T2 |
| MB7 | the attribute `data-share-media` is also on the label | T2 |
| MB8, MB9 | the English caption is not escaped; the Thai caption is not escaped | T7 |
| MB10 | the English manual prints `caption.th` | T3 |
| MB11 | the Thai book prints `caption.en` before `caption.th` | T3 |
| MB12 | the consent line prints at every shot | T5 |
| MB13 | the consent line prints once for each day | T5 |
| MB14 | the consent line prints once for the whole compile, not for each week | T5 |
| MB15 | the consent line is missing in the Thai book | T5 |
| MB16 | one Thai label is empty | T6 |
| MB17 | the icon uses the theme colour | T8 |
| MB18 | `--share` is parsed and not passed to the compile call | T11 |
| MB19 | the second `renderChromePdf` call omits `share` | T11 |
| MB20 | `--share` is not parsed (unknown flag) | T11 |
| MB21 | `share` on changes a step minute or title | T10 |
| MB22 | a photo block holds the video label | T4 |
| MB23 | a week without share throws | T9 |
| MB24 | the `studentBookPages` branch has no icon | T2, T12 |

The log has `mutants: <n>, caught: <n>` for MB and for MX as labeled integers, and `restore cmp: ok`. A survivor is a Green defect or a Red defect; the orchestrator decides.

### 9.12 The teacher book build (evidence for AC-14.9)

The build is a proof build of the release path. It goes to `~/Desktop/print-ready/storytime/share-check-v1/teacher-book/` (D28) with the real `HOME`. The drafts go to `.../share-check-v1/drafts/` (Q25). Nothing from the build enters the repository (A10). Preconditions: Green 3 is committed; `git status --porcelain content/storytime/l2 dashboard/lib/storytime dashboard/scripts/storytime` prints nothing; the orchestrator records the build commit `git rev-parse HEAD` and the SHA-256 of the 8 week files.

1. Drafts, one wrapper, eight runs: `make-manual-pdf.ts --file ../content/storytime/l2/w0N.json --lang th --loops --share --out <drafts>/Storytime-L2-W0N-Teachers-Book-TH-draft.pdf`. Record the eight exit codes (all 0).
2. Print build, one wrapper: `make-teacher-book-print.ts --level 2 --weeks 1,2,3,4,5,6,7,8 --lang th --loops --share --version 1 --out <share-check-v1>/teacher-book --drafts <drafts>`. Exit 0. The text gate gives `0` differences (labeled in the log). A text gate difference is a defect of the draft path or of Green 3; it is no model fix without the orchestrator.
3. `PRINT_GATE` on the print file exits 0 (`All checks pass`).
4. Records, as labeled lines in the run log: `pages: <n>` (`pdfinfo`); `pdf sha256: <hex>`; `non-A4 pages: 0`; `nonzero-cmy-pages: 0` (from `gs -q -o - -sDEVICE=inkcov <pdf>`, C, M, and Y all 0 on every page); `consent line count: 8` and `length line count: 8` (the Thai label strings from `storytimeLabels('th')` with white space removed on both sides, counted in the Chrome PDF text); `caption occurrences: 47` (the 40 day captions, counted in the same way, give 47 in total because day 4 shows its caption at two shots). A count that differs sends the orchestrator to the sheets; it is not a pass.
5. Contact sheets (100 dpi, page numbers on the sheet). The orchestrator opens each page that holds a share icon (person-checked) and checks: the icon is black, the label and the caption are not clipped, the consent block sits at the first shot of day 1, and no page breaks inside a shot block. The list of icon pages goes to `share-icon-pages.txt` in the run folder.
6. The page count, the SHA-256, and the printer-quote note go to the PM session; the receipt words are in the task line (peer-report). The first build of the 8-week book has no earlier number to compare; the Phase 3 w01 numbers (25 pages with loops, 23 without) are context only.
7. A rebuild after a fix uses `--version 2` (the tool refuses an existing output). The fast gate of the plan names `*TH*_PDFX-1a.pdf`; with two versions it lists two files, so the task line names the version.

### 9.13 The caption list task and Daniel's check

Gate (all must hold, and the command runs at the commit that the header names):

1. `grep -c '^| SC-w0' <list>` prints `40`; `grep -c '^| SL-' <list>` prints `4`.
2. `cd dashboard && npx tsx scripts/storytime/check-share-captions.ts --level 2 --list ../measure/tracks/storytime_teaching_loops_20261103/share-captions-11-16.md` exits 0 and its last line is `share captions: 44 rows, 0 problems`. The task line records that line and the exit code.
3. Three mutation runs on copies of the real list in `/tmp` (AC-14.10, second sentence): one changed cell gives exit 1 and `44 rows, 1 problems`; one deleted row gives exit 1 and `43 rows, 1 problems`; one extra row gives exit 1 and `45 rows, 1 problems`.
4. `git diff --quiet <header commit> HEAD -- content/storytime/l2 dashboard/lib/storytime/i18n.ts` exits 0. `tail -1 <list> | grep -c "^Daniel's answer: ____ (date ____)$"` prints `1`.
5. `grep -c '^Share icon pages: [0-9]' <list>` prints `1`, and the list names `share-check-v1/teacher-book` (P13).
6. `grep -c '^| LP-28 |' look-points-11-16.md` prints `1`, and `grep -c 'Defaults: 28 look points' look-points-11-16.md` prints `1` (the count line was 27; A5).
7. The PM session confirms receipt (peer-report). No model reads the Thai columns.

Daniel's check (task 11). The task stays `[ ]` until his words and the date are in the plan line (A2). A model pre-check is never an approval. `tracks.md` and the plan make no "approved" or "resolved" claim before that (A6). If Daniel asks for a change, the content test stays the gate, the list gets a new version, and the cross-check runs again.

### 9.14 Scope guard for each commit (FR-13 and file scope)

For each Phase 3b commit SHA that the plan records: `for s in <shas>; do git show --name-only --format= $s | grep -cE '^dashboard/lib/storytime/print/(student-book|readers|picture-check|pictures|covers)\.ts$|^video/'; done` prints `0` each time. A range diff is not the proof (F14). The file scope of each commit:

| Commit | Allowed files |
|---|---|
| Red 1 | `dashboard/__tests__/storytime-loops-share.test.ts`, `dashboard/__tests__/fixtures/storytime-share-sample.ts`, `dashboard/__tests__/storytime-loops-content.test.ts` (the deleter and one falsifier) |
| Green 1 | `dashboard/lib/storytime/schema.ts`, `dashboard/lib/storytime/checks.ts` |
| Red 2 | `dashboard/__tests__/storytime-loops-share-content.test.ts`, `dashboard/__tests__/fixtures/storytime-week-fixture.ts` |
| Content | `content/storytime/l2/w01.json` to `w08.json` |
| Switch | `dashboard/lib/storytime/checks.ts` (1 line) |
| Red 3 | `dashboard/__tests__/storytime-loops-share-book.test.ts` (and `storytime-loops-share-captions.test.ts` if split) |
| Green 3 | `manual.ts`, `i18n.ts`, `make-manual-pdf.ts`, `make-teacher-book-print.ts`, `check-share-captions.ts` |
| Caption list | the list, `look-points-11-16.md`, `plan.md` of this track |

Never stage `video/storytime-song/scripts/render.mjs`, `dashboard/raw.json`, files of the print track, or `measure/runs/**`. Stage path by path. The Review C and acceptance roles diff paths, not ranges (section 2.4). A change to `approval.loops` in any Phase 3b commit is an error (`git show <sha> -- content/storytime/l2 | grep -c '^[-+].*"loops"'` prints `0`; Phase 4 owns that record).

### 9.15 Anti-pattern coverage, Phase 3b

| A | Defense | Falsified when |
|---|---|---|
| A2 | The consent line prints with every icon (T5, T6, Q17, Q18); the Thai captions stay with Daniel; his answer needs his words and a date; `approval.loops` is not touched (9.14); no model reads the Thai | MB12 to MB15 survive, or a commit changes `approval.loops` |
| A3 | Labeled integers: `Tests  <n> failed`, `mutants: <n>, caught: <n>`, `tests per week: <K>`, `44 rows, 0 problems`, 6 and 5 icons, 40 and 4 rows, `pages: <n>`, `consent line count: 8`, `caption occurrences: 47`; boundary pairs for every bound (J3, J12) | a check asserts "has a check" or a digit anywhere |
| A4 | The Red proof bars `No test files found`. Every parse test asserts the parsed value (J2). Checks are asserted by id and `pass` (J6, N3). The `-t "w0"` gate parses `Tests  <8K> passed`. The R3 exclude shows the file absent. N5 fails when `git show` fails. N7 and J17 prove non-vacuity. X7 and X8 bar a silent skip. The Q15 grep bars a vacuous switch gate | MS8, MN1 to MN3, MX9, or a wrong exclude survives |
| A5 | Task notes quote measured exit codes only. The stale "accepted `published` FAIL" line is corrected (F18, P11). No "all pass" without a run | a plan line claims a pass without a log |
| A6 | `tracks.md` and the plan make no "approved" claim for the Thai captions before Daniel's words | a note says "approved" with the `Daniel's answer: ____` line open |
| A7 | Rule 5 does not ban `A1` in a teach week (J11). Rule 2 is not over-broad (J8). The allow-list of N5 holds named keys only (Q21). The media test is anchored (J13). The R3 exclude names one file. Escape is tested for each field (T7) | MC3, MC10, MC19, MB8 or MB9 survives |
| A9 | The new tests load `content/storytime/l2/*.json` and `lib/`. They read no `measure/tracks/` path. The real list is checked by the task command, not by a test | a test reads a track path |
| A10 | The build PDFs, sheets, and logs stay outside the repository; the commit names the build commit. The caption list is a snapshot with a source commit in its header; the cross-check detects a later change | a build file is staged, or the list drifts without a failing run |

A1 and A8 are retired. `measure/anti-patterns.md` holds no entry from A11 up on 2026-11-07.

### 9.16 Artifact tests, live tests, intentionally red, and `phase_base_sha`

Artifact tests read committed files: N1 to N5, N7, N10, the plan fast gates, the caption list, and the sample constants. Live tests run code: J2 to J17 on copies, T1 to T12 (the renderer), X1 to X12 (the script and its function), every mutant run, `check-weeks.ts`, the build, `PRINT_GATE`, `gs` inkcov, and the cross-check on the real list. An artifact pass does not prove live behavior. Phase 3b closes only with both.

Intentionally red:

- `RED_TEST_COMMAND` is red between a Red commit and its Green commit (Red 1 to Green 1, Red 2 to the content commit and the switch, Red 3 to Green 3). No push happens in these windows; rule R1 applies.
- `PROJECT_TESTS` is red from Red 1 to Green 1 and from Red 3 to Green 3. It is green with the R3 exclude from the end of Red 2 to the switch. `GREEN_TEST_COMMAND` is red from Red 2 to the switch (it includes the excluded file); only the content task (`-t "w0"`) and the switch task run in that time.
- `check-weeks.ts --level 2` shows 8 `WARN share-moment` rows from Green 1 to the content commit and never a FAIL row. After the content commit it shows 8 PASS rows.
- N8 is red from Red 2 to the switch. No other test may be committed red.
- The full dashboard suite has 3 known failing tests (tech-debt 2026-09-30); `PROJECT_TESTS` does not include them.

`phase_base_sha`: the orchestrator runs `git rev-parse HEAD` right after the commit of this section lands and before the Red role of Phase 3b starts. This file embeds no SHA for that purpose. The role base of this strategy is `0e632495`; it is not the phase base. Commits of the print track can land between the capture and Red 1 (rule R1), so the orchestrator also records `red_base` right before each of the three Red roles and uses it as `--baseline` of the role gate.

### 9.17 Baseline of `PROJECT_TESTS` at role_base_sha

Command (one wrapper): `HR 'set -o pipefail; cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts __tests__/covers-*.test.ts __tests__/print-pdfx.test.ts'`. Raw output: `measure/runs/storytime_teaching_loops_20261103/strategy-p3b-0e632495-baseline.txt`. HEAD was `0e632495e8e90494e94fbb85698062f9af1f19a7` before and after the run. `git status --porcelain` for `dashboard/` and `content/` listed only the untracked `dashboard/raw.json`. `pnpm-lock.yaml` did not change.

Measured on 2026-11-07:

- Exit code 1. `Test Files  6 failed | 52 passed (58)`. `Tests  7 failed | 1223 passed (1230)`. Duration 848.29 s in vitest.
- The 7 failed tests are all in files of the print track: `storytime-print-a48-part2.test.ts` (F5-page), `storytime-print-a48-step2.test.ts` (F1-geometry), `storytime-print-binding-practice.test.ts` (the 8-week book to 136 pages), `storytime-print-d4-prompt.test.ts` (2 tests), `storytime-print-step-system.test.ts` (M-icons), and `storytime-print-student-book.test.ts` (R38). The causes in the log are `Test timed out in 5000ms` (5 tests) and `browserType.launch: Timeout 15000ms exceeded` (2 tests). The machine ran other jobs at the time.
- Rerun of these 6 files alone (log `strategy-p3b-0e632495-baseline-rerun.txt`): exit 1, `Test Files  1 failed | 5 passed (6)`, `Tests  1 failed | 209 passed (210)`. The one failed test is `M-icons` (`Test timed out in 5000ms`). The other 6 failures were load effects. F27 and Q26 follow from this.
- The files of this track pass. The six `storytime-loops-*` files give 198 tests: schema 27, checks 38, content 103, audio 14, manual 10, teacher-book 6. `storytime-week.test.ts` gives 44, `storytime-manual.test.ts` 27, and `storytime-phonics.test.ts` 7.
- The baseline numbers for Phase 3b are F0 = 58 files and 1230 tests, with the one named exception of Q26. Expected counts: after Green 1, 59 files; after Green 3, 60 files (61 if the cross-check tests are split). The R3 window shows F0 + 1 files in the log (9.8).
- The plan quotes 36 files and 872 tests (2026-11-04). The numbers above replace them. The older section 8 numbers (25 files, 617 tests) are history.
- `check-weeks.ts --level 2` at the role base: exit 0, 0 FAIL rows, 1 WARN row (`print-missing` of st2/8); log `strategy-p3b-0e632495-check-weeks.txt`.

## 10. plan_updates for Phase 3b (recommended; the orchestrator decides)

- P10. Phase 3b: add the decisions Q13 to Q26 (9.5) before Red 1. Q15 (the one-line form of `SHARE_CHECK_STATUS`) and Q22 (the row grammar of the caption list) matter most. Without Q22 the Red author who writes the list and the Green author who writes the parser cannot agree (F1 gap G3).
- P11. Phase 3b gates: replace the `PROJECT_CHECKS` tolerance "one accepted FAIL (`published` of st2/1)" by "`check-weeks.ts --level 2` exits 0 with 0 FAIL rows, then `tsc --noEmit`". The `published` FAIL of st2/1 ended on 2026-11-04 (F18), and the print track gate accepts no FAIL row. Add `LINT_3B` (the shorthand at the top of section 9) as the `PROJECT_LINT` of every Phase 3b Red and Green; it adds `__tests__/fixtures/storytime-share-sample.ts` and `storytime-week-fixture.ts` (spec review F2 and the author's known gap), and the older sample fixture.
- P12. Content task. Add to its done-when: the labeled summary `Tests  <8K> passed` of the `-t "w0"` run (K is in the Red 2 log); `PROJECT_TESTS` with the R3 exclude exits 0; dry run 2 lists only N8; the English pack passes its two `grep` gates and the review log has no `content/storytime` read; the commit holds exactly the 8 week files with insertions only.
- P13. Caption list task. Add to its done-when: three mutation runs on copies of the real list (exit 1 and the counts of 9.13 item 3); the labeled line `Share icon pages: <n>, ...`; the header commit check (`git diff --quiet`); the `Defaults: 28 look points` change in `look-points-11-16.md`; the single `Daniel's answer: ____ (date ____)` last line.
- P14. Red (teacher book). Add the exit-2 cases of G1 (missing `--level`, `--level` without a value, `--level 9`, both missing). Add the exported function `shareCaptionProblems` (Q23) and the source-side cases X7 to X9. Use the command line for the exit codes only (G5). The Red author may split the cross-check tests into `storytime-loops-share-captions.test.ts`; the glob covers the name, and the expected Red 3 summary changes to `2 failed`.
- P15. Green 1. Add to its done-when: the Q15 `grep` gate; `LINT_3B`; the three-group `share-switch-dryrun.txt`; the two dry run 1 results (0 failures of `storytime-loops-share.test.ts` at `fail`; J16 passes in its `fail` branch); the mutant tables MS and MC with `mutants: <n>, caught: <n>`.
- P16. Red 2 (content). Add: `SHARE_BASELINE_COMMIT` is the last week-file commit at Red 2 (Q21; `95043edc` today); the allow-list of the compare equals the keys of `withoutNewFields` plus `scripts[].share` and nothing else; the log gives `tests per week: <K>` and `mutants: 3, caught: 3`; the fixture upgrade is in the commit and `LINT_3B` covers it.
- P17. Switch task. Add: the precondition (dry run 2 lists only N8); the commit changes `checks.ts` by one line; the plan edits for the R3 end go in a separate `measure(plan)` commit; the evidence is the `grep '^PROJECT_TESTS='` count of 0 in both plans and the print session's message.
- P18. Teacher book build task. Replace "Use the build path of the Phase 2 Green 2 task" by the recipe of 9.12: eight drafts with `--loops --share` into `share-check-v1/drafts`, one `make-teacher-book-print.ts --weeks 1,2,3,4,5,6,7,8 --version 1` build, and the labeled records (`pages`, `pdf sha256`, `nonzero-cmy-pages: 0`, `consent line count: 8`, `caption occurrences: 47`). The fast gate names the version (`*-v1_PDFX-1a.pdf`).
- P19. Rule R3. Add one sentence: the globs of `RED_TEST_COMMAND` and `GREEN_TEST_COMMAND` (`storytime-loops-*`) include the excluded file. In the R3 window these two commands are red by design, and only the content task (`-t "w0"`) and the switch task run in that time. Add the evidence of the exclude (9.8: the file count, and `grep -c` of 0 and 1 or more).
- P20. Review input. Add a sentence to the review tasks of Phase 3b: the independent reviewer and the adversarial role get the English pack only (9.8), and the audit of their log shows no read of `content/storytime`. Spec D26 and the plan rule "Thai" already say the Thai goes to Daniel only.
- P21. FR-13 and file scope. Add the loop of 9.14 to the Phase 3b closeout task, with the file-scope table, and the `approval.loops` guard (`grep -c` of 0 per commit).
- P22. Spec edit (optional, one sentence in FR-14 "The caption list"): the Week cell is the week number in decimal and the Day cell is 1 to 5; the `SL` row order is `sharePhoto`, `shareVideo`, `shareConsent`, `shareLength`; `<rows>` in the last line counts the rows read. This turns the defaults of Q22 into the spec text. The spec review F3 nit (word counter) is already closed by the counter text in rule 6; F4 (stale Monorepo pin text) needs no work.
- P23. Strategy refresh. If the owner changes D16, D17, or D20 before Red, the moment table of the sample file (9.6), the shot assertions (N2), the icon counts (6 and 5), and the consent pattern (Q17) change. The Red author states the change in the Red log.

- P24. Gates. Add Q26 to the plan Gate commands as a note: `PROJECT_TESTS` has one known red test of the print track (`M-icons`, a 5000 ms timeout), measured twice on 2026-11-07 (9.17). The orchestrator asks the print session to raise the timeout of that test. Until then, every Phase 3b line that says `PROJECT_TESTS` passes reads as Q26.
