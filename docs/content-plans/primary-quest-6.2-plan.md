# Primary Advantage Quest 6.2 — Lesson Map

Version 0.3 | Date 2026-10-06 | Status: Draft | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

Track: `levels_5_9_20261006`. Companion files: [`primary-quest-5-plan.md`](primary-quest-5-plan.md) (the model for this map), [`primary-levels-5-9-plan.md`](primary-levels-5-9-plan.md) (§3 band rule, §5 profiles, §6 vocabulary, §7 grammar, §8 cast), [`primary-quest-adventure-series-bible.md`](primary-quest-adventure-series-bible.md) (§1–§3), [`level-plans/levels-5-9-objectives.json`](level-plans/levels-5-9-objectives.json), [`level-plans/bank-6.md`](level-plans/bank-6.md), [`data/grammar-levels-5-9.md`](data/grammar-levels-5-9.md), [`reviews/2026-10-06-prereview-level-5.md`](reviews/2026-10-06-prereview-level-5.md), [`../../content/primary/AUTHORING.md`](../../content/primary/AUTHORING.md). The sister map is [`primary-quest-6.1-plan.md`](primary-quest-6.1-plan.md).

## 1. Summary

Quest 6.2 is the second book of level 6 (A1+, `cefr_level = 'A1'`, `ra_level = 6`). It has 14 workbook lessons. Each lesson has 15 glossed words, 2–4 target objectives, and one main grammar point of level 6. QR key: `q6.2/<lesson>`.

Text mix: 7 stories and 7 functional texts, as the levels plan says. The stories are a traditional tale with repeated lines, a sandcastle and a wave (guess what happens next), two prizes for two children, a talent show, a morning at Green Hill, a spaceship made from a box, and a stamp for Aunt Sue. The functional texts are product labels, instructions for a paper rocket, notes about where to meet, a price list, a school newspaper page, a job poster, and tickets for a show.

Rule checks (run on this map with a script, 2026-10-06):

- **Book rule:** 16 of 16 objectives of `books["quest-6.2"].objectives` are a target in 1 or more lessons (section 5.1). 14 of them are a target in 2 or more lessons; one lesson only: R28.4, L28.4.
- **Targets per lesson:** every lesson has 2–4 targets (14 lessons have 4, 0 have 3, 0 have 2). The map has 56 target slots and 35 different target objectives: the 16 book objectives and 19 other objectives (section 5.2).
- **Level rule:** each of the 30 in-scope objectives of level 6 is a target in 3 or more packages (Quest 6.1, Quest 6.2, and bank-6). Result: 30 of 30, none under 3 (section 5.3).
- **Words:** 210 glossed words, no word twice, none in the other Quest 6 map. Flyers 182, Movers 14, Starters 14, A2 Key 0 (section 7). 42 of the Flyers words are new words of the free pool (42 in this book, 77 in the sister book: all 120 pool words are used, none twice; the 120 include *get undressed*, a Movers word).
- **Questions and dialogue:** every lesson plans one real question (the brief shows it in quotation marks). All 7 stories have dialogue.

**Cast (series bible §2–§3):** Quest 6.1 and Quest 6.2 are one school year, so every age is the same in both books. Tom and Ben are 12 (M1). Sam is 11 (P6). Lily, Mia, and Leo are 10 (P5) in Teacher Kim's class. May is 11 (P5, in the same class). Pat is 8 (P3). Pip is a small brown puppy. Teacher Nick is Tom's class teacher. Coach Matt teaches sports. Aunt Sue and Uncle Dan are Mom's sister and Dad's brother. Nobody has a birthday in this book, so no age changes. There is no pen pal. The facts of level 5 stay: Grandpa is 71, Aunt Sue is a nurse in Chiang Mai, Mom and Dad have no job in the text, May and Pat live with their parents, their grandma, and the parrot Bill, and Green Hill is the grandparents' village near the town. Pip is in 6 of the 14 lessons (L01, L02, L03, L04, L09, L11). "One name, one person": no new child name appears. The only proper place names are *Chiang Mai* and *Green Hill* (see question 6).

## 2. Text profile (`quest-6`)

| Measure | Target |
|---|---|
| Words | 260–340, in 4 paragraphs |
| Mean sentence length | 7.0–8.5 words; longest sentence 15 words or less |
| Running words on Starters, Movers, or Flyers (names, glossed, allowed words not counted) | 95% or more |
| Glossed words | 15: at most 1 Movers word, the rest Flyers words, 0–2 Starters words, no word above Flyers except 1 A2 Key word at most (this map: exactly 1 Movers, 13 Flyers, 1 Starters, 0 A2 Key) |
| New words from the free pool | 2–5 in each lesson; the other Flyers words were glossed before (book packages or bank-6) |
| Question marks | 2 or more (book rule: 10 of 14 lessons; this map plans a question in all 14) |
| Dialogue | 6 or more lessons. This map has dialogue in all 7 stories; the functional lessons add speech or reader questions |

Quest 6.2 uses the Flyers forms of Quest 6.1 and adds the sequence words *first, then, next, finally* (L03) and the fixed question *Have you ever ...?* (L07). The past continuous with *when* comes back in L09. Numbers are words: prices, times, and dates in the text are words (for example *a quarter past ten*, *the twentieth of March*, *fifty baht*). A sign, a poster, or a ticket in a picture may show figures, and the brief says so. Months, days, *baht*, and the Flyers time words go in `allow`. All conditionals, the present perfect beyond *ever*, passive, and reported speech do not appear. The word *if* is glossed only for the fixed use *if you want* and *ask if*.

