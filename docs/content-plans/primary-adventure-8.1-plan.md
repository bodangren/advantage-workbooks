# Primary Advantage Adventure 8.1 — Lesson Map

Version 0.2 | Date 2026-10-06 | Status: Draft | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

Track: `levels_5_9_20261006`. Companion files: [`primary-adventure-7.1-plan.md`](primary-adventure-7.1-plan.md) (the model for this map), [`primary-levels-5-9-plan.md`](primary-levels-5-9-plan.md) (§3 band rule, §5 profiles, §6 vocabulary, §7 grammar, §8 cast), [`primary-quest-adventure-series-bible.md`](primary-quest-adventure-series-bible.md) (§2, §4–§7), [`level-plans/levels-5-9-objectives.json`](level-plans/levels-5-9-objectives.json), [`level-plans/bank-8.md`](level-plans/bank-8.md), [`data/grammar-levels-5-9.md`](data/grammar-levels-5-9.md), [`calibration/levels-5-9/l8-story.md`](calibration/levels-5-9/l8-story.md), [`calibration/levels-5-9/l8-info.md`](calibration/levels-5-9/l8-info.md), [`reviews/2026-10-06-prereview-level-5.md`](reviews/2026-10-06-prereview-level-5.md), [`reviews/2026-10-06-prereview-bank-6.md`](reviews/2026-10-06-prereview-bank-6.md), [`../../content/primary/AUTHORING.md`](../../content/primary/AUTHORING.md). The sister maps are [`primary-adventure-8.2-plan.md`](primary-adventure-8.2-plan.md) and [`primary-adventure-8.3-plan.md`](primary-adventure-8.3-plan.md) (written at the same time).

## 1. Summary

Adventure 8.1 is a book of level 8 (A2, `cefr_level = 'A2'`, `ra_level = 8`). It has 14 workbook lessons. Each lesson has 12 glossed words, 2–4 target objectives, and one main grammar point of level 8. QR key: `a8.1/<lesson>`. The book brings the linking words *and, so, but,* and *because* into every text, and it gives the readers their first leaflet, plan with a key, safety rules, weather forecast, announcement, and contents page of level 8.

Text mix: 6 stories and 8 informational or functional texts. The stories are in L02, L05, L08, L11, L13, L14; the other lessons are informational or functional. The book has a traditional story in L11 (*The Crow and the Pitcher*, a fable that Grandma tells at Green Hill). Dates run from Monday, November 2 to Monday, November 30, written in one form, month first (*November 2*; in the text, *November second*). Every weekday agrees with the 2026 calendar. No lesson falls on a public holiday. The two club trips are the town aquarium (Saturday, November 14, L08) and the nature park (Saturday, November 28, L13).

Rule checks (run on this map with a script, 2026-10-06):

- **Book rule:** 19 of 19 objectives of `books["adventure-8.1"].objectives` are a target in 1 or more lessons (section 5.1). 19 of them are a target in 2 or more lessons; 0 in one lesson only. No objective of the `outOfScope` list is a target.
- **Targets per lesson:** every lesson has 2–4 targets (6 lessons have 4, 8 have 3, 0 have 2). The map has 48 target slots and 23 different target objectives: the 19 book objectives and 4 other objectives (section 5.2).
- **Level rule:** each of the 67 in-scope objectives of level 8 is a target in 3 or more packages (Adventure 8.1, 8.2, 8.3, and bank-8). The result is in section 5.3 and is the same in both maps.
- **Words:** every lesson has exactly 12 glossed words (168 in the book), no word twice in the book or in the sister book. Every lesson has exactly 5 new A2 Key words from the free pool (70 new words in the book, all in the pool list, none glossed by any earlier package), and 7 words that earlier packages glossed (92 Flyers, 6 A2 Key; 68 of the 98 come from Adventure 7). No lesson has a B1 word (section 7).
- **Questions and dialogue:** 14 of 14 lessons plan a real question (the brief shows it in quotation marks). All 6 stories have dialogue; 8 functional lessons add speech, a call, an announcement, or reader questions.

**Cast (series bible §2–§4):** Adventure 8.1, 8.2, and 8.3 are the middle of Lily's last year of primary school (P6), from November 2026 to January 2027; this book is November. Tom and Ben are 13 (M2). Sam is 12 (M1). May is 12. Lily, Mia, and Leo are 11 in Teacher Kim's class. Pat is 9. Nobody has a birthday in this book, so no age changes. The facts of levels 5–7 stay: no age is given for Grandma or Grandpa; Aunt Sue is a nurse who lives in a city in the north; Mia's mom is a doctor and her kitten is Snow; May and Pat live with their parents, their grandma, and the parrot Bill; Green Hill is the grandparents' village; Hugo is a boy in Tom's class; Mom's and Dad's jobs are not in the text. The club is the Explorers (Teacher Kim runs it; it meets on Thursday after lunch in the school library). Trips of this book: the town aquarium (L08) and the nature park (L13); no place comes twice in a row. Pen pals (Nadia and Ravi, with Ms. Ong in the background) are in 4 lessons (L04, L09, L12, L14) and never in more than 4 lessons in a row. Pip is in 4 lessons (L05, L06, L11, L14); he does not go on a trip and does not meet a pen pal. New adults: Nurse Jill (L10) and Ranger Mark (L13); an aquarium keeper (L08) gets one full look. Hugo is in L05. The only proper place names are *Thailand*, *Singapore*, and *Green Hill* (*Singapore* only in text, never in a picture line).

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

