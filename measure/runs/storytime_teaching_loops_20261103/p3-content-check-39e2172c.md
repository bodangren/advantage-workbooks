# Phase 3 content check: storytime teaching loops (Level 2, w01-w08)

Track: `storytime_teaching_loops_20261103` (A-42). Baseline: 23ad4cf85a151564da7e2b2ce76344e6143b49ab.
Checker: Kimi K2.8 (independent of the maker, Claude Sonnet). Scope: English, Thai, questions, recall, minutes, approvals, and week-to-week consistency. The additive-only diff and the six loop checks were proven by the orchestrator and are not repeated here.

Commits:
- w01 a4bd63617e8f18ba1fd0daa80c550315ae98792b
- w02 6addeaeb44466c9611d3399cd20e038066e7b87f
- w03 f3f5dfedb577ba76f6adbe72ddfa283d8acc04dc
- w04 c20fe2bc7584ab3cb06006e77e832f1be82e2f37
- w05 aa4a66e349f4f1aa4911735592ba039e772eceb2
- w06 072fb09a1412faf0ede3a08f8716c4c851caaa67
- w07 cd0d6dc1bc5e62e2ec6d419d4cf0c91aceb66d6e
- w08 39e2172c72c3e934c7cd22d6dc21b023d44dd05c (review week: recall only)

Verdict: fix

