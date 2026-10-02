# How to write a Primary Advantage lesson file

Version 1.1 | Date 2026-10-02 | Status: Active | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

Track: `level_banks_20261002`. This guide is for every writer (Claude or a subagent) of a workbook lesson (Origins 1, Origins 3.2, Quest 4) or a bank article (`bank-1` … `bank-4`). Write all lesson content yourself. Do not call any other AI model or the Primary app's generator.

## 1. What you write

One text file per lesson: `content/primary/<book>/src/<lesson>.md`. The converter makes the package `content/primary/<book>/<lesson>.json` from it and checks it:

```
cd dashboard && npx tsx scripts/author-package.ts ../content/primary/<book>/src/<lesson>.md
```

Repeat until the result is `PASS`. A `FAIL` blocks Daniel's approval. A `WARN` is acceptable. Write only your own files. Do not edit any `.json` package by hand, do not run the media scripts, and do not commit.

A finished example: `content/primary/_examples/bank-example.md` (a level-3 bank article; its `replaces` id is only an example).

## 2. The format

```
---
title: The Kite in the Park
level: 3
replaces: cmp9wq910001as601kimrx763      (from the plan; leave the line out for a new article)
type: fiction                            (fiction or nonfiction: the app's article type)
text_type: story                         (from the plan, e.g. "functional: signs and notices")
genre: Toys & Play                       (a short topic name, e.g. "Animals", "Food & Drink", "School")
names: Tom, Lily, Pip                    (every name in the text)
glossed: kite, fly, tail, …              (exactly 12, in the order of the Glossary section)
recycle: ball, red                       (workbook lessons: glossed words of earlier lessons that you use; optional)
allow: Monday, o'clock                   (words above the list that the text needs; keep it short; optional)
objectives: L19.2, R17.2, R21.2          (the plan's targets)
supporting: R10.2                        (optional)
voice: female                            (female, or male when a boy or a man tells the story)
summary: Tom and Lily fly a kite in the park. The kite goes into a tree, and Pip finds it.
summary_th: ทอมกับลิลลี่เล่นว่าวในสวนสาธารณะ …
---

## Text
Tom and Lily are in the park with Pip. | ทอมกับลิลลี่อยู่ในสวนสาธารณะกับปิ๊ป
They have a big yellow kite. | พวกเขามีว่าวสีเหลืองตัวใหญ่
                                         (a blank line ends a paragraph: exactly 3 paragraphs)
…

## Glossary
kite | noun | A toy that flies in the sky on a long string. | ว่าว
…                                        (12 lines: word | part of speech | definition | Thai)

## MCQ
m1 | What color is the kite? | *yellow | blue | green | red | They have a big yellow kite. | R17.2, L19.2
…                                        (10 lines: id | question | 4 options, * on the answer | evidence | objectives)

## SAQ
s1 | What color is the kite? | The kite is yellow. | R17.2
…                                        (5 lines: id | question | model answer | objectives)

## LAQ
l1 | Do you like to fly a kite? Why or why not? | L12.1
…                                        (5 lines: id | question | objectives)

## Images
hero | Tom, Lily, Pip | Tom runs on the grass in a sunny park … | Tom and Lily fly a kite.
inline-para-2 | Lily, Tom | … | The kite is in a tall tree!
inline-para-3 | Pip, Tom, Lily | … | Good dog, Pip!
                                         (3 lines: position | characters or - | prompt | caption | overlay text ; overlay text)
```

Workbook lessons (not bank articles) add two sections:

```
## Print
mcq: m1, m3, m6, m8              (4 MCQ for the page; 2 or more test a target objective)
saq: s1
hint: I have a ___.              (a frame for the short answer; optional)

## Activities
starters: My kite is ... ; I can see ... ; Pip likes ...
fill: Tom has a big ___ kite. = yellow ; Pip sits ___ the tree. = under ; … (4 items, ___ marks the gap)
order: Tom and Lily are in the park. ; Lily catches the kite.      (2 full sentences from the text)
completion: I like to ... ; My favorite toy is ... ; In the park, I ...   (3 prompts)
writing: Write about your favorite toy.
frames: My toy is ___. ; It is ___. ; I play with it in the ___.  (2 or 3 frames)
```

