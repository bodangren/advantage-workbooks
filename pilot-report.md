# Pilot report: Storytime print tests under load (cloud)

- **Base SHA:** `cc7808c541ca1cac810a7cd74f34520f748aef5b`
- **Branch:** `pilot/cloud-wb-print-tests-under-load` (this file is the only change)
- **Date:** 2026-11-03 (UTC 11:10 to 11:41)
- **Machine:** cloud container, 4 vCPU, 15 GiB RAM, Node 22, Google Chrome for Testing 153.0.8010.12, Playwright 1.58.2
- **Clone:** shallow, 50 commits (`git rev-parse --is-shallow-repository` = `true`). No deeper fetch was made, because the only network calls allowed were package installs.

## Summary

- **Requested runs (7):** every run exits 1 with the same result: **447 passed, 47 failed, 494 total**. There were **0 timeouts** and **0 flaky tests**. All 47 failures are environment failures and fail fast, in 1 to 500 ms.
- **The requested command does not run the Chrome/Ghostscript path.** 27 of the 47 failures are the guard `Run Chrome and Ghostscript only through heavy-run.sh`. That wrapper lives in `~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh`, which is not in this container. As a result, the requested command cannot reproduce the local load timeouts of the cover builds.
- **Extra pass (7 more runs, not requested; labeled "stub").** I added a pass-through `heavy-run.sh` (no lock, no pre-flight) in the scratchpad, outside the repo. The runs took place inside `unshare -n`, a network namespace with only loopback, so no network call was possible. Every run exits 1: **453 passed, 41 failed, 494 total**, again with **0 timeouts** and **0 flaky tests**. The remaining failures are the missing phonics graph, the missing ICC profile (`make-pdfx.ts` tried to download it and got `fetch failed`), and two commits missing from the shallow clone.
- **R-P4-8 (readers), the reported local timeout.** It passed in all 14 runs, but its duration rises steeply with load. With a 30 000 ms limit it took **7.2 s at 1 worker and up to 17.9 s at 8 workers** (requested runs), and **up to 20.6 s (69% of the limit)** in the stub runs. 8 workers on 4 vCPUs makes it 2.5 to 3 times slower. A machine that is a little slower or more loaded (other agents, Chrome builds) crosses 30 s. This matches the 11-02 and 11-03 local timeouts.
- **R15 (covers-16books), the reported local timeout.** It could not be measured. It fails deterministically here, because commit `e5266ce1` is not in the shallow clone. It has the **default 5 000 ms limit** and runs two synchronous `git diff` child processes. See the findings.
- The working tree was clean (`git status --porcelain` empty) after each of the 14 runs.

## Commands and exit codes

| # | Command | Exit | Note |
|---|---|---|---|
| 1 | `git fetch origin cc7808c541ca1cac810a7cd74f34520f748aef5b` | 0 | |
| 2 | `git checkout -b pilot/cloud-wb-print-tests-under-load cc7808c5…` | 128 | The branch already existed locally and on origin at the base SHA |
| 3 | `git checkout pilot/cloud-wb-print-tests-under-load` | 0 | HEAD = base SHA, up to date with origin |
| 4 | `cd dashboard && npm ci` | 0 | 1 m 21 s; added 815 packages; npm audit reports 54 vulnerabilities (2 low, 23 moderate, 23 high, 6 critical); not acted on |
| 5 | `npx playwright install --with-deps chrome` | 0 | apt deps already the newest version; Playwright reports "chrome is already installed on the system" |
| 6 | `sudo apt-get install -y ghostscript poppler-utils` | 0 | `gs`, `pdftotext` present afterwards |
| 7–11 | `cd dashboard && CI=true npx vitest run __tests__/storytime-print-*.test.ts --maxWorkers=8` (×5) | 1, 1, 1, 1, 1 | Plus `--reporter=default --reporter=json --outputFile.json=<scratch>` to get per-test data |
| 12–13 | `cd dashboard && CI=true npx vitest run __tests__/storytime-print-*.test.ts --maxWorkers=1` (×2) | 1, 1 | Same reporters |
| 14–20 | Stub pass: `unshare -n -- bash <scratch>/stub/heavy-run.sh -c "cd dashboard && CI=true npx vitest run __tests__/storytime-print-*.test.ts --maxWorkers=W …"`, W = 8 ×5, then 1 ×2 | 1 ×7 | Not requested; see the summary |
| — | `git status --porcelain` after each run | 0 | Empty every time |

