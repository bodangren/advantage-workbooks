# Primary Advantage Quest 6.1 — Lesson Map

Version 0.2 | Date 2026-10-06 | Status: Draft | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

Track: `levels_5_9_20261006`. Companion files: [`primary-quest-5-plan.md`](primary-quest-5-plan.md) (the model for this map), [`primary-levels-5-9-plan.md`](primary-levels-5-9-plan.md) (§3 band rule, §5 profiles, §6 vocabulary, §7 grammar, §8 cast), [`primary-quest-adventure-series-bible.md`](primary-quest-adventure-series-bible.md) (§1–§3), [`level-plans/levels-5-9-objectives.json`](level-plans/levels-5-9-objectives.json), [`level-plans/bank-6.md`](level-plans/bank-6.md), [`data/grammar-levels-5-9.md`](data/grammar-levels-5-9.md), [`reviews/2026-10-06-prereview-level-5.md`](reviews/2026-10-06-prereview-level-5.md), [`../../content/primary/AUTHORING.md`](../../content/primary/AUTHORING.md). The sister map is [`primary-quest-6.2-plan.md`](primary-quest-6.2-plan.md).

## 1. Summary

Quest 6.1 is the first book of level 6 (A1+, `cefr_level = 'A1'`, `ra_level = 6`). It has 14 workbook lessons. Each lesson has 15 glossed words, 2–4 target objectives, and one main grammar point of level 6. QR key: `q6.1/<lesson>`.

Text mix: 7 stories and 7 functional texts, as the levels plan says. The stories are a box that the reader guesses from pictures, a phone call, a lunch box swap, a lost brother at a fair, a traditional tale with repeated lines, a puppy that hides shoes, and a poem about fog. The functional texts are a class timetable, a canteen menu, a direction card, a packing list, riddle cards, a swimming pool notice, and a sports morning notice.

Rule checks (run on this map with a script, 2026-10-06):

- **Book rule:** 15 of 15 objectives of `books["quest-6.1"].objectives` are a target in 1 or more lessons (section 5.1). 14 of them are a target in 2 or more lessons; one lesson only: L26.4.
- **Targets per lesson:** every lesson has 2–4 targets (14 lessons have 4, 0 have 3, 0 have 2). The map has 56 target slots and 34 different target objectives: the 15 book objectives and 19 other objectives (section 5.2).
- **Level rule:** each of the 30 in-scope objectives of level 6 is a target in 3 or more packages (Quest 6.1, Quest 6.2, and bank-6). Result: 30 of 30, none under 3 (section 5.3).
- **Words:** 210 glossed words, no word twice, none in the other Quest 6 map. Flyers 182, Movers 14, Starters 14, A2 Key 0 (section 7). 77 of the Flyers words are new words of the free pool (77 in this book, 42 in the sister book: all 120 pool words are used, none twice; the 120 include *get undressed*, a Movers word). *Get undressed* is the last Movers word of the graph. It is the Movers word of L12.
- **Questions and dialogue:** every lesson plans one real question (the brief shows it in quotation marks). All 7 stories have dialogue.

**Cast (series bible §2–§3):** Quest 6.1 and Quest 6.2 are one school year, so every age is the same in both books. Tom and Ben are 12 (M1). Sam is 11 (P6). Lily, Mia, and Leo are 10 (P5) in Teacher Kim's class. May is 11 (P5, in the same class). Pat is 8 (P3). Pip is a small brown puppy. Teacher Nick is Tom's class teacher. Coach Matt teaches sports. Aunt Sue and Uncle Dan are Mom's sister and Dad's brother. Nobody has a birthday in this book, so no age changes. There is no pen pal. The facts of level 5 stay: Grandpa is 71, Aunt Sue is a nurse in Chiang Mai, Mom and Dad have no job in the text, May and Pat live with their parents, their grandma, and the parrot Bill, and Green Hill is the grandparents' village near the town. Pip is in 6 of the 14 lessons (L02, L04, L08, L09, L10, L13). "One name, one person": no new child name appears. The only proper place names are *Chiang Mai* and *Green Hill* (see question 2).

## 2. Text profile (`quest-6`)

| Measure | Target |
|---|---|
| Words | 260–340, in 4 paragraphs |
| Mean sentence length | 7.0–8.5 words; longest sentence 15 words or less |
| Running words on Starters, Movers, or Flyers (names, glossed, allowed words not counted) | 95% or more |
| Glossed words | 15: at most 1 Movers word, the rest Flyers words, 0–2 Starters words, no word above Flyers except 1 A2 Key word at most (this map: exactly 1 Movers, 13 Flyers, 1 Starters, 0 A2 Key) |
| New words from the free pool | 4–6 in each lesson; the other Flyers words were glossed before (book packages or bank-6) |
| Question marks | 2 or more (book rule: 10 of 14 lessons; this map plans a question in all 14) |
| Dialogue | 6 or more lessons. This map has dialogue in all 7 stories; the functional lessons add speech or reader questions |

