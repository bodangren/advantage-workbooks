# Pre-review of Adventure 8.1, 8.2, and 8.3

Version 1.0 | Date 2026-10-07 | Status: Draft (for Daniel) | Owner: Daniel Bo | Internal

Track: `measure/tracks/levels_5_9_20261006/`. This is the pre-review step for the 42 Adventure 8 workbook lessons (level 8). Six writers wrote the lessons from the maps [`primary-adventure-8.1-plan.md`](../primary-adventure-8.1-plan.md), [`primary-adventure-8.2-plan.md`](../primary-adventure-8.2-plan.md) (v0.3), and [`primary-adventure-8.3-plan.md`](../primary-adventure-8.3-plan.md). Three editors read all 42 lessons. Claude checked the converter results, the glossed words across the books, the dates, and the word swaps. Only Daniel approves the book lessons.

## 1. Result

| Book | Month | Lessons | Change rows by the editors | Checks |
|---|---|---|---|---|
| Adventure 8.1 | November 2026 | 14 | 55 | 14 PASS, 0 FAIL |
| Adventure 8.2 | December 2026 | 14 | 47 | 14 PASS, 0 FAIL |
| Adventure 8.3 | January 2027 | 14 | 44 | 14 PASS, 0 FAIL |

Each lesson has 5 paragraphs, 342–430 words, and exactly 12 glossed words, 5 or more of them on the A2 Key list. No word is glossed twice inside a book. Every weekday agrees with the calendar, and no lesson falls on a public holiday. The "new words" WARN stays in most lessons: some map words occur in earlier texts without a gloss, and the converter counts them as seen.

Word swaps (each word is used in the sense of its glossary entry):

- 8.1 L07 "give somebody a call" -> "lend"; L11 "oh dear" (a Starters word for the converter) -> "at all", and "fill" (glossed in 7.2) -> "able"; L12 "sports center" (then not in the graph) -> "riding".
- 8.2 L05 "lend" -> "because of", "at all" -> "herself"; L10 "able" -> "roast"; L13 "riding" -> "rent". These follow from the 8.1 swaps, which took words of the 8.2 map.
- 8.2 L11 uses the American spelling "chili". Claude changed the converter so that "chili", "omelet", and "sports/city/shopping center" match their British headwords (979d644).
- 8.2 L12: the invented woman of the biography is "Miss Nora", not "Miss Alice" (Alice is on the list of names not to use for new people). The map follows (v0.3).

## 2. The most frequent faults

The script checks did not find these faults.

- **A picture that does not show its own paragraph.** The renderer puts picture N at the start of paragraph N. Pictures 2 and 3 showed a later scene in 6 lessons of 8.1 and 10 lessons of 8.2.
- **Questions in the present tense for a past-tense story**, in nearly every story lesson.
- **Reported speech and the past perfect** in texts, options, and model answers (8.2 L03–L05, L08; 8.3 L04, L08, L10).
- **A narrator moral line at the end** (ten lessons of 8.3). Bible §7 allows a closing feeling line, not a moral sentence.
- **Story logic.** A blog post online before the writer finished it (8.1 L09; 8.2 L07, L08, L12; 8.3 L07); five hands for four children (8.2 L02); a net and ropes (8.2 L10); a lemon never added (8.3 L09); a boat stop that the voice announced but the boat did not make (8.3 L04).
- **MCQ options** that were also true, or that the text did not make false; **fill items** with two possible answers (8.1 L02, L03, L06, L07, L11; 8.2 L09).
- **Thai.** Times in 8.1 L08; a name typo in 8.1 L04; "นาย" from Lily to Tom (8.3 L05).

## 3. Questions for Daniel

The editors kept the text in these places. Claude agrees with each choice until Daniel decides.

1. **British plan words:** "trainers" (8.2 L04), "flat" (8.2 L05, Grace in Singapore), "wash up" (8.2 L08). "summer" in a Singapore email (8.2 L13).
2. **A spoken moral.** Teacher Kim ends 8.2 L10 with "Helping a friend is always a pleasant thing" ("pleasant" is glossed). The narrator morals of 8.3 are gone; one could move into Teacher Kim's mouth.
3. **The narrator asks the reader a question** at the end of 8.1 L02 ("Which hobby do you like best?").
4. **Picture of the climax.** With the paragraph rule, 8.1 L08 has no picture of the octopus at the glass (paragraph 4). 8.3 L10 shows the paw prints in the hero, which gives the answer early.
5. **Club size.** 8.3 L03 gives a group discount for ten or more, and May says "more than ten children". The club is Lily's class, so this agrees with the bible.
6. **Meeting times at the market** (8.3 L08, L11, L12): ten o'clock start, noon meeting, as in the map.
7. **8.2 L08 "a big center"** for used water is vague; three questions use the phrase.
8. **Long right options:** 8.1 L01 m9 and 8.3 L09 m6.
9. **8.1 L09** asks "How big is a seahorse?" under the heading "What seahorses eat".
10. **8.2 L14** sends a card on Thursday, December 24, a school day in Thailand.

