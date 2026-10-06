# Pre-review of Origins 1, Origins 3.2, and Quest 4

Version 1.0 | Date 2026-10-03 | Status: Draft (for Daniel) | Owner: Daniel Bo | Internal

Track: `measure/tracks/editorial_prereview_20261003/`. Claude read all 42 lessons before Daniel's
review: the text, the glossary, the question bank, the print set, the activities, the picture plans,
and the pictures. Claude fixed the faults in the sources (`<book>/src/<lesson>.md`), converted them,
and made new pictures and new audio where a part changed. All 42 lessons are still draft. Only Daniel
approves.

## 1. Result

| Book | Lessons changed | Text changes | Question changes | New pictures | Checks |
|---|---|---|---|---|---|
| Quest 4 | 13 of 14 (not L07) | 40 | 30 | 7 | 14 PASS |
| Origins 3.2 | 13 of 14 (not P12 text) | 14 | 5 | 16 | 14 PASS |
| Origins 1 | 10 of 14 | 22 | 12 | 4 | 14 PASS |

The script checks did not find any of these faults. They find counts and word levels, not grammar,
story logic, or pictures that do not match the text.

## 2. The biggest fault: sign text in the pictures

Every prompt ended with the old mmx rule "No words, letters, or numbers anywhere in the picture."
So every sign, board, notice, and map in the pictures was blank. A script then drew the sign text in
one white box at the bottom of the picture. When a picture had more than one text, the boxes sat on
top of each other: four timetable lines in Quest 4 L05, nine chant lines in Origins 3.2 P04, six
steps in P11. The lessons "Signs at the Zoo" (P06) and "Signs at School" (P09) are about reading
signs, and their signs were blank.

Daniel: "Text in images works well in Muse image gen." A test on 2026-10-03 confirmed it: Muse wrote
four zoo signs, a four-line timetable, and a five-line poster with every word correct. Now the sign
text goes in the prompt in quotation marks, and the prompt asks for exact spelling. The script
overlay stays only as a fallback for a misspelled word (`AUTHORING.md` §6, version 1.3).

Pictures with text that Muse drew again: Quest 4 L05 (timetable), L09 (street map with labels),
L12 (steps on the board), L13 (lost-kitten notice); Origins 3.2 P04 (chant poster), P06 (four zoo
signs, "NO DOGS.", "FOOD AND DRINK."), P09 (three school signs, the board, "DON'T RUN"), P11 (step
numbers), P14 (lost-teddy poster); Origins 1 L14 (book title on two covers).

**Check every letter** on these pictures on `/review`.

## 3. Quest 4

