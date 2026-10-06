# Primary Advantage Adventure 7.1 — Lesson Map

Version 0.3 | Date 2026-10-06 | Status: Draft | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

Track: `levels_5_9_20261006`. Companion files: [`primary-quest-6.1-plan.md`](primary-quest-6.1-plan.md) (the model for this map), [`primary-levels-5-9-plan.md`](primary-levels-5-9-plan.md) (§3 band rule, §5 profiles, §6 vocabulary, §7 grammar, §8 cast), [`primary-quest-adventure-series-bible.md`](primary-quest-adventure-series-bible.md) (§2, §4–§7), [`level-plans/levels-5-9-objectives.json`](level-plans/levels-5-9-objectives.json), [`level-plans/bank-7.md`](level-plans/bank-7.md), [`data/grammar-levels-5-9.md`](data/grammar-levels-5-9.md), [`calibration/levels-5-9/l7-story.md`](calibration/levels-5-9/l7-story.md), [`calibration/levels-5-9/l7-info.md`](calibration/levels-5-9/l7-info.md), [`reviews/2026-10-06-prereview-level-5.md`](reviews/2026-10-06-prereview-level-5.md), [`reviews/2026-10-06-prereview-bank-6.md`](reviews/2026-10-06-prereview-bank-6.md), [`../../content/primary/AUTHORING.md`](../../content/primary/AUTHORING.md). The sister map is [`primary-adventure-7.2-plan.md`](primary-adventure-7.2-plan.md).

## 1. Summary

Adventure 7.1 is a book of level 7 (A2-, `cefr_level = 'A2'`, `ra_level = 7`). It has 14 workbook lessons. Each lesson has 12 glossed words, 2–4 target objectives, and one main grammar point of level 7. QR key: `a7.1/<lesson>`.