The Movers grammar was taught in Quest 5. Quest 6.1 starts the Flyers forms: *should, might / may, could / shall* for suggestions, *be going to, will / won't, so*, and the past continuous with *when*. Each lesson uses one main point (section 6). The present perfect (beyond the fixed question *Have you ever ...?* in Quest 6.2), all conditionals, passive, and reported speech do not appear. The word *if* has a glossary entry only for the fixed use *if you want* and for *ask if*; it never starts a conditional sentence.

## 3. Lesson map

Targets are A1 key ids (`a1-objective-key.json`, GSE 26–29). "Supporting" lists the objectives that the text will clearly practice. Writers add R23.3, R24.6, and R25.2 as supporting objectives where the text practices them. Words are in section 7.

| # | Title | Text type | Genre | App | Cast and place | Targets | Supporting | Main grammar |
|---|---|---|---|---|---|---|---|---|
| L01 | Our Class Timetable | functional: a class timetable with notes | School | nonfiction | Lily, Teacher Kim, Mia, Leo; the classroom | R27.4, L27.7, L23.7, R23.1 | R22.2, L22.2, L24.6, R23.8, R22.3 | should (also: be going to) |
| L02 | The Box on the Doorstep | story: guessing from pictures | Family & Friends | fiction | Lily, Tom, Mia, Pip; the front door and the living room at home | R27.2, R27.3, R27.5, L27.3 | R23.7, R24.2, L24.1, R26.5, R25.4 | might (also: so) |
| L03 | The Canteen Menu | functional: a canteen menu with pictures and prices | Food & Drink | nonfiction | Lily, Mia, Leo; the school canteen | R27.6, R26.6, L27.4, R23.8 | R23.5, R24.2, R22.3, L23.3, L25.3 | could (also: shall) |
| L04 | Coach Matt Calls | story: a phone call with a name and a number | School | fiction | Lily, Coach Matt (on the phone), Pip; the living room at home | L26.4, L27.5, L23.4, L26.1 | L25.1, L24.2, R26.5, L22.2, L23.6 | be going to (also: will) |
| L05 | The Way to Green Hill | functional: written directions on a card | Places & Directions | nonfiction | Lily, Grandma, Grandpa, Uncle Dan; the bus station and the village of Green Hill | R27.1, R27.7, L27.1, L25.2 | R23.6, L24.4, R23.2, R22.3, R26.5 | will (also: should) |
| L06 | The Lunch Box Swap | story: likes and dislikes | Food & Drink | fiction | Leo, Mia, Lily, Teacher Kim; the classroom and the canteen table | L27.4, R26.6, L27.3, L25.3 | L23.3, R26.5, R25.4, L24.2, R23.5 | so (also: could) |
| L07 | Where Is Pat? | story: finding a person from a description | Family & Friends | fiction | May, Pat, Lily, Mia, Teacher Kim, a police officer; the school fair on the school field | L27.6, L27.5, R26.2, L26.3 | L24.1, L25.1, R26.5, R25.4, L24.3 | past continuous (also: when) |
| L08 | My Packing List | functional: a packing list with colors and sizes | Nature & Outdoors | nonfiction | Lily, Mom, Dad, Pip; Lily's bedroom and the hill | R27.5, R27.3, L27.1, R23.2 | R23.5, R24.2, R26.3, L24.3, R23.8 | be going to (also: should) |
| L09 | The Runaway Rice Cake | story: a traditional tale with repeated lines | Pets & Animals | fiction | Grandma, Tom, Lily, Pip; Grandma's house at Green Hill on a rainy evening | L27.2, R26.1, R25.1, L25.4 | L26.2, R26.5, L24.2, R24.4, L23.6 | will (also: can) |
| L10 | Pip Hides the Shoes | story: where things are | Pets & Animals | fiction | Lily, Tom, Mom, Pip; the living room and the kitchen at home | R27.7, L27.3, L24.4, L24.1 | R24.2, R26.5, R25.4, L25.2, R23.8 | past continuous with when (also: where is ...?) |
| L11 | Who Am I? | functional: riddle cards with descriptions | Family & Friends | nonfiction | Teacher Kim, Lily, Mia, Leo, May; the classroom | R27.3, L27.6, L24.1, R24.2 | R26.2, R23.7, R23.5, L23.3, R22.1 | may (also: might) |
| L12 | Swimming Pool Times | functional: a pool notice with opening times and rules | Sports & Play | nonfiction | Dad, Tom, Lily; the town swimming pool and the locker room | R27.4, L27.7, L25.6, R24.6 | L23.7, L24.6, R25.4, R23.2, L22.2 | should (also: will) |
| L13 | Where Is the Sun? | story: a poem with repeated words | Weather | fiction | Tom, Lily, Pip, Teacher Kim; the walk to school and the classroom | L27.2, R26.1, R25.1, R27.2 | L24.5, R25.5, R24.4, L24.2, L25.4 | will (also: so) |
| L14 | The Sports Morning Notice | functional: an event notice with pictures | Sports & Play | nonfiction | Coach Matt, Teacher Nick, Tom, Ben, Lily; the school field | L27.7, R27.7, R27.6, R27.1 | R24.3, R25.3, L24.4, L24.6, R22.2 | be going to (also: will) |

