# Test Strategy: storytime_teaching_loops_20261103

Written 2026-11-02 by the strategy role at 50070153 (role base `5007015369609dd4bef5425c8f049633ce529772`). Phase 1 has full detail. Phases 2 to 4 have an outline. The strategy role refreshes each outline before its phase starts.

## 1. Sources and measured facts

Inputs: `spec.md` (rounds 1 and 2 of the spec review passed), `plan.md`, and `measure/anti-patterns.md` (A1 to A10). Also `measure/lessons-learned.md`, `measure/tech-debt.md`, and the print track strategy `storytime_print_r1_20261025/test-strategy.md`. The last input is the code that the plan names.

Facts measured on 2026-11-02 at 50070153. Code facts come from the working tree, which equals HEAD for `dashboard/lib/storytime`, `dashboard/scripts/storytime`, `dashboard/__tests__`, and `content/storytime/l2` (`git log cc7808c5..HEAD` lists no commit for these paths).

- F1. The step, script, book, and approvals schemas are plain `z.object` (`schema.ts` lines 157, 251, 272, 501). Zod strips unknown keys. A test that only asserts "parses" passes before Green, because the new keys vanish (A4; print strategy F9). Every "parses" test must assert the parsed value.
- F2. The `published` check (`checks.ts` lines 320 to 326) lists `Object.entries(w.approval)` and skips only `print`. A default draft `loops` part goes into the list. The check also counts every check with status `fail`, and it runs after all other checks. The six loop checks must be pushed before it. After the Phase 3 switch, a loop `fail` then also fails `published`.
- F3. No existing test counts the warnings or the checks of a shipped week. Measured by `grep` over the five test files that call `checkStorytimeWeek`. Nine tests read the `warn` status of a named check in `storytime-week.test.ts`: `thai`, `moved`, `tricky`, `song-sheet`, `song-pictures`, `decodable`, `check`, `opening-pa`, and `home`. Their ids differ from the six new ids, so six new `warn` checks change none of them. One test reads a count from the `thai` detail by regex (`storytime-week.test.ts` line 220) and compares two differences. It stays valid only if Green does not add the new BiText lines to the `bi` list of the `thai` check (decision Q9).
- F4. Four tests assert zero `fail` checks on a loop-incomplete week. They are in `storytime-week.test.ts`: line 64 (fixture week), line 209 (a review week copy, exact list `block`, `benchmark`), line 264 (a published copy must give `published` pass), and line 342 (review fixture). They pass at `warn`. All four go red at the Phase 3 switch. The reason is that `fixtureWeek()` and `fixtureReviewWeek()` (`__tests__/fixtures/storytime-week-fixture.ts`) have no routines. The switch task says "Change no test file", so it cannot pass as written (plan_updates P4). Level 1 tests (line 108) are safe: Level 1 skips the checks. Tests that read the `published` detail of the shipped w01 (`storytime-print-adversarial.test.ts` line 255, `storytime-print-contract-v2.test.ts` lines 285 to 289) also go red at the switch until the w01 content lands.
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
- L2. A w02 copy with each new field set to a valid value parses. The test asserts the parsed value with `toEqual` (F1): `blendDrill`, `soundLoop`, `sightWords`, `loopMinutes` on a step, `questions` on the read-along, `recall` on a script, `approval.loops` approved with `words` and `date`.
- L3. Bounds, one pair per bound (pass at the edge, fail past it). `blendDrill.words`: 3, 5 pass; 2, 6 fail. `repeats`: 2, 5 pass; 1, 6 fail. `sounds`: 2, 4 pass; 1, 5 fail. `sightWords.words`: 1, 3 pass; 0, 4 fail. `seconds`: 2, 5 pass; 1, 6 fail. `loopMinutes`: 0, 20 pass; 21 fails. `questions`: exactly 3; 2 and 4 fail; a `kind` twice fails; a kind outside `who`, `what`, `where` fails.
- L4. Unknown keys fail in each new object (Q3), and a misspelled key fails (`correcton`).
- L5. `answer.page` 0 parses (Q2). It is the check that fails it (Red 2).
- L6. `recall.items` has no length rule in the schema: 4 and 6 items parse. The items are `StripCardSchema` cards: a card kind outside the four fails.
- L7. Approval guards (characterization at Red). `STORYTIME_APPROVAL_PARTS` equals the exact array `['text','thai','images','audio','song','scripts']`. An approved app part with only `status` and `date` parses to an equal object, and with `status` only parses, as at the baseline (guards a refine added to the app part by mistake). `loops` is not a key of `STORYTIME_APPROVAL_PARTS`.
- L8. Refine cases of `StorytimeLoopsApprovalSchema`. These fail: approved without `words`; approved without `date`; approved with `date` `''`; approved with `words` of spaces; an unknown key in the part. These parse: approved with both, to an equal object; draft without both. (The cases that fail to parse, and the default of L1, are red at Red.)
- L9. `published` guards. The shipped w01 gives status `fail` and the detail exactly `images not approved; audio not approved; song not approved`. A w01 copy with six approved app parts, `meta.status` `published`, and a draft `loops` part gives `published` pass. A copy with an explicit draft `loops` part gives the same detail as the shipped w01. A copy with a draft `images` part still reports `images not approved` (the exclusion is not over-broad; A7). These pass at Red, because the stripped key changes nothing. They are characterization tests. Mutant S17 and S18 give them their falsification.
- L10. Names contract for Hand-off 1: the key set of each new object equals the spec list, exactly: `{words, model, lead, test, repeats, correction}`, `{word, sounds, audio}` for a drill word, `{correct, practise, retest}`, `{words, slide, check, seconds}`, `{kind, ask, answer}`, `{page, word}`, `{items, ask}`. The test parses a full valid value with `.strict()` objects and compares `Object.keys`.

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

