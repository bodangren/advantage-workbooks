# Primary Advantage Adventure 8.2 — Lesson Map

Version 0.2 | Date 2026-10-06 | Status: Draft | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

Track: `levels_5_9_20261006`. Companion files: [`primary-adventure-7.1-plan.md`](primary-adventure-7.1-plan.md) (the model for this map), [`primary-levels-5-9-plan.md`](primary-levels-5-9-plan.md) (§3 band rule, §5 profiles, §6 vocabulary, §7 grammar, §8 cast), [`primary-quest-adventure-series-bible.md`](primary-quest-adventure-series-bible.md) (§2, §4–§7), [`level-plans/levels-5-9-objectives.json`](level-plans/levels-5-9-objectives.json), [`level-plans/bank-8.md`](level-plans/bank-8.md), [`data/grammar-levels-5-9.md`](data/grammar-levels-5-9.md), [`calibration/levels-5-9/l8-story.md`](calibration/levels-5-9/l8-story.md), [`calibration/levels-5-9/l8-info.md`](calibration/levels-5-9/l8-info.md), [`reviews/2026-10-06-prereview-level-5.md`](reviews/2026-10-06-prereview-level-5.md), [`reviews/2026-10-06-prereview-bank-6.md`](reviews/2026-10-06-prereview-bank-6.md), [`../../content/primary/AUTHORING.md`](../../content/primary/AUTHORING.md). The sister maps are [`primary-adventure-8.1-plan.md`](primary-adventure-8.1-plan.md) and [`primary-adventure-8.3-plan.md`](primary-adventure-8.3-plan.md) (written at the same time).

## 1. Summary

Adventure 8.2 is a book of level 8 (A2, `cefr_level = 'A2'`, `ra_level = 8`). It has 14 workbook lessons. Each lesson has 12 glossed words, 2–4 target objectives, and one main grammar point of level 8. QR key: `a8.2/<lesson>`. The book brings excuses, school talk, directions on foot, a recorded phone message and a call, a guide's talk with numbers, a diagram, game instructions, a recipe, a biography, and two emails on one topic.

Text mix: 6 stories and 8 informational or functional texts. The stories are in L01, L02, L04, L05, L10, L14; the other lessons are informational or functional. The book has a traditional story in L10 (*The Lion and the Mouse*, a fable that Teacher Kim tells in the club hour). Dates run from Tuesday, December 1 to Wednesday, December 23, written in one form, month first (*December 12*; in the text, *December twelfth*). Every weekday agrees with the 2026 calendar. No lesson falls on a public holiday (Saturday, December 5 and Thursday, December 10 are holidays in Thailand and have no lesson). The two club trips are the science museum (Saturday, December 12, L07) and the cooking class (Saturday, December 19, L11).

Rule checks (run on this map with a script, 2026-10-06):

- **Book rule:** 20 of 20 objectives of `books["adventure-8.2"].objectives` are a target in 1 or more lessons (section 5.1). 20 of them are a target in 2 or more lessons; 0 in one lesson only. No objective of the `outOfScope` list is a target.
- **Targets per lesson:** every lesson has 2–4 targets (9 lessons have 4, 5 have 3, 0 have 2). The map has 51 target slots and 26 different target objectives: the 20 book objectives and 6 other objectives (section 5.2).
- **Level rule:** each of the 67 in-scope objectives of level 8 is a target in 3 or more packages (Adventure 8.1, 8.2, 8.3, and bank-8). The result is in section 5.3 and is the same in both maps.
- **Words:** every lesson has exactly 12 glossed words (168 in the book), no word twice in the book or in the sister book. Every lesson has exactly 5 new A2 Key words from the free pool (70 new words in the book, all in the pool list, none glossed by any earlier package), and 7 words that earlier packages glossed (70 Flyers, 28 A2 Key; 59 of the 98 come from Adventure 7). No lesson has a B1 word (section 7).
- **Questions and dialogue:** 14 of 14 lessons plan a real question (the brief shows it in quotation marks). All 6 stories have dialogue; 8 functional lessons add speech, a call, an announcement, or reader questions.

**Cast (series bible §2–§4):** Adventure 8.1, 8.2, and 8.3 are the middle of Lily's last year of primary school (P6), from November 2026 to January 2027; this book is December. Tom and Ben are 13 (M2). Sam is 12 (M1). May is 12. Lily, Mia, and Leo are 11 in Teacher Kim's class. Pat is 9. Nobody has a birthday in this book, so no age changes. The facts of levels 5–7 stay: no age is given for Grandma or Grandpa; Aunt Sue is a nurse who lives in a city in the north; Mia's mom is a doctor and her kitten is Snow; May and Pat live with their parents, their grandma, and the parrot Bill; Green Hill is the grandparents' village; Hugo is a boy in Tom's class; Mom's and Dad's jobs are not in the text. The club is the Explorers (Teacher Kim runs it; it meets on Thursday after lunch in the school library). Trips of this book: the science museum (L07) and the cooking class (L11); no place comes twice in a row. Pen pals (Grace, Alex, Ravi, and Nadia, with Ms. Ong) are in 4 lessons (L05, L09, L13, L14) and never in more than 4 lessons in a row. Pip is in 4 lessons (L05, L08, L09, L14); he does not go on a trip and does not meet a pen pal. New adults: Guide Ann (L03 by phone, L07) and Chef Lucy (L11); a shop assistant (L04) and a museum receptionist (L03, voice only) get one look or none. The only proper place names are *Thailand* and *Singapore* (*Singapore* only in text, never in a picture line); the museum, the shop, and the streets have plain nouns.

## 2. Text profile (`adventure-8`)

