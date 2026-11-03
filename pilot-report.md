# Pilot report: mutation sweep of Storytime checks and phonemes

- Base SHA: `cc7808c541ca1cac810a7cd74f34520f748aef5b`
- Branch: `pilot/cloud-wb-storytime-checks-mutants` (it already existed locally and on origin at the base SHA; checked out as is)
- Files under test: `dashboard/lib/storytime/checks.ts`, `dashboard/lib/storytime/phonemes.ts`
- Date: 2026-11-03

## Commands and exit codes

| # | Command | Exit |
|---|---|---|
| 1 | `git fetch origin cc7808c541ca1cac810a7cd74f34520f748aef5b` | 0 |
| 2 | `git checkout -b pilot/cloud-wb-storytime-checks-mutants cc7808c…` | 128 (branch already exists at the base SHA) |
| 3 | `git checkout pilot/cloud-wb-storytime-checks-mutants` (HEAD = cc7808c) | 0 |
| 4 | `cd dashboard && npm ci` | 0 |
| 5 | Baseline: `cd dashboard && CI=true npx vitest run __tests__/storytime-week.test.ts __tests__/storytime-phonics.test.ts __tests__/storytime-phonemes.test.ts` | 0 |
| 6 | 111 mutant runs (same vitest command after each mutant; `git checkout -- <file>` after each) | see the table below (1 = caught, 0 = survived) |
| 7 | Reruns of mutants 99 and 103 with a valid form (the first form, `void (...spread)`, failed to transform: esbuild `Unexpected "..."`) | 99: 1, 103: 0 |
| 8 | `git diff --quiet` (after all mutants) | 0 (tree clean) |

No network call except `npm ci`; no secret, no `.env` file, no generation.

## Baseline

Test Files 3 passed (3); Tests 53 passed, 1 skipped (54). storytime-phonemes 7, storytime-phonics 7 (1 skipped), storytime-week 40.

## Counts