Base and builder. The test builds a loop-complete copy of each teach week w01 to w07 from a sample builder. It loads the shipped week as the base, and it first removes the FR-1 fields, so that the base is the same before and after Phase 3. The builder writes routines from a hand-written table of drill words and recall items for w01 and w02. It derives them for w03 to w07. The test holds a known answer for w01 and w02, hand-written and checked against the shipped scripts. So the builder cannot agree with the checker by copying it (A3). All data comes from a shared constant file `__tests__/fixtures/storytime-loops-sample.ts` (plan_updates P2). The copy passes each of the six checks with status `pass`. The test asserts six distinct ids and six `pass` values, not only "no failure" (A4).

Checks, with the falsification condition of each (mutant ids from 5.8):

| Id | Test | Falsified when |
|---|---|---|
| B1 | `loops-blend`: a teach week without `blendDrill` on A4 reports; a drill on A3 does not count | C1 survives |
| B2 | an untaught sound reports; a taught sound passes; a taught `a` with the drill label `/a/` passes (alias) | C2 or C3 survives |
| B3 | a w01 drill with oral-base sounds from `opening.pa` passes (Q1) | C2 survives |
| B4 | `loops-sound`: A1, A2, A3 each need `soundLoop`; remove one at a time (3 cases) | C7 survives |
| B5 | `loops-sight`: A6 and D2 both needed (2 cases); words in another order report; a week without tricky words that has `sightWords` reports; a week without tricky words and without `sightWords` passes | C4, C5, or C6 survives |
| B6 | `loops-questions`: order `what`, `who`, `where` reports; page 0 and page length+1 report; page 1 and page length pass (boundary pair); `answer.word` only on another page reports; "cat" against a page with "catch" reports (Q7) | C8 to C12 survives |
| B7 | `loops-recall`: 4 and 6 items report; 5 pass; a repeated item in one day reports; the same item on two days passes; an item of a later week reports; an item with `week` equal to the file week passes | C13, C15, or C20 survives |
| B8 | recall by kind, one pass and one fail each (spec FR-6): `sound` and `tricky` against `taughtTo` (a grapheme of week 1 used in a week 2 recall passes); `frame` (current or earlier `focus.frame` passes; a later week's frame fails); `word` (a word in the English step text of an earlier day of the same week passes; a word only on a later day fails; a word on the same day fails; a word only on a reader page fails; a word only in a `th` line fails; a word only in `prep` fails; a word in the text of an earlier week passes) | C16 to C19 survives |
| B9 | day 1 of week 1 without a recall passes; day 2 of week 1 without a recall fails; day 1 of week 2 without a recall fails; a recall present on day 1 of week 1 is checked (Q5) | C14 survives |
| B10 | `loops-minutes`: a Level 2 copy with the day sums 30 passes; sums 29 and 31 fail; a Level 3 copy (`meta.level` 3, `periodMinutes` 49) with sum 49 passes, with sum 30 or 48 fails; a moved step does not count; the opening counts; a `loopMinutes` on B2 that differs from `minutes` fails; `loopMinutes` equal to `minutes` on B2 passes; a loop step with 1 minute fails, with 2 passes | C21 to C26 survives |
| B11 | scope: a Level 1 copy has no `loops-*` id; a review week (w08) has exactly `loops-recall` and `loops-minutes` (set equality); a w08 copy with `soundLoop` on A1 does not add `loops-sound` | C27 or C28 survives |
| B12 | status: each problem has the status `LOOP_CHECK_STATUS`; the constant is `warn` or `fail` (Q10); a w01 copy with the FR-1 fields removed shows the six checks with a non-pass status and a detail text | the Phase 3 switch (C29) |
| B13 | the existing `minutes` check still passes on `minutes` for a copy that has `loopMinutes` (FR-7) | the `minutes` check reads `loopMinutes` |
| B14 | the shipped weeks w01 to w08 with the FR-1 fields removed (rule 11.3): the loop checks run, and each problem has the status `LOOP_CHECK_STATUS`. The test reads the stripped copy, so Phase 3 content does not break it | the check does not run on a shipped week |
| B15 | the check with `taught` and `others` missing keeps the count rule and prints the skipped parts in the label (Q4) | a skipped part reports pass |

Existing-test effect (F3, F4): the six new `warn` checks change no existing test result in Phase 1 and 2. The Green 2 task reads `storytime-week.test.ts` and `storytime-phonics.test.ts` first, and it reports any change.

The code mutants of Red 2 run by the Green role (5.6), not inside the test file. The plan text about a temporary copy of `checks.ts` is replaced by this protocol.

### 5.8 Green 2: gate and mutants

Changed files: `checks.ts` (six checks, `LOOP_CHECK_STATUS`, pushed before the `published` block), `check-weeks.ts` (format only; it needs no code if the checks run through `checkStorytimeWeek`). Gate: as 5.5. Live proof: `npx tsx scripts/storytime/check-weeks.ts --level 2` in `dashboard/`. The output holds the six `loops-*` ids as `warn` for each teach week w01 to w07, two ids for w08, and exactly one FAIL line (`published` of st2/1, detail unchanged).

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

- Closeout of Phase 1: `role-gate --role jr-green` PASS (with `--baseline red_base` of the last Red cycle), Review A, B, C JSON `pass` on one HEAD, adversarial `pass` with `PROJECT_TESTS`, phase acceptance on an immutable HEAD. The mutant tables 5.5, 5.8, and 5.9 are complete with every mutant caught, except C29 and C30, which the Phase 3 switch closes.
- Dry run for the switch (feeds Phase 3): once, in Phase 1 Green 2, set `LOOP_CHECK_STATUS` to `'fail'` in the tree with a backup, run `PROJECT_TESTS`, restore with `cmp`, and write the list of red tests to `measure/runs/storytime_teaching_loops_20261103/switch-dryrun.txt`. The list must hold the four fixture tests of F4. It may also hold the tests that read the `published` detail of the shipped w01, which the w01 content cures. Any other test in the list goes to the orchestrator.
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

1. Pinned layer: for w01 and w02, four hashes each (F10), measured with the pre-Green code at the Red start. `git log cc7808c5..HEAD -- lib/storytime/manual.ts lib/storytime/i18n.ts content/storytime/l2/w01.json w02.json` must be empty at that time. If it is not empty (the print track changed a file), the Red author pins the hashes at the Red-time HEAD and writes the reason in the test.
2. Differential layer: for a loop-complete copy, `render(copy, loops off)` equals `render(copy with the FR-1 fields removed, no option)`. This holds when the print track changes the base, and when Phase 3 adds fields to the shipped weeks. It also catches a renderer that prints routines because the data holds them, not because the option is true.

Mutants: P2-1 the default of `loops` is true; P2-2 the heading prints when the option is off; P2-3 one extra space in a template string of `renderStep`; P2-4 the routines print when the week holds fields (option ignored); P2-5 one field is not escaped (parameterized, one field per case: model, lead, test, correction, drill word, slide, check, ask.en, ask.th, recall text); P2-6 `loopMinutes || minutes` (a `loopMinutes` of 0 must print 0); P2-7 the recall prints at the end of the day, not in the opening; P2-8 the Thai heading equals the English text (a Thai label must hold a Thai character); P2-9 `--loops` is parsed but not passed to `compileStorytimeManual`; P2-10 an unknown flag exits 0.

Other tests: order inside each step (FR-2 to FR-6 order, by `indexOf` inside the day section); a routine without `th` prints the English line only and does not throw; the labels exist in `StorytimeLabels` for both languages; the `--help` text names `--loops`. The CLI tests parse the source with the TypeScript AST, as `storytime-print-teacher-book.test.ts` does, and they run `--help`. They do not run Chrome in vitest. The live proof is the build.

Live proof (Green 2): Chrome and Ghostscript run only inside one heavy-run wrapper. `make-teacher-book-print.ts` cannot be the proof path as written (F9): its text gate compares with a draft without loops and exits 1. Default (plan_updates P6): build the loops draft with `make-manual-pdf.ts --loops`, then run `make-teacher-book-print.ts --loops --drafts <the loops draft folder>` with a temporary `HOME` that holds the ICC cache. The gate then compares the loops build with the loops draft, and the base build without `--loops` keeps the old behavior. A test also covers the other path: `--loops` with the old draft exits 1 and lists the loop lines as differences.

Shared files with the print track: `manual.ts`, `i18n.ts`, and `make-teacher-book-print.ts`. Green waits for the print week 1 proof commit (2026-11-05). Review C diffs path-scoped (2.4).

Anti-patterns: A3 (exact hashes, labeled page count), A4 (the differential layer is not vacuous: the Red copy must hold at least one field of each of the five kinds), A7 (an escape rule per field, not one global replace), A10 (the contact sheets and the page count are not committed; the run folder keeps them, and the PM message names the commit they came from).

### 6.2 Phase 3

Content test (Red). Reads each shipped week and the baseline blob `git show cc7808c541ca1cac810a7cd74f34520f748aef5b:content/storytime/l2/wNN.json`.

- Normalized compare (spec F7). Parse both files with `StorytimeWeekSchema`. Delete from the shipped side exactly: `scripts[].steps[].{blendDrill,soundLoop,sightWords,loopMinutes}`, `books[].questions`, `scripts[].recall`, `approval.loops`, and the two keys of the print track (`print`, `approval.print`). Each key of the second group is an allow-list entry with a named owner track. Normalize with recursively sorted keys and array order kept. Compare the `JSON.stringify` output. If `git show` fails, the test fails with a message (it never skips; A4).
- Falsifiers (copies): change one character of an existing Thai line; delete one existing line; change `minutes` of one step; reorder two steps; change a `th` array order. Each must fail. A key reorder alone must pass (the normalizer sorts keys). The deleter removes the FR-1 set only: a mutant deleter that also removes `th` must fail the Thai-change falsifier.
- The print track will change `w01.json` (Phase 6, `approval.print`) and `w02.json` to `w07.json` (Phase 7, `print` blocks) after cc7808c5. The allow-list covers only those two keys. Any other drift fails.
- `approval.loops`: the test accepts draft, or approved with `words` and `date` (the refine). It does not assert the literal `draft`, because Phase 4 sets `approved` (plan_updates P5). The proof that the approved record is Daniel's is Review B and the Phase 4 check.
- Content rules: six checks `pass` for w01 to w07; two for w08; each new BiText has non-empty `th`; each drill sound has a bank recording; each day sums to `periodMinutes` with `loopMinutes ?? minutes`; only the seven loop step ids differ; the repeated lines (`lead`, `test`, `slide`, `check`) have 12 words or less (a 13-word line fails; "don't" is one word; punctuation is not a word).
- Day A is the only day that can move minutes (F7). The Red test pins the C5 and D2 minutes to their baseline values, so a content author cannot hide a missing minute budget.
- Each content task is `[x]` only with: its part of the content test, `PROJECT_CHECKS`, `set-phoneme-audio.ts` run (D5), and one independent report-only review of a non-Anthropic family with no open error. The review checks the new lines against the spec and the existing style rules (pure sounds, short sentences). Lessons-learned 2026-10-22 shows 6 to 10 defects per week after the gate passed.

Switch task (set `LOOP_CHECK_STATUS` to `'fail'`): predicted fallout is the four tests of F4 (dry run in 5.10). Plan_updates P4 moves the fixture upgrade into the Phase 3 Red commit, so the switch needs no test edit. Closing proofs: a broken copy of each teach week reports `fail` for each of the six checks (this closes mutant C29); a published copy with a broken routine gives `published` `fail` with `loops-... fails` in the detail (closes C30); `check-weeks.ts --level 2` shows exactly one FAIL (`published` of st2/1); `PROJECT_TESTS` runs with no exclude (rule R2).

Mutants: P3-1 one existing `en` line edited; P3-2 one Thai line edited; P3-3 a week's `periodMinutes` sum off by one; P3-4 a drill word with an unbanked sound; P3-5 `approval.loops` approved without `words`; P3-6 a `loopMinutes` on B2; P3-7 `LOOP_CHECK_STATUS` left at `warn`; P3-8 a recall item from a later week.

Anti-patterns: A2 (Daniel's checked text stays draft), A3 (exact minute sums, labeled mutant counts), A4 (the normalizer must be shown to fail on a real change), A5 (no "clean" claim in the plan without a run), A7 (the allow-list is exactly two keys).

### 6.3 Phase 4

No code. The checks: (1) the record commit changes only `approval.loops` in the eight files (normalized compare against the Phase 3 end commit with `approval.loops` removed); (2) each approved record holds Daniel's words and the date exactly as the Phase 3 task line holds them (Review B compares the strings); (3) the refine rejects a record without `words` or `date` (the Phase 1 tests stay green); (4) `PROJECT_CHECKS` passes; (5) the Hand-off 2 message names the commit and the pin rule; (6) memory files have 50 lines or less. Mutants: a record with the words of another source; a record for 7 weeks only; `meta.status` changed by the record commit. Anti-patterns: A2 (consent words), A5 and A6 (the report and `tracks.md` say "approved" only after Daniel's words exist), A3 (labeled counts: 8 approved records).

Hand-offs 1 to 3 and the report are peer-report evidence: a sent message without a PM reply closes no task.

## 7. plan_updates (recommended; the orchestrator decides)

- P1. Add rule R1 and R2 (section 2) to the plan "Rules for every task", with the print Phase 5 Green as the start condition of the Phase 1 Red.
- P2. Phase 1 Red 2: replace "the test copies `checks.ts` to a temporary folder" with the mutant protocol of 5.6. Allow the Red commit to hold the shared sample constant file `__tests__/fixtures/storytime-loops-sample.ts` (test support). The line "the commit holds only the test file" becomes "only files under `__tests__/`".
- P3. Phase 1: add the decisions Q1 to Q12 (5.2) to the plan before Red, especially Q1 (the `loops-blend` taught set conflicts with the shipped A4, F6).
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
