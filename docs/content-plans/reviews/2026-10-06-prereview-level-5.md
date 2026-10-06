# Pre-review of level 5: Quest 5 and bank-5

Version 1.0 | Date 2026-10-06 | Status: Draft (for Daniel) | Owner: Daniel Bo | Internal

Track: `measure/tracks/levels_5_9_20261006/`. This is the pre-review step of the plan (map, packages, pre-review, media, Daniel's approval). The method is the same as in [`2026-10-03-prereview.md`](2026-10-03-prereview.md). Four editors read all 50 packages: the text, the glossary, the question bank, the print set, the activities (Quest 5), and the picture plans. They fixed the faults in the sources (`<book>/src/<lesson>.md`) and converted them again. Claude read every text before the pre-review and checked the editors' work. All 50 packages are still draft. Only Daniel approves. No picture and no audio exists yet, so a changed picture plan costs nothing.

## 1. Result

| Book | Packages | Changes by the editors | Checks |
|---|---|---|---|
| Quest 5 (`quest-5`) | 14 | 76 (L01–L07: 37, L08–L14: 39) | 14 PASS, 0 FAIL |
| bank-5 | 36 | 92 (b001–b018: 33, b019–b036: 59) | 36 PASS, 0 FAIL |

After the pre-review, the targets, the supporting objectives, and the glossed words of each package still agree with the Quest 5 map and the bank-5 plan. There is one planned swap: b017 glosses "week" in place of "blond", because a blond Thai boy does not fit the story world. "blond" stays glossed in b021 and Quest 5 L14. The level 5 coverage report (`level-plans/coverage-5-9.md`) meets every goal: all 31 objectives are a target in 3 or more packages, and the packages gloss 354 of the 355 Movers words. The last word, "get undressed", goes to level 6.

## 2. The most frequent faults

The script checks did not find these faults. The checks count words and levels. They do not read grammar, story logic, or pictures.

- **An MCQ with two true options (about 25).** For example: Quest 5 L06 m5 "What does Lily like?" (she likes fish, pasta, and salad); bank-5 b003 m5 "It is sunny" (the text says "The sun was bright"). The fix is one true option and three options that the text makes false.
- **A fill item with two possible answers (about 10 rows, some with several items).** For example: "Tom is ___ than Lily" (taller or older), "Is ___ with you?" (someone or anyone). The editors chose sentences with one answer.
- **A picture plan that does not agree with the text (about 40).** Food on the table that never comes (L06), a pancake flip that does not happen (L10), the wrong room (L12), a balloon in the wrong hand (b027), sign and menu text missing from the prompt (b028, b034).
- **Story logic (more than 10).** A rainbow "after the rain" on a dry day (L03), salt in the bowl after the batter is in the pan (L10), a kiss for Pip after Lily gives away the phone (L02), Pip under the table and behind the gate at the same time (b028), a calendar that knows the rain of a later day (b031).
- **A speaker or a narrator that is not clear (about 10).** Two quotes in a row with a new speaker and no tag (b022, b033, b034); "I" with no name in the first lines (L01, L03, L08).

## 3. Facts that agree across the level

Claude made these facts agree in all 50 packages and in the map:

| Fact | Where |
|---|---|
| Grandpa is 70 (L01) and 71 on his birthday, Sunday the 22nd of November. The secret party is at home on Saturday the 21st at four o'clock. | Quest 5 L01, L09; b031 |
| November 2026 starts on a Sunday. The 21st is the school fun run. The fishing trip with Grandpa is on the 28th. | b031, b032 |
| Aunt Sue is Mom's younger sister (Thai น้า). She is a nurse in Chiang Mai. Uncle Dan is Dad's older brother (Thai ลุง). | Quest 5 L02; b008, b016, b028 |
| The new boy in Tom's class is Hugo. Alex is a pen pal in Singapore (series bible), so the bank does not use the name. | b017, b034 |
| May and Pat live with their parents and their grandma. | b020, b033 |
| Ages at level 5: Tom and Ben 11, Sam 10, May 10, Lily, Mia, and Leo 9, Pat 7. | all |
| Green Hill, the grandparents' village, is near the town (the bible: the grandparents live near the family). | b009 |

## 4. Questions for Daniel

1. **Mom's job.** b014 and b015 make Lily's Mom a nurse at a big hospital. The bible gives her no job. Keep it, or give her another job?
2. **British words from the Cambridge lists** (the same question as Q2 of the October 3 pre-review): "football", "film", "flat", "trousers", "sweets" (b009). Keep the Cambridge words, or use "soccer", "movie", "apartment", "pants", "candy"?
3. **Pip in a café and at school.** Quest 5 L06 and L07 have Pip in a café, and L04 has Pip on the school field. The approved map has him there. Keep?
4. **Quest 5 L05 sign.** The sign in the hero picture now repeats the four notice lines of the text. The map brief had shorter lines. Keep the text lines?
5. **b014 "Lie on your back".** Mom tells Leo to lie on his back after he eats too much. "Sit and rest" is better advice, but the chant and the glossed word "back" use the line. Keep?
6. **b031 and b032 s5.** The model answer "Today is Tuesday, the sixth of October." is true only on one day. It is a personal question, so the editors kept it.

## 5. Thai to check

Claude and the editors wrote new Thai for every changed English sentence. The tables in sections 7 to 10 list them. Daniel checks all Thai. Points for a decision:

- One Thai word for "jungle": b004 has ป่าดงดิบ, and b010 and Quest 5 L11 have ป่าดิบ.
- "funfair" is งานรื่นเริง in Quest 5 L14 and b027 (งานวัด is a temple fair).
- Quest 5 L08 clock times ("สี่โมงเย็นน้อยสิบห้านาที") are correct but long.
- Quest 5 L09: "งานเลี้ยงลับ" or "งานเลี้ยงเซอร์ไพรส์" for "a secret party".
- b018 "เชิญเลย" for "go on"; "ว่ามาเลย" may sound more natural.
- Register: Quest 5 L01 now says พ่อกับแม่ (was ท่าน) for Mom and Dad.

## 6. What Daniel must do

1. Answer the questions in section 4.
2. Read the Thai of the changed sentences (sections 7 to 10).
3. Approve the text of each package, or send changes. Then Claude makes the pictures and the audio, and Daniel checks them on `/review`.

## 7. Quest 5 L01–L07

| Lesson | Change | Reason |
|---|---|---|
| L01 | Opening reordered: "My name is Lily, and I am nine years old." now comes first; "Teacher Kim asks the class" -> "asks my class" | "I" had no name in the first two sentences. |
| L01 | "we go to their house" -> "we go to Grandma and Grandpa's house" | "their" followed "they" (the stories); it was unclear. |
| L01 | m10 question: 'mean in "I am nine"' -> 'What is the short form of "I am"?' | "I am nine" is not in the text. |
| L01 | Fill "Tom is ___ than Lily = taller" -> "Dad is the ___ person in our family = tallest"; fill "Mom and Dad ___ work = both" -> 'Grandma says, "I am the ___ age!" = same' | "older" fits the first one too; "also", "always" fit the second. |
| L01 | Picture inline-para-2: "bald with a bushy white mustache and round glasses" removed | The sheet fixes the cast look. |
| L02 | "Tom comes in and laughs" -> "Tom comes to the sofa and laughs" | Tom is already home ("Tom is here"). |
| L02 | "Is someone with you?" -> "Is someone with you on the sofa?" | Aunt Sue knew Tom is home; the question was empty. |
| L02 | Last lines reordered: the kiss for Pip now comes before "Mom comes home"; the story ends with "Lily gives the phone to Mom." | Old order: Lily gave the phone to Mom, then Aunt Sue asked Lily for a kiss. Lily had no phone. |
| L02 | m9 "Who is awake, and who is not asleep at all?" -> 'Who is "not asleep at all"?' | Aunt Sue says "I am awake", so "Aunt Sue" was also true. |
| L02 | Fills: "Is ___ with you? = someone" -> "Some nights Aunt Sue is ___ ... = awake"; '"___ ?" = Pardon' -> "Aunt Sue calls on a phone ___. = app" | More than one answer fit (anyone / Sorry / What). |
| L02 | Hero: "Aunt Sue" added to characters; her look removed from the prompt | She is on the screen and has a sheet. |
| L03 | "This week I write" -> "My name is Lily, and this week I write" | "I" was not clear. |
| L03 | "He never likes a storm." -> "Pip never likes a storm." (text and m10 evidence) | "He" read as Tom, but m10 asks about Pip. |
| L03 | "a big rainbow comes above the school field" -> "it rains, and then a rainbow comes." + "The big rainbow is above the school field." (m7 evidence updated) | The rain stopped on Friday, but Saturday had "after the rain". |
| L03 | m4 options "sunny / cloudy" -> "a sunny day / a cloudy day" | The options had different forms. |
| L04 | m7 option "It has no stripe." -> "It has a white hat." | The second jacket has no stripe, so it was also true. |
| L04 | Fill "Tom takes a T-shirt ___ his bag = out of" -> "a dry T-shirt ___ of his bag = out" | "from" also fits. |
| L04 | Order "Tom gives Pip a big hug." -> "Tom drops his bag." | The text says "He gives Pip a big hug." |
| L04 | Picture inline-para-2: "blue jacket with a white stripe and a pocket" -> "plain blue jacket with a pocket and no stripe" | Coach Matt holds the wrong jackets in the text; Tom's jacket is found later. |
| L04 | Glossary "off": adverb -> preposition | Text: "jumps off the bench". |
| L05 | "Leo smiles too." -> "Teacher Kim smiles, and Leo smiles too." | "too" had no earlier smile. |
| L05 | m5 evidence "Mia puts up her hand." -> '"Can I take two comic books?" she asks.' | The old evidence did not show the question. |
| L05 | Order "...while she waits" -> "...and waits" | Not the exact text. |
| L05 | Glossary "any": new definition ('A word that you use in a "no" sentence, like "not any"') | Text use is "can't take any more". |
| L05 | Hero sign text now matches the notice in the text ("You must be quiet." / "You mustn't run." / "You have to wash your hands first." / "You can choose only two books every week.") | The old sign had other words ("Be quiet.", "No running."). |
| L05 | Picture inline-para-2 "low shelves" -> "a big box"; inline-para-3: Mia whispers + e-book girl -> Leo laughs at a comic book, Mia looks; caption 'Lily says, "Shh!"' -> "Lily puts her hand on her mouth." | Text: books come from a big box; Lily does not say "Shh"; Leo causes the gesture. |
| L06 | m2 "What does Grandpa like?" -> "What does Grandpa say about the fish?" (answer "It is delicious.") | "pasta" was also true: Grandpa shares it. |
| L06 | m5 "What does Lily like?" -> "Who likes salad more than fish?" | Lily also likes fish and pasta; three options were true. |
| L06 | m6 option "carrots" -> "the sauce" | Carrots are vegetables; it was also true. |
| L06 | m7 "Who does not like salad?" -> 'Who says, "And I don't like salad"?' | Tom does not like vegetables, so "Tom" was also true. |
| L06 | l4 "do not like the same things as Lily" -> "like different food" | Grandpa likes fish like Lily. |
| L06 | Pictures: hero table "pasta, salad, fish" -> "three glasses of juice and a menu" (Pip added); inline-para-2 "plate of fish" -> "the menu" | The fish and salad never reach the table. |
| L07 | m5 option "at the square" -> "at the school" | The café is in the square; the option was also true. |
| L07 | s2 "How do Tom and Lily know the library?" -> "What does Lily say about the library?" | The old question did not match the answer. |
| L07 | Glossary "down": preposition -> adverb | "go down to the square". |
| L07 | Fill "___ I show you? = Shall" -> "Tom takes Pip ___ of the café. = out" | "Can" fits the old one. |
| L07 | Pictures inline-para-2 and -3: Teacher Nick and Lily added | They are in both scenes in the text. |

## 8. Quest 5 L08–L14

| Lesson | Change | Reason |
|---|---|---|
| L08 | Added "I am Lily. This is our Sunday at the lake." (was "This is our day at the lake.") | "I" had no clear narrator; the hero sign says "SUNDAY" but the text never said Sunday. |
| L08 | m1 "What time do they take the bus?" to "...the bus to the lake?" | The bus also goes at a quarter past four. |
| L08 | s3 "Why can't Pip come in the boat?" / "Grandpa says, 'Not today.'" to "Can Pip come in the boat?" / "No, he can't. Grandpa says, 'Not today.'" | The text gives no reason. |
| L08 | Glossary "more": adverb to adjective | "More, please!" / "more watermelon" is not an adverb. |
| L08 | Print hint "I get up at ___." to "They get up at ___." | s1 asks "they". |
| L08 | Picture 2: "calm blue lake" to "calm green lake" | Text: "The lake is green." |
| L08 | Picture 3: added Lily and Grandpa; "under a big tree"; sandwiches | Text: "we eat" and "we sit under a big tree". Lily and Grandpa were missing. |
| L09 | "on Saturday at four o'clock" to "on Saturday, the twenty-first, at four o'clock" (Thai and m6 evidence also) | The brief says Lily gives the day and the date. Agrees with the fixed fact (party on Saturday the 21st). |
| L09 | s2 "Why is the party a secret?" / "...a normal family dinner" to "What does Grandpa think?" / "...a small family dinner" | The text gives no reason for the secret; the model answer used a word that is not in the text. |
| L09 | s4 "They buy a card." to "They buy a book." | Text: "to buy a book". Wrong model answer. |
| L09 | Picture 3: Aunt Sue added to characters; look text removed ("woman of about forty", "short black bob") | Aunt Sue has a cast sheet. She is Mom's younger sister, so "about forty" could conflict with the sheet. |
| L10 | "Tom puts salt in the bowl, not sugar." to "Tom puts salt on his pancake, not sugar." (Thai also); "eats a pancake" to "eats the pancake" | The batter was already in the pan (step four). Salt in the bowl could not spoil the pancake. m8, the fill item, and s4 follow. |
| L10 | m8 "What does Tom put in the bowl?" to "What does Tom put on his pancake?" | Follows the text change. |
| L10 | s4 "What is the difference between salt and sugar?" to "Why does Tom say, 'Yuck!'?" / "He puts salt on his pancake, not sugar." | The text does not explain the difference; the old answer used outside knowledge. |
| L10 | Fill list: "Step one ... = flour", "Step two ___ = add", "mix ___ = slowly" replaced by "Step ___: turn the pancake ... = five", "...the flour goes on the ___ = floor", "The pan is hot and ___ = dangerous" | Eggs also fit step one; "put" also fits "add"; "carefully" also fits "slowly". |
| L10 | Hero: the "SHOPPING LIST" note replaced by an old open recipe book (heading removed) | The text has no shopping list; it has Grandma's old book. |
| L10 | Picture 3: "Tom flips a pancake in the air; Pip jumps" to "Tom wrinkles his nose at a pancake; Dad laughs; Pip next to the table"; caption "Yuck!" | Nobody flips a pancake in the text. The new scene is "Yuck!". |
| L11 | Glossary: worse "More bad than before." to "Not as good as before."; worst "The most bad of all." to "The least good of all."; better "More good than before." to "Nicer than before." | "More bad" and "more good" are not English. |
| L11 | m4 distractor "an umbrella" to "blue boots" | At the end all the children have umbrellas, so May has one too. |
| L11 | m10 distractor "a gray cloud" to "a red balloon" | The sky may still have clouds at the end. |
| L11 | Hero and pictures 2 and 3: clothes added (Mia red coat, Leo blue boots, May yellow hat, Lily green sweater) | The text fixes these clothes; the prompts omitted them. |
| L11 | Picture 2: "Leo holds a paper frog and a paper star" to "Leo draws a fat green frog and a small yellow star behind a gray cloud on the board"; characters Leo, Lily, May | Text: Leo "adds" them to the chant; Lily and May laugh. Nobody holds paper. |
| L12 | "Tom sat on the sofa all day." to "...all afternoon." (Thai also) | Tom was at school in the morning. |
| L12 | m3 "What did Tom not do before school?" (3 distractors the text never mentions) to "When did Tom get up on Monday?" / "late" (evidence "I got up late.") | The old distractors were not false by the text. |
| L12 | m7 distractor "He didn't drink." to "He had a high temperature." | "He didn't drink" is not false by the text. The nurse says the temperature is OK. |
| L12 | Print hint "Tom had a ___." to "Tom had a ___ and a ___." | s1 has two answers. |
| L12 | Fill: "headache and a ___ = stomach-ache" and "didn't ___ any breakfast = eat" replaced by "What's the ___, Tom? = matter" and "took Tom ___ = home" | "toothache" also fit the first; "have" also fit the second. |
| L12 | Picture 3: kitchen table to living room sofa; glass of water removed | Text: "Tom sat on the sofa". |
| L13 | m6 "Where is ice skating for?" to "What does Coach Matt say about ice skating?" with four full options | The old question was not grammatical. |
| L13 | s2 "What was in the red team?" to "Who was in the red team?" | Grammar. |
| L13 | Picture 2: Ben holds Tom's hand to Coach Matt holds Tom's arm; Lily and Sam watch from the grass | The text matches: "Coach Matt held his arm", "Sam and Lily watched from the grass". Ben is not there. |
| L13 | Fill list: "tennis ___ = racket", "skated ___ at first = badly", "Tom was in the ___ team = red" replaced by "skating with ___ = wheels", "for ___ places = cold", "two ___ for a race = teams" ("faster" kept) | "tennis ball" also fit; "slowly" fit; red and blue were both possible. |
| L13 | Thai "เป็นของที่เย็นๆ" to "เหมาะกับที่ที่หนาวเย็น" | The old Thai did not mean "for cold places". |
| L14 | "Then Pip saw a cat and dropped his red ball." / "He ran after the cat between the people." to "...and ran after it." / "He ran between the people with his red ball." (Thai also; m6 evidence also) | Pip dropped the ball and then slept with it. The ball now stays with him. |
| L14 | m1 options "hot and blue" etc. to "a hot day with a blue sky" / "a cold day with rain" / "a windy day with gray clouds" / "a cold day with snow" | "hot and blue" is not a weather. |
| L14 | m5 distractor "a white costume" to "a polar bear costume" | A white costume could be Sam's polar bear suit. The new option is clearly Sam's. |
| L14 | m9 distractor "next to a red ball" to "inside a red box" | Pip was next to his red ball, so that option was true. |
| L14 | Picture 2: "A small red lead lies empty on the grass" removed; "People clap around them" and "Ben is a film star in big sunglasses" | Pip sits next to Lily at that moment, so there is no empty lead. |
| L14 | summary_th "งานวัด" to "งานรื่นเริง" | งานวัด is a temple fair. The rules say no religious practice. |

## 9. bank-5 b001–b018

| Article | Change | Reason |
|---|---|---|
| b001 (Text) | "It went down the grass and into the water." -> "It rolled down the grass and into the water." | "went down the grass" is not natural; the Thai already says "rolled". |
| b001 (Text) | "river / noun / A long water that goes to the sea." -> "river / noun / A long stream of water that goes to the sea." | "A long water" is not natural English (glossary). |
| b002 (Text) | "They had a green frog and a yellow bird. / พวกเธอมีกบสีเขียวกับนกสีเหลือง" -> "They had a green frog puppet and a yellow bird puppet. / พวกเธอมีหุ่นกบสีเขียวกับหุ่นนกสีเหลือง" | The reader did not know that the frog and the bird are puppets (later "hold the frog", "the frog fell"). |
| b002 (Picture) | "Tom holds out a big white towel to a frog puppet. Mia holds the frog, and Lily dries it with the towel. The rain has stopped and the sun is " -> "Tom holds out a big white towel at the open door of the house. Mia holds the frog puppet, and Lily dries it with the towel. Gray rain still " | In the text the girls dry the frog before the rain stops, so the sun is not out yet. |
| b003 (Question) | "m5 / What is the weather like at the lake? / *It is windy. / It is cold. / It is hot. / It is sunny." -> "m5 / What is the weather like at the lake? / *It is windy. / It is cold. / It is hot. / It is raining." | "It is sunny" was also true by the text ("The sun was bright"). |
| b004 (Question) | "He doesn't have any plans." -> "He doesn't have any new games." | The text says "I don't have any new games", not plans. |
| b004 (Text) | ""Why are my plants on the floor?" she asked. / "ทำไมต้นไม้ของแม่อยู่บนพื้น" แม่ถาม" -> ""Why are my plants here?" she asked. / "ทำไมต้นไม้ของแม่มาอยู่ที่นี่" แม่ถาม" | The text never puts the plants on the floor. |
| b005 (Text) | ""Now it's worse!" he said." -> ""Now it's worse!" said Tom." | After "Lily laughed, too." the pronoun "he" can mean Tom or Pip. |
| b005 (Text) | "need / verb / To have to have something." -> "need / verb / To want something because you must have it." | Definition was not clear English. |
| b006 (Text) | "Now Tom and Lily were not hungry, and the night was quiet again. / ตอนนี้ทอมกับลิลลี่ไม่หิวแล้ว และกลางคืนก็กลับมาเงียบสงบอีกครั้ง" -> "Now Tom was not hungry, Lily was not thirsty, and the night was quiet again. / ตอนนี้ทอมไม่หิวแล้ว ลิลลี่ไม่กระหายน้ำแล้ว และกลางคืนก็กลับมา" | Lily was thirsty, not hungry. |
| b006 (Question) | "m8 / What does Pip see outside? / *a cat on the wall" -> "m8 / What is outside the window? / *a cat on the wall" | The text says Tom sees the cat; it does not say what Pip sees. |
| b006 (Picture) | "Tom stands in front of an open kitchen cupboard and looks inside. Lily stands next to him in her pajamas and holds a glass." -> "Tom stands in front of an open kitchen cupboard and looks inside. Lily stands next to him in her pajamas and looks at him." | At this moment Lily has no glass yet (she takes it later). |
| b006 (Text) | "Now Tom was not hungry, Lily was not thirsty, and the night was quiet again. / ตอนนี้ทอมไม่หิวแล้ว ลิลลี่ไม่กระหายน้ำแล้ว และกลางคืนก็กลับมา" -> "Now Tom was not hungry, and Lily was not thirsty. / ตอนนี้ทอมไม่หิวแล้ว และลิลลี่ไม่กระหายน้ำแล้ว The night was quiet again. / กลางคืนกลับมา" | Lily was thirsty, not hungry (split to keep the longest sentence under the limit). |
| b007 (Text) | ""But a pancake is sweet, and pasta is not." / "แต่แพนเค้กหวาน ส่วนพาสตาไม่หวาน"" -> ""A pancake is sweet, and pasta is not," she said. / "แพนเค้กหวาน ส่วนพาสตาไม่หวาน" เธอพูด" | Two quotes in a row with no speaker after May; "But" was repeated. The speaker is now May. |
| b007 (Text) | "mean / verb / To say or show something with a word." -> "mean / verb / To want to say something." | The definition did not fit "What do you mean?" and "I mean ...". |
| b008 (Text) | "Then they walked down a street, but it was the wrong street. / แล้วพวกเธอก็เดินไปตามถนนสายหนึ่ง แต่เป็นถนนที่ผิด" -> "Then they walked out of the square and down the wrong street. / แล้วพวกเธอก็เดินออกจากจัตุรัสและเข้าไปในถนนที่ผิด" | The funfair is in Moon Square, so the girls must leave the square before Mia asks "Where is Moon Square?" |
| b008 (Thai) | "มีออกลัว" -> "มีอากลัว" | Thai typo in the name Mia. |
| b009 (Question) | "m6 / What does Ben ask for?" -> "m6 / What does Grandma offer Ben?" | Grandma asks "Would you like more rice?" and Ben only says yes. |
| b009 (Question) | "It is near Grandma and Grandpa's house." -> "It is a small village, and Grandma and Grandpa's house is there." | Grandma and Grandpa's house is in Green Hill, not near it. |
| b009 (Text) | "boots / noun / Strong shoes that go up over your feet and legs." -> "boots / noun / Strong shoes that cover your foot and part of your leg." | Definition was not clear English. |
| b010 (Text) | "Tom smiled. / ทอมยิ้ม" -> "Tom came in and smiled. / ทอมเดินเข้ามาและยิ้ม" | Tom appeared with no entry. |
| b010 (Question) | "m9 / What was the weather in the afternoon?" -> "m9 / What was the weather after twelve o'clock?" | Mom speaks at noon, not in the afternoon. |
| b010 (Text) | "boots / noun / Strong shoes that go up over your feet and legs." -> "boots / noun / Strong shoes that cover your foot and part of your leg." | Definition was not clear English. |
| b010 (Picture) | "two chairs and a table make a ship under a blue blanket. Pip sits on it in a paper hat." -> "two chairs make a ship, and a blue blanket on the floor is the sea. Pip sits on the blanket in a paper hat." | The text says two chairs are the ship and the blanket is the sea. |
| b012 (Picture) | "Leo wears a big yellow scarf and holds his cheek. / A cold, windy" -> "Leo wears a big yellow scarf and does not smile. / A cold, windy" | A child with a hand on the face is blocked by the picture filter (AUTHORING §6); the text says "he did not smile". |
| b012 (Picture) | "Leo wears a big yellow scarf and holds his cheek. A window" -> "Leo wears a big yellow scarf and looks unhappy. A window" | Same: no hand on the face. |
| b013 (Text) | "Mom came back into the kitchen. /" -> "Mom came into the kitchen. /" | Mom was not in the kitchen before ("came back" has no earlier scene). |
| b013 (Thai) | "จี๊ด จี๊ด!" จากบนชั้น" -> "จี๊ด จี๊ด!" จากริมหน้าต่าง" | The English says "from the window"; the Thai said "from the shelf". |
| b015 (Question) | "m6 / Where did Leo sit? / *on a blue blanket / on a red chair / on the grass / on a big bed" -> "m6 / Where was Leo in the game? / *on a blue blanket / on a red chair / on a green sofa / on a big bed" | "on the grass" could also be true (the blanket is in the garden); Leo lies, he does not sit. |
| b016 (Picture) | "hero / Tom / Tom holds a house phone to his ear in a living room and writes on a piece of paper with a pencil. A sofa is behind him." -> "hero / Tom, Dad / Tom holds a house phone to his ear in a living room and writes on a piece of paper with a pencil. Behind him, Dad sleeps o" | Dad is asleep on the sofa in the text; the sofa was empty in the plan. |
| b017 (Text) | "Tom looked at it and smiled. / ทอมมองกระดาษนั้นและยิ้ม" -> "Later, Tom looked at it and smiled. / ต่อมา ทอมมองกระดาษนั้นและยิ้ม" | Tom was in his room; the text did not say that he came down. |
| b018 (Question) | "*on the floor / on the sofa / in the garden / in the kitchen /" -> "*on the floor / on the sofa / in the garden / on a chair /" | The text does not give the room, so "in the kitchen" could be true (the kitchen floor). |
| b018 (Text) | "only / adjective / Just one, and no more. / เพียงแค่, มีแค่" -> "only / adverb / Not more than this; no other. / เพียงแค่, มีแค่" | "only an old book" and "only old things": the word is an adverb, and "just one" does not fit "old things". |

## 10. bank-5 b019–b036

| Article | Change | Reason |
|---|---|---|
| b019 | Thai "ขายหมวกกันน็อก" (sells) -> "มีหมวกกันน็อก" | English says "he has red helmets". Thai said something else. |
| b021 | "round her neck" -> "around her neck" (text, scarf gloss, m5, picture 2) | American English. |
| b021 | Glossary temperature: added "A high temperature means you are sick." | The text uses the fever meaning ("a headache and a temperature"). |
| b021 | Picture 3: "sits in a hospital bed with a pillow" -> "sits up in a hospital bed, smiles, and holds a small red ball" | Text: boy is not afraid; red ball on his bed. Avoids a child in distress on a bed. |
| b022 | "round his neck" -> "around his neck" (text, m4, picture 2) | American English. |
| b022 | "He has a funny mustache!" -> "..." she adds. | Second quote had no speaker. |
| b022 | "shout all the children" -> "all the children shout" | Unnatural word order. |
| b023 | Gloss scarf "round" -> "around" | American English. |
| b023 | Gloss surprised: "A word for how you feel when something is new and you did not know it." -> "How you feel when something is new and you did not expect it." | Simpler, correct meaning. |
| b023 | Gloss boots: "go up over your feet" -> "cover your feet and part of your legs" | Old definition was unclear. |
| b025 | "a happy end" -> "a happy ending" | Natural English. |
| b025 | Gloss lion "hair round its head" -> "around" | American English. |
| b025 | m3 "What does Leo not like on pancakes? fish / banana / rice / milk" -> "Which food does Leo not like? pancakes with fish / pancakes with banana / noodles with eggs / cold water" | Rice and milk are not in the text; options must be false by the text. |
| b025 | m5 "Which drink does Leo not like? hot tea / cold water / cold milk / orange juice" -> "Which of these does Leo not like? hot tea / cold water / pancakes with banana / noodles with eggs" | Cold milk and orange juice are not in the text. The new distractors are all stated likes. |
| b025 | m9 option "birds and dogs" -> "dogs and horses" | Leo likes birds, so the old option was half true. |
| b026 | "I practice football every day after school." -> "...after school on school days." (Thai too); s1 and l4 adjusted | "Every day" clashed with "I do not practice on Sunday". |
| b026 | "Yes, let's go!" -> "Yes, let's play!" (Thai too) | Tom asks about Saturday. "Let's go" means now. |
| b027 | Picture 1: "Pat holds a red balloon" -> "Pat sits on a chair under the tree" | Text: Mom holds the red balloon; Pat sits on a chair. |
| b027 | Picture 2: "building ... on the left" -> "at the near end" | After "turn left" out of the center, the building is behind the walker. |
| b027 | m9 option "in the funfair" -> "on the big wheel" | The whole family is "at the funfair"; the old option was also true. |
| b027 | s4 "What does May say to ask the way? She says..." -> "What can Grandma say to ask the way? She can say..." | May tells Grandma what to say. Old question had the wrong speaker. |
| b028 | "Pip is under the table" -> "Pip runs in and goes under the table" (Thai, m9 evidence too) | Pip waits behind the gate in the garden; he could not be under the table without moving. |
| b028 | Gloss along: new definition "Next to the long side of a road, or on a road, from one place to another." | Old "from one end to the other end" did not fit "walk along the big road". |
| b028 | Picture 1: characters "Lily" -> "Lily, Aunt Sue"; "A woman in a blue dress with a bag" -> "Aunt Sue ... with a bag" | Aunt Sue is cast and the caption names her. The unknown woman had no look from the sheet. |
| b028 | Picture 2: sign text added: `says "Please close the gate."` | Sign text must be in the prompt in quotes. |
| b028 | Picture 3: characters "Lily, Mom, Dad, Tom, Pip" -> "Mom, Dad, Tom, Pip" | Lily is not in the scene. |
| b029 | m2 option "at two o'clock" -> "at eight o'clock" | The bus also goes at two o'clock (from the museum). |
| b029 | "Before the bus, we go to the museum shop at one o'clock." -> "We go to the museum shop at one o'clock, before the bus." (Thai, m9 evidence too) | Natural word order. |
| b029 | Gloss by: "for example in a bus" -> "for example by bus" | Matches the use. |
| b029 | Gloss more: adverb "One more time or a bigger number." -> pronoun "A bigger amount, or some extra." | Text: "I want more" (pronoun). |
| b029 | l3 "every thing" -> "everything" | Spelling. |
| b030 | s1 "Where are the times of the day? It is on the wall." -> "Where is the paper with the times?" | Grammar and clear answer. |
| b030 | m4 "the first break" -> "a break" | The text has one break. |
| b030 | l1 and l5 "every thing" -> "everything" | Spelling. |
| b030 | Picture 2 and caption: "Pat blows on a small paper boat" / "Blow, blow!" -> Pat watches his boat go along the water / "Go, boat, go!" | Text has no blowing. Pat says "Go, boat, go!". |
| b031 | "On Sunday night, she shows us..." -> "On Saturday night, the fourteenth, she shows us..." (Thai, s1 too) | Mom could not show a calendar on a Sunday before November and also know about the rain on the 14th. |
| b031 | "It rains a lot on that day." -> "Tom had another game that day, but it rained a lot." (Thai) | The 14th had no game in the text, so "the game" had no source. |
| b031 | "the field is wet" -> "the field was wet" (text, m6 and its options) | Tense agreement with "could not play". |
| b032 | "Is it the day?" -> "Is it the big day?" (Thai) | Not natural English. |
| b032 | m6 "What date is Wednesday?" -> "What is the date of Wednesday in Sam's diary?" | Which Wednesday was not clear. |
| b032 | Picture 3: "children in white shirts" -> "colorful T-shirts"; added a finish line | Saturday fun run is not a school day. Text: parents clap "at the end". |
| b033 | "my mom, my dad, and my sister May" -> "my mom, my dad, my grandma, and my sister May" (Thai) | Fixed fact: May and Pat live with their grandma. |
| b033 | `"What's your address?"` -> `"What's your address?" she asks.` (Thai) | Quote had no speaker; the speaker changed. |
| b033 | "Wash your teeth" -> "Brush your teeth" | Natural English (Thai already says brush). |
| b033 | Gloss matter: new definition "A problem or a trouble. You ask, "What's the matter?"" | Old text said "a word that you use to ask". The noun means a problem. |
| b033 | m6 option "short" -> "gray" | The text gives no hair length for the nurse. |
| b034 | `"Good. What do you need today?"` -> `"Good," he says. "What do you need today?"` (Thai); m10 evidence adjusted | The speaker changed (Teacher Nick) with no tag. |
| b034 | `"Do you want a bowl of salad, too?"` gets `she asks`; `"No, thank you," I say. "I don't like salad."` | Speakers changed with no tag. |
| b034 | Picture 3: menu text added `"PASTA" / "RICE" / "SALAD"`; bowl of pasta "with red sauce" | Menu text must be in the prompt. Matches the text. |
| b035 | Picture 1: characters "Mia, Leo" -> "Leo"; Mia's dad removed | Text: photo 1 shows the moon and the train with Leo. Mia takes the photo. Dad is only in photo 3. |
| b035 | Picture 2: "a bat" -> "a small brown bat"; "green parrot" -> "green and red parrot" | Match the text. |
| b035 | Picture 3: added "A small colorful train is behind them." | Text: Dad is "next to the train". |
| b036 | "all his things are on the floor" -> "many things are on the floor" (Thai) | Laptop, boat, socks and others are on the desk, shelf, and chair. |
| b036 | "A blue blanket is on the bed." -> "...on the floor." (Thai, m1, m2, pictures 1 and 3 check) | Leo "puts the blanket on his bed" later. It must start on the floor. |
| b036 | "A comic is open next to the laptop." -> "A comic is open on the floor next to the desk." (Thai, picture 2) | Leo "puts the comic on the desk" later. |
| b036 | m1 "Where are all of Leo's things at first?" -> "Where is the blue blanket at first?" with new options | The old question could not stay true after the text change. |
| b036 | s2 answer "The laptop and a comic are on the desk." -> "The laptop is on the desk." | Matches the new text. |
| b036 | Thai "มันสีฟ้ามาก" (very blue) -> "มันใหญ่มาก" (very big) | English says "very big". |
| b036 | Picture 1 and picture 2 prompts match the new item places | Blanket and comic on the floor. |

Claude changed some of these lines again after the editors: L02 Aunt Sue's reply ("I am awake at night, when the sick children are asleep."), L09 "Mom invites twenty people to the party.", L01 l5 (a question about the child's own family page), b009 "near the town", b011 Thai shirts, b021 cover title in the picture prompt, b032 Sam's clothes left to his sheet, b031 (the telling time is Sunday the first again; the game on the 14th moves because the school needs the field, with Coach Matt).

## Revision History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-06 | First version: 50 packages of level 5 |