Notes:
- L04 and L14 use Coach Matt (first at Quest 5). L14 also uses Teacher Nick. L05 uses Uncle Dan: he comes to Green Hill by bus. L07 has a police officer with no name and a full look in the picture line.
- L04 and L05 name two places (*Chiang Mai*, *Green Hill*) because L27.5 asks for the names of people or places. See question 2.
- L11 has riddle cards: the answer of each card is on the back, so the text has no spoiler for the reader.
- L09 is the traditional tale of the book (repeated lines, gestures). L13 is a poem with a repeated line. L27.2 is a target in both.
- Pictures that show a sign, a timetable, a menu, or a notice (L01, L03, L05, L12, L14) show the words in double quotation marks, exactly as in the text. Section 4 gives them.
- L14 is the review lesson. It uses the book's words, the written directions, and the event notice.

## 4. Lesson briefs and pictures

Each brief gives who, where, what happens, and how it ends. Each lesson has a hero picture and two inline pictures. Sign, menu, timetable, and notice text is in double quotation marks, as in AUTHORING §6. Cast looks are not described: the cast sheets fix them. A person outside the cast gets a full look at first mention. No child is in distress, on a bed, or with a hand on the face.

### L01 Our Class Timetable

Text type: functional: a class timetable with notes. Genre: School. App type: nonfiction. Place: Lily's classroom.

Lily copies the class timetable for the new term into her notebook and adds notes in her own words. School starts at eight thirty a.m. and ends at three thirty p.m. Lunch is at twelve o'clock. The table shows each day with its lessons. Gym is twice a week, on Tuesday and Thursday, for forty-five minutes. The class goes to the library on Tuesday, and the class meeting is on Friday at two o'clock. Lily writes short notes under the table, such as "Bring a sports shirt on Tuesday and Thursday." She ends with two questions for the reader: "When do we have art?" and "How long is gym?"

- hero: Lily's open notebook on a desk. The page heading is "MY CLASS TIMETABLE". A table has five columns, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", and rows with small drawings for art, gym, library, and lunch.
- inline-para-2: Teacher Kim points at a big timetable on the classroom wall; Mia and Leo sit at their desks and look at it.
- inline-para-3: Lily puts a sports shirt in her school bag at the door at home; Pip sniffs the bag.

### L02 The Box on the Doorstep

Text type: story: guessing from pictures. Genre: Family & Friends. App type: fiction. Place: home.

On Saturday morning a small blue box with a spotted ribbon stands on the doorstep. A label on the lid says "FOR LILY AND TOM". Lily looks at the box and guesses: "It might be a book. It is flat and light." Tom shakes it, and Mia, who is next door, says it might be a game. The pictures show the box, the label, and a stamp, and the reader guesses too. Inside are two paper kites and a card in an envelope. One has stripes and one has spots. A card from Aunt Sue says "Fly them on the hill!" Pip tries to catch the ribbon. Lily asks, "What is inside?"

- hero: A small blue box with a spotted ribbon stands on a doorstep. The label on the lid says "FOR LILY AND TOM". Nobody is in the picture. Pip's nose is at the edge of the frame.
- inline-para-2: Lily holds the box up to her ear and Tom holds the ribbon; Mia leans over the garden wall and points at it.
- inline-para-3: Lily and Tom hold up two paper kites, one with stripes and one with spots, and a card; Pip jumps at the ribbon.

### L03 The Canteen Menu

Text type: functional: a canteen menu with pictures and prices. Genre: Food & Drink. App type: nonfiction. Place: the school canteen.

At twelve o'clock Lily, Mia, and Leo stand at the menu board in the school canteen. The board shows seven items with a picture and a price in words: chicken and rice, thirty baht; noodle soup, thirty baht; fried egg and rice, twenty-five baht; fruit salad, fifteen baht; strawberry yoghurt, fifteen baht; orange juice, ten baht; water, five baht. Lily likes strawberries, so she chooses the yoghurt. Mia says, "We could share a fruit salad." Leo does not like eggs, but he likes chicken. Each child chooses one lunch, and the three prices agree. Mia asks, "What do you want, Lily?"

- hero: A wall board in a canteen with the heading "TODAY'S LUNCH" and seven small food pictures with prices: "chicken and rice 30", "noodle soup 30", "fried egg and rice 25", "fruit salad 15", "strawberry yoghurt 15", "orange juice 10", "water 5". Lily, Mia, and Leo stand in front of it.
- inline-para-2: Lily points at the strawberry yoghurt picture on the board; Mia holds a spoon and smiles.
- inline-para-3: The three children sit at a canteen table with trays: Lily has yoghurt, Mia has fruit salad, and Leo has chicken and rice.

### L04 Coach Matt Calls

Text type: story: a phone call with a name and a number. Genre: School. App type: fiction. Place: home; Coach Matt is in Chiang Mai.