Level 8 uses the A2 Key list on top of the Movers and Flyers grammar of levels 5–7. The first A2 Key grammar comes in here: *How much / How many / How long ...?*, *whose*, gerunds, *too*, *a few / a little*, *needn't / don't have to*, *would* for requests, *that* clauses, the first conditional, the present perfect with *for / since*, and the present continuous for arrangements. Each lesson has one main point (section 6). Voice follows bible §7: a close third person in the past simple for stories (the present perfect and the first conditional may be in speech); a named writer for a blog post, a diary entry, or an email (*Posted by Mia*, *Dear Leo, ... Best wishes, Ravi*); headings and no "I" in an informational text of the club or the school; a leaflet, a booklet, a sign, or a forecast speaks to the reader. The linking words *and, so, but,* and *because* come in every lesson (bible §7).

## 3. Lesson map

Targets are A2 key ids (`a2-objective-key.json`, GSE 33–36 for this book, plus a few other objectives that section 5.2 names). "Supporting" lists the objectives that the text will clearly practice. Writers add other objectives of level 8 or below where the text practices them. Words are in section 7.

| # | Title | Date | Text type | Genre | App | Cast and place | Targets | Supporting | Main grammar |
|---|---|---|---|---|---|---|---|---|---|
| L01 | Our Aquarium Leaflet | Monday, November 2 | functional: a leaflet for a trip | Places & Directions | nonfiction | Teacher Kim, Lily, Mia, Leo, May; the classroom | R34.6, R34.8, R34.3 | R34.1, R34.4, L33.4, R30.4 | How much / How many / How long? (also: a lot of) |
| L02 | Pat Looks for a Hobby | Tuesday, November 3 | story: a talk about hobbies | Family & Friends | fiction | Pat, May, Lily, Mia, the parrot Bill; the garden of the white house | L33.3, R34.2, R34.4 | L33.1, L33.2, R34.1, R31.2 | gerunds (enjoy + -ing, good at + -ing) (also: too) |
| L03 | Our Way Through the Aquarium | Thursday, November 5 | functional: a plan with a key, and a talk about it | Places & Directions | nonfiction | Leo, Mia, Lily, May, Teacher Kim; the school library (club hour) | R33.6, R32.4, R34.1, L34.2 | R34.3, R34.6, L33.2, R31.2 | prepositions of direction (also: How long?) |
| L04 | Nadia's Pool Rules | Saturday, November 7 | functional: an email with safety rules | Sports & Leisure | nonfiction | Nadia (by email), Mia; Mia's desk at home | R34.10, R34.5, R34.1 | R34.4, R34.3, R33.1, R30.4 | needn't / don't have to (also: because) |
| L05 | Two Red Balls | Monday, November 9 | story: a mix-up, with pronouns to follow | Pets & Animals | fiction | Tom, Ben, Hugo, Pip; the park | R38.4, L33.3, R34.2, L34.2 | R33.5, L33.1, L33.2, R31.2 | whose (also: too) |
| L06 | Rain or Sun on Saturday? | Wednesday, November 11 | functional: a weather forecast and a plan | Weather & Seasons | nonfiction | Lily, Tom, Pip; the kitchen at home (a radio) | L34.1, L33.1, R34.8 | R34.3, R34.1, L33.2, R27.2 | first conditional (also: present continuous for the future) |
| L07 | The Bus Leaves at Half Past Eight | Friday, November 13 | functional: a school announcement and a note from Mom | School | nonfiction | Teacher Kim, Lily, Leo, Mia, May; the school hall and the kitchen | L33.4, R34.5, L34.1 | L33.1, L33.2, R34.1, R33.1 | present continuous for arrangements (also: would for requests) |
| L08 | The Shy Octopus | Saturday, November 14 | story: a trip to the aquarium | Pets & Animals | fiction | Mia, Leo, Lily, May, Teacher Kim, an aquarium keeper; the aquarium | R33.4, R33.5, L33.2, R34.4 | R34.2, L33.1, R34.1, L31.1 | present perfect with for / since (also: linking words) |
| L09 | Mia's Fact File: Seahorses | Monday, November 16 | functional: an animal fact file, a blog post | Pets & Animals | nonfiction | Mia (writer), Nadia (named in the post), Lily; Mia's desk at home | R34.7, R34.3, R38.5 | R34.8, R34.1, R33.2, R31.5 | a few / a little / many / much / a lot of (also: participles as adjectives) |
| L10 | Nurse Jill's First-Aid Booklet | Thursday, November 19 | functional: a booklet with a contents page and safety tips | Health & Body | nonfiction | Nurse Jill, Lily, Mia, Leo, May, Teacher Kim; the school library (club hour) | R34.9, R34.10, R34.6 | R34.3, R34.1, L33.2, R27.4 | would for polite requests (also: participles as adjectives) |
| L11 | The Crow and the Pitcher | Saturday, November 21 | story: a traditional tale told by Grandma | Pets & Animals | fiction | Grandma, Lily, Tom, Pip; Green Hill, the grandparents' village | R33.4, R33.5, R34.2, L33.2 | R31.6, R34.4, L33.1, R34.1 | first conditional (also: too) |
| L12 | Ravi's Badminton Email | Monday, November 23 | functional: an email about a sport, with pictures | Sports & Leisure | nonfiction | Ravi (by email), Leo, Lily; the library computer | R34.7, R34.8, R34.1 | R34.5, R34.3, R33.1, R30.4 | gerunds as subject (also: How often ...?) |
| L13 | The Path to the Bird Hide | Saturday, November 28 | story: a trip to the nature park, with a trail map | Nature & Outdoors | fiction | Ranger Mark, Lily, Mia, Leo, May, Teacher Kim, a visitor; the nature park | R33.6, R30.5, L33.4, L33.1 | R34.2, R34.10, R34.1, R30.1 | that clauses (also: prepositions of instrument) |
| L14 | The Missing Page | Monday, November 30 | story: a club book with a contents page | School | fiction | Lily, Teacher Kim, Mia, Leo, May, Pip; the school library and Lily's home | R34.9, R34.4, R33.4, R33.5 | R34.2, L33.1, R34.1, R30.7 | too (also: (not) as ... as) |

