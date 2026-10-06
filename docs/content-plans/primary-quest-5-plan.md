# Primary Advantage Quest 5 — Lesson Map

Version 0.2 | Date 2026-10-06 | Status: Approved (Daniel, 2026-10-06) | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

Track: `levels_5_9_20261006`. Companion files: [`primary-quest-4-plan.md`](primary-quest-4-plan.md) (the model for this map), [`primary-levels-5-9-plan.md`](primary-levels-5-9-plan.md) (§3 band rule, §5 profiles, §6 vocabulary, §7 grammar, §8 cast), [`primary-quest-adventure-series-bible.md`](primary-quest-adventure-series-bible.md) (§1–§3), [`level-plans/levels-5-9-objectives.json`](level-plans/levels-5-9-objectives.json), [`level-plans/bank-5.md`](level-plans/bank-5.md), [`data/grammar-levels-5-9.md`](data/grammar-levels-5-9.md), [`../../content/primary/AUTHORING.md`](../../content/primary/AUTHORING.md).

## 1. Summary

Quest 5 is the second A1 book: level 5 (A1, `cefr_level = 'A1'`, `ra_level = 5`). It has 14 workbook lessons. Each lesson has 12 glossed words, 2–4 target objectives, and one main grammar point of level 5. QR key: `q5/<lesson>`.

Text mix: 8 stories and 6 functional texts. The stories are a phone call, a lost jacket, likes and dislikes, directions, a chant, a sick day, a sports day, and a lost puppy. The functional texts are a family page, a weather diary, a notice, a day plan, an email, and cooking instructions.

Rule checks (run on this map with a script, 2026-10-06):

- **Book rule:** 16 of 16 objectives of `books["quest-5"].objectives` are a target in 1 or more lessons (section 5.1).
- **Targets per lesson:** every lesson has 2–4 targets (4 lessons have 4 targets and 10 lessons have 3). The map has 46 target slots and 42 different target objectives. They are the 16 book objectives and 26 other objectives from the `--next` list, with the lowest practice first.
- **Level rule:** each of the 31 in-scope objectives of level 5 is a target in 3 or more packages (Quest 5 plus bank-5). Result: 31 of 31, none under 3 (section 5.3). Four objectives reach 3 only through bank-5 (section 5.3).
- **Words:** 168 different glossed words, no word twice. Movers 113, Flyers 28, Starters 27 (section 7). No Movers word of the graph stays unglossed except *get undressed* (Quest 6.1), *CD* and *DVD* (not taught: Daniel, 2026-10-06), and 15 first names (not in the Movers goal).