On Wednesday at five o'clock the home phone rings, and Lily answers. A man says, "This is Coach Matt. Is Tom's dad there?" Dad is out, so Lily takes a pencil and a note. Coach Matt says that he is in Chiang Mai this week and that football practice is going to move from Thursday to Friday at four p.m. He says his phone number in words, and Lily writes it down. Pip barks at the phone, so Lily asks, "Please say it again." Coach Matt says it a second time. Lily reads the name and the number back, and Coach Matt says, "No problem. Thank you, Lily."

- hero: Lily sits on the sofa with the home phone at her ear, a pencil in her hand, and a small note on her knee. Pip sits next to her and looks at the phone.
- inline-para-2: Lily holds up a note that says "COACH MATT" and a row of number words; Pip's mouth is open as he barks.
- inline-para-3: Coach Matt (red sports shirt, silver whistle) stands outside a hotel in a sunny street and holds a phone; the story gives the place.

### L05 The Way to Green Hill

Text type: functional: written directions on a card. Genre: Places & Directions. App type: nonfiction. Place: the town bus station and Green Hill.

Uncle Dan comes to Green Hill by bus on Sunday, and he does not know the way. Grandma writes a direction card, and Lily draws a small picture beside each line. The card says: "Get off the bus at the post office. Go straight on past the fire station. Turn left at the big tree. You will see our house. It is the yellow house with the blue gate." The last line says, "When it rains, take a taxi." Lily reads each line out loud to Grandpa, and he checks them. Uncle Dan reads the card at the bus station and walks to the house. He arrives at eleven o'clock, and Grandma has tea ready. The card ends with a question for the reader: "Can you find the yellow house?"

- hero: A paper card on a table headed "THE WAY TO GREEN HILL" with four lines of directions and small drawings of a post office, a fire station, a big tree, and a yellow house with a blue gate. Lily's pencil lies next to it.
- inline-para-2: Lily and Grandpa sit at the table and read the card; Grandma stands behind them with a teapot.
- inline-para-3: Uncle Dan (short mustache, blue checked shirt) walks along a village road past a fire station and holds the card.

### L06 The Lunch Box Swap

Text type: story: likes and dislikes. Genre: Food & Drink. App type: fiction. Place: the classroom and the canteen.

At twelve o'clock Leo and Mia sit down with two blue lunch boxes. The boxes look the same, so they pick the wrong ones by mistake. Mia opens Leo's box: it is untidy and has a cheese sandwich, a banana, and a bag of olives. She says, "I don't like olives." Leo opens Mia's tidy box: it has rice, an egg, and an apple. He says, "I like apples, but I don't like eggs." They ask each other, "Do you like cheese?" and "Do you like rice?" Mia likes cheese and Leo likes rice, so they swap the foods that they like. Teacher Kim smiles and says, "What a good idea."

- hero: Leo and Mia sit at a canteen table. In front of each child is an open blue lunch box that belongs to the other child. Leo's box is untidy and Mia's box is tidy.
- inline-para-2: Mia holds up a bag of olives and shakes her head; Leo holds an egg and makes a face.
- inline-para-3: Leo and Mia swap a cheese sandwich and a bowl of rice across the table and laugh; Teacher Kim watches from the next table.

### L07 Where Is Pat?

Text type: story: finding a person from a description. Genre: Family & Friends. App type: fiction. Place: the school fair.

On Saturday the school fair is open from nine a.m. May is eleven and she looks after her brother Pat, who is eight. May turns round and Pat is not at the bookstall any more. She is a little worried and goes to the information desk. A police officer is there with a small red car for the children to see. May says: "Pat is small. He has short black hair. He is wearing a red cap, a green T-shirt with a white stripe, and blue shorts." Teacher Kim and the police officer ask Lily and Mia to look, and the girls find out where he is. Pat is at the stage, where he watches a drum show. He did not hear May. May hugs him, and he says sorry. Teacher Kim asks, "Where did you see him last?"

- hero: May stands at an information desk on the school field. A sign on the desk says "INFORMATION". Teacher Kim and a police officer (white short-sleeved shirt, dark cap) stand behind it. In the background are stalls and a small stage.
- inline-para-2: May shows with her hand how small Pat is; the police officer writes on a pad; Lily and Mia stand next to her.
- inline-para-3: Pat (red cap, green T-shirt with a white stripe, blue shorts) stands in front of a small stage and watches a drum show; May runs up with open arms.

### L08 My Packing List

Text type: functional: a packing list with colors and sizes. Genre: Nature & Outdoors. App type: nonfiction. Place: home and the hill.

Lily's class is going to climb the hill on Friday with Teacher Kim and have a day camp with a tent, and Lily writes her own packing list. Dad reads out the things to take, and Lily writes each one with a color and a size. The list says: "a big blue water bottle", "a small red bag", "a white hat", "sunglasses with black frames", and "trainers with green laces". Dad says the big umbrella is heavy, so she leaves it at home. Dad says that good trainers are important, because a long walk can make feet sore. The list also shows her school sports uniform. Lily ticks each thing as she packs it. At the end, Pip sits in the open bag, and Lily lifts him out. Dad asks, "Where is your hat?"