Cross-week notes (apply to all weeks):
- The routine wording pattern is the same in all 7 teach weeks (same model, lead, test, correction, slide, check, and recall ask lines with the week's sound substituted). This is good for the teacher.
- Week 1 blends by ear only: the drill lines carry sound labels and no letter names, per D3.
- All `approval.loops` are `{"status": "draft"}` with no words and no date, in all 8 weeks. Correct per FR-11.
- Every day of every week sums to 30 minutes with the allowed steps only. Only A1 (4 to 5), A2 (4 to 5), A4 (5 or 6 to 5), and A6 (4 to 3) carry a `loopMinutes` that differs from `minutes`. Each loop step keeps at least 2 minutes.
- Donor minutes: A4 and A6 each give 1 minute on day 1, and each also hosts a new routine (A4 the blend drill, A6 the sight-word slide and check). The old actions are not cut, so both steps are tight. See the week look points.

## Week 1 (w01, commit a4bd6361)

### Errors

1. Path: `scripts[0].steps[0].soundLoop.retest` (A1, Hear it).
   Current: `"Thumbs up for nnn at the start: nose, cat, nut."`
   Problem: The English reads as if all three words start with nnn, but "cat" starts with /k/. The Thai gloss has the condition ("ถ้า" = if), so the English and the Thai do not say the same thing. A teacher who follows the English gives a thumbs up for "cat".
   Fix: `"Thumbs up if it starts with nnn. Listen: nose, cat, nut."` (Thai stays as is.)

### Look points (for Daniel)

1. The `what` question of "Hello!": "What do they all say?" answers with the word "Hello" (page 1). "Hello" is speech, not a thing a picture can show, and every page says it, so pointing is not clear. A different `what` (for example about Pat's picture) would point better. Daniel decides.
2. The `where` question "Where is Pip?" answers with the word "Pip" (page 8). The word names the character, not a place. Pointing at Pip in the bag does show where he is, but a place word would be better if one fits the page text.
3. Minutes: A4 goes 5 to 4 while it gains the 4-word drill; A6 goes 4 to 3 while it gains the slide and the timed check of 3 words. Both are tight but plausible.

## Week 2 (w02, commit 6addeaeb)

### Errors

1. Path: `scripts[0].steps[0].soundLoop.retest` (A1, Hear it).
   Current: `"Thumbs up for /a/ at the start: ant, dog, apple."`
   Problem: Same pattern as week 1. "dog" starts with /d/, but the English reads as if all three words start with /a/. The Thai has the condition; the English does not.
   Fix: `"Thumbs up if it starts with /a/. Listen: ant, dog, apple."` (Thai stays as is.)

### Look points (for Daniel)

1. The book "How Many?" questions fit the story: who = Pip (page 8), what = kites (page 2), where = friends (page 6). All answer words are in the page text and showable. The `where` answer word ("friends") names the group, not a place; pointing shows the place.
2. Day 1 recall has 5 cards, all from week 1. That is fine: the day-1 recall runs before the new sound is taught.
3. Minutes: A4 6 to 5 and A6 4 to 3, same tight donor pattern as week 1.

## Week 3 (w03, commit f3f5dfed)

### Errors

1. Path: `scripts[0].steps[0].soundLoop.retest` (A1, Hear it).
   Current: `"Thumbs up for /p/ at the start: pear, sun, pen."`
   Problem: Same pattern. "sun" starts with /s/, but the English reads as if all three words start with /p/. The Thai has the condition; the English does not.
   Fix: `"Thumbs up if it starts with /p/. Listen: pear, sun, pen."` (Thai stays as is.)

### Look points (for Daniel)

1. The book "Paint!" questions fit the story: who = Pip (page 8), what = green (page 4), where = pink (page 6). All answer words are in the page text. The `what` ask names the page ("on page 4"); weeks 1, 2, 4, 5, and 7 do not do that. It helps a beginner, but Daniel may want one pattern in all weeks.
2. Days 4 and 5 recall show no week-3 card (no /p/, no "the", no "get", no "It is ___."). The new items appear on days 1 to 3 only.
3. Minutes: A4 6 to 5, A6 4 to 3, same tight donor pattern.

## Week 4 (w04, commit c20fe2bc)

### Errors

1. Path: `scripts[0].steps[0].soundLoop.retest` (A1, Hear it).
   Current: `"Thumbs up for mmm at the start: mouse, cat, milk."`
   Problem: Same pattern. "cat" starts with /k/, but the English reads as if all three words start with mmm. The Thai has the condition; the English does not.
   Fix: `"Thumbs up if it starts with mmm. Listen: mouse, cat, milk."` (Thai stays as is.)

2. Path: `books[?].questions[1]` (read-along "My Family", the `what` question).
   Current: ask.en `"What is the home? Point to the picture."`, ask.th `"บ้านคืออะไร? ให้ชี้ที่ภาพ"`, answer `{"page": 6, "word": "house"}`.
   Problem: "What is the home?" is not natural English for a 5-year-old and it names the answer in the question. The Thai mirrors the same reversed question. No other week asks this way (compare "What flies in the sky?", "What do we have only one of?").
   Fix: ask.en `"What is this? Point to the picture."`, ask.th `"นี่คืออะไร? ให้ชี้ที่ภาพ"`; keep answer `{"page": 6, "word": "house"}`. Daniel decides the final Thai.

### Look points (for Daniel)

1. The `who` question "Who is the dog?" (answer "Pip", page 8) and the `where` question "Where is Grandma?" (answer "grandma", page 4) fit the story and the page text. The `where` answer word names the person; pointing shows the place.
2. Days 4 and 5 recall show no week-4 sound or tricky word (day 5 has the week-4 frame "This is my ___."). The new items appear on days 1 to 3 only.
3. Minutes: A4 6 to 5, A6 4 to 3, same tight donor pattern.

## Week 5 (w05, commit aa4a66e3)

### Errors

1. Path: `scripts[0].steps[0].soundLoop.retest` (A1, Hear it).
   Current: `"Thumbs up for sss at the start: sock, dog, sun."`
   Problem: Same pattern. "dog" starts with /d/, but the English reads as if all three words start with sss. The Thai has the condition; the English does not.
   Fix: `"Thumbs up if it starts with sss. Listen: sock, dog, sun."` (Thai stays as is.)

### Look points (for Daniel)

1. The `who` question of "I Have Two": "Who has four legs?" answers with the word "legs" (page 8). A `who` answer should name a being; "legs" is a body part. The page text has no name word for the four-legged animal, so the maker was constrained. Pointing at the animal answers the question in practice. Daniel decides if this is acceptable.
2. The `what` question "What do we have only one of?" (answer "nose", page 7) is a good question and fits the story.
3. Days 4 and 5 recall show no week-5 card (no sss, no "off", "saw", "with", no "I have two ___."). The new items appear on days 1 to 3 only.
4. Minutes: A4 6 to 5, A6 4 to 3, same tight donor pattern.

## Week 6 (w06, commit 072fb09a)

### Errors

1. Path: `scripts[0].steps[0].soundLoop.retest` (A1, Hear it).
   Current: `"Thumbs up for /t/ at the start: ten, sun, table."`
   Problem: Same pattern. "sun" starts with /s/, but the English reads as if all three words start with /t/. The Thai has the condition; the English does not.
   Fix: `"Thumbs up if it starts with /t/. Listen: ten, sun, table."` (Thai stays as is.)

### Look points (for Daniel)

1. The book "I Can See" questions fit the story: who = Pip (page 8), what = fish (page 4), where = horse (page 7). The `what` ask names the page ("on page 4"), the same pattern as week 3.
2. Days 4 and 5 recall show no week-6 card (no /t/, no "he", "put", "see"). The new items appear on days 1 to 3 only.
3. Minutes: A4 6 to 5, A6 4 to 3, same tight donor pattern.

## Week 7 (w07, commit cd0d6dc1)

### Errors

1. Path: `scripts[0].steps[0].soundLoop.retest` (A1, Hear it).
   Current: `"Thumbs up for /o/ at the start: ox, sun, otter."`
   Problem: Same pattern. "sun" starts with /s/, but the English reads as if all three words start with /o/. The Thai has the condition; the English does not.
   Fix: `"Thumbs up if it starts with /o/. Listen: ox, sun, otter."` (Thai stays as is.)

### Look points (for Daniel)

1. The `what` question of "Is It a Ball?": "What is the first thing?" (answer "ball", page 1) is vague. "First thing" needs the teacher to explain. A clearer ask: "What is on page 1?" or "What do they guess first?". Daniel decides.
2. Days 4 and 5 recall show no week-7 card (no /o/, no "from", "run", "up"). The new items appear on days 1 to 3 only.
3. Minutes: A4 6 to 5, A6 4 to 3, same tight donor pattern.

## Week 8 (w08, commit 39e2172c, review week)

### Errors

None.

### Look points (for Daniel)

1. Per D11 the review week gets recall and `loopMinutes` only if a day sum changes. No day sum changed, so w08 has no `loopMinutes`. Correct.
2. Each day has 5 recall cards, all from weeks 1 to 7, no repeat in one day, and the `ask` line matches the teach weeks. The day sums stay 30 with the opening at 6. Clean.
3. On the maker's report that days 4 and 5 of the teach weeks show only older cards: the report is correct for w02 to w07 (day 4 has no card of the current week; day 5 has none, except w04 day 5 which has the current frame). I agree it matters a little: the week's new sound gets recall exposure on days 2 and 3 only, two exposures in the week. A mix such as 3 old plus 2 new cards on days 4 and 5 would keep the new sound in play. This is a spacing choice, not a rule break, and FSRS is out of scope. Daniel decides.

## Summary table

| Week | Errors | Look points |
|---|---|---|
| w01 | 1 | 3 |
| w02 | 1 | 3 |
| w03 | 1 | 3 |
| w04 | 2 | 3 |
| w05 | 1 | 4 |
| w06 | 1 | 3 |
| w07 | 1 | 3 |
| w08 | 0 | 3 |

The 7 same-pattern errors (one per teach week, A1 retest) are one systematic fix applied 7 times. The 8th error is the w04 `what` question.

Open errors: 8
