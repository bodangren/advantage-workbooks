# Forge brief: Storytime Advantage Level 2, Unit 2 (weeks 9 to 16)

Track: `storytime_l2_unit2_20261106`, Task 2.3 (spec FR-4.4). Date: 2026-11-07. Writer: the Workbooks session of the track.

This brief tells Forge what to draw for unit 2. The machine list is `content/storytime/drafts/l2/print/pictures-u2.json` (229 rows, commit c4f2e7d). Each row gives the id, the week, the use, the text, the prompt, the caption, the object counts, the size class, and the two file names. The list has priority: if this brief and a row differ, the row is correct.

**Gate.** Forge can stage its inputs now. Forge starts no paid render before Daniel's go (Task 2.5, about 2026-11-19, after his English check of 2026-11-18). The go names the book rows and the card rows together, through the PM session.

## 1. Inputs

| File | SHA-256 | Note |
|---|---|---|
| `content/storytime/drafts/l2/print/pictures-u2.json` | `63d415000eca9d6be1a6ad533c12ff81e127cd2c76ffac339697f91b99f754ec` | The 229 rows (machine list) |
| `content/storytime/drafts/l2/print/pictures-u2.md` | `fbf80559419b1fefcc97834cd146c245f437e479365c507c1616cb094bb4e24f` | The readable copy of the same rows |
| `content/storytime/drafts/l2/print/card-pictures-u2.json` | `d24d534361d84ad9b4ebc27f3571e0380fc59f6d493442043d4207fa7eae9059` | The 36 card entries; the card rows come from them |

The English text can still change at Daniel's check. After his approval, Task 2.6 runs the list again. A changed row goes to the PM session as a difference.

## 2. Style rules (FR-9 version 1 of the print track)

The rules are FR-9 version 1 (2026-10-25) of `measure/tracks/storytime_print_r1_20261025/spec.md`. They are the rules of unit 1.

- Color output: PNG, 8-bit, sRGB, opaque (no alpha channel), no CMYK. No letters, words, or numbers in a picture.
- Each picture shows the objects in the counts of its text and its `objectCounts` (rule 9.2).
- Line-art output for every row: the same pixel size as the color file; PNG, 8-bit, grayscale; an opaque white `#FFFFFF` background; black outlines only, with no gray fill or shading (anti-aliased edges are allowed); closed outlines, so that a child can color the picture; no line thinner than 12 px; the same scene, cast, and object counts as the color file. The file name is the color name with `-line` before the version.

| Class | Use | Pixels | Aspect | Background | Composition | Rows in unit 2 |
|---|---|---|---|---|---|---|
| A | Reader story pages | 4000 × 3000 | 4:3 landscape | The scene, opaque | Every named object, face, and hand in the central 90 percent. Workbooks can cut 5 percent at each edge. | 112 |
| B | Reader covers | 4000 × 3000 | 4:3 landscape | The scene, opaque | One in-scene render with the cast in place. The top 30 percent is calm (sky or wall) for the title. | 14 |
| C | Picture words: check rows, practice lines, D4 prompts, cards | 1500 × 1500 | 1:1 | White `#FFFFFF` | One object, or one person who does the action, centred, about 80 percent of the frame. | 103 |

## 3. Cast (D4: the unit 1 cast only)

Unit 2 has no new character, so it needs no new cast sheet. Use the Forge cast sheets of unit 1 (the week 1 set of 2026-10-23).

- The class children are at age 5: Nan, Sam, May, Ben, Mia, Pat, and Lily. The prompts give Nan's look in full and give the other children the sentence "(drawn young, about five years old)".
- Tom is at age 8 ("drawn young, about eight years old"). Tom and Lily are brother and sister; Mom, Dad, Grandma, and Grandpa are their family.
- Teacher Kim is the class teacher. Pip is the puppy; the prompts give his look in full.
- Homes: Nan's home has a blue sofa. Tom's home has a green sofa, a window, and a small brown rug under the window, as in unit 1 week 7.
- Nobody else is drawn: no new adult, child, or animal person. The animals and things of a scene (a hen, a gingerbread man, transport) are props, not cast.

## 4. The weeks: scenes, props, and cast

### Week 9: "Yum!" and "Dad and the Mop" (34 rows: 6 card, 9 check-row, 2 cover, 1 d4-prompt, 16 story-page)

