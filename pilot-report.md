# Pilot report: Storytime checks review (report only)

- Base SHA: `cc7808c541ca1cac810a7cd74f34520f748aef5b`
- Branch: `pilot/cloud-wb-storytime-checks-review`
- Date: 2026-11-03
- Scope read: `dashboard/lib/storytime/schema.ts`, `checks.ts`, `phonemes.ts`, `manual.ts` (with `i18n.ts` for the labels that `manual.ts` prints), and `content/storytime/l2/w01.json` to `w08.json`.
- This review changed no file except this one. It used no secrets, no `.env` file, no paid generation, and no network call except `git fetch` and `npm ci`.

## Commands and exit codes

| # | Command | Exit | Note |
|---|---|---|---|
| 1 | `git fetch origin cc7808c541ca1cac810a7cd74f34520f748aef5b` | 0 | |
| 2 | `git checkout -b pilot/cloud-wb-storytime-checks-review cc7808c…` | 128 | The branch already existed (local and `origin`), at the base SHA. |
| 3 | `git checkout pilot/cloud-wb-storytime-checks-review && git reset --hard cc7808c…` | 0 | HEAD = base SHA (the reset changed nothing). |
| 4 | `cd dashboard && npm ci` | 0 | |
| 5 | `npx vitest run __tests__/storytime-week.test.ts __tests__/storytime-phonemes.test.ts __tests__/storytime-manual.test.ts __tests__/storytime-phonics.test.ts` | 0 | 4 files, 76 passed, 1 skipped (77). |
| 6 | `npx tsx <scratch>/all.ts` (runs `checkStorytimeWeek` with `taughtTo` and the other weeks, and `phonemeAudioProblems`, on w01–w08) | 0 | Results under "Counts". |
| 7 | `npx tsx <scratch>/probes.ts` (one in-memory mutation of a shipped week per finding; nothing is written to disk) | 0 | Output is quoted under each finding. |
| 8 | `python3` summaries of the eight weeks (scripts, steps, strips, checks, frames, approvals, materials) | 0 | |

The scratch scripts were in the session scratchpad and are not committed. I found no separate "mutation task" test suite at this SHA. To test each finding, I mutated a shipped week in memory (command 7).

**Could not run:** `readPhonicsGraph()` returned `undefined`, because the sibling repo `../mastery-advantage` is not in this container. So the decodability check ran in its letter-spelling mode, not the phonics-graph mode. The graph-mode results are not covered here.

## Counts

- Weeks parsed: 8 of 8 (no schema failure).
- Storytime tests: 76 passed, 1 skipped, 0 failed.
- `checkStorytimeWeek` on the shipped weeks:

| Week | Checks | Pass | Warn | Fail | Not passing |
|---|---|---|---|---|---|
| st2/1 | 29 | 27 | 1 | 1 | warn song-sheet; **fail published** (images, audio, song not approved) |
| st2/2 | 24 | 22 | 2 | 0 | warn song-sheet, print-missing |
| st2/3 | 24 | 22 | 2 | 0 | warn song-sheet, print-missing |
| st2/4 | 24 | 23 | 1 | 0 | warn print-missing |
| st2/5 | 24 | 22 | 2 | 0 | warn song-sheet, print-missing |
| st2/6 | 24 | 22 | 2 | 0 | warn song-sheet, print-missing |
| st2/7 | 24 | 22 | 2 | 0 | warn song-sheet, print-missing |
| st2/8 | 16 | 15 | 1 | 0 | warn print-missing |

- Phoneme-audio problems (`phonemeAudioProblems` against the 45-sound bank): 0 in every week.
- Findings: 14 in total: 2 high, 5 medium, 7 low.

## Findings

Format: `file:line | severity | text`, then a minimal example.

### High

**1.** `dashboard/lib/storytime/checks.ts:33 | high | frameCount lets the ___ slot start inside the word before it (the separator is ' ?'), so a line without the frame counts. The shipped week 6 (content/storytime/l2/w06.json:64, frame "I can see a ___.") passes "The frame 8 or more times in the song" with 9. Only 6 of its lines have "I can see a <word>". The other 3 are "I can see an animal!", which matches as "a" + "n animal".`

```ts
frameCount('I can see a ___.', ['I can see apples', 'I can see Anna', 'I can see all of it']) // 3, expected 0
frameCount('It is ___.', ["It isn't red"])                                                 // 1, expected 0
// w06 with its 12 song lines replaced by 8 copies of "I can see apples!" -> song-frame: pass
// shipped weeks, frameCount vs a whole-word match: st2/1 8/8, st2/2 9/9, st2/3 9/9, st2/4 10/10,
// st2/5 12/12, st2/6 9/6 (below 8), st2/7 10/10
```