| Measure | Target |
|---|---|
| Words | 340–430, in exactly 5 paragraphs |
| Mean sentence length | 7.8–9.5 words; longest sentence 18 words or less |
| Running words on Starters, Movers, Flyers, or A2 Key (names, glossed, allowed words not counted) | 95% or more |
| Glossed words | exactly 12 (the converter's `glossedCount`): 5 or more on the A2 Key list, at most 1 B1 word, the rest Flyers words (this map: 5 new A2 Key words and 7 words glossed before in every lesson, at most 3 of the 7 on the A2 Key list, no B1 word) |
| New words | 5 or more glossed A2 Key words that no earlier text uses (this map: exactly 5) |
| Recycled words | 4 or more glossed words of earlier lessons occur again in the text (this map: 7) |
| Question marks | 2 or more (book rule: 10 of 14 lessons; this map plans a question in 14 of 14) |
| Dialogue | 6 or more lessons. This map has dialogue in all 6 stories |
| Digits | The converter refuses digits in the text. Numbers, times, dates, and prices are words in the text (*half past eight*, *November second*, *sixty baht*). A picture, a sign, a poster, or a map may show figures |

Level 8 uses the A2 Key list on top of the Movers and Flyers grammar of levels 5–7. This book uses the middle A2 Key items: *would* for requests, *too*, *(not) as ... as*, the present continuous for arrangements, the first conditional, *How long / How heavy / How many ...?*, participles as adjectives, gerunds, *that* clauses, and the present perfect with *for / since*. Each lesson has one main point (section 6). Voice follows bible §7: a close third person in the past simple for stories; a named writer for a blog post, a diary entry, or an email (*Posted by Lily*, *Dear Tom, ... Best wishes, Alex*); headings and no "I" in an informational text of the club or the school; a recipe, a map, and game screens speak to the reader in steps. The linking words *and, so, but,* and *because* stay in every text. A biography names its writer (May).

## 3. Lesson map

Targets are A2 key ids (`a2-objective-key.json`, GSE 33–36 for this book, plus a few other objectives that section 5.2 names). "Supporting" lists the objectives that the text will clearly practice. Writers add other objectives of level 8 or below where the text practices them. Words are in section 7.

| # | Title | Date | Text type | Genre | App | Cast and place | Targets | Supporting | Main grammar |
|---|---|---|---|---|---|---|---|---|---|
| L01 | Leo's Missing Homework | Tuesday, December 1 | story: excuses and a school conversation | School | fiction | Leo, Lily, Mia, May, Teacher Kim; the classroom | L34.4, L34.6, R35.5, R35.2 | L34.3, R34.2, L33.2, R30.7 | would for polite requests (also: too) |
| L02 | Which Trip Shall We Take? | Thursday, December 3 | story: a club talk that compares two places | Places & Directions | fiction | Lily, Mia, Leo, May, Teacher Kim; the school library (club hour) | L35.3, L35.2, L35.1, L34.3 | R35.5, L33.3, L35.4, R34.2 | (not) as ... as (also: present continuous for the future) |
| L03 | Lily Calls the Museum | Friday, December 4 | functional: a recorded phone message and a phone call | Places & Directions | nonfiction | Lily, Mom (in the background), a museum receptionist and Guide Ann (voices only); the kitchen at home | L38.4, L38.5, L35.6, L33.4 | R35.6, L34.5, R34.8, L26.4 | How much / How many ...? (also: would for requests) |
| L04 | The Wrong Size | Sunday, December 6 | story: a shopping talk with a clear place | Shopping | fiction | Tom, Ben, a shop assistant; the sports store | L35.4, R35.6, L35.6, L34.3 | L35.1, R35.5, R34.2, L31.6 | too (also: whose) |
| L05 | The Wrong Books | Monday, December 7 | story: a changed timetable and an excuse, with Grace's email | School | fiction | Lily, Mia, Teacher Kim, Grace (by email), Pip; Lily's desk at home and the classroom | L34.6, R35.4, L35.1, R35.2 | L34.3, R32.1, R33.1, R34.2 | present continuous for arrangements (also: don't have to) |
| L06 | The Walk from the Bus Stop | Friday, December 11 | functional: directions on foot with a map | Places & Directions | nonfiction | Teacher Kim, Lily, Mia, Leo, May; the classroom | L34.5, R33.6, R35.1 | R32.4, R34.1, R34.3, R32.7 | prepositions of direction (also: How long?) |
| L07 | A Whale in the Hall | Saturday, December 12 | functional: a guide's talk with numbers, a blog post | Science & Space | nonfiction | Lily (writer), Guide Ann, Mia, Leo, May, Teacher Kim; the science museum | L35.5, L36.1, R35.3, R36.3 | L35.6, R35.1, R34.8, R33.2 | How long / How heavy / How many ...? (also: a lot of) |
| L08 | Mia's Water Diagram | Monday, December 14 | functional: a diagram with labels | Science & Space | nonfiction | Mia (writer), Lily, Pip; Lily's kitchen table | R35.1, R35.3, R33.2 | R35.6, R34.3, R34.1, R36.2 | participles as adjectives (also: prepositions of instrument) |
| L09 | Alex's Robot Game | Wednesday, December 16 | functional: an email with game instructions and screen feedback | Technology & Games | nonfiction | Alex (by email), Tom, Ben, Pip; the living room | R36.3, R36.2, R31.3 | R35.1, R33.1, R34.5, R30.4 | first conditional (also: How often?) |
| L10 | The Lion and the Mouse | Thursday, December 17 | story: a traditional tale told by Teacher Kim | Pets & Animals | fiction | Teacher Kim, Lily, Mia, Leo, May; the school library (club hour) | R36.1, R35.5, R35.2 | R33.4, R31.6, L35.4, R34.4 | gerunds (also: that clauses) |
| L11 | Chef Lucy's Egg Fried Rice | Saturday, December 19 | functional: a recipe and a short talk | Food & Drink | nonfiction | Chef Lucy, Lily, Mia, Leo, May, Teacher Kim; the cooking class | R36.2, L36.1, L34.5, L35.1 | R35.1, R38.11, L31.10, R34.1 | would for polite requests (also: How much / How many?) |
| L12 | Miss Alice and the Book Boat | Monday, December 21 | functional: a biography of a person of the past, a blog post | History | nonfiction | May (writer), Lily; May's desk and the school library | R35.4, R35.6, L35.6, L35.5 | R35.3, R34.3, R33.5, R33.2 | present perfect with for / since (also: participles as adjectives) |
| L13 | Two Emails, Two Places | Tuesday, December 22 | functional: two emails on one topic, to compare | Travel & Holidays | nonfiction | Ravi and Nadia (by email), Lily, Mia, Leo; the library computer | L35.3, R35.3, L35.4 | R35.4, R35.1, R35.6, R33.1 | (not) as ... as (also: too) |
| L14 | A Card for Palm Lake | Wednesday, December 23 | story: a class card and plans for the new year | School | fiction | Teacher Kim, Lily, Mia, Leo, May, Ms. Ong (by email), Pip; the classroom and home | R35.5, R36.1, L35.2, L34.4 | R35.2, L34.3, R33.1, L35.1 | present continuous for the future (also: would for requests) |

Notes:
- Pen pals: L05 (Grace's email), L09 (Alex's email), L13 (Ravi's and Nadia's emails), L14 (Ms. Ong's email). The pictures show the laptop screen with the email text in double quotation marks, never the pen pal (their sheets are in progress).
- Pip: L05, L08, L09, L14. Pip is never the narrator and does not read an email.
- L07 and L11 are the club trips of December (the science museum, then the cooking class). L02, L03, and L06 prepare the first trip. L14 is the review lesson: it uses an email, an excuse, plans, and a card.
- L10 is the traditional tale of the book. Teacher Kim tells it, so the narrator of the tale is clear.
- L03 is a call from Mom's cell phone in a family scene (the bible lets children use a phone in family stories only). Guide Ann and the receptionist are voices only; no picture shows them.
- Leaflets, maps, signs, recipe cards, game screens, and notes (L03, L06, L07, L09, L11, L12) show their words in double quotation marks, exactly as in the text. Section 4 gives them.
- Dates and times: the museum is open Tuesday to Sunday, 9:00 a.m. to 5:00 p.m.; a child's ticket is 30 baht (L02, L03). The group meets the assistant at 10:30 a.m. on December 12, and Guide Ann's talk is at 11:00 a.m. (L03, L07). The cooking class costs 80 baht (L02).
- Biography: Miss Alice is an invented person of the past with fixed dates (born 1912, teacher at 22 in 1934, boat license 1936, stops in 1968, lived to 78, died 1990; her boat has been in the museum since 2005). The numbers agree in L12 and in the quiz questions.

## 4. Lesson briefs and pictures

Each brief gives who, where, what happens, and how it ends. Each lesson has a hero picture and two inline pictures. Sign, poster, leaflet, notice, map, blog, and email text is in double quotation marks, as in AUTHORING §6. The briefs write some numbers as figures so that the reader can check them; the lesson text writes every number, time, date, and price as words (section 2). Cast looks are not described when a cast sheet exists. A person outside the cast gets a full look at first mention; Ranger Mark, Guide Ann, Chef Lucy, and Nurse Jill use the look line of the bible (§6), and Hugo uses the look of Adventure 7.1. No child is in distress, on a bed, or with a hand on the face. No picture line names Singapore or the pen-pal school. A pen pal never appears in a picture; an email is text on a screen.

### L01 Leo's Missing Homework

Text type: story: excuses and a school conversation. Genre: School. App type: fiction. Place: the classroom.

On Tuesday, December 1, at eight o'clock, Teacher Kim asks the class to hand in the science homework, a poster about water, and Leo has nothing to hand in. He gives three excuses in a row: he left the poster at Mia's house, his pen stopped working, and, by the way, the blackboard has a funny spot. Teacher Kim says, "Would you tell me the real reason, Leo?" Leo says, "I played a computer game until nine o'clock, and then I was too tired." Teacher Kim says, "What a shame! Thank you for the truth. Please bring the poster tomorrow." Mia lends him her textbook, and Lily writes a vocabulary list for the poster: river, rain, cloud, and drop.

- hero: A classroom in the morning. Teacher Kim stands at the front next to a blackboard with the words "SCIENCE: poster due today". Leo stands beside his desk with empty hands; Lily, Mia, and May sit at their desks and watch.
- inline-para-2: Leo turns his open bag upside down on his desk: a ruler, an apple, and an eraser fall out, but there is no poster; Mia and Lily look on.
- inline-para-3: Mia holds out her science textbook to Leo; Lily writes a list headed "Vocabulary" with the words "river, rain, cloud, drop" on a notepad; Teacher Kim smiles at the front.

### L02 Which Trip Shall We Take?

Text type: story: a club talk that compares two places. Genre: Places & Directions. App type: fiction. Place: the school library (club hour).

On Thursday, December 3, in the club hour, Teacher Kim says that the Explorers can visit two places in December: the science museum on Saturday, December 12, and Chef Lucy's cooking class on Saturday, December 19. The children must choose which one comes first. Lily says, "The museum is bigger than the cooking class, and it is cheaper, but the cooking class is not as far." Leo says, "First of all, the museum has all kinds of machines." May says, "I suppose that the museum is more interesting, and the bus is our transport, so we need the first Saturday." Mia asks, "Are we walking from the bus stop?" and Teacher Kim says, "Yes, for ten minutes." The class votes, and the museum comes first.

- hero: The school library with the Explorers around a long table: Teacher Kim, Lily, Mia, Leo, and May. A whiteboard behind them says "Saturday, December 12" and "Saturday, December 19".
- inline-para-2: Two posters on the library wall. The left poster shows a big blue whale and the words "SCIENCE MUSEUM: 30 baht". The right poster shows a steaming pot and the words "COOKING CLASS: 80 baht".
- inline-para-3: The children vote with raised hands; Teacher Kim counts with a finger; Leo raises both hands and grins; Lily writes the result on the whiteboard.

### L03 Lily Calls the Museum

Text type: functional: a recorded phone message and a phone call. Genre: Places & Directions. App type: nonfiction. Place: the kitchen at home.

On Friday, December 4, at four o'clock, Teacher Kim has asked Lily to book the museum visit, so Lily calls from Mom's cell phone at the kitchen table. First a recorded message says, "Hello. This is the science museum. We are open from Tuesday to Sunday, from nine in the morning until five in the afternoon. A child's ticket is thirty baht. For a group, please press one." Then a receptionist answers. Lily asks, "How many children can come in one group?" and then asks about twenty-four children and one teacher on Saturday, December 12. The receptionist says, "A teacher is free. You can pay cash at the desk. You get a group pass, and an assistant will meet you at the entrance at half past ten. Guide Ann gives a talk at eleven o'clock." Lily repeats each number and says, "Thank you very much."

- hero: Lily sits at the kitchen table with Mom's cell phone against her ear, a notepad, and a pencil. Mom stands at the stove in the background and stirs a pot.
- inline-para-2: Lily's notepad: "Sat, December 12", "24 children, 30 baht each", "Teacher: free", "Pay cash", "Meet at the entrance: 10:30 a.m.", "Talk with Guide Ann: 11:00 a.m."
- inline-para-3: The cell phone lies on the table; its screen shows "Science Museum" and a call timer "00:45"; Lily's pencil rests on the notepad next to it.

### L04 The Wrong Size

Text type: story: a shopping talk with a clear place. Genre: Shopping. App type: fiction. Place: the sports store.

On Sunday, December 6, at eleven o'clock, Tom and Ben go to a sports store because Tom's football boots are too small. A shop assistant says, "Can I help you?" Tom says, "Do you have these boots in size forty-three?" The assistant brings the box, and Tom tries them on, but they are too tight. The next size, forty-four, is just right, and they are black leather boots. A sign says "SALE", so the boots cost eight hundred baht, not one thousand. Tom pays at the desk and takes the receipt, and Ben buys a pair of white socks. At the door Ben says, "Boots are expensive, but they are good boots."

- hero: A sports store with shelves of boots and balls. Tom sits on a bench with one black boot on his foot. A shop assistant (a young man of about twenty-five with short black hair, a red polo shirt with a name badge, black trousers, and white sneakers) kneels in front of him with a shoe box. Ben stands behind them with a ball under his arm.
- inline-para-2: A pair of black leather football boots on a shelf with a price tag: "Was 1,000 baht, now 800 baht", a red sign "SALE", and a size label "44".
- inline-para-3: At the counter the assistant hands Tom a receipt; Tom holds a shoe box under his arm; Ben holds a pair of white socks.

### L05 The Wrong Books

Text type: story: a changed timetable and an excuse, with Grace's email. Genre: School. App type: fiction. Place: Lily's desk at home, then the classroom.

On Sunday evening, December 6, Lily reads an email from Grace at her desk. Grace writes, "Dear Lily, I am eleven. I live in a flat with my mom and dad. My week: Monday, math at eight o'clock; Tuesday, violin at four o'clock; Wednesday, art at ten o'clock. What is your timetable like? Best wishes, Grace." Lily packs her bag with the old timetable while Pip sits on the floor next to it. On Monday, December 7, Teacher Kim says, "The timetable has changed because of the museum trip. We are having science today, at ten o'clock, not on Wednesday. You don't have to hurry." Lily says, "I did not look at the new timetable at all. It was lost in my bag, so I have no science book for the test on Wednesday." Mia says, "Don't worry. I will lend you mine."

- hero: Lily's desk at home in the evening. A laptop shows an email headed "Dear Lily," with the line "My week" and three lines of times. A school backpack stands open on the floor beside the desk; Pip sits next to it with his red ball.
- inline-para-2: The new timetable on the classroom wall: a table with the days of the week and subjects; one box says "Mon: Science 10:00 a.m."; Teacher Kim points at it.
- inline-para-3: Mia hands Lily a blue science textbook at a classroom desk; Lily smiles and takes it; the timetable hangs on the wall behind them.

### L06 The Walk from the Bus Stop

Text type: functional: directions on foot with a map. Genre: Places & Directions. App type: nonfiction. Place: the classroom.

On Friday, December 11, Teacher Kim gives each pair of Explorers a map of the walk to the science museum, with a key. She reads the directions slowly: "Get off at the bus stop in front of the bank. Walk straight on, past the police station and the apartment building. At the building site with the sign 'FOR SALE', turn right. The department store is on your left. The museum is behind it, opposite the river park. The walk takes ten minutes." Leo asks, "Is it far?" and Teacher Kim answers, "No, about ten minutes." Leo traces the route with his finger, Mia checks each place on the key, and May says the words of the captions out loud. Lily draws the route in red and writes "ten minutes" at the museum.

- hero: A large map on the classroom whiteboard with drawings of a bus stop, a bank, a police station, an apartment building, a building site with a small sign "FOR SALE", a department store, the museum, and a river park. A red dotted route runs between them. A key box is in one corner. Teacher Kim points at the bus stop; the Explorers sit at their desks with paper copies.
- inline-para-2: The key of the map: "KEY: bus = bus stop, B = bank, P = police station, building = apartment building, tree = river park, M = museum", with a caption under the museum: "The Science Museum".
- inline-para-3: Leo traces the red route with his finger on his paper map; Mia holds a green pencil over the key; May holds up her copy; Lily writes "10 minutes" next to the museum.

### L07 A Whale in the Hall

Text type: functional: a guide's talk with numbers, a blog post. Genre: Science & Space. App type: nonfiction. Place: the science museum.

On Saturday, December 12, Lily writes the blog post "A Whale in the Hall" ("Posted by Lily") about the museum visit. At eleven o'clock Guide Ann stands under a model of a blue whale that hangs in the main hall and says, "This model is twenty-five meters long. A real blue whale can weigh as much as thirty elephants. Its heart weighs about as much as a motorbike, and a baby whale is seven meters long at birth. It has no teeth, and it eats about four tons of tiny fish every day." She says that an international team of scientists measured the whale, which is well known as the biggest animal of all. Afterwards the Explorers use the touch screen with the whale quiz, which asks, "How long is the model?" Leo chooses an answer, and Mia reads, "Great answer!"

- hero: The main hall of a science museum. A huge model of a blue whale hangs from the ceiling. Guide Ann (a woman of about thirty with a long black ponytail, a white blouse, a dark red scarf, black trousers, and brown flat shoes, with a name badge on a cord) stands underneath and points at the whale's head. Teacher Kim, Lily, Mia, Leo, and May stand in a half circle with notebooks. A small sign says "BLUE WHALE: 25 meters".
- inline-para-2: A touch screen on a stand with the title "WHALE QUIZ", the lines "Touch START" and "Choose A, B, or C", and a green message "Great answer!"; Mia presses the screen and Leo reads over her shoulder.
- inline-para-3: A strip of yellow tape on the floor of the hall marked "25 m" at the end; Leo stands at the start, Teacher Kim holds the end, and Lily and May walk beside the tape with notebooks.

### L08 Mia's Water Diagram

Text type: functional: a diagram with labels. Genre: Science & Space. App type: nonfiction. Place: Lily's kitchen table.

On Monday, December 14, Mia posts a diagram called "From River to Sink" ("Posted by Mia") and draws it at Lily's kitchen table after school. Her labels show a river, an electric pump, a water tank, pipes, a tap, a sink, and a bathtub, with arrows between them. Her text says that the pump pushes the water through the pipes and that filtered water is clean for the tap. It also says that used water goes down the drain and that boiled water is safe to drink. Mia says that the technology is simple, and she adds a tip: "Wash up in a bowl, because a bowl saves water." Lily asks, "Where does the water go after the sink?" and Mia points to the arrow at the end. Pip drinks from his bowl under the table.

- hero: Lily's kitchen table. Mia holds up a large sheet with a diagram: a river on the left, a pump with a lightning-bolt sign, a round tank, pipes, a tap over a sink, and a bathtub. Boxes with labels: "river", "electric pump", "water tank", "pipes", "tap", "sink", "bathtub". Lily watches.
- inline-para-2: A close view of the diagram with arrows and the numbers "1", "2", "3", "4" along the arrows, and the caption "Filtered water is clean."
- inline-para-3: Pip drinks from his red bowl on the kitchen floor; behind him on the counter stand a tap, a sink, and a small washing-up bowl.

### L09 Alex's Robot Game

Text type: functional: an email with game instructions and screen feedback. Genre: Technology & Games. App type: nonfiction. Place: the living room.

On Wednesday, December 16, at four o'clock, Tom and Ben read an email from Alex on the laptop in the living room. Alex writes in the first person: "Dear Tom, my robot game is ready. 1. Download the game. 2. Click START. 3. Type the password, which is robot. 4. Use the arrow keys to move the robot to the exit. If the robot touches a wall, you will lose a life." The screen answers, "Great! Level two." or "Try again." Alex adds a paper version for Ben: print the board, put a counter on START, throw a number cube, and go back two squares on a red square. Tom asks, "Can you reach level five?" Pip steps on the keyboard, and the speaker says, "Try again."

- hero: Tom and Ben sit on a sofa with a laptop on a low table. The screen shows a maze with a small gray robot and the words "ROBOT RUN" and "START". Pip sits beside the laptop with the red ball.
- inline-para-2: A close view of the laptop screen: "ROBOT RUN", "Level 2: Great!" with a green check mark, and a box "Password:" with five dots.
- inline-para-3: A printed paper board: a path of squares from "START" to "FINISH" with some red squares, a gray robot counter, and a white number cube; Ben's hand holds a counter.

### L10 The Lion and the Mouse

Text type: story: a traditional tale told by Teacher Kim. Genre: Pets & Animals. App type: fiction. Place: the school library (club hour).

On Thursday, December 17, in the club hour, Teacher Kim tells the traditional tale "The Lion and the Mouse". A big lion catches a tiny mouse and is about to eat it, but the mouse says, "Please let me go. One day I will help you." The lion laughs and gives an order: "Go away, little one!" He lets the mouse go, although he is a little mad that the mouse woke him. Later hunters tie the lion with thick ropes, and the lion roars. The mouse hears him and says, "I am able to help you," and he chews the ropes until the lion is free. The children talk about the story. May asks, "Why did the lion laugh?" Leo says that a small friend can be a good friend, and Teacher Kim says, "Helping a friend is always a pleasant thing."

- hero: The school library. Teacher Kim sits on a low chair at the front with an open picture book that shows a lion. Lily, Mia, Leo, and May sit on a rug in front of her.
- inline-para-2: A storybook picture: a big golden lion lifts one paw above a tiny gray mouse; the mouse stands still and looks up.
- inline-para-3: A storybook picture: the lion lies in a net of thick ropes in a forest clearing; a small mouse sits on a rope and chews it.

### L11 Chef Lucy's Egg Fried Rice

Text type: functional: a recipe and a short talk. Genre: Food & Drink. App type: nonfiction. Place: the cooking class.

On Saturday, December 19, the Explorers walk from the bus stop to the cooking class: along the main street, right at the bookshop, and the third door past the cafe. Chef Lucy gives a short talk with three rules: wash your hands, use a spoon, and ask before you use the stove. The recipe for four is on a card: two cups of cooked rice, three eggs, two cloves of garlic, four mushrooms, one small chilli, two spoons of oil, and salt, with six numbered steps. Mia says, "Would you pass the salt, please?" and Chef Lucy says, "Would you cut the mushrooms, Leo?" Chef Lucy fries the rice, and everybody eats the dish and tastes it. Leo says, "Cooking is easier than homework."

- hero: A cooking class kitchen with a steel counter and a wok. Chef Lucy (a woman of about forty-five with short black hair under a white chef's hat, a white apron over a pale blue shirt, black trousers, and white shoes) stands behind the counter. Lily, Mia, Leo, May, and Teacher Kim, all in white aprons, stand around it. On the counter: eggs, a bowl of rice, garlic, mushrooms, and a small red chilli. A recipe card hangs on the wall: "EGG FRIED RICE (for four)", "2 cups cooked rice, 3 eggs, 2 garlic cloves, 4 mushrooms, 1 small chilli, 2 spoons of oil, salt", "1 Wash your hands. 2 Cut the mushrooms and garlic. 3 Mix the eggs. 4 Heat the oil. 5 Fry the rice. 6 Add the eggs."
- inline-para-2: Mia cuts mushrooms with a small knife on a board while Chef Lucy watches her hands; May beats eggs in a bowl with a fork; Leo holds a spoon.
- inline-para-3: A table with five plates of egg fried rice, each with a thin slice of chilli on top; Leo holds up a spoon and grins; Chef Lucy smiles; the others eat.

### L12 Miss Alice and the Book Boat

Text type: functional: a biography of a person of the past, a blog post. Genre: History. App type: nonfiction. Place: May's desk and the school library.

On Monday, December 21, May writes the blog post "Miss Alice and the Book Boat" ("Posted by May") with facts from a book in the school library. Miss Alice was born in nineteen twelve in a small river village, and her father built boats. Her occupation was teacher: she began at the age of twenty-two, and in nineteen thirty-four she started a book boat, twelve meters long and two meters wide, with two hundred books. She got her boat license in nineteen thirty-six, married a boat builder, wrote a book about the river, and stopped teaching in nineteen sixty-eight; she had two grandchildren. Her boat has been in the museum since two thousand five. Lily reads the post and asks, "How long was her career?"

- hero: May sits at a desk in the school library with an open book and a laptop. The screen shows a blog page headed "MISS ALICE AND THE BOOK BOAT" with the line "Posted by May". Lily stands beside her and reads.
- inline-para-2: An old black-and-white photo of Miss Alice (a woman of about forty with her hair in a bun, a white blouse with a high collar, and a long gray skirt) standing on a long wooden boat with shelves full of books and a small roof. The caption says "Miss Alice, 1912-1990".
- inline-para-3: A timeline strip on a page of May's notebook: "1912 born", "1934 the book boat", "1936 boat license", "1968 stops teaching", "2005 the boat in the museum", and a small drawing of the boat marked "12 m long, 2 m wide".

### L13 Two Emails, Two Places

Text type: functional: two emails on one topic, to compare. Genre: Travel & Holidays. App type: nonfiction. Place: the library computer.

On Tuesday, December 22, Teacher Kim asks Lily, Mia, and Leo to read two emails about the same topic, a weekend place, and to find what is the same and what is different. Ravi writes to Leo: "Dear Leo, on Saturday my family went to the hill park. We had a barbecue under a big tree, and I went riding on a pony for twenty minutes. It is a quiet place." Nadia writes to Mia: "Dear Mia, on Sunday my family went to the beach club. I tried sailing in a small boat, and I watched people go surfing and diving. It is a busy place." Lily says, "Ravi's park is not as busy as Nadia's club." Mia says, "Both places are outdoors, and both have a lot of fun things to do." Leo asks, "Which place is bigger?" and writes two questions to send back.

- hero: Lily, Mia, and Leo sit at a library computer. The screen shows two emails side by side: the left one headed "Dear Leo," and "My weekend at the hill park", the right one headed "Dear Mia," and "My weekend at the beach club".
- inline-para-2: Leo's drawing in a notebook: a green hill with a big tree, a barbecue grill with smoke, and a small brown pony.
- inline-para-3: Mia's drawing in a notebook: a sandy beach with a sailboat, a surfboard, and a diving mask; Lily's page next to it has two columns headed "Ravi's park" and "Nadia's club" with short lists.

### L14 A Card for Palm Lake

Text type: story: a class card and plans for the new year. Genre: School. App type: fiction. Place: the classroom and Lily's home.

On Wednesday, December 23, in the afternoon, Teacher Kim begins, "Good afternoon, class," and reads an email from Ms. Ong on the screen: "Dear Teacher Kim and class, congratulations on one thousand visitors to your blog! Thank you for the November book. What are you doing in January? Best wishes, Ms. Ong." Mia comes in late and says, "I am sorry I am late. My kitten Snow hid my shoe." Teacher Kim says, "Thank you for telling me. Please sit down." The class celebrates with a dessert of mango and sticky rice, takes a class selfie on Teacher Kim's phone, and makes a green card with gold and silver stars. Teacher Kim says, "In January we are going on a trip, and the place is a surprise." Lily takes the card home to finish it, and Pip puts one blue paw print in the corner.

- hero: A classroom with a green card, as big as a poster, on the teacher's desk. The card says "THANK YOU, FRIENDS!" with gold and silver paper stars. Teacher Kim, Lily, Mia, Leo, and May stand around it; a laptop on the desk shows an email headed "Dear Teacher Kim and class,".
- inline-para-2: Teacher Kim holds her phone out at arm's length; the whole class squeezes into the picture and smiles; a bowl of mango and sticky rice stands on a desk.
- inline-para-3: Lily's kitchen table at home: the green card lies on the table with one blue paw print in the corner; Pip sits beside the table and lifts one paw with a little blue paint on it; Lily smiles.

## 5. Objectives

### 5.1 Book rule: the 20 objectives of `books["adventure-8.2"]`

| Objective | Target in | Text |
|---|---|---|
| R35.1 | L06, L08 | Can use key words or captions to find information in a simple text. |
| R35.2 | L01, L05, L10 | Can identify specific information in a simple story, if guided by questions. |
| R35.3 | L07, L08, L13 | Can understand the main ideas in simple informational texts, if supported by pictures. |
| R35.4 | L05, L12 | Can understand information about someone’s personal details in a simple paragraph or short text. |
| R35.5 | L01, L10, L14 | Can follow simple stories with basic dialogue and simple narrative. |
| R35.6 | L04, L12 | Can identify the context of a short, simple text related to familiar situations. |
| R36.1 | L10, L14 | Can understand the main themes of a simplified story. |
| R36.2 | L09, L11 | Can follow a simple series of written instructions to carry out a task. |
| R36.3 | L07, L09 | Can follow instructions and feedback in a computer game. |
| L34.3 | L02, L04 | Can recognise the use of simple linking words e.g. ‘and’, ‘so’, or ‘but’ to connect ideas in a short phrase or sentence. |
| L34.4 | L01, L14 | Can understand excuses if expressed in simple language. |
| L34.5 | L06, L11 | Can understand simple directions for how to get somewhere on foot, if spoken slowly and clearly and using a map. |
| L34.6 | L01, L05 | Can identify key information in short conversations on school-related topics e.g. ‘subjects’, ‘timetables’, ‘homework.’ |
| L35.1 | L02, L05, L11 | Can understand the main information in short, simple dialogues about familiar activities, if spoken slowly and clearly. |
| L35.2 | L02, L14 | Can identify key information about future plans in short, simple dialogues. |
| L35.3 | L02, L13 | Can understand simple comparisons between two places, if spoken slowly and clearly. |
| L35.4 | L04, L13 | Can identify the context in which an everyday conversation is taking place. |
| L35.5 | L07, L12 | Can identify numbers relating to height, weight, length etc. in simple descriptions of objects, animals or buildings, if guided by questions. |
| L35.6 | L03, L04, L12 | Can identify key information such as prices, times and dates in a short description, if supported by prompts or questions. |
| L36.1 | L07, L11 | Can identify the main points in short talks on familiar topics, if delivered slowly and clearly. |

Result (script check, 2026-10-06): 20 of 20 objectives are a target in 1 or more lessons. None is missing. Every lesson has exactly 12 glossed words and exactly 5 new A2 Key words from the free pool (script check, section 7).

### 5.2 Other targets

Six targets of this book are not on its first-teaching list. L33.4 (L03, key information in a recorded message; 0 earlier practice), R31.3 (L09, a paper board game in the email; 0 earlier practice), R33.6 (L06, a map with a key; 1 earlier practice), and R33.2 (L08, key information from headings and pictures; 1 earlier practice) come from the band objectives with the lowest practice counts. L38.4 (L03, a recorded phone message) and L38.5 (L03, a phone call) are objectives of level 8 (GSE 38) that Adventure 9.1 teaches first; bank-8 gives each only 2 targets, so the level rule needs a workbook target (section 5.3). The supporting objectives in section 3 give the other objectives practice. Writers may add A1 objectives (for example L26.4, R27.1, R27.4) as supporting objectives where the text practices them.

### 5.3 Level rule: the 67 in-scope objectives of level 8

Level 8 has 150 packages: the 42 lessons of Adventure 8.1, 8.2, and 8.3 and the 108 articles of bank-8. The bank column counts targets in `level-plans/bank-8.json` (2026-10-06). The three book columns count the targets of the draft maps. The table is the same in the maps of 8.1 and 8.2.

| Objective | Adventure 8.1 | Adventure 8.2 | Adventure 8.3 | bank-8 | Total | Flag |
|---|---|---|---|---|---|---|
| R34.1 | 3 | 0 | 0 | 3 | 6 |  |
| R34.2 | 3 | 0 | 0 | 2 | 5 |  |
| R34.3 | 2 | 0 | 0 | 4 | 6 |  |
| R34.4 | 3 | 0 | 0 | 5 | 8 |  |
| R34.5 | 2 | 0 | 0 | 2 | 4 |  |
| R34.6 | 2 | 0 | 0 | 2 | 4 |  |
| R34.7 | 2 | 0 | 0 | 2 | 4 |  |
| R34.8 | 3 | 0 | 0 | 4 | 7 |  |
| R34.9 | 2 | 0 | 0 | 2 | 4 |  |
| R34.10 | 2 | 0 | 0 | 2 | 4 |  |
| R35.1 | 0 | 2 | 0 | 4 | 6 |  |
| R35.2 | 0 | 3 | 0 | 3 | 6 |  |
| R35.3 | 0 | 3 | 0 | 2 | 5 |  |
| R35.4 | 0 | 2 | 0 | 2 | 4 |  |
| R35.5 | 0 | 3 | 0 | 3 | 6 |  |
| R35.6 | 0 | 2 | 0 | 5 | 7 |  |
| R36.1 | 0 | 2 | 0 | 4 | 6 |  |
| R36.2 | 0 | 2 | 0 | 6 | 8 |  |
| R36.3 | 0 | 2 | 0 | 2 | 4 |  |
| R37.1 | 0 | 0 | 1* | 4 | 5 | 8.3 plans 1 |
| R37.2 | 0 | 0 | 1* | 4 | 5 | 8.3 plans 1 |
| R37.3 | 0 | 0 | 1* | 2 | 3 | 8.3 plans 1 |
| R37.4 | 0 | 0 | 1* | 2 | 3 | 8.3 plans 1 |
| R37.5 | 0 | 0 | 1* | 5 | 6 | 8.3 plans 1 |
| R37.6 | 0 | 0 | 1* | 4 | 5 | 8.3 plans 1 |
| R37.7 | 0 | 0 | 1* | 3 | 4 | 8.3 plans 1 |
| R37.9 | 0 | 0 | 1* | 6 | 7 | 8.3 plans 1 |
| R37.10 | 0 | 0 | 1* | 2 | 3 | 8.3 plans 1 |
| R38.1 | 0 | 0 | 1* | 2 | 3 | 8.3 plans 1 |
| R38.2 | 0 | 0 | 1* | 2 | 3 | 8.3 plans 1 |
| R38.3 | 0 | 0 | 0 | 6 | 6 |  |
| R38.4 | 1 | 0 | 0 | 2 | 3 |  |
| R38.5 | 1 | 0 | 0 | 2 | 3 |  |
| R38.6 | 0 | 0 | 0 | 3 | 3 |  |
| R38.7 | 0 | 0 | 0 | 3 | 3 |  |
| R38.8 | 0 | 0 | 0 | 8 | 8 |  |
| R38.9 | 0 | 0 | 0 | 8 | 8 |  |
| R38.10 | 0 | 0 | 0 | 3 | 3 |  |
| R38.11 | 0 | 0 | 0 | 3 | 3 |  |
| R38.12 | 0 | 0 | 0 | 6 | 6 |  |
| L34.1 | 2 | 0 | 0 | 2 | 4 |  |
| L34.2 | 2 | 0 | 0 | 2 | 4 |  |
| L34.3 | 0 | 2 | 0 | 3 | 5 |  |
| L34.4 | 0 | 2 | 0 | 2 | 4 |  |
| L34.5 | 0 | 2 | 0 | 4 | 6 |  |
| L34.6 | 0 | 2 | 0 | 4 | 6 |  |
| L35.1 | 0 | 3 | 0 | 3 | 6 |  |
| L35.2 | 0 | 2 | 0 | 5 | 7 |  |
| L35.3 | 0 | 2 | 0 | 2 | 4 |  |
| L35.4 | 0 | 2 | 0 | 4 | 6 |  |
| L35.5 | 0 | 2 | 0 | 4 | 6 |  |
| L35.6 | 0 | 3 | 0 | 4 | 7 |  |
| L36.1 | 0 | 2 | 0 | 2 | 4 |  |
| L36.2 | 0 | 0 | 1* | 3 | 4 | 8.3 plans 1 |
| L36.3 | 0 | 0 | 1* | 3 | 4 | 8.3 plans 1 |
| L36.4 | 0 | 0 | 1* | 2 | 3 | 8.3 plans 1 |
| L36.5 | 0 | 0 | 1* | 4 | 5 | 8.3 plans 1 |
| L36.6 | 0 | 0 | 1* | 4 | 5 | 8.3 plans 1 |
| L37.1 | 0 | 0 | 1* | 5 | 6 | 8.3 plans 1 |
| L37.2 | 0 | 0 | 1* | 6 | 7 | 8.3 plans 1 |
| L37.3 | 0 | 0 | 1* | 4 | 5 | 8.3 plans 1 |
| L37.4 | 0 | 0 | 1* | 2 | 3 | 8.3 plans 1 |
| L38.1 | 0 | 0 | 0 | 4 | 4 |  |
| L38.2 | 0 | 0 | 0 | 4 | 4 |  |
| L38.3 | 0 | 0 | 0 | 4 | 4 |  |
| L38.4 | 0 | 1 | 0 | 2 | 3 |  |
| L38.5 | 0 | 1 | 0 | 2 | 3 |  |

Result: 67 of 67 objectives have 3 or more. None is under 3. The Adventure 8.3 column marks with * the one target that Adventure 8.3 takes for each of the 20 objectives that it teaches first (its map is written at the same time; the check runs again when that map exists). 20 objectives reach 3 only with that target (R37.1, R37.2, R37.3, R37.4, R37.5, R37.6, R37.7, R37.9, R37.10, R38.1, R38.2, L36.2, L36.3, L36.4, L36.5, L36.6, L37.1, L37.2, L37.3, L37.4).

Four objectives of level 8 are not in the first-teaching list of any level 8 book: R38.4 (2 in bank-8), R38.5 (2 in bank-8), L38.4 (2 in bank-8), L38.5 (2 in bank-8). Adventure 9.1 teaches them first (GSE 38), but the level rule counts level 8 packages, and bank-8 gives each of them only 2 targets. Adventure 8.1 takes R38.4 and R38.5 (L05, L09), and Adventure 8.2 takes L38.4 and L38.5 (L03). Each reaches 3.

## 6. Grammar

One main grammar point for each lesson. The table follows the A2 Key items of level 8 (`data/grammar-levels-5-9.md` §5). The writer uses the main point in the key sentences of the text and in two or three questions. "Also" points are secondary. The linking words *and, so, but, because* appear in every lesson of this book as the connecting words of the text; lessons that name them as a target use them often in short sentences.

| Grammar point (level 8) | Main in | Also in |
|---|---|---|
| How much / How many / How long / How often ...? | L03, L07 | L06, L09, L11 |
| whose | - | L04 |
| prepositions of direction and instrument | L06 | L08 |
| needn't / don't have to | - | L05 |
| first conditional | L09 | - |
| present continuous for the future and arrangements | L05, L14 | L02 |
| present perfect with for / since | L12 | - |
| a few / a little / many / much / a lot of | - | L07 |
| would for polite requests | L01, L11 | L03, L14 |
| that clauses | - | L10 |
| gerunds (as subject and object, enjoy / good at + -ing) | L10 | - |
| too (degree) | L04 | L01, L13 |
| (not) as ... as (GSE only) | L02, L13 | - |
| participles as adjectives | L08 | L12 |

Avoid at level 8: *used to*, the passive, reported speech, the past perfect, the second conditional, the present perfect continuous, and *will be able to*. *If* starts only a first conditional (*If it rains, we will stay in the cafe.*) or a zero conditional. *(Not) as ... as* is GSE only: use it in short examples. The word *dice* is not on a word list: use *number cube* (L09 of 8.2).

## 7. Words

Each lesson glosses 12 words: 5 new A2 Key words of the free pool (`a8-pool-A`: 222 words that no package or draft glosses; the Adventure 8.3 map has a separate list), and 7 words that earlier packages glossed (the words of Adventure 7 first, then other earlier lessons). The words of a lesson fit its text. American spelling. No word is glossed twice in the two books. No lesson has a B1 word.

| # | New A2 Key words (free pool) | Flyers words glossed before | A2 Key words glossed before |
|---|---|---|---|
| L01 | textbook, vocabulary, blackboard, shame, by the way | forget, already, yet, important, secret, perhaps, bored | - |
| L02 | transport, first of all, all kinds of, suppose, walking | museum, interesting, expensive, cheap, adventure, future, quite | - |
| L03 | receptionist, cell phone, cash, assistant, pass | speak, repeat, money, thank, you're welcome | message, price |
| L04 | boot, try on, leather, receipt, store | sell, spend, save, trainers | pay, sale, customer |
| L05 | test, lost, lend, worry, at all | timetable, subject, science, language | sheet, copy, check |
| L06 | police, department, apartment building, for sale, site | bank, restaurant, post office, hotel | directions, traffic light, across |
| L07 | heart, tooth, scientist, well known, international | million, thousand, heavy, high, planet | almost, exactly |
| L08 | sink, bathtub, electric, technology, wash up | environment, air, plastic, engineer, push | experiment, equipment |
| L09 | download, click, password, software, speaker | screen, rocket, space, invent | instructions, online, laptop |
| L10 | mad, pleasant, order, tie, able | king, strange, hole, frightening, wonderful | amazed, among |
| L11 | garlic, chilli, dish, cooking, mushroom | salt, pepper, spoon, prepare | ingredient, slice, tasty |
| L12 | career, occupation, writer, license, grandchild | century, journey, college, married, husband | coast, aged |
| L13 | barbecue, diving, sailing, surfing, riding | summer, festival, camp, actually | nature, area, fresh |
| L14 | celebrate, congratulations!, selfie, dessert, good afternoon | surprise, invitation, lovely, pleased, hope, gold, silver | - |

Counts (script check, 2026-10-06): 14 lessons x 12 = 168 glossed words, 168 different in this book, 336 different in the two books together (0 duplicates). New A2 Key words: 70 (5 in every lesson), all in the free pool, none glossed by any file of `content/primary/*/src`. Words glossed before: 98 (Flyers 70, A2 Key 28, at most 3 in a lesson); 59 of them were glossed in Adventure 7, the others in earlier books or banks. No Movers word and no B1 word.

Word notes for writers:
- **New A2 Key words.** Each is new. Give it a glossary entry with the sense of the text and a simple example. Phrases (*first of all, by the way, try on, give somebody a call, oh dear!*) get one entry. The brief shows where most of the words fit; the writer places the others in the text.
- **Spelling.** The pool lists British headwords. Write the American form: *sports center* (pool: *sports centre*), *license* (*licence*), *harbor*. The pool words *colour*, *favourite*, and *cafe* are left out on purpose: *color*, *favorite*, and *café* are glossed in earlier packages already (levels 1–5), so they are not new.
- **Swap rule.** A writer can swap at most 2 words of a lesson for words of the same topic that no other lesson of the two books uses. A2 Key swaps come from the free pool (`a8-pool-A.md`). Tell the lead which, so that the counts stay true.
- **Months, times, and numbers.** Months, weekdays, *a.m.*, *p.m.*, *baht*, and figures in times, prices, and dates are allowed in Adventure (bible §5) but the converter refuses digits in the text, so the text writes them as words. Put the weekday and month names in `allow` if the check marks them.
- **Names.** *Thailand*, *Explorers*, and the names of the cast go in `names` or `allow`.

## 8. Questions and tasks

- MCQ (4 printed of 10): at least 2 test a target objective (L01: "Why does Leo have no homework?"; L02: "Which place is cheaper, the museum or the cooking class?"; L03: "How much is a child's ticket?"; L06: "What is opposite the museum?"; L07: "How long is the whale model?"; L11: "What do you do after you heat the oil?").
- Short answer (1): a personal question in the lesson frame (L01: "What is your favorite subject? Why?"; L02: "Which place would you choose for a trip? Why?"; L10: "What does the story teach you?"; L14: "What are you going to do in January?").
- Writing: a personal version of the text type (L03: "Write the questions you ask when you call a place." L06: "Write directions from your school to a shop." L08: "Draw a diagram with labels of something you know." L11: "Write a recipe with a list and numbered steps." L12: "Write about a person of the past: dates and facts." L13: "Write two sentences that compare two places.").
- Listening objectives (L-ids) are tested through the audio of the text: the question uses the words that the voice says. L03 needs two voices (the recording and the receptionist) and L38.4 needs the recorded message alone with no picture help. L35.5 and L35.6 (L03, L04, L07, L12) test numbers, so the audio says each number clearly and the question uses a different form of the number.

## 9. Questions for Daniel

1. **Calendar and trips.** The book runs from Tuesday, December 1 to Wednesday, December 23 and has two club trips (museum, cooking class), in a month in which the bible plans one trip. Adventure 8.1 covers November and Adventure 8.3 should start in January. Option A: two trips in each book, as in Adventure 7.2. Option B: one trip in each book and one place only.
2. **Public days.** No lesson falls on Saturday, December 5 or Thursday, December 10, and no text names a holiday or Christmas. Option A: keep holidays out of the books. Option B: add one secular school day to a book.
3. **New facts.** A science museum with a blue whale model and a whale quiz (L03, L07); a sports store (L04); Chef Lucy's cooking class (L11); Miss Alice, an invented teacher of a book boat, born in 1912 (L12). Do you accept them? Option A: accept. Option B: drop the fact and the writer takes a swap.
4. **The biography.** L12 gives Miss Alice dates from 1912 to 1990, a boat license, a husband, and two grandchildren. Option A: keep. Option B: write a shorter life with no end date, so that the text stays simple.
5. **Traditional tale.** *The Lion and the Mouse* is a fable that Teacher Kim tells in the club hour (L10). Option A: keep it. Option B: use a Thai animal tale that you choose.
6. **Pen pals in pictures.** This map shows each pen pal only as email text on a laptop screen. Option A: keep this. Option B: wait for the sheets and draw the children.
7. **Figures.** The lesson text writes every number, time, date, and price as a word, because the converter refuses digits. Pictures, signs, maps, and recipe cards show figures. Option A: keep this. Option B: allow figures in a recipe, a timetable, or a game screen (a change to the converter).
8. **The word *dice*.** L09 needs a game with a throw. Option A: write *number cube*, as this map does. Option B: write *dice* and put it in `allow`.
9. **Level 8 objectives that Adventure 9.1 teaches first.** L38.4 and L38.5 (L03) are GSE 38 objectives. bank-8 gives each only 2 targets. Option A: L03 gives them one target each (section 5.3). Option B: bank-8 gets one more article for each, and the book does not target them.
10. **Guide Ann and the receptionist by phone (L03).** Option A: no picture shows them; the call is a voice (this map). Option B: draw Guide Ann at her desk, with the look line of the bible.

**Lead decisions for the writers (2026-10-06).** Daniel reviews the finished lessons, so these choices are provisional. Every question: option A. A pen pal appears in a picture only as email text on a screen, with no drawn person, until Daniel chooses the pen-pal sheets.

**Lead decisions for the writers (2026-10-06).** Daniel reviews the finished lessons, so these choices are provisional. Every question: option A.

## Revision history

- 0.1 — 2026-10-06 — First version (track levels_5_9_20261006).
- 0.2 — 2026-10-06 — Lead decisions for the writers in §9 (Daniel can change them in his review).