- Read-along "Yum!": the long low lunch table of the kindergarten classroom. Cast: Nan, Sam, May, Ben, Mia, Pat, and Lily (age 5), Teacher Kim, Pip. Props: food: rice, eggs, milk, bananas, bread, juice, pink cake; page 8: Pip on a small chair with a napkin and his own tiny puppy cake.
- Decodable "Dad and the Mop": the bright living room of Tom's home (green sofa, window, small brown rug, open toy box, soft round blue mat). Cast: Dad, Tom (age 8), Pip. Props: a mop with a long wooden handle.

### Week 10: "Dress Up!" and "The Tan Man" (34 rows: 7 card, 9 check-row, 2 cover, 16 story-page)

- Read-along "Dress Up!": the dress-up corner of the classroom (a big open dress-up box, a long mirror). Cast: Nan, Sam, May, Ben, Mia, Pat, and Lily (age 5), Teacher Kim, Pip. Props: clothes: dress, skirt, T-shirt, trousers, socks, shoes, jacket, hat; page 8: Pip in the dress-up box with a small purple hat.
- Decodable "The Tan Man": the bright kitchen of Tom's home (low wooden table, door, soft round green mat). Cast: Tom (age 8), Dad. Props: one small tan gingerbread man with white icing eyes, a pan.

### Week 11: "Where Is Pip?" and "The Den" (31 rows: 4 card, 9 check-row, 2 cover, 16 story-page)

- Read-along "Where Is Pip?": Nan's home: the cozy living room (blue sofa, soft rug, toy box, low wooden table, big soft armchair, door, window) and Nan's small bedroom. Cast: Nan, Sam, May, Ben, Mia, Pat, and Lily (age 5), Pip. Props: hide-and-seek: bed, table, sofa, box, chair, door, window; page 8: Pip sits right behind Nan.
- Decodable "The Den": the bright living room of Tom's home. Cast: Tom (age 8), Mom, Dad, Pip. Props: a den of a big blue blanket.

### Week 12: "Open Your Book!" and "The Hen and the Hat" (33 rows: 5 card, 9 check-row, 2 cover, 1 d4-prompt, 16 story-page)

- Read-along "Open Your Book!": the kindergarten classroom (low tables, a wall with big animal pictures). Cast: Nan, Sam, May, Ben, Mia, Pat, and Lily (age 5), Teacher Kim, Pip. Props: school things: book, bag, pencil, pen, crayon, eraser, ruler; page 8: Pip opens Nan's book under the table.
- Decodable "The Hen and the Hat": the sunny farmyard of Grandma and Grandpa's farm (green grass, small red barn, low wooden fence, small straw mat). Cast: Dad, Tom (age 8), Grandma, Grandpa. Props: a small brown hen with a red comb, Dad's big straw hat.

### Week 13: "Look at Me!" and "Hop on Top!" (34 rows: 6 card, 9 check-row, 2 cover, 1 d4-prompt, 16 story-page)

- Read-along "Look at Me!": the sunny kindergarten playground (green grass, low red climbing frame, white line on the ground). Cast: Nan, Sam, May, Ben, Mia, Pat, and Lily (age 5), Teacher Kim, Pip. Props: actions: run, jump, walk, clap, kick, throw, catch; a red ball; page 8: Pip catches the ball.
- Decodable "Hop on Top!": the small sunny garden of Tom's home (green grass, low wooden fence, red flowers). Cast: Tom (age 8), Mom, Pip. Props: a clay pot, a soft blue mat.

### Week 14: "Hot and Cold" and "On Goes the Fan!" (33 rows: 6 card, 9 check-row, 2 cover, 16 story-page)

- Read-along "Hot and Cold": the small front garden of Nan's home (green grass, low white fence, small tree) and Nan's cozy living room. Cast: Nan, Pip. Props: weather: sun, clouds, wind, rain, heat, cold; a yellow umbrella, a red kite, a big soft blanket, wool hats; page 8: Pip under the blanket in a small red wool hat.
- Decodable "On Goes the Fan!": the bright living room of Tom's home. Cast: Dad, Mom, Pip. Props: two small white electric fans.

### Week 15: "Look, a Bus!" and "The Tag" (29 rows: 2 card, 9 check-row, 2 cover, 16 story-page)