## 3. Lesson map

Targets are A1 key ids (`a1-objective-key.json`, GSE 26–29). "Supporting" lists the objectives that the text will clearly practice. Writers add R23.3, R24.6, and R25.2 as supporting objectives where the text practices them. Words are in section 7.

| # | Title | Text type | Genre | App | Cast and place | Targets | Supporting | Main grammar |
|---|---|---|---|---|---|---|---|---|
| L01 | Labels on the Shelf | functional: product labels read aloud and matched | The Home | nonfiction | Lily, Tom, Mom, Pip; the bathroom shelf and the kitchen at home | R28.1, L28.1, R23.7, R23.8 | R27.5, R27.3, L27.3, R24.2, R22.3 | should (also: will) |
| L02 | The Three Goats and the Bridge | story: a traditional tale with repeated lines | Pets & Animals | fiction | Grandpa, Tom, Lily, Pip; the garden at home on Sunday afternoon | L28.4, R28.2, R25.1, L27.2 | L26.1, R26.1, R26.5, L24.2, R24.4 | will / won't (also: so) |
| L03 | Make a Paper Rocket | functional: instructions with first, then, next, finally | Toys & Games | nonfiction | Tom, Lily, Pip; the table in the living room | R28.4, R23.2, L27.1, R23.7 | R28.3, L28.2, R24.3, R23.8, R25.4 | first, then, next, finally |
| L04 | The Sandcastle and the Wave | story: guessing what happens next from pictures | Nature & Outdoors | fiction | Tom, Lily, Dad, Mom, Pip; the beach on Sunday | R29.2, R28.2, R25.2, L25.4 | R26.5, R27.2, L24.4, R25.4, L26.3 | be going to (also: will) |
| L05 | Ben, Meet Me at Ten | functional: notes and messages about when and where to meet | Family & Friends | nonfiction | Tom, Ben, Mom; school and the fridge at home | R29.4, R29.8, R28.3, L23.7 | R24.6, R26.1, L25.6, L26.1, R22.3 | shall / could (also: will) |
| L06 | Different Prizes | story: what two children like, from pictures | School | fiction | Mia, Leo, Lily, Teacher Kim; the classroom | R29.3, L27.4, R26.6, L25.3 | L23.3, R27.2, R26.5, L24.2, R25.4 | might (also: if) |
| L07 | The Talent Show | story: what people can and can't do | Sports & Play | fiction | Lily, Mia, Leo, May, Tom, Teacher Kim; the school hall | L28.3, L28.1, L23.1, R28.2 | L22.1, R26.5, L24.2, L26.3, R25.4 | have you ever ...? (also: can / can't) |
| L08 | The Class Shop Prices | functional: a price list with times and dates | Shopping | nonfiction | Lily, Leo, Mia, Teacher Kim; the classroom | L29.2, R23.4, R28.1, L24.6 | R28.3, R22.2, L22.2, R27.6, R23.8 | will (also: shall) |
| L09 | Morning at Green Hill | story: a morning routine told with pictures | Family & Friends | fiction | Lily, Grandma, Grandpa, Pip; Grandma and Grandpa's house and garden at Green Hill | R29.5, L29.1, L22.2, L28.2 | R26.5, L26.2, R25.5, L24.4, L25.4 | past continuous with when (also: present simple routines) |
| L10 | Race Day in the School News | functional: a school newspaper page with results | School | nonfiction | Tom, Ben, Teacher Nick, Sam, May, Mia, Lily, Leo, Pat; the school field | R29.6, R22.2, L24.6, R29.8 | R28.3, L29.2, R23.4, R24.3, R25.3 | so (also: past simple) |
| L11 | The Spaceship in the Garden | story: an imagined trip told slowly with pauses | Toys & Games | fiction | Lily, Tom, Pip; the garden at home | L28.2, R29.2, R28.2, L25.4 | L24.2, R26.5, R27.2, R25.4, L26.3 | will (also: be going to) |
| L12 | Our Job Poster | functional: a class poster about jobs, with daily routines | Work | nonfiction | Lily, Mia, Leo, May, Teacher Kim; the classroom | L29.1, R29.3, R23.5, R24.2 | R27.3, R28.1, L24.1, R26.6, L23.3 | be going to (also: present simple routines) |
| L13 | Tickets for the Space Show | functional: tickets and a notice with prices, dates, and times | Places & Events | nonfiction | Dad, Lily, Tom; the school hall and the town street | L29.2, R28.3, R29.6, R29.4 | R23.4, L23.7, L22.2, R24.3, R23.8 | should (also: will) |
| L14 | A Stamp for Aunt Sue | story: sending a drawing, with prices and a note | Places & Events | fiction | Lily, Tom, Dad, Aunt Sue (in a note); the post office and the town street | R29.5, L29.2, R29.8, L28.3 | R26.5, R24.5, L25.2, L24.4, R25.5 | so (also: past continuous) |

