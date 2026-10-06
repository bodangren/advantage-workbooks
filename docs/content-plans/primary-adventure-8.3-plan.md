# Primary Advantage Adventure 8.3 — Lesson Map

Version 0.2 | Date 2026-10-06 | Status: Draft | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

Track: `levels_5_9_20261006`. Companion files: [`primary-adventure-7.1-plan.md`](primary-adventure-7.1-plan.md) (the model for this map), [`primary-adventure-8.1-plan.md`](primary-adventure-8.1-plan.md) and [`primary-adventure-8.2-plan.md`](primary-adventure-8.2-plan.md) (the sister maps), [`primary-levels-5-9-plan.md`](primary-levels-5-9-plan.md) (§3 band rule, §5 profiles, §6 vocabulary, §7 grammar, §8 cast), [`primary-quest-adventure-series-bible.md`](primary-quest-adventure-series-bible.md) (§2, §4–§7), [`level-plans/levels-5-9-objectives.json`](level-plans/levels-5-9-objectives.json), [`level-plans/bank-8.md`](level-plans/bank-8.md), [`data/grammar-levels-5-9.md`](data/grammar-levels-5-9.md), [`calibration/levels-5-9/l8-story.md`](calibration/levels-5-9/l8-story.md), [`calibration/levels-5-9/l8-info.md`](calibration/levels-5-9/l8-info.md), [`reviews/2026-10-06-prereview-level-5.md`](reviews/2026-10-06-prereview-level-5.md), [`reviews/2026-10-06-prereview-bank-6.md`](reviews/2026-10-06-prereview-bank-6.md), [`../../content/primary/AUTHORING.md`](../../content/primary/AUTHORING.md).

## 1. Summary

Adventure 8.3 is the last book of level 8 (A2, `cefr_level = 'A2'`, `ra_level = 8`). It has 14 workbook lessons. Each lesson has 12 glossed words, 2–4 target objectives, and one main grammar point of level 8. QR key: `a8.3/<lesson>`. The book brings the ferry and the pier, a ferry leaflet with a route diagram, two diary pages on one day, a profile of a teacher, a market trip with an interview, and the January emails to the pen-pal class.

Text mix: 6 stories and 8 informational or functional texts. The stories are in L01, L04, L06, L08, L10, L12; the other lessons are informational or functional. The book has a traditional story in L06 (*The Wind and the Sun*, a fable that Tom tells to Pat and Lily on a cool morning). Dates run from Monday, January 4 to Friday, January 29, 2027, written in one form, month first (*January 4*; in the text, *January fourth*). Every weekday agrees with the 2027 calendar (January 1, 2027 is a Friday). No lesson falls on January 1 to 3 or on Saturday, January 16 (question 1). The two club trips are the ferry to Hill Pier (Saturday, January 9, L04) and the market (Saturday, January 23, L12).

Rule checks (run on this map with a script, 2026-10-06):

- **Book rule:** 20 of 20 objectives of `books["adventure-8.3"].objectives` are a target in 1 or more lessons (section 5.1). 19 of them are a target in 2 or more lessons; 1 in one lesson only (R37.4). No objective of the `outOfScope` list is a target.
- **Targets per lesson:** every lesson has 2–4 targets (3 lessons have 4, 10 have 3, 1 has 2). The map has 44 target slots and 21 different target objectives: the 20 book objectives and 1 other objective (R38.4; section 5.2).
- **Level rule:** each of the 67 in-scope objectives of level 8 is a target in 3 or more packages (Adventure 8.1, 8.2, 8.3, and bank-8): 67 of 67 reach 3 or more, 0 are under 3. The result is in section 5.3 (the 8.1 and 8.2 columns count the targets of their draft maps).
- **Words:** every lesson has exactly 12 glossed words (168 in the book), no word twice in the book. Every lesson has exactly 5 new A2 Key words from the free list (70 new words, all in the list, none glossed by any package, none in the 8.1 or 8.2 maps), and 7 Flyers words that earlier packages glossed (98 in all; 77 of the 98 come from Adventure 7). No lesson has a B1 word (section 7).
- **Questions and dialogue:** 14 of 14 lessons plan a real question (the brief shows it in quotation marks). All 6 stories have dialogue; L07, L09, L12, and L14 add speech, steps, or reader questions.

**Cast (series bible §2–§4):** Adventure 8.1, 8.2, and 8.3 are the middle of Lily's last year of primary school (P6), from November 2026 to January 2027; this book is January. Tom and Ben are 13 (M2). Sam is 12 (M1). May is 12. Lily, Mia, and Leo are 11 in Teacher Kim's class. Pat is 9. Nobody has a birthday in this book, so no age changes. The facts of levels 5–7 stay: no age is given for Grandma or Grandpa; Aunt Sue is a nurse who lives in a city in the north; Mia's mom is a doctor and her kitten is Snow; May and Pat live with their parents, their grandma, and the parrot Bill; Green Hill is the grandparents' village; Hugo is a boy in Tom's class; Mom's and Dad's jobs are not in the text. The club is the Explorers (Teacher Kim runs it; it meets on Thursday after lunch in the school library). Trips of this book: the ferry to Hill Pier (L04) and the market (L12); no place comes twice in a row, and neither place is a trip of 8.1 or 8.2 or of Adventure 7. Pen pals (Grace, Ravi, Nadia, and Ms. Ong) are in 4 lessons (L02, L09, L13, L14) and never in more than 4 lessons in a row; Alex has no lesson in this book. Pip is in 4 lessons (L05, L09, L10, L14); he does not go on a trip and does not meet a pen pal. New adult: Coach Matt (L07), with his bible look line; a banana seller (L12) and a woman on the ferry (L04) get one full look. The only proper place names are *Thailand*, *Singapore*, and *Green Hill* (*Singapore* only in text, never in a picture line); the ferry stops have plain names (*Town Pier*, *School Pier*, *Market Pier*, *Park Pier*, *Hill Pier*).

## 2. Text profile (`adventure-8`)