- Mutants: 111 (86 in checks.ts, 25 in phonemes.ts)
- Caught: 88
- Survived: 23 (1 of them, #5, is probably equivalent)
- Mutation score: 79.3 percent (80.0 percent without the equivalent mutant)
- Mutants that did not compile and were counted: 0 (99 and 103 were rerun in a valid form)

## Findings (surviving mutants)

Format: `file:line | severity | text`. The severity is how much the gap matters for the check: medium = a whole rule or branch has no test; low = a boundary off by one; info = probably equivalent.

```
dashboard/lib/storytime/checks.ts:56 | medium | #4: `w.meta.level >= 2` -> `w.meta.level >= 1`. taughtTo test has one Level 1 week (1-3, grapheme 'n'), but 'n' is also taught in Level 2 week 1, so the Set hides a leaked Level 1 grapheme. No test gives Level 1 a grapheme that Level 2 does not teach.
dashboard/lib/storytime/checks.ts:56 | info | #5: `w.meta.week < week.meta.week` -> `w.meta.week <= week.meta.week`. Probably equivalent: '<=' re-adds the week being checked (already appended as `week`), and the Set removes the duplicate. It is only visible if the list holds a different object with the same level and week.
dashboard/lib/storytime/checks.ts:172 | low | #22: `step.minutes > 8` -> `step.minutes >= 8`. No test has a Level 1 step of exactly 8 minutes; the test uses 9 minutes (fail), so the boundary 'step of 8 is allowed' is not pinned.
dashboard/lib/storytime/checks.ts:178 | low | #23: `periodMinutes > 30` -> `periodMinutes >= 30`. The 'moved' test uses periodMinutes 32 (warn); no test has a moved step in an exactly 30-minute period, so '>= 30' is not caught.
dashboard/lib/storytime/checks.ts:178 | low | #24: `periodMinutes > 30` -> `periodMinutes > 31`. Same as above: no test uses a 31-minute period with a moved step.
dashboard/lib/storytime/checks.ts:202 | medium | #33: `level <= 3 ?` -> `level < 3 ?`. No test has a Level 3 teach week. The '8 pages exactly at Level 3' rule versus '8 to 12' is not tested.
dashboard/lib/storytime/checks.ts:202 | low | #34: `readAlong.pages.length > 12` -> `readAlong.pages.length > 13`. No test has a Level 4+ read-along of 13 pages; the upper bound 12 is not pinned.
dashboard/lib/storytime/checks.ts:218 | low | #40: `d.ratio < 0.9` -> `d.ratio <= 0.9`. No decodable fixture has a ratio of exactly 0.9 (e.g. 9 of 10 words), so '<' versus '<=' at the 90 percent bound is not tested.
dashboard/lib/storytime/checks.ts:241 | medium | #46: `sheet.length !== sung.length ?` -> `false ?`. The sheet-longer case is caught by findIndex (sung[i] is undefined), but no test has more sung lines than sheet lines, which only the length comparison reports.
dashboard/lib/storytime/checks.ts:248 | low | #48: `l.imageOf >= i` -> `l.imageOf > i`. The bad-imageOf test uses imageOf = 5 on line index 3 (a later line). No test makes a line point to itself (imageOf === its own index).
dashboard/lib/storytime/checks.ts:266 | medium | #52: `lineProblems.push(`${step.id}: no Thai character`)` -> `void 0`. No test gives a step Thai notes with the right line counts but no Thai character; the 'no Thai character' push can be dropped.
dashboard/lib/storytime/checks.ts:270 | medium | #53: `lineProblems.push(`benchmark` -> `void (`benchmark`. No test gives the benchmark one-to-one sitting a Thai note with a wrong line count; the benchmark branch of thai-lines is untested.
dashboard/lib/storytime/checks.ts:291 | low | #54: `notesMissing || noThai ?` -> `notesMissing ?`. The 'thai' warn tests always have step notes without Thai, so notesMissing alone triggers the warn. No test has every note in Thai but a bilingual line (title, prep, song note) without Thai.
dashboard/lib/storytime/checks.ts:308 | medium | #62: `w.home.words.length === 3` -> `w.home.words.length === 4`. The home test only checks that 1 word warns. No test asserts that exactly 3 words pass, so the 3 can be any other number.
dashboard/lib/storytime/checks.ts:362 | low | #69: `d <= 5` -> `d <= 4`. No review-week test removes block day 5; the tests remove weeks from days 2 and 4 only, so 'no day 5' is never expected.
dashboard/lib/storytime/checks.ts:364 | medium | #71: `blockProblems.push(` -> `void (`. No test gives a block day a week that is not in block.weeks; the 'day N: week M is not in the block' push can be dropped.
dashboard/lib/storytime/checks.ts:369 | medium | #74: `d.day <= 4` -> `d.day <= 5`. No test has a block week covered only on day 5. The rule 'days 1 to 4 cover every block week' passes the same when day 5 counts.
dashboard/lib/storytime/checks.ts:386 | low | #79: `o.letterPass > o.letters.length` -> `o.letterPass >= o.letters.length`. No test sets letterPass equal to letters.length (or one more); the '>' versus '>=' bound is not pinned (the fixture uses letterPass 1).
dashboard/lib/storytime/phonemes.ts:53 | medium | #90: `{2,}` -> `{1,}`. bankSound tests use held sounds of three letters ('Nnn', 'nnn'). No test checks that a two-letter label such as 'ee', 'ss' or 'll' is NOT collapsed to one letter; with '{1,}', 'ee' maps to /e-short/.
dashboard/lib/storytime/phonemes.ts:40 | medium | #94: `x: 'x-ks',` -> `(removed)`. ALIAS 'x' -> 'x-ks' is not tested; bankSound tests cover a, e, c, k, ck only.
dashboard/lib/storytime/phonemes.ts:42 | medium | #95: `qu: 'qu-kw',` -> `(removed)`. ALIAS 'qu' -> 'qu-kw' is not tested (nor 'q').
dashboard/lib/storytime/phonemes.ts:100 | medium | #103: `unresolved.push(` -> `[].push(`. The unresolved-sound test covers focus.element (/th/) only. No test has a sound-game (opening.pa) line whose sound is not in the bank, so dropping the opening unresolved push is not seen.
dashboard/lib/storytime/phonemes.ts:145 | medium | #109: `if (unresolved.length)` -> `if (false)`. setPhonemeAudio is tested only with a bank that has every sound. No test expects it to throw on an unresolved sound, so the guard can be removed and the field writes go ahead.
```

## All mutants

| # | file:line | change | result | vitest summary |
|---|---|---|---|---|
| 1 | checks.ts:15 | `problems.length ? failStatus` -> `problems.length > 1 ? failStatus` | caught (exit 1) | Tests  18 failed \| 35 passed \| 1 skipped (54) |
| 2 | checks.ts:33 | `{0,2}` -> `{0,1}` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 3 | checks.ts:33 | `{0,2}` -> `{0,3}` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 4 | checks.ts:56 | `w.meta.level >= 2` -> `w.meta.level >= 1` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 5 | checks.ts:56 | `w.meta.week < week.meta.week` -> `w.meta.week <= week.meta.week` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 6 | checks.ts:56 | `w.meta.level < level` -> `w.meta.level <= level` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 7 | checks.ts:92 | `i === word.length` -> `i === word.length - 1` | caught (exit 1) | Tests  3 failed \| 50 passed \| 1 skipped (54) |
| 8 | checks.ts:97 | `n.week <= week!` -> `n.week < week!` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 9 | checks.ts:97 | `n.week !== null && n.week <= week!` -> `n.week! <= week!` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 10 | checks.ts:103 | `result.names.push(word)` -> `void 0` | caught (exit 1) | Tests  3 failed \| 50 passed \| 1 skipped (54) |
| 11 | checks.ts:104 | `else result.untaught.push(` -> `else void (` | caught (exit 1) | Tests  3 failed \| 50 passed \| 1 skipped (54) |
| 12 | checks.ts:106 | `if (words.length) ` -> `(removed)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 13 | checks.ts:129 | `w.meta.key === key` -> `w.meta.key !== key` | caught (exit 1) | Tests  6 failed \| 47 passed \| 1 skipped (54) |
| 14 | checks.ts:134 | `!== 5` -> `!== 4` | caught (exit 1) | Tests  6 failed \| 47 passed \| 1 skipped (54) |
| 15 | checks.ts:137 | `s.day !== i + 1` -> `s.day !== i` | caught (exit 1) | Tests  5 failed \| 48 passed \| 1 skipped (54) |
| 16 | checks.ts:138 | `else if (s.id !== ids[i])` -> `else if (false)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 17 | checks.ts:149 | `=== periodMinutes ?` -> `!== periodMinutes ?` | caught (exit 1) | Tests  6 failed \| 47 passed \| 1 skipped (54) |
| 18 | checks.ts:161 | `p.push('${st.id} is in script ${s.id}')` -> `void 0` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 19 | checks.ts:162 | `p.push('${st.id} twice')` -> `void 0` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 20 | checks.ts:169 | `!step.moved && step.minutes === 0` -> `step.minutes === 0` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 21 | checks.ts:172 | `step.minutes > 8` -> `step.minutes > 9` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 22 | checks.ts:172 | `step.minutes > 8` -> `step.minutes >= 8` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 23 | checks.ts:178 | `periodMinutes > 30` -> `periodMinutes >= 30` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 24 | checks.ts:178 | `periodMinutes > 30` -> `periodMinutes > 31` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 25 | checks.ts:186 | `family < 6` -> `family < 5` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 26 | checks.ts:186 | `family > familyMax` -> `family >= familyMax` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 27 | checks.ts:186 | `teach && (` -> `(` | caught (exit 1) | Tests  2 failed \| 51 passed \| 1 skipped (54) |
| 28 | checks.ts:187 | `w.opening ? [] : ['no opening.pa lines']` -> `[]` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 29 | checks.ts:189 | `tricky > 3` -> `tricky > 4` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 30 | checks.ts:195 | `n > 1` -> `n > 2` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 31 | checks.ts:199 | `bookProblems.push('Level 1 has no decodable')` -> `void 0` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 32 | checks.ts:202 | `readAlong.pages.length !== 8` -> `readAlong.pages.length !== 7` | caught (exit 1) | Tests  5 failed \| 48 passed \| 1 skipped (54) |
| 33 | checks.ts:202 | `level <= 3 ?` -> `level < 3 ?` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 34 | checks.ts:202 | `readAlong.pages.length > 12` -> `readAlong.pages.length > 13` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 35 | checks.ts:205 | `level >= 2 && !decodable` -> `!decodable` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 36 | checks.ts:206 | `bookProblems.push('a read-along is not a sound book')` -> `void 0` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 37 | checks.ts:207 | `decodable.pages.length !== 8` -> `decodable.pages.length !== 9` | caught (exit 1) | Tests  3 failed \| 50 passed \| 1 skipped (54) |
| 38 | checks.ts:210 | `!decodable.soundBook && ` -> `(removed)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 39 | checks.ts:212 | `if (!taught) checks.push(` -> `if (!taught) void (` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 40 | checks.ts:218 | `d.ratio < 0.9` -> `d.ratio <= 0.9` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 41 | checks.ts:218 | `d.ratio < 0.9` -> `d.ratio < 0.8` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 42 | checks.ts:219 | `...(d.untaught.length ?` -> `...(false ?` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 43 | checks.ts:229 | `n < 8` -> `n < 7` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 44 | checks.ts:229 | `n < 8` -> `n <= 8` | caught (exit 1) | Tests  3 failed \| 50 passed \| 1 skipped (54) |
| 45 | checks.ts:236 | `x !== sung[i]` -> `x === sung[i]` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 46 | checks.ts:241 | `sheet.length !== sung.length ?` -> `false ?` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 47 | checks.ts:245 | `!GESTURE_SET.has(l.gesture)` -> `false` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 48 | checks.ts:248 | `l.imageOf >= i` -> `l.imageOf > i` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 49 | checks.ts:248 | ` \|\| !lines[l.imageOf].image` -> `(removed)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 50 | checks.ts:252 | `missing, 'warn'` -> `[], 'warn'` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 51 | checks.ts:264 | `!== step.en[h].length` -> `=== step.en[h].length` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 52 | checks.ts:266 | `lineProblems.push('${step.id}: no Thai character')` -> `void 0` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 53 | checks.ts:270 | `lineProblems.push('benchmark` -> `void ('benchmark` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 54 | checks.ts:291 | `notesMissing \|\| noThai ?` -> `notesMissing ?` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 55 | checks.ts:296 | `days.size !== w.review.length` -> `days.size === w.review.length` | caught (exit 1) | Tests  5 failed \| 48 passed \| 1 skipped (54) |
| 56 | checks.ts:297 | `d <= 5` -> `d <= 4` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 57 | checks.ts:299 | `s.cards.length > 18` -> `s.cards.length > 19` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 58 | checks.ts:300 | `c.week > week` -> `c.week >= week` | caught (exit 1) | Tests  4 failed \| 49 passed \| 1 skipped (54) |
| 59 | checks.ts:305 | `w.check.items.length ? [] : ['no items']` -> `[]` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 60 | checks.ts:306 | `wrongAnswers(w.check.items)` -> `[]` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 61 | checks.ts:307 | `if (!w.home) checks.push(` -> `if (!w.home) void (` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 62 | checks.ts:308 | `w.home.words.length === 3` -> `w.home.words.length === 4` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 63 | checks.ts:322 | `part !== STORYTIME_PRINT_PART && ` -> `(removed)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 64 | checks.ts:324 | `c.status === 'fail'` -> `c.status === 'warn'` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 65 | checks.ts:336 | `all.indexOf(x) !== j` -> `all.indexOf(x) === j` | caught (exit 1) | Tests  2 failed \| 51 passed \| 1 skipped (54) |
| 66 | checks.ts:339 | `item.kind !== 'circle-picture' && item.kind !== 'circle-word'` -> `item.kind !== 'circle-picture'` | caught (exit 1) | Tests  2 failed \| 51 passed \| 1 skipped (54) |
| 67 | checks.ts:341 | `choices.includes(item.answer) ?` -> `true ?` | caught (exit 1) | Tests  3 failed \| 50 passed \| 1 skipped (54) |
| 68 | checks.ts:359 | `blockProblems.push('no block')` -> `void 0` | caught (exit 1) | Tests  2 failed \| 51 passed \| 1 skipped (54) |
| 69 | checks.ts:362 | `d <= 5` -> `d <= 4` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 70 | checks.ts:363 | `n >= w.meta.week` -> `n > w.meta.week` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 71 | checks.ts:364 | `blockProblems.push(` -> `void (` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 72 | checks.ts:366 | `blockProblems.push('day ${d.day}: no review page')` -> `void 0` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 73 | checks.ts:367 | `blockProblems.push(...wrongAnswers(d.paper)` -> `void (wrongAnswers(d.paper)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 74 | checks.ts:369 | `d.day <= 4` -> `d.day <= 5` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 75 | checks.ts:371 | `if (missing.length) blockProblems.push(` -> `if (missing.length) void (` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 76 | checks.ts:374 | `if (!songs.has(t)) blockProblems.push(` -> `if (!songs.has(t)) void (` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 77 | checks.ts:381 | `benchProblems.push('no benchmark')` -> `void 0` | caught (exit 1) | Tests  2 failed \| 51 passed \| 1 skipped (54) |
| 78 | checks.ts:385 | `strip !== ALPHABET` -> `strip === ALPHABET` | caught (exit 1) | Tests  2 failed \| 51 passed \| 1 skipped (54) |
| 79 | checks.ts:386 | `o.letterPass > o.letters.length` -> `o.letterPass >= o.letters.length` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 80 | checks.ts:387 | `o.soundPass > o.sounds.length` -> `o.soundPass >= o.sounds.length` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 81 | checks.ts:388 | `o.blendPass > o.blend.length` -> `o.blendPass >= o.blend.length` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 82 | checks.ts:392 | `benchProblems.push(` -> `void (` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 83 | checks.ts:393 | `benchProblems.push(` -> `void (` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 84 | checks.ts:395 | `benchProblems.push(...wrongAnswers(paper.items)` -> `void (wrongAnswers(paper.items)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 85 | checks.ts:399 | ` \|\| src.title !== rb.title` -> `(removed)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 86 | checks.ts:400 | `benchProblems.push(` -> `void (` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 87 | phonemes.ts:26 | `if (!items.length)` -> `if (false)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 88 | phonemes.ts:52 | `.toLowerCase()` -> `(removed)` | caught (exit 1) | Tests  4 failed \| 49 passed \| 1 skipped (54) |
| 89 | phonemes.ts:53 | `{2,}` -> `{3,}` | caught (exit 1) | Tests  5 failed \| 48 passed \| 1 skipped (54) |
| 90 | phonemes.ts:53 | `{2,}` -> `{1,}` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 91 | phonemes.ts:54 | `if (held) s = held[1];` -> `(removed)` | caught (exit 1) | Tests  5 failed \| 48 passed \| 1 skipped (54) |
| 92 | phonemes.ts:55 | `ALIAS[s] ?? s` -> `s` | caught (exit 1) | Tests  5 failed \| 48 passed \| 1 skipped (54) |
| 93 | phonemes.ts:39 | `ck: 'c-k',` -> `(removed)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 94 | phonemes.ts:40 | `x: 'x-ks',` -> `(removed)` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 95 | phonemes.ts:42 | `qu: 'qu-kw',` -> `(removed)` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 96 | phonemes.ts:65 | `{2,}` -> `{3,}` | caught (exit 1) | Tests  3 failed \| 50 passed \| 1 skipped (54) |
| 97 | phonemes.ts:65 | `/gi)` -> `/g)` | caught (exit 1) | Tests  2 failed \| 51 passed \| 1 skipped (54) |
| 98 | phonemes.ts:87 | `!files[i]` -> `files[i]` | caught (exit 1) | Tests  4 failed \| 49 passed \| 1 skipped (54) |
| 99 | phonemes.ts:88 | `unresolved.push(` -> `[].push(` | caught (exit 1) | Tests  2 failed \| 51 passed \| 1 skipped (54) (rerun; first form was a syntax error) |
| 100 | phonemes.ts:89 | `list ? (files as string[]) : files[0]!` -> `files[0]!` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 101 | phonemes.ts:91 | `if (week.focus.element) add(` -> `if (week.focus.element) void (` | caught (exit 1) | Tests  3 failed \| 50 passed \| 1 skipped (54) |
| 102 | phonemes.ts:94 | `card.kind === 'sound'` -> `card.kind !== 'sound'` | caught (exit 1) | Tests  2 failed \| 51 passed \| 1 skipped (54) |
| 103 | phonemes.ts:100 | `unresolved.push(` -> `[].push(` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) (rerun; first form was a syntax error) |
| 104 | phonemes.ts:101 | `else fields.push(` -> `else void (` | caught (exit 1) | Tests  2 failed \| 51 passed \| 1 skipped (54) |
| 105 | phonemes.ts:105 | `add(` -> `void (` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 106 | phonemes.ts:106 | `one.blend.forEach(` -> `[].forEach(` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 107 | phonemes.ts:128 | `problems.push(` -> `void (` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 108 | phonemes.ts:129 | `!== JSON.stringify(value)` -> `=== JSON.stringify(value)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 109 | phonemes.ts:145 | `if (unresolved.length)` -> `if (false)` | SURVIVED (exit 0) | Tests  53 passed \| 1 skipped (54) |
| 110 | phonemes.ts:148 | `parent[path[path.length - 1]] = value;` -> `(removed)` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |
| 111 | phonemes.ts:150 | `return fields.length;` -> `return fields.length + 1;` | caught (exit 1) | Tests  1 failed \| 52 passed \| 1 skipped (54) |

## Notes

- Each mutant was one textual change on one line, applied by a script, followed by the target vitest run and `git checkout -- <file>`.
- Survivors cluster in three places: the review-week block checks (days 5, weeks not in the block), the Thai line checks (benchmark sitting, no Thai character), and phonemes.ts aliases and error paths (x, qu, two-letter labels, opening unresolved sounds, the setPhonemeAudio throw).
- No source or test file was changed; this report is the only file committed.
