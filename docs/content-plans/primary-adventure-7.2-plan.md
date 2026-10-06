# Primary Advantage Adventure 7.2 — Lesson Map

Version 0.2 | Date 2026-10-06 | Status: Draft | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

Track: `levels_5_9_20261006`. Companion files: [`primary-quest-6.1-plan.md`](primary-quest-6.1-plan.md) (the model for this map), [`primary-levels-5-9-plan.md`](primary-levels-5-9-plan.md) (§3 band rule, §5 profiles, §6 vocabulary, §7 grammar, §8 cast), [`primary-quest-adventure-series-bible.md`](primary-quest-adventure-series-bible.md) (§2, §4–§7), [`level-plans/levels-5-9-objectives.json`](level-plans/levels-5-9-objectives.json), [`level-plans/bank-7.md`](level-plans/bank-7.md), [`data/grammar-levels-5-9.md`](data/grammar-levels-5-9.md), [`calibration/levels-5-9/l7-story.md`](calibration/levels-5-9/l7-story.md), [`calibration/levels-5-9/l7-info.md`](calibration/levels-5-9/l7-info.md), [`reviews/2026-10-06-prereview-level-5.md`](reviews/2026-10-06-prereview-level-5.md), [`reviews/2026-10-06-prereview-bank-6.md`](reviews/2026-10-06-prereview-bank-6.md), [`../../content/primary/AUTHORING.md`](../../content/primary/AUTHORING.md). The sister map is [`primary-adventure-7.1-plan.md`](primary-adventure-7.1-plan.md).

## 1. Summary

Adventure 7.2 is a book of level 7 (A2-, `cefr_level = 'A2'`, `ra_level = 7`). It has 14 workbook lessons. Each lesson has 12 glossed words, 2–4 target objectives, and one main grammar point of level 7. QR key: `a7.2/<lesson>`.

Text mix: 7 stories and 7 informational or functional texts. The stories are in L01, L04, L06, L08, L10, L12, L14; the other lessons are informational or functional. The book has a traditional story in L06 (*Stone Soup*, a traditional tale about sharing, told by Chef Lucy). Dates run from Monday, August 3 to Thursday, October 15, written in one form, month first (*October 5*). Every weekday agrees with the 2026 calendar.

Rule checks (run on this map with a script, 2026-10-06):

- **Book rule:** 19 of 19 objectives of `books["adventure-7.2"].objectives` are a target in 1 or more lessons (section 5.1). 18 of them are a target in 2 or more lessons; 1 in one lesson only (R32.8). No objective of the `outOfScope` list is a target.
- **Targets per lesson:** every lesson has 2–4 targets (5 lessons have 4, 9 have 3, 0 have 2). The map has 47 target slots and 22 different target objectives: the 19 book objectives and 3 other objectives (section 5.2).
- **Level rule:** each of the 46 in-scope objectives of level 7 is a target in 3 or more packages (Adventure 7.1, Adventure 7.2, and bank-7). The result is in section 5.3 and is the same in both maps.
- **Words:** every lesson has exactly 12 glossed words (168 in the book), no word twice in the book or in the sister book. A2 Key 28 (1–2 in each lesson, none in two lessons), Flyers 80 (7 of them new words of the free pool), Movers 60 (section 7).
- **Questions and dialogue:** 10 of 14 lessons plan a real question (the brief shows it in quotation marks or as a reader question). All 7 stories have dialogue; the functional lessons add speech or reader questions.

**Cast (series bible §2–§4):** Adventure 7.1 and 7.2 are the first term of Lily's last year of primary school (P6). Tom and Ben are 13 (M2). Sam is 12 (M1). May is 12. Lily, Mia, and Leo are 11 in Teacher Kim's class. Pat is 9. Nobody has a birthday in this book, so no age changes. The facts of levels 5 and 6 stay: no age is given for Grandma or Grandpa; Aunt Sue is a nurse who lives in a city in the north; Mia's mom is a doctor and her kitten is Snow; May and Pat live with their parents, their grandma, and the parrot Bill; Green Hill is the grandparents' village; Hugo is a boy in Tom's class; Mom's and Dad's jobs are not in the text. The club is the Explorers (Teacher Kim runs it; it meets on Thursday after lunch in the school library). Trips of this book: the science museum (L03), the small zoo (L07), and the old town (L09); no place comes twice in a row. Pen pals (Grace, Ravi, Alex, Nadia, with Ms. Ong in the background) are in 4 lessons (L08, L12, L13, L14) and never in more than 4 lessons in a row. Pip is in 4 lessons (L01, L05, L08, L14); he does not go on a trip and does not meet a pen pal. New adults: Guide Ann (L03) and Chef Lucy (L06); Uncle Dan (L05, on a postcard). The only proper place names are *Thailand* and *Singapore* (the second only in text, never in a picture line).

## 2. Text profile (`adventure-7`)