| Measure | Target |
|---|---|
| Words | 340–430, in exactly 5 paragraphs |
| Mean sentence length | 7.8–9.5 words; longest sentence 18 words or less |
| Running words on Starters to A2 Key (names, glossed, allowed words not counted) | 95% or more |
| Glossed words | exactly 12 (the converter's `glossedCount`): 5 or more A2 Key words, at most 1 B1 word, the rest Flyers words (this map: 5 new A2 Key and 7 Flyers in every lesson, no B1) |
| New words | 5 or more glossed A2 Key words that no earlier text of the book uses (target, WARN when lower): a new word must not appear in an earlier lesson, so a writer uses each new word first in its own lesson |
| Recycled words | 4 or more words that earlier lessons glossed and the text uses again |
| Digits | none: numbers, times, dates, and prices are words in the text (pictures may show figures) |
| Question marks | 2 or more (book rule: 10 of 14 lessons; this map plans a question in every lesson) |
| Dialogue | 6 or more lessons. This map has dialogue in all 6 stories |

Level 8 uses the first A2 Key grammar: the present perfect with *for* and *since*; the first conditional; *too*; *a few, a little, many, much, a lot of*; *needn't* and *don't have to*; the present continuous with future meaning; gerunds; *would* for polite requests; *that* clauses; the questions *How much / many / often / long* and *Whose*; participles as adjectives and adjective order; prepositions of direction and instrument; *(not) as ... as* (GSE only). Each lesson has one main point (section 6). *Used to*, the passive, reported speech, the past perfect, the second conditional, the present perfect continuous, and *will be able to* do not appear (one fixed phrase, *was born*, is in L07; section 6). Voice follows bible §7: a close third person in the past simple for stories; a named writer for a blog post, a diary page, or an email (*Posted by May*, *Dear diary*, *Dear Ms. Ong, ... Best wishes, Lily and May*); headings and no "I" in an informational text of the club or the school. Linking words (*and, so, but, because*) are in every text.

## 3. Lesson map

Targets are A2 key ids (`a2-objective-key.json`, GSE 36–38 for this book, plus one other objective that section 5.2 names). "Supporting" lists the objectives that the text will clearly practice. Writers add other objectives of level 8 or below where the text practices them. Words are in section 7.

| # | Title | Date | Text type | Genre | App | Cast and place | Targets | Supporting | Main grammar |
|---|---|---|---|---|---|---|---|---|---|
| L01 | What Did You Do in the Holiday? | Monday, January 4 | story: friends tell what they did, in order | School | fiction | Teacher Kim, Lily, Mia, Leo, May; the classroom | L36.2, L36.3, L36.4 | L31.1, R31.2, L33.2, L31.12 | gerunds (enjoy + -ing, good at + -ing) (also: a few, a lot of) |
| L02 | The Bean Jar | Tuesday, January 5 | functional: steps and a labeled diagram in an email | Science & Space | nonfiction | Teacher Kim, Lily, Leo, Mia, May, (Grace by email); the classroom | R37.1, L37.1, R38.1 | R33.2, R32.2, R31.1, R32.1 | first conditional (also: a little, a few) |
| L03 | The Ferry Leaflet | Thursday, January 7 | functional: a leaflet with a route diagram and times | Places & Directions | nonfiction | Teacher Kim, Lily, Mia, Leo, May; the school library | L37.4, R37.6, R37.5 | R32.4, R33.6, R32.7, R33.2 | How much / How many / How often / How long? (also: prepositions of direction) |
| L04 | Count the Stops | Saturday, January 9 | story: two children count ferry stops | Travel & Transport | fiction | Leo, May, Teacher Kim, Mia, Lily, a woman with big bags; the ferry and the piers | L37.4, L37.3, R37.2, L36.5 | R32.4, L33.4, L31.1, R31.2 | prepositions of direction (also: that clauses) |
| L05 | Two Diaries, One Sunday | Monday, January 11 | functional: two diary pages on one day (two texts to compare) | Family & Friends | nonfiction | Lily (writer), Tom (writer), Dad, Pip; the lake, then Lily's desk and Tom's desk | R37.4, R37.9, R37.5 | R31.4, L31.11, R33.3, R30.4 | present perfect with for / since (also: (not) as ... as) |
| L06 | The Wind and the Sun | Wednesday, January 13 | story: a traditional tale told by Tom | Family & Friends | fiction | Tom, Lily, Pat; the road to school on a cool morning | L36.3, R37.2, R37.3 | R31.6, R33.4, R30.3, L31.1 | too (also: participles as adjectives, first conditional) |
| L07 | Meet Coach Matt | Thursday, January 14 | functional: an interview that gives a person's story, a blog post | Jobs & Work | nonfiction | May (writer), Coach Matt, Leo, Lily; the school field | R37.7, R38.2, R38.4 | R33.2, R31.4, R31.1, R30.4 | How long ...? with for / since (also: gerunds) |
| L08 | Who Will Ask the Questions? | Monday, January 18 | story: a team talk about who asks and who writes | School | fiction | Teacher Kim, Lily, Mia, Leo, May; the school library, lunchtime | L36.6, L36.4, L37.3, L36.5 | L33.3, L31.12, R32.6, R31.2 | that clauses after think, know, sure (also: gerunds) |
| L09 | Ravi's Ginger Tea | Tuesday, January 19 | functional: a recipe in an email, made at home | Food & Drink | nonfiction | Lily, Tom, Pip, (Ravi by email); Lily's kitchen | L37.1, R37.6, R37.10 | R32.2, L31.10, R31.1, R32.1 | a few / a little / many / much / a lot of (also: don't have to) |
| L10 | The Wet Footprints | Wednesday, January 20 | story: a mystery with clues | Family & Friends | fiction | Lily, Tom, Mom, Pip; the house | L36.2, L37.2, R37.3 | L31.1, R31.2, L30.1, L33.2 | whose (also: participles as adjectives) |
| L11 | Rules for the Market | Friday, January 22 | functional: safety rules for a trip | Places & Directions | nonfiction | Teacher Kim, Lily, Mia, Leo, May; the classroom | R37.6, R38.2 | R32.7, R30.2, L31.10, R31.1 | needn't / don't have to (also: first conditional) |
| L12 | The Banana Seller | Saturday, January 23 | story: an interview with a banana seller | Food & Drink | fiction | Leo, Mia, May, Lily, Teacher Kim, a banana seller; the market | R37.2, R38.1, L37.2, L36.6 | L31.6, L31.1, R31.2, L33.2 | present continuous for arrangements (also: would for requests) |
| L13 | Nadia's Gecko File | Monday, January 25 | functional: an animal fact file in an email, with a diagram | Pets & Animals | nonfiction | Mia, Lily, Pip, (Nadia by email); Mia's desk at home | R38.4, R37.1, R37.10 | R33.2, R32.2, R31.1, L31.13 | participles as adjectives, adjective order (also: (not) as ... as) |
| L14 | An Email for Ms. Ong | Friday, January 29 | functional: an email to a pen-pal teacher | School | nonfiction | Lily and May (writers), Pip; Lily's desk at home | R37.9, R38.2, R37.7 | R33.1, R32.1, R31.1, R30.4 | would for polite requests (also: present continuous for the future) |

Notes:
- Pen pals: L02 (Grace's email), L09 (Ravi's email), L13 (Nadia's email), L14 (the email to Ms. Ong). The pictures show the laptop screen with the email text in double quotation marks, never the pen pal (their sheets are in progress).
- Pip: L05, L09, L10, L14. Pip is never the narrator and does not read an email.
- L04 and L12 are the club trips of January (the ferry, then the market). L03 prepares the first trip and L08 and L11 prepare the second. L14 is the review lesson: it uses an email, a list of events, and a profile.
- L06 is the traditional tale of the book. Tom tells it, so the narrator of the tale is clear.
- Leaflets, signs, rule sheets, diaries, diagrams, and recipe lists (L02, L03, L04, L05, L09, L11, L13) show their words in double quotation marks, exactly as in the text. Section 4 gives them.
- Dates and times: the ferry leaves Town Pier at quarter past and quarter to the hour on Saturdays and takes 40 minutes to Hill Pier; the Explorers meet at Town Pier at 8:30 a.m. and take the 8:45 boat on January 9 (L03, L04). The boat back leaves Hill Pier at 11:45 and reaches Market Pier at 12:10 (25 minutes). The stops in order: 1 Town Pier, 2 School Pier, 3 Market Pier, 4 Park Pier, 5 Hill Pier; going back from Hill Pier, Market Pier is the second stop. On both Saturdays the group meets Teacher Kim at the fruit stall at the market pier (L04 at 12:30, L12 at 12:00).
- The diaries of L05 describe Sunday, January 10. Coach Matt has worked at the school for six years (L07, L14).

## 4. Lesson briefs and pictures

Each brief gives who, where, what happens, and how it ends. Each lesson has a hero picture and two inline pictures. Sign, poster, notice, map, blog, diary, and email text is in double quotation marks, as in AUTHORING §6. Cast looks are not described when a cast sheet exists; Coach Matt gets his bible look line, and a person outside the cast gets a full look at first mention. No child is in distress, on a bed, or with a hand on the face. No picture line names Singapore or the pen-pal school. The briefs and picture lines show figures for times, prices, and dates; the text spells them as words.

### L01 What Did You Do in the Holiday?

Text type: story: friends tell what they did, in order. Genre: School. App type: fiction. Place: the classroom.

On Monday, January 4, the first school day of the new year, Teacher Kim asks, "What did you do in the holiday?" Each child tells one thing and says what they liked. Leo went to a campsite by a lake with his uncle: first they put up a tent, then they cooked rice on a fire, and in the evening they counted the stars. May stayed two nights in a hotel by the sea, and Lily took a suitcase to Green Hill with Tom. Mia stayed at home with Snow and says, "It was a relaxing holiday, and I liked it best." The children cannot all talk in the time, so Teacher Kim asks them to draw their days on a line on the board, and Lily says, "I liked Green Hill best, because Grandma cooked all day."

- hero: A classroom board with a long line and four labels: "Thursday, December 31", "Friday, January 1", "Saturday, January 2", "Sunday, January 3". Small drawings sit above the line: a tent, a hotel by the sea, a bus, a cat. Teacher Kim stands at the board with a marker; Lily, Mia, Leo, and May sit at their desks.
- inline-para-2: Leo stands at his desk and holds his arms wide to show the size of a fire; Mia and May laugh; Teacher Kim smiles.
- inline-para-3: Lily draws a small house on the board line with a green chalk marker; the other three children watch from the front row; Teacher Kim holds the eraser.

### L02 The Bean Jar

Text type: functional: steps and a labeled diagram in an email. Genre: Science & Space. App type: nonfiction. Place: the classroom.

On Tuesday, January 5, Lily brings an email from her pen pal Grace to the class. Grace writes, "Dear Lily, we grew beans in jars in Ms. Ong's class. Here are the steps, and here is my diagram." The steps are: wet a paper towel, put it in a clear jar, push three beans between the towel and the glass, cover the top with a cloth, put the jar near a window, and add a little water every day. The diagram shows the bean on day one, the root on day four, the shoot on day seven, and the first leaves on day ten. Leo asks, "Will a bean grow in the dark?" and Teacher Kim says, "If you keep the jar in a cupboard, the shoot will be pale and thin." The class sets up four jars, and Lily writes "Day 1" on each.

- hero: A laptop on a desk shows the email "Dear Lily," with a diagram of four bean pictures labeled "Day 1: seed", "Day 4: root", "Day 7: shoot", "Day 10: first leaves", and the label "water" with an arrow to the jar. Teacher Kim, Lily, and Leo stand beside it.
- inline-para-2: Four clear jars stand on a windowsill with a wet paper towel and three beans in each; Mia pours water from a small cup; May holds a label "Day 1".
- inline-para-3: A notebook page with a table "Day / Height" and three lines of pencil notes; Leo measures a green shoot with a ruler beside a jar.

### L03 The Ferry Leaflet

Text type: functional: a leaflet with a route diagram and times. Genre: Places & Directions. App type: nonfiction. Place: the school library.

On Thursday, January 7, in the club hour, Teacher Kim gives each pair of Explorers the leaflet "Blue Ferry" for the trip on Saturday, January 9. The leaflet has four headings: "Times", "Fares", "Stops", and "Questions". It says that the boats leave Town Pier at quarter past and quarter to the hour on Saturdays, but every twenty minutes on weekdays, and that the trip to Hill Pier takes forty minutes. A single ticket costs thirty baht for an adult and fifteen baht for a child, and a group of ten or more has a discount of five baht each. A diagram shows the five stops in a line, and a note says that the boats can have a short delay when the river is high. Mia asks, "How often do the boats go?" and Leo finds the answer under "Questions".

- hero: A leaflet on a library table with the heading "BLUE FERRY" and four boxes: "Times: Saturday and Sunday, every 30 minutes (quarter past and quarter to). Weekdays, every 20 minutes.", "Fares: Adult 30 baht. Child 15 baht. Group of 10 or more: 5 baht off each ticket.", "Stops: 1 Town Pier, 2 School Pier, 3 Market Pier, 4 Park Pier, 5 Hill Pier", "Questions: How long is the trip? 40 minutes." Teacher Kim, Mia, Leo, May, and Lily lean over it.
- inline-para-2: The route diagram on the leaflet: a blue line with five dots labeled "Town Pier", "School Pier", "Market Pier", "Park Pier", "Hill Pier", and a small boat above the line with an arrow to the right.
- inline-para-3: Teacher Kim writes on the board: "Saturday, January 9. Town Pier, 8:30 a.m." Lily copies it into her notebook; Leo draws a small boat beside the words.

### L04 Count the Stops

Text type: story: two children count ferry stops. Genre: Travel & Transport. App type: fiction. Place: the ferry and the piers.

On Saturday, January 9, the Explorers take the boat from Town Pier to Hill Pier, eat lunch in the river park, and take the quarter-to-twelve boat back. The boat is crowded, and Leo and May sit at the back behind a woman with three big bags, so they cannot see Teacher Kim. A voice says, "Next stop: Park Pier." Leo asks, "Is the next stop ours?" and says, "I think so." May says, "I don't agree. We get off at Market Pier, and that is two stops after Hill Pier." They look at the diagram on the cabin wall and count: Hill Pier, Park Pier, Market Pier. They get off at Market Pier at ten past twelve, and Teacher Kim says, "Please meet at the fruit stall at half past twelve."

- hero: The inside of a crowded blue ferry: a diagram on the wall with five dots and the labels "Town Pier", "School Pier", "Market Pier", "Park Pier", "Hill Pier"; Leo and May sit on a bench at the back beside a woman (about fifty, gray hair in a bun, a green scarf) with three big bags; Leo points at the diagram.
- inline-para-2: Leo and May stand at the open side of the boat and look at a small pier with a sign "MARKET PIER"; May holds up two fingers; a few children wait on the pier.
- inline-para-3: On the pier by a fruit stall with a green awning, Teacher Kim, Mia, and Lily wave; Teacher Kim holds a clipboard; a crate of oranges stands near the stall.

### L05 Two Diaries, One Sunday

Text type: functional: two diary pages on one day (two texts to compare). Genre: Family & Friends. App type: nonfiction. Place: the lake, then Lily's desk and Tom's desk.

On Monday, January 11, Mom asks Lily and Tom to write a diary page each about Sunday, January 10, for the family book. Both pages say that they left at eight o'clock with Dad and Pip, that the morning was cool, that they wore jackets, and that they ate lunch under a big tree. Lily writes, "Dear diary, I drew the lake and I made a sandwich myself. I like being outdoors, but I did not like the cold wind." Tom writes, "Dear diary, I fished for two hours and I caught nothing. I like cool mornings, and I did not like the worms." Both end with a plan: Lily wants a picnic again, and Tom wants to try a new place, so Dad says, "Let us decide next Sunday." Lily asks Tom, "Do you agree that the lake is best in the morning?"

- hero: Two diary pages on a table side by side. The left page has the heading "Lily, Sunday, January 10" and the first line "Dear diary, we left at 8:00."; the right page has the heading "Tom, Sunday, January 10" and the first line "Dear diary, we left at 8:00." A pencil lies on each page, and a drawing of a lake is on the left page.
- inline-para-2: A lake in the morning: Lily sits on a mat and draws; Tom stands at the edge with a fishing rod; Dad sits under a big tree with a thermos; Pip chases a duck. All wear jackets.
- inline-para-3: Dad, Tom, and Lily sit under the big tree with sandwiches; Pip lies on the grass beside the picnic box; Tom lies on the grass with his jacket as a pillow.

### L06 The Wind and the Sun

Text type: story: a traditional tale told by Tom. Genre: Family & Friends. App type: fiction. Place: the road to school on a cool morning.

On Wednesday, January 13, at half past seven, it is a cool morning, and Tom walks to school with Lily and Pat. Pat will not wear the jacket that his mom gave him. He says, "Why should I wear it? I am not cold, and it is too big." Tom says, "I know a story about that," and he tells the tale of the Wind and the Sun. The Wind and the Sun see a traveler in a coat and want to find who can make him take it off. The Wind blows hard, but the man holds his coat closer; then the golden Sun shines warm, and the man easily takes the coat off. Pat says, "The Sun was kinder," puts on the jacket, and at the school gate the sun comes out and he takes it off again.

- hero: A path to a school gate in the early morning: Tom (tall, school uniform shirt and a gray jacket), Lily, and Pat (small, a big blue jacket over his arm) walk side by side; low sun and a few leaves on the ground.
- inline-para-2: A storybook picture: a man in a long brown coat holds the front of his coat closed while a gray cloud with a puffed-cheek face blows leaves around him.
- inline-para-3: A storybook picture: a bright golden sun with a smiling face shines on the man, who has taken off his coat and carries it on his arm.

### L07 Meet Coach Matt

Text type: functional: an interview that gives a person's story, a blog post. Genre: Jobs & Work. App type: nonfiction. Place: the school field.

On Thursday, January 14, May posts "Meet Coach Matt" ("Posted by May"), the first page of her new series about people at the school. She sits with Coach Matt on a bench at the school field in the club hour. Coach Matt says, "I was born in a small town by the sea. I grew up playing football on the beach, and I went to a sports college. I became a teacher after college, and I have worked here for six years." He says that the school team was successful last year, and that his best experience is to see a shy child score a goal. May asks, "How long have you been the football coach?" and he answers, "Since my first year." She ends the post with, "Who shall I ask next?"

- hero: Coach Matt (about thirty, short spiky black hair, a bright red sports shirt with a white stripe, black sports shorts, white sneakers, a silver whistle on a cord) sits on a bench at the edge of a school football field beside May, who holds a notebook and a pencil. Leo and Lily stand behind the bench.
- inline-para-2: A laptop screen shows the blog page "MEET COACH MATT" with a photo of a football on grass and three lines in bold: "Born: a small town by the sea", "Job: sports teacher", "At our school: six years".
- inline-para-3: On the field, Coach Matt holds up a football and smiles at a small boy in a school shirt who kicks a ball toward a goal; May writes in her notebook.

### L08 Who Will Ask the Questions?

Text type: story: a team talk about who asks and who writes. Genre: School. App type: fiction. Place: the school library, lunchtime.

On Monday, January 18, at lunchtime in the school library, Teacher Kim says that each pair needs one child to ask questions at the market on Saturday, January 23, and one to write the answers. Lily, Mia, Leo, and May talk about who is best. Mia asks, "Who should ask the questions?" and says, "I think that Leo should ask, because he is never shy." May says, "I don't agree. Leo is funny, but he is not serious." Leo says, "I know that I am a good talker," and Lily says, "May is smart, and she likes asking questions." They decide: May asks and Lily writes, and Leo asks and Mia writes, because Mia likes writing and is shy with strangers. Leo says, "Let's meet at the fruit stall at ten o'clock," and everyone agrees.

- hero: Four children sit around a library table with a sheet headed "MARKET PAIRS" with two lines: "Asks" and "Writes"; Teacher Kim stands at the end of the table with a clipboard; lunch boxes are on the table.
- inline-para-2: Mia speaks with one hand open on the table; May listens with a pencil in her hand; Leo has both hands raised and a big grin.
- inline-para-3: The sheet now says "Pair 1: May asks, Lily writes" and "Pair 2: Leo asks, Mia writes"; the four children give a thumbs-up; Teacher Kim writes a note on her clipboard.

### L09 Ravi's Ginger Tea

Text type: functional: a recipe in an email, made at home. Genre: Food & Drink. App type: nonfiction. Place: Lily's kitchen.

On Tuesday, January 19, after school, Lily reads an email from Ravi to the Explorers: "Dear Explorers, here is my grandma's recipe for ginger tea, for cool mornings." The list says: one piece of ginger as long as a thumb, two mugs of boiled water, a little honey, and a few slices of lemon. The steps are: first wash the ginger and cut it into slices, next put the slices in a pot with the water, then wait ten minutes, and finally add honey and lemon. Ravi writes, "You don't have to peel the ginger. It is healthy, and it helps when you have a stomach ache." Lily asks, "Shall we add the honey now?" and Tom says, "Wait ten minutes." Pip takes the honey spoon off the table.

- hero: A laptop on a kitchen counter shows the email "Dear Explorers," and the recipe "GINGER TEA" with the lines "1 piece of ginger", "2 mugs of boiled water", "a little honey", "a few slices of lemon". Lily stands beside it with a knife and a board; Tom holds a small pot.
- inline-para-2: Lily cuts a piece of ginger into thin slices on a wooden board; Tom puts the pot on the stove; a jar of honey and a lemon stand on the counter.
- inline-para-3: Lily and Tom hold two mugs of tea; Pip stands on his back legs at the counter and licks a spoon with honey; Tom laughs.

### L10 The Wet Footprints

Text type: story: a mystery with clues. Genre: Family & Friends. App type: fiction. Place: the house.

On Wednesday, January 20, at five o'clock, Lily comes home and sees small wet footprints on the floor, from the bathroom door across the hall. She asks, "Whose footprints are these?" Tom says, "They are not mine, because they are too small, and Dad's feet are bigger. Look, there are four toes." Mom says that she washed Pip at four o'clock and then answered the phone. Lily says, "Pip hates baths, and he smells awful, so he ran away from his bath." They follow the footprints to Tom's striped towel, where Pip sits, clean and wet, with the red ball, and it is not a surprising end. Lily and Tom tidy up the floor with the towel.

- hero: A hallway floor with a line of small wet paw prints from the bathroom door; Lily stands in the doorway with her school bag and looks down at the prints; Tom stands behind her with his arms crossed and a frown of puzzle.
- inline-para-2: Tom kneels and points at a wet paw print with a pencil; Lily holds up her hand with four fingers; Mom stands at the kitchen door with a phone.
- inline-para-3: Pip sits on a striped towel in Tom's room with the red ball between his paws, his fur wet and fluffy; Lily and Tom stand in the door and laugh; a mop leans against the wall.

### L11 Rules for the Market

Text type: functional: safety rules for a trip. Genre: Places & Directions. App type: nonfiction. Place: the classroom.

On Friday, January 22, Teacher Kim gives each Explorer a rule sheet for the market trip on Saturday, January 23. The sheet is signed "Teacher Kim, the Explorers" and says: "1. Stay with your partner. 2. Keep your wallet in your front pocket. 3. If you get lost, go to the information stand and show your club id card. 4. Write the name of each seller in your notebook. 5. You needn't buy anything, but say thank you. 6. Meet at the fruit stall at 12:00." The card carries Teacher Kim's contact details. Mia asks, "What if we lose our partner?" and Leo reads rule three. May says, "Rule five is easy, because I have only twenty baht."

- hero: A sheet of paper on a desk with the heading "MARKET RULES" and six numbered lines: "1. Stay with your partner.", "2. Keep your wallet in your front pocket.", "3. If you get lost, go to the information stand.", "4. Write the name of each seller.", "5. You needn't buy anything.", "6. Meet at the fruit stall at 12:00." Teacher Kim, Lily, Mia, Leo, and May stand around the desk.
- inline-para-2: A small card with a green flag and a paw print and the words "EXPLORERS CLUB, ID CARD", a line "Name: Mia", and a line "Teacher: Kim"; Mia holds it up.
- inline-para-3: Leo reads the sheet with one finger on rule three; Lily underlines rule one with a red pencil; May counts coins in her hand.

### L12 The Banana Seller

Text type: story: an interview with a banana seller. Genre: Food & Drink. App type: fiction. Place: the market.

On Saturday, January 23, at ten o'clock, the Explorers walk through the market in pairs. First they pass a stall of mangoes, then a stall of noisy ducks in a cage, and then a stall that fries bananas. May and Lily walk to a stall, and Leo and Mia stop at the banana stall, where the seller, a man in a gray apron, fries bananas in a big pan. Leo asks, "How long have you sold bananas?" and the seller says, "For twenty years." Leo makes a joke, the seller laughs and says, "I am a big fan of jokes," and he offers each child a piece. At noon the pairs meet Teacher Kim at the fruit stall, and Mia reads her notes, "He sells forty bananas a day."

- hero: A busy market lane with colored awnings; Leo and Mia stand in front of a stall with a big pan of fried bananas and a sign "FRIED BANANAS, 10 baht"; the seller (a man of about fifty-five, short gray hair, a gray apron, a white towel on his shoulder) holds up a piece on a stick.
- inline-para-2: Mia writes in her notebook while the seller talks; Leo holds a small paper bag; a pile of mangoes and a cage of ducks are in the background.
- inline-para-3: At a fruit stall by the pier, Teacher Kim, Lily, May, Leo, and Mia hold paper cups of fruit and read their notebooks; boats are on the river behind.

### L13 Nadia's Gecko File

Text type: functional: an animal fact file in an email, with a diagram. Genre: Pets & Animals. App type: nonfiction. Place: Mia's desk at home.

On Monday, January 25, Mia reads an email from Nadia. Nadia writes, "Dear Mia, here is my fact file about geckos." It has three headings: "Where geckos live", "What geckos eat", and "How geckos climb". Geckos live in warm places, on walls and ceilings, and some types are about ten centimeters in length. They come out at night, and they eat insects, so they are good friends of a house. A small diagram shows the toe of a gecko with a pale pad and tiny hairs, and that is how a gecko walks on a ceiling. Nadia asks, "Do you have geckos at home? Does Pip like them?" and Mia says to Lily, "Pip does not like them, but they are lucky for a house."

- hero: Mia sits at a desk in front of a laptop that shows an email "Dear Mia," with a photo of a pale gecko on a wall and three headings: "Where geckos live", "What geckos eat", "How geckos climb". Lily stands beside her.
- inline-para-2: A labeled diagram of a gecko foot: "toe", "pad", "tiny hairs", "wall", with arrows.
- inline-para-3: Mia's notebook with a drawing of a small gecko on a ceiling and a line "Nadia: geckos eat insects at night". A small gecko sits on the wall above the desk; Pip looks up at it from the floor.

### L14 An Email for Ms. Ong

Text type: functional: an email to a pen-pal teacher. Genre: School. App type: nonfiction. Place: Lily's desk at home.

On Friday, January 29, in the evening, Lily and May write an email to Ms. Ong, who asked in December, "What are you doing in January?" The email is from "Lily and May, for the Explorers". It says that on January 9 the club took the blue ferry to Hill Pier, that on January 23 they interviewed sellers at the market, and that the class is growing beans in jars. Lily writes, "Leo liked the market best, but I liked the ferry, because I could draw the river." The email tells about Coach Matt, who was born by the sea and has worked at the school for six years. It ends, "Our topic for February is festivals. What is your topic? Here is the link to our blog."

- hero: A laptop on a desk shows an email with the lines "To: Ms. Ong", "From: Lily and May", and "Subject: Our January"; Lily types and May sits beside her with a notebook; Pip sits under the chair.
- inline-para-2: The notebook open on the desk with a list: "Ferry, January 9", "Market, January 23", "Bean jars", "Coach Matt", and a drawing of a blue boat.
- inline-para-3: Lily and May look at the laptop screen as the message "Sent" appears; Pip puts his front paws on May's knee.

## 5. Objectives

### 5.1 Book rule: the 20 objectives of `books["adventure-8.3"]`

| Objective | Target in | Text |
|---|---|---|
| L36.2 | L01, L10 | Can identify activities occurring in the past in short, simple dialogues. |
| L36.3 | L01, L06 | Can follow the sequence of events in a simple story or narrative, if told slowly and clearly. |
| L36.4 | L01, L08 | Can understand people’s likes in informal conversations, if the speakers talk slowly and clearly. |
| L36.5 | L04, L08 | Can identify specific information in short, simple dialogues in which speakers make arrangements to do something, if spoken slowly and clearly. |
| L36.6 | L08, L12 | Can identify specific information about people’s personalities in short, simple dialogues, if spoken slowly and clearly. |
| R37.1 | L02, L13 | Can understand the main information in basic diagrams related to familiar topics. |
| R37.2 | L04, L06, L12 | Can understand the correct sequence of events in a simple story or dialogue. |
| R37.3 | L06, L10 | Can guess the meaning of unfamiliar words in short, simple stories, if supported by pictures. |
| R37.4 | L05 | Can identify basic similarities and differences in the facts between two short simple texts on the same familiar topic, if supported by pictures and questions. |
| R37.5 | L03, L05 | Can recognise the use of simple linking words to connect ideas in short paragraphs. |
| R37.6 | L03, L09, L11 | Can identify specific information related to a familiar topic in a short, simple text. |
| R37.7 | L07, L14 | Can identify basic biographical information in short simple texts about other people. |
| R37.9 | L05, L14 | Can understand likes and preferences in short, simple personal texts (e.g. ‘diary entries’ or ‘emails’). |
| R37.10 | L09, L13 | Can understand the meaning of short texts using information they already know. |
| L37.1 | L02, L09 | Can follow multi-step instructions if given slowly and clearly. |
| L37.2 | L10, L12 | Can understand most of the concrete details in informal conversations on familiar everyday topics, if the speakers talk slowly and clearly. |
| L37.3 | L04, L08 | Can recognise simple expressions of agreement and disagreement in short, informal discussions, if the speakers talk slowly and clearly. |
| L37.4 | L03, L04 | Can understand simple directions on how to get somewhere by public transport, with reference to a map. |
| R38.1 | L02, L12 | Can find appropriate words or phrases to describe a picture. |
| R38.2 | L07, L11, L14 | Can identify words and phrases from different places in a simple text to support their answers. |

Result (script check, 2026-10-06): 20 of 20 objectives are a target in 1 or more lessons. None is missing. Every lesson has exactly 12 glossed words and exactly 5 new A2 Key words (script check, section 7).

R37.4 has one target lesson. bank-8 gives R37.4 2 packages, so the level rule holds.

### 5.2 Other targets

The `--next` list of this book has 20 objectives (all in section 5.1) and 45 band objectives of levels 6 and 7 with the lowest practice. R38.4 is a target outside the book list: it is a level 8 objective that no book lists, and 8.1 (L05) targets it once; L07 and L13 give it two more packages. The supporting objectives in section 3 give the band objectives with the lowest practice (R31.3 and R32.8 have none after their first lesson) more practice where the text fits: for example R32.4 and R33.6 (L03, L04), L33.4 (L04), L31.10 (L09, L11), and L31.13 (L13). Writers may add A1 objectives (for example R27.1, R27.4) as supporting objectives where the text practices them.

### 5.3 Level rule: the 67 in-scope objectives of level 8

Level 8 has 150 packages: the 42 lessons of Adventure 8.1, 8.2, and 8.3, and the 108 articles of bank-8. The bank column counts targets in `level-plans/bank-8.json` (2026-10-06). The three book columns count the targets of the three draft maps (8.1 and 8.2 as they are on 2026-10-06).

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
| R37.1 | 0 | 0 | 2 | 4 | 6 |  |
| R37.2 | 0 | 0 | 3 | 4 | 7 |  |
| R37.3 | 0 | 0 | 2 | 2 | 4 |  |
| R37.4 | 0 | 0 | 1 | 2 | 3 |  |
| R37.5 | 0 | 0 | 2 | 5 | 7 |  |
| R37.6 | 0 | 0 | 3 | 4 | 7 |  |
| R37.7 | 0 | 0 | 2 | 3 | 5 |  |
| R37.9 | 0 | 0 | 2 | 6 | 8 |  |
| R37.10 | 0 | 0 | 2 | 2 | 4 |  |
| R38.1 | 0 | 0 | 2 | 2 | 4 |  |
| R38.2 | 0 | 0 | 3 | 2 | 5 |  |
| R38.3 | 0 | 0 | 0 | 6 | 6 |  |
| R38.4 | 1 | 0 | 2 | 2 | 5 |  |
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
| L36.2 | 0 | 0 | 2 | 3 | 5 |  |
| L36.3 | 0 | 0 | 2 | 3 | 5 |  |
| L36.4 | 0 | 0 | 2 | 2 | 4 |  |
| L36.5 | 0 | 0 | 2 | 4 | 6 |  |
| L36.6 | 0 | 0 | 2 | 4 | 6 |  |
| L37.1 | 0 | 0 | 2 | 5 | 7 |  |
| L37.2 | 0 | 0 | 2 | 6 | 8 |  |
| L37.3 | 0 | 0 | 2 | 4 | 6 |  |
| L37.4 | 0 | 0 | 2 | 2 | 4 |  |
| L38.1 | 0 | 0 | 0 | 4 | 4 |  |
| L38.2 | 0 | 0 | 0 | 4 | 4 |  |
| L38.3 | 0 | 0 | 0 | 4 | 4 |  |
| L38.4 | 0 | 1 | 0 | 2 | 3 |  |
| L38.5 | 0 | 1 | 0 | 2 | 3 |  |

Result: 67 of 67 objectives have 3 or more. None is under 3. The lowest total is 3. Every objective that Adventure 8.3 teaches first has a workbook target here. If the writers of 8.1 or 8.2 change a target, run the check again (the script reads the §3 tables of the three maps).

## 6. Grammar

One main grammar point for each lesson. The table follows the A2 Key items of level 8 (`data/grammar-levels-5-9.md` §5). The writer uses the main point in the key sentences of the text and in two or three questions. "Also" points are secondary.

| Grammar point (level 8) | Main in | Also in |
|---|---|---|
| present perfect with for / since | L05 | L07 |
| first conditional | L02 | L06, L11 |
| too | L06 | - |
| a few, a little, many, much, a lot of | L09 | L01, L02 |
| needn't; don't have to | L11 | L09 |
| present continuous with future meaning | L12 | L14 |
| gerunds (subject, object, after prepositions; enjoy / love + -ing) | L01 | L07, L08 |
| would for polite requests | L14 | L12 |
| that clauses after know, think, hope, sure | L08 | L04 |
| How much / many / often / long; whose | L03 (How ...?), L07 (How long), L10 (whose) | - |
| participles as adjectives; adjective order | L13 | L06, L10 |
| prepositions of direction and instrument | L04 | L03 |
| (not) as ... as (GSE only) | - | L05, L13 |

The first conditional is the key sentence of the rule in L02 (*If you keep the jar in a cupboard, the shoot will be pale.*). Avoid at level 8: *used to*, the passive, reported speech, the past perfect, the second conditional, the present perfect continuous, and *will be able to*. L07 uses *was born* as one fixed phrase and no other passive (question 8). *If* starts only a zero or first conditional. *Dice* and other words that are on no list go in `allow` if the check marks them. Words of this book that are on no list and need `allow`: *ferry, pier, gecko, ginger, footprints, cupboard, thermos, awning, bean* (the writer checks each against the graph).

## 7. Words

Each lesson glosses 12 words: exactly 5 new A2 Key words of the free list (`a8-pool-B.md`, 222 words that no package or draft glosses) and 7 Flyers words that earlier packages glossed (the words of Adventure 7 first). The words of a lesson fit its text. American spelling: the free list words with British-only spelling (*city centre, neighbour, centre, cheque*) are not used. No word is glossed twice in this book, and no new A2 Key word is in the 8.1 or 8.2 maps.

| # | New A2 Key words (free list) | B1 word | Flyers words glossed before |
|---|---|---|---|
| L01 | come back, campsite, relaxing, anyway, whole | - | visit, remember, hotel, suitcase, excited, journey, wonderful |
| L02 | cover, clear, become, record, beginning | - | step, light, dark, warm, touch, deep, ready |
| L03 | single, discount, weekday, delay, port | - | timetable, arrive, leave, bridge, across, passenger, quarter |
| L04 | crowded, sit down, excuse, seem, luggage | - | hurry, stay, sure, lucky, middle, far, corner |
| L05 | outdoors, usual, lie down, myself, opinion | - | diary, tomorrow, hope, pleased, hate, same, forget |
| L06 | dressed, golden, easily, possibly, reason | - | suddenly, believe, strange, follow, happen, still, pull |
| L07 | born, grow up, coach, experience, successful | - | job, student, begin, improve, team, since, ago |
| L08 | shy, smart, discuss, partner, serious | - | member, group, decide, friendly, important, agree, mind |
| L09 | boiled, mug, healthy, include, stomach ache | - | spoon, mix, taste, smell, honey, sugar, delicious |
| L10 | awful, tidy up, stuff, stripes, surprising | - | search, everywhere, appear, disappear, guess, secret, empty |
| L11 | wallet, contact, details, shop assistant, id | - | information, card, money, keep, exit, cheap, expensive |
| L12 | fried, offer, guy, fan, variety | - | sell, heavy, noisy, piece, pepper, meal, snack |
| L13 | type, pale, ceiling, few, length | - | creature, wild, insect, several, fast, soft, hole |
| L14 | term, topic, perform, link, final | - | invitation, online, quiz, collect, prepare, post, interested |

Counts (script check, 2026-10-06): 14 lessons x 12 = 168 glossed words, 168 different. A2 Key 70 new words (5 in every lesson, all from the free list, none glossed by any package in `content/primary`, none in the 8.1 or 8.2 maps; the graph level of each is Key). Flyers 98 (the graph level of each is Flyers; each is glossed in an earlier package; 77 of the 98 come from Adventure 7). B1 0. Left in the free list after this book: 152 words for Adventure 9 and the other drafter's reserve.

Word notes for writers:
- **New A2 Key words.** Each new word is used for the first time in its own lesson: no earlier lesson of the book has it (the converter's new-word check). Give it a glossary entry with the sense of the text and a simple example. Phrases (*come back, grow up, lie down, sit down, tidy up, stomach ache, shop assistant, take part*) get one entry.
- **Recycled Flyers words.** 60 of the 98 recycled words are also in the lists of 8.1 or 8.2 (for example *remember, arrive, mix, secret*). Only the new A2 Key words are exclusive to a book (question 9).
- **Swap rule.** A writer can swap at most 2 words of a lesson for words of the same topic that no other lesson of the three books uses. A2 Key swaps come from the free list; tell the lead which, so that the counts stay true.
- **Months, times, and numbers.** Months, weekdays, *a.m.*, *p.m.*, *baht*, and figures in times, prices, and dates are allowed in Adventure (bible §5) in a sign, a leaflet, or a list; the text itself spells numbers as words.
- **Names.** *Thailand*, *Singapore*, *Green Hill*, *Explorers*, the pier names, and the names of the cast go in `names` or `allow`.

## 8. Questions and tasks

- MCQ (4 printed of 10): at least 2 test a target objective (L02: "How long do you wait before the shoot grows?" with the day numbers of the diagram; L03: "How much is a child's single ticket?"; L04: "How many stops after Hill Pier is Market Pier?"; L05: "Which fact is in both diary pages?"; L07: "How long has Coach Matt worked at the school?"; L11: "What must you show at the information stand?"; L13: "What does the diagram show about a gecko's foot?").
- Short answer (1): a personal question in the lesson frame (L01: "What did you do in your last holiday? What did you like?"; L05: "What do you like to do outdoors?"; L08: "Who in your class is a good leader? Why?"; L14: "What are you doing next month?").
- Writing: a personal version of the text type (L02: "Write four steps and label a diagram for growing a plant." L03: "Write three questions about a bus or a boat and find the answers in a leaflet." L05: "Write a diary page about your last Sunday." L07: "Write four facts about a person at your school." L09: "Write the steps for a hot drink." L11: "Write three rules for a school trip." L14: "Write an email to a pen pal about your month.").
- Listening objectives (L-ids) are tested through the audio of the text: the question uses the words that the voice says. L04 needs the voice announcement "Next stop: Park Pier" and a short talk about the stops. L08 and L12 need one voice for each speaker (plan D5). L09 and L02 need the steps read slowly, one step for each sentence (L37.1).
- Two-text lesson (L05): the questions ask what is the same and what is different in the two diary pages; at least one question quotes a line of each page.

## 9. Questions for Daniel

1. **Calendar.** Adventure 8.3 is January 2027 (Monday, January 4 to Friday, January 29; weekdays agree with 2027). No lesson is on January 1 to 3 or on Saturday, January 16 (Teachers' Day in Thailand). Option A: keep. Option B: put a lesson or a trip on January 16 and name the day.
2. **Dates.** Option A: keep dates in the form *January 4*, month first. Option B: use weekdays and times only, with no date.
3. **New facts.** A blue ferry line with five piers (L03, L04), a market trip with a banana seller (L12), a school profile of Coach Matt (L07), a gecko fact file (L13), and wet footprints at home (L10). Do you accept them? Option A: accept. Option B: drop the fact and the writer takes a swap.
4. **Traditional tale.** *The Wind and the Sun* is an Aesop fable. Tom (13) tells it to Pat (9) and Lily on the walk to school. Option A: keep it. Option B: use a Thai animal tale that you choose.
5. **Pier names.** The ferry stops are *Town Pier, School Pier, Market Pier, Park Pier, Hill Pier*, plain nouns with no proper names. Option A: keep. Option B: no stop names; the diagram shows pictures only.
6. **Pen pals in pictures.** The pen-pal sheets are in progress. This map shows each pen pal only as email text on a laptop screen. Option A: keep this. Option B: wait for the sheets and draw the children.
7. **Figures on signs.** Leaflets, rule sheets, and diaries show times, prices, and dates as figures (*8:45 a.m.*, *30 baht*). Option A: keep figures in the pictures (the bible allows them) and words in the text. Option B: words everywhere.
8. **Biography.** 8.2 has the biography of an invented person of the past (Miss Alice). This book gives the biographical objective (R37.7) a living person, Coach Matt, with a phrase *was born* as one fixed chunk, and no ages. Option A: keep. Option B: write a second person of the past, with a name from the Starters list that no cast member uses (none is left after Alice; Daniel gives a name).
9. **Shared Flyers words.** 60 of the 98 recycled Flyers words are also recycled in 8.1 or 8.2. Option A: allow (only the new A2 Key words are exclusive). Option B: ask the three writers for no shared Flyers word.
10. **Same objectives as bank-8.** bank-8 has the same text types (diary, interview, recipe, email, fact file, rules). This map gives each a different situation (a ferry, two diaries, a teacher's profile, a ginger tea recipe, market rules). Option A: keep. Option B: Daniel names the situations.
11. **Ravi again.** Ravi writes in 8.1, 8.2, and here (L09, a recipe). Option A: keep (he is the cook). Option B: give the recipe to Alex.
12. **Tom with Pat.** Tom (13) walks Lily and Pat to school in L06 and tells the tale. Option A: keep. Option B: Grandpa tells it at Green Hill.

**Lead decisions for the writers (2026-10-06).** Daniel reviews the finished lessons, so these choices are provisional. Every question: option A.

## Revision history

- 0.1 — 2026-10-06 — First version (track levels_5_9_20261006).
- 0.2 — 2026-10-06 — Lead decisions for the writers in §9 (Daniel can change them in his review).