- hero: A paper list headed "MY PACKING LIST" lies on Lily's bed next to a small red bag. The list has six lines with small drawings: "a big blue water bottle", "a small red bag", "a white hat", "sunglasses", "trainers", "sports uniform".
- inline-para-2: Dad stands at Lily's bedroom door and reads from a paper; Lily kneels at her bed and puts a hat into the red bag.
- inline-para-3: Pip sits in the open red bag with the white hat on his head; Lily laughs and lifts him out.

### L09 The Runaway Rice Cake

Text type: story: a traditional tale with repeated lines. Genre: Pets & Animals. App type: fiction. Place: Grandma's house at Green Hill.

It rains on Saturday evening in Green Hill, and Grandma tells Tom and Lily a tale. An old woman makes a rice cake, and it jumps off the table and runs away. It sings, "Run, run, as fast as you can! You can't catch me, I am the rice cake!" A dog runs after it, then a hen, then a fox. At each place the rice cake sings the same words, and Tom and Lily say them with Grandma. They run past a cave and over a stream. The fox says, "I don't believe you can run so fast." The rice cake stops to show him, and the old woman comes. She says, "Let's share it," and all four eat a piece. Grandma ends, "Now it is time for bed." Each animal asks, "Where are you going?"

- hero: Grandma sits in an armchair with a book on her knee; Tom and Lily sit on the floor and listen; rain runs down the window; Pip lies on a cushion.
- inline-para-2: A storybook picture: a round white rice cake with a smiling face runs along a path; a dog, a hen, and a fox run after it.
- inline-para-3: The old woman, the dog, the hen, and the fox sit by a stream and share the rice cake in pieces.

### L10 Pip Hides the Shoes

Text type: story: where things are. Genre: Pets & Animals. App type: fiction. Place: home.

On Sunday at nine thirty Tom and Lily must leave for the park, but their shoes are not at the door. Mom asks, "Where are the shoes?" Pip was playing when they left, and now he looks happy. Lily finds Tom's left shoe under the sofa and Tom's right shoe behind the curtain. She finds her own shoes: one is in the box next to the fridge, and one is on the chair by the window. Last, Tom finds Dad's work glove in Pip's bed, and it is full of small things: a ball and a sock. Mom laughs. Pip gets a hug, and the children leave at ten.

- hero: The shoe rack at the front door of a house is empty. Mom stands next to it with her hands open; Tom and Lily stand beside her; Pip sits happily on the mat.
- inline-para-2: Lily kneels and looks under the sofa; Tom's left shoe sticks out; Pip watches with the red ball in his mouth.
- inline-para-3: Tom holds up a big gray glove from Pip's bed; a ball and a sock lie next to it; Pip wags his tail.

### L11 Who Am I?

Text type: functional: riddle cards with descriptions. Genre: Family & Friends. App type: nonfiction. Place: the classroom.

Teacher Kim's class plays "Who Am I?" on a Wednesday afternoon. Each child writes a riddle card about an animal or a person, and a classmate guesses it. Leo's card says, "I have two wings and a big beak. I live in a nest." Mia's card says, "I wear a uniform and fly a big plane." May's card says, "I sing songs on a stage, and I wear a red dress." The answers are on the back with a picture. Lily's card is about Pip: "I am small and brown. I have a red collar." The class says, "It may be Pip!" Teacher Kim gives each card a small star.

- hero: Six riddle cards in two rows on a table. Each shows a short text and a question mark; the heading on one is "WHO AM I?". Lily and Mia lean over the table.
- inline-para-2: Leo holds a card and a paper bird with two wings above his head; the class laughs.
- inline-para-3: A card turned over shows a drawing of a small brown puppy with a red collar; Lily smiles and Teacher Kim claps.

### L12 Swimming Pool Times

Text type: functional: a pool notice with opening times and rules. Genre: Sports & Play. App type: nonfiction. Place: the town swimming pool.

Dad takes Tom and Lily to the town swimming pool on Saturday and reads the notice at the entrance. The pool is closed on Monday. It is open from three thirty p.m. to seven p.m. from Tuesday to Friday, and from nine a.m. to six p.m. on Saturday and Sunday. A swimming lesson is on Saturday at ten o'clock and takes forty-five minutes. The rules say: "Get undressed in the locker room." "Do not run." "Children under ten swim with an adult." Lily is ten, so she can swim by herself, and Dad stays on the bench. Tom says that they usually come on Tuesday, but this week they are busy on Tuesday. Lily is not ready yet, so Tom and Dad wait. Tom asks, "Is the pool open on Monday?"

- hero: The sign at the pool entrance: "TOWN SWIMMING POOL". Below it: "Monday: closed" / "Tuesday to Friday: 3.30 p.m. to 7 p.m." / "Saturday and Sunday: 9 a.m. to 6 p.m." / "Swimming lesson: Saturday, 10 a.m.". Dad, Tom, and Lily stand in front of it.
- inline-para-2: The door of the locker room with a sign "LOCKER ROOM"; Tom, in a T-shirt and shorts, carries his towel and his bag to the door; Dad waits beside it. (Nobody undresses in a picture: everyone wears clothes or swimwear.)
- inline-para-3: Lily swims in the pool with a swimming cap; Tom waves from the water; Dad sits on a bench at the side.