- Read-along "Look, a Bus!": a quiet street of a small town (wide footpath, low bridge over a calm river, blue sky). Cast: Nan, Sam, May, Ben, Mia, Pat, and Lily (age 5), Teacher Kim, Grandpa, Pip. Props: transport: bus, car, bike, truck, train, boat, plane; page 8: Pip in the front basket of Grandpa's red bike.
- Decodable "The Tag": the bright living room of Tom's home, now also with a small clay pot by the door and a row of coat pegs on the wall. Cast: Tom (age 8), Mom, Pip. Props: the small round gold tag of Pip's red collar.

### Week 16: "Unit 2 Review" (1 row)

- The review week has no books. Its one row is the picture word `guitar` of a paper page (class C).

## 5. The card rows of unit 2 (class C, the unit 1 card style)

Each card row has the prompt of its entry in `card-pictures-u2.json`. Every prompt ends with the fixed sentence "One clear picture, the main thing large in the middle, a plain light background. No letters, words, or numbers anywhere." The table leaves out that sentence. A card word with a unit 1 picture of the same word uses that picture again and has no row here (for example `l2-w04-card-dad`).

| Row id | Week | Word | Prompt (without the fixed end) |
|---|---|---|---|
| `l2-w09-card-nod` | 9 | nod | May (drawn young, about five years old) nods her head yes with a big smile; two small curved lines next to her chin show the nod. |
| `l2-w09-card-dinosaur` | 9 | dinosaur | A friendly green toy dinosaur with a long neck, a long tail, and a big smile. |
| `l2-w09-card-rice` | 9 | rice | A white bowl of white rice. |
| `l2-w09-card-banana` | 9 | banana | A yellow banana. |
| `l2-w09-card-bread` | 9 | bread | A slice of brown bread. |
| `l2-w09-card-juice` | 9 | juice | A glass of orange juice. |
| `l2-w10-card-pad` | 10 | pad | A small notepad of plain yellow paper with a red top edge, with no writing on it. |
| `l2-w10-card-skirt` | 10 | skirt | A small red skirt. |
| `l2-w10-card-t-shirt` | 10 | T-shirt | A small yellow T-shirt. |
| `l2-w10-card-trousers` | 10 | trousers | A pair of small green trousers. |
| `l2-w10-card-socks` | 10 | socks | A pair of small white socks with red stripes. |
| `l2-w10-card-shoes` | 10 | shoes | A pair of small red shoes. |
| `l2-w10-card-jacket` | 10 | jacket | A small orange jacket. |
| `l2-w11-card-elbow` | 11 | elbow | Sam (drawn young, about five years old) bends one arm and points at his elbow with the other hand. |
| `l2-w11-card-envelope` | 11 | envelope | A closed white paper envelope with a red heart sticker on the flap. |
| `l2-w11-card-door` | 11 | door | A green door, closed. |
| `l2-w11-card-window` | 11 | window | A window with white frames and a blue sky behind it. |
| `l2-w12-card-hop` | 12 | hop | Ben (drawn young, about five years old) hops on one foot, full body. |
| `l2-w12-card-hippo` | 12 | hippo | A gray hippo with a big round body, small ears, and a friendly face. |
| `l2-w12-card-crayon` | 12 | crayon | A green crayon. |
| `l2-w12-card-eraser` | 12 | eraser | A pink eraser. |
| `l2-w12-card-ruler` | 12 | ruler | A wooden ruler with plain line marks. |
| `l2-w13-card-run` | 13 | run | Sam (drawn young, about five years old) runs, full body. |
| `l2-w13-card-walk` | 13 | walk | Ben (drawn young, about five years old) walks, full body. |
| `l2-w13-card-clap` | 13 | clap | Mia (drawn young, about five years old) claps both hands, full body. |
| `l2-w13-card-kick` | 13 | kick | Pat (drawn young, about five years old) kicks a red ball, full body. |
| `l2-w13-card-throw` | 13 | throw | Lily (drawn young, about five years old) throws a red ball with one hand, full body. |
| `l2-w13-card-catch` | 13 | catch | Tom (drawn young, about eight years old) catches a red ball with both hands, full body. |
| `l2-w14-card-sunny` | 14 | sunny | A bright yellow sun with short rays over a small patch of green grass. |
| `l2-w14-card-cloudy` | 14 | cloudy | Two big gray clouds that hide a small yellow sun. |
| `l2-w14-card-windy` | 14 | windy | A small tree that bends in the wind, with leaves that fly in the air. |
| `l2-w14-card-rainy` | 14 | rainy | A gray cloud with blue raindrops that fall onto a small patch of green grass. |
| `l2-w14-card-hot` | 14 | hot | A bright red sun with short wavy heat lines over dry yellow grass. |
| `l2-w14-card-cold` | 14 | cold | A blue wool hat and a blue scarf on a small white chair. |
| `l2-w15-card-garden` | 15 | garden | A small garden with green grass, red and yellow flowers, and a little tree. |
| `l2-w15-card-helicopter` | 15 | helicopter | A small orange helicopter with a round window and long blades on top. |