Notes:
- L02 is the traditional tale of the book (repeated lines, gestures, no gods, no monks). Grandpa tells it in the garden. The tale is told with a bear, not with a troll: question 3.
- L05, L10, L13, and L14 have written prices, dates, or times. The dates are Saturday the thirteenth of March (L10), the tenth of April (L10), and the twentieth of March (L13). In 2027 all three days are Saturdays. Question 5.
- L04, L07, and L13 add a beach and the school hall to the places of the bible. See question 4.
- L14 has Aunt Sue only as the name on a parcel. She is in Chiang Mai (a place name that Quest 5 L02 already used).
- L01 is one of four label lessons of level 6 (bank-6 has three more). The topics differ: a bathroom shelf and a kitchen shelf here.
- L14 is the review lesson. It uses the book's words, a price, a note, and the past continuous.

## 4. Lesson briefs and pictures

Each brief gives who, where, what happens, and how it ends. Each lesson has a hero picture and two inline pictures. Sign, menu, timetable, and notice text is in double quotation marks, as in AUTHORING §6. Cast looks are not described: the cast sheets fix them. A person outside the cast gets a full look at first mention. No child is in distress, on a bed, or with a hand on the face.

### L01 Labels on the Shelf

Text type: functional: product labels read aloud and matched. Genre: The Home. App type: nonfiction. Place: home.

On Saturday Mom comes home from the shop with a full bag, and Lily puts the things on the shelves. She reads the label on each thing. The bathroom shelf has a bottle that says "SHAMPOO" and a bar that says "SOAP. Keep dry." The kitchen shelf has a carton that says "MILK. Keep in the fridge." Tom asks, "Is this juice?" and Lily reads the label: "SHAMPOO. Not for drinking." Then Mom describes a thing: "It is long and soft, and you use it for your hair." Lily says, "A brush!" and Tom finds it. Pip sniffs the soap and sneezes.

- hero: A bathroom shelf with three things in a row. A bottle has a label "SHAMPOO", a bar of soap sits in a dish marked "SOAP", and a hairbrush lies next to them. Lily stands at the shelf and Mom holds a shopping bag.
- inline-para-2: Tom holds a bottle with the label "SHAMPOO" at arm's length and frowns; Lily points at the small print.
- inline-para-3: A kitchen shelf with a carton labeled "MILK" and a glass bottle labeled "JUICE"; Pip sniffs a bar of soap on the floor and sneezes.

### L02 The Three Goats and the Bridge

Text type: story: a traditional tale with repeated lines. Genre: Pets & Animals. App type: fiction. Place: the garden at home.

Grandpa sits in the garden on Sunday afternoon and tells Tom and Lily an old tale. Three goats want to cross a bridge to eat the grass on the other side. A big furry bear lives under the bridge and he is unfriendly. Each goat walks across and goes "trip, trap, trip, trap". Each time the bear asks, "Who is walking on my bridge?" Tom and Lily say the words and move their hands like feet. The small goat says, "I am small, so please wait for my brother." The big goat says, "I will not stop. You are unhappy, but you are not kind. Go away!" The bear says sorry, and all the animals share the land on the other side.

- hero: Grandpa sits in a garden chair with Tom and Lily on the grass in front of him; Grandpa holds up two fingers like walking feet; Pip lies next to Lily.
- inline-para-2: A storybook picture: three goats of three sizes cross a wooden bridge over a stream; a big furry bear looks out from under the bridge.
- inline-para-3: The goats and the bear eat grass together in a green field; the bear is smiling.

### L03 Make a Paper Rocket

Text type: functional: instructions with first, then, next, finally. Genre: Toys & Games. App type: nonfiction. Place: home.

Tom and Lily make a paper rocket for the school space day. You can make one too. The text says what you need: a sheet of paper, scissors, glue, a pencil, and a straw. Four numbered steps have a picture each. "First, cut the paper in a long strip. Then glue it into a tube. Next, make a pointed top. Finally, put the rocket on the straw and blow air." Tom is ready to start before the glue is dry, and Lily says, "Wait." The rocket flies across the room and Pip runs after it. The last line says to make a silver one next time. Tom asks, "Is the glue dry?"

- hero: A table with a sheet of paper, scissors, a glue stick, a pencil, and a straw in a row. Tom and Lily stand behind it. A numbered strip of four small pictures runs along the top.
- inline-para-2: Lily glues the paper tube while Tom holds the pointed top; the glue stick and the scissors lie on the table.
- inline-para-3: A paper rocket with a silver top flies through the living room; Pip jumps after it; Tom and Lily laugh.

### L04 The Sandcastle and the Wave

Text type: story: guessing what happens next from pictures. Genre: Nature & Outdoors. App type: fiction. Place: the beach.

On Sunday the family goes to the beach. Tom and Lily build a big sandcastle with a gate and two towers. Dad says, "It is going to be the best castle on the beach." In the third picture a big wave is coming, and the text asks, "What is going to happen?" The reader guesses from the pictures. The wave comes, and the castle is gone. Tom and Lily are surprised and then laugh. They decide to build a new castle farther from the water, and they finish it before lunch. It is going to be taller than the first one.

- hero: Tom and Lily kneel behind a big sandcastle with a gate and two towers; Dad stands next to them with a bucket; the ocean is far behind them.
- inline-para-2: The castle on the sand with a big wave coming from the ocean behind it; Tom and Lily point and open their mouths.
- inline-para-3: Tom and Lily build a new castle higher up on the beach; Pip digs a hole next to it; Mom sits under an umbrella.

### L05 Ben, Meet Me at Ten

Text type: functional: notes and messages about when and where to meet. Genre: Family & Friends. App type: nonfiction. Place: school and home.