Notes:
- Pen pals: L04 (Nadia's email), L09 (Mia's post names Nadia), L12 (Ravi's email), L14 (the contents page lists a page of pen-pal letters). The pictures show the laptop screen with the email text in double quotation marks, never the pen pal (their sheets are in progress).
- Pip: L05, L06, L11, L14. Pip is never the narrator and does not read an email. In L11 he comes with Lily and Tom to Green Hill; he does not go on a club trip.
- L08 and L13 are the club trips of November (the aquarium, then the nature park). L03, L06, and L07 prepare the first trip; L10 prepares the second. L14 is the review lesson: it uses a contents page, the articles of the month, and a first-person check of the work.
- L11 is the traditional tale of the book. Grandma tells it, so the narrator of the tale is clear.
- Leaflets, plans, signs, announcements, a booklet page, and notes (L01, L03, L07, L10, L13, L14) show their words in double quotation marks, exactly as in the text. Section 4 gives them.
- Dates and times: the aquarium is open Tuesday to Sunday, 9:00 a.m. to 5:00 p.m., and the feeding shows are at 10:00 a.m. and 2:00 p.m. (L01, L03, L08). The bus leaves at 8:30 a.m. on November 14 (L07). The forecast (L06) says dry in the morning and rain after 2:00 p.m. on Saturday, November 14.

## 4. Lesson briefs and pictures

Each brief gives who, where, what happens, and how it ends. Each lesson has a hero picture and two inline pictures. Sign, poster, leaflet, notice, map, blog, and email text is in double quotation marks, as in AUTHORING §6. The briefs write some numbers as figures so that the reader can check them; the lesson text writes every number, time, date, and price as words (section 2). Cast looks are not described when a cast sheet exists. A person outside the cast gets a full look at first mention; Ranger Mark, Guide Ann, Chef Lucy, and Nurse Jill use the look line of the bible (§6), and Hugo uses the look of Adventure 7.1. No child is in distress, on a bed, or with a hand on the face. No picture line names Singapore or the pen-pal school. A pen pal never appears in a picture; an email is text on a screen.

### L01 Our Aquarium Leaflet

Text type: functional: a leaflet for a trip. Genre: Places & Directions. App type: nonfiction. Place: the classroom.

On Monday, November 2, Teacher Kim gives each Explorer a leaflet for the club trip to the town aquarium on Saturday, November 14. It gives the opening days and hours, two prices per person (children sixty baht, adults one hundred twenty baht, and a map is included in the price), two feeding shows (ten o'clock and two o'clock), and two rules. It also says that the shark tunnel is thirty meters long and that the visitors find the jellyfish room and the cafe indoors. Leo asks, "How much is a ticket for a child?" and May finds the price. Mia asks, "How long is the shark tunnel?" and Lily reads the number. Leo says he wants the first show, so Mia circles "10:00 a.m." in pencil.

- hero: Teacher Kim stands at the front of the classroom and holds up a leaflet. Its front shows a blue shark above the words "DISCOVER THE SEA" and a smaller line "The Town Aquarium". Lily, Mia, Leo, and May sit at their desks, each with a copy.
- inline-para-2: The open leaflet: "OPEN: Tuesday to Sunday, 9:00 a.m. to 5:00 p.m.", "Children: 60 baht per person", "Adults: 120 baht per person (a map is included)", "Feeding shows: 10:00 a.m. and 2:00 p.m.", with drawings of a jellyfish and a cafe cup.
- inline-para-3: The back of the leaflet: "The shark tunnel is 30 meters long.", "Guests must not touch the glass.", "No food in the tunnel." Leo points at a number; May writes the child price in her notebook; Mia circles the first show with a pencil.

### L02 Pat Looks for a Hobby

Text type: story: a talk about hobbies. Genre: Family & Friends. App type: fiction. Place: the garden of the white house next to the school.

On Tuesday, November 3, at four o'clock, Pat must bring a poster called "My Hobby" to school on Friday, but he has no hobby. He asks, "What do you enjoy doing?" May says, "I enjoy singing, and my friend is a dancer." Lily says, "I like drawing, but I am not good at dancing," and Mia says, "I enjoy taking photos of animals." Pat tries singing, but it is too loud, and the parrot Bill says, "Good morning!" at the wrong time. He draws a horse that looks like a dog, and then he tries a hip hop step with May. At last Pat finds his old roller skates and says, "Skating is fun. I am a beginner, but I will practice." Lily says, "If you practice every day, you will be good," and Pat writes "MY HOBBY: SKATING" on his poster.

- hero: A garden behind a white house with a green lawn. Pat holds a blank poster board. May, Lily, and Mia sit on a wooden bench with a songbook, a drawing pad, and a camera. On the veranda, a green parrot sits in a cage.
- inline-para-2: Pat stands on the lawn with his mouth wide open, singing; May claps with a smile; Lily and Mia laugh; the green parrot on the veranda flaps his wings.
- inline-para-3: Pat sits on the garden path in roller skates, a helmet, and knee pads and holds up a poster: "MY HOBBY: SKATING" with a drawing of a roller skate. May, Lily, and Mia smile and clap.

### L03 Our Way Through the Aquarium

Text type: functional: a plan with a key, and a talk about it. Genre: Places & Directions. App type: nonfiction. Place: the school library (club hour).

On Thursday, November 5, in the club hour, Teacher Kim gives each pair a plan of the aquarium with a key. The key shows a fish for a tank, a cup for the cafe, a bag for the shop, a figure for the toilets, and an arrow for the exit. Leo, Mia, Lily, and May plan a walk: start at the entrance, go through the shark tunnel, turn left at the jellyfish room, go past the cafe, and walk along the wide path to the outdoor seal pool. Leo asks, "Where is the octopus?" and Mia answers, "Next to the shark tunnel." Leo says, "Next to the tunnel?" and Mia says, "Yes, on the left side of the tunnel." Lily draws the walk in red, and May writes the order of the rooms. The shop is shut from twelve to one, so they plan lunch at the cafe.

- hero: A large plan of the aquarium lies on a library table. Rooms are drawn in blue, green, and yellow and are labeled "ENTRANCE", "SHARK TUNNEL", "JELLYFISH ROOM", "OCTOPUS TANK", "OUTDOOR SEAL POOL", "CAFE", "SHOP", and "EXIT". A key box in one corner says "KEY: fish = tank, cup = cafe, bag = shop, arrow = exit". Leo, Mia, Lily, and May stand around the table; Lily holds a red pencil.
- inline-para-2: Lily draws a red line on the plan from "ENTRANCE" through "SHARK TUNNEL" and "JELLYFISH ROOM" to "OUTDOOR SEAL POOL"; Mia points to "OCTOPUS TANK", which is drawn next to the shark tunnel; Leo leans over the table.
- inline-para-3: Teacher Kim holds a stack of plans at the end of the table. May writes in her notebook: "1 Entrance, 2 Shark tunnel, 3 Jellyfish room, 4 Cafe, 5 Seal pool".

### L04 Nadia's Pool Rules

Text type: functional: an email with safety rules. Genre: Sports & Leisure. App type: nonfiction. Place: Mia's desk at home.

On Saturday, November 7, Mia opens an email from her pen pal Nadia. Nadia writes in the first person: "Dear Mia, here are the rules of my swimming pool." The email lists six rules: shower before you swim; do not run on the wet floor; do not jump into the shallow end, because it is dangerous; children under twelve cannot swim alone, except in the small pool; you don't have to wear a cap, but you must tie long hair; be polite to the lifeguard. Nadia says that swimming is good exercise and asks, "Does your town pool have rules, too?" She ends "Best wishes, Nadia. P.S. Please say hello to Snow and Pip." Mia writes back that she will photograph the signs at the town pool.

- hero: Mia sits at a desk in front of a laptop. The screen shows an email headed "Dear Mia," with the title "POOL RULES" and six numbered lines. Snow, a small white kitten, sits beside the laptop.
- inline-para-2: Six pictograms in a row, each beside its rule: a shower; a running figure with a red cross over it; a jumping figure with a red cross over it; an adult and a child swimming together; a swimming cap with long hair; a lifeguard in a high chair. Above them a sign: "DANGER: DEEP WATER".
- inline-para-3: Mia's notebook with a drawing of a pool with a shallow end and a deep end, and the heading "Questions for Nadia" with two lines underneath.

### L05 Two Red Balls

Text type: story: a mix-up, with pronouns to follow. Genre: Pets & Animals. App type: fiction. Place: the park.

On Monday, November 9, at four o'clock, Tom brings Pip to the park to meet Ben and Hugo, a boy in Tom's class. Tom and Hugo each have a red football, and the two balls look the same. While the three boys talk about what they like doing (Tom wants to be a football player, Hugo plays chess, and Ben draws), Pip takes one ball and runs across the grass. Tom says, "That is my ball!" and Hugo says, "No, it is mine!" Ben asks, "Whose ball is it?" and looks at the white patch on the ball. A name is written there in black marker: "HUGO". Pip then brings the other ball, and Tom writes his own name on it.

- hero: On a grass field, Tom and Ben stand with Hugo (a thirteen-year-old boy with short black hair, in the same white shirt and dark blue shorts as the others). Tom and Hugo each hold an identical red football. Pip sits between them, with his red collar. Three school bags lie on a bench under a tree.
- inline-para-2: Pip runs across the grass with a red ball in his mouth; the three boys run after him with open hands; the other red ball lies on the grass behind them.
- inline-para-3: Ben holds a red football and points to a white patch on it where a name is written in black marker: "HUGO". Hugo smiles; Tom holds the other ball and a black marker; Pip sits at their feet.

### L06 Rain or Sun on Saturday?

Text type: functional: a weather forecast and a plan. Genre: Weather & Seasons. App type: nonfiction. Place: the kitchen at home.

On Wednesday, November 11, at seven o'clock in the evening, Lily, Tom, and Dad listen to the radio forecast for the next three days. The presenter says, "Thursday is sunny and hot, thirty-three degrees. Friday is cloudy. On Saturday it is dry in the morning, but rain is possible after two o'clock, with a thunderstorm in the afternoon; the season is changing." Lily writes notes and asks, "Will it rain on Saturday morning?" Dad answers, "Not in the morning, but probably after two." Lily says, "If it rains in the afternoon, we will stay in the cafe," and Tom says, "If Sunday is dry, Ben and I are riding to the lake." When Pip hears the word "umbrella", he drags Lily's umbrella to the door.

- hero: A kitchen in the evening. A small radio stands on the table. Lily writes on a notepad; Tom sits across from her; Dad stands near the stove. Pip stands at the door and holds the handle of a yellow umbrella in his mouth.
- inline-para-2: Lily's notepad with her notes: "Thu: sunny, 33 degrees", "Fri: cloudy", "Sat: dry in the morning, storms after 2:00 p.m.", with small drawings of a sun, a cloud, and a lightning bolt.
- inline-para-3: Pip drags the yellow umbrella across the kitchen floor; Lily laughs; Tom points at the radio; a clock on the wall shows seven o'clock.

### L07 The Bus Leaves at Half Past Eight

Text type: functional: a school announcement and a note from Mom. Genre: School. App type: nonfiction. Place: the school hall and the kitchen at home.

On Friday, November 13, Teacher Kim makes the morning announcement in the school hall: "Good morning, Explorers. Tomorrow, Saturday, we are going to the aquarium. We are meeting at the school gate at eight o'clock, and the bus is leaving at half past eight. Please bring a hat, a bottle of water, and the signed form. It will be dry in the morning. If the bus is delayed, we will wait in the library." Teacher Kim asks, "Does everybody have the signed form?" Lily writes the details in her notebook, and Leo whispers a joke to Mia. That evening Lily finds a note from Mom on the fridge: "Lily, I signed your form. Dad will take you to the gate at ten to eight. Please give me a call if the bus is delayed. Good luck! Love, Mom."

- hero: The school hall in the morning. Teacher Kim stands at a microphone on a stand. A board behind her says "EXPLORERS' TRIP: SATURDAY, NOVEMBER 14", "Meet at the school gate: 8:00 a.m.", "The bus leaves at 8:30 a.m." Children sit on the floor in rows; Lily, Leo, Mia, and May are in the front row.
- inline-para-2: Lily writes in a notebook on her knee; her list says "hat, water, form". Leo leans toward Mia and smiles.
- inline-para-3: A fridge door with a note under a magnet: "Lily, I signed your form. Dad will take you to the gate at 7:50. Please give me a call if the bus is delayed. Good luck! Love, Mom." On the table below: a backpack, a hat, and a water bottle.

### L08 The Shy Octopus

Text type: story: a trip to the aquarium. Genre: Pets & Animals. App type: fiction. Place: the town aquarium.

On Saturday, November 14, the Explorers reach the aquarium at half past nine, watch the ten o'clock feeding show, and arrive at the octopus tank at half past ten. An aquarium keeper says, "The octopus is shy. If you wait quietly, it will come out." Mia has waited at the glass for twenty minutes, since half past ten, and she still holds her digital camera ready. Lily asks, "Is it still in the pot?" Leo whispers, "Perhaps he has gone shopping," and May laughs quietly. The octopus changes color to hide itself on a rock. At ten to eleven one long orange arm comes out of the clay pot, and Mia takes the photo. Teacher Kim says, "Mia waited, so we all saw a real octopus."

- hero: A large aquarium tank with rocks and a clay pot. One orange octopus arm comes out of the pot. Mia stands at the glass with a digital camera; Lily, Leo, and May stand behind her. A keeper (a woman of about thirty with a short black bob, a navy blue polo shirt with a small fish badge, gray trousers, and black boots) stands at the side and points at the pot. Teacher Kim stands near the group.
- inline-para-2: Leo leans toward May and whispers, with a big smile; May holds her notebook and smiles; Mia keeps her camera up and looks at the tank.
- inline-para-3: Close view of the tank glass: the octopus, red-orange, holds the glass with its arms; the children's faces are reflected in the glass; Mia's camera is in the middle of the picture.

### L09 Mia's Fact File: Seahorses

Text type: functional: an animal fact file, a blog post. Genre: Pets & Animals. App type: nonfiction. Place: Mia's desk at home.

On Monday, November 16, Mia writes the blog post "Mia's Fact File: Seahorses" ("Posted by Mia"). It has three headings: "Where seahorses live", "What seahorses eat", and "Why seahorses are special". Mia writes that seahorses live in warm, shallow sea among sea grass. The seahorse at the aquarium is about twelve centimeters tall and weighs about nine grams, and it eats a lot of tiny animals every day. There are about forty kinds of seahorses, in various colors. The father carries the eggs in a pouch, a small bag on his body, for about two weeks. Mia asks, "Did you know that?" and ends, "P.S. Nadia asked me about seahorses. This post is for her." Lily reads it over her shoulder and says, "A few facts are new to me."

- hero: Mia sits at her laptop. The screen shows a blog page headed "MIA'S FACT FILE: SEAHORSES", with the line "Posted by Mia" and a photo of a small yellow seahorse next to a ruler. Lily sits beside her.
- inline-para-2: A photo: a seahorse holds a blade of sea grass with its tail; the caption says "A seahorse is about 12 centimeters tall."
- inline-para-3: Mia's notebook with a drawing of a father seahorse with a round pouch on his body. An arrow points to the pouch and a label says "pouch". Above it the heading "Why seahorses are special".

### L10 Nurse Jill's First-Aid Booklet

Text type: functional: a booklet with a contents page and safety tips. Genre: Health & Body. App type: nonfiction. Place: the school library (club hour).

On Thursday, November 19, Nurse Jill comes to the club hour with a first-aid kit and a booklet for the park trip. She says, "Would you open the booklet at the contents page?" The contents page lists five parts with page numbers: cuts and scrapes (page two), insect bites (page four), sunburn (page six), hot days (page eight), and when to ask an adult (page ten). Leo asks, "Which page has insect bites?" and May answers, "Page four." Nurse Jill shows how to wash a small cut with clean water and cover it with a clean bandage, and she practices on Leo's finger, which has no cut. She says, "Medicine from the pharmacy is for adults to give. Is everyone alright?" Mia says, "This booklet is useful."

- hero: Nurse Jill (a woman of about thirty-five with a black bun, a white short-sleeved uniform with a small red cross on the pocket, and white shoes) stands at a library table with an open green first-aid kit. A booklet lies in front of each child: Lily, Mia, Leo, May, and Teacher Kim sit around the table.
- inline-para-2: The open booklet: the title "STAY SAFE ON THE TRAIL" and a list "Cuts and scrapes ... 2", "Insect bites ... 4", "Sunburn ... 6", "Hot days ... 8", "When to ask an adult ... 10".
- inline-para-3: Nurse Jill wraps a white bandage around Leo's finger on the table; Leo holds his hand up and grins; Mia and May watch; a box marked "FIRST AID" stands open beside them.

### L11 The Crow and the Pitcher

Text type: story: a traditional tale told by Grandma. Genre: Pets & Animals. App type: fiction. Place: Green Hill, the grandparents' village.

On Saturday, November 21, Dad takes Lily, Tom, and Pip to Grandma and Grandpa's house at Green Hill. It is a hot afternoon after lunch, and the children sit on the porch steps with cold water. Grandma says, "If you put stones in a glass of water, what will happen?" Then she tells "The Crow and the Pitcher": a thirsty crow finds a pitcher with a little water at the bottom, but its beak cannot reach it. "If I push it over, the water will run away," thinks the crow, so it drops small stones into the pitcher one by one until the water is high enough, and it drinks. Tom tries the same idea with a glass and pebbles, and Pip drinks from his bowl. Grandma says, "A clever idea can solve a problem."

- hero: The porch of a wooden house. Grandma sits on a chair and tells the story with her hands. Lily and Tom sit on the steps; Pip lies on the porch with the red ball. A tall clay pitcher stands on a small table.
- inline-para-2: A storybook picture: a black crow stands on a table next to a tall clay pitcher with a little water at the bottom; the crow looks into the pitcher; small pebbles lie on the table.
- inline-para-3: Tom kneels at a low table and drops a pebble into a tall glass of water; the water is nearly at the top; Lily watches; Pip drinks from a red bowl on the floor.

### L12 Ravi's Badminton Email

Text type: functional: an email about a sport, with pictures. Genre: Sports & Leisure. App type: nonfiction. Place: the library computer.

On Monday, November 23, after school, Leo and Lily read an email from Ravi at the library computer. Ravi writes in the first person: "Dear Leo, I play badminton on Tuesdays and Fridays at the sports center near my school. Playing badminton is good exercise, and it helps me get fit." He explains the court and the serve, and he says, "I am not a fast runner, but my team won second prize at a school competition last month." He asks, "How often do you play a sport?" He ends "Best wishes, Ravi." Leo writes back, "I play football every Wednesday. Playing football is fun, but I am a slow runner, too." Lily types the answer, and Leo adds a joke.

- hero: Leo and Lily sit at a computer in the school library, with bookshelves behind them. The screen shows an email headed "Dear Leo," and a picture of a badminton court seen from above.
- inline-para-2: A diagram of a badminton court: a rectangle with a net across the middle and labels "net", "back line", and "service line".
- inline-para-3: A badminton racket and a white shuttlecock lie on a blue court floor.

### L13 The Path to the Bird Hide

Text type: story: a trip to the nature park, with a trail map. Genre: Nature & Outdoors. App type: fiction. Place: the nature park.

On Saturday, November 28, the Explorers meet Ranger Mark at the gate of the nature park, which he says is a national park, so the animals are safe there. A loudspeaker says, "Good morning, visitors. The bird walk starts at ten o'clock at the main gate. It takes two hours. Please stay on the path." The trail map has a key, and the children follow it to the bird hide. On the path a woman with a wide straw hat and a camera asks, "Have you seen my friend? He is a tall man in a blue shirt with a green backpack and a white cap." Mia sees him at the lake, and the children take the woman to him. In the hide Ranger Mark says that a kingfisher comes at about five past eleven, Leo hopes that it will, and Mia looks with her guidebook and binoculars. The kingfisher comes, and everybody sits very still.

- hero: Ranger Mark (a man of about forty with short black hair under a green cap, a khaki shirt with two chest pockets, green trousers, and brown boots) stands at the park gate and holds a map board. A wooden sign above the gate says "NATURE PARK: BIRD WALK 10:00 A.M." Lily, Mia, Leo, May, and Teacher Kim stand in front of him.
- inline-para-2: The trail map on a board. Key: "green line = main path, blue wave = lake, roof = bird hide, cup = picnic area, tent = camping area (closed)". Labels: "GATE", "LAKE", "BIRD HIDE".
- inline-para-3: Inside a wooden bird hide with a long window: the children sit on a bench and look through binoculars; outside, a blue and orange kingfisher sits on a branch above the water; Ranger Mark smiles and points at the branch.

### L14 The Missing Page

Text type: story: a club book with a contents page. Genre: School. App type: fiction. Place: the school library and Lily's home.

On Monday, November 30, Teacher Kim gives each Explorer a printed copy of the November Book to check, with a contents page that lists the articles by page: the aquarium leaflet (page two), the shy octopus (page four), seahorses (page six), Nadia's pool rules (page eight), Ravi's badminton email (page ten), and Leo's cartoon (page twelve). Leo says, "My cartoon is last, because the best part comes at the end." At home that evening Lily sorts her copy and finds that one page is missing. She asks, "Which article is on page six?" and the contents page answers: Mia's seahorse article. Pip lies under the sofa with the red ball and a white corner of paper. The page is too wet to read, so Lily prints a new page six and uploads the web page to the blog. She tells Mia, "The contents page showed me the missing page at once."

- hero: A school library table with a stack of printed pages, a stapler, and a printed contents page headed "THE EXPLORERS' NOVEMBER BOOK": "The Aquarium Leaflet ... 2", "The Shy Octopus ... 4", "Seahorses ... 6", "Pool Rules from a Pen Pal ... 8", "A Badminton Email ... 10", "Leo's Cartoon ... 12". Lily and Teacher Kim stand at the table; Leo grins beside them.
- inline-para-2: Lily sits on the floor at home with her pages in two piles and the contents page on her knee; Pip lies under the sofa with the red ball, and a white paper corner sticks out beside him.
- inline-para-3: Lily holds up a page headed "SEAHORSES" with a small seahorse photo; one corner of the page is curled and wet; Pip sits beside her with the red ball.

## 5. Objectives

### 5.1 Book rule: the 19 objectives of `books["adventure-8.1"]`

| Objective | Target in | Text |
|---|---|---|
| R33.4 | L08, L11, L14 | Can identify the overall theme of a simple illustrated story, if guided by questions or prompts. |
| R33.5 | L08, L11, L14 | Can follow the sequence of events in a short text on a familiar, everyday topic |
| R33.6 | L03, L13 | Can understand a key to locate buildings or simple features on a map. |
| R34.1 | L03, L04, L12 | Can understand some simple details in a short text. |
| R34.2 | L02, L05, L11 | Can understand the main points of short, simple dialogues related to everyday situations, if guided by questions. |
| R34.3 | L01, L09 | Can identify key information in short, simple, factual texts. |
| R34.4 | L02, L08, L14 | Can recognise the use of simple linking words e.g. ‘and’, ‘so’, or ‘but’ to connect ideas in a short phrase or sentence. |
| R34.5 | L04, L07 | Can understand short, simple notes from family or friends communicating information of immediate relevance. |
| R34.6 | L01, L10 | Can understand basic details in simple informational texts (e.g. ‘brochures’, ‘leaflets’). |
| R34.7 | L09, L12 | Can understand short paragraphs on subjects of personal interest (e.g. ‘sports’, ‘music’, ‘travel’) if written using simple language and supported by pictures. |
| R34.8 | L01, L06, L12 | Can extract specific information (e.g. ‘facts and numbers’) from simple informational texts related to everyday life (e.g. ‘posters’, ‘leaflets’). |
| R34.9 | L10, L14 | Can use a simple contents page to locate information. |
| R34.10 | L04, L10 | Can understand safety instructions if expressed in simple language and supported by pictures. |
| L33.1 | L06, L13 | Can recognise simple phrases related to familiar topics in slow, clear speech. |
| L33.2 | L08, L11 | Can identify basic factual information in short, simple dialogues or stories on familiar everyday topics, if spoken slowly and clearly. |
| L33.3 | L02, L05 | Can understand the main information in short, simple dialogues about someone’s hobbies and interests, if spoken slowly and clearly and supported by pictures. |
| L33.4 | L07, L13 | Can identify key information (e.g. ‘day’, ‘date’, ‘location’) in short announcements about events, if spoken slowly and clearly. |
| L34.1 | L06, L07 | Can get the gist of a short weather forecast, if delivered slowly and clearly and supported by pictures. |
| L34.2 | L03, L05 | Can identify specific information in short, simple dialogues, if there is some repetition and rephrasing. |

Result (script check, 2026-10-06): 19 of 19 objectives are a target in 1 or more lessons. None is missing. Every lesson has exactly 12 glossed words and exactly 5 new A2 Key words from the free pool (script check, section 7).

### 5.2 Other targets

Four targets of this book are not on its first-teaching list. R32.4 (L03, a plan with key buildings; 1 earlier practice) and R30.5 (L13, a person found from a description of looks and clothes; 0 earlier practice) come from the band objectives with the lowest practice counts. R38.4 (L05, what a pronoun or noun refers to) and R38.5 (L09, familiar words in new contexts) are objectives of level 8 (GSE 38) that Adventure 9.1 teaches first; bank-8 gives each only 2 targets, so the level rule needs a workbook target (section 5.3). The supporting objectives in section 3 give the other objectives practice. Writers may add A1 objectives (for example R27.2, R27.4, L26.4) as supporting objectives where the text practices them.

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
| How much / How many / How long / How often ...? | L01 | L03, L12 |
| whose | L05 | - |
| prepositions of direction and instrument | L03 | L13 |
| needn't / don't have to | L04 | - |
| first conditional | L06, L11 | - |
| present continuous for the future and arrangements | L07 | L06 |
| present perfect with for / since | L08 | - |
| a few / a little / many / much / a lot of | L09 | L01 |
| would for polite requests | L10 | L07 |
| that clauses | L13 | - |
| gerunds (as subject and object, enjoy / good at + -ing) | L02, L12 | - |
| too (degree) | L14 | L02, L05, L11 |
| (not) as ... as (GSE only) | - | L14 |
| participles as adjectives | - | L09, L10 |

Avoid at level 8: *used to*, the passive, reported speech, the past perfect, the second conditional, the present perfect continuous, and *will be able to*. *If* starts only a first conditional (*If it rains, we will stay in the cafe.*) or a zero conditional. *(Not) as ... as* is GSE only: use it in short examples.

## 7. Words

Each lesson glosses 12 words: 5 new A2 Key words of the free pool (`a8-pool-A`: 222 words that no package or draft glosses; the Adventure 8.3 map has a separate list), and 7 words that earlier packages glossed (the words of Adventure 7 first, then other earlier lessons). The words of a lesson fit its text. American spelling. No word is glossed twice in the two books. No lesson has a B1 word.

| # | New A2 Key words (free pool) | Flyers words glossed before | A2 Key words glossed before |
|---|---|---|---|
| L01 | per, including, guest, indoors, discover | information, entrance, exit, group, tour, special, hour | - |
| L02 | singing, dancer, skating, beginner, hip hop | interested, prefer, collect, drum, instrument, puzzle, popular | - |
| L03 | outdoor, further, wide, against, shut | corner, straight on, bridge, through, past, turn, way | - |
| L04 | danger, cannot, except, polite, exercise | deep, follow, hurry, stay, ready, remember, without | - |
| L05 | football player, each other, own, moment, probably | fetch, decide, mix, happen, sure, together, instead | - |
| L06 | thunderstorm, season, degree, possible, nearly | tomorrow, tonight, later, storm, dark, warm, umbrella | - |
| L07 | good morning, form, delayed, luck, give somebody a call | arrive, leave, early, meet, quarter, member, soon | - |
| L08 | anymore, itself, real, digital camera, even | octopus, creature, suddenly, whisper, appear, excited, still | - |
| L09 | centimeter, gram, life, various, less | ocean, wild, nest, fast, enormous, insect, once | - |
| L10 | health, kit, pharmacy, useful, alright | bandage, medicine, cut, finger | advice, helpful, adult |
| L11 | fill, impossible, success, however, oh dear! | stone, full, empty, land, search, hard, believe | - |
| L12 | court, get fit, sports center, serve, runner | team, win, winner, gym, usually, club, competition | - |
| L13 | national, guidebook, camping, local, raincoat | path, gate, hill, stream, explore | visitor, wildlife |
| L14 | article, paragraph, print, upload, web page | magazine, missing, finish, project, keep, disappear | title |

Counts (script check, 2026-10-06): 14 lessons x 12 = 168 glossed words, 168 different in this book, 336 different in the two books together (0 duplicates). New A2 Key words: 70 (5 in every lesson), all in the free pool, none glossed by any file of `content/primary/*/src`. Words glossed before: 98 (Flyers 92, A2 Key 6, at most 3 in a lesson); 68 of them were glossed in Adventure 7, the others in earlier books or banks. No Movers word and no B1 word.

Word notes for writers:
- **New A2 Key words.** Each is new. Give it a glossary entry with the sense of the text and a simple example. Phrases (*first of all, by the way, try on, give somebody a call, oh dear!*) get one entry. The brief shows where most of the words fit; the writer places the others in the text.
- **Spelling.** The pool lists British headwords. Write the American form: *sports center* (pool: *sports centre*), *license* (*licence*), *harbor*. The pool words *colour*, *favourite*, and *cafe* are left out on purpose: *color*, *favorite*, and *café* are glossed in earlier packages already (levels 1–5), so they are not new.
- **Swap rule.** A writer can swap at most 2 words of a lesson for words of the same topic that no other lesson of the two books uses. A2 Key swaps come from the free pool (`a8-pool-A.md`). Tell the lead which, so that the counts stay true.
- **Months, times, and numbers.** Months, weekdays, *a.m.*, *p.m.*, *baht*, and figures in times, prices, and dates are allowed in Adventure (bible §5) but the converter refuses digits in the text, so the text writes them as words. Put the weekday and month names in `allow` if the check marks them.
- **Names.** *Thailand*, *Explorers*, and the names of the cast go in `names` or `allow`.

## 8. Questions and tasks

- MCQ (4 printed of 10): at least 2 test a target objective (L01: "How much is a ticket for a child at the aquarium?"; L03: "Where is the octopus tank?"; L04: "Who cannot swim alone?"; L06: "What will the weather be like on Saturday morning?"; L07: "What time does the bus leave?"; L10: "On which page are insect bites?").
- Short answer (1): a personal question in the lesson frame (L02: "What do you enjoy doing? Why?"; L04: "What rules does a pool near you have?"; L12: "How often do you play a sport?"; L13: "Which bird would you like to see? Why?").
- Writing: a personal version of the text type (L01: "Write a leaflet for a place in your town." L03: "Draw a plan of your classroom with a key." L04: "Write three safety rules for a pool." L10: "Write a contents page for a booklet of your own." L12: "Write an email about a sport that you like." L14: "Write a contents page for your class blog.").
- Listening objectives (L-ids) are tested through the audio of the text: the question uses the words that the voice says. L06 and L07 need one voice for each speaker and a clear radio or hall voice (plan D5). L33.2 and L34.2 (L03, L05, L08, L11) need the spoken repeat and rephrase of the text; the question must not use a word of the picture only.

## 9. Questions for Daniel

1. **Calendar and trips.** The book runs from Monday, November 2 to Monday, November 30 and has two club trips (aquarium, nature park), in a month in which the bible plans one trip. The Adventure 8.2 map starts on December 1 and Adventure 8.3 should start in January. Option A: two trips in each book, as in Adventure 7.2. Option B: one trip in each book and one place only (a book then has one trip place and the school).
2. **Public days.** No lesson falls on a public holiday and no text names a holiday (Loy Krathong is on Tuesday, November 24; it has no lesson). Option A: keep holidays out of the books. Option B: add one secular school day to a book.
3. **New facts.** A town aquarium with a shark tunnel and an octopus (L01, L03, L08); Nurse Jill's booklet for the trip (L10); Ravi's badminton team and a sports center (L12); a national park (the nature park, L13). Do you accept them? Option A: accept. Option B: drop the fact and the writer takes a swap.
4. **Traditional tale.** *The Crow and the Pitcher* is a fable that Grandma tells at Green Hill (L11). Option A: keep it (the bible lets Grandma tell a traditional animal tale). Option B: use a Thai animal tale that you choose.
5. **Pen pals in pictures.** The pen-pal sheets are in progress. This map shows each pen pal only as email text on a laptop screen. Option A: keep this. Option B: wait for the sheets and draw the children.
6. **Figures.** The lesson text writes every number, time, date, and price as a word, because the converter refuses digits. Pictures, signs, leaflets, and maps show figures. Option A: keep this. Option B: allow figures in a leaflet, a forecast, or a contents page (a change to the converter).
7. **Level 8 objectives that Adventure 9.1 teaches first.** R38.4 (L05) and R38.5 (L09) are GSE 38 objectives. bank-8 gives each only 2 targets. Option A: Adventure 8.1 and 8.2 give them one target each (section 5.3). Option B: bank-8 gets one more article for each, and the books do not target them.
8. **The free A2 Key pool.** The pool lists *colour*, *favourite*, and *cafe*, but the American forms are glossed in levels 1–5 already. This map does not use them. Option A: keep them out of the books (this map). Option B: gloss them again and count them as new.
9. **Same objectives as bank-8.** bank-8 has the same text types (a leaflet, safety rules, a contents page, a forecast, an email, a fact file). This map gives each a different situation (an aquarium leaflet, a pool email, a first-aid booklet, a badminton email, a seahorse post). Option A: keep. Option B: Daniel names the situations.

**Lead decisions for the writers (2026-10-06).** Daniel reviews the finished lessons, so these choices are provisional. Every question: option A. A pen pal appears in a picture only as email text on a screen, with no drawn person, until Daniel chooses the pen-pal sheets.

**Lead decisions for the writers (2026-10-06).** Daniel reviews the finished lessons, so these choices are provisional. Every question: option A.

## Revision history

- 0.1 — 2026-10-06 — First version (track levels_5_9_20261006).
- 0.2 — 2026-10-06 — Lead decisions for the writers in §9 (Daniel can change them in his review).
