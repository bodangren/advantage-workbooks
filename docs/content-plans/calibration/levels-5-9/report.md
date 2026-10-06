# Calibration of the level 5–9 text profiles

Version 0.1 | Date 2026-10-06 | Track `levels_5_9_20261006`, Phase 1 item "Calibration" | Owner: Daniel Bo | Internal

## 1. Summary

Ten sample texts exist in this folder: one story and one informational or functional text for each of levels 5 to 9. Each text passes its profile in `dashboard/lib/text-profile/check.ts`. The command was `cd dashboard && npx tsx scripts/lint-text-profile.ts ../docs/content-plans/calibration/levels-5-9 --prior ../content/primary/quest-4/src`. Result: 10 lessons, 0 failed checks, 0 warnings (the only book checks, question marks and dialogue, are pending).

The profile numbers are good for good texts, with four small exceptions (section 4). The larger problems are in the checker, not in the profiles (section 5). Six of the ten texts needed an `allow` list to pass the list-share rule. Without it, the checker marked correct past tenses and past participles as off-list words.

The level 9 print test passes: an article of about 480 words in 6 paragraphs, with 3 pictures and the QR code, fits step 3 on 3 pages (section 6).

## 2. Files

| File | Text | Profile |
|---|---|---|
| `l5-story.md` | Pip and the Treasure Map | quest-5 |
| `l5-info.md` | Our Family Page (family page) | quest-5 |
| `l6-story.md` | The Robot in the Rain | quest-6 |
| `l6-info.md` | How to Make a Fruit Salad (instructions) | quest-6 |
| `l7-story.md` | The Creature at Camp | adventure-7 |
| `l7-info.md` | Wild Animals in Our Nature Park (class blog post) | adventure-7 |
| `l8-story.md` | The Photo Competition | adventure-8 |
| `l8-info.md` | An Email to Our Pen-Pal Class | adventure-8 |
| `l9-story.md` | After the Match | adventure-9 |
| `l9-info.md` | Where Does Our Electricity Come From? (science text) | adventure-9 |

Each draft has the 12 glossed words in its front matter. The drafts have no Thai, questions, or pictures. The cast follows plan §8: Tom and Lily with Pip and the Pip family at levels 5–6, and the Adventure Club (Teacher Kim, Mia, Ben, a pen-pal class) at levels 7–9.

## 3. Results

"List share" is the share of running words on the level's list, names and allowed words not counted. "Gloss" is the glossed-word result: words on the level's list (rule: minimum) / words one list above (rule: maximum) / words above that (rule: 0). All 10 texts have 12 glossed words, and all 12 occur in the text.

### Level 5 (`quest-5`: 230–300 words, 3–4 paragraphs, mean 6.5–8.0, longest 14, list share 95%, gloss 8+ Movers, 2 Flyers at most)

| Text | Words | Paragraphs | Mean | Longest | List share | Gloss | Result |
|---|---|---|---|---|---|---|---|
| l5-story | 265 | 4 | 6.97 | 13 | 99.6% | 10 / 2 / 0 | PASS |
| l5-info | 235 | 4 | 7.34 | 12 | 100% | 12 / 0 / 0 | PASS |

### Level 6 (`quest-6`: 270–340, 4 paragraphs, mean 7.0–8.5, longest 15, list share 95% on Flyers, gloss 6+ Movers or Flyers, 1 A2 Key at most)

| Text | Words | Paragraphs | Mean | Longest | List share | Gloss | Result |
|---|---|---|---|---|---|---|---|
| l6-story | 281 | 4 | 7.81 | 14 | 99.2% | 12 / 0 / 0 | PASS |
| l6-info | 275 | 4 | 7.43 | 13 | 99.2% | 12 / 0 / 0 | PASS |

### Level 7 (`adventure-7`: 300–380, 4–5 paragraphs, mean 7.5–9.0, longest 16, list share 95% on Flyers, gloss 8+ Flyers, 2 A2 Key at most)