Tom and Ben want to ride their bikes on Saturday, so they write notes. Tom passes a note at school on Friday: "Ben, meet me at the bus station at ten o'clock. Tom." Ben answers on the back: "OK. I will bring the ball. Shall we go to the park?" Tom writes a change: "Meet at the library, not at the bus station. A quarter past ten." Mom leaves a note on the fridge at home: "The wifi is down. Please come home by half past twelve." Ben says thanks, and Tom writes, "You're welcome." Tom says, "I can pack my bag by myself." The last note says, "See you on Saturday."

- hero: Three small notes in a row on a desk at school: "Ben, meet me at the bus station at ten o'clock." / "OK. I will bring the ball." / "Meet at the library. A quarter past ten." A boy's hand holds a pencil.
- inline-para-2: Tom passes a folded note under the desk to Ben, who sits next to him; Teacher Nick writes at the board with his back to them.
- inline-para-3: A note on a fridge door under a magnet: "The wifi is down. Please come home by half past twelve." Tom stands next to it with his bike helmet.

### L06 Different Prizes

Text type: story: what two children like, from pictures. Genre: School. App type: fiction. Place: the classroom.

Teacher Kim's class has a quiz on Friday, and the winners choose a prize from a table. The pictures show six prizes: a book about animals, a funny hat, a puzzle, a chess set, a magazine, and a cartoon book. Mia stops at the book about animals and looks at it for a long time. Leo laughs and puts on the funny hat. Lily says, "Mia might choose the book. Leo might choose the hat." Leo says that he wants to be an actor. If you look at the pictures, you know what each child chooses. Teacher Kim asks, "What do you prefer?" and each child answers. They both win, and each is happy with the prize.

- hero: A table with six prizes in two rows: a book with a picture of a cat, a funny hat, a puzzle box, a chess set, a magazine, and a cartoon book. Mia and Leo stand at the table; Teacher Kim stands behind it.
- inline-para-2: Mia holds the book about animals close to her chest; Leo wears the funny hat and makes a face; Lily watches.
- inline-para-3: Mia and Leo hold up their prizes and smile; Teacher Kim claps.

### L07 The Talent Show

Text type: story: what people can and can't do. Genre: Sports & Play. App type: fiction. Place: the school hall.

The school talent show is on Friday at two o'clock in the school hall. Teacher Kim asks the children, "Have you ever been on a stage?" Leo says, "I can whistle, but I can't dance." May can play the drum, and Mia is dressed as a queen in a dress that May's mom made. Tom watches and says that he can't sing, but he can clap. Then Leo plays a guessing game: "It is round and hot. You can eat it with a spoon." The audience says, "Soup!" The children turn on the music for the last act. Everyone claps.

- hero: A small stage in the school hall with a red curtain; Leo stands at the front and whistles; May sits at a drum; Mia, dressed as a queen with a paper crown, stands to one side.
- inline-para-2: Leo holds a bowl and a spoon above his head and the audience points; Tom claps in the front row.
- inline-para-3: All the children stand on the stage and bow; Teacher Kim and Lily clap at the side.

### L08 The Class Shop Prices

Text type: functional: a price list with times and dates. Genre: Shopping. App type: nonfiction. Place: the classroom.

Lily's class runs a small shop for the school fair on Saturday. Leo is the manager of the shop, and Lily writes the price list. The list has five lines: "storybook, twenty baht", "pencil, five baht", "postcard, ten baht", "paper kite, fifteen baht", and "eraser, three baht". The shop opens at nine o'clock and closes at noon. Mia buys a storybook and a pencil, and she pays thirty baht. Lily gives her five baht in change. Teacher Kim says, "Our little business is a success." Mia asks, "How much is the pencil?"

- hero: A school desk with five items and five price tags in a row: "storybook 20", "pencil 5", "postcard 10", "paper kite 15", "eraser 3". A sign above says "CLASS SHOP". Leo stands behind the desk.
- inline-para-2: Mia holds a storybook and a pencil and gives Leo a coin; Lily holds a small tin of coins.
- inline-para-3: Teacher Kim, Lily, and Leo stand behind the empty table at the end of the day and count the coins.

### L09 Morning at Green Hill

Text type: story: a morning routine told with pictures. Genre: Family & Friends. App type: fiction. Place: Green Hill.

Lily stays at Grandma and Grandpa's house in Green Hill for one weekend. Grandma gets up at half past five every day. She feeds the hens, waters the plants, and puts bread in the oven for breakfast. Grandma was feeding the hens when Lily woke up at seven. Grandpa turns off the tap after he waters the garden, and he says, "We keep the village and the environment clean." After breakfast Lily and Grandma walk to the pond, and Pip runs around the wood by the gate. They are home by eleven o'clock. Lily asks, "Can I help, Grandma?"

- hero: Grandma stands in a garden and feeds hens from a small bowl; Lily comes out of the house door in her pajamas and rubs her eyes.
- inline-para-2: Grandpa turns off a tap at the side of the house; a watering can stands next to him; Lily watches.
- inline-para-3: Lily, Grandma, and Pip walk along a path to a small pond; the gate of the house is behind them.

### L10 Race Day in the School News

Text type: functional: a school newspaper page with results. Genre: School. App type: nonfiction. Place: the school field.