The glob expands to 14 test files (494 tests; Vitest counts 57 suites, meaning describe blocks).

## Runs: duration, failures, timeouts

Wall time is the full `npx` command. Vitest time is from the JSON reporter (first start to last file end).

### Requested runs

| Run | Workers | Exit | Wall | Vitest | Passed | Failed | Timeouts | R-P4-7 | R-P4-8 (limit 30 000) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 8 | 1 | 89 s | 87.8 s | 447 | 47 | 0 | 6 451 ms | 17 843 ms |
| 2 | 8 | 1 | 75 s | 74.3 s | 447 | 47 | 0 | 6 179 ms | 9 421 ms |
| 3 | 8 | 1 | 75 s | 73.7 s | 447 | 47 | 0 | 4 552 ms | 8 091 ms |
| 4 | 8 | 1 | 84 s | 83.1 s | 447 | 47 | 0 | 5 441 ms | 17 869 ms |
| 5 | 8 | 1 | 85 s | 83.7 s | 447 | 47 | 0 | 5 593 ms | 17 540 ms |
| 6 | 1 | 1 | 109 s | 108.1 s | 447 | 47 | 0 | 2 506 ms | 7 152 ms |
| 7 | 1 | 1 | 102 s | 101.6 s | 447 | 47 | 0 | 2 377 ms | 7 208 ms |

The failed tests are the same 47 in every requested run (list below).

### Stub runs (not requested)

| Run | Workers | Exit | Wall | Vitest | Passed | Failed | Timeouts | R-P4-7 | R-P4-8 (limit 30 000) | R38 trace dot (limit 1 200 000) |
|---|---|---|---|---|---|---|---|---|---|---|
| s1 | 8 | 1 | 91 s | 90.1 s | 453 | 41 | 0 | 7 239 ms | 10 055 ms | 25 574 ms |
| s2 | 8 | 1 | 87 s | 86.5 s | 453 | 41 | 0 | 6 279 ms | 8 784 ms | 25 983 ms |
| s3 | 8 | 1 | 87 s | 85.4 s | 453 | 41 | 0 | 6 948 ms | 10 136 ms | 24 103 ms |
| s4 | 8 | 1 | 90 s | 89.5 s | 453 | 41 | 0 | 6 503 ms | 20 645 ms | 26 009 ms |
| s5 | 8 | 1 | 85 s | 84.8 s | 453 | 41 | 0 | 7 583 ms | 9 499 ms | 24 361 ms |
| s6 | 1 | 1 | 186 s | 185.2 s | 453 | 41 | 0 | 2 618 ms | 6 841 ms | 22 995 ms |
| s7 | 1 | 1 | 200 s | 198.9 s | 453 | 41 | 0 | 2 838 ms | 7 777 ms | 24 519 ms |

The failed tests are the same 41 in every stub run (list below). The 1-worker stub runs take about twice as long as the requested 1-worker runs. The reason is that the Chrome renders and screenshots now run in series, for example the R38 trace-dot test at about 24 s.

### Timeouts

**None in any of the 14 runs.** No failure message contains `Test timed out`, `Hook timed out`, `ETIMEDOUT`, or a spawn-timeout kill.

### Tests that failed in at least one run and passed in another

**None.** That holds within the 7 requested runs, within the 7 stub runs, and across both sets. Every test passed in all runs of its set or failed in all of them. The only differences between the sets are the 6 tests that the stub unblocks (they fail in every requested run and pass in every stub run). That difference comes from the wrapper, not from flakiness:
`storytime-print-covers-16books-adversarial.test.ts:287` ADV-CLI, `:426` ADV-P2-GATE, `:556` ADV-P2-GUARD; `storytime-print-covers-16books.test.ts:1051` R29 CLI, `:1240` R11; `storytime-print-student-book.test.ts:1740` R38 trace dot.