**Cast (series bible §2–§3):** Quest 5 is one school year after Quest 4. Tom is 11 (P6), Lily is 9 (P4), Mia and Leo are 9, Ben is 11, Sam is 10, May is 10. Pip is a small brown puppy. New adults: Teacher Nick (Tom's class teacher, L07 and L12), Coach Matt (sports, L04 and L13), and Aunt Sue (L02 and L09). The three adults have cast sheets in `character-sheets/`. "One name, one person": no new child name appears in this book. Places have plain nouns. The only proper place name is *Chiang Mai* (L02): see question 3.

## 2. Text profile (`quest-5`)

| Measure | Target |
|---|---|
| Words | 230–300, in 3–4 paragraphs |
| Mean sentence length | 6.2–8.0 words (calibrated 2026-10-06: stories with much dialogue measure low); longest sentence 14 words or less |
| Running words on Starters or Movers (names, glossed, allowed words not counted) | 95% or more |
| Glossed words | 12: 8 or more from Movers, 2 Flyers at most, none above Flyers (this map: 8–10 Movers, exactly 2 Flyers, 0–2 Starters) |
| New Movers words | 6 or more per lesson (a target, not a gate). This map gives 8 or more |
| Recycled words | 4 or more glossed words of earlier lessons (Origins, Quest 4, and Quest 5) |
| Question marks | 2 or more (book rule: 10 of 14 lessons) |
| Dialogue | 6 or more lessons. This map has dialogue in all 8 stories and in L10 (Dad and Lily) |

Grammar at level 5 is the Movers list that is new at this level (`data/grammar-levels-5-9.md` §2). The past simple starts in L12. Flyers forms (*will, be going to, might, should*, present perfect) do not appear. Numbers are words, not digits. Months, days, and the Flyers time words *quarter, half, past* go in `allow`.

## 3. Lesson map

Targets are A1 key ids (`a1-objective-key.json`, GSE 22–26). "Supporting" lists the objectives that the text will clearly practice. Words are in section 7.

| # | Title | Text type | Genre | App | Cast and place | Targets | Supporting | Main grammar |
|---|---|---|---|---|---|---|---|---|
| L01 | Our Family Page | functional: a family page with names, ages, and likes | Family & Friends | nonfiction | Lily, Tom, Pip, Mom, Dad, Grandma, Grandpa; home and the classroom | R23.1, R23.3, R26.3, L26.2 | R22.1, R22.3, L23.6, R26.2 | be called, be good at, I think (also: comparatives with than) |
| L02 | Aunt Sue Calls | story: a phone call | Family & Friends | fiction | Lily, Tom, Mom, Aunt Sue, Pip; home (the living room); Aunt Sue is in Chiang Mai | L25.1, R26.5, R24.5, L23.4 | L26.2, L26.4, R22.3, L22.2 | What is ... like?, How about ...?, indirect objects (give it to ...) |
| L03 | Lily's Weather Diary | functional: a weather diary for one week | Weather | nonfiction | Lily, Tom, Pip, Teacher Kim; home, school, and the school field | L26.1, R26.1, R25.2 | R25.5, L24.5, L22.2, R22.3 | adverbs of frequency (always, often, never) |
| L04 | Where Is Tom's Jacket? | story: a lost jacket | School | fiction | Tom, Lily, Ben, Coach Matt, Pip; the school field and the lost-property box | L26.3, R26.2, L24.1, L24.3 | R26.3, R24.2, R25.4, L24.2 | relative clauses with who, which, where |
| L05 | Library Rules | functional: a rules notice with a note from the teacher | School | nonfiction | Teacher Kim, Lily, Mia, Leo; the school library | R25.4, R24.6, R24.3 | R24.2, R23.8, R22.3, L23.1 | must / mustn't, have to |
| L06 | Tom Doesn't Like Fish | story: likes and dislikes | Food & Drink | fiction | Grandpa, Tom, Lily, Pip; the café on the town street | R26.6, L25.3, R25.4 | L23.3, R26.5, R22.3, L24.2 | Why ...? Because ... |
| L07 | The Way to the Library | story: directions | Places & Directions | fiction | Teacher Nick, Tom, Lily, Pip; the town street (road, square, café, bus station, library) | L25.2, L24.4, R23.6 | R26.5, L24.2, R23.8, R22.3 | Shall I ...? (also: infinitive of purpose) |
| L08 | Our Day at the Lake | functional: a day plan with times | Nature & Outdoors | nonfiction | Dad, Mom, Tom, Lily, Grandpa, Pip; the lake | L23.7, L25.5, L23.2, R25.3 | L22.2, L24.4, R23.8, R24.2 | when clauses (also: go + -ing) |
| L09 | An Email for Grandpa | functional: an email about a birthday | Family & Friends | nonfiction | Lily, Mom, Tom, Aunt Sue; home (the dining room) and Aunt Sue's phone | L24.6, R22.2, R23.4 | L26.1, L22.2, R22.3, R26.3 | verb + infinitive; want / ask someone to; infinitive of purpose |
| L10 | Let's Make Pancakes | functional: cooking instructions with pictures | Food & Drink | nonfiction | Lily, Dad, Tom, Pip; the kitchen at home | R23.2, R23.7, R23.8 | R24.3, R24.2, R23.5, R23.4 | adverbs of manner (carefully, slowly, quickly) |
| L11 | The Rain Chant | story: a chant with repeated lines | Weather | fiction | Teacher Kim, Lily, Mia, Leo, May; the classroom on a rainy day | R25.1, R26.1, L26.3 | R25.5, L24.5, L24.2, R24.4 | comparatives and superlatives (bad, worse, the worst; better) |
| L12 | What's the Matter, Tom? | story: feeling sick at school | School | fiction | Tom, Teacher Nick, the school nurse (unnamed), Mom, Lily; the classroom, the nurse's room, and home | L25.6, R26.5, L23.5 | R24.3, R25.4, L24.2, R22.3 | past simple, affirmative and negative (also: What's the matter?, had to) |
| L13 | Sports Day with Coach Matt | story: practice for sports day | Sports & Play | fiction | Coach Matt, Tom, Ben, Lily, Sam; the school field and the sports cupboard | L23.1, R23.5, L22.1 | R22.2, L24.6, L24.2, R26.5 | comparatives of adverbs (faster, more slowly); past simple questions |
| L14 | Pip at the Funfair | story: a lost puppy (review lesson) | Pets & Animals | fiction | Tom, Lily, Pip, Leo, Mia, Sam, Ben, Mom, Dad; the town funfair | R24.2, L25.4, R25.5 | R26.5, L24.4, L26.3, R26.2, R25.4 | could / couldn't (also: past simple, all four forms; went + -ing) |

Notes:
- Teacher Nick comes first in L07, Coach Matt first in L04, and Aunt Sue in L02. The bible says that Quest 5 needs them first.
- L02: Aunt Sue is a nurse at a hospital in Chiang Mai. L07: Teacher Nick is new in town. Both are new facts: see question 4.
- L12 has the school nurse, with no name. *Nurse Jill* belongs to Adventure 9.1 (bible §4).
- L14 is the review lesson. It uses the book's words, the past simple in all four forms, and *could*.

## 4. Lesson briefs and pictures

Each brief gives who, where, what happens, and how it ends. Each lesson has a hero picture and two inline pictures. Sign and poster text is in double quotation marks, as in AUTHORING §6. Cast looks are not described: the cast sheets fix them.

### L01 Our Family Page

Text type: functional: a family page with names, ages, and likes. Genre: Family & Friends. App type: nonfiction. Place: home and the classroom.

Teacher Kim asks the class for a family page. Lily writes it at home on Sunday. She gives each person a short block: name, age, and one fact. Tom is eleven and tall. Grandpa has a bushy white mustache. Grandma tells the best stories. Dad is the tallest person in the family. Her puppy is called Pip. Lily thinks Pip is the funniest. The page asks the reader two questions: "Who is in your family?" and "What are you good at?" The text ends with Lily's own answer: she is good at drawing.

- hero: Lily sits at her desk at home. A big sheet says "MY FAMILY" in colored letters. Pip sits on the chair next to her.
- inline-para-2: Grandpa (bald, white mustache, round glasses) sits in the garden and tells a story to Lily and Tom.
- inline-para-3: The whole family in a row in front of the house: Mom, Dad, Grandma, Grandpa, Tom, Lily, and Pip.

### L02 Aunt Sue Calls

Text type: story: a phone call. Genre: Family & Friends. App type: fiction. Place: home (the living room); Aunt Sue is in Chiang Mai.

On Saturday evening, Aunt Sue calls Mom's phone from Chiang Mai. Mom is out, so Lily answers. Aunt Sue asks Lily's age, then asks who is at home. Lily says Tom is here and Dad is at work. Aunt Sue asks, "What is Tom like now?" Lily says he is tall and loud. They talk about a photo of Pip. Aunt Sue works at a hospital and is a nurse. Aunt Sue says her new number in words. Lily writes it on the fridge note. Aunt Sue says, "Pardon?" twice because the line is bad. Mom comes home. The call ends with a kiss for Pip.

- hero: Lily sits on the sofa with Mom's phone; the screen shows Aunt Sue (coral blouse, black bob) waving; Pip sits next to Lily.
- inline-para-2: Tom leans over Lily's shoulder and laughs at the phone; Lily holds up a pencil and a small note.
- inline-para-3: Aunt Sue in a hospital corridor, in a light-blue nurse top, holds a phone and smiles (the story gives her other clothes).

### L03 Lily's Weather Diary

Text type: functional: a weather diary for one week. Genre: Weather. App type: nonfiction. Place: home, school, and the school field.

Lily keeps the class weather diary for one week. Each day has a day name, a date, and two or three short sentences. The weather words and the sentence frames repeat: "Today it is ..." and "I always ...". On Monday it is sunny. On Wednesday it rains, and Lily is dry under her umbrella. On Thursday a storm comes, and Pip hides under the table. Lily watches the sky and takes a picture of a rainbow on Saturday. On Sunday Lily writes about the best day of the week. The diary ends with a rainbow.

- hero: Lily's open diary on a desk. The page heading is "MY WEATHER DIARY", and seven small weather drawings are in a row.
- inline-para-2: A big rainbow over the school field after rain; Lily stands with her camera, and Tom stands next to her.
- inline-para-3: Pip hides under the kitchen table during a storm; Lily reaches out her hand with the red ball.

### L04 Where Is Tom's Jacket?

Text type: story: a lost jacket. Genre: School. App type: fiction. Place: the school field and the lost-property box.

After football on Thursday, Tom cannot find his jacket. Lily and Ben help. Lily asks Coach Matt about the lost-property box. Coach Matt asks Lily to describe it. Lily says: "It is the blue jacket which has a white stripe and a pocket." They find two blue jackets. One is wrong: it has no pocket. A boy in a green T-shirt, who is also in Tom's class, says the other one is his. Tom finds his jacket at the bottom of the box. Pip is asleep on top of it. Tom hugs Pip.

- hero: Tom, Lily, and Ben stand at the school field bench; Tom's bag is open and empty; Pip sniffs the bench.
- inline-para-2: Coach Matt holds up a blue jacket with a white stripe and a pocket. A big lost-property box is behind him, and Lily points at the pocket.
- inline-para-3: Pip sleeps on a pile of jackets at the bottom of the box; Tom smiles and picks up his jacket.

### L05 Library Rules

Text type: functional: a rules notice with a note from the teacher. Genre: School. App type: nonfiction. Place: the school library.

Teacher Kim's class goes to the school library on Tuesday. A notice on the door lists the rules, and Teacher Kim adds a short note. The notice is a list: "You must be quiet. You mustn't run. You have to wash your hands." The next lines give two positive and two negative rules about books, e-books, and comic books. Mia asks questions about the rules, such as "Can I take two comic books?" The answers come from the notice. The note ends with a thank-you to the class for a quiet visit.

- hero: A wooden sign on the library door has one heading, "LIBRARY RULES", and four lines: "Be quiet." / "No running." / "Wash your hands." / "Two books only." Nobody stands in front of the sign.
- inline-para-2: Teacher Kim's class at the shelves: Lily and Mia choose books, and Leo reads a comic book at a low table.
- inline-para-3: Lily puts a finger on her lips while Mia whispers; a girl at the next table reads an e-book on a tablet.

### L06 Tom Doesn't Like Fish

Text type: story: likes and dislikes. Genre: Food & Drink. App type: fiction. Place: the café on the town street.

On Saturday, Grandpa takes Tom and Lily to the café on the town street. Pip waits under the table. Grandpa orders fish. Tom says, "I don't like fish." Lily asks, "Why?" Tom says, "Because it is terrible with bones!" Lily likes salad, but Tom does not like vegetables. Grandpa says he does not like salad either. They share a plate of pasta with a red sauce. Tom likes the pasta. Lily says, "Me too!" At the end Grandpa pays, Tom thanks him, and Pip gets a bit of pasta.

- hero: A café table by a window has a plate of pasta, a bowl of salad, and a plate of fish. Grandpa, Tom, and Lily sit at it.
- inline-para-2: Tom looks at a plate of fish and frowns; Lily watches him; Grandpa holds a menu.
- inline-para-3: Tom eats pasta with a red sauce and smiles; Lily laughs; Pip sits under the table with his nose up.

### L07 The Way to the Library

Text type: story: directions. Genre: Places & Directions. App type: fiction. Place: the town street (road, square, café, bus station, library).

Teacher Nick is new in town. He asks Tom and Lily, "Excuse me, where is the library?" Tom gives directions: go along this road, then down to the square, and turn left at the café. Lily says the library has a blue door. Teacher Nick is not sure. Tom asks, "Shall I show you?" They walk together. Pip runs ahead and into the café by mistake. At the library, Teacher Nick says thanks and borrows a book about football. The story ends with Tom's new teacher and a happy Pip.

- hero: Teacher Nick stands at a street corner and looks at a folded paper. Tom and Lily stand next to him.
- inline-para-2: Tom points along the road toward a square with a café. A sign "BUS STATION" is on a post on the left. Lily holds Pip's lead.
- inline-para-3: Teacher Nick and Tom stand at the library door (a blue door); Pip sits at their feet with the red ball.

### L08 Our Day at the Lake

Text type: functional: a day plan with times. Genre: Nature & Outdoors. App type: nonfiction. Place: the lake.

Lily writes the plan for Sunday at the lake. The plan lists times and activities: "Seven o'clock: get up." "Ten past eight: take the bus." "Twenty-five to ten: arrive at the lake." Each line gives a time (to the nearest five minutes) and what the family does. When they arrive, Grandpa and Lily sail a small boat. At midday they eat watermelon and sandwiches at the café. Tom and Dad play with Pip by the water. The plan ends with the bus home at a quarter past four and the words "A good day!"

- hero: A neat paper plan on a table. The heading is "SUNDAY AT THE LAKE", and there are five lines: "ten past eight - bus" / "twenty-five to ten - lake" / "eleven o'clock - boat" / "twelve o'clock - lunch" / "a quarter past four - bus home".
- inline-para-2: Grandpa and Lily in a small sailboat on a calm lake; Lily holds the rope.
- inline-para-3: A café table by the lake with a plate of watermelon; Dad, Mom, and Tom sit there, and Pip sleeps in the shade.

### L09 An Email for Grandpa

Text type: functional: an email about a birthday. Genre: Family & Friends. App type: nonfiction. Place: home (the dining room) and Aunt Sue's phone.

Lily writes an email to Aunt Sue on Mom's laptop. She invites her to Grandpa's seventy-fifth birthday. The party is a secret. Lily gives the day and the date, and asks, "Would you like to come?" She tells Aunt Sue about presents: Mom wants to buy a board game, but Lily has a better idea. She asks Aunt Sue to bring Grandma's old photo. The email shows a subject line, a greeting, and a closing. Aunt Sue will be surprised. The email ends with a thank-you and a hug from Lily. (Put the subject, greeting, and closing inside the first and last paragraph, with full stops: checker fault C4.)

- hero: Lily sits at the dining table with a laptop, and Mom stands behind her. A wall calendar shows the page "NOVEMBER" with one date circled in red.
- inline-para-2: Tom holds a wrapped box and a card in the living room and puts a finger on his lips (a secret).
- inline-para-3: Aunt Sue reads the email on a phone in a hospital break room and smiles with a hand over her mouth.

### L10 Let's Make Pancakes

Text type: functional: cooking instructions with pictures. Genre: Food & Drink. App type: nonfiction. Place: the kitchen at home.

Dad and Lily make pancakes on Sunday morning. The text gives numbered steps with a picture for each step. Dad writes a short shopping list for flour, eggs, and milk. Tom says cooking is boring, but he helps. Steps use manner words: "Mix the flour and the milk slowly." "Pour the batter carefully." Dad says the pan is dangerous and Lily stands back. Tom puts salt in the bowl, not sugar. There is a big difference in taste! The last step says to add sugar and say "Well done!" Pip waits for a pancake.

- hero: Lily and Dad stand at a kitchen table with a bowl of flour, two eggs, and a jug of milk. A paper list is headed "SHOPPING LIST".
- inline-para-2: Dad pours batter into a pan on the cooker; Lily stands one step back with her hands behind her.
- inline-para-3: Tom flips a pancake in the air; Pip jumps up and the pancake nearly lands on his nose.

### L11 The Rain Chant

Text type: story: a chant with repeated lines. Genre: Weather. App type: fiction. Place: the classroom on a rainy day.

It rains all day, and Teacher Kim's class stays inside. Teacher Kim says, "Let's make a rain chant." The children say the chant in three repeated lines: "Bad, bad, bad weather! Worse, worse, worse weather! The worst weather in the jungle!" Leo adds a fat frog, and a star behind the cloud. Rain falls in the swimming pool too. Lily says the end must be better. The class says, "Better, better, better: a rainbow!" Oh dear, the rain stops, and the sun comes. The class runs to the window with an umbrella each. The text ends with the rainbow.

- hero: A classroom window with rain on it; Teacher Kim writes "BAD, BAD, BAD WEATHER!" on the board; Lily, Mia, Leo, and May sit at their desks.
- inline-para-2: Leo holds a big paper frog and a paper star above his head, and the class laughs.
- inline-para-3: The children stand at the window with open umbrellas and look at a big rainbow over the playground.

### L12 What's the Matter, Tom?

Text type: story: feeling sick at school. Genre: School. App type: fiction. Place: the classroom, the nurse's room, and home.

On Monday morning, Tom has a headache and a stomach-ache. He did not eat breakfast. Teacher Nick asks, "What's the matter, Tom?" Tom says he feels weak. He also had a toothache last night. Teacher Nick takes him to the school nurse. The nurse checks his temperature and says it is not high. She says Tom is sick because he did not eat. He had to sit and drink water. She gives him a small biscuit and some medicine for the headache, not for the stomach. The nurse says, "Don't worry." Mom comes. At home, Lily draws a get-well card. Tom feels well again by dinner time. (Pictures: do not show Tom on a bed or with hands on his face.)

- hero: Teacher Nick walks with Tom along the school corridor toward a door with a sign "NURSE"; Tom looks tired and carries his bag.
- inline-para-2: The school nurse (a woman in a light-blue top) holds a thermometer. Tom sits on a chair and looks tired.
- inline-para-3: Lily gives Tom a drawn card at the kitchen table; Tom sits on a chair, smiles, and drinks a glass of water.

### L13 Sports Day with Coach Matt

Text type: story: practice for sports day. Genre: Sports & Play. App type: fiction. Place: the school field and the sports cupboard.

Sports day is on Friday. Coach Matt opens the old sports cupboard and shows the new event, roller skating. He holds up things and asks, "What's this?" The answers are ice skates, a tennis racket, and a skateboard. Coach Matt says ice skating is for cold places. Ben asks what the difference is between roller skates and ice skates. Tom practices on roller skates, badly at first. Coach Matt says, "Move your shoulders." Tom does not fall the second time. Ben skates faster than Tom, but Tom goes more slowly and more carefully. Did Tom win? No, he didn't. Everyone claps, and Tom says it was exciting.

- hero: Coach Matt opens a big wooden cupboard on the school field. Inside are roller skates, ice skates, a tennis racket, and a skateboard.
- inline-para-2: Tom on roller skates wobbles on the school court with his arms out; Ben holds one of his hands.
- inline-para-3: Lily, Sam, and other children clap on the court; Coach Matt gives Tom a thumbs up; Tom smiles.

### L14 Pip at the Funfair

Text type: story: a lost puppy (review lesson). Genre: Pets & Animals. App type: fiction. Place: the town funfair.

On Saturday, the family goes to the town funfair. A costume show is on the green. Leo is a pirate with a black beard. Mia is a famous pop star with a blond curly wig. Ben is a film star in sunglasses, and Sam wears a polar bear costume. Pip sees his red ball roll away and runs after it. The family cannot find Pip. Lily asks, "Did you see a small brown puppy?" Leo says, "I could not see him, but I looked." They look at the rides and the stalls. They find Pip asleep under a chair with the ball. Lily says, "Stay close, Pip!"

- hero: The funfair gate has a big colorful sign "TOWN FUNFAIR" and a Ferris wheel behind it. Tom and Lily stand in front with Pip on a lead.
- inline-para-2: A costume parade on the green: Leo is a pirate with a black beard, and Mia is a pop star in a blond curly wig. Sam wears a polar bear costume. Pip's lead lies empty on the grass.
- inline-para-3: Pip sleeps under a chair with the red ball between his paws; Lily kneels next to him; Tom smiles.

## 5. Objectives

### 5.1 Book rule: the 16 objectives of `books["quest-5"]`

| Objective | Target in | Text |
|---|---|---|
| R23.1 | L01 | Can read sentences correctly from left to right. |
| R23.3 | L01 | Can identify familiar words in short, simple texts. |
| L23.7 | L08 | Can understand the time of day when expressed to within five minutes. |
| R24.6 | L05 | Can understand basic phrases in short, simple texts. |
| R25.2 | L03 | Can understand a simple text if supported by pictures. |
| L25.1 | L02 | Can understand basic questions about personal details if spoken slowly and clearly and supported by pictures. |
| L25.3 | L06 | Can recognise words and simple phrases related to familiar topics, if spoken slowly and clearly and supported by pictures. |
| L25.6 | L12 | Can understand basic expressions or questions related to immediate personal needs, if delivered slowly and clearly. |
| R26.1 | L03, L11 | Can identify repeated words or phrases in a short text. |
| R26.2 | L04 | Can understand basic sentences describing someone’s physical appearance, (e.g. ‘eye/hair colour’, ‘height’), if supported by pictures. |
| R26.3 | L01 | Can understand basic sentences about things people have, if supported by pictures. |
| R26.5 | L02, L12 | Can follow simple dialogues in short illustrated stories, if they can listen while reading. |
| R26.6 | L06 | Can understand basic information about people’s likes and dislikes, if supported by pictures. |
| L26.1 | L03 | Can identify the day and date in short, simple dialogues, if spoken slowly and clearly and supported by pictures or gestures. |
| L26.2 | L01 | Can understand basic information about someone’s immediate family, if spoken slowly and clearly and supported by pictures or gestures. |
| L26.3 | L04, L11 | Can understand simple language related to naming and describing people’s clothes. |

Result: 16 of 16.

### 5.2 Other targets (from `level-coverage.ts --next quest-5`, lowest practice after first)

| Objective | Practice after (before this book) | Target in | Reason |
|---|---|---|---|
| L25.2 | 0 | L07 | bank-5 gives 2: the level rule needs 1 more; lowest practice |
| R25.1 | 0 | L11 | lowest practice |
| L24.1 | 1 | L04 | bank-5 gives 2: the level rule needs 1 more; lowest practice |
| R24.5 | 2 | L02 | bank-5 gives 2: the level rule needs 1 more; lowest practice |
| L25.5 | 3 | L08 | bank-5 gives 2: the level rule needs 1 more; lowest practice |
| L23.2 | 4 | L08 | bank-5 gives 0–1; lowest practice |
| L23.4 | 4 | L02 | bank-5 gives 0–1; lowest practice |
| R23.2 | 4 | L10 | bank-5 gives 0–1; lowest practice |
| R23.4 | 4 | L09 | bank-5 gives 0–1; lowest practice |
| R23.7 | 4 | L10 | bank-5 gives 0–1; lowest practice |
| R23.8 | 4 | L10 | bank-5 gives 0–1; lowest practice |
| L22.1 | 5 | L13 | bank-5 gives 0–1; lowest practice |
| L23.5 | 5 | L12 | bank-5 gives 0–1; lowest practice |
| L24.6 | 6 | L09 | bank-5 gives 2: the level rule needs 1 more; lowest practice |
| R23.6 | 6 | L07 | bank-5 gives 0–1; lowest practice |
| L23.1 | 7 | L13 | bank-5 gives 0–1; lowest practice |
| R22.2 | 7 | L09 | bank-5 gives 0–1; lowest practice |
| R23.5 | 8 | L13 | bank-5 gives 0–1 |
| R24.2 | 9 | L14 | fits the lesson text |
| R24.3 | 9 | L05 | bank-5 gives 2: the level rule needs 1 more |
| R25.3 | 9 | L08 | bank-5 gives 2: the level rule needs 1 more |
| R25.5 | 10 | L14 | fits the lesson text |
| L24.3 | 19 | L04 | bank-5 gives 2: the level rule needs 1 more |
| L25.4 | 20 | L14 | fits the lesson text |
| R25.4 | 31 | L05, L06 | bank-5 gives 2: the level rule needs 1 more |
| L24.4 |  | L07 | bank-5 gives 2: the level rule needs 1 more |

The candidates that this map does not target are L24.5, R22.1, L22.2, L23.3, R24.4, L24.2, R22.3, and L23.6. They have 10 or more packages of practice after first teaching. Most of them are supporting objectives in many lessons.

### 5.3 Level rule: the 31 in-scope objectives of level 5

Level 5 has 50 packages: the 14 lessons of Quest 5 and the 36 articles of bank-5. The bank column counts targets in `level-plans/bank-5.json` (2026-10-06; another agent is changing the bank's words, not its targets).

| Objective | Quest 5 | bank-5 | Total | Flag |
|---|---|---|---|---|
| R24.2 | 1 | 4 | 5 |  |
| R24.3 | 1 | 2 | 3 |  |
| R24.4 | 0 | 4 | 4 | bank only |
| R24.5 | 1 | 2 | 3 |  |
| R24.6 | 1 | 5 | 6 |  |
| R25.1 | 1 | 3 | 4 |  |
| R25.2 | 1 | 6 | 7 |  |
| R25.3 | 1 | 2 | 3 |  |
| R25.4 | 2 | 2 | 4 |  |
| R25.5 | 1 | 3 | 4 |  |
| R26.1 | 2 | 3 | 5 |  |
| R26.2 | 1 | 2 | 3 |  |
| R26.3 | 1 | 2 | 3 |  |
| R26.5 | 2 | 3 | 5 |  |
| R26.6 | 1 | 2 | 3 |  |
| L24.1 | 1 | 2 | 3 |  |
| L24.2 | 0 | 4 | 4 | bank only |
| L24.3 | 1 | 2 | 3 |  |
| L24.4 | 1 | 2 | 3 |  |
| L24.5 | 0 | 3 | 3 | bank only |
| L24.6 | 1 | 2 | 3 |  |
| L25.1 | 1 | 5 | 6 |  |
| L25.2 | 1 | 2 | 3 |  |
| L25.3 | 1 | 3 | 4 |  |
| L25.4 | 1 | 4 | 5 |  |
| L25.5 | 1 | 2 | 3 |  |
| L25.6 | 1 | 2 | 3 |  |
| L26.1 | 1 | 2 | 3 |  |
| L26.2 | 1 | 2 | 3 |  |
| L26.3 | 2 | 2 | 4 |  |
| L26.4 | 0 | 3 | 3 | bank only |

Result: 31 of 31 objectives have 3 or more. None is under 3. 4 objectives reach 3 only through bank-5 (R24.4, L24.2, L24.5, L26.4). L26.4 has exactly 3, so it has no margin. L26.4 first teaching belongs to Quest 6.1 (question 5). Bank-5 can add targets to these objectives if the plan changes.

## 6. Grammar

One main grammar point for each lesson. The table follows the 14 rows of the Movers list in `data/grammar-levels-5-9.md` §2. The writer uses the main point in the key sentences of the text and in two or three questions. "Also" points are secondary.

| Grammar point (level 5) | Main in | Also in |
|---|---|---|
| Past simple, regular and irregular, all four forms | L12 (affirmative and negative) | L13 (questions), L14 (all four forms) |
| Comparative and superlative adjectives | L11 | L01 (*taller than*), L13 |
| Comparative and superlative adverbs | L13 (*faster, more slowly*) | L10 |
| Adverbs of frequency and manner | L03 (frequency), L10 (manner) | L05 (*loudly*), L13 (*badly*) |
| *Must / mustn't*; *have (got) to / had to* | L05 | L08, L12 (*had to*) |
| *Could* as the past of *can* | L14 | L13 |
| *Shall I …?* for offers | L07 | L02 |
| Verb + infinitive; *want / ask someone to*; infinitive of purpose | L09 | L07 |
| Verb + *-ing* (*went riding*) | L14 (*went looking*) | L08 (*go sailing, go swimming*) |
| *Because*; *Why …?* | L06 | L12 |
| Relative clauses with *who, which, where* | L04 | L07 (*the place where*) |
| *When* clauses (not future) | L08 | L02, L11 |
| Indirect objects; *What is … like?*; *What's the matter?*; *How / What about …?* | L02 | L07 (*How about …*), L12 (*What's the matter?*) |
| *Be called*, *be good at*, *I think / know …* | L01 | L02, L13 |

All 14 rows have a lesson. Quest 5 also takes three items that the grammar file leaves to Quest 6.1: *shall I*, indirect objects, and verb + *-ing*. The grammar file calls this list a large load for one book. So the main point of each lesson stays small. Flyers forms stay out of the text.

## 7. Words

Each lesson glosses 12 words. Each lesson has 8–10 Movers words that no package glossed before (from the 131 of the graph), exactly 2 Flyers words, and 0–2 Starters words. The Movers words of a lesson fit its text. Each word is in the text. American spelling: *mustache* (graph headword *moustache*), *practice* (graph headword *practise*). The converter resolves both (`AMERICAN_SPELLING` in `bank-plan.ts`).

| # | Movers (new) | Flyers | Starters |
|---|---|---|---|
| L01 | be called, mustache, tall, think, both, everything, than, most | wife, same | how old, lots of |
| L02 | nurse, hospital, travel, asleep, awake, someone, how often, app | telephone, chat | pardon, really |
| L03 | Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, dry | date, storm | watch, take a picture |
| L04 | take off, get dressed, drop, bottom, wrong, off, out of, neck | striped, pocket | which, t-shirt |
| L05 | must, have to, only, loudly, any, e-book, comic book, move | magazine, member | choose, pick up |
| L06 | pasta, salad, sauce, thirsty, why, because, terrible, excuse me | delicious, taste | a lot of, me too |
| L07 | along, down, into, shall, square, bus station, get on, get off | corner, way | thanks, now |
| L08 | when, by, back, sail, out, more, how much, café | early, minute | on, watermelon |
| L09 | invite, laptop, idea, surprised, buy, change, go shopping, would | secret, calendar | board game, dining room |
| L10 | pancake, cook, dangerous, nothing, shopping, boring, come on, difference | flour, mix | add, well done |
| L11 | bad, worse, worst, better, jungle, star, fat, swimming pool | umbrella, wild | oh dear, say |
| L12 | headache, stomach, stomach-ache, temperature, toothache, sick, weak, matter | medicine, sore | well, don't worry |
| L13 | ice skates, ice skating, roller skating, practice, exciting, badly, mean, shoulder | team, race | tennis racket, skateboarding |
| L14 | funfair, pirate, pop star, film star, famous, could, blond, curly, beard | costume, missing | polar bear |

Counts: 113 Movers + 28 Flyers + 27 Starters = 168 glossed words, 168 different (no word twice). Movers per lesson: 8 in 13 lessons and 9 in L14. Flyers per lesson: 2. The `quest-5` rules hold: 8 or more Movers, 2 Flyers at most.

**Movers words still not glossed after Quest 5: 18 of the graph's 131.** One is *get undressed*, for the pool lessons of Quest 6.1. *CD* and *DVD* are not taught (Daniel, 2026-10-06: not used any more). The other 15 are first names: *Charlie, Clare, Daisy, Fred, Jack, Jane, Jim, Julia, Lily, Mary, Paul, Peter, Sally, Vicky, Zoe*. Names, *CD*, and *DVD* are not in the Movers goal (decision 2). The plan said about 110 of 131: this map glosses 113, because the 8-Movers rule needs 112.

Word notes for writers:
- The seven day names are glossed in L03 (the plan gives each lesson 8 Movers words; the graph has the days as Movers words). Do not use *CD* or *DVD* in any lesson.
- Function words (*by, on, out, off, down, into, than, most, when, why, which, would, could, must*) get a glossary entry with the sense of the text and a simple example. Use the entry style of Quest 4 (*always, never, every*).
- *Café* has an accent in the Movers list. The converter removes accents before the check (AUTHORING §3). Try it in L06 or L08. If it fails, swap *café* for another unglossed Movers word of the topic and tell the lead.
- Swap rule: a writer can swap at most 2 words of a lesson for other unglossed Movers words of the same topic. Tell the lead which, so that the count of 168 stays true.
- Flyers time words (*quarter, half, past, timetable*) and months go in `allow`, as in Quest 4.

## 8. Questions and tasks

- MCQ (4 printed of 10): at least 2 test a target objective (L08: "What time is the bus?"; L05: "What mustn't you do in the library?"; L03: "What is the weather on Thursday?").
- Short answer (1): a personal question in the lesson frame (L01: "Who is in your family?"; L06: "What don't you like? Why?").
- Writing: a personal version of the text type (L01: "Write about your family." L03: "Write your weather diary for one day." L08: "Write a plan for your Sunday." L10: "Write steps to make a drink.").
- Listening objectives (L-ids) are tested through the audio of the text: the question uses the words that the voice says. L02 and L07 need one voice for the whole text (plan D5 starts one voice for each speaker in Adventure 7).

## 9. Questions for Daniel

Daniel (2026-10-06): "1A but no CD/DVD (not used anymore), 2A, 3A, 4A, 5A, 6A". So: the day names are glossed in L03, and *CD* and *DVD* are not taught; names (and *CD*, *DVD*) are out of the Movers goal; L02 keeps *Chiang Mai*; Aunt Sue is a nurse and Teacher Nick is new in town; L26.4 stays supporting in L02 (Quest 6.1 teaches it first); the Starters words stay.

1. **Weekday names, CD, and DVD as glossed words.** The profile needs 8 Movers words in each lesson, which is 112. The graph holds only 107 unglossed Movers words that are not names, days, *CD*, or *DVD*, and this map uses 106 of them. So this map also glosses the 7 day names (L03) and *CD* and *DVD* (L09). Option A (this map): gloss them. Option B: keep the days in `allow` and change the Quest 5 minimum to 7 Movers words, with 1 more Starters or Flyers word.
2. **Names and the Movers goal.** The graph counts 15 first names and *get undressed* as Movers words that are not glossed after Quest 5. Names cannot go in a glossary. Option A: the coverage report excludes names from the 100% goal. Option B: a glossary entry for each name (not recommended). *Get undressed* goes to Quest 6.1 (the pool lessons).
3. **Place names in L02.** R24.5 needs capital letters on names of places. The bible says that places have plain nouns. This map uses *Chiang Mai* in L02 (Aunt Sue's town) and nothing else. Option A: keep it. Option B: use only names of people, days, and months, and drop R24.5 from L02. Bank-5 b008 and b009 already use Bangkok and the City Park.
4. **New facts for Aunt Sue and Teacher Nick.** Aunt Sue is a nurse in Chiang Mai (L02, L09). Teacher Nick is new in town (L07). Do you accept both? If not, give Aunt Sue no job and make Teacher Nick ask for the library for a school reason.
5. **L26.4 (a caller's name and number).** The plan puts L26.4 in Quest 6.1. The phone call L02 practices it as a supporting objective (Aunt Sue says her number in words). Bank-5 has 3 phone-call targets, so level 5 meets the level rule. Option A: keep L26.4 supporting in L02. Option B: make it a target in L02. Then Quest 6.1 teaches 14 first, not 15.
6. **Starters words in the glossary.** 25 of 168 words are Starters words that no package glossed (for example *thanks, now, say, well*). The profile allows them. Option A (this map): keep them. Option B: raise the Flyers limit of `quest-5` from 2 to 3. Then the book glosses 14 more Flyers words, and the Flyers goal (95% by level 8) gets easier.

## Revision history

- 0.1 — 2026-10-06 — First version (track levels_5_9_20261006).
- 0.2 — 2026-10-06 — Daniel's decisions on §9: 1A without *CD* and *DVD* (L09 glosses *board game* and *dining room*), 2A, 3A, 4A, 5A, 6A.