Tom and Ben write the school news for Teacher Nick's class. The page has a headline, a photo caption, and a results list. The fun run was on Saturday the thirteenth of March, and it started at ten o'clock. The list says: "first, Sam", "second, May", "third, Mia", "fourth, Lily", "twelfth, Leo", "thirty-first, Pat", and "fortieth, Teacher Kim". Ben took the photo, so Tom wrote the caption. Everyone ran, so everyone got a ribbon. The last line says that the next race is on Saturday the tenth of April. Teacher Nick asks, "Who was first?"

- hero: A newspaper page with the headline "RACE DAY" and a photo of a crowd of runners; below it a results list: "1st Sam" / "2nd May" / "3rd Mia" / "4th Lily". Tom and Ben stand in front of it.
- inline-para-2: Ben holds a camera at the finish line; Sam runs through a ribbon with his arms up.
- inline-para-3: Tom writes at a desk in the classroom while Teacher Nick reads over his shoulder.

### L11 The Spaceship in the Garden

Text type: story: an imagined trip told slowly with pauses. Genre: Toys & Games. App type: fiction. Place: the garden.

On Saturday afternoon Lily finds a big cardboard box in the garden. She says, "It is a spaceship!" Tom helps her paint it gold and silver, and Pip sits in the front. Lily is the astronaut, and Tom is the engineer. They count down: "Ten, nine, eight ... one. Go!" Lily says, "We will fly to a new planet. We will find a wonderful desert." Tom says, "There may be an alien." The pictures end before the landing, and the reader guesses. In the future, Lily says, she will be a real astronaut. Tom asks, "Where are we going?"

- hero: A large cardboard box painted gold and silver stands in the garden with a round window; Lily sits in it in a paper helmet; Pip sits on her knee.
- inline-para-2: Tom paints a silver star on the box with a big brush; the paint pot sits on the grass.
- inline-para-3: Lily looks up at the sky with her hands on the edge of the box; Tom stands next to her; a small moon is in the sky.

### L12 Our Job Poster

Text type: functional: a class poster about jobs, with daily routines. Genre: Work. App type: nonfiction. Place: the classroom.

Teacher Kim's class makes a poster called "Jobs People Do". Each child draws a person at work and writes two lines about the day of that job. "A mechanic gets up early. He fixes cars at a garage." "An engineer builds a bridge. She works in an office." Leo says he is going to be a businessman. Mia likes animals, so she draws a doctor who looks at an x-ray of a dog, and May draws an engineer. The poster has pictures of a factory, a bank, an airport, a hotel, and a university. The pictures show what each child likes. Teacher Kim says the poster is a good job. The poster asks, "What job do you want?"

- hero: A big class poster headed "JOBS PEOPLE DO" with six pictures: a mechanic, an engineer, a businessman, an actor, a pilot, and a doctor with an x-ray picture. Lily and Mia stand next to it with markers.
- inline-para-2: Leo holds a drawing of a man in a suit with a briefcase and a bag of coins; Mia draws a dog on her page.
- inline-para-3: Teacher Kim and the class stand in front of the finished poster on the classroom wall.

### L13 Tickets for the Space Show

Text type: functional: tickets and a notice with prices, dates, and times. Genre: Places & Events. App type: nonfiction. Place: the school hall.

Dad buys three tickets for the space show at the school hall on Saturday the twentieth of March. The notice says: "SPACE SHOW. Show one: ten o'clock. Show two: a quarter past two. Tickets: children thirty baht, adults fifty baht." Dad chooses show two. He pays one hundred and ten baht for one adult and two children. Tom reads the ticket and says, "We should arrive early." The notice says that the show is a tour of a new planet, and members of the club get a card. Lily writes the day and the hour in her calendar. Lily asks, "Which show shall we see?"

- hero: A poster on the wall of the school hall: "SPACE SHOW" / "Saturday 20 March" / "Show one: 10 o'clock" / "Show two: 2.15" / "Children 30 baht, adults 50 baht". Dad, Lily, and Tom stand in front of it.
- inline-para-2: Dad holds three small tickets at the school hall door and gives money to a woman (black bun, green blouse) at a table; Lily and Tom wait beside him.
- inline-para-3: Lily writes in her wall calendar at home; the page shows "MARCH" and one date circled.

### L14 A Stamp for Aunt Sue

Text type: story: sending a drawing, with prices and a note. Genre: Places & Events. App type: fiction. Place: the post office on the town street.

Lily draws a picture for Aunt Sue in Chiang Mai, and on Saturday she goes to the post office with Tom and Dad. They walk past the police station and across the railway. Traffic is noisy, so Tom holds Pip's lead. At the post office a woman says, "A stamp for Chiang Mai is fifteen baht." Lily has twenty baht, so she gets five baht in change. Lily can write the address, but she can't reach the box, so Tom lifts her up. The picture goes into the post box with a short note: "For Aunt Sue. From Lily." Lily asks, "How much is a stamp?"

- hero: A post office door with a sign "POST OFFICE" and a red post box next to it; Lily holds a large envelope; Tom holds Pip's lead; Dad stands behind them.
- inline-para-2: Lily gives a coin to a woman (gray bun, blue blouse) at the post office counter; a small sign on the counter says "STAMPS".
- inline-para-3: Tom lifts Lily up to the red post box; she holds the envelope at the slot; Pip sits at Dad's feet.

## 5. Objectives

### 5.1 Book rule: the 16 objectives of `books["quest-6.2"]`