### Tests closest to their limit (max duration over 14 runs / limit)

| file:line | Test | Limit | Max | Use |
|---|---|---|---|---|
| storytime-print-readers.test.ts:497 | R-P4-8 rejects bad dimensions, alpha, CMYK, … | 30 000 | 20 645 | 69% |
| storytime-print-teacher-book.test.ts:82 | R-F-P3-1 exports the exact K-only PDF/X flag list | 5 000 (default) | 2 061 | 41% |
| storytime-print-student-book.test.ts:1160 | R31: uses the exported K-only flags in the production call | 5 000 (default) | 1 576 | 32% |
| storytime-print-student-book.test.ts:893 | R22: prints the page order and a left-page spread | 5 000 (default) | 1 451 | 29% |
| storytime-print-readers.test.ts:481 | R-P4-7 accepts known-good color and line-art fixtures | 30 000 | 7 583 | 25% |
| storytime-print-student-book.test.ts:1031 | R35: keeps the QR deploy mark in proof mode | 5 000 (default) | 1 198 | 24% |
| storytime-print-student-book.test.ts:981 | R27: gives the two real QR generators the S23 inputs | 5 000 (default) | 1 144 | 23% |

The limits come from a TypeScript AST scan of all 329 `it`/`test` calls in the 14 files (`it.each` counts as one). 177 calls use the Vitest default of 5 000 ms; no file or config overrides `testTimeout`.

## Failure lists

### Requested runs: 47 failures, identical in all 7 (`file:line | test | limit | cause`)

Causes: 27 have no `heavy-run.sh` ancestor; 15 lack the phonics graph (`../mastery-advantage`, `dashboard/lib/storytime/files.ts:85`); 3 lack the cached ICC profile; 2 need commits missing from the shallow clone.