### L13 Where Is the Sun?

Text type: story: a poem with repeated words. Genre: Weather. App type: fiction. Place: the road to school and the classroom.

On Tuesday morning there is a thick fog. Tom walks Lily and Pip to school and says, "I can't see the road." Lily whispers a line: "Where is the sun? Where is the sun?" Tom whistles, and Pip runs ahead. At school the class writes a poem about the fog, and the same line comes back in each verse. The poem says: "Where is the sun? Where is the sun? Fog, fog, go away! The sun will come, the sun will come." Teacher Kim reads it out and the class says the repeated line. By lunch the fog is gone, and the sun shines on the school field.

- hero: Tom, Lily, and Pip walk along a road in thick white fog; only their shapes and a lamp post can be seen.
- inline-para-2: The classroom: Teacher Kim writes the poem on the board under the heading "WHERE IS THE SUN?" and the children copy it.
- inline-para-3: The children sit on the school field in bright sun at lunchtime; Pip lies on the grass.

### L14 The Sports Morning Notice

Text type: functional: an event notice with pictures. Genre: Sports & Play. App type: nonfiction. Place: the school field.

Coach Matt and Teacher Nick pin a notice on the school gate: "Family Sports Morning" on Saturday at nine a.m. The notice has a picture beside each event: a running race, a ball game, and a music warm-up with pop music and rock music. It says who is going to help: Tom and Ben are going to hold the finish line, and Lily has the job of giving out water. A small map says, "Go in through the school gate. Go straight on to the field. The tent is on the left." Families can join if they want. The last line says that the morning ends at twelve o'clock with lunch. The notice asks, "Will you come?"

- hero: A notice board on the school gate with the heading "FAMILY SPORTS MORNING" and "Saturday, 9 a.m." and three small pictures: a race, a ball game, and a loudspeaker. Coach Matt and Teacher Nick pin it up.
- inline-para-2: Tom and Ben hold a long finish line ribbon between two posts on the field; Lily puts bottles on a table.
- inline-para-3: Families stand on the field and follow Coach Matt's warm-up; a loudspeaker on a table plays music.

## 5. Objectives

### 5.1 Book rule: the 15 objectives of `books["quest-6.1"]`

| Objective | Target in | Text |
|---|---|---|
| L26.4 | L04 | Can identify a caller’s name and phone number from a short, simple telephone conversation. |
| R27.1 | L05, L14 | Can follow short, simple written directions (e.g. ‘go from X to Y’). |
| R27.2 | L02, L13 | Can guess what a story or text is about from the pictures. |
| R27.3 | L02, L08, L11 | Can understand short, simple descriptions of objects, people and animals if supported by pictures. |
| R27.4 | L01, L12 | Can understand the information in a simple school timetable giving days and times of classes. |
| R27.5 | L02, L08 | Can understand basic sentences describing familiar everyday items (e.g. ‘colour’, ‘size’), if supported by pictures. |
| R27.6 | L03, L14 | Can understand simple informational material containing familiar words, if supported by pictures (e.g. ‘a menu with pictures of food’). |
| R27.7 | L05, L10, L14 | Can understand basic sentences about where things, animals or people are. |
| L27.1 | L05, L08 | Can understand straightforward instructions, if spoken slowly and clearly. |
| L27.2 | L09, L13 | Can recognise words or phrases that are repeated in a short dialogue or poem. |
| L27.3 | L02, L06, L10 | Can understand simple phrases related to familiar topics, if spoken slowly and clearly and supported by pictures. |
| L27.4 | L03, L06 | Can understand simple questions and answers about peoples likes and dislikes. |
| L27.5 | L04, L07 | Can identify the names of people or places in short, simple dialogues, if spoken slowly and clearly. |
| L27.6 | L07, L11 | Can identify people in their immediate surroundings or in pictures from a short, simple description of their physical appearance and clothes. |
| L27.7 | L01, L12, L14 | Can recognise key information (e.g. ‘place’, ‘time’) about everyday events, if spoken slowly and clearly. |

Result (script check, 2026-10-06): 15 of 15 objectives are a target in 1 or more lessons. None is missing.

L26.4 has one target lesson (L04). Quest 6.2 does not target it. bank-6 b015 to b017 list it as a supporting objective, and level 5 (bank-5) already gives it practice.

### 5.2 Other targets (from the `--next` list, lowest practice first)

The list is `level-coverage.ts --next quest-6.1`: band objectives taught before the book, with the practice count after first teaching.