Rules of the format:
- One sentence per line in `## Text`, then ` | `, then its Thai. Never put `|` in a sentence.
- The check counts sentences, not lines: a line also splits after `.`, `!`, or `?` when a capital letter or a quotation mark follows. `"Clap, clap! One, two, three!"` is 2 sentences; `"Where is Pip?" says Tom.` is 1. To raise the mean sentence length, join short sentences with a comma or `and`. To lower it, split a sentence.
- Evidence: copy the exact sentence from the text, or write `@N` (sentence N of the whole text) or `@P.S` (paragraph P, sentence S).
- Glossary examples are found in the text for you. If the converter says a word is not found, add the sentence as a fifth field.
- The converter shuffles the MCQ options. Write the answer anywhere and mark it with `*`.

## 3. Level profiles (the check tests them)

| Profile | Book | Words in 3 paragraphs | Mean sentence | Longest | Running words on the list | Glossed (12) | Question marks |
|---|---|---|---|---|---|---|---|
| `origins-1`, `bank-1` | level 1 (A0-) | 80–120 | 3.0–4.2 | 7 | Starters 95% | 11+ Starters, 1 Movers max | 1+ |
| `bank-2` | level 2 (A0) | 120–175 | 3.6–4.8 | 8 | Starters 95% | 10+ Starters, 2 Movers max | 1+ |
| `origins-3.2` | level 3 (A0+) | 150–200 | 5.0–5.5 | 10 | Starters 95% | 10+ Starters, 2 Movers max | 2+ (book rule) |
| `bank-3` | level 3 (A0+) | 150–200 | 4.8–5.8 | 10 | Starters 95% | 10+ Starters, 2 Movers max | 1+ |
| `quest-4`, `bank-4` | level 4 (A1-) | 190–250 | 5.6–7.0 (bank 5.4–7.2) | 12 | Starters + Movers 95% | 7+ Movers, 1 Flyers max | 2+ (bank 1+) |

"Running words on the list" does not count names, the glossed words, or the `allow` words. Word lists: `docs/content-plans/data/yle-starters-words.md` and `yle-movers-words.md` (the numbers one to twenty are Starters words). The check prints every word that is off the list. Change those words, or (rarely) put a needed word in `allow`.

Every word that a level-1 to level-3 text needs is easy to replace with a Starters word. Common traps (above Starters): up, down, all, everyone, when, only, near, around, bad, laugh, little, help, first, next, together, time, buy, money, party, present, afraid, brave, kind, puppy, sign, market, Monday–Sunday, week, dear, soon, finish, ready, away, touch, feed, sky, high, rain, windy, fast, over, pull, tall, leaf, slowly, after, into, why, feel, lost. Use: "Stand, please." / "the children" / two short sentences / "next to" / "not good" / "smile" / "small" / "Can you find it?" / "Then" / "Tom and Lily" / "Here you are." / "happy" / "Pip" or "dog" / "It says: …". Level 4 uses Movers words freely; its traps are Flyers and Key words (race, quarter, half, past, timetable, cut, glue, middle, notice, lost, title, report, use, shelf, skating) and common words that are on no list (heavy, dark, soft, side, together, feel, ready, bench, paw, hug, poor, each, yet, other, math, art, time, welcome, also, turn, left). The tens (thirty to ninety) are on no list: put them in `allow`. Accents are removed before the check ("café" is "cafe", a Key word).

## 4. Writing rules (all levels)

- **Story world:** `docs/content-plans/primary-origins-series-bible.md`. Pip is a small brown puppy with a red collar. He lives with Tom (9) and Lily (7), Mom, and Dad, in a house near the park. He says "Woof!" and does not talk. Other cast: Mia (7, Lily's best friend, next door, loves animals), Ben (9, Tom's classmate), Leo (7, Lily's classmate, funny, silly clothes), Sam (8, neighbor, plays at the pond), May (new girl in Lily's class, 7–8, white house next to the school), Pat (5, May's brother), Teacher Kim (Lily's teacher), Grandma and Grandpa (near the family; Grandpa likes fishing), Squeaky (a small mouse in the garden). Level 4 (Quest 4 and bank-4): every child is one year older.
- New names come only from the Starters list: Alex, Alice, Ann, Anna, Ben, Bill, Dan, Eva, Grace, Hugo, Jill, Kim, Lucy, Mark, Matt, May, Nick, Pat, Sam, Sue, Tom.
- All people are Thai; Thai home and school life is the default (shoes off at the door, rice at dinner, school line-up). No brand names, no real people, no religious holidays as a family's own practice, no prizes or winners as the point.
- Short declarative sentences; real questions; dialogue in double quotation marks; one short closing line with a feeling or a value. Vary the first line; do not start every text with "This is …".
- Numbers as words ("twelve"). Full hours at levels 1–3 ("seven o'clock"). American spelling (color, favorite, Mom, gray).
- Nonfiction (`type: nonfiction`) is a real information or functional text: a description, signs, a routine, instructions, a list. It can have a child narrator.
- A good text comes first. Never bend a story to fit a count: fix the count with other words.
- Each article must be new and different from the others in your batch: a new situation, not the same story with new words.