| Text | Words | Paragraphs | Mean | Longest | List share | Gloss | Result |
|---|---|---|---|---|---|---|---|
| l7-story | 328 | 5 | 8.20 | 14 | 99.3% | 12 / 0 / 0 | PASS |
| l7-info | 328 | 5 | 8.63 | 16 | 99.7% | 12 / 0 / 0 | PASS |

### Level 8 (`adventure-8`: 340–430, 5 paragraphs, mean 8.0–9.5, longest 18, list share 95% on A2 Key, gloss 5+ A2 Key, 1 B1 at most)

| Text | Words | Paragraphs | Mean | Longest | List share | Gloss | Result |
|---|---|---|---|---|---|---|---|
| l8-story | 363 | 5 | 8.25 | 17 | 100% | 9 / 0 / 0 | PASS |
| l8-info | 367 | 5 | 8.95 | 18 | 100% | 10 / 0 / 0 | PASS |

### Level 9 (`adventure-9`: 380–480, 5–6 paragraphs, mean 8.5–10.5, longest 20, list share 95% on A2 Key, gloss 8+ A2 Key, 2 B1 at most)

| Text | Words | Paragraphs | Mean | Longest | List share | Gloss | Result |
|---|---|---|---|---|---|---|---|
| l9-story | 429 | 6 | 8.58 | 18 | 100% | 11 / 0 / 0 | PASS |
| l9-info | 425 | 6 | 10.37 | 18 | 100% | 12 / 0 / 0 | PASS |

Other checks: the "new list words" check (6 or more) passes for all texts (6–12). The recycled-words check passes for all texts (10–25 words). Question marks: every text has 1 or more. The book rule of 2 is a warning only. The last run showed no warning.

The list shares of 99–100% are not real values. They need the `allow` lists (section 5). Before the allow lists, the first drafts measured 93.5–96.3%.

### Which rule was hard to meet, and why

| Text | Hard rule | Why |
|---|---|---|
| l5-story | Mean sentence (first draft 6.33, below 6.5); longest (15, then 13) | A story with much dialogue has many short sentences ("Pip, come back!"). Joining sentences with "and" fixed it. |
| l5-info | Words (first draft 201, minimum 230) | A family page lists short facts. It needed 30 more words. |
| l6-story | Longest (16, maximum 15); words (259, minimum 270) | The same cause as l5-story. |
| l6-info | Gloss above A2 Key; words; longest | The first topic, a paper boat, needs *fold*, *edge*, *float*, *smooth*: they are B1 words (PET). The topic changed to a fruit salad, where the needed words are Flyers words (*strawberry*, *yoghurt*, *honey*, *knife*, *spoon*). *Finally* is an A2 Key word, but plan §5 needs it for 6.2. |
| l7-story | List share (94.6%) | The present perfect needs past participles (*been*, *seen*, *eaten*, *slept*, *brought*). The checker does not know them (section 5). Natural words like *nobody*, *nearly*, *check*, *pack* are A2 Key, not Flyers. |
| l7-info | Mean (9.86, maximum 9.0); words (286); list share (93.9%) | A fact text has long sentences with lists. The words *ant*, *bone*, *protect*, *tiny*, *nature*, *blog* are above Flyers. |
| l8-story | Words (306) and mean (7.65) | Level 8 needs 340 words. A story with dialogue needed extra longer sentences with *because*, *so*, *while*. The mean is 8.09 at the end, near the minimum 8.0. |
| l8-info | Paragraphs (8), digits (1), words, mean | An email has a subject line, a greeting, and a closing. The checker counted each as a paragraph, and a line without a full stop joined the next sentence (one sentence of 27 words). The class name "6B" counted as a digit. I wrote the greeting and the closing inside the first and last paragraph, with full stops. |
| l9-story | Gloss in text (*upset*); mean (8.58, minimum 8.5) | The story must not state the feeling, but the glossed word must occur. I put *upset* in a question that Tom denies. A dialogue story stays near the minimum mean. |
| l9-info | Mean (10.51, maximum 10.5); digits; B1 words | Science facts need long sentences and B1 words (*coin*, *pipe*, *product*, *shine*, *switch*, *thick*, *tiny*). The year "1800" counted as a digit. I wrote it as words. |

## 4. Recommended profile changes