Note: the 8.3 editor asked if May is in Teacher Kim's class. She is (series bible §2: May, Lily, Mia, and Leo are in Teacher Kim's P6 class), so "our class grew beans" (8.3 L14) is correct.

## 4. Thai to check

- One word for each in all three books: octopus (หมึกสาย, not ปลาหมึกยักษ์); the aquarium keeper (8.1 L01, L08); bus stop (ป้ายรถเมล์ or ป้ายรถบัส; 8.2 L06, L11; 8.3 L01); Guide Ann (ไกด์แอนน์); gecko (จิ้งจก for a small house gecko, 8.3 L13).
- Lily writes หนู and ฉัน to Ms. Ong in one email (8.3 L14). The fruit seller says ฉัน to children (8.3 L12).
- Pier names ท่าเรือสวน and ท่าเรือตลาด (8.3 L03, L04, L14).
- Heavy but correct lines: 8.1 L07, L10, L12; 8.2 L01, L11, L12. The editors' tables below list each one.

## 5. Adventure 8.1 (editor ed8-1)

All 14 converters: PASS, 0 FAIL.

| Lesson | Change | Reason |
|---|---|---|
| L01 | Text: added tag "Lily read on," before "Sharks swim over..."; "Lily read," before "Indoors: ..."; "said Teacher Kim" after "We must stay together as one group" (Thai changed to match) | Quotes had no clear speaker |
| L01 | Text: "Lily put her leaflet in her bag and smiled." -> "Lily smiled." | Word count was 438 after the tags (limit 430); now 428 |
| L01 | Picture 3: removed the line "Please leave by the exit next to the shop." | That line is in paragraph 4, not paragraph 3 (picture N shows paragraph N) |
| L02 | MCQ m4-m10, SAQ s2-s4: questions and model answers moved to the past ("What does Bill shout when Pat sings?" -> "What did Bill shout when Pat sang?") | Story is in the past simple; question tense must match |
| L02 | Hero picture: "Pat stands with a blank poster board" -> "Pat sits on the grass with a big blank poster on his knees" | Text: Pat sat with the poster on his knees |
| L02 | Characters field: removed "Bill" (hero, picture 2) | Bill is not a home-cast name; the prompt already describes the green parrot |
| L02 | Fill: "I enjoy ___," said May = singing -> "Pat stood up and tried ___, but his voice was very loud." = singing | The word bank holds singing, dancing-type words and "skating", so "I enjoy skating" also fits |
| L03 | Text: "each pair a big plan" -> "each group a big plan" (Thai: แต่ละคู่ -> แต่ละกลุ่ม) | Four children share one table and one plan |
| L03 | MCQ m6 and m9: "draws" -> "drew", "writes" -> "wrote" | Narrator uses the past simple |
| L03 | Fill: "From the seal pool, turn right at the ___." = corner -> "The cafe is ___ the wall of the jellyfish room," said Mia. = against | "bridge" (the answer of another item) also fits "turn right at the ___" |
| L04 | Thai: "มีออ่าน..." -> "มีอาอ่าน..." (two lines) | Typo: the name มีอา lost a letter |
| L04 | MCQ m3: distractor "tie your hair" -> "ask the lifeguard" | Rule five says you must tie long hair, so "tie your hair" was also true |
| L04 | MCQ m2 "What is the subject" -> "What was the subject"; SAQ s1 and s3 moved to the past; SAQ s2 answer: 'She says that swimming is good exercise.' -> 'She says, "Swimming is good exercise."' | Narrator tense; the model answer used reported speech |
| L04 | Hero picture: the screen showed all six rules -> the screen shows the subject "Pool Rules" and the first line "Dear Mia, this week I want to tell you about the rules of my swimming pool." | Paragraph 1 does not show the six rules yet (they come in paragraph 2) |
| L04 | Fill: "One: ___ before you swim." = shower -> "Two: do not run or ___ on the wet floor." = hurry | "exercise" (a word-bank word) also fits the old sentence |
| L05 | Text: "a name was written there in black marker" -> "a name on it in black marker" (Thai and MCQ m7, m8 evidence changed too) | Level 8 has no passive |
| L05 | Text: "Instead of arguing, the boys decided to play together." -> "Instead of going home, Tom and Hugo decided to play together." | The boys had stopped arguing; Ben did not play, he drew |
| L05 | MCQ m1, m5, m7, m8, m9, m10 and SAQ s1-s4 moved to the past | Story is in the past simple |
| L05 | MCQ m2: distractor "football" -> "tennis" | Hugo had a football and kicked it, so "football" was nearly true |
| L05 | MCQ m6: 'Who runs after the puppy in the sentence "They ran after the puppy"?' -> 'Who does "they" mean in "they ran after the puppy"?' | Tense clash and the quote did not match the text |
| L05 | Hero picture: Tom, Ben, and Hugo stand -> sit on a bench; Pip sits on the grass next to them | Text: the boys sat on the bench, Pip on the grass |
| L06 | Text: radio line "rain is possible, and there will be a thunderstorm in the afternoon" -> "rain is possible, with a thunderstorm in the afternoon" (Thai changed) | "will be" (certain) clashed with "possible" in the same sentence |
| L06 | MCQ m1, m7, m8, SAQ s1, s3 moved to the past; SAQ s2 and s4 and the print hint: reported speech ('The presenter says that tonight is warm and dry.') -> a direct quote ('The presenter said, "Tonight is warm and dry."') | Narrator tense; model answers must not use reported speech |
| L06 | MCQ m4: distractor "dry" -> "rainy"; m5: distractor "cloudy" -> "cold" | The text never says that Friday is not dry, or that Saturday morning is not cloudy |
| L06 | Hero picture: "Lily writes", "Dad stands near the stove" -> "Lily holds a pencil over a notepad", "Dad sits at the end of the table", window dark | Text: all three sat in the kitchen; Lily has not written yet in paragraph 1 |
| L06 | Fill: "sunny and ___" = hot -> "sunny and hot, with thirty-three ___." = degrees | "warm" (a glossed word in the word bank) also fits |
| L07 | MCQ m7, m8, m10 and SAQ s1, s3 moved to the past; SAQ s4 'What does Lily ask Tom to lend her? She asks him to lend her ...' -> 'What did Tom lend to Lily? Tom lent Lily his big water bottle.'; print hint "Mom writes" -> "Mom wrote" | Narrator tense; the old answer used reported speech |
| L07 | Fill: "Please ___ at the school gate at eight o'clock." = meet -> "Dad is taking you to the gate at a ___ to eight." = quarter | "arrive" (a word-bank word) also fits the old sentence |
| L07 | Hero picture: board line "The bus leaves at 8:30" removed | The bus time comes in paragraph 2, not paragraph 1 |
| L08 | Thai: "ตอนนั้นเป็นเวลาสิบเอ็ดโมงสิบห้านาที" (11:15) -> "ตอนนั้นสิบโมงสี่สิบห้านาที" | English says "a quarter to eleven" (10:45); the Thai gave a wrong time |
| L08 | Thai: "ตอนสิบเอ็ดโมงน้อยสิบนาที" -> "ตอนสิบโมงห้าสิบนาที" | "ten to eleven" is 10:50; the old Thai form is not natural |
| L08 | Thai: "ทั้งห้าคน ยืนอยู่" -> "พวกเขายืนอยู่" | The English "they" does not give a count; four children and Teacher Kim, or more Explorers |
| L08 | All three pictures rewritten to follow paragraphs 1, 2, and 3. Hero showed the octopus arm (paragraph 4), the keeper (paragraph 2), and Teacher Kim; picture 2 showed paragraph 3 (Leo whispers); picture 3 showed paragraph 4 (octopus at the glass) | Picture N must show paragraph N. New hero: Explorers at the tank, pot empty. New picture 2: keeper points at the pot, Mia at the glass. New picture 3: Leo whispers, Mia still. May's notebook removed (not in the text) |
| L08 | MCQ m9 'Why did everybody see a real octopus, says Teacher Kim?' -> 'Why did all the Explorers see a real octopus?'; m10 to the past | Broken grammar; tense |
| L08 | SAQ s1 and s4 to the past, s1 answer as a direct quote; s2 'Why does Leo say that Mia is as still as a rock?' -> 'Why did Mia stand so still at the glass?' (answer: She waited for the shy octopus to come out.); s3 now ends with "at the glass" | Reported speech in a question; tense |
| L09 | Text: "Teacher Kim read my post first, and then she put it on the blog." -> "Teacher Kim will read my post first, and then she will put it on the blog." (Thai changed) | Mia is still writing (Lily reads over her shoulder, Mia will draw); the post cannot be online yet |
| L09 | Pictures 1, 2, 3 rewritten. Hero: Lily removed (she comes in paragraph 5). Picture 2: caption "A seahorse is about 12 centimeters tall." -> "Wild seahorses live in the warm, shallow sea." Picture 3 showed the father seahorse (paragraph 4) -> a fact card for paragraph 3: seahorse, ruler, mango, "about 12 centimeters tall", "about 9 grams" | Picture N must show paragraph N |
| L09 | MCQ m10 to the past; SAQ s4 'Why does Mia say that the post is for Nadia?' -> 'Why is the post for Nadia?'; LAQ l4 'Why do you think that Mia puts a ruler ...' -> 'the keeper held a ruler next to the glass' | Reported speech in a question; the text says the keeper held the ruler |
| L10 | MCQ m3, m4, m5, m7, m9 and SAQ s1 moved to the past; print hint "are" -> "were" | Narrator tense (the text says "was", "were") |
| L10 | SAQ s2, s3, s4: model answers 'She says to cover it...', 'It says to wear a hat... and to put cream...' (reported speech) -> direct quotes; s3 question now quotes Leo | Model answers must not use reported speech |
| L11 | Thai: "ก้อนหินเล็ก ๆ อยู่ไม่กี่ก้อน" (a few stones) -> "ก้อนหินเล็ก ๆ หลายก้อน" | The crow needs many stones to fill the pitcher; English says "some" |
| L11 | Pictures: hero Grandma "tells a story" -> "asks a question with one finger raised" and three glasses on a table; picture 2: stones on the ground removed (stones come in paragraph 3); picture 3 showed Tom with a pebble (paragraph 5) -> the crow drops a stone into the pitcher (paragraph 3) | Picture N must show paragraph N |
| L11 | MCQ m9 'What can a clever idea do, says Grandma?' -> 'What can a clever idea do?'; m10 -> 'Why did Pip not need an idea?'; SAQ s1, s3 and LAQ l2, l5 to the past | Broken grammar; tense of the narrator |
| L11 | Fill: '"Not too ___!" said Lily.' = many -> '"If you add too ___ pebbles, the water will run over."' = many | "full" and "hard" (word-bank words) also fit the short old sentence |
| L12 | Pictures rewritten to follow paragraphs 1, 2, 3. Hero screen showed a badminton court (paragraph 3) -> subject "My badminton team" and the first line of the email. Picture 2 was the court diagram (paragraph 3) -> a gym with six courts and a bicycle (paragraph 2). Picture 3 (racket and shuttlecock) -> court diagram plus racket and shuttlecock (paragraph 3) | Picture N must show paragraph N |
| L12 | SAQ s4 moved to the past ("did Leo add ... He added") | The narrator says "he added" |
| L13 | Text: "The children walked down to the lake with the woman." -> "The group walked down to the lake with the woman." (Thai: กลุ่ม) | Teacher Kim and Ranger Mark must not stay behind; the children do not walk off alone |
| L13 | Pictures: hero no longer shows the map board (Ranger Mark waves hello); picture 2 key: removed "blue wave = lake" and "cup = picnic area" and "(closed)", which the text key does not have; picture 3 showed the kingfisher hide (paragraph 5) -> the woman with the straw hat and camera on the hill path, Ranger Mark with the bible look line, a wooden bridge over a stream (paragraph 3). The woman gets a full look line | Picture N must show paragraph N; the prompt must agree with the text |
| L13 | MCQ m2 distractor "It is a camping place" -> "It is a farm"; m2, m7, m9, m10 to the past | The park has a camping area, so the distractor was half true; narrator tense |
| L13 | SAQ s2, s3, s4 and LAQ l1, l2 to the past; model answers for s3 and s4 changed from reported speech ('He hopes that...', 'She reads that...') to direct quotes; s3 is now "What did Leo whisper in the bird hide?"; print hint "asks" -> "asked" | Reported speech is not allowed in a model answer |
| L14 | Text: line "Pip held the paper in his mouth for a long time." moved from after "It was page six, but it was too wet to read." to after "Pip wanted to keep the ball and the paper." | The old order read as if Pip took the paper back after Lily pulled it; this is the order of events |
| L14 | Text: "Lily called Mia on the phone." -> "Before bed, Lily called Mia on the phone." (Thai: ก่อนนอน) | The sentence before it ends on "the next morning"; the call is the same evening |
| L14 | MCQ m2, m3, m4 and SAQ s4 moved to the past | Narrator tense ("listed", "was on page") |
| L14 | Hero picture: "Lily and Teacher Kim stand at the table" -> Teacher Kim stands and hands out copies, Lily and Leo sit; picture 2: Pip removed (he comes in paragraph 3), characters field "Lily, Pip" -> "Lily" | Text: the Explorers sat in the library; Pip is not in paragraph 2 |

