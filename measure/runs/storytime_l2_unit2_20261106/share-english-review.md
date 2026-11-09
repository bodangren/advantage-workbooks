# English review of the share parent captions, weeks 9 to 16

Task 3.1b part (b) of the unit 2 track `storytime_l2_unit2_20261106`.

| Item | Value |
|---|---|
| Reviewer model | minimax-cn-coding-plan/MiniMax-M3#high |
| Reviewer family | Y (MiniMax) |
| Maker family | X (DeepSeek, deepseek/deepseek-flash#high) |
| Audited head | 1484e9a6 |
| Input | measure/runs/storytime_l2_unit2_20261106/share-english-pack.md (the English pack only) |
| Role | review, report only |
| Verdict | fail (one error) |

## Verdict table

| Row | Short quote | Verdict |
|---|---|---|
| SC-w09-d1 | The sound of the week is d. | ok |
| SC-w09-d2 | Your child acts the story Yum! | ok |
| SC-w09-d3 | One child reads one page | E3 |
| SC-w09-d4 | The photo shows your child's sentence | E5 |
| SC-w09-d5 | The class sings Yum, Yum, Yum! | ok |
| SC-w10-d1 | the class works on the endings -an and -ad | E1 |
| SC-w10-d2 | Your child acts the story Dress Up! | ok |
| SC-w10-d3 | One child reads one page | E3 |
| SC-w10-d4 | The photo shows the sentence Put on your hat | ok |
| SC-w10-d5 | The class sings Put On Your Hat! | ok |
| SC-w11-d1 | The sound of the week is e. | ok |
| SC-w11-d2 | acts the story Where Is Pip? | ok |
| SC-w11-d3 | One child reads one page | E3 |
| SC-w11-d4 | The photo shows the question Where is the cat | ok |
| SC-w11-d5 | The class sings Where Is the Ball? | ok |
| SC-w12-d1 | The sound of the week is h. | ok |
| SC-w12-d2 | acts the story Open Your Book! | ok |
| SC-w12-d3 | One child reads one page | E3 |
| SC-w12-d4 | The photo shows the sentence Open your book | ok |
| SC-w12-d5 | The class sings Open Your Book and Read! | ok |
| SC-w13-d1 | the class works on the endings -ot and -op | E1 |
| SC-w13-d2 | acts the story Look at Me! | ok |
| SC-w13-d3 | One child reads one page | E3 |
| SC-w13-d4 | The photo shows the sentence I can jump | ok |
| SC-w13-d5 | The class sings I Can Run and Jump! | ok |
| SC-w14-d1 | Your child says fff, says fish | E2 |
| SC-w14-d2 | acts the story Hot and Cold | ok |
| SC-w14-d3 | One child reads one page | E3 |
| SC-w14-d4 | The photo shows the sentence It is hot | ok |
| SC-w14-d5 | The class sings It Is Sunny! | ok |
| SC-w15-d1 | The sound of the week is g. | ok |
| SC-w15-d2 | acts the story Look, a Bus! | ok |
| SC-w15-d3 | One child reads one page | E3 |
| SC-w15-d4 | The photo shows the sentence Look, a bus | ok |
| SC-w15-d5 | The class sings Look, Look, Look! | ok |
| SC-w16-d1 | reads Yum! and Dress Up! | ok |
| SC-w16-d2 | reads Where Is Pip? and Open Your Book! | ok |
| SC-w16-d3 | reads Look at Me! and Hot and Cold | ok |
| SC-w16-d4 | and one more unit 2 book | E4 |
| SC-w16-d5 | The class votes for a unit 2 song | ok |

## Checks that passed

- Word count: every caption holds 14 to 24 words. The count matches the count in the pack for all 40 rows.
- No caption ends in a media file extension.
- American spelling in all 40 rows, for example "center" in the week 16 rows.
- No row names an age, and no row says "kids" or "little ones".
- Shot count: 33 rows have one shot. The 7 day 4 rows of the teach weeks have two shots. Each row names one step, except the day 4 rows, which name two different steps.
- No shot names an assessment step. The teach weeks use no E5. Week 16 uses no A1.
- The moment table holds in every row. The teach weeks use A3, B5, C4, D4 with a photo, D5 with a video, and D6. Week 16 uses A2, B1, C1, D1, and E3.
- Each caption sits in the period of its day, per the moment table.
- Each caption names the English of its week: the sound and a word, the frame sentence, the book title, or the song title. The week 16 row 5 names a song the class picks, because E3 has no fixed song.
- The Thai caption is not in this pack. This review does not cover it.

## Findings

### E1

- Row: SC-w10-d1 and SC-w13-d1.
- Rule: the caption must match its step and name the English of the moment (FR-14 rules 2 and 6, D19).
- Problem: these two captions do not match A3 Form it. They open with a statement about the class. They do not name the sound of the week. They claim the child reads two words, which the Form it step does not do. The other five teach weeks name the sound, one word, and the letter. The unit 2 sound is "a" in week 10 and "o" in week 13. The decodable books confirm it: The Tan Man and Hop on Top!
- Suggested fix for SC-w10-d1: "The sound of the week is a. Your child says /a/, says dad, and writes the letter a."
- Suggested fix for SC-w13-d1: "The sound of the week is o. Your child says /o/, says top, and writes the letter o."
- Severity: error.

### E2

- Row: SC-w14-d1.
- Rule: the style must stay the same across the 40 rows.
- Problem: the caption writes the sound as "fff". The other sound rows write "/d/", "/e/", "/h/", and "/g/".
- Suggested fix: "The sound of the week is f. Your child says /f/, says fish, and writes the letter f."
- Severity: nit.

### E3

- Row: SC-w09-d3, SC-w10-d3, SC-w11-d3, SC-w12-d3, SC-w13-d3, SC-w14-d3, SC-w15-d3.
- Rule: the style must stay the same across the 40 rows, and the caption must say what the parent sees.
- Problem: these seven captions start with "One child reads one page". The other 33 rows say "Your child". A parent cannot tell whether the child in the video is their own child. The caption also names no child, so D19 holds either way.
- Suggested fix: use "Your child reads one page of the book Dad and the Mop aloud with the class." and the same change for each row, with the book of that week.
- Severity: nit.

### E4

- Row: SC-w16-d4.
- Rule: the style must stay the same across the 40 rows, and the caption must say what the parent sees.
- Problem: the caption does not name the center, and "one more unit 2 book" does not tell the parent what the child reads. The other three week 16 rows say "at the big book center".
- Suggested fix: "Your child reads Look, a Bus! and one more book from this unit with a partner at the big book center."
- Severity: nit.

### E5

- Row: SC-w09-d4.
- Rule: the style must stay the same across the 40 rows.
- Problem: the photo clause has another shape. The other six day 4 rows say "the sentence X in your child's hand". This row says "your child's sentence X with Yum! at the end". It leaves the comma out of the frame sentence. The row SC-w09-d2 gives that sentence as "I like rice, Yum!".
- Suggested fix: "The photo shows the sentence I like cake, Yum! in your child's hand. The video shows your child reading it to the class."
- Severity: nit.

## Final verdict

Fail. One error finding (E1) covers two rows: SC-w10-d1 and SC-w13-d1. Four nit findings (E2, E3, E4, E5) cover ten rows.
