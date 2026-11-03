# Pilot report: full dashboard test baseline

- Base SHA: `cc7808c541ca1cac810a7cd74f34520f748aef5b`
- Branch: `pilot/cloud-wb-full-dashboard-tests` (already existed locally and on origin at the base SHA)
- Date: 2026-11-03 (UTC)
- Environment: cloud container, Node v22.23.4, npm 10.9.9, Google Chrome for Testing 153.0.8010.12, shallow git clone
- Scope: check and report only. No file changed except this one. No secret, no `.env`, no paid generation. No network calls except package installs.

## Commands and exit codes

| # | Command | Exit | Note |
|---|---|---|---|
| 1 | `git fetch origin cc7808c541ca1cac810a7cd74f34520f748aef5b` | 0 | |
| 2 | `git checkout -b pilot/cloud-wb-full-dashboard-tests cc7808c5…` | 128 | The branch already existed. |
| 3 | `git checkout pilot/cloud-wb-full-dashboard-tests` | 0 | HEAD = base SHA. Up to date with origin. |
| 4 | `cd dashboard && npm ci` | 0 | |
| 5 | `npx playwright install --with-deps chrome` | 0 | Installed the OS dependencies. Chrome was already present; Playwright printed its "already installed, use --force" notice. |
| 6 | `sudo apt-get install -y ghostscript poppler-utils` | 0 | `gs` and `pdftotext` are now on PATH. |
| 7 | `cd dashboard && CI=true npx vitest run --reporter=verbose` (plus `--reporter=json --outputFile.json=<scratch>` in the same run, for durations) | 1 | Took 47.90 s. |
| 8 | `CI=true npx vitest run --reporter=verbose __tests__/constants.test.ts` | 1 | Rerun alone |
| 9 | `CI=true npx vitest run --reporter=verbose __tests__/origins-thai-support.test.ts` | 1 | Rerun alone |
| 10 | `CI=true npx vitest run --reporter=verbose __tests__/storytime-print-contract-r3.test.ts` | 1 | Rerun alone |
| 11 | `CI=true npx vitest run --reporter=verbose __tests__/storytime-print-covers-16books-adversarial.test.ts` | 1 | Rerun alone |
| 12 | `CI=true npx vitest run --reporter=verbose __tests__/storytime-print-covers-16books.test.ts` | 1 | Rerun alone |
| 13 | `CI=true npx vitest run --reporter=verbose __tests__/storytime-print-student-book.test.ts` | 1 | Rerun alone |
| 14 | `CI=true npx vitest run --reporter=verbose __tests__/text-profile-graph.test.ts` | 1 | Rerun alone |
| 15 | `npx tsx --tsconfig tsconfig.json <scratch>/probe.ts` | 0 | Read-only diagnosis. The script was outside the repo. It ran `WorkbookLessonSchema` on the Origins lessons and printed `PRIMARY_LEVELS`. |

## Counts (full run, command 7)

| | Passed | Failed | Skipped | Total |
|---|---|---|---|---|
| Test files | 83 | 7 | 1 | 91 |
| Tests | 1363 | 50 | 7 | 1420 |

- Skipped file: `__tests__/inject-integration.test.ts` (6 tests). It is `describe.skipIf(!fs.existsSync(MIGRATIONS))`, so it needs the legacy Postgres migrations, which are not in this container.
- One more skipped test: `__tests__/storytime-phonics.test.ts` "gives every tricky node its decodable_from_week". It is `skipIf(!realJson)`, so it needs the sibling repo `mastery-advantage`.

### Failing files

| File | Failed | Passed | Rerun alone | Flaky? |
|---|---|---|---|---|
| `__tests__/constants.test.ts` | 1 | 3 | 1 failed, 3 passed | no |
| `__tests__/origins-thai-support.test.ts` | 2 | 0 | 2 failed | no |
| `__tests__/storytime-print-contract-r3.test.ts` | 1 | 41 | 1 failed, 41 passed | no |
| `__tests__/storytime-print-covers-16books-adversarial.test.ts` | 12 | 4 | 12 failed, 4 passed | no |
| `__tests__/storytime-print-covers-16books.test.ts` | 23 | 23 | 23 failed, 23 passed | no |
| `__tests__/storytime-print-student-book.test.ts` | 11 | 66 | 11 failed, 66 passed | no |
| `__tests__/text-profile-graph.test.ts` | 0 (crashed while collecting) | 0 | crashed again, no tests | no |