## 6. Adventure 8.2 (editor ed8-2)

All 14 converters: PASS, 0 FAIL.

| Lesson | Change | Reason |
|---|---|---|
| L01 | Picture 3: Lily's list, Mia's textbook, Teacher Kim smiling at the front -> Teacher Kim near Leo, Leo looks at his shoes, Mia and Lily look at each other | Picture 3 showed paragraphs 4 and 5; picture N must show paragraph N |
| L02 | Text: "Leo raised both hands and grinned" -> "Leo raised his hand high and grinned" (Thai changed) | Four children, so four hands; "both hands" made five |
| L02 | MCQ m3, m4, m5, m6, m8 and SAQ s2, s3, s4, LAQ l4 moved to the past ("Who says" -> "Who said"; s3 "What does Mia want to do" -> "What did Mia want to build ... She wanted to build a machine."; s4 "Which place comes first?" -> "Which place did the Explorers choose first? They chose the museum first.") | Narrator tense |
| L02 | MCQ m9 distractor "on the next Thursday" -> "a day after the museum" | The text gives no weekday for the museum, so the old option was not clearly false |
| L02 | Picture 2: "Nobody is in front of the posters" -> Lily looks at the posters (characters: Lily). Picture 3: the vote (paragraph 4) -> May thinks, Mia raises her hand, Teacher Kim listens (paragraph 3) | Paragraph 2 begins with Lily; picture N must show paragraph N |
| L03 | Text: "Teacher Kim had asked her" -> "Teacher Kim asked her" (Thai unchanged) | Level 8 has no past perfect |
| L03 | Text: added tag "said Lily" after "We are twenty-four children and one teacher" (Thai: ลิลลี่พูด) | A new speaker after the receptionist had no tag |
| L03 | MCQ m4, SAQ s2, s3, s4, LAQ l2 moved to the past; s4 model answer: "She asks the receptionist to repeat the time." -> 'She asked, "Would you repeat the time, please?"' | Narrator tense; the old answer was indirect speech |
| L03 | Pictures 2 and 3 rewritten. Old picture 2 was the full notepad (paragraphs 3-5); old picture 3 was the phone screen (paragraph 2). New picture 2: phone screen "Science Museum" and "00:45", Lily writes "Tue to Sun" and "9:00 a.m. to 5:00 p.m." New picture 3: Lily talks on the phone to the receptionist (voice only) | Picture N must show paragraph N |
| L04 | Text: "He had saved his pocket money" -> "He saved his pocket money" | Level 8 has no past perfect |
| L04 | MCQ m1-m10 moved to the past; m4 distractors "too long / too dark / too heavy" -> "too big / just right / too loose" | Narrator tense; "too long" and "too dark" were not made false by the text |
| L04 | SAQ s2 model answer: "He said that they were too small now." -> 'He said, "They are too small now."' | Reported speech |
| L04 | Pictures rewritten to follow paragraphs 1, 2, 3. Hero showed Tom trying on a boot (paragraph 2) -> Tom puts the old boots on the bench, Ben with the ball, assistant walks over. Picture 2 showed the sale tag (paragraph 3) -> Tom tries the boots. Picture 3 showed the receipt (paragraph 4) -> Ben reads the tag, SALE sign | Picture N must show paragraph N |
| L05 | Text: "Teacher Kim had given" -> "Teacher Kim gave"; "Lily had put" -> "Lily put" | Level 8 has no past perfect |
| L05 | MCQ m9, m10 and SAQ s3, s4 moved to the past; s3 model answer is now the direct quote 'She said, "Please check your timetable every evening."' | Narrator tense; indirect speech |
| L05 | Hero: "My week" -> the exact email lines ("This is my week.", "Monday: math, 8:00 a.m.", ...). Picture 2 showed the school timetable (paragraph 3) -> Lily packs her bag at home, old timetable "Mon: Math, English", Pip pushes the ball. Picture 3 showed Mia and the book (paragraph 5) -> Teacher Kim at the new timetable, Lily opens her bag | Picture N must show paragraph N; text on screen in the prompt |
| L06 | MCQ m10, SAQ s1, s3, s4, LAQ l3 moved to the past | Narrator tense |
| L06 | Hero: "Teacher Kim points at the bus stop" -> she stands next to the whiteboard with a paper copy; Explorers sit in pairs | Paragraph 1 has no pointing; the pairs agree with the text |
| L06 | Pictures 2 and 3 rewritten. Old picture 2 was the key (paragraph 4); old picture 3 was the red route (paragraph 5). New picture 2: Teacher Kim reads, Lily follows with a pencil, Mia touches the bank (paragraph 2). New picture 3: Teacher Kim points at the museum, Leo and May look (paragraph 3) | Picture N must show paragraph N |
| L07 | Text: "Teacher Kim read my post first, and then she put it on the blog." -> "Teacher Kim will read my post first, and then she will put it on the blog." (Thai changed) | The post cannot be online while Lily is writing it |
| L07 | MCQ m2, m3, m9 moved to the past; m5 distractor "a bike" -> "a car" ("bike" is near "motorbike") | Narrator tense; one option was nearly true |
| L07 | MCQ m8 "What does the blue whale not have? a heart / a tail / eyes / a single tooth" -> "What did Guide Ann say about the blue whale's teeth?" with four tooth options | "A tail" and "eyes" were not made false by the text |
| L07 | SAQ s3 'She says that it is the biggest animal ...' -> 'She said, "The blue whale is the biggest animal on our planet."'; s4 and LAQ l5 to the past | Reported speech; tense |
| L07 | Pictures rewritten to follow paragraphs 1, 2, 3. Hero showed Guide Ann and the "BLUE WHALE: 25 meters" sign (paragraph 2) -> the Explorers look up at the whale, no Guide Ann, no sign. Picture 2 was the quiz screen (paragraph 5) -> Guide Ann (look line) gives the talk. Picture 3 was the tape (paragraph 5) -> Guide Ann points at the chest, children write, Leo raises his hand | Picture N must show paragraph N |
| L08 | Text: "Teacher Kim read my post first." -> "Teacher Kim will read my post first." (Thai changed) | The post is not read yet while Mia writes it |
| L08 | Text: 'she says that boiled water is safe to drink' -> 'she says, "Boiled water is safe to drink."' (Thai quotes; MCQ m7 evidence changed) | Reported speech |
| L08 | MCQ m10 "Where does the clean water go at the end?" -> "...go after the big center?" | "To the bathtub" was also true for step four |
| L08 | LAQ l4 "Lily says that the technology is simple." -> 'Lily said, "The technology is simple."' | Reported speech in a question |
| L08 | Hero: Mia "holds up" the diagram -> Mia draws on a large sheet | Text: "I drew a diagram" |
| L09 | Text: "It touched a wall" -> "The robot touched a wall" (Thai: หุ่นยนต์) | "It" had no clear noun |
| L09 | Fill: 'Step four: ... move the robot to the ___.' = exit -> 'Step three: type the ___, which is robot.' = password | "FINISH" also fits the old sentence (the board end square) |
| L09 | Picture 3: removed "A white number cube lies next to the board" | The cube is only in the email; the text does not show it at this point |
| L10 | Text: "because they love stories" -> "because they loved stories" | Tense agreement |
| L10 | Text: "found the lion in the net" -> "found the lion on the ground" (Thai changed); picture 3 "net of thick ropes" -> "on the ground, tied with thick ropes" | The hunters tied the lion with ropes; no net |
| L10 | MCQ m5 true option shortened to "The mouse was too small to help a king."; m10 to the past | The true option was much longer than the others; narrator tense |
| L11 | "chilli" -> "chili" in text, glossary, MCQ, front matter `glossed` | Writer decision: American spelling |
| L11 | Text: ingredients "and salt" -> "salt, and pepper" (Thai: เกลือ และพริกไทย); step six "add the eggs and mix" -> "add the eggs and mix, and put a slice of chili on top" (Thai changed) | Step three uses pepper and the list had none; the chili had no step |
| L11 | Fill: "Teacher Kim, Mia, Leo, May, and I put on white ___." -> "Chef Lucy gave us white ___." = aprons | The old sentence was not in the text |
| L11 | LAQ l2, l5 to the past; hero: removed "On the counter are eggs, a bowl of rice, garlic, mushrooms, and a small red chili" | Narrator tense; the ingredients come in paragraph 2 |
| L12 | Name "Alice" -> "Nora" everywhere: title ("Miss Nora and the Book Boat"), `names`, summary, text, glossary, questions, Print, Activities, pictures; Thai มิสอลิซ -> มิสนอรา | Alice is on the list of names not to use for new people; "Nora" is in no lesson, plan, or cast list (grep) |
| L12 | Text: "Teacher Kim read my post first." -> "Teacher Kim will read my post first." (Thai changed) | The post is not read yet while May writes it |
| L12 | Glossary: removed a stray fifth column on "grandchild" (a copy of a text sentence); "married | adjective | Having a husband or a wife." -> "married | verb | To become the husband or the wife of a person." (Thai: แต่งงาน (กับ)) | Format error; the text uses "married" as a verb |
| L12 | LAQ l4 "Why is the boat in the museum today?" -> "Why do you think the boat is in the museum today?"; picture 2 "woman of about forty" -> "young woman of about twenty-two" | The text does not say why; paragraph 2 says she was 22 when she started the boat |
| L13 | MCQ m9 distractors "have a pony / have a boat" -> "are indoors / are too busy"; m10 distractor "Ravi's park is bigger than Nadia's club" -> "Ravi's park is as busy as Nadia's club"; LAQ l5 to the past | The text did not make the old options false (the text says the emails do not give the size); narrator tense |
| L14 | MCQ m7 distractor "fruit and cake" -> "bread and milk" | Mango is fruit, so the old option was half true |
| L14 | Picture 3: paw print already on the card and Pip lifts a painted paw -> Pip presses the painted paw on the card corner | The print and the lifted paw were in the same picture; the text order is lift, paint, press |