## 6. Row count and cost estimate

- Rows: 229 (193 book rows and 36 card rows). Each row has a color file and a line-art file, so the delivery has 458 files.
- Unit 1 rate: weeks 2 to 7 took 162 rows for 12.93 USD with the cover (series plan, row 3), so about 0.080 USD a row.
- Estimate for unit 2: 229 × 0.080 = about 18.28 USD (193 book rows about 15.40 USD, 36 card rows about 2.87 USD). This is more than the 13 to 17 USD of D10, because D10 did not count the 36 card rows. Retries can add to the estimate.

## 7. Delivery rule

- Forge puts each batch in one folder with a `manifest.json`: for each file, the file name, the picture-list id, the SHA-256, and the pixel size.
- Workbooks checks each folder with `PICTURE_CHECK_U2` (plan, Task 2.7): book rows and card rows, size, aspect, color mode, alpha, and file names. A row that fails goes back to Forge with its id.
- Daniel looks at the pictures (Task 2.8, by 2026-11-23).
- Workbooks copies the passed files into `content/storytime/l2/print/pictures/` in Phase 4 (the move task), not before.

## 8. All row ids

The 229 ids of `pictures-u2.json`, in list order.

Week 9 (34):

- `l2-w09-story-page-i-like-rice-yum`
- `l2-w09-story-page-i-like-eggs-yum`
- `l2-w09-story-page-i-like-milk-yum`
- `l2-w09-story-page-i-like-bananas-yum`
- `l2-w09-story-page-i-like-bread-yum`
- `l2-w09-story-page-i-like-juice-yum`
- `l2-w09-story-page-i-like-cake-yum`
- `l2-w09-story-page-pip-likes-cake-yum`
- `l2-w09-cover-yum`
- `l2-w09-story-page-dad-has-a-mop`
- `l2-w09-story-page-dad-can-mop-the-mat`
- `l2-w09-story-page-dad-sat-on-the-mat`
- `l2-w09-story-page-dad-cannot-see-the-mop`
- `l2-w09-story-page-dad-is-sad`
- `l2-w09-story-page-tom-can-see-the-mop`
- `l2-w09-story-page-pip-has-the-mop`
- `l2-w09-story-page-pip-can-mop`
- `l2-w09-cover-dad-and-the-mop`
- `l2-w09-check-row-dog`
- `l2-w09-check-row-sun`
- `l2-w09-check-row-cat`
- `l2-w09-check-row-fish`
- `l2-w09-check-row-duck`
- `l2-w09-check-row-bus`
- `l2-w09-check-row-pen`
- `l2-w09-check-row-cup`
- `l2-w09-check-row-doll`
- `l2-w09-d4-prompt-cake`
- `l2-w09-card-nod`
- `l2-w09-card-dinosaur`
- `l2-w09-card-rice`
- `l2-w09-card-banana`
- `l2-w09-card-bread`
- `l2-w09-card-juice`

Week 10 (34):