| Measure | Target |
|---|---|
| Words | 300–380, in 4–5 paragraphs |
| Mean sentence length | 7.5–9.0 words; longest sentence 16 words or less |
| Running words on Starters, Movers, or Flyers (names, glossed, allowed words not counted) | 95% or more |
| Glossed words | exactly 12 (the converter's `glossedCount`): 10 or more Flyers or Movers words, at most 2 A2 Key words (this map: 10 Flyers or Movers and 2 A2 Key in every lesson) |
| New words | the converter will WARN "new words" because recycled words are not new; that WARN is expected at level 7 |
| Question marks | 2 or more (book rule: 10 of 14 lessons; this map plans a question in 10 of 14) |

| Dialogue | 6 or more lessons. This map has dialogue in all 7 stories |

The Movers grammar and the first Flyers items were taught in levels 5 and 6. Level 7 uses the Flyers list: the present perfect with *ever, never, just, already, yet*; the past continuous with *when*; the zero conditional; *before / after* and *where* clauses; tag questions; *look / sound / feel like* and *make + adjective*; *be made of*; *What time ...?*, *What else?*, *See you soon*. Each lesson has one main point (section 6). The first conditional, *for / since*, *used to*, the passive, and reported speech do not appear. Voice follows bible §7: a close third person in the past simple for stories; a named writer for a blog post, a diary entry, or an email (*Posted by Mia*, *Dear Lily, ... Best wishes, Grace*); headings and no "I" in an informational text of the club or the school.

## 3. Lesson map

Targets are A2 key ids (`a2-objective-key.json`, GSE 30–33). "Supporting" lists the objectives that the text will clearly practice. Writers add other objectives of level 7 or below where the text practices them. Words are in section 7.

| # | Title | Text type | Genre | App | Cast and place | Targets | Supporting | Main grammar |
|---|---|---|---|---|---|---|---|---|
| L01 | Leo's Cartoon Strip | story: a cartoon in six pictures | Pets & Animals | fiction | Leo, Lily, Mia, Tom, Pip; Lily's garden and living room | R32.5, L31.12, R33.3 | R30.3, R32.6, L31.1, R31.2 | past continuous with when (also: past simple) |
| L02 | Three Notes for Saturday | functional: three notes with times and places | School | nonfiction | Lily; Lily's kitchen | R32.1, R33.1, L32.1 | R31.1, R30.8, R31.2, R27.4 | present perfect with already, yet (also: What time ...?) |
| L03 | Rules at the Science Museum | functional: signs, rules, and directions in a museum | Science & Space | nonfiction | Lily, Mia, Leo, May, Teacher Kim, Guide Ann; the science museum | R32.7, R33.2, L31.5 | R32.4, R30.2, L32.1, R31.1 | zero conditional (also: be made of) |
| L04 | The Treasure Cards | story: a game with if instructions | School | fiction | Teacher Kim, Lily, Mia, Leo, May; the school library | L31.10, R32.6, L32.1 | R32.7, R31.2, L31.1, R27.1 | zero conditional (also: before / after) |
| L05 | A Postcard from Uncle Dan | functional: a holiday postcard | Travel & Holidays | nonfiction | Tom, Lily, Pip; the living room (Uncle Dan on the card) | R32.8, R33.3, R32.2 | R31.1, R30.4, R31.5, R31.2 | look / sound / taste like (also: present perfect with never) |
| L06 | Stone Soup | story: a traditional tale about sharing | Food & Drink | fiction | Chef Lucy, Lily, Mia, Leo, May, Teacher Kim; the school canteen | L31.12, L31.9, R32.5 | R33.3, L32.1, L31.1, R31.2 | before / after clauses (also: What else?) |
| L07 | Mia's Fact File: The Gibbon | functional: a fact file with headings, a blog post | Pets & Animals | nonfiction | Mia (writer), Lily, Leo, Teacher Kim; the small zoo | R33.2, R32.2, L31.13 | R31.1, R30.4, L31.2, R31.5 | where clauses (also: What is ... like?) |
| L08 | Mia Waits for an Email | story: feelings while waiting | Friends & Feelings | fiction | Mia, Lily, Nadia (by email), Snow, Pip; Lily's living room | L31.9, R32.6, L31.12 | R33.3, L32.1, R31.2, L31.1 | tag questions (also: present perfect with yet) |
| L09 | The Old Town Trail Map | functional: a map with a key and directions | Places & Directions | nonfiction | Leo, Mia, Lily, Teacher Kim; the old town and Lily's table | R32.4, R33.6, R32.7, L31.6 | R31.1, R30.4, R31.2, R27.1 | before / after clauses (also: What time ...?) |
| L10 | The Book Sale | story: prices and comparing | School | fiction | Mia, Leo, May, Lily; the school hall | L31.6, L31.13, L31.10, L31.12 | L32.1, R30.4, L31.1, R27.6 | zero conditional (also: What else?) |
| L11 | Morning Announcements | functional: spoken school announcements with dates and places | School | nonfiction | May, Lily, Teacher Kim, a firefighter; the school field | L31.5, L33.4, L33.1, R33.1 | R31.1, R30.8, L32.1, R30.4 | What time ...? (also: See you soon) |
| L12 | Our Pen-Pal Cards | story: an interview for a pen-pal card | Friends & Feelings | fiction | Teacher Kim, Lily, Mia, Leo, May; the school library | L31.7, L31.11, R32.6 | R32.1, L31.1, R31.2, L32.1 | present perfect with ever, never (also: What else?) |
| L13 | Two Mornings, Two Emails | functional: two emails about daily routines | Family & Friends | nonfiction | Grace and Ravi (by email), Lily, Leo; the library computer | L31.11, L31.13, R33.1, L31.7 | R32.1, R31.1, R31.4, R30.4 | before / after clauses (also: look like) |
| L14 | The Map Without a Key | story: a school map for a pen pal | Places & Directions | fiction | Leo, Lily, Tom, Ravi (by email), Pip; Lily's kitchen | R32.4, R33.6, R33.1, R32.1 | R32.7, R31.2, L31.1, R27.1 | where clauses (also: tag questions) |

Notes:
- Pen pals: L08, L12, L13, L14. Their texts are emails; the pictures show the laptop screen with the email text in double quotation marks, never the pen pal (their sheets are in progress).
- Pip: L01, L05, L08, L14. Pip is never the narrator and does not read an email.
- L03, L07, and L09 are the club trips of August, September, and the end of September. L06 is a visit of Chef Lucy to the school canteen, not a trip. L14 is the review lesson: it uses a map, a key, an email, and a note.
- L06 is the traditional tale of the book (Chef Lucy tells it while the club cooks).
- Signs, notes, announcements, and a map key show their words in double quotation marks, exactly as in the text. Section 4 gives them.
- Months *August* and *October* are free Flyers words (L03, L11); *September* is a free Flyers word too (L07).

## 4. Lesson briefs and pictures

Each brief gives who, where, what happens, and how it ends. Each lesson has a hero picture and two inline pictures. Sign, poster, notice, map, blog, and email text is in double quotation marks, as in AUTHORING §6. Cast looks are not described when a cast sheet exists. A person outside the cast gets a full look at first mention. No child is in distress, on a bed, or with a hand on the face. No picture line names Singapore or the pen-pal school.

### L01 Leo's Cartoon Strip

Text type: story: a cartoon in six pictures. Genre: Pets & Animals. App type: fiction. Place: Lily's garden and living room.

On Sunday, Tom was washing his bike with a hose when Pip saw the water. Leo watched from the step and drew a cartoon for the blog. On Monday, August 3, he shows it to Lily and Mia. The six pictures have captions: "Tom washes his bike." "Pip sees the water." "Pip jumps!" "Pip is wet." "Pip shakes." "Now Tom is wet too!" Mia says, "I like Pip. He is a funny character." Leo asks, "Is the order clear?" and Lily says, "Yes, I can follow it."

- hero: A page of Leo's cartoon with six boxes and the captions "Tom washes his bike.", "Pip sees the water.", "Pip jumps!", "Pip is wet.", "Pip shakes.", "Now Tom is wet too!". Lily and Mia look at it.
- inline-para-2: In a garden, Tom holds a hose and washes a bike; Pip jumps at the water; Leo sits on a step with a sketchbook.
- inline-para-3: Pip shakes water drops over Tom, who laughs; the red ball lies on the grass.

### L02 Three Notes for Saturday

Text type: functional: three notes with times and places. Genre: School. App type: nonfiction. Place: Lily's kitchen.

On Friday, August 7, at six o'clock, Lily finds three notes. Teacher Kim's note says, "Dear parents, the Explorers go to the science museum tomorrow, Saturday, August 8. Please bring your child to the school gate at 8:00 a.m. The bus leaves at 8:15 a.m. We come back at 12:30 p.m., after lunchtime." Mom's note on the fridge says, "Lily, your snack and an umbrella are in your bag. Have you packed your notebook yet?" Mia's note says, "I'll wait at your gate at 7:40 a.m. Please bring back my math book." Lily writes a list: "7:40 gate, 8:00 school gate, 8:15 bus, 12:30 back".

- hero: Lily's school bag lies open on a kitchen table with three notes next to it. One reads "Saturday, August 8, school gate, 8:00 a.m., bus 8:15 a.m., back 12:30 p.m.", one "Lily, your snack and an umbrella are in your bag.", one "I'll wait at your gate at 7:40 a.m. Mia".
- inline-para-2: A note on a refrigerator under a magnet: "Lily, your snack and an umbrella are in your bag. Have you packed your notebook yet?"
- inline-para-3: Lily writes a list on a notepad: "7:40 gate", "8:00 school gate", "8:15 bus", "12:30 back"; she holds Mia's note in the other hand.

### L03 Rules at the Science Museum

Text type: functional: signs, rules, and directions in a museum. Genre: Science & Space. App type: nonfiction. Place: the science museum.

On Saturday, August 8, the museum opens at 9:00 a.m., and Guide Ann meets the Explorers at the door. She says, "The space show begins at 10:30 a.m. in Room 3." A sign by the big exhibition about the Earth says, "Please do not touch the models." Leo looks at the model rocket, made of metal, and puts his hands behind his back. Another sign says, "No running on the stairs." Guide Ann gives directions: "Take the stairs to Floor 2. Turn left. Room 3 is at the end." If visitors want to take photos, they can, but not with a flash.

- hero: The entrance of a museum with a sign "SCIENCE MUSEUM, Open 9:00 a.m. to 5:00 p.m." Guide Ann (about thirty, long black ponytail, white blouse, dark red scarf, black trousers, brown flat shoes, name badge on a cord) greets Lily, Mia, Leo, May, and Teacher Kim.
- inline-para-2: A big model of the Earth and a model rocket on a stand with a sign "Please do not touch the models." Leo holds his hands behind his back.
- inline-para-3: A staircase with signs "No running on the stairs" and "Space Show, 10:30 a.m., Room 3, Floor 2" with an arrow up; the children walk up one by one.

### L04 The Treasure Cards

Text type: story: a game with if instructions. Genre: School. App type: fiction. Place: the school library.

On Thursday, August 13, at one o'clock, Teacher Kim hides a treasure in the school library and gives each child a card: red, blue, or green. She says, "If your card is red, turn left at the corner. If it is blue, turn right. If it is green, go straight on to the window." Leo has a red card but turns right, and Mia says, "Leo, red is left!" Then Teacher Kim says, "If you hear the bell once, wait. If you hear it twice, continue to the middle table." Afterwards, everyone finds the secret box on the table. It holds twenty-four pencils with a paw print.

- hero: Teacher Kim stands in the library and holds up three cards, one red, one blue, and one green; Lily, Mia, Leo, and May stand in a line in front of her.
- inline-para-2: Leo holds a red card and turns right while the other children turn left; Mia points the other way.
- inline-para-3: At the middle table, children open a small wooden box full of pencils with a paw print; they cheer.

### L05 A Postcard from Uncle Dan

Text type: functional: a holiday postcard. Genre: Travel & Holidays. App type: nonfiction. Place: the living room (Uncle Dan on the card).

On Monday, August 17, a postcard arrives for Tom and Lily with a picture of a sunny coast with sailing boats. Uncle Dan wrote it on Wednesday, August 12. It says, "Dear Tom and Lily, greetings from the island! The weather is hot and sunny. On Monday I went sailing, and the waves were big. Today I am doing some sightseeing in the little town. I have never eaten so much fruit! I'll be home on Sunday, August 23. Say hello to Pip. Love, Uncle Dan." Pip sniffs the stamp, and Tom puts the card on the fridge. Lily asks, "What does the sea look like?"

- hero: Tom and Lily hold a postcard. The front is a photo of a sunny coast with palm trees and sailing boats and the words "GREETINGS FROM THE ISLAND".
- inline-para-2: The back of the postcard: a message on the left, a stamp and the words "Tom and Lily" on the right.
- inline-para-3: Uncle Dan (about forty-five, short wavy black hair, short mustache, blue checked shirt, beige trousers, brown shoes) sits at a small table at a beach café and writes a postcard; sailing boats are behind him.

### L06 Stone Soup

Text type: story: a traditional tale about sharing. Genre: Food & Drink. App type: fiction. Place: the school canteen.

On Thursday, August 27, Chef Lucy visits the school canteen and cooks with the club. She tells a tale while a big pot boils. Three hungry travelers came to a village, but nobody shared food. They put a clean stone in a pot of water and said, "We are making stone soup." A woman brought salt, a man brought vegetables, and a girl brought noodles. After the soup boiled, the whole village ate it together. Leo says, "I like soup with noodles!" and Lily asks, "Was there really a stone in the soup?" Chef Lucy laughs and says, "Not in ours!"

- hero: Chef Lucy (about forty-five, short black hair under a white chef's hat, white apron over a pale blue shirt, black trousers, white shoes) stands at a stove with a big silver pot; Lily, Mia, Leo, and May hold vegetables; Teacher Kim watches.
- inline-para-2: A storybook picture: three travelers with bags stand at a village door; a woman looks out.
- inline-para-3: The children sit at a canteen table with bowls of soup; Chef Lucy holds a clean gray stone on a plate.

### L07 Mia's Fact File: The Gibbon

Text type: functional: a fact file with headings, a blog post. Genre: Pets & Animals. App type: nonfiction. Place: the small zoo.

On Saturday, September 5, the club visits the small zoo, and Mia writes the fact file "The Gibbon" ("Posted by Mia"). Her headings are "Where gibbons live", "What gibbons eat", "How gibbons move", and "Fast facts". Gibbons live in the rainforest, in the mountains and high trees. They eat fruit, leaves, and insects. A gibbon swings from tree to tree with its long arms. An adult gibbon is bigger than a cat but lighter than a child, and gibbons are noisy in the morning. Mia ends, "Do you like gibbons? Which animal do you like?"

- hero: Mia stands at a fence with a sign "GIBBONS" and points her camera at a gibbon high in a tree; Lily and Leo stand beside her.
- inline-para-2: A gibbon swings between two ropes with its long arms.
- inline-para-3: A blog page with the heading "Mia's Fact File: The Gibbon" and four subheadings, "Where gibbons live", "What gibbons eat", "How gibbons move", "Fast facts".

### L08 Mia Waits for an Email

Text type: story: feelings while waiting. Genre: Friends & Feelings. App type: fiction. Place: Lily's living room.

On Monday, September 7, Mia sent Nadia a photo of her white kitten Snow. On Thursday, September 10, she waits at Lily's house for an answer and checks the laptop every ten minutes. Mia says, "I'm nervous. Has Nadia answered yet?" Lily says, "You are not worried, are you? Wait one more hour." At five o'clock the email comes: "Dear Mia, I am so glad you sent me a photo of Snow! She is wonderful." Mia says, "Now I am happy!" Pip sits at their feet, and Snow sleeps on Mia's lap.

- hero: Mia and Lily sit on a sofa with a laptop on a low table. Mia holds Snow, a white kitten; Pip sits on the floor near their feet.
- inline-para-2: The laptop screen shows an empty inbox; Mia leans toward it with wide eyes.
- inline-para-3: The laptop screen shows an email "Dear Mia, I am so glad you sent me a photo of Snow!" Mia smiles widely and Lily claps.

### L09 The Old Town Trail Map

Text type: functional: a map with a key and directions. Genre: Places & Directions. App type: nonfiction. Place: the old town and Lily's table.

On Saturday, September 26, the Explorers walk a trail in the old town, two kilometers long. Later Leo and Mia draw the map for the blog, and Lily checks it. The map has a key: "1 bus stop", "2 bridge", "3 café", "4 market", "5 old library, finish". The directions say, "Go north to the bridge. After the bridge, turn west. The café is opposite the post office. Go south to the market, then east to the old library." At the café Mia asks, "How much is the juice?" and the seller says, "Twenty baht." Teacher Kim asks, "Can you find the finish?"

- hero: A hand-drawn map titled "OLD TOWN TRAIL" with a compass marked "N" and a key box: "1 bus stop", "2 bridge", "3 café", "4 market", "5 old library, finish". Leo and Mia draw; Lily checks.
- inline-para-2: The club walks across a small bridge in the old town with Teacher Kim at the front.
- inline-para-3: Mia pays at a café counter with a coin; a sign says "JUICE 20 baht".

### L10 The Book Sale

Text type: story: prices and comparing. Genre: School. App type: fiction. Place: the school hall.

On Friday, October 2, at a quarter to two, the school hall has a book sale. A sign says "BOOK SALE: Comics 20 baht, Story books 30 baht, Quiz and puzzle books 40 baht. ALL HALF-PRICE after 2:00 p.m." Leo asks, "How much is this comic?" and May says, "Twenty baht. The quiz book is more expensive." Mia says, "If we wait until two o'clock, everything is half-price." Leo likes comics, May hates puzzles but likes quizzes, and Mia prefers story books. At two o'clock Leo pays 10 baht for a comic, May pays 20 baht for a quiz book, and Mia pays 30 baht for two story books.

- hero: A school hall with tables of books and a sign "BOOK SALE: Comics 20 baht, Story books 30 baht, Quiz and puzzle books 40 baht. ALL HALF-PRICE after 2:00 p.m." Leo, Mia, and May stand at a table.
- inline-para-2: May holds a quiz book and a comic and compares them; Mia holds two story books.
- inline-para-3: Leo gives a coin to a girl helper in school uniform; a wall clock shows 2:00.

### L11 Morning Announcements

Text type: functional: spoken school announcements with dates and places. Genre: School. App type: nonfiction. Place: the school field.

On Monday, October 5, at eight o'clock, the school stands in lines on the field, and May reads the announcements into a microphone. She says, "Today is Monday, October 5. The fire engine visits our school at 10:30 a.m. Please wait on the field. The school play is on Thursday, October 8, at 3:00 p.m. in the theater. Volleyball practice is on Wednesday at the lunch break on the field. The Explorers meet on Thursday at 1:00 p.m., and there is no trip this weekend." Lily writes the times in her notebook for the weekly blog. At 10:30 the fire engine arrives, and a firefighter says hello.

- hero: The school field with lines of children in uniform. May speaks into a microphone on a small stand; Teacher Kim stands beside her.
- inline-para-2: Lily writes in a notebook: "Fire engine, Monday, October 5, 10:30 a.m., field" and "School play, Thursday, October 8, 3:00 p.m., theater".
- inline-para-3: A red fire engine on the school field; a firefighter (a man in a yellow jacket and a white helmet) waves; children watch.

### L12 Our Pen-Pal Cards

Text type: story: an interview for a pen-pal card. Genre: Friends & Feelings. App type: fiction. Place: the school library.

On Thursday, October 8, at one o'clock, Teacher Kim gives each child a pen-pal card for Ms. Ong's class. The card has lines for "First name", "Age", "Hobbies", and "A normal day". Lily asks Mia, "What is your first name? How old are you?" Mia says, "I am Mia, aged eleven. I get up at six. I walk to school with Lily." Lily asks, "Have you ever played chess?" and Mia says, "No, never." Leo writes "Age: 100", and Teacher Kim says, "A true card, please." Leo laughs and writes "eleven".

- hero: A library table with blank cards: "First name: ____", "Age: ____", "Hobbies: ____", "A normal day: ____". Lily and Mia sit opposite each other with pencils.
- inline-para-2: Leo holds a card with "Age: 100" and grins; Teacher Kim shakes her head and smiles.
- inline-para-3: May writes on her card; a box on the table is marked "FOR MS. ONG'S CLASS".

### L13 Two Mornings, Two Emails

Text type: functional: two emails about daily routines. Genre: Family & Friends. App type: nonfiction. Place: the library computer.

On Monday, October 12, Lily and Leo read two emails. Grace writes to Lily: "Dear Lily, I get up at six o'clock with my alarm clock. Before school I get dressed and eat toast. I take the bus at seven." Ravi writes to Leo: "Dear Leo, I wake up at half past five because I have badminton at a quarter past six. I usually wait at the bus stop at seven." Lily writes back, "I get up at a quarter past six, so my morning is later than yours." Leo says, "I always get up at a quarter to seven. Ravi gets up earlier than I do!"

- hero: Lily and Leo sit at a library computer. The screen shows two emails side by side: "Dear Lily, I get up at six o'clock." and "Dear Leo, I wake up at half past five."
- inline-para-2: Lily types a reply: "I get up at a quarter past six."; Leo reads over her shoulder.
- inline-para-3: Leo holds an alarm clock and makes a funny face while Lily laughs.

### L14 The Map Without a Key

Text type: story: a school map for a pen pal. Genre: Places & Directions. App type: fiction. Place: Lily's kitchen.

On Thursday, October 15, at four o'clock, an email from Ravi asks, "Where is your library? Where is your gym?" Leo draws a map of the school at Lily's kitchen table with a book, a circle, and a ball. Tom passes and says, "Which one is the library? You have mixed up the gym and the library, haven't you?" Lily says, "A map needs a key." Leo writes: "book = library", "circle = gym", "ball = field", "square = classroom". Ravi answers, "Now I can find your library!" Pip lies under the table with his red ball.

- hero: A hand-drawn school map on a kitchen table with symbols (a book, a circle, a ball, squares) and an empty box marked "KEY". Lily points at the box; Leo holds a pencil; Tom stands behind them.
- inline-para-2: Leo writes in the key box: "book = library", "circle = gym", "ball = field", "square = classroom".
- inline-para-3: A laptop screen shows "Now I can find your library! Thank you." Lily and Leo smile; Pip lies under the table with the red ball.

## 5. Objectives

### 5.1 Book rule: the 19 objectives of `books["adventure-7.2"]`

| Objective | Target in | Text |
|---|---|---|
| L31.5 | L03, L11 | Can identify key information (e.g. 'places', 'times') from short audio recordings, if spoken slowly and clearly. |
| L31.6 | L09, L10 | Can identify how much something costs in short, simple dialogues about the price of something e.g. 'in a shop', 'if speech is slow and clear.' |
| L31.7 | L12, L13 | Can understand basic personal information in short, simple dialogues, if spoken slowly and clearly and guided by written prompts. |
| L31.9 | L06, L08 | Can understand how people are feeling if they use simple language and speak slowly and clearly. |
| L31.10 | L04, L10 | Can understand a simple instruction containing a qualifying clause (e.g. 'If your birthday is in March, stand here.') |
| L31.11 | L12, L13 | Can understand the main information in short, simple dialogues about someone's daily routines, if spoken slowly and clearly and supported by pictures. |
| L31.12 | L01, L06, L08, L10 | Can understand simple expressions about likes and dislikes in short, simple stories or dialogues, if spoken slowly and clearly. |
| L31.13 | L07, L10, L13 | Can understand simple comparisons between objects or people, if spoken slowly and clearly. |
| R32.1 | L02, L14 | Can understand simple notes. |
| R32.2 | L05, L07 | Can understand and make connections between words in the same area of meaning, e.g. 'head' and 'hat' |
| R32.4 | L09, L14 | Can identify key buildings on a plan or key features on a map. |
| R32.5 | L01, L06 | Can follow the sequence of events in short, simple cartoon stories that use familiar key words. |
| R32.6 | L04, L08, L12 | Can understand a simple written dialogue on a familiar topic. |
| R32.7 | L03, L09 | Can understand everyday written signs and notices found in public places (e.g. 'rules', 'directions'), if supported by the context. |
| R32.8 | L05 | Can understand some simple details about a holiday from a postcard, if supported by pictures. |
| L32.1 | L02, L04 | Can identify the context of short, simple dialogues related to familiar everyday situations. |
| R33.1 | L02, L11, L13, L14 | Can understand key information about time and place in short, simple messages from family or friends. |
| R33.2 | L03, L07 | Can identify key information in short, simple factual texts from the headings and illustrations. |
| R33.3 | L01, L05 | Can get the gist of short, simple texts on familiar topics, if supported by pictures. |

Result (script check, 2026-10-06): 19 of 19 objectives are a target in 1 or more lessons. None is missing. Every lesson has exactly 12 glossed words and at most 2 A2 Key words (script check, section 7).

R32.8 has one target lesson. bank-7 gives it practice in 2 packages, so the level rule holds.

### 5.2 Other targets

The `--next` list of the book is empty: the objectives of Adventure 7.1 are taught first in that book, and no band objective is taught before it. This map takes three extra targets for the level rule of level 7 (GSE 33, first taught in Adventure 8.1 by the plan). bank-7 gives each only 2 packages.

| Objective | bank-7 | Target in | Reason |
|---|---|---|---|
| L33.1 | 2 | L11 | level rule: bank-7 has 2 packages and needs 3 |
| L33.4 | 2 | L11 | level rule: bank-7 has 2 packages and needs 3 |
| R33.6 | 2 | L09, L14 | level rule: bank-7 has 2 packages and needs 3 |

The other band objectives have supporting use in many lessons (section 3).

### 5.3 Level rule: the 46 in-scope objectives of level 7

Level 7 has 100 packages: the 28 lessons of Adventure 7.1 and 7.2 and the 72 articles of bank-7. The bank column counts targets in `level-plans/bank-7.json` (2026-10-06). The two book columns count the targets of the two draft maps.

| Objective | Adventure 7.1 | Adventure 7.2 | bank-7 | Total | Flag |
|---|---|---|---|---|---|
| R30.1 | 3 | 0 | 4 | 7 |  |
| R30.2 | 2 | 0 | 2 | 4 |  |
| R30.3 | 2 | 0 | 5 | 7 |  |
| R30.4 | 5 | 0 | 4 | 9 |  |
| R30.5 | 2 | 0 | 2 | 4 |  |
| R30.6 | 2 | 0 | 2 | 4 |  |
| R30.7 | 2 | 0 | 2 | 4 |  |
| R30.8 | 2 | 0 | 2 | 4 |  |
| R31.1 | 3 | 0 | 4 | 7 |  |
| R31.2 | 2 | 0 | 2 | 4 |  |
| R31.3 | 1 | 0 | 2 | 3 |  |
| R31.4 | 2 | 0 | 2 | 4 |  |
| R31.5 | 2 | 0 | 2 | 4 |  |
| R31.6 | 1 | 0 | 3 | 4 |  |
| R32.1 | 0 | 2 | 2 | 4 |  |
| R32.2 | 0 | 2 | 2 | 4 |  |
| R32.4 | 0 | 2 | 2 | 4 |  |
| R32.5 | 0 | 2 | 5 | 7 |  |
| R32.6 | 0 | 3 | 2 | 5 |  |
| R32.7 | 0 | 2 | 2 | 4 |  |
| R32.8 | 0 | 1 | 2 | 3 |  |
| R33.1 | 0 | 4 | 4 | 8 |  |
| R33.2 | 0 | 2 | 2 | 4 |  |
| R33.3 | 0 | 2 | 6 | 8 |  |
| R33.4 | 0 | 0 | 5 | 5 |  |
| R33.5 | 0 | 0 | 4 | 4 |  |
| R33.6 | 0 | 2 | 2 | 4 |  |
| L30.1 | 2 | 0 | 2 | 4 |  |
| L30.3 | 2 | 0 | 2 | 4 |  |
| L31.1 | 2 | 0 | 2 | 4 |  |
| L31.2 | 4 | 0 | 4 | 8 |  |
| L31.3 | 3 | 0 | 6 | 9 |  |
| L31.4 | 2 | 0 | 4 | 6 |  |
| L31.5 | 0 | 2 | 4 | 6 |  |
| L31.6 | 0 | 2 | 4 | 6 |  |
| L31.7 | 0 | 2 | 2 | 4 |  |
| L31.9 | 0 | 2 | 4 | 6 |  |
| L31.10 | 0 | 2 | 4 | 6 |  |
| L31.11 | 0 | 2 | 4 | 6 |  |
| L31.12 | 0 | 4 | 4 | 8 |  |
| L31.13 | 0 | 3 | 4 | 7 |  |
| L32.1 | 0 | 2 | 4 | 6 |  |
| L33.1 | 0 | 1 | 2 | 3 |  |
| L33.2 | 0 | 0 | 6 | 6 |  |
| L33.3 | 0 | 0 | 4 | 4 |  |
| L33.4 | 0 | 1 | 2 | 3 |  |

Result: 46 of 46 objectives have 3 or more. None is under 3. Every objective that a book teaches first has a workbook target. R33.6, L33.1, and L33.4 reach 3 only with the Adventure 7.2 targets (section 5.2 of that map).

## 6. Grammar

One main grammar point for each lesson. The table follows the Flyers items of level 7 (`data/grammar-levels-5-9.md` §4). The writer uses the main point in the key sentences of the text and in two or three questions. "Also" points are secondary.

| Grammar point (level 7) | Main in | Also in |
|---|---|---|
| past continuous with when | L01 | - |
| present perfect with already, yet | L02 | - |
| zero conditional | L03, L04, L10 | - |
| look / sound / taste like | L05 | - |
| before / after clauses | L06, L09, L13 | - |
| where clauses | L07, L14 | - |
| tag questions | L08 | L14 |
| What time ...? | L11 | L02, L09 |
| present perfect with ever, never | L12 | - |

Avoid at level 7: the first conditional, *for / since* with the present perfect, *used to*, the passive, reported speech, *too / enough*, and *a few / a little* as a taught pattern. *If* starts only a zero conditional (*If your card is red, turn left.*). The "also" points are in section 3.

## 7. Words

Each lesson glosses 12 words: 1–2 new A2 Key words of the free pool, any free Flyers word that fits, and Flyers or Movers words that earlier packages glossed (recycling is the goal at level 7). The words of a lesson fit its text. American spelling. No word is glossed twice in the two books.

| # | A2 Key words (free pool) | New Flyers words (free pool) | Flyers words glossed before | Movers words glossed before |
|---|---|---|---|---|
| L01 | character, action | - | cartoon, excited | kick, naughty, hide, quick, fall, catch, surprised, loudly |
| L02 | lunchtime, bring back | math | tomorrow, later, late, minute, remember, forget, umbrella, snack | message |
| L03 | exhibition, visitor | earth, august | planet, space, rocket, museum, touch, future, invent | stair |
| L04 | continue, afterwards | - | left, right, corner, next, end, front, middle, across, secret | treasure |
| L05 | sightseeing, coast | - | stamp, postcard, hotel, sunglasses, suitcase | holiday, island, sail, wave, weather |
| L06 | ingredient, boil | - | salt, pepper, smell, taste, stone | soup, vegetable, village, noodles, hot |
| L07 | rainforest, adult | september | high, swing, heavy, noisy, insect | huge, strong, mountain, leaf |
| L08 | nervous, glad | - | hope, worried, pleased, wonderful | laptop, internet, email, wait, kitten, send |
| L09 | directions, crossing | - | north, south, east, west, bridge | station, map, café, opposite, building |
| L10 | sale, half-price | - | expensive, popular, prefer, hate, lovely, quiz, puzzle | hundred, pair, present |
| L11 | microphone, weekly | october, fire engine, theater | visit, arrive, break, volleyball | o'clock, weekend, field |
| L12 | first name, aged | - | interested, violin, chess, collect | parent, age, address, country, dance, practice |
| L13 | alarm clock, wake up | - | usually, quarter, half, before | get up, get dressed, sometimes, always, often, bus stop |
| L14 | clearly, area | - | key, gym, same, mix | road, library, straight, circle, center, ground |

Counts (script check, 2026-10-06): 14 lessons x 12 = 168 glossed words, 168 different. A2 Key 28 (every lesson has 1–2, none has more than 2). Flyers 80, of which 7 are free-pool words (math, earth, august, september, october, fire engine, theater). Movers 60. Every lesson has 10 or more Flyers or Movers words.

Word notes for writers:
- **A2 Key words.** Each A2 Key word is new. Give it a glossary entry with the sense of the text and a simple example. Phrases (*by accident, bring back, alarm clock, wake up, first name, half-price*) get one entry.
- **Swap rule.** A writer can swap at most 2 words of a lesson for words of the same topic that no other lesson of the two books uses. A2 Key swaps come from the free pool (`a7-word-pool.md`). Tell the lead which, so that the counts stay true.
- **Months, times, and numbers.** Months, weekdays, *a.m.*, *p.m.*, *baht*, and figures in times, prices, and dates are allowed in Adventure (bible §5). Months that this map glosses are free-pool words; if the converter refuses one, the writer takes a swap.
- **Names.** *Thailand*, *Singapore*, *Explorers*, and the names of the cast go in `names` or `allow`.

## 8. Questions and tasks

- MCQ (4 printed of 10): at least 2 test a target objective (L02: "What time does the bus leave?"; L03: "Where is Room 3?"; L09: "What is opposite the post office?"; L10: "How much is a story book after two o'clock?").
- Short answer (1): a personal question in the lesson frame (L02: "What do you take on a trip?"; L05: "Where would you like a holiday?"; L13: "When do you get up? How is your morning different from Grace's?").
- Writing: a personal version of the text type (L02: "Write a note with a time and a place." L05: "Write a postcard from a holiday." L07: "Write a fact file with three headings." L09: "Draw a map with a key." L11: "Write three school announcements.").
- Listening objectives (L-ids) are tested through the audio of the text: the question uses the words that the voice says. L11 needs one voice for the announcements. L10 and L12 need one voice for each speaker (plan D5).

## 9. Questions for Daniel

1. **Calendar.** The texts have dates and weekdays that agree with 2026 (August to October). Option A: keep dates in the form *October 5*, month first. Option B: use weekdays and times only, with no date.
2. **Months as glossed words.** Free Flyers words are mostly months. Option A: gloss the months that fit (listed in section 7). Option B: put months in `allow` and gloss other words.
3. **New facts.** Uncle Dan has a holiday on an island and sends a postcard (L05). Chef Lucy visits the school canteen (L06). The school has a fire engine visit and a school play (L11). Do you accept them? Option A: accept. Option B: drop the fact and the writer takes a swap.
4. **Traditional tale.** *Stone Soup* is an old European tale about sharing; Chef Lucy tells it. Option A: keep it. Option B: use a Thai tale that you choose.
5. **Pen pals in pictures.** The pen-pal sheets are in progress. This map shows each pen pal only as email text on a laptop screen. Option A: keep this. Option B: wait for the sheets and draw the children.
6. **Figures on signs.** Posters, signs, and notes show times, prices, and dates as figures (*1:00 p.m.*, *20 baht*). Option A: keep figures in the text and the pictures (the bible allows them). Option B: words in the text, figures only in the pictures.
7. **Extra targets for the level rule.** R33.6, L33.1, and L33.4 are first taught in Adventure 8.1 (GSE 33), but bank-7 gives them only 2 packages. This map targets R33.6 in L09 and L14, and L33.1 and L33.4 in L11. Option A: keep. Option B: leave them to bank-7 (the level rule then fails for these 3 objectives) or move them to Adventure 8.1.
8. **One postcard target.** R32.8 has one lesson (L05). bank-7 gives it 2 packages, so the level rule holds. Option A: keep. Option B: add R32.8 to L09 as a target (L09 then has 5 targets, above the limit of 4).

**Lead decisions for the writers (2026-10-06).** Daniel reviews the finished lessons, so these choices are provisional. Every question: option A. A pen pal appears in a picture only as email text on a screen, with no drawn person, until Daniel chooses the pen-pal sheets.

## Revision history

- 0.2 — 2026-10-06 — Lead decisions for the writers in §9 (Daniel can change them in his review).
- 0.1 — 2026-10-06 — First version (track levels_5_9_20261006).