## 7. Adventure 8.3 (editor ed8-3)

All 14 converters: PASS, 0 FAIL.

| Lesson | Change | Reason |
|---|---|---|
| L01 | Text: last line "A wonderful holiday can be near or far." -> "Lily thought about her wonderful holiday at Green Hill." (Thai changed) | Narrator moral sentence (bible §7); "wonderful" stays in the text |
| L01 | MCQ m4 distractor "He swam in the lake." -> "He slept in a hotel." | The campsite was by a lake, so the old option could be true |
| L01 | MCQ m9 distractors "a noisy one / a cold one / a long one" -> "an exciting one / a camping one / a seaside one" | The text did not make the old options false; the new ones are false by the text (Mia stayed at home, "not exciting") |
| L02 | Text: "A week later, on day seven" -> "Six days later, on day seven" (Thai: หกวันต่อมา) | Day one to day seven is six days |
| L02 | MCQ m2, m4, m5, m6, m7, m8, m9, m10 and SAQ s1, s2, s3 moved to the past ("What does Mia pour" -> "What did Mia pour ... She poured") | Narrator tense; question tense must match |
| L03 | MCQ m1, m4, m7, m9 and SAQ s4 changed ("What is the name" -> "What was the name"; "leave" -> "will leave"; "do ... meet" -> "will ... meet"; s4 "finds" -> "found") | Narrator tense; plans use "will" |
| L03 | MCQ m7 distractor "They are all children." -> "They are a group of four." | May says "more than ten children", so "all children" was also true |
| L03 | Fill "Teacher Kim went to the ___." = board -> "Lily copied the words into her ___." = notebook | "port" or "bridge" (glossed words) also fit the old sentence |
| L04 | Text: "Soon the boat came to a small pier with a sign" -> "Soon the boat stopped at Park Pier. Then it came to a small pier with a sign" (Thai added) | The voice had said "Next stop: Park Pier"; the boat cannot skip it |
| L04 | Text: '"I thought that the next stop was ours," he said.' -> '..., said Leo.' (Thai changed) | Speaker changed from May to Leo with no name tag |
| L04 | Text: last line "A diagram helps a lot, but you must read it with care." -> "Leo gave May the biggest piece, because she counted the stops." (Thai changed) | Narrator moral sentence |
| L04 | MCQ m1 true option shortened to "They played in the river park." | It was much longer than the other options |
| L04 | MCQ m5: 'What did May say about the next stop? She said that ...' options -> 'What did May say to Leo ...? "I think so." / "Yes, it is ours." / "You are right." / *"I don't agree."' | Reported speech in the options |
| L04 | Picture 2: removed "A few other children wait on the pier." | The text puts only Teacher Kim, Mia, and Lily on the pier |
| L05 | MCQ m7 distractors "the worms / the duck" -> "being outdoors / her sandwich"; m8 distractors "the sandwich / the cold wind / the picnic" -> "fishing / the cool day / going with Dad"; m9 distractor "go to the lake again" -> "have a picnic again" | The text did not make the old options false (Tom never says he liked the cold wind; the worms were Tom's dislike, not Lily's) |
| L05 | Thai: "นายเห็นด้วยไหม" -> "พี่เห็นด้วยไหม" (Lily to Tom, line 63) | "นาย" from a girl to a boy; Tom is her older brother |
| L06 | Text: last line "Kind words can work better than strong hands." -> "Then the three of them walked through the gate together." (Thai changed) | Narrator moral sentence; "gate" fits the scene |
| L06 | Front matter `names`: removed "Pip" | Pip is not in the text or the pictures (the map has no Pip in L06) |
| L07 | Text: "Teacher Kim read my post first, and then she put it on the blog." -> "Teacher Kim will read my post first, and then she will put it on the blog." (Thai changed) | The post cannot be online while May writes it |
| L07 | Text: added "I asked" after "How long have you been the football coach?" (Thai: ฉันถาม) | The speaker changed back to May with no tag |
| L07 | MCQ m10 "What does May ask at the end of the post?" -> "What is the last question in the post?" | Two questions end the post ("Do you know a person ...?" and "Who shall I ask next?"), so the old question had two true answers |
| L08 | Text: last line "A good team needs different people, and every one of them is important." -> "Lily looked at the sheet and smiled." (Thai changed) | Narrator moral sentence; "important" is still in line 29 |
| L08 | Thai: "เพราะเธอมีแผนและคู่ที่ดี" -> "เพราะเธอมีคู่ที่ดี" | The English has no "plan" |
| L08 | MCQ m4, m7 to the past; m5 'when Mia said that he is never shy' -> 'when Mia chose him to ask'; m6 'Why does May not agree ... She thinks that ...' -> 'What did May say about Leo? "Leo is not serious."' and direct-quote options; m8, m10 to "will" ("Where did Leo say that ..." -> "Where will the friends meet on Saturday?") | Narrator tense; reported speech in questions and options |
| L08 | SAQ s2 and s3 model answers: 'She thought that Leo was never shy.' -> 'She said, "He is never shy."'; s3 now a direct quote | Reported speech in model answers |
| L08 | Picture 3: sheet text "Pair 1: May asks, Lily writes" ... -> '"Asks: May, Leo" and "Writes: Lily, Mia"' | The text says the sheet has two lines, "Asks" and "Writes" |
| L09 | Text: last line "A simple recipe can make a cool day warm." -> "Lily pressed the button, and the email went to Ravi." (Thai changed) | Narrator moral sentence |
| L09 | Text: "Lily put the spoon on the counter." -> "Lily added the lemon." + "She put the spoon on the counter." (Thai changed) | The last step says honey and lemon, but the text never added the lemon (MCQ m6 asks what Lily added) |
| L09 | MCQ m5 distractors "You must peel the lemon." / "You should peel the ginger twice." -> "You must peel it with a knife." / "You should peel it after cooking." | The text says nothing about lemon peel |
| L09 | MCQ m9 "When does ginger tea help, by the email?" (three unmentioned options) -> "What did Tom and Lily not use in the tea?" honey / lemon / ginger / *sugar | The text did not make the old options false; the new answer follows "we did not use any sugar" |
| L09 | MCQ m10 "What does Lily ask Ravi?" -> "What did Lily ask Ravi?" with direct questions in quotation marks | Narrator tense; indirect questions in the options |
| L10 | Text: last line "A good detective looks at the clues and thinks." -> "Pip sneezed, and everybody laughed again." (Thai changed) | Narrator moral sentence |
| L10 | Text: "Tom opened the closed door slowly." -> "Tom pushed the half-open door slowly." (Thai changed) | Pip was inside, and a puppy cannot close a door behind him |
| L10 | MCQ m3 'Why did Tom say that the footprints were not his?' -> 'Why were the footprints not Tom's?'; m4 -> 'Why were the footprints not Dad's?' with options in the past | Reported speech in the question; the options mixed past and present |
| L11 | Text: last line "Good rules help everybody to enjoy the day." -> "Then the bell rang." + "The Explorers went home." (Thai changed) | Narrator moral sentence |
| L11 | Text: "a green flag and a paw print" -> "... on the front" (Thai changed); MCQ m7 distractor "the name of the child" -> "a photo of the child" | The card name could be on the back, so the old option was not clearly false |
| L11 | MCQ m6 "What does rule five say?" -> "What did rule five say?"; m10 "Why does May say that rule five is easy?" -> "Why was rule five easy for May?" with past options; print hint "Rule three says" -> "Rule three said" | Narrator tense; reported speech in a question |
| L12 | Text: deleted the last line "A kind question can open a long story." (and its Thai) | Narrator moral sentence; the text keeps 403 words, 5 paragraphs |
| L12 | MCQ m3 distractor "birds" -> "cats" | Ducks are birds, so the old option was also true |
| L13 | Text: last line "A good fact file helps us to see a small creature with new eyes." -> "Mia clicked send." + "The two girls smiled, because the small creature was safe in its hole." (Thai changed) | Narrator moral sentence; "creature" (a glossed word) stays in the text |
| L13 | MCQ m10 "What does Mia say about Pip and geckos?" -> "What did Mia say ..." | Narrator tense |
| L14 | Text: last line "A good email ends with a question, and a good friend writes back." -> "Pip lay down again under the chair." (Thai changed) | Narrator moral sentence |
| L14 | MCQ m4 distractors "to Market Pier / Town Pier / School Pier" -> "to the beach / to the museum / to the school"; m5 distractor "They grew beans in jars." -> "They visited Hill Pier." | The Explorers did stop at Market Pier and Town Pier on that day (L04), and the text gives no date for the beans, so the old options were not clearly false |

## Revision History

- 1.0 — 2026-10-07 — First version: three editors, Claude's check of words, dates, and swaps.