| Objective | Target in | Text |
|---|---|---|
| R28.1 | L01, L08 | Can recognise familiar words on product labels. |
| R28.2 | L02, L04, L07, L11 | Can get the gist of a very simple illustrated story. |
| R28.3 | L05, L13 | Can read the time when written as words. |
| R28.4 | L03 | Can follow basic instructions for making something (e.g. ‘a mask’, ‘a clock’), if supported by pictures. |
| L28.1 | L01, L07 | Can identify common objects from descriptions, if spoken slowly and clearly. |
| L28.2 | L09, L11 | Can understand simple sentences on familiar topics if spoken slowly and clearly and with pauses. |
| L28.3 | L07, L14 | Can understand what people say they can or can’t do from simple sentences spoken slowly and clearly. |
| L28.4 | L02 | Can follow a short, familiar traditional story, if supported by gestures and repetition. |
| R29.2 | L04, L11 | Can guess what happens next in a story from the pictures. |
| R29.3 | L06, L12 | Can infer basic information about a character’s preferences from pictures. |
| R29.4 | L05, L13 | Can understand short, simple messages about when and where to meet. |
| R29.5 | L09, L14 | Can understand short, simple illustrated narratives about everyday activities. |
| R29.6 | L10, L13 | Can recognise ordinal numbers up to 50 written as words. |
| R29.8 | L05, L10, L14 | Can understand basic key words in short notes or messages. |
| L29.1 | L09, L12 | Can understand basic information in short passages about everyday activities or routines, if spoken slowly and clearly and supported by prompts. |
| L29.2 | L08, L13, L14 | Can understand basic information about prices, times, and dates in familiar contexts, if spoken slowly and clearly. |

Result (script check, 2026-10-06): 16 of 16 objectives are a target in 1 or more lessons. None is missing.

R28.4 and L28.4 have one target lesson each (L03 and L02). Each is a text type that has one lesson in this book. bank-6 adds more (b011 to b014 give L28.4 four times).

### 5.2 Other targets (from the `--next` list, lowest practice first)

The list is `level-coverage.ts --next quest-6.2`: band objectives taught before the book, with the practice count after first teaching. It does not count Quest 6.1 (not written yet). The objectives that Quest 6.1 teaches first are valid targets here too. The table shows how many targets they have in the Quest 6.1 map.

| Objective | Practice after (before this book) | Target in | Reason |
|---|---|---|---|
| R26.6 | 2 | L06 | lowest practice |
| L23.7 | 3 | L05 | lowest practice |
| L25.3 | 3 | L06 | lowest practice |
| R25.1 | 4 | L02 | lowest practice |
| R23.2 | 5 | L03 | lowest practice |
| R23.7 | 5 | L01, L03 | lowest practice |
| R23.4 | 7 | L08 | low practice |
| L23.1 | 9 | L07 | low practice |
| L24.6 | 10 | L08, L10 | low practice |
| R23.5 | 10 | L12 | low practice |
| R22.2 | 11 | L10 | low practice |
| R23.8 | 12 | L01 | low practice |
| R24.2 | 18 | L12 | fits the lesson text |
| L22.2 | 22 | L09 | fits the lesson text |
| L25.4 | 25 | L04, L11 | fits the lesson text |
| R25.2 | 47 | L04 | fits the lesson text |
| L27.1 | taught first in Quest 6.1 (2 targets there) | L03 | Quest 6.1 teaches it first; Quest 6.2 recycles it |
| L27.2 | taught first in Quest 6.1 (2 targets there) | L02 | Quest 6.1 teaches it first; Quest 6.2 recycles it |
| L27.4 | taught first in Quest 6.1 (2 targets there) | L06 | Quest 6.1 teaches it first; Quest 6.2 recycles it |

The band objectives that this map does not target are R23.1, L25.6, L26.4, L25.2, L26.1, L26.2, R26.1, L24.1, R24.5, R26.2, L23.4, L25.1, L26.3, R26.3, L22.1, L23.5, R23.6, L23.2, L25.5, R25.3, R26.5, L24.5, R24.3, R25.5, R22.1, L24.3, L23.3, R24.4, L24.4, R25.4, L23.6, L24.2, R24.6, R22.3, R23.3. They have supporting use in many lessons.

### 5.3 Level rule: the 30 in-scope objectives of level 6

Level 6 has 100 packages: the 28 lessons of Quest 6.1 and Quest 6.2 and the 72 articles of bank-6. The bank column counts targets in `level-plans/bank-6.json` (2026-10-06). The Quest columns count the targets of the two draft maps.