No file is flaky. Every failure happened again when the file ran alone.

## Each failure and its first error line

### constants.test.ts
- `:10` includes Adventures 1.0 as a primary workbook option. `AssertionError: expected [ { value: '1', …(3) }, …(31) ] to deep equally contain { value: '1.0', …(3) }`

### origins-thai-support.test.ts
- `:26` validates bilingual vocabulary fields for primary/origins-2-a0. `AssertionError: primary/origins-2-a0/01-Pip the Curious Puppy Feels _workbook.json should satisfy WorkbookLessonSchema: expected false to be true`
- `:26` validates bilingual vocabulary fields for primary/origins-3.1-a0. `AssertionError: primary/origins-3.1-a0/01-My New City Plane Trip _workbook.json should satisfy WorkbookLessonSchema: expected false to be true`

### storytime-print-contract-r3.test.ts
- `:261` R4b-4 keeps the week 1 to 7 rows byte-equal to the version 3 list at c7739efb. `Error: Command failed: git show c7739efbb3cf118f23c1607d3fa645471c6b6077:content/storytime/l2/print/pictures.json` (`fatal: path ... exists on disk, but not in 'c7739efb…'`, shallow clone)

### storytime-print-covers-16books-adversarial.test.ts
Line 169, 208, 225 or 311: `AssertionError: The shipped phonics graph must be readable (rule 11.3).: expected undefined to be defined`
- Phase 1 ADV-D12: approved-only values keep the week 1 story but lose every draft-week title (`:169`)
- Phase 1 ADV-TITLE: a reader title with an ASCII semicolon … (`:208`)
- Phase 1 ADV-TITLE: a reader title with a full-width semicolon builds … (`:225`)
- Phase 1 ADV-D12: the mock values strictly extend the approved values … (`:311`)

Line 63: `AssertionError: Run CLI cases only through heavy-run.sh.: expected false to be true`
- Phase 1 ADV-CLI: a bad level, a bad unit, and an unknown option exit 2 before any write
- Phase 2 ADV-P2-D12: with week 1 back to draft and weeks 2 to 8 approved …
- Phase 2 ADV-P2-GATE: PRINT_GATE fails a Chrome-like PDF …
- Phase 2 round 2 ADV-P2-GUARD: a --print build with an explicit --out inside the proof folder …

Line 493: `AssertionError: Precondition: the cached profile /root/.cache/workbooks-print/JapanColor2001Coated.icc exists.: expected false to be true`
- Phase 2 ADV-P2-OUT: a version 3 --print build without --out leaves the approved proof-v3 mock folder unchanged
- Phase 2 round 2 ADV-P2-DEFAULT: a version 3 --print build without --out exits 0 …
- Phase 2 round 2 ADV-P2-DEFAULT: a version 4 --print build without --out writes print-v4/l2u1 …

Line 407: `TypeError: Cannot read properties of undefined (reading 'graphemes')`
- Phase 2 ADV-P2-D12: with only week 3 back to draft, the printed back page carries no word that only week 3 supplies

### storytime-print-covers-16books.test.ts
Line 445: `AssertionError: The shipped phonics graph must be readable (rule 11.3).: expected undefined to be defined`
- R20.2, R20.1 and R20.3 to R20.6, R21, R23, R27, R28, R28 mutation, R24, R25, R26 (11 tests)

Line 267: `AssertionError: Run Chrome and Ghostscript only through heavy-run.sh.: expected false to be true`
- R22, R22 M21 and M22, R29 CLI, R6, R7, R8, R9, R10, R11, R13, R14, R17 (11 tests)

Line 1518: `Error: Command failed: git diff --name-only e5266ce1 -- dashboard/lib/covers/catalogue.ts …` (`fatal: bad revision 'e5266ce1'`, shallow clone)
- R15: this phase does not change the Primary cover contract

### storytime-print-student-book.test.ts
Line 252: `AssertionError: Run Chrome and Ghostscript only through heavy-run.sh.: expected false to be true`
- R31 zero CMY coverage, R34 fonts, R36 QR matrices, R31 cyan patch, R37 n stroke guide, R38 K 20–40% gray, R38 five trace items, R38 black start dot, R38 trace dot within 1.5 mm, R40 cut line parity, R41 stroke guide (11 tests)