| Objective | Practice after (before this book) | Target in | Reason |
|---|---|---|---|
| L25.6 | 2 | L12 | lowest practice |
| R23.1 | 2 | L01 | lowest practice |
| R26.6 | 2 | L03, L06 | lowest practice |
| L23.7 | 3 | L01 | lowest practice |
| L25.2 | 3 | L05 | lowest practice |
| L25.3 | 3 | L06 | lowest practice |
| L26.1 | 3 | L04 | lowest practice |
| L24.1 | 4 | L10, L11 | lowest practice |
| R25.1 | 4 | L09, L13 | lowest practice |
| R26.1 | 4 | L09, L13 | lowest practice |
| L23.4 | 5 | L04 | lowest practice |
| L26.3 | 5 | L07 | lowest practice |
| R23.2 | 5 | L08 | lowest practice |
| R26.2 | 5 | L07 | lowest practice |
| R23.8 | 12 | L03 | low practice |
| R24.2 | 18 | L11 | fits the lesson text |
| L25.4 | 25 | L09 | fits the lesson text |
| L24.4 | 32 | L10 | fits the lesson text |
| R24.6 | 45 | L12 | fits the lesson text |

The band objectives that this map does not target are L26.2, R23.7, R24.5, L25.1, R26.3, L22.1, L23.5, R23.4, R23.6, L23.2, L25.5, L23.1, R23.5, L24.6, R22.2, R25.3, R26.5, L24.5, R24.3, R25.5, R22.1, L22.2, L24.3, L23.3, R24.4, R25.4, L23.6, L24.2, R25.2, R22.3, R23.3. They have supporting use in many lessons.

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
| Past continuous (background and interrupted action) | L07, L10 | - |
| *Be going to* for plans and predictions | L04, L08, L14 | L01 |
| *Will / won't* | L05, L09, L13 | L04, L12, L14 |
| *Might*; *may* for possibility | L02, L11 | - |
| *Should* for advice | L01, L12 | L05, L08 |
| *Could* for suggestions; *shall* for suggestions | L03 | L06 |
| Conjunction *so* | L06 | L02, L13 |

Every point has a lesson. The Movers list was finished in Quest 5, so Quest 6 has no Movers items to catch up. *Have you ever ...?* and *first, then, next, finally* start in Quest 6.2. Avoid at level 6: the present perfect beyond *ever*, conditionals, *used to*, passive, and reported speech.

## 7. Words

Each lesson glosses 15 words: 1 Movers word, 13 Flyers words, and 1 Starters word (the `quest-6` profile allows 1 Movers word at most). The Flyers words are 77 new words of the free pool (Flyers words that no package glossed yet) and Flyers words that bank-6, bank-5, or Quest 5 glossed before. The words of a lesson fit its text. American spelling.

| # | New Flyers words (free pool) | Flyers words glossed before | Movers | Starters |
|---|---|---|---|---|
| L01 | a.m., p.m., how long, meeting, twice, until | timetable, subject, science, art, language, gym, geography | second | afternoon |
| L02 | surprise, look like, unusual, spotted, no-one | envelope, card, guess, secret, strange, special, might, anything | shape | box |
| L03 | spoon, strawberry, sugar, yoghurt, a few, a little | meal, cheap, expensive, delicious, popular, taste, pepper | hot | chicken |
| L04 | zero, hear, in a minute, no problem, at the moment | telephone, conversation, repeat, remember, important, forget, anyone, else | call | phone |
| L05 | straight on, get to, post office, fire station, taxi, exit | path, corner, left, right, middle, front, across | along | street |
| L06 | tidy, untidy, unkind, if you want, of course, without | butter, jam, cereal, fork, salt, olives, piece | carry | lunch |
| L07 | necklace, ring, police officer, find out, worried, stripe | missing, friendly, stage, prize, competition, enter, everywhere | lose | baseball cap |
| L08 | sunglasses, trainers, uniform, view | sore, tent, camp, umbrella, plastic, heavy, hill, snack, bandage | careful | bag |
| L09 | stream, cave, believe, wish, as ... as, while | disappear, appear, lucky, dark, empty, fast, let | hide | story |
| L10 | glove, look after, go out, make sure, use, sure | cushion, fridge, cooker, key, bit, hard, search | noise | under |
| L11 | wing, pilot, singer, artist, waiter, fire fighter | eagle, insect, creature, fur, nest, swan, camel | clever | zoo |
| L12 | fall over, by yourself, usually, yet, visit | hour, midday, quarter, half, warm, full, elbow, knee | get undressed | swim |
| L13 | fog, foggy, go away, whisper, whistle, wonderful | soft, sound, still, low, high, enough, storm | quiet | sun |
| L14 | racing, pop music, rock music, such | team, race, match, winner, score, volleyball, flag, break, bin | busy | ball |

Counts: 182 Flyers + 14 Movers + 14 Starters = 210 glossed words, 210 different (no word twice, none in the other Quest 6 map). New pool words: 77 (6, 5, 6, 5, 6, 6, 6, 4, 6, 6, 6, 5, 6, 4). Movers: 1 in every lesson (L12 is *get undressed*, the last unglossed Movers word of the graph).