| Objective | Quest 6.1 | Quest 6.2 | bank-6 | Total | Flag |
|---|---|---|---|---|---|
| R27.1 | 2 | 0 | 4 | 6 |  |
| R27.2 | 2 | 0 | 3 | 5 |  |
| R27.3 | 3 | 0 | 7 | 10 |  |
| R27.4 | 2 | 0 | 3 | 5 |  |
| R27.5 | 2 | 0 | 3 | 5 |  |
| R27.6 | 2 | 0 | 3 | 5 |  |
| R27.7 | 3 | 0 | 8 | 11 |  |
| R28.1 | 0 | 2 | 3 | 5 |  |
| R28.2 | 0 | 4 | 4 | 8 |  |
| R28.3 | 0 | 2 | 9 | 11 |  |
| R28.4 | 0 | 1 | 4 | 5 |  |
| R29.2 | 0 | 2 | 3 | 5 |  |
| R29.3 | 0 | 2 | 3 | 5 |  |
| R29.4 | 0 | 2 | 11 | 13 |  |
| R29.5 | 0 | 2 | 4 | 6 |  |
| R29.6 | 0 | 2 | 3 | 5 |  |
| R29.8 | 0 | 3 | 7 | 10 |  |
| L27.1 | 2 | 1 | 3 | 6 |  |
| L27.2 | 2 | 1 | 6 | 9 |  |
| L27.3 | 3 | 0 | 4 | 7 |  |
| L27.4 | 2 | 1 | 3 | 6 |  |
| L27.5 | 2 | 0 | 3 | 5 |  |
| L27.6 | 2 | 0 | 4 | 6 |  |
| L27.7 | 3 | 0 | 10 | 13 |  |
| L28.1 | 0 | 2 | 3 | 5 |  |
| L28.2 | 0 | 2 | 6 | 8 |  |
| L28.3 | 0 | 2 | 3 | 5 |  |
| L28.4 | 0 | 1 | 4 | 5 |  |
| L29.1 | 0 | 2 | 6 | 8 |  |
| L29.2 | 0 | 3 | 9 | 12 |  |

Result: 30 of 30 objectives have 3 or more. None is under 3. Every objective has a workbook target.

L26.4 is not in the table: it is a level 5 objective (GSE 26). Quest 6.1 teaches it first. Level 5 meets its level rule with bank-5.

## 6. Grammar

One main grammar point for each lesson. The table follows the Flyers items that are new at level 6 (`data/grammar-levels-5-9.md` §3). The writer uses the main point in the key sentences of the text and in two or three questions. "Also" points are secondary.

| Grammar point (level 6) | Main in | Also in |
|---|---|---|
| Past continuous (background and interrupted action) | L09 | L14 |
| *Be going to* for plans and predictions | L04, L12 | L11 |
| *Will / won't* | L02, L08, L11 | L01, L04, L05, L13 |
| *Might*; *may* for possibility | L06 | - |
| *Should* for advice | L01, L13 | - |
| *Could* for suggestions; *shall* for suggestions | L05 | L08 |
| Conjunction *so* | L10, L14 | L02 |
| Sequence words *first, then, next, finally* | L03 | - |
| *Have you ever ...?* (fixed question, first look) | L07 | - |

Every point has a lesson. The Movers list was finished in Quest 5, so Quest 6 has no Movers items to catch up. *Have you ever ...?* is a fixed question only: no present perfect statement. Avoid at level 6: the present perfect beyond *ever*, conditionals, *used to*, passive, and reported speech.

## 7. Words

Each lesson glosses 15 words: 1 Movers word, 13 Flyers words, and 1 Starters word (the `quest-6` profile allows 1 Movers word at most). The Flyers words are 42 new words of the free pool (Flyers words that no package glossed yet) and Flyers words that bank-6, bank-5, or Quest 5 glossed before. The words of a lesson fit its text. American spelling.

| # | New Flyers words (free pool) | Flyers words glossed before | Movers | Starters |
|---|---|---|---|---|
| L01 | soap, shampoo, brush | flour, glass, smell, medicine, chemist, metal, comb, keep, large, each | wet | drink |
| L02 | land, unfriendly, unhappy | bridge, enormous, noisy, frightening, wild, deep, push, furry, once, suddenly | strong | bear |
| L03 | rocket, space, air | glue, scissors, prepare, begin, next, finish, ready, silver, cut, pull | round | paper |
| L04 | ocean, spot | burn, arrive, decide, happen, amazing, excited, together, stone, hole, tomorrow, pleased | wait | sand |
| L05 | you're welcome, by myself, wifi | meet, chat, borrow, later, tonight, minute, bicycle, entrance, early, late | send | bye |
| L06 | actor, if | quiz, puzzle, chess, golf, magazine, cartoon, prefer, excellent, hate, interesting, lovely | pretty | choose |
| L07 | designer, turn on, queen | concert, instrument, drum, tune, act, ever, win, perhaps, costume, could | brilliant | sing |
| L08 | business, manager | sell, spend, save, rich, poor, project, group, student, broken, repair, diary | change | number |
| L09 | turn off, environment | pond, gate, oven, wood, during, stay, leave, lazy, knife, cycle, hurry | feed | garden |
| L10 | news, newspaper, journalist, photographer | stadium, online, screen, date, month, ago, speak, improve, explain | third | class |
| L11 | spaceship, astronaut, future, will | adventure, explore, invent, design, desert, gold, anywhere, somewhere, alone | treasure | robot |
| L12 | job, mechanic, engineer, businessman, x-ray | factory, office, bank, airport, hotel, university, college, ambulance | machine | teacher |
| L13 | planet, tour, time | calendar, invitation, member, festival, club, join, museum, million, thousand, several | first | evening |
| L14 | stamp, police station, railway | post, letter, postcard, traffic, journey, pocket, step, thank, through, lift | shout | shop |

Counts: 182 Flyers + 14 Movers + 14 Starters = 210 glossed words, 210 different (no word twice, none in the other Quest 6 map). New pool words: 42 (3, 3, 3, 2, 3, 2, 3, 2, 2, 4, 4, 5, 3, 3). Movers: 1 in every lesson.