### text-profile-graph.test.ts
- `:27` (file failed while collecting). `Error: ENOENT: no such file or directory, open '/home/user/mastery-advantage/english/cefr-vocabulary/cefr-vocabulary-knowledge-space.json'` (from `lib/text-profile/vocabulary.ts:139`)

## The 20 slowest tests

| # | Time | File | Test |
|---|---|---|---|
| 1 | 9988 ms | storytime-print-readers.test.ts | two-output picture check R-P4-28 the batch CLI passes the 30 rows with four redone rows and names a duplicate row id |
| 2 | 7381 ms | storytime-print-readers.test.ts | R-P4-18 passes every week-one row of a manifest whose file paths carry the w01/rows/ folder prefix |
| 3 | 5142 ms | storytime-print-readers.test.ts | R-P4-8 rejects bad dimensions, alpha, CMYK, color in line-art place, and wrong names |
| 4 | 5135 ms | storytime-print-readers.test.ts | R-P4-23 passes the 30 week-one rows when four rows were redone and carry the version 2 file names |
| 5 | 3735 ms | storytime-print-readers.test.ts | R-P4-7 accepts known-good color and line-art fixtures and sets its threshold from the good fixture |
| 6 | 2525 ms | storytime-print-covers-16books.test.ts | R18 v2 side band: the picture check names the side for a copied mutant with a figure at the edge |
| 7 | 2344 ms | storytime-print-readers.test.ts | R-P4-17 accepts a 1-bit line-art PNG in both 1-bit encodings |
| 8 | 2151 ms | storytime-print-covers-16books.test.ts | R12: cut-out corners match the level ground tint, the center has figures, and a white corner fails |
| 9 | 1977 ms | storytime-print-covers-16books.test.ts | R12 v2: all three shipped compositions meet the fill threshold on their tinted ground |
| 10 | 1333 ms | storytime-print-readers.test.ts | R-P4-9 rejects gray-filled line art and checks manifest name, SHA-256, and pixel size |
| 11 | 1281 ms | storytime-print-covers-16books.test.ts | R18 v2 sides: no figure pixel is in the left or the right 3 mm band of a composed cover picture |
| 12 | 1223 ms | storytime-print-covers-16books.test.ts | R18 v2 top band: no figure pixel is in the top 8 mm band of a composed cover picture |
| 13 | 1040 ms | storytime-print-student-book.test.ts | R-P4-42 guard: a plain prefix and no prefix keep the file URL of the resolved path |
| 14 | 951 ms | storytime-print-covers-16books.test.ts | R12 v2 mutation: a centred 75 percent L4U4 image passes corners and fails by fill |
| 15 | 949 ms | storytime-print-readers.test.ts | R-P4-13 final mode with a missing picture exits nonzero, names the picture, writes no output, and leaves the same version free for a retry |
| 16 | 864 ms | storytime-print-readers.test.ts | R-P4-19 passes the present rows of a subset manifest and fails each absent row as not in the manifest |
| 17 | 759 ms | storytime-print-readers.test.ts | R-P4-6 exposes the readers PDF CLI help |
| 18 | 738 ms | storytime-print-readers.test.ts | R-P4-25 fails a row whose job carries the file of another row id, with the prefix trap in both directions |
| 19 | 736 ms | storytime-print-student-book.test.ts | R-P4-40 a hostile folder prefix adds no attribute and no element, and a prefix with #, ?, %, a quote, or a space decodes to the resolved file |
| 20 | 734 ms | storytime-print-readers-adversarial.test.ts | ADV-P4-CLI-NO-MANIFEST exits 2 on a batch folder without manifest.json, on an unknown flag, and writes no file |

The tests failed fast at their guards, so their times are not counted above. If the guards are satisfied, the Chrome and Ghostscript tests in `storytime-print-covers-16books` and `storytime-print-student-book` would probably be the slowest in the suite.

## Findings

Format: `file:line | severity | text`. "Env" means this container caused the failure, not a code defect.