| Lesson | Change | Reason |
|---|---|---|
| L01 | "My age is eight" → "I'm eight years old"; "she's eight, too" → "she's my age" | Thai word order in English. "age" stays in the text. |
| L01 | "Do you have a grandparent?" → "Do you have grandparents?" | Not natural English. |
| L01 | "Now it's your day to write." → "Now please write your About me page!"; first line "Please read about me on my About me page" → "Here is my About me page." | "your day to write" is not English. |
| L02 | "runs on to the field" → "runs onto the field" | American usage. |
| L02 | m3, m5, m10, s3 rewritten | m5 asked why Tom is tired; the answer "He runs and runs" is Ben's sentence. m3 asked "Where is Tom?" for a place in the race. |
| L02 | Hero: Teacher Kim added to the characters; new picture | She had brown hair and a headband in the old picture. |
| L03 | Shelf scene rewritten | Lily sees a green glass bottle, and then Grandpa says "It's round and white" and it becomes a plate. The bottle and the plate were mixed. |
| L03 | s1 "What's this, Grandpa?" → "Whose house is Lily at today?"; l3 "Why does Lily laugh?" → "Why does Grandpa laugh?" | s1 had no clear answer. Grandpa laughs in the text, not Lily. |
| L04 | "She can't skate, too." → "But she can't skate."; "one and then two" → "a little" | Grammar ("too" with a negative). |
| L05 | "Our class is with Teacher Kim" → "Our teacher is Teacher Kim"; the lunch lines joined | "It is nice. Leo and May are my good friends." did not connect. |
| L05 | "says Lily" → "I say" | Lily tells the text as "I". |
| L05 | s1 "at the weekend" → "What is your favorite lesson? When is it?"; s4 "When is the class English?" → "When does the class have English?"; fill "math" → "a computer lesson" | Off-topic print question; grammar; the timetable has no math. |
| L05 | Hero: new picture with the timetable text | Four labels on top of each other. |
| L06 | Mia's new kitten is Snow, small and white (was gray) | L13 says Mia's new kitten is Snow, white with blue eyes. |
| L06 | m1 "What does Mia like?" → "Does Mia like rabbits?" | Two options ("cats", "birds") were also true: Mia likes her kitten and parrots. |
| L08 | "Today we climb" → "Let's climb ... today"; "big mountain" → "small mountain"; "count the steps" → "count our steps"; end "Again, one hundred and fifty!" → "Now I can climb two hundred steps!" | The old end had no clear meaning. A hundred steps fits a small mountain. |
| L08 | Thai "ไม่ไกลหรอก" → "ไม่ยากหรอก" | The English is "Is it difficult?" "No". |
| L09 | "This is my street, and I live here with Pat." → "Hello! I'm May, and this is my street. I live here with my brother Pat." | The reader did not know who "I" is. |
| L09 | "Can we go to the supermarket too?" gets "asks Pat"; "Now you can try." removed | The speaker was not clear. |
| L09 | s4 "Why is Pat hungry? He is hungry after the library." → "When is Pat always hungry? ... after the film." | Wrong answer. |
| L09 | Hero: new map with the labels on the buildings | The source line had no caption field, so the label list became the caption, and the map had no labels. |
| L10 | "says Lily" / "Lily laughs" → "I say" / "I laugh"; "Look! says Lily. I can see a rainbow!" → "Then there is a big rainbow in the sky!" | Lily tells the text as "I". |
| L10 | Rainbow colors: purple added; m10 rewritten | A rainbow has purple. |
| L11 | "What do you bring, Tom?" → "What's in your bag, Tom?" + "I always bring a bottle of water"; "Pip is in the lake!" → "Pip jumps into the lake!"; "Today I catch a wet puppy!" → "My first catch today is a wet puppy!" | Tense and meaning. The picture shows Pip jump. |
| L12 | "Our class has a party" → "Teacher Kim's class has a party"; "It is a dress up party." → "The children can dress up as animals." | No narrator; "dress up" as an adjective needs a hyphen. |
| L12 | Hero: new picture with the steps on the board | Two labels on top of each other. |
| L13 | "We lose Snow!" → "I can't find Snow!"; last line "Mia is always happy with Pip near her." → "Mia never wants to lose Snow again."; "She always sleeps in her box." added | Grammar; a clear end; "always" stays (review word). |
| L13 | "Lily writes a big notice" → "Lily and Mia make two notices"; the notice text "Can you see our kitten?" → "Have you seen our kitten?" | The girls put up two notices. "Have you seen ...?" is the notice phrase and matches the title. |
| L13 | Thai typo "มีออุ้ม" → "มีอาอุ้ม" | Typo. |
| L14 | The band practices in the music room (was the library) | A band does not practice in a library. "library" stays as "a library book". |
| L14 | "at the weekend" → "on the weekend" (7 places) | American usage. See question Q3. |

## 4. Origins 3.2

| Lesson | Change | Reason |
|---|---|---|
| P01 | "Then Lily says, Goodbye" → "At three o'clock, Lily says, Goodbye" | Goodbye came right after May sat down. |
| P01 | Picture 2: Pat in his cast clothes (green T-shirt, teddy) | He wore a yellow T-shirt. |
| P02 | Picture 3: new picture | Pip slept on the sofa, not behind it, and an unknown child sat in front. |
| P03 | Hero and picture 3: new pictures | An adult woman opened the door, not May. A black-and-white cat sat under the table, not Pip. |
| P04 | "Fifteen, show me your two feet!" → "Sixteen, ..." | The chant counted to sixteen and then went back to fifteen. |
| P04 | Picture 2: new chant poster | Nine labels on top of each other; an unknown woman in the picture. |
| P05 | "One egg is for you!" says the woman. (added) | The text did not say why twelve eggs became thirteen. |
| P06 | "Sorry, Pip!" → "Pip can't come here!"; "Look! A sign says" → "Mia points. A sign says"; "What is the number?" → "Tell me the number."; "Good!" says Dad. (added) | Pip is Lily's dog and is not there. The narrator said "Look!". The new line keeps the mean sentence length at 5.5. |
| P06 | All three pictures: new, with the sign text | Blank signs in a lesson about reading signs. |
| P07 | "He tries again" → "He tries it"; m7 rewritten | Ben "tries again" before he tries once. |
| P08 | Thai typo "ตอนบาย" → "ตอนบ่าย" | Typo. |
| P09 | All three pictures: new, with the sign text | Blank signs. |
| P10 | "Pip is not sad now." → "Pip comes out from behind the sofa."; caption | Pip was afraid, not sad. |
| P10 | Picture 2: new picture | The monster was a creature on the table, not a drawing on paper. |
| P11 | Picture 2: new picture with step numbers 1–6 | Six labels on top of each other. |
| P12 | Picture 2: Pip added to the characters; new picture | The dog was not Pip. |
| P13 | "Listen for the words Teacher says" → "Listen for 'Teacher says,'" | The old line can mean "the words that the teacher says". |
| P13 | Picture 2: Teacher Kim added to the characters; new picture | She had brown hair, glasses, and a green cardigan. |
| P14 | Thai: English in brackets removed; picture 2: new poster | Thai style; the poster text was too small to read. |