- `l2-w10-story-page-put-on-your-dress`
- `l2-w10-story-page-put-on-your-skirt`
- `l2-w10-story-page-put-on-your-t-shirt`
- `l2-w10-story-page-put-on-your-trousers`
- `l2-w10-story-page-put-on-your-socks`
- `l2-w10-story-page-put-on-your-shoes`
- `l2-w10-story-page-put-on-your-jacket`
- `l2-w10-story-page-put-on-your-hat-pip`
- `l2-w10-cover-dress-up`
- `l2-w10-story-page-dad-has-a-pan`
- `l2-w10-story-page-a-tan-man`
- `l2-w10-story-page-run-man-run`
- `l2-w10-story-page-tom-and-dad-run`
- `l2-w10-story-page-they-were-sad`
- `l2-w10-story-page-a-man-on-a-mat`
- `l2-w10-story-page-tom-and-dad-sat`
- `l2-w10-story-page-the-man-sat-too`
- `l2-w10-cover-the-tan-man`
- `l2-w10-check-row-fan`
- `l2-w10-check-row-dog`
- `l2-w10-check-row-bed`
- `l2-w10-check-row-cup`
- `l2-w10-check-row-van`
- `l2-w10-check-row-sun`
- `l2-w10-check-row-sock`
- `l2-w10-check-row-dad`
- `l2-w10-check-row-ten`
- `l2-w10-card-pad`
- `l2-w10-card-skirt`
- `l2-w10-card-t-shirt`
- `l2-w10-card-trousers`
- `l2-w10-card-socks`
- `l2-w10-card-shoes`
- `l2-w10-card-jacket`

Week 11 (31):

- `l2-w11-story-page-where-is-sam-under-the-table`
- `l2-w11-story-page-where-is-may-in-the-box`
- `l2-w11-story-page-where-is-ben-under-the-bed`
- `l2-w11-story-page-where-is-mia-in-the-bed`
- `l2-w11-story-page-where-is-pat-on-the-sofa`
- `l2-w11-story-page-where-is-lily-on-the-chair`
- `l2-w11-story-page-where-is-pip`
- `l2-w11-story-page-here`
- `l2-w11-cover-where-is-pip`
- `l2-w11-story-page-tom-set-up-a-den`
- `l2-w11-story-page-ten-men-in-the-den`
- `l2-w11-story-page-see-me-mom`
- `l2-w11-story-page-mom-is-in-too`
- `l2-w11-story-page-dad-is-in-too`
- `l2-w11-story-page-pip-sat-on-top`
- `l2-w11-story-page-pip-get-off`
- `l2-w11-story-page-the-den-is-on-dad`
- `l2-w11-cover-the-den`
- `l2-w11-check-row-egg`
- `l2-w11-check-row-sun`
- `l2-w11-check-row-cat`
- `l2-w11-check-row-dog`
- `l2-w11-check-row-elephant`
- `l2-w11-check-row-fish`
- `l2-w11-check-row-cat-b`
- `l2-w11-check-row-dog-b`
- `l2-w11-check-row-ten`
- `l2-w11-card-elbow`
- `l2-w11-card-envelope`
- `l2-w11-card-door`
- `l2-w11-card-window`

Week 12 (33):

- `l2-w12-story-page-open-your-book-sam`
- `l2-w12-story-page-open-your-book-may`
- `l2-w12-story-page-open-your-book-ben`
- `l2-w12-story-page-open-your-book-mia`
- `l2-w12-story-page-open-your-book-pat`
- `l2-w12-story-page-open-your-book-lily`
- `l2-w12-story-page-open-your-book-nan`
- `l2-w12-story-page-open-your-book-pip`
- `l2-w12-cover-open-your-book`
- `l2-w12-story-page-dad-has-a-hat`
- `l2-w12-story-page-dad-is-hot`
- `l2-w12-story-page-it-is-on-the-mat`
- `l2-w12-story-page-a-hen-can-hop`
- `l2-w12-story-page-hop-hop-hop`
- `l2-w12-story-page-the-hen-sat-in-it`
- `l2-w12-story-page-dad-said-get-off`
- `l2-w12-story-page-that-hen-has-the-hat`
- `l2-w12-cover-the-hen-and-the-hat`
- `l2-w12-check-row-hat`
- `l2-w12-check-row-sun`
- `l2-w12-check-row-cat`
- `l2-w12-check-row-dog`
- `l2-w12-check-row-horse`
- `l2-w12-check-row-fish`
- `l2-w12-check-row-pen`
- `l2-w12-check-row-cup`
- `l2-w12-check-row-house`
- `l2-w12-d4-prompt-book`
- `l2-w12-card-hop`
- `l2-w12-card-hippo`
- `l2-w12-card-crayon`
- `l2-w12-card-eraser`
- `l2-w12-card-ruler`

Week 13 (34):