- `primary/origins-2-a0/01-Pip the Curious Puppy Feels _workbook.json:82 | high | "article_image_url" is an array, but WorkbookLessonSchema (dashboard/lib/workbook-schema.ts:85) allows only a string or "". 13 of the 14 lessons in primary/origins-2-a0 fail the schema. This is a real content-schema mismatch, and it fails origins-thai-support.test.ts:26.`
- `primary/origins-3.1-a0/01-My New City Plane Trip _workbook.json:100 | high | Same as above: article_image_url is an array. 13 of the 14 lessons in primary/origins-3.1-a0 fail WorkbookLessonSchema.`
- `dashboard/__tests__/constants.test.ts:10 | medium | The test expects PRIMARY_LEVELS to contain { value: '1.0', series: 'Adventures', cefr: 'A1', label: '1.0 - Adventures' }. dashboard/lib/constants.ts:45 has only { value: '1', series: 'Origins', cefr: 'A0' }, and there is no Adventures entry. The test and the constants disagree. This is a real failure, not caused by the environment.`
- `dashboard/__tests__/text-profile-graph.test.ts:27 | medium | describe.skipIf(!fs.existsSync(GRAPH)) does not stop the describe body from running while Vitest collects tests. loadVocabularyIndex(GRAPH) is called in the body, so a missing sibling graph crashes the file (ENOENT) instead of skipping it. The load should move into beforeAll or into the tests. This is a real test bug, and the missing graph only exposes it.`
- `dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:407 | low | When the phonics graph is missing, this test throws TypeError (reading 'graphemes') instead of failing at the readable-graph guard that the other tests use. The guard is missing.`
- `dashboard/lib/storytime/files.ts:85 | low (env) | PHONICS_GRAPH_FILE defaults to the sibling repo ../mastery-advantage/english/phonics/phonics-knowledge-space.json, which is not in this container. 15 covers tests fail "phonics graph must be readable" (16books.test.ts:445; adversarial.test.ts:169/208/225/311). Mounting the repo or setting MASTERY_PHONICS_GRAPH would fix this.`
- `dashboard/__tests__/storytime-print-student-book.test.ts:252 | low (env) | requireHeavyWrapper() walks /proc to find a heavy-run.sh ancestor. That script is in ~/Desktop/advantage-pr/scripts/jobs/, which is not here, so 11 Chrome/Ghostscript tests fail in any plain vitest run. The same guard is at storytime-print-covers-16books.test.ts:267 (11 tests) and the adversarial file at :63 (4 tests). By design, the full suite can never be green outside the wrapper. Consider describe.skipIf without the wrapper, or a separate heavy project.`
- `dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:493 | low (env) | The precondition needs the cached ICC profile /root/.cache/workbooks-print/JapanColor2001Coated.icc. It comes from download.adobe.com (dashboard/lib/print/pdfx.ts:15). It was not fetched because this pilot allows no network calls except package installs. 3 tests fail.`
- `dashboard/__tests__/storytime-print-contract-r3.test.ts:261 | low (env) | The test runs git show at c7739efb. The commit is not available in a shallow clone, so the test fails. Full history (git fetch --unshallow) is needed. Unshallowing was not done in this pilot.`
- `dashboard/__tests__/storytime-print-covers-16books.test.ts:1518 | low (env) | git diff against e5266ce1 fails with "bad revision" in a shallow clone. This is the same history dependency as above.`
- `dashboard/__tests__/inject-integration.test.ts:33 | info | 6 tests are skipped because there are no legacy Postgres migrations. Expected outside the local setup.`
- `dashboard/__tests__/storytime-phonics.test.ts:103 | info | 1 test is skipped because there is no real phonics graph JSON (sibling repo).`

## Summary

- Real defects (3): the Origins `article_image_url` schema mismatch (26 lessons), the missing `1.0 Adventures` level, and the `text-profile-graph` skipIf that crashes while collecting.
- Real defects explain 3 of the 50 failed tests (constants 1, origins 2). The `text-profile-graph` crash fails a file and is not counted among the 50 tests.
- The container caused the other 47 failed tests: the heavy-run.sh wrapper is absent (26), the sibling `mastery-advantage` phonics graph is absent (15, plus the `:407` TypeError, which lacks its guard), the Adobe ICC profile cannot be downloaded (3), and the git clone is shallow (2).
- No flaky files.