Word notes for writers:
- **The free pool.** The pool file lists 134 words. 12 of them are already glossed in bank-6 packages (*snack, suddenly, thank, through, touch, turn, oven, desert, hill, traffic, wheel, work*). *Moustache* and *practise* are Quest 5 words under the spelling *mustache* and *practice*. So 120 pool words are new. The two maps use all 120. The 12 and the two spelling variants appear as "glossed before" words where a lesson needs them (see the lists).
- **Function words and phrases.** *If, as ... as, a few, a little, will, such, while, time, until, twice, yet, by yourself, by myself, if you want, you're welcome, no problem, of course, in a minute, at the moment, how long, look like, find out, make sure, go away, go out, turn on, turn off* get a glossary entry with the sense of the text and a simple example. Use the entry style of Quest 4 (*always, never, every*).
- **Abbreviations.** *a.m.* and *p.m.* are glossed words. Write them with periods. The converter must accept them: check the first lesson that uses them and tell the lead if it fails.
- **Swap rule.** A writer can swap at most 2 words of a lesson for other Flyers words of the same topic that no other lesson of the two books uses. Tell the lead which, so that the counts stay true. Never swap a free-pool word for a word glossed before.
- **Allowed words.** Weekdays, months, ordinal and cardinal number words, *baht*, and the Flyers time words (*quarter, half, past, timetable*) go in `allow` if the check marks them. Names of places (*Chiang Mai, Green Hill*) go in `names` or `allow`.

## 8. Questions and tasks

- MCQ (4 printed of 10): at least 2 test a target objective (L01: "When do we have gym?"; L03: "How much is the strawberry yoghurt?"; L05: "Where must Uncle Dan turn left?"; L12: "When is the pool open on Sunday?").
- Short answer (1): a personal question in the lesson frame (L01: "What is your favorite lesson? When do you have it?"; L03: "What do you choose for lunch? How much is it?"; L06: "What do you like? What don't you like?").
- Writing: a personal version of the text type (L01: "Write your timetable for one day." L03: "Write a menu with three foods and prices." L05: "Write directions from your door to the school gate." L08: "Write a packing list for a day trip.").
- Listening objectives (L-ids) are tested through the audio of the text: the question uses the words that the voice says. L04 needs one voice for the phone call and a second voice for Lily if the audio plan allows it (plan D5 starts one voice for each speaker in Adventure 7). L27.6 (L07, L11) needs a spoken description with no picture help in the question.

## 9. Questions for Daniel

1. **Money in L03.** The menu needs prices (R27.6 asks for a menu with pictures). This map uses the Thai *baht*, with prices in words (*thirty baht*). Option A: keep *baht*. Option B: use no prices and drop prices from the menu.
2. **Place names in L04 and L05.** L27.5 needs names of people or places. The bible says places have plain nouns. This map uses *Chiang Mai* (L04, Coach Matt is there for a week) and *Green Hill* (L05, the grandparents' village). Option A: keep both. Option B: names of people only, and drop L27.5 from L04 and L07 (the book rule then fails for L27.5).
3. **New facts.** Uncle Dan visits Green Hill by bus (L05). A police officer at the school fair has a small red car (L07). Coach Matt is in Chiang Mai for a week (L04). Do you accept them?
4. **The pool words that are already glossed.** The pool file holds 134 words, but 12 are already glossed in bank-6 packages and 2 are Quest 5 words under another spelling. This map treats them as "glossed before" and uses the 120 new words. Option A: keep this. Option B: change the pool file and send the 14 words back to the pool.
5. **One Movers word in each lesson.** The `quest-6` profile allows 1 Movers word at most. This map gives each lesson 1 Movers word that an earlier package glossed, and *get undressed* in L12. The Starters word in each lesson (14 in all) are simple words (for example *box, phone, street*). Option A: keep them. Option B: replace each Starters word with one more Flyers word that was glossed before.
6. **Traditional tale in L09.** *The Runaway Rice Cake* is a short variant of an old runaway-food tale. The ending is kind: the old woman, the dog, the hen, and the fox share the cake. Option A: keep it. Option B: use a Thai animal tale that you choose.
7. **Time and number texts in pictures.** The text of a timetable or a notice uses words for times (*half past eight*). The picture of L01, L12, and L14 may show figures (*3.30 p.m.*) on the sign. Option A: keep figures on signs. Option B: words on signs too.

**Lead decisions for the writers (2026-10-06).** Daniel reviews the finished lessons, so these choices are provisional. Questions 1–6: option A. Question 7: option A. A sign or a timetable in a picture can show figures (for example "3.30 p.m."), but the times must be the same times as in the text. The text writes times in words. If the converter refuses *a.m.* or *p.m.*, the text says *in the morning* or *in the afternoon*, and the writer reports the change.

## Revision history

- 0.1 — 2026-10-06 — First version (track levels_5_9_20261006).
- 0.2 — 2026-10-06 — Lead review: L05 card line without a conditional ("When it rains, take a taxi."); L12 brief without the present perfect; L12 locker-room picture shows the door only. Lead decisions for the writers in section 9 (Daniel can change them in his review).