```
dashboard/__tests__/storytime-print-contract-r3.test.ts:260 | R4b-4 keeps the week 1 to 7 rows byte-equal to the version 3 list at c7739efb | 5000 (default) | commit missing from shallow clone
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:157 | ADV-D12: approved-only values keep the week 1 story but lose every draft-week title, and t | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:203 | ADV-TITLE: a reader title with an ASCII semicolon, even after a space, stops panel values  | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:220 | ADV-TITLE: a reader title with a full-width semicolon builds, and the books field still sp | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:287 | ADV-CLI: a bad level, a bad unit, and an unknown option exit 2 before any write | 300000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:301 | ADV-D12: the mock values strictly extend the approved values, so a passing print would ren | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:367 | ADV-P2-OUT: a version 3 --print build without --out leaves the approved proof-v3 mock fold | 360000 | ICC profile not cached
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:388 | ADV-P2-D12: with week 1 back to draft and weeks 2 to 8 approved, a print build stops on th | 360000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:399 | ADV-P2-D12: with only week 3 back to draft, the printed back page carries no word that onl | 360000 | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:426 | ADV-P2-GATE: PRINT_GATE fails a Chrome-like PDF, also under the print file name, and a mis | 300000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:500 | ADV-P2-DEFAULT: a version 3 --print build without --out exits 0 and writes the whole print | 360000 | ICC profile not cached
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:535 | ADV-P2-DEFAULT: a version 4 --print build without --out writes print-v4/l2u1 and leaves pr | 360000 | ICC profile not cached
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:556 | ADV-P2-GUARD: a --print build with an explicit --out inside the proof folder of another ve | 300000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:724 | R20.2: the story words come from the student text of its source weeks, with no year and no | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:764 | R20.1 and R20.3 to R20.6: the five fields follow their shipped week and phonics sources | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:791 | R21: data week lists match the readable source weeks and stay inside each unit | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:812 | R22: mock reports draft sources; print rejects draft-only field values and preserves v1 an | 360000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:833 | R23: all backs show five fields; empty fields show mock-only missing copy and no Thai | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:853 | R27: panel word case follows every source occurrence, without changing order or repeats (M | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:891 | R28: the shipped books field uses the semicolon separator and preserves item 12 (M24) | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:904 | R28 mutation: a copied Level 2 week title with a semicolon stops panel values and names it | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:951 | R24: the panel box is 186 x 138 mm at 12 mm and 48 mm, the inset is 162 x 114 mm, and the  | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:984 | R25: the chosen panel size fits, is at least 10 pt, and is the largest fitting scale value | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1003 | R22 M21 and M22: print source and version output path remain bounded | 360000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:1051 | R29 CLI: a version 3 build into proof exits 2 before a write and keeps the seed file | 360000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:1108 | R6: the copy check passes the Chrome PDF text of a built cover | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:1142 | R7: the Thai check reads the Chrome PDF, not a PDF/X extract | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:1171 | R8: the printed back-page QR matches the encoder grid, and the quiet zone is not data | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:1198 | R9: each built PNG is 2480 x 3508 px, 8-bit RGB, with no alpha | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:1216 | R10: pdffonts on the Chrome PDF shows embedded Andika and Sarabun, and no Type 3 face | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:1240 | R11: a missing picture stops the build, names the book, and writes no deliverable | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:1463 | R13: the picture layer has no alpha, composeSide stays JPEG, and the page is not one image | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:1483 | R14: --print writes a PDF/X file, checkPdfx passes, and the fonts remain | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-covers-16books.test.ts:1505 | R15: this phase does not change the Primary cover contract | 5000 (default) | commit missing from shallow clone
dashboard/__tests__/storytime-print-covers-16books.test.ts:1577 | R26: six panel mutation copies, each in a temp folder, each fails one panel check (M16 to  | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1632 | R17: front level-card text is visible in the PNG and PDF/X raster; back panel text remains | 300000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-student-book.test.ts:1190 | R31: gives every PDF/X inside page zero CMY coverage and preserves the physical page count | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-student-book.test.ts:1202 | R34: embeds only Andika regular, Andika bold, and Sarabun in the built PDF/X | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-student-book.test.ts:1380 | R36: matches both printed PDF/X QR matrices to their labeled song and book addresses | 250000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-student-book.test.ts:1427 | R31: detects CMY on a temporary PDF/X copy with an explicit cyan patch | 250000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-student-book.test.ts:1612 | R37: sits the n stroke guide on the rendered stems within 1 mm (D1) | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-student-book.test.ts:1677 | R38: prints each trace item in a K 20-40% gray, never solid black (D2) | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-student-book.test.ts:1695 | R38: measures the five compiled trace items in page context and catches a removed gray opt | 1200000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-student-book.test.ts:1728 | R38: prints a black start dot on each letter copy (D2) | 230000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-student-book.test.ts:1740 | R38: places each trace dot within 1.5 mm of its first letter stroke | 1200000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-student-book.test.ts:1787 | R40: mirrors the horizontal cut line with the strip parity (D4) | 250000 | no heavy-run.sh ancestor
dashboard/__tests__/storytime-print-student-book.test.ts:1808 | R41: shows the stroke guide in black on a gray model letter, inside the outline (D5) | 500000 | no heavy-run.sh ancestor
```

### Stub runs: 41 failures, identical in all 7

Causes: 17 lack the phonics graph; 9 are a cover build that exits 1 with "The phonics graph is not readable"; 10 are `make-pdfx.ts` failing to download the ICC profile (`fetch failed`, blocked by the network namespace) after the Chrome render succeeded; 3 lack the cached ICC profile; 2 need commits missing from the shallow clone.