Text mix: 7 stories and 7 informational or functional texts. The stories are in L02, L04, L06, L08, L10, L12, L14; the other lessons are informational or functional. The book has a traditional story in L06 (*The Mouse Deer and the Crocodiles*, a traditional tale of Southeast Asia, told in Ravi's email). Dates run from Monday, June 1 to Friday, July 31, written in one form, month first (*June 4*). Every weekday agrees with the 2026 calendar.

Rule checks (run on this map with a script, 2026-10-06):

- **Book rule:** 20 of 20 objectives of `books["adventure-7.1"].objectives` are a target in 1 or more lessons (section 5.1). 18 of them are a target in 2 or more lessons; 2 in one lesson only (R31.3, R31.6). No objective of the `outOfScope` list is a target.
- **Targets per lesson:** every lesson has 2–4 targets (4 lessons have 4, 10 have 3, 0 have 2). The map has 46 target slots and 20 different target objectives: the 20 book objectives and 0 other objectives (section 5.2).
- **Level rule:** each of the 46 in-scope objectives of level 7 is a target in 3 or more packages (Adventure 7.1, Adventure 7.2, and bank-7). The result is in section 5.3 and is the same in both maps.
- **Words:** every lesson has exactly 12 glossed words (168 in the book), no word twice in the book or in the sister book. A2 Key 28 (1–2 in each lesson, none in two lessons), Flyers 86 (9 of them new words of the free pool), Movers 54 (section 7).
- **Questions and dialogue:** 12 of 14 lessons plan a real question (the brief shows it in quotation marks or as a reader question). All 7 stories have dialogue; the functional lessons add speech or reader questions.

**Cast (series bible §2–§4):** Adventure 7.1 and 7.2 are the first term of Lily's last year of primary school (P6). Tom and Ben are 13 (M2). Sam is 12 (M1). May is 12. Lily, Mia, and Leo are 11 in Teacher Kim's class. Pat is 9. Nobody has a birthday in this book, so no age changes. The facts of levels 5 and 6 stay: no age is given for Grandma or Grandpa; Aunt Sue is a nurse who lives in a city in the north; Mia's mom is a doctor and her kitten is Snow; May and Pat live with their parents, their grandma, and the parrot Bill; Green Hill is the grandparents' village; Hugo is a boy in Tom's class; Mom's and Dad's jobs are not in the text. The club is the Explorers (Teacher Kim runs it; it meets on Thursday after lunch in the school library). Trips of this book: the town library (L03) and the nature park (L07); no place comes twice in a row. Pen pals (Grace, Ravi, Alex, Nadia, with Ms. Ong in the background) are in 4 lessons (L05, L06, L09, L13) and never in more than 4 lessons in a row. Pip is in 5 lessons (L02, L08, L09, L10, L14); he does not go on a trip and does not meet a pen pal. New adults: Ranger Mark (L07) and Nurse Jill (L11); Hugo (L09). The only proper place names are *Thailand* and *Singapore* (the second only in text, never in a picture line).

## 2. Text profile (`adventure-7`)

| Measure | Target |
|---|---|
| Words | 300–380, in 4–5 paragraphs |
| Mean sentence length | 7.5–9.0 words; longest sentence 16 words or less |
| Running words on Starters, Movers, or Flyers (names, glossed, allowed words not counted) | 95% or more |
| Glossed words | exactly 12 (the converter's `glossedCount`): 10 or more Flyers or Movers words, at most 2 A2 Key words (this map: 10 Flyers or Movers and 2 A2 Key in every lesson) |
| New words | the converter will WARN "new words" because recycled words are not new; that WARN is expected at level 7 |
| Question marks | 2 or more (book rule: 10 of 14 lessons; this map plans a question in 12 of 14) |

| Dialogue | 6 or more lessons. This map has dialogue in all 7 stories |

The Movers grammar and the first Flyers items were taught in levels 5 and 6. Level 7 uses the Flyers list: the present perfect with *ever, never, just, already, yet*; the past continuous with *when*; the zero conditional; *before / after* and *where* clauses; tag questions; *look / sound / feel like* and *make + adjective*; *be made of*; *What time ...?*, *What else?*, *See you soon*. Each lesson has one main point (section 6). The first conditional, *for / since*, *used to*, the passive, and reported speech do not appear. Voice follows bible §7: a close third person in the past simple for stories; a named writer for a blog post, a diary entry, or an email (*Posted by Mia*, *Dear Lily, ... Best wishes, Grace*); headings and no "I" in an informational text of the club or the school.

## 3. Lesson map

Targets are A2 key ids (`a2-objective-key.json`, GSE 30–33). "Supporting" lists the objectives that the text will clearly practice. Writers add other objectives of level 7 or below where the text practices them. Words are in section 7.

| # | Title | Text type | Genre | App | Cast and place | Targets | Supporting | Main grammar |
|---|---|---|---|---|---|---|---|---|
| L01 | Join the Explorers! | functional: an event poster for the first club meeting | School | nonfiction | Leo, Lily, Mia, May, Teacher Kim; the school library | R30.8, R31.1, R30.4 | R31.2, L31.1, L31.3, R30.2 | What time ...? (also: See you soon) |
| L02 | The Paw Print on the Flag | story: a picture story with a main idea | Pets & Animals | fiction | Lily, Leo, Mia, Tom, Pip; Lily's garden | R30.3, L31.1, L31.2 | R31.2, R30.4, R31.5, L30.1 | past continuous with when (also: look like) |
| L03 | Signs in the Town Library | functional: signs and notices in a public building | Places & Directions | nonfiction | Lily, Mia, Leo, May, Teacher Kim, a librarian; the town library | R30.2, R31.1, R31.5 | R30.4, R30.1, L31.2, R27.1 | zero conditional (also: before / after) |
| L04 | Whose Backpack Is It? | story: finding a person from a description | Family & Friends | fiction | Lily, Mia, Coach Matt, a boy; the school field after sports | R30.5, L30.1, L31.3 | R30.1, L31.1, R31.2, L27.6 | where clauses (also: tag questions) |
| L05 | Grace's Flat | functional: an email that describes a flat | Home | nonfiction | Grace (by email), Lily; the laptop at home | R30.6, L30.3, R31.5, L31.2 | R30.4, R31.1, R30.1, L31.3 | look / sound / feel like (also: make + adjective) |
| L06 | The Mouse Deer and the Crocodiles | story: a traditional tale in an email | Pets & Animals | fiction | Ravi (by email), Leo, Lily, Mia; the school library | R31.6, R30.3, R31.2 | R30.4, L31.1, L31.3, R30.1 | past continuous with when (also: before / after) |
| L07 | A Day with Ranger Mark | functional: a typical day, a blog post | Jobs & Work | nonfiction | Mia (writer), Ranger Mark, Teacher Kim, Lily, Leo, May; the nature park | R31.4, L31.4, R30.4 | R31.1, L31.3, L31.2, R27.4 | before / after clauses (also: What time ...?) |
| L08 | Teacher Kim Reads My Post | story: feedback from a teacher and a classmate | School | fiction | Lily, Teacher Kim, Mia, Leo, Pip; the school library and Lily's home | R30.7, R31.2, R30.1 | L31.1, R30.4, L31.2, R27.7 | present perfect with just, already, yet |
| L09 | Race to the Flag | functional: board-game rules sent by email | Technology & Games | nonfiction | Alex (by email), Tom, Ben, Hugo, Pip; Tom's living room | R31.3, R30.4, L31.3 | R31.1, R30.2, R31.2, R27.1 | zero conditional (also: be made of) |
| L10 | Where Is Everyone? | story: who is where, and what they do | Family & Friends | fiction | Lily, Mom, Dad, Tom, Pip; the house and the garden | L30.1, R30.1, R30.6, L30.3 | L31.1, R31.2, R31.1, R27.7 | tag questions (also: where clauses) |
| L11 | Jobs at Our School | functional: a fact page about jobs, a blog post | Jobs & Work | nonfiction | Lily and May (writers), Nurse Jill; the school | L31.4, R31.4, L31.3 | R31.1, R30.4, L31.2, R27.4 | What time ...? (also: What else?) |
| L12 | The Extra Mango | story: an honest choice at the market | Food & Drink | fiction | Mia, Leo, May, a fruit seller; the market | R30.1, R30.4, R30.5, L31.2 | L30.1, R31.2, L31.3, R27.6 | present perfect with ever, never (also: before / after) |
| L13 | Nadia's Otters | functional: a fact file in an email, with headings | Nature & Outdoors | nonfiction | Nadia (by email), Mia; Mia's desk | R31.1, L31.2, R30.4 | R31.5, R30.1, L31.3, R27.3 | look / sound / feel like (also: What else?) |
| L14 | The Lights Go Out | story: an open evening with a power cut | School | fiction | Lily, Mia, Leo, May, Teacher Kim, Pat, parents, Pip; the school hall and home | R30.8, R30.7, R30.2, L31.1 | R31.5, R31.2, R30.1, L31.3 | past continuous with when (also: present perfect with just) |

Notes:
- Pen pals: L05, L06, L09, L13. Their texts are emails; the pictures show the laptop screen with the email text in double quotation marks, never the pen pal (their sheets are in progress).
- Pip: L02, L08, L09, L10, L14. Pip is never the narrator and does not read an email.
- L03 and L07 are the club trips of June and July. L12 is a market visit of three children, not a club trip. The open evening (L14) is the review lesson: it uses the poster and program, feedback, and a conversation.
- L06 is the traditional tale of the book. The tale is told inside Ravi's email, so the writer is clear.
- Signs, posters, and a program (L01, L03, L09, L14) show their words in double quotation marks, exactly as in the text. Section 4 gives them.
- Months *June* and *July* are free Flyers words (L01, L14). If the converter marks them as allowed words, the writer says so and takes a swap from section 7.

## 4. Lesson briefs and pictures

Each brief gives who, where, what happens, and how it ends. Each lesson has a hero picture and two inline pictures. Sign, poster, notice, map, blog, and email text is in double quotation marks, as in AUTHORING §6. Cast looks are not described when a cast sheet exists. A person outside the cast gets a full look at first mention. No child is in distress, on a bed, or with a hand on the face. No picture line names Singapore or the pen-pal school.

### L01 Join the Explorers!

Text type: functional: an event poster for the first club meeting. Genre: School. App type: nonfiction. Place: the school library.

On Monday, June 1, Teacher Kim tells Lily's class about a new school club, the Explorers. Leo draws the poster and Lily writes the words. The poster says "JOIN THE EXPLORERS!" and gives the first meeting: Thursday, June 4, at 1:00 p.m. in the school library. Below it a list shows what members do: a trip on one Saturday each month, a blog, and letters to a class in another country. Mia asks, "Can I bring my camera?" and Teacher Kim says, "Yes, a camera is a good idea." By Wednesday, twenty-four children have written their names on the list at the library door.

- hero: A big poster on the library door with the heading "JOIN THE EXPLORERS!" and the lines "First meeting: Thursday, June 4", "1:00 p.m., School Library", "Bring a pencil and a notebook", "A trip one Saturday each month", "Read our blog". Small drawings of a compass and a boot. Leo and Lily stand beside it with a roll of tape.
- inline-para-2: Leo draws a compass on the poster with a thick marker; Lily writes the words with a pencil beside him; Mia watches.
- inline-para-3: Children stand in a line at the library door; a girl writes her name on a long list on the wall; Mia holds her camera; Teacher Kim smiles.

### L02 The Paw Print on the Flag

Text type: story: a picture story with a main idea. Genre: Pets & Animals. App type: fiction. Place: Lily's garden.

On Saturday, June 6, at ten o'clock, Leo paints a flag for the club on a big green cloth in Lily's garden. He has a pot of white paint and a brush, and he wants to paint a white leaf in the middle. Leo leaves the cloth on the grass to dry and goes to get a drink. Pip was running after his red ball when he stepped in the white paint and then ran across the flag. Leo says, "Oh no! Who did this?" Lily says, "It looks like a paw print. Look, it is a good sign for the club!" Mia and Leo agree, and Tom ties the flag to a long stick. Pip sits on the grass and watches it.

- hero: A big green cloth lies on the grass in a garden. Leo kneels at one corner with a brush and a pot of white paint; Lily and Mia watch. The red ball lies near the cloth. Nobody walks on the cloth yet.
- inline-para-2: Pip, with white front paws, runs across the green cloth and leaves a line of white paw prints; Leo holds up both hands in surprise; Lily and Mia laugh.
- inline-para-3: Tom holds a long stick with the green flag; a single white paw print is in the middle; Lily, Mia, and Leo cheer; Pip sits on the grass with the red ball.

### L03 Signs in the Town Library

Text type: functional: signs and notices in a public building. Genre: Places & Directions. App type: nonfiction. Place: the town library.

On Saturday, June 13, the Explorers visit the town library with Teacher Kim. Each pair gets a card: "Find five signs and write what they say." May reads the signs out loud: "QUIET, PLEASE", "NO FOOD OR DRINK", "TURN OFF YOUR PHONE", and "RETURN BOOKS HERE". A notice at the entrance says "OPEN: Tuesday to Sunday, 9:00 a.m. to 6:00 p.m. CLOSED ON MONDAY." Leo reads "NO FOOD OR DRINK" and puts his banana in his bag. Mia asks a librarian, "Where are the animal books?" The librarian says, "On Floor 2, next to the window. If you want to borrow a book, ask at the desk." Lily writes all five signs for the blog.

- hero: The entrance of a library with two signs: "OPEN: Tuesday to Sunday, 9:00 a.m. to 6:00 p.m." and "CLOSED ON MONDAY". Teacher Kim, Lily, Mia, Leo, and May stand in front with notebooks.
- inline-para-2: Inside the library, three signs on a wall: "QUIET, PLEASE", "NO FOOD OR DRINK", "TURN OFF YOUR PHONE". Leo puts a banana into his bag and looks at the sign; Lily writes in her notebook.
- inline-para-3: A sign with an arrow up: "CHILDREN'S CORNER, Floor 2". Low shelves with comics and magazines; Mia and May read; a librarian (a woman with glasses and a gray cardigan) points to the window.

### L04 Whose Backpack Is It?

Text type: story: finding a person from a description. Genre: Family & Friends. App type: fiction. Place: the school field after sports.

On Friday, June 19, after sports at two o'clock, Lily and Mia find a green backpack on a bench at the edge of the school field. Nobody is near it. Coach Matt says, "A boy sat there before sports. He is thin and tall, he has curly hair, and he wears a blue team shirt with a white stripe and a black belt." Four children are on the field: a girl in a yellow shirt by the gate, a boy under the tree who eats an orange, a small boy at the water tap, and a boy near the goal. Lily says, "That is his bag, isn't it?" and points to the boy near the goal, who has curly hair and a blue shirt with a white stripe. He runs to them and says, "Thank you!"

- hero: A green backpack on a bench at the edge of a school field. Lily and Mia stand beside it. Coach Matt (red sports shirt with a white stripe, silver whistle) points across the field.
- inline-para-2: The school field with four children: a girl in a yellow team shirt with a ponytail by the gate; a boy in a blue team shirt without a stripe who sits under a tree and eats an orange; a small boy in a green shirt at a water tap; a thin boy with curly hair, a blue team shirt with a white stripe, and a black belt who runs near the goal.
- inline-para-3: The thin boy with curly hair (blue team shirt with a white stripe, black belt) takes the green backpack from Lily and smiles; Mia and Coach Matt stand beside them.

### L05 Grace's Flat

Text type: functional: an email that describes a flat. Genre: Home. App type: nonfiction. Place: the laptop at home.

On Monday, June 22, Lily opens the first email from Grace, her pen pal. Grace writes in the first person: "Dear Lily, I live in a flat on the ninth floor with my mom and dad. There is a lift in our building." She tells about each room: a living room with a gray sofa and many cushions, a kitchen with a cooker and a fridge, a bathroom with a shower and a yellow towel, and her room with a bed and a desk. Her favorite place is the balcony, where she draws, and the view of the park makes her happy. She asks, "What is your house like?" and ends "Best wishes, Grace. P.S. How is Pip?"

- hero: Lily sits at a desk in front of a laptop. The screen shows an email headed "Dear Lily," with the subject "My flat". Mia leans over her shoulder.
- inline-para-2: Grace's drawing of her flat on lined paper: five rooms with labels "living room", "kitchen", "my room", "bathroom", "balcony" and tiny drawings of a sofa, a cooker, a fridge, a desk, and plants.
- inline-para-3: Lily draws a plan of her own house on a sheet of paper at the table; the laptop with the email stands next to her.

### L06 The Mouse Deer and the Crocodiles

Text type: story: a traditional tale in an email. Genre: Pets & Animals. App type: fiction. Place: the school library.

On Thursday, June 25, Leo reads Ravi's email to Lily and Mia in the school library. Ravi writes, "Dear Leo, my grandma tells me this story when it rains." A hungry mouse deer sees sweet fruit on the other side of a deep river, but the river is full of crocodiles. He tells them, "The king wants me to count all the crocodiles. Please line up across the river." Before they know it, he jumps on their backs and counts, one, two, three, until he reaches the other side. He says, "Thank you for the bridge!" Ravi ends with a question: "Do you have a story like this?" and "P.S. How is Pip?"

- hero: Leo sits at a library table with a laptop; the screen shows "Dear Leo,". Lily and Mia lean in to read.
- inline-para-2: A storybook picture: a small mouse deer stands on a river bank and looks at a line of enormous crocodiles that lie side by side across the water.
- inline-para-3: A storybook picture: the mouse deer jumps from the last crocodile to the far bank near a tree with sweet fruit; the crocodiles look surprised.

### L07 A Day with Ranger Mark

Text type: functional: a typical day, a blog post. Genre: Jobs & Work. App type: nonfiction. Place: the nature park.

On Saturday, July 11, the Explorers visit the nature park, and Mia writes the blog post "A Day with Ranger Mark". She writes in the first person ("Posted by Mia"). Ranger Mark gets up at five o'clock and opens the gate at half past six. Then he walks the main path, four kilometers long, and checks the lake. At ten o'clock he takes visitors on a forest tour, and at midday he eats lunch under a tree. In the afternoon he climbs the lookout tower and counts birds, and at five o'clock he closes the gate. Mia asks, "What do you like best about your job?" and he says, "I like to see a new bird."

- hero: Ranger Mark (about forty, short black hair under a green cap, khaki shirt with two chest pockets, green trousers, brown boots) stands at a park gate. Mia holds a notebook; Teacher Kim, Lily, Leo, and May stand behind her.
- inline-para-2: Ranger Mark walks along a forest path with binoculars around his neck and points up into a tree; the children follow and look up.
- inline-para-3: Ranger Mark sits at a wooden table under a big tree with a lunch box and writes in a small logbook; a path and a lake are behind him.

### L08 Teacher Kim Reads My Post

Text type: story: feedback from a teacher and a classmate. Genre: School. App type: fiction. Place: the school library and Lily's home.

On Thursday, July 16, Lily gives Teacher Kim her first blog post about the nature park. Teacher Kim reads it and says, "Your facts are excellent. You have already added the time, but you haven't added the date yet. Perhaps use a shorter title." Mia says, "I like the part about the lake," and Leo says, "It needs a joke." Teacher Kim says, "A joke is fine if it is kind." Lily asks, "Is the post too long?" and Teacher Kim answers, "No, it is just right." At home Lily has just corrected the date when Pip brings the red ball and sits on the printed page.

- hero: A library table: Teacher Kim holds Lily's printed page with red pencil marks; Lily, Mia, and Leo sit around the table.
- inline-para-2: Teacher Kim points at a line on the page with a red pencil; Lily writes on a notepad.
- inline-para-3: At home, Lily sits at the table with a laptop and the printed page; Pip sits on the page with the red ball between his paws.

### L09 Race to the Flag

Text type: functional: board-game rules sent by email. Genre: Technology & Games. App type: nonfiction. Place: Tom's living room.

On Saturday, July 18, an email from Alex arrives for Tom: "Dear Tom, here are the instructions for my game, Race to the Flag." The rules say: "1. Each player puts a flag on START. 2. Throw the dice and move your flag. 3. If you land on a red square, go back three squares. 4. If you land on a green square, throw again. 5. The first player on FINISH is the winner." Tom, Ben, and Hugo, a boy in Tom's class, make the board of cardboard with twenty squares. They play at three o'clock. Pip jumps on the board and takes a flag, and the boys put it back. Hugo wins, and Tom writes to Alex, "Hugo is the winner!"

- hero: Tom, Ben, and Hugo (a thirteen-year-old boy with short black hair, a yellow T-shirt, and blue jeans) kneel around a cardboard board with colored squares. A laptop on the sofa shows "RACE TO THE FLAG" and the five numbered rules.
- inline-para-2: Ben cuts small paper flags with scissors; Tom draws red and green squares on the cardboard with a marker.
- inline-para-3: Pip stands on the board with a small paper flag in his mouth; Tom, Ben, and Hugo laugh.

### L10 Where Is Everyone?

Text type: story: who is where, and what they do. Genre: Family & Friends. App type: fiction. Place: the house and the garden.

On Sunday, July 19, at eleven o'clock, Lily comes home from Mia's house and takes off her shoes at the door. The house is quiet, so she shouts, "Where is everyone?" Mom says, "I'm in the kitchen. I'm making biscuits." Dad says, "I'm in the garage. I'm fixing Tom's bike tire," and Tom says, "I'm upstairs. I'm doing my homework." Lily says, "Pip is behind the sofa, isn't he?" and he is, with the red ball. At twelve o'clock everyone has a picnic in the garden, and Pip takes a biscuit.

- hero: A cutaway view of a house: Mom with a tray of biscuits in the kitchen, Tom at a desk by an upstairs window, Dad with a bike wheel in the garage, and Lily in the hall taking off her shoes.
- inline-para-2: Dad kneels beside Tom's bike in the garage with the front wheel off; Lily looks in from the door.
- inline-para-3: The family sits on a blanket in the garden with a bowl of fruit and a plate of biscuits; Pip runs away with a biscuit.

### L11 Jobs at Our School

Text type: functional: a fact page about jobs, a blog post. Genre: Jobs & Work. App type: nonfiction. Place: the school.

On Monday, July 20, Lily and May post a page called "Who Works at Our School?" ("Posted by Lily and May"). Nurse Jill is in the nurse's room from 8:00 a.m. to 3:00 p.m. and puts a bandage on a small cut. The cook starts at 6:00 a.m. and makes lunch for four hundred students. The bus driver makes two trips, at 7:00 a.m. and at 3:30 p.m., and the cleaner starts at 5:30 a.m. The office staff answer the phone and write letters to parents. The post ends, "Which job do you like? What else would you like to know?"

- hero: A laptop screen with the blog page "WHO WORKS AT OUR SCHOOL?" and four small drawings: a nurse with a bandage box, a cook with a big pot, a bus driver, and a cleaner with a broom. Lily and May sit in front of it.
- inline-para-2: Nurse Jill (about thirty-five, black bun, white short-sleeved uniform with a small red cross on the pocket, white shoes) puts rolls of bandage into a box marked "FIRST AID" in the nurse's room. No child is present.
- inline-para-3: A school cook (a woman in a white apron and a white hat) stirs a big pot in the canteen kitchen; steam rises.

### L12 The Extra Mango

Text type: story: an honest choice at the market. Genre: Food & Drink. App type: fiction. Place: the market.

On Saturday, July 25, at half past eight, Mia, Leo, and May go to the market to buy fruit for the open evening. Teacher Kim has given May 100 baht. A sign says "FRESH MANGOES: 5 for 100 baht", and the seller puts the mangoes in a bag. Leo counts them and says, "Six! We paid for five." May says, "Have you ever had an extra mango before?" and Leo says, "No, never. Let's go back." The seller laughs and says, "You are honest customers," and gives each child a piece of sweet mango. May says, "Thank you!"

- hero: A market stall with a sign "FRESH MANGOES: 5 for 100 baht". A seller (a woman in a green apron and a straw hat) holds a bag; Mia, Leo, and May stand at the stall.
- inline-para-2: Leo points at the mangoes on the table and counts; May holds the bag; Mia holds two 50-baht notes.
- inline-para-3: The seller laughs and gives each child a piece of mango on a small paper plate; the children smile.

### L13 Nadia's Otters

Text type: functional: a fact file in an email, with headings. Genre: Nature & Outdoors. App type: nonfiction. Place: Mia's desk.

On Monday, July 27, Mia reads an email from Nadia, her pen pal, who loves animals and photos. Nadia writes, "Dear Mia, here is my fact file about otters." The file has three headings: "Where otters live", "What otters eat", and "What otters do". Otters live near rivers and ponds and eat fish. Otters have soft fur and swim fast, and an otter family has about six otters. Nadia took several photos of wild otters in a park near her home. She asks, "Do you have otters in Thailand? Do you like them?"

- hero: Mia sits at a laptop. The screen shows an email "Dear Mia," and a photo of three otters on a rock.
- inline-para-2: A photo: otters swim in a pond; one holds a fish.
- inline-para-3: Mia's notebook with a drawing of an otter and three headings: "Where otters live", "What otters eat", "What otters do".

### L14 The Lights Go Out

Text type: story: an open evening with a power cut. Genre: School. App type: fiction. Place: the school hall and home.

On Friday, July 31, the Explorers hold their open evening in the school hall. The program on the door says "6:00 p.m. Welcome", "6:20 p.m. Mia's photo show", "6:40 p.m. Leo's cartoon show", and "7:00 p.m. Lily reads the blog". Leo was showing his cartoons when the electricity went off at 6:45, and the hall was dark. Teacher Kim says, "Please stay in your seats." Leo, Mia, and May take flashlights from their bags, and Lily reads the blog by flashlight. The parents clap, and the lights come back at 7:10. Teacher Kim says, "Explorers are always ready." At home Pip waits at the door with his red ball.

- hero: A poster on the school hall door: "EXPLORERS' OPEN EVENING", "Friday, July 31", "6:00 p.m. Welcome", "6:20 p.m. Mia's photo show", "6:40 p.m. Leo's cartoon show", "7:00 p.m. Lily reads the blog". Teacher Kim stands at the door and welcomes parents.
- inline-para-2: The hall is dark. Leo, Mia, and May hold flashlights; beams of light cross the stage; the shapes of parents sit in rows.
- inline-para-3: Lily reads from a printed page in the beam of Mia's flashlight on the stage; parents sit in rows and smile.

## 5. Objectives

### 5.1 Book rule: the 20 objectives of `books["adventure-7.1"]`

| Objective | Target in | Text |
|---|---|---|
| R30.1 | L08, L10, L12 | Can understand some details in short, simple dialogues on familiar everyday topics, if supported by pictures. |
| R30.2 | L03, L14 | Can understand simple information on everyday signs in a public building. |
| R30.3 | L02, L06 | Can understand the main idea in a short, simple picture story. |
| R30.4 | L01, L07, L09, L12, L13 | Can understand basic factual statements relating to pictures or simple texts. |
| R30.5 | L04, L12 | Can identify people in their immediate surroundings or in pictures from a short, simple description of their physical appearance and clothes. |
| R30.6 | L05, L10 | Can understand a short, simple description of a house or flat (e.g. 'rooms', 'furniture'), if supported by pictures. |
| R30.7 | L08, L14 | Can understand simple feedback from a teacher or classmate. |
| R30.8 | L01, L14 | Can identify the main information for an event (e.g. 'day', 'time, place'). |
| L30.1 | L04, L10 | Can identify people in their immediate surroundings or in pictures from a short, simple description of where they are and what they are doing. |
| L30.3 | L05, L10 | Can understand basic information about someone's house or flat (e.g. 'rooms', 'furniture'), if spoken slowly and clearly and supported by pictures. |
| R31.1 | L01, L03, L13 | Can identify key information in a text to answer simple yes/no questions. |
| R31.2 | L06, L08 | Can follow a simple dialogue about familiar, everyday activities. |
| R31.3 | L09 | Can follow basic instructions on how to play a simple board game, if supported by pictures. |
| R31.4 | L07, L11 | Can understand short, simple descriptions of someone's typical day, if supported by pictures. |
| R31.5 | L03, L05 | Can understand and make connections between words in the same area of meaning, e.g. 'head' and 'hat'. |
| R31.6 | L06 | Can follow a short, familiar, traditional story, if supported by pictures. |
| L31.1 | L02, L14 | Can follow a simple conversation between two people or characters, if supported by pictures. |
| L31.2 | L02, L05, L12, L13 | Can understand some unfamiliar words in a short description, if supported by pictures. |
| L31.3 | L04, L09, L11 | Can identify objects, places or people from short descriptions. |
| L31.4 | L07, L11 | Can understand basic information about common jobs, if spoken slowly and clearly and supported by pictures. |

Result (script check, 2026-10-06): 20 of 20 objectives are a target in 1 or more lessons. None is missing. Every lesson has exactly 12 glossed words and at most 2 A2 Key words (script check, section 7).

R31.3, R31.6 have one target lesson. bank-7 gives each practice in 2 packages, so the level rule holds.

### 5.2 Other targets

The `--next` list of this book is empty: no band objective is taught before Adventure 7.1, so every target is a book objective (section 5.1). The supporting objectives in section 3 give the other objectives practice. Writers may add A1 objectives (for example R27.1, R27.4, L27.7) as supporting objectives where the text practices them.

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
| What time ...? | L01, L11 | L07 |
| past continuous with when | L02, L06, L14 | - |
| zero conditional | L03, L09 | - |
| where clauses | L04 | L10 |
| look / sound / feel like | L05, L13 | - |
| before / after clauses | L07 | - |
| present perfect with just, already, yet | L08 | - |
| tag questions | L10 | L04 |
| present perfect with ever, never | L12 | - |

Avoid at level 7: the first conditional, *for / since* with the present perfect, *used to*, the passive, reported speech, *too / enough*, and *a few / a little* as a taught pattern. *If* starts only a zero conditional (*If your card is red, turn left.*). The "also" points are in section 3. *Dice* is not on a word list: put it in `allow` if the check marks it (L09 of 7.1).

## 7. Words

Each lesson glosses 12 words: 1–2 new A2 Key words of the free pool, any free Flyers word that fits, and Flyers or Movers words that earlier packages glossed (recycling is the goal at level 7). The words of a lesson fit its text. American spelling. No word is glossed twice in the two books.

| # | A2 Key words (free pool) | New Flyers words (free pool) | Flyers words glossed before | Movers words glossed before |
|---|---|---|---|---|
| L01 | event, blog | june | invitation, member, club, join, meet, group, date, project, early | - |
| L02 | by accident, perfect | - | flag, design, brush, step, decide, surprise | wet, dry, laugh, drop |
| L03 | notice, available | - | borrow, magazine, entrance, exit, turn off, information, online, keep | comic, quiet |
| L04 | belong, describe | backpack | pocket, stripe, belt, missing, friendly | curly, thin, round, tall |
| L05 | flat, furniture | dear | lift, cooker, fridge, cushion, view | floor, balcony, shower, towel |
| L06 | among, trouble | - | enormous, believe, once | river, clever, hungry, idea, jungle, safe, dangerous |
| L07 | wildlife, equipment | kilometer | path, gate, hour, midday, tour | forest, climb, lake, ticket |
| L08 | advice, helpful | - | improve, explain, excellent, interesting, perhaps, important | mistake, careful, think, difficult |
| L09 | instructions, extra | - | turn, win, winner, card, ready, stay | move, player, square, first |
| L10 | garage, relax | tire, biscuit | search, together | upstairs, downstairs, shout, noise, picnic, bowl |
| L11 | staff, cleaner | - | office, bandage, medicine, student | nurse, cook, driver, teach, busy, everyone |
| L12 | customer, fresh | - | sell, money, cheap, delicious, sure, hurry | buy, change, sweet, market |
| L13 | fact, similar | - | fur, pond, wild, creature, several, fast, soft | swim, fish, different |
| L14 | electricity, performance | flashlight, program, july | dark, stage, light, enter, everywhere | loud, afraid |

Counts (script check, 2026-10-06): 14 lessons x 12 = 168 glossed words, 168 different. A2 Key 28 (every lesson has 1–2, none has more than 2). Flyers 86, of which 9 are free-pool words (june, backpack, dear, kilometer, tire, biscuit, flashlight, program, july). Movers 54. Every lesson has 10 or more Flyers or Movers words.

Word notes for writers:
- **A2 Key words.** Each A2 Key word is new. Give it a glossary entry with the sense of the text and a simple example. Phrases (*by accident, bring back, alarm clock, wake up, first name, half-price*) get one entry.
- **Swap rule.** A writer can swap at most 2 words of a lesson for words of the same topic that no other lesson of the two books uses. A2 Key swaps come from the free pool (`a7-word-pool.md`). Tell the lead which, so that the counts stay true.
- **Months, times, and numbers.** Months, weekdays, *a.m.*, *p.m.*, *baht*, and figures in times, prices, and dates are allowed in Adventure (bible §5). Months that this map glosses are free-pool words; if the converter refuses one, the writer takes a swap.
- **Names.** *Thailand*, *Singapore*, *Explorers*, and the names of the cast go in `names` or `allow`.

**Change after the map (Daniel, 2026-10-06): 4–6 A2 Key words in each lesson.** The `adventure-7` profile now allows up to 6 A2 Key words and needs 6 or more Flyers words. Each writer keeps the 2 A2 Key words of the table above and replaces 2–4 of the Flyers words glossed before with new A2 Key words from the free pool. The writers' reports and the pre-review report list the changes.

## 8. Questions and tasks

- MCQ (4 printed of 10): at least 2 test a target objective (L01: "When is the first meeting of the Explorers?"; L03: "When is the library closed?"; L07: "What time does Ranger Mark open the gate?"; L09: "What happens if you land on a red square?").
- Short answer (1): a personal question in the lesson frame (L01: "What club would you like to join? Why?"; L05: "What is your home like?"; L11: "Which job at your school do you like? Why?").
- Writing: a personal version of the text type (L01: "Make a poster for a club." L03: "Write three signs for your classroom." L05: "Write about your home: rooms and furniture." L07: "Write a typical day for a person with a job." L09: "Write three rules of a game.").
- Listening objectives (L-ids) are tested through the audio of the text: the question uses the words that the voice says. L04 needs a spoken description of the boy with no picture help in the question. L10 needs one voice for each speaker (plan D5).

## 9. Questions for Daniel

1. **Calendar.** The texts have dates and weekdays that agree with 2026 (June and July). Option A: keep dates in the form *June 4*, month first. Option B: use weekdays and times only, with no date.
2. **Months as glossed words.** Free Flyers words are mostly months. Option A: gloss the months that fit (listed in section 7). Option B: put months in `allow` and gloss other words.
3. **New facts.** Coach Matt's sports class has colored team shirts (L04). Hugo plays Alex's game at Tom's house (L09). A power cut at the open evening (L14). A seller returns an extra mango (L12). Do you accept them? Option A: accept. Option B: drop the fact and the writer takes a swap.
4. **Traditional tale.** *The Mouse Deer and the Crocodiles* is a tale of Southeast Asia that Ravi tells from his grandma. Option A: keep it. Option B: use a Thai animal tale that you choose.
5. **Pen pals in pictures.** The pen-pal sheets are in progress. This map shows each pen pal only as email text on a laptop screen. Option A: keep this. Option B: wait for the sheets and draw the children.
6. **Figures on signs.** Posters, signs, and notes show times, prices, and dates as figures (*1:00 p.m.*, *20 baht*). Option A: keep figures in the text and the pictures (the bible allows them). Option B: words in the text, figures only in the pictures.
7. **The word *dice*.** L09 needs *dice*, which is not on a word list. Option A: keep it and put it in `allow`. Option B: write "a number cube".
8. **Same objectives as bank-7.** bank-7 has the same text types (signs, posters, rules, typical day, jobs). This map gives each a different situation (a library, a flat email, a ranger, a school job page). Option A: keep. Option B: Daniel names the situations.

**Lead decisions for the writers (2026-10-06).** Daniel reviews the finished lessons, so these choices are provisional. Every question: option A. A pen pal appears in a picture only as email text on a screen, with no drawn person, until Daniel chooses the pen-pal sheets.

## Revision history

- 0.3 — 2026-10-06 — §7: 4–6 A2 Key words in each lesson (Daniel).
- 0.2 — 2026-10-06 — Lead decisions for the writers in §9 (Daniel can change them in his review).
- 0.1 — 2026-10-06 — First version (track levels_5_9_20261006).
