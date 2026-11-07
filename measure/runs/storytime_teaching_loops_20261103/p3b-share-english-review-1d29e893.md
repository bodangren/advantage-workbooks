# Review: Parent-share captions, English pack (Phase 3b)

- Reviewer: kimi-code-plan-cn/kimi-for-coding#high (Kimi family), report-only
- Maker family: DeepSeek
- Source commit: 1d29e893
- Input: the English pack only (test-strategy 9.8, rule P20)

## Verdict table (40 rows)

| Row | Day | Caption (short quote) | Verdict |
|---|---|---|---|
| w01 d1 | 1 | Listen for the sound n ... writes the letter n. | ok |
| w01 d2 | 2 | acts the story Hello! and says Hello, I am ... with a name. | ok |
| w01 d3 | 3 | reads one page of Nan Can Nod aloud ... for ten seconds. | ok |
| w01 d4 | 4 | The photo shows a written sentence. The video shows your child reading it ... | ok |
| w01 d5 | 5 | sings Hello, I Am Pip with the class and does the actions. | ok |
| w02 d1 | 1 | works on the short sound a ... says a in the word cat ... | ok |
| w02 d2 | 2 | acts the story How Many? and asks How many? One, two... | ok |
| w02 d3 | 3 | reads one page of the book How Many? aloud for the class. | ok |
| w02 d4 | 4 | The photo shows the sentence your child wrote. ... | ok |
| w02 d5 | 5 | The class sings How Many? One, Two! ... | ok |
| w03 d1 | 1 | The sound of the week is p ... says pen ... | ok |
| w03 d2 | 2 | acts the story Paint! and says **the frame sentence** It is red. | error (E1) |
| w03 d3 | 3 | reads one page of the book Paint! aloud to the class. | ok |
| w03 d4 | 4 | The photo shows your child's sentence. ... reading the sentence to us. | ok |
| w03 d5 | 5 | sings It Is Red! and names the colors in English. | ok |
| w04 d1 | 1 | Listen for the sound m ... says mmm ... says mom ... | ok |
| w04 d2 | 2 | acts the story My Family and says This is my mom with an action. | look point (LP-S3) |
| w04 d3 | 3 | reads one page of the book My Family aloud for the class. | ok |
| w04 d4 | 4 | The photo shows the sentence This is my ... in your child's hand. | ok |
| w04 d5 | 5 | The class sings This Is My Family. ... | ok |
| w05 d1 | 1 | The sound of the week is s ... says sss ... says sun ... | ok |
| w05 d2 | 2 | acts the story I Have Two and says I have two hands. | ok |
| w05 d3 | 3 | reads one page of the book I Have Two aloud to the class. | ok |
| w05 d4 | 4 | The photo shows your child's written sentence with two things. | ok |
| w05 d5 | 5 | sings I Have Two and counts two of each body part in English. | ok |
| w06 d1 | 1 | Today we practise the sound t ... | look point (LP-S1) |
| w06 d2 | 2 | acts the story I Can See and says I can see a cat. | ok |
| w06 d3 | 3 | reads one page of the book I Can See aloud for us. | ok |
| w06 d4 | 4 | The photo shows the sentence your child wrote about an animal. | ok |
| w06 d5 | 5 | The class sings I Can See a Cat. ... | ok |
| w07 d1 | 1 | The sound of the week is short o ... says octopus ... | ok |
| w07 d2 | 2 | acts the story Is It a Ball? and asks Is it a ball? Yes or no? | ok |
| w07 d3 | 3 | reads one page of the book Is It a Ball? aloud to the class. | ok |
| w07 d4 | 4 | The photo shows your child's question sentence. ... | ok |
| w07 d5 | 5 | sings What Is in the Box? and asks and answers in English. | ok |
| w08 d1 | 1 | ... reads one page of a unit 1 book aloud at the **reading center**. | look point (LP-S2) |
| w08 d2 | 2 | At the reading center your child reads one page ... to the group. | look point (LP-S2) |
| w08 d3 | 3 | ... reads one page of another unit 1 book aloud at the reading center. | look point (LP-S2) |
| w08 d4 | 4 | ... reads one page of a third unit 1 book aloud. ... | look point (LP-S2) |
| w08 d5 | 5 | The class sings the unit 1 songs at the song show ... unit sticker. | ok |

## Errors

- **E1** — Row w03 d2: "Your child acts the story Paint! and says the frame sentence It is red."
  - Problem: "frame sentence" is teaching-loop jargon. A parent does not know the term. It also breaks the one style of the 40 captions: the other seven day-2 captions name the frame sentence without the term (w01 "says Hello, I am ... with a name", w02 "asks How many? One, two...", w04 "says This is my mom with an action", w05, w06, w07 same pattern).
  - Fix: "Your child acts the story Paint! and says It is red."

## Look points (style choices for Daniel)

- **LP-S1** — Row w06 d1: "Today we practise the sound t." The pack mixes British "practise" (w06 d1) with American "mom" (w04 d1, w04 d2) and "colors" (w03 d5). Pick one dialect for all 40 captions. If American: "practice". If British: "mum", "colours".
- **LP-S2** — Rows w08 d1 to d4: the captions say "reading center", but the pack moment table names the place "decodables center". The rename avoids the banned word "decodable", so it is a good plain-English choice. Confirm the rename is deliberate, and confirm "reading center" is the parent-facing name of that center.
- **LP-S3** — Row w01 d2 ("... says Hello, I am ... with a name.") and row w04 d2 ("... says This is my mom with an action."): the trailing "with a name" / "with an action" is short for "and adds a name" / "and does the action". It reads as teacher note style. Optional polish: "says Hello, I am ... and adds a name" and "says This is my mom and does the action".

## Checks that pass

- Rule 1 (1 to 40 words): all 40 captions are within range (longest is 21 words, w08 d1).
- Rule 2 (no pipe, no angle bracket, no line break): all 40 captions pass.
- Rule 3 (no media file extension): all 40 captions pass.
- Rule 4 (for its week, names the sound and a word, the frame sentence, the book title, or the song title): all rows pass after E1 is fixed.
- Rule 5 (names no child): all 40 captions pass. "Pip" (w01 d5) is part of the song title, so it is allowed.
- Rule 6 (no file path, no assessment word): all 40 captions pass. "review" (w08 d1) names a unit review week, not an assessment.
- Rule 7 (postable with no change): passes for all rows except w03 d2 (E1).
- Rule 8 (all 40 different; the 5 of one week different): all captions are distinct. Spot check of near-pairs (the six "reads one page of the book ..." rows, the five "The photo shows ..." rows) shows each differs by title or detail.
- Moment match: day 1 rows name the sound, a word, and the letter; day 2 rows name the story and the frame sentence; day 3 rows name one page and the book; day 4 rows name the written sentence and the reading; day 5 rows name the song show; week 8 rows follow its own table (reading days 1 to 4, song show day 5).
- English quality: grammar and spelling are correct in all rows. Sentences are short and friendly. Tone is one voice.

## Limit of this review

The pack is enough to judge every row. Book titles, song titles, and frame sentences come from the pack itself; this review cannot verify them against the week files (rule P20), and finds no internal conflict in them.

Errors open: 1