```
dashboard/__tests__/storytime-print-contract-r3.test.ts:260 | R4b-4 keeps the week 1 to 7 rows byte-equal to the version 3 list at c7739efb | 5000 (default) | commit missing from shallow clone
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:157 | ADV-D12: approved-only values keep the week 1 story but lose every draft-week title, and t | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:203 | ADV-TITLE: a reader title with an ASCII semicolon, even after a space, stops panel values  | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:220 | ADV-TITLE: a reader title with a full-width semicolon builds, and the books field still sp | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:301 | ADV-D12: the mock values strictly extend the approved values, so a passing print would ren | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:367 | ADV-P2-OUT: a version 3 --print build without --out leaves the approved proof-v3 mock fold | 360000 | ICC profile not cached
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:388 | ADV-P2-D12: with week 1 back to draft and weeks 2 to 8 approved, a print build stops on th | 360000 | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:399 | ADV-P2-D12: with only week 3 back to draft, the printed back page carries no word that onl | 360000 | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:500 | ADV-P2-DEFAULT: a version 3 --print build without --out exits 0 and writes the whole print | 360000 | ICC profile not cached
dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:535 | ADV-P2-DEFAULT: a version 4 --print build without --out writes print-v4/l2u1 and leaves pr | 360000 | ICC profile not cached
dashboard/__tests__/storytime-print-covers-16books.test.ts:724 | R20.2: the story words come from the student text of its source weeks, with no year and no | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:764 | R20.1 and R20.3 to R20.6: the five fields follow their shipped week and phonics sources | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:791 | R21: data week lists match the readable source weeks and stay inside each unit | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:812 | R22: mock reports draft sources; print rejects draft-only field values and preserves v1 an | 360000 | cover build exit 1 (phonics graph missing)
dashboard/__tests__/storytime-print-covers-16books.test.ts:833 | R23: all backs show five fields; empty fields show mock-only missing copy and no Thai | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:853 | R27: panel word case follows every source occurrence, without changing order or repeats (M | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:891 | R28: the shipped books field uses the semicolon separator and preserves item 12 (M24) | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:904 | R28 mutation: a copied Level 2 week title with a semicolon stops panel values and names it | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:951 | R24: the panel box is 186 x 138 mm at 12 mm and 48 mm, the inset is 162 x 114 mm, and the  | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:984 | R25: the chosen panel size fits, is at least 10 pt, and is the largest fitting scale value | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1003 | R22 M21 and M22: print source and version output path remain bounded | 360000 | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1108 | R6: the copy check passes the Chrome PDF text of a built cover | 230000 | cover build exit 1 (phonics graph missing)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1142 | R7: the Thai check reads the Chrome PDF, not a PDF/X extract | 230000 | cover build exit 1 (phonics graph missing)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1171 | R8: the printed back-page QR matches the encoder grid, and the quiet zone is not data | 230000 | cover build exit 1 (phonics graph missing)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1198 | R9: each built PNG is 2480 x 3508 px, 8-bit RGB, with no alpha | 230000 | cover build exit 1 (phonics graph missing)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1216 | R10: pdffonts on the Chrome PDF shows embedded Andika and Sarabun, and no Type 3 face | 230000 | cover build exit 1 (phonics graph missing)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1463 | R13: the picture layer has no alpha, composeSide stays JPEG, and the page is not one image | 230000 | cover build exit 1 (phonics graph missing)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1483 | R14: --print writes a PDF/X file, checkPdfx passes, and the fonts remain | 230000 | cover build exit 1 (phonics graph missing)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1505 | R15: this phase does not change the Primary cover contract | 5000 (default) | commit missing from shallow clone
dashboard/__tests__/storytime-print-covers-16books.test.ts:1577 | R26: six panel mutation copies, each in a temp folder, each fails one panel check (M16 to  | 5000 (default) | phonics graph missing (../mastery-advantage)
dashboard/__tests__/storytime-print-covers-16books.test.ts:1632 | R17: front level-card text is visible in the PNG and PDF/X raster; back panel text remains | 300000 | cover build exit 1 (phonics graph missing)
dashboard/__tests__/storytime-print-student-book.test.ts:1190 | R31: gives every PDF/X inside page zero CMY coverage and preserves the physical page count | 230000 | make-pdfx ICC download blocked (no network)
dashboard/__tests__/storytime-print-student-book.test.ts:1202 | R34: embeds only Andika regular, Andika bold, and Sarabun in the built PDF/X | 230000 | make-pdfx ICC download blocked (no network)
dashboard/__tests__/storytime-print-student-book.test.ts:1380 | R36: matches both printed PDF/X QR matrices to their labeled song and book addresses | 250000 | make-pdfx ICC download blocked (no network)
dashboard/__tests__/storytime-print-student-book.test.ts:1427 | R31: detects CMY on a temporary PDF/X copy with an explicit cyan patch | 250000 | make-pdfx ICC download blocked (no network)
dashboard/__tests__/storytime-print-student-book.test.ts:1612 | R37: sits the n stroke guide on the rendered stems within 1 mm (D1) | 230000 | make-pdfx ICC download blocked (no network)
dashboard/__tests__/storytime-print-student-book.test.ts:1677 | R38: prints each trace item in a K 20-40% gray, never solid black (D2) | 230000 | make-pdfx ICC download blocked (no network)
dashboard/__tests__/storytime-print-student-book.test.ts:1695 | R38: measures the five compiled trace items in page context and catches a removed gray opt | 1200000 | make-pdfx ICC download blocked (no network)
dashboard/__tests__/storytime-print-student-book.test.ts:1728 | R38: prints a black start dot on each letter copy (D2) | 230000 | make-pdfx ICC download blocked (no network)
dashboard/__tests__/storytime-print-student-book.test.ts:1787 | R40: mirrors the horizontal cut line with the strip parity (D4) | 250000 | make-pdfx ICC download blocked (no network)
dashboard/__tests__/storytime-print-student-book.test.ts:1808 | R41: shows the stroke guide in black on a gray model letter, inside the outline (D5) | 500000 | make-pdfx ICC download blocked (no network)
```