## 5. Glossary, Thai, and questions

- **Glossary:** the 12 glossed words, each with a part of speech (noun, verb, adjective, adverb, preposition, phrase, number, exclamation), a definition in very easy English (Starters words; level 4 can use Movers), and the Thai meaning (one or two words, as in a children's dictionary; add a short note in brackets when a word has more than one meaning).
- **Thai:** natural, simple Thai for Thai children, sentence by sentence. Keep names in Thai script: ทอม (Tom), ลิลลี่ (Lily), ปิ๊ป (Pip), มีอา (Mia), เบ็น (Ben), ลีโอ (Leo), แซม (Sam), เมย์ (May), แพท (Pat), ครูคิม (Teacher Kim), คุณยาย (Grandma), คุณตา (Grandpa), แม่ (Mom), พ่อ (Dad), สควีกี้ (Squeaky). Dialogue keeps its quotation marks. Daniel checks all Thai himself.
- **MCQ (10):** each tests one fact or skill of the text; 4 options of the same kind and similar length; exactly one correct; the evidence sentence proves the answer. At least 5 of the 10 carry a target objective. Use easy words in questions and options.
- **SAQ (5):** short questions with a one-sentence model answer. Two of them can be personal ("What color is your bag?" → "My bag is blue.").
- **LAQ (5):** open questions for a longer answer (an opinion, a personal story, a "what if"). Level 1–2 LAQs stay very short ("Draw your favorite toy. What color is it?").
- Tag every question with one or more objective ids from `docs/content-plans/data/a0-objective-key.json` (levels 1–3) or `a1-objective-key.json` (level 4). Use only ids that exist there.

## 6. Pictures

- Three lines: `hero`, `inline-para-2`, `inline-para-3`. Each shows a different moment of the text.
- `characters`: the cast names in the picture (series bible names: Pip, Tom, Lily, Mia, Ben, Leo, Sam, May, Pat, Teacher Kim, Mom, Dad, Grandma, Grandpa, Squeaky), the main one first; `-` for none. The character sheets fix their looks, so do not describe the cast's looks.
- A person who is not in the cast: describe age, hair, and every clothing item with its color. Never describe skin, race, or nationality. The words thai, asian, western, american, chinese, japanese, korean, indian, european, african, ethnic, race, skin, and complexion fail the check, even in "Thai school uniform": write "a white school shirt and dark blue shorts (or skirt)".
- The model cannot draw text. Text that must show (signs, a book title, a notice, a clock face as words) goes in the overlay field: `overlay text ; second text`. The prompt describes a blank sign or board in the right place.
- Prompts describe the action, the place, and the light. One scene per picture. No words in the prompt like "photo" or "3D".

## 7. Batches with a plan

Bank plans: `docs/content-plans/level-plans/bank-<level>.md` (one row per article: the lesson file, the old id it replaces, the text type, the targets, the topics, and the required glossed words). Workbook plans: `docs/content-plans/primary-origins-1-plan.md`, `primary-origins-3.2-lesson-briefs.md`, `primary-quest-4-plan.md`.

- Use the plan's `replaces` id, text type, app type, and target objectives.
- Gloss all the plan's required words. When a word cannot fit a good text, you can swap up to two of them for other words of the same topic and level.
- Choose the other glossed words from the level's list (level 4: 7 or more from Movers).
- Fill `genre` with a short topic name; it shows in the app.

## Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-02 | First version |
| 1.1 | 2026-10-02 | How the check counts sentences; level-4 word traps; accents (from the first writer reports) |