Each change is small. A good story ranks above an exact number (Daniel's rule). The numbers below are what a good text measured.

| # | Profile | Now | Proposal | Evidence |
|---|---|---|---|---|
| P1 | `quest-5` mean sentence | 6.5–8.0 | 6.2–8.0 | The first draft of a dialogue story measured 6.33 and 6.40. After joining sentences it was 6.97, but it needed three edits. The texts at 6.3–6.4 were good stories. |
| P2 | `quest-6` words | 270–340 | 260–340 | An instruction text measured 255–268 for a natural length. It reached 275 only by added sentences. The story measured 259 at first. |
| P3 | `adventure-8` mean sentence | 8.0–9.5 | 7.8–9.5 | A dialogue story measured 7.65, then 8.09 after added clauses. |
| P4 | `adventure-9` mean sentence | 8.5–10.5 | 8.3–10.5 | The story measures 8.58. The science text measures 10.37 and reached 10.51 in the first draft. The range is wide enough for both after this change. |
| P5 | `adventure-8` `newStartersMin` | 6 | 5 | The glossed minimum is 5 A2 Key words (plan §5), but the new-word target is 6. The two numbers disagree. The target is a warning only. Use 5 for both. |
| P6 | Level 7–9 list share | 95% | keep 95% | It was met only with `allow` lists of 6–16 words. Do not tighten it. Instead, fix the checker (section 5), and then measure again. |

No change is needed for: words at levels 5, 7, 8, 9 (texts measured 235–265, 328, 363–367, 425–429, inside each range); paragraphs; longest sentence (texts measured 12–18 against 14–20); the glossed-word counts. The level 9 ceiling of 480 words is possible for print (section 6). The texts of the middle (425–430) are enough.

A note on plan §5 for level 6: the glossed rule "6+ Movers or Flyers, 1 A2 Key at most" was easy to meet. All 12 glossed words of each level 6 text were Movers or Flyers words.

## 5. Checker faults found (not profile numbers)

I did not edit any code. The faults below need a fix by the lead. Each fault makes a correct text fail, or hides a real fault.

| # | Fault | Evidence | Effect |
|---|---|---|---|
| C1 | `IRREGULAR` in `dashboard/lib/text-profile/text.ts` has no entry for many past tenses and past participles: *heard, fell, stood, felt, began, knew, brought, bought, met, woke, forgot, slept, thought* (a PET word), *been, seen, eaten, taken, given, written, chosen, built, sold, lying*. The graph has no entry for *been* or *felt* either. | `heard`, `fell`, `stood`, `been`, `seen` appeared as "not in graph" or as PET words. | The past simple (level 5) and the present perfect (level 7) use these forms in almost every text. The list share fell by 1–3 points. I used `allow` as a workaround. |
| C2 | The suffix rules do not turn *-ied* into *-y*, or *-ier / -iest* into *-y*. | *carried, studied, funniest* not found. | The same effect as C1. |
| C3 | A hyphenated word such as *grown-up* is split into two tokens when it is not glossed. | `l6-info` first draft: "grown" off the list. | Rare. Avoid or gloss the word. |
| C4 | A line without final punctuation (a subject line, a greeting, a closing) joins the next sentence. A greeting and a closing also count as paragraphs. | `l8-info`: 8 paragraphs, a sentence of 27 words. | An email text needs the subject, greeting, and closing inside the first and last paragraph, with full stops. Put this rule in `AUTHORING.md`. |
| C5 | Fixed phrases of the list work only when the phrase is in the graph. *Turn on* is a Flyers phrase, but *switch on* is not. | `l9-info`: *switch* counted as PET. | None, but writers should know. |
| C6 | Words with no graph entry count as off the list: *gas, bark, wag, deer, bug, panel, baht, daytime, goalkeeper*. | The reports list them as "not in graph". | A science or nature text needs 5–15 such words in `allow`. |
| C7 | The text type decides the vocabulary. Craft instructions (fold a paper boat) need B1 words. The glossed rule "nothing above A2 Key" cannot be met. | `l6-info` first draft: 5 words above A2 Key. | Plan the 6.2 instruction texts as recipes, shopping, or a game with Flyers words. Choose the topic from the word list first. |

## 6. Print test (level 9, step 3 "Read the Article")

**Result: it fits. The article takes 3 pages, and the pictures, the QR code, and all 6 paragraphs show in full.**

Method. I copied `content/primary/quest-4/l01.json` to the scratch folder (`/tmp/claude-1000/.../scratchpad/calibration/pt/`). I replaced `text.paragraphs` with the 6 paragraphs of `l9-info`, with 66 more words in paragraph 3. That made 6 paragraphs and about 480–490 words (my regular-expression count is 491; the profile check counts fewer tokens). The pictures are the three Quest 4 pictures, linked by a symbolic link in the scratch folder. Nothing was written under `content/primary`. I rendered the package with `dashboard/scripts/render-lesson-html.ts` (series "Adventure", level "A2+"). I then removed the remote Paged.js tag and printed to PDF with Chrome and Playwright, with Paged.js laid out first and "Background graphics" on. This is the same method as `scripts/print/make-lesson-pdfs.ts`. I made the same print of the unchanged Quest 4 lesson 1 for comparison.

| Item | Quest 4 lesson 1 (about 210 words, 3 paragraphs) | Level 9 test (about 480 words, 6 paragraphs) |
|---|---|---|
| Pages of the whole lesson | 15 | 16 |
| Step 3 header and QR code | page 3 | page 3 |
| Article text and pictures | page 4 (1 page) | pages 4, 5, and the top half of page 6 (about 2.5 pages) |
| Step 4 starts | page 5 | page 6, under the article |
| Pictures | 3 | 3 (hero on page 4, one on page 4, one on page 5) |

Findings.

1. The text fits. The paragraph numbers 1–6 are in order, no paragraph breaks across a picture, and the three pictures wrap correctly. The marking legend, the QR code, and step 4 are unharmed.
2. The whole lesson grows by one page (15 to 16). The answer key stays on the last page.
3. An old layout fault shows more now. The step 3 header and the QR box stay at the bottom of page 3, and the article starts on page 4. About 45% of page 3 is empty. Quest 4 has the same fault. The cause is the `.read-article-step` rules in `dashboard/templates/primary_template.html` (lines about 1234–1350): the header and the QR box are kept with the article container, which does not fit the rest of page 3. Proposal: let step 3 start on a new page (`break-before: page`), so the header, the QR code, and the first paragraph share page 4. The article then needs about 2.5 pages from the top, and step 4 would still share the last article page. This is a template change; it needs Daniel's review of the page count of all levels. It is not needed for level 9 to work.
4. The font is 17 px with line height 2.2. This is the reason for 2.5 pages. A text of 480 words is the practical limit for 3 pages with 3 pictures. A text of 430 words (the middle of the profile) needs about 2.2 pages.
5. I did not check the Thai sentence pages and the teacher-manual pages. They use other templates.

Files for the lead: `pt/test2.pdf` and `pt/test2.html` (level 9), `pt/base/t2.pdf` (Quest 4 comparison), and `pt/pdf.cjs` (the print script) are in the scratch folder `/tmp/claude-1000/-home-daniebo-Desktop-Workbooks/a14443fe-2138-434b-b175-560a3af26bdc/scratchpad/calibration/`.

## 7. Limits of this calibration

- Ten texts are a small sample. Each level has one story and one informational text.
- Grammar was checked by eye against `data/grammar-levels-5-9.md`; the checker has no grammar rule. The texts use: past simple, comparatives, superlatives, *have to* (level 5); past continuous, *be going to*, *will*, *might*, *should*, *first / then / next / finally*, *can / can't* (level 6); present perfect with *ever, never, just, already*, *before / after*, *be made of*, *look / sound like* (level 7); first conditional, *for / since*, *too*, *a few*, present continuous for arrangements, *whose*, *while*, *would* (level 8); passive, *says that*, gerunds, *however* (level 9).
- The stories were written by the same author. A second author could find other hard rules.
- The `allow` lists hide real off-list words. After the checker fixes C1 and C2, run the check again without most of the `allow` entries.