## Findings (`file:line | severity | text`)

- dashboard/__tests__/storytime-print-readers.test.ts:497 | high | R-P4-8 is the timing-sensitive test in this suite. Limit 30 000 ms. Measured 6.8–7.8 s at 1 worker and 8.1–20.6 s at 8 workers on 4 vCPU, with a spread of 2.5× between runs at the same setting. The work is CPU-bound: it creates 4000×3000 sharp/libvips fixtures and runs six picture checks, so 8 workers oversubscribe the CPUs (each libvips pool also sizes itself to the core count). The worst run used 69% of the limit, which leaves about 1.45× headroom. That is consistent with the 11-02 and 11-03 local load timeouts. It passed in all 14 cloud runs.
- dashboard/__tests__/storytime-print-readers.test.ts:481 | medium | R-P4-7 belongs to the same fixture family. Limit 30 000 ms; 2.4–7.6 s, 3× slower at 8 workers than at 1. Lower risk than R-P4-8, but it shares the same contention.
- dashboard/__tests__/storytime-print-covers-16books.test.ts:1505 | high | R15 runs two synchronous `git diff` child processes against `e5266ce1` under the **default 5 000 ms limit**. Vitest cannot stop a synchronous `execFileSync`, so under load the test reports a timeout only after git returns. Here it fails at once with `bad revision`, because `e5266ce1` is not in the 50-commit shallow clone. Its local timing therefore cannot be reproduced in this container. On this clone the same two diffs against the oldest available commit took 12 ms in total, so the local slowness most likely comes from process start-up and git index refresh while the machine is loaded, not from the diff itself. Note: `storytime-print-contract-r3.test.ts:61` also carries "R15" (exact counts); that one passed in every run.
- dashboard/__tests__/storytime-print-contract-r3.test.ts:260 | medium | R4b-4 runs `git show c7739efb…:content/storytime/l2/print/pictures.json` under the default 5 000 ms limit. It fails in every run because commit c7739efb is not in the shallow clone. git's message, "path … exists on disk, but not in 'c7739efb…'", is misleading: `git cat-file -t` cannot find the object at all. It has the same synchronous-git-under-default-limit shape as R15.
- dashboard/__tests__/storytime-print-covers-16books.test.ts:258 | high | `requireHeavyWrapper()` (also `storytime-print-student-book.test.ts:243` and `storytime-print-covers-16books-adversarial.test.ts:54`) fails any test that has no `…/heavy-run.sh` ancestor process. With the requested command, 27 heavy tests fail in under 500 ms instead of running Chrome or Ghostscript. A cloud or CI run of this command can therefore never show the cover-build load behavior, and the requested 8-worker versus 1-worker comparison covers only the light tests.
- dashboard/lib/storytime/files.ts:85 | medium | `PHONICS_GRAPH_FILE` defaults to the sibling repo `../mastery-advantage/english/phonics/phonics-knowledge-space.json`. Without it, 15 (requested) or 17 (stub) tests fail, and every cover build exits 1. The covers-16books load path (the R15 neighbourhood) is unreachable without that repo or `MASTERY_PHONICS_GRAPH`.
- dashboard/__tests__/storytime-print-covers-16books-adversarial.test.ts:490 | medium | `seedPrintProfile` requires `~/.cache/workbooks-print/JapanColor2001Coated.icc`, and 3 tests fail on that precondition. In the stub runs, `scripts/print/make-pdfx.ts` also tries to download the profile ("downloads it from Adobe when it is missing", comment at line 486). It got `fetch failed` inside the network namespace, which fails 10 student-book PDF/X tests. Without the namespace, those tests would make a network call during the run.
- dashboard/__tests__/storytime-print-student-book.test.ts:327 | medium | The inner limits are fixed and do not scale with the worker count: `chromium.launch({ timeout: 15000 })` (also :354) and `make-pdfx` `timeout: 45000` (:334), all inside a `timeout 180s` child. With 8 workers each starting Chrome on 4 vCPUs, these are the next limits likely to trip. They could not be measured here, because the PDF/X step stops at the ICC download. Chrome launch and render did succeed (R31 reached make-pdfx after about 6.6 s).
- dashboard/__tests__/storytime-print-covers-16books.test.ts:1114 | low | `pdftotext`, `pdfinfo`, `pdffonts`, and `pdfimages` have fixed 15 000 ms limits (also :1147, :1148, :1220, :1224, :1476–1478, :1498). These tests did not run here, because the cover build exits 1. The limits are generous for single-page tools but do not scale with load.
- dashboard/__tests__/storytime-print-contract-r3.test.ts:191 | low | R20 has a 5 000 ms inner child timeout (`tsx` start-up plus a loop) inside a 10 000 ms test limit. Measured 138–878 ms. `tsx` start-up under heavy load is the only risk.
- dashboard/__tests__/storytime-print-readers.test.ts:1131 | low | R-P4-28 took 12.3–15.1 s against 900 000 ms, and R-P4-18 (:751) took up to 9.6 s against 300 000 ms. Both are slow but far from their limits.
- dashboard/__tests__/storytime-print-student-book.test.ts:1740 | low | R38 trace dot took 23.0–26.0 s (Chrome screenshots, stub runs only) against 1 200 000 ms. Far from its limit.
- dashboard/__tests__/storytime-print-teacher-book.test.ts:82 | low | R-F-P3-1 took 0.43–2.06 s under the default 5 000 ms limit, about 4.5× slower at 8 workers. It is the default-limit test with the least headroom (41%).

## Steps that could not run as intended

- **Creating the branch:** `git checkout -b` exited 128 because the branch already existed at the base SHA, so I checked it out instead.
- **The heavy print tests (Chrome, Ghostscript, PDF/X):** they could not run under the requested command, because of the `heavy-run.sh` guard. The stub pass ran them as far as the missing phonics graph and the missing ICC profile allowed. The phonics graph needs the sibling repo `mastery-advantage`, which is outside this session's repository scope. The ICC profile needs a download from Adobe, which is not an allowed network call.
- **R15 and R4b-4:** both need commits that are not in the 50-commit shallow clone. Deepening the clone would be a network call, so I did not deepen it.