Word notes for writers:
- **The free pool.** The pool file lists 134 words. 12 of them are already glossed in bank-6 packages (*snack, suddenly, thank, through, touch, turn, oven, desert, hill, traffic, wheel, work*). *Moustache* and *practise* are Quest 5 words under the spelling *mustache* and *practice*. So 120 pool words are new. The two maps use all 120. The 12 and the two spelling variants appear as "glossed before" words where a lesson needs them (see the lists).
- **Function words and phrases.** *If, as ... as, a few, a little, will, such, while, time, until, twice, yet, by yourself, by myself, if you want, you're welcome, no problem, of course, in a minute, at the moment, how long, look like, find out, make sure, go away, go out, turn on, turn off* get a glossary entry with the sense of the text and a simple example. Use the entry style of Quest 4 (*always, never, every*).
- **Abbreviations.** *a.m.* and *p.m.* are glossed words. Write them with periods. The converter must accept them: check the first lesson that uses them and tell the lead if it fails.
- **Swap rule.** A writer can swap at most 2 words of a lesson for other Flyers words of the same topic that no other lesson of the two books uses. Tell the lead which, so that the counts stay true. Never swap a free-pool word for a word glossed before.
- **Allowed words.** Weekdays, months, ordinal and cardinal number words, *baht*, and the Flyers time words (*quarter, half, past, timetable*) go in `allow` if the check marks them. Names of places (*Chiang Mai, Green Hill*) go in `names` or `allow`.

**Lead correction (v0.3, 2026-10-06): 12 glossed words.** The converter's `quest-6` profile needs exactly 12 glossed words, and the printed glossary has room for 12. The 15-word table above was a fault in the lead's brief to the map drafter. Each writer removed the Starters word and 2 Flyers words glossed before. Every new free-pool word and every Movers word stays. A removed word can stay in the text as an ordinary word.

| # | Removed from the glossary |
|---|---|
| L08 | number, group, student |
| L09 | garden, wood, stay |
| L10 | class, stadium, speak |
| L11 | robot, gold, design |
| L12 | teacher, college, ambulance |
| L13 | evening, million, thousand |
| L14 | shop, pocket, step |

L01–L07: the writer reports the removed words when the lessons are done.

## 8. Questions and tasks

- MCQ (4 printed of 10): at least 2 test a target objective (L03: "What do you do after you glue the tube?"; L05: "Where do Tom and Ben meet?"; L08: "How much is the pencil?"; L10: "Who was third?").
- Short answer (1): a personal question in the lesson frame (L03: "What do you make first? Then?"; L06: "What do you prefer? Why?"; L12: "What job do you want?").
- Writing: a personal version of the text type (L03: "Write steps to make something." L05: "Write a note to a friend: where and when to meet." L08: "Write a price list for your shop." L12: "Write about a job and one day of that job.").
- Listening objectives (L-ids) are tested through the audio of the text: the question uses the words that the voice says. L28.4 (L02) needs repeated lines in the audio with a pause after each. L29.2 (L08, L13, L14) needs prices, times, and dates said slowly.

## 9. Questions for Daniel

1. **Money in L08, L13, and L14.** L29.2 needs prices. This map uses the Thai *baht* with prices in words (*fifteen baht*). Option A: keep *baht*. Option B: use no currency and give prices as plain numbers of coins.
2. **Dates in L10 and L13.** R29.6 needs ordinal numbers in words, and L29.2 needs dates. This map uses Saturday the thirteenth of March, the tenth of April, and the twentieth of March (all Saturdays in 2027). The Quest 5 dates were in November. Option A: keep these dates (the Quest 6 school year then runs from the new year to April). Option B: use dates without a month.
3. **Foreign tale in L02.** *The Three Goats and the Bridge* is a Norwegian tale. This map uses a bear, not a troll. Grandpa tells it. The bible asks for "an animal tale; no gods, no monks, no religion". Option A: keep it. Option B: use a Thai animal tale that you choose (Quest 6.1 L09 is a runaway-food tale).
4. **New places.** L04 (a beach), and L07 and L13 (the school hall) are not in the bible list of places. The bible says "do not add proper names", and these have none. Option A: keep them. Option B: use the park or the school field.
5. **Tom and Ben alone (L05).** The two boys (12) plan a bike ride and meet at the library at a quarter past ten. They have no adult with them. Option A: keep it. Option B: Dad or Grandpa goes with them, and L05 keeps the notes.
6. **Aunt Sue and Chiang Mai (L14).** Aunt Sue is a nurse in Chiang Mai (a Quest 5 fact). L14 sends her a drawing by post. Do you accept *Chiang Mai* again in a lesson that does not teach R24.5?
7. **One Movers word in each lesson.** The `quest-6` profile allows 1 Movers word at most. This map gives each lesson 1 Movers word that an earlier package glossed. The Starters word in each lesson (14 in all) are simple words (for example *bear, sand, shop*). Option A: keep them. Option B: replace each Starters word with one more Flyers word that was glossed before.

**Lead decisions for the writers (2026-10-06).** Daniel reviews the finished lessons, so these choices are provisional. Questions 1–7: option A. In L05, Mom's note on the fridge shows that Mom knows the plan.

## Revision history

- 0.1 — 2026-10-06 — First version (track levels_5_9_20261006).
- 0.3 — 2026-10-06 — §7: 12 glossed words in each lesson (lead correction) and the removed words.
- 0.2 — 2026-10-06 — Lead decisions for the writers in section 9 (Daniel can change them in his review).