- `l2-w13-story-page-i-can-run`
- `l2-w13-story-page-i-can-jump`
- `l2-w13-story-page-i-can-kick`
- `l2-w13-story-page-i-can-throw`
- `l2-w13-story-page-i-can-catch`
- `l2-w13-story-page-i-can-clap`
- `l2-w13-story-page-i-can-hop`
- `l2-w13-story-page-pip-can-catch`
- `l2-w13-cover-look-at-me`
- `l2-w13-story-page-tom-has-a-pot`
- `l2-w13-story-page-a-pot-for-pip`
- `l2-w13-story-page-hop-on-top-pip`
- `l2-w13-story-page-he-is-on-top`
- `l2-w13-story-page-i-like-it`
- `l2-w13-story-page-mom-is-on-a-mat`
- `l2-w13-story-page-do-not-hop-on-mom`
- `l2-w13-story-page-pip-is-on-mom`
- `l2-w13-cover-hop-on-top`
- `l2-w13-check-row-pot`
- `l2-w13-check-row-sun`
- `l2-w13-check-row-bed`
- `l2-w13-check-row-cup`
- `l2-w13-check-row-dot`
- `l2-w13-check-row-fish`
- `l2-w13-check-row-hat`
- `l2-w13-check-row-pen`
- `l2-w13-check-row-mop`
- `l2-w13-d4-prompt-jump`
- `l2-w13-card-run`
- `l2-w13-card-walk`
- `l2-w13-card-clap`
- `l2-w13-card-kick`
- `l2-w13-card-throw`
- `l2-w13-card-catch`

Week 14 (33):

- `l2-w14-story-page-it-is-sunny`
- `l2-w14-story-page-it-is-cloudy`
- `l2-w14-story-page-it-is-windy`
- `l2-w14-story-page-it-is-rainy`
- `l2-w14-story-page-it-is-hot`
- `l2-w14-story-page-it-is-cold`
- `l2-w14-story-page-it-is-very-cold`
- `l2-w14-story-page-pip-is-cold-too`
- `l2-w14-cover-hot-and-cold`
- `l2-w14-story-page-dad-is-hot`
- `l2-w14-story-page-mom-has-a-fan`
- `l2-w14-story-page-on-goes-the-fan`
- `l2-w14-story-page-dad-is-not-hot`
- `l2-w14-story-page-pip-is-hot`
- `l2-w14-story-page-pip-sat-on-the-mat`
- `l2-w14-story-page-dad-is-hot-b`
- `l2-w14-story-page-a-fan-for-you-pip`
- `l2-w14-cover-on-goes-the-fan`
- `l2-w14-check-row-fish`
- `l2-w14-check-row-sun`
- `l2-w14-check-row-cat`
- `l2-w14-check-row-dog`
- `l2-w14-check-row-foot`
- `l2-w14-check-row-bed`
- `l2-w14-check-row-pen`
- `l2-w14-check-row-cup`
- `l2-w14-check-row-fan`
- `l2-w14-card-sunny`
- `l2-w14-card-cloudy`
- `l2-w14-card-windy`
- `l2-w14-card-rainy`
- `l2-w14-card-hot`
- `l2-w14-card-cold`

Week 15 (29):

- `l2-w15-story-page-look-a-bus`
- `l2-w15-story-page-look-a-car`
- `l2-w15-story-page-look-a-bike`
- `l2-w15-story-page-look-a-truck`
- `l2-w15-story-page-look-a-train`
- `l2-w15-story-page-look-a-boat`
- `l2-w15-story-page-look-a-plane`
- `l2-w15-story-page-look-pip-on-a-bike`
- `l2-w15-cover-look-a-bus`
- `l2-w15-story-page-pip-has-a-tag`
- `l2-w15-story-page-pip-has-no-tag`
- `l2-w15-story-page-is-it-on-the-mat`
- `l2-w15-story-page-no-it-is-not`
- `l2-w15-story-page-is-it-in-the-pot`
- `l2-w15-story-page-no-it-is-not-b`
- `l2-w15-story-page-it-is-on-a-peg`
- `l2-w15-story-page-pip-got-his-tag`
- `l2-w15-cover-the-tag`
- `l2-w15-check-row-goat`
- `l2-w15-check-row-sun`
- `l2-w15-check-row-cat`
- `l2-w15-check-row-bed`
- `l2-w15-check-row-girl`
- `l2-w15-check-row-fish`
- `l2-w15-check-row-sun-b`
- `l2-w15-check-row-pen`
- `l2-w15-check-row-dog`
- `l2-w15-card-garden`
- `l2-w15-card-helicopter`

Week 16 (1):

- `l2-w16-check-row-guitar`