Fix sketch: join the parts with `' [a-z0-9]+(?: [a-z0-9]+){0,2} '`, with a required space on both sides, and trim the empty ends.

**2.** `dashboard/lib/storytime/checks.ts:210 | high | Any decodable with "soundBook": true skips the decodability check entirely, in any week and any level. The schema (schema.ts:159-163) says only Level 2 week 1 may be a sound book, but no check enforces that. Only w01.json:786 uses it today, which is correct.`

```jsonc
// w03.json, decodable book, with page 1 changed:
{ "kind": "decodable", "soundBook": true, "title": "The Pan",
  "pages": [{ "text": "The zebra quickly jumped over the fence." }, ...] }
// Without soundBook: decodable FAIL (88 percent of 43 words; untaught: zebra, quickly, jumped, over, fence)
// With soundBook: true: the decodable check is absent, books pass, 0 fails
```

### Medium

**3.** `dashboard/lib/storytime/checks.ts:300 | medium | The review-strip rule "only items already taught" trusts the card's own "week" field. An untaught item labelled with an earlier week passes. The check never compares the card with the taught graphemes or tricky words (taughtTo).`

```jsonc
// w02.json review[0].cards, two cards added:
{ "kind": "sound", "text": "t", "week": 1 }       // t is taught in week 6
{ "kind": "tricky", "text": "from", "week": 2 }   // from is taught in week 7
// -> review: pass
```

**4.** `content/storytime/l2/w01.json:43 | medium | Week 1 is "status": "published", but its images, audio, and song approvals are "draft" (lines 15, 18, 21). The published check correctly FAILs it: this is the only FAIL across the eight weeks. The file claims a state that its own rule forbids. Any consumer that reads meta.status without running the check would treat the week as public.`

```jsonc
"approval": { "images": { "status": "draft" }, "audio": { "status": "draft" }, "song": { "status": "draft" } },
"meta": { "status": "published" }
// -> published: fail (images not approved; audio not approved; song not approved)
```

**5.** `dashboard/lib/storytime/manual.ts:211 | medium | The sound game replaces opening item 2 instead of being added to the list. openingSteps[1] is "Calendar: the day and the weather. One child points." (i18n.ts:117 en, i18n.ts:223 th), so every day of every week that has opening.pa loses the calendar line. In review weeks, the medley also replaces "Song of the week" (index 2). That second replacement looks intended; the calendar loss does not. The schema calls the sound game "opening item 2" (schema.ts:516), so either the label list or the index is stale.`

```ts
renderStorytimeWeek(w02, 'en')  // "Calendar:" 0 occurrences, "Sound game (1 min)" 5 occurrences
renderStorytimeWeek(w08, 'en')  // "Calendar:" 0, "Song of the week" 0
```

**6.** `dashboard/lib/storytime/manual.ts:206 | medium | Every moved step of day N prints on day N+1 under "Recall from the last lesson (1 min each, inside the opening)" (i18n.ts:124). That includes the 0-minute home-time steps that schema.ts:255 describes as taking no class time, so the manual repeats them as one-minute recalls. In weeks 1–7: A8 "Home card" (0 min) prints as a recall on day 2, B7 "Sing it" (0 min) on day 3, and D6 "Sing it: song show" (0 min) on day 5. Day 2's header says "Opening routine (6 min, incl. 1 min recall)" but lists two "1 min each" items (A7 and A8). A recall step of more than 1 minute is also not flagged anywhere, though the label promises 1 minute.`

```jsonc
// w02.json:2445, script A:
{ "id": "A8", "title": { "en": "Home card" }, "minutes": 0, "moved": "next-opening" }
// -> day 2 recall group contains "A8 · Home card"; header "incl. 1 min recall"
```

**7.** `dashboard/lib/storytime/phonemes.ts:51 | medium | bankSound normalises the same sound in two different ways, depending on how it is written. The ALIAS table (phonemes.ts:31-43) maps the letter but not the IPA-style label, and the held-sound rule turns any held vowel into its short vowel.`

```ts
bankSound('x') === bankSound('/x/') === '/x-ks/'   but bankSound('/ks/') === '/ks/'   // not in the bank
bankSound('qu') === bankSound('q') === '/qu-kw/'   but bankSound('/kw/') === '/kw/'   // not in the bank
bankSound('/ee/') === '/ee/'                       but bankSound('eee') === '/e-short/'
bankSound('/oo/') === '/oo/' (not in the bank)     but bankSound('ooo') === '/o-short/'
bankSound('/th/') === '/th/'                       // the bank has only /th-voiced/ and /th-unvoiced/
```

