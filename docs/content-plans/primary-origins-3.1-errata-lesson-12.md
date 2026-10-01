# Primary Advantage Origins 3.1 — Replacement Lesson 12 (Errata Insert)

Version 1.2 | Date 2026-10-01 | Status: Text approved by Daniel 2026-10-01 | Owner: Daniel Bo | Internal

Companion files: [`primary-origins-3.2-plan.md`](primary-origins-3.2-plan.md), [`primary-origins-series-bible.md`](primary-origins-series-bible.md).

## 1. The defect and the decision

Origins 3.1 lessons 9 and 12 print the same article, "My Happy Holiday" (article ID `cmgqwsfcs02bqt79bkaa1pjaw`). Only the sentence-order items differ. The book has 13 unique texts. Tutor Advantage stores one row per article per book, so its Origins 3.1 book most likely holds 13 articles while its record says 14.

Decision (Daniel, 2026-09-30): 500 copies are in stock. Print an insert that replaces lesson 12. The new lesson is written graph-first, gets a new article ID, and goes in the October print order with Origins 3.2 and Quest 4.

## 2. The new lesson

| Item | Value |
|---|---|
| Working title | **Hello! I Am Tom** |
| Text type | Functional: a self-introduction and family introduction, with questions and answers. The book has no functional text today. |
| Why this text | It closes the introduction gap (the band's L19.1 and L20.1 are not covered) and it prints the series canon inside Origins 3.1: Pip is the brown puppy of Tom and Lily's family. Origins 3.2 lesson 1 ("Hello! I Am May") then gives the second exposure. |
| Place in the book | Between lesson 11 ("Pip and the Fair Game") and lesson 13 ("Leo's Silly Clothes Fun"). Tom and Pip already appear in lessons 9 and 10. |
| Level | Primary level 3: `cefr_level = 'A0+'`, `ra_level = 3`. |
| Target objectives (GSE, internal) | L19.1 understand people who introduce themselves; L20.1 understand questions about name and age; R17.1 sentences introducing someone, now with age; R10.2 question marks; L21.1 family words; R12.1 and R13.2 number words (seven, nine, ten, one). |
| Glossed words (12) | name, old, nine, ten, brother, sister, live, house, mother, father, favorite, football. All are Starters words; 7 are new to the A0 books. |
| Profile | Same as Origins 3.1, one step up: 150–190 words in 3 paragraphs; mean sentence length 4.5–5.2 words; 3 or more question marks. |

Continuity note: Origins 3.1 lesson 5 calls Pip Mia's new pet. This lesson follows lessons 9 and 10, where Pip is Tom's puppy. The series bible makes Mia Pip's friend and Lily's best friend. Lesson 5 stays as printed.

## 3. Draft article (v0, for Daniel's edit)

Checked on 2026-09-30 against the Cambridge Starters graph: 167 words, 33 sentences, mean 5.1 words, longest 9 words, 4 question marks. Every word is on the Starters list except "puppy" (a Movers word already taught in every A0 book) and "next" (part of the Starters phrase "next to").

Edit the text in [`origins-3.2-drafts/e12-hello-i-am-tom.md`](origins-3.2-drafts/e12-hello-i-am-tom.md), not here. The text check passes the v0 text on all 16 checks (profile `origins-3.1-insert`). Run it again after the edit (see the drafts README).

> Hello! What is your name? My name is Tom. How old are you? I am nine. I live in a house with my family. Our house is next to the park. I can see the park from my bedroom. It has a small garden too. Who lives in my house? Come and see!
>
> This is my mom. She is my mother. This is my dad. He is my father. This is my sister, Lily. She is seven. She likes books and drawing. I am her big brother. Lily and I go to school. I like football. It is my favorite game. Dad and I play football in the park.
>
> And this is Pip. Pip is our puppy. He is small and brown. He is one year old. His favorite toy is a red ball. Pip sleeps in the living room. Grandma and Grandpa live in a big house. They have ten fish! Is your family big or small? I love my family, and my family loves Pip.

## 4. Questions and activities (draft)

- **Multiple choice**
  1. How old is Tom? (a) seven (b) **nine** (c) ten (d) one
  2. Who is Lily? (a) Tom's mother (b) Tom's friend (c) **Tom's sister** (d) Tom's grandma
  3. What is Tom's favorite game? (a) **football** (b) books (c) drawing (d) a red ball
  4. Where is Tom's house? (a) at school (b) **next to the park** (c) in the garden (d) next to Grandma's house
- **Short answer:** How old are you?
- **Sentence starters:** My name is ___. / I am ___ years old. / I live ___.
- **Sentence order:** "My name is Tom." / "Pip is our puppy."
- **Sentence completion:** This is my ___. / My favorite game is ___. / I live in ___.
- **Writing prompt:** Write about your family. (Frames: This is my ___. He is ___. She likes ___.)
- **Vocabulary match and fill:** the 12 glossed words with short English and Thai definitions.

## 5. The printed insert

| Item | Rule |
|---|---|
| Content | The full lesson 12 in the Origins 3.1 template: all 13 steps, same layout, same fonts. |
| Page count and page numbers | Same as the printed lesson 12, so the book's page numbers stay true. Check the page range in the Origins 3.1 print PDF. |
| Trim and paper | Same as the book. |
| Header strip on the first page | "Origins 3.1 — Lesson 12 (replacement)". English and Thai. |
| Teacher note (inside front of insert) | "Use this lesson for Lesson 12. The Lesson 12 pages in the book are a printing error." English and Thai; Claude writes the Thai, Daniel checks it. |
| QR codes | The stable book-and-lesson URL (decision D1 = B, 2026-10-01). Option A only if the route is not live by 2026-11-10. |
| Quantity | 500 plus spares for copies already in classrooms. Daniel to confirm the count at Boonyathat and with tutors. |

## 6. Digital and Tutor changes

1. Create the article in the Primary database at level 3 with the injector (3.2 plan §8). The injector records the new ID in the lesson package.
2. Update `primary/origins-3.1-a0/12-*_workbook.json` to the new lesson. Keep the old file in git history; do not keep two lesson-12 files in the folder.
3. Tutor Advantage: replace the lesson-12 article in the Origins 3.1 book with the new ID, in position 12, so the book has 14 distinct articles. See the Tutor Advantage spec, tasks T2–T4. Tutor's importer matches lessons by title today, so the new title must be unique in the Primary database.
4. Re-label the 13 other Origins 3.1 articles from level 2 to level 3 in the Primary database (metadata only).

## 7. Calendar

| Date | Step |
|---|---|
| Oct 1 | Text approved as is by Daniel — **done** |
| Oct 2–4 | Pilot of the new path: lesson package (question bank, print set, activities, Thai), character sheets, 3 images, audio; Daniel checks on the review page |
| Oct 4–5 | Injected into the live Primary database; ID recorded; lesson JSON built from the package |
| Oct 7 | Insert rendered; page count checked against the printed lesson 12 |
| Oct 15–17 | Proof with Origins 3.2 and Quest 4 |
| Oct 22–24 | To the printer |

The insert is the smallest item in the print order. Finishing it first tests the whole article-to-print path (§8 of the 3.2 plan) before the 28 new lessons use it.

## Revision history

- 1.2 — 2026-10-01 — Text approved as is. E12 is the pilot for the new production path (3.2 plan v1.2 §8). QR decision B. Thai written by Claude and checked by Daniel.
- 1.1 — 2026-09-30 — The v0 text is now a draft file for the text check; it passes all checks.
- 1.0 — 2026-09-30 — First draft with v0 article text, questions, and insert rules.