## 5. Origins 1

| Lesson | Change | Reason |
|---|---|---|
| L01 | "Who is this?" / "This is Pip" removed | Mia asked his name after Lily said "This is Pip". |
| L02 | "How many are we? We are six!" → "How many people? There are six of us!"; "and I" → "and me"; caption | Thai word order in English. |
| L03 | "We find it!" removed; "Yes, it is!" moved after the question; "Hooray!" says Lily. (added) | The answer came after "We find it!"; "We" had no speaker. |
| L05 | "She shows thumbs up." → "She shows a thumbs up."; picture 3 in the classroom | Grammar; the old picture was in a park. |
| L06 | "says Mom" twice in a row → "asks Mom" + "No, Pip!"; Thai "กล้วยหนึ่งใบ" → "กล้วยหนึ่งลูก" | Style; wrong Thai classifier. |
| L07 | "Look at my face!" gets "says Lily"; "Four legs!" → "Pip has four legs!"; nose lines → "Is his nose black?" "Yes, it is!" | The questions said Lily speaks, but the text did not. "Four legs" came after Lily's legs. |
| L10 | Tom's line "This is our house." without quotation marks; s1 "I have six windows" → "My house has six windows" | Tom tells the text. |
| L10 | Hero: new picture with seven windows | The picture had six windows, and m1 asks how many. |
| L12 | "Let's play football!" gets "says Tom"; "Ben is my friend. I am happy." → "Ben is Tom's friend. Tom is happy." | Ben said "Yes!" to his own idea. The text changed to "I". |
| L13 | "We are at Grandma's house. It is dinner. ... Mom and Dad sit too." → "The family is at Grandma's house. They have dinner. ... Mom, Dad, Tom, and Lily sit."; "we" → "they" | No narrator for "we"; "It is dinner" is not natural English. |
| L14 | Hero and picture 2: the title "Pip and the Big Day" on the cover | Blank cover; a label at the bottom of the picture. |

## 6. Questions for Daniel

- **Q1 "have got" (Origins 3.2).** P01, P04, P10, P11, P12, and P14 use "Have you got ...?" and "has got".
  The plan asks for it (Starters grammar list, plan line 49). It is British, the printed books never
  use it, and D2 says American. Claude did not change it. Keep, or change to "Do you have ...?"?
- **Q2 British words from the Cambridge lists.** Quest 4 uses "car park" (L09), "cinema" and "film"
  (L09, L14), "football" (L01, L05, L14), and "flat" (L01 m9). American: "parking lot", "movie
  theater", "movie", "soccer", "apartment". Claude did not change them. Keep the Cambridge words?
- **Q3 "on the weekend".** Claude changed "at the weekend" to "on the weekend" in Quest 4 L14 (and
  removed it from L05 s1). Revert if you prefer the Cambridge form.
- **Q4 Quest 4 L13 title and notice.** "Have You Seen Our Kitten?" uses the present perfect, above
  the level-4 grammar. Claude kept it as a fixed notice phrase. The other option: title "Where Is
  Snow?" and notice "Please help us find our kitten!".
- **Q5 Snow in Quest 4 L06.** L06 now introduces Snow as Mia's new kitten, and L13 begins "Mia has a
  new kitten." Keep both, or change L13 to "Mia has a kitten, Snow."?

## 7. What Daniel must still do

1. On `/review`, check every changed picture. Read every letter of the sign pictures (§2).
2. Read the Thai of each changed sentence (the tables above). Claude wrote it; Daniel checks all Thai.
3. Answer Q1–Q5.
4. Approve each lesson. Then Claude imports the approved lessons and makes the lesson PDFs and the
   books again.

## Revision History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-03 | First version |