This is latent in w01–w08 (0 phoneme problems), but it will show up from the x, qu, ee, and th weeks onward.

### Low

**8.** `dashboard/lib/storytime/phonemes.ts:65 | low | soundLabels finds held sounds only when they are one repeated letter, so a held digraph ("shhh") is silently skipped. That day's opening.audio then has fewer recordings than the line has sounds, and nothing is reported as unresolved. bankSound('Shhh') returns '/shhh/'.`

```ts
soundLabels('Listen: shhh - /i/ - /p/. Ship!')  // ['/i/', '/p/']: 2 labels for 3 sounds
```

**9.** `dashboard/lib/storytime/checks.ts:332 | low | check-answers (applied at checks.ts:306) verifies only that the answer is one of the pictures. schema.ts:303 says exactly one picture has the sound, and nothing checks that, so an item with two right answers passes.`

```jsonc
{ "kind": "circle-picture", "sound": "/a/", "pictures": ["apple", "ant", "dog"], "answer": "apple" }
// -> check-answers: pass
```

**10.** `dashboard/lib/storytime/checks.ts:248 | low | Off-by-one in the message: the line number is 1-based (i + 1), but imageOf is printed as its raw 0-based index. "line 7 imageOf 2" actually means line 3.`

```
w06, line 3 set to imageOf 2 with no image -> "line 3 imageOf 2: …; line 7 imageOf 2: …; line 11 imageOf 2: …"
```

**11.** `dashboard/lib/storytime/checks.ts:300 | low | A strip card's week has no level (schema.ts:285), but the check compares it with the week number of the current level. A Level 3 week that reviews a Level 2 item therefore fails, so the review strip cannot cross a level boundary. The check should compare programWeek values.`

```jsonc
// meta.level 3, week 1; strip card { "kind": "sound", "text": "o", "week": 7 }  (Level 2 week 7)
// -> review: fail (day 2: "o" is from week 7)
```

**12.** `dashboard/lib/storytime/manual.ts:259 | low | The record sheet computes "written" as all paper items minus the circle items. A picture-sort item is therefore counted under "Paper: letters", and circle-word items count under "Paper: pictures". This is latent: the w08 benchmark has 8 circle-picture and 7 write-letter items, which matches its pass text "6 of 8 pictures and 5 of 7 letters".`

```jsonc
// w08 benchmark.paper.items + { "kind": "picture-sort", "groups": [ {"sound":"/s/","pictures":["sun"]}, {"sound":"/t/","pictures":["ten"]} ] }
// -> columns "Paper: pictures /8", "Paper: letters /8" (7 letters + 1 sort)
```

**13.** `dashboard/lib/storytime/schema.ts:116 | low | family.max is bounded 8 to 10 (default 8), but w08.json:54 has 18 family words with no max. The check skips the family rule in review weeks (checks.ts:186), so neither the schema nor the check ever sees the contradiction. The schema bounds max but never the length of words.`

```jsonc
"family": { "name": {...}, "words": [ /* 18 entries */ ] }   // parses; no check runs
```

**14.** `dashboard/lib/storytime/checks.ts:206 | low | Because of the else-if, marking the read-along as a sound book suppresses the decodable page-count check. The week still fails ("a read-along is not a sound book"), but the second problem is hidden until the first is fixed. The same file has a related latent gap: mergeMaterials (manual.ts:146) keys items case-sensitively, so "Picture cards: nest, net" and "picture cards: net" print "net" twice. The shipped weeks have 0 case variants.`

```jsonc
// readalong { "soundBook": true }, decodable with 3 pages -> books: only "a read-along is not a sound book"
```

## Checked and found sound

- Script order and days (checks.ts:132-140): duplicate or missing days are reported, and the script id matches the level order.
- Minutes: in all 40 scripts, 6 + the minutes of the steps that are not moved = 30. No in-period step has 0 minutes.
- Day indexing: `opening.pa[s.day - 1]` (manual.ts:209), strip lookup by `day`, and the phoneme field paths use array indices consistently. Sorting before recall (manual.ts:198, 206) handles scripts that are out of order.
- programWeek: (level − 1) × 32 + week; Level 2 week 1 = 33. This agrees with meta.week max 32.
- Review week (w08): the block covers weeks 1–7 on days 1–4, every medley title is a block song, the 6 reading-record texts match the decodables of weeks 2–7, the 26-letter strip is complete, and the pass marks fit within their counts (20/26, 6/7, 3/4).
