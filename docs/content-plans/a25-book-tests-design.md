# Primary Advantage Book Tests and Level Tests — Design

Version 0.3 | Date 2026-10-27 | Status: draft for the PM | Due 2026-10-31 | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

This document designs the assessment for the Primary Advantage programme. It designs two tests for each printed book and it designs the listening form for the three level tests. It does not write any test item.

Every choice that the brief left open is marked **Default:**. The PM relays this document to Daniel. Daniel replaces any default with a decision.

**Sources read for this document:**

| Source | What it gives |
|---|---|
| `../advantage-pr/08-strategy/product-strategy-2026-2027.md` §3.1 | The book catalogue, 16 books in the active programme, 14 lessons per book |
| `../advantage-pr/AGENTS.md` | The rule that external copy names CEFR only |
| `content/primary/<book>/l*.json` | The lesson packages, 12 glossed words, 10 MCQ, 5 SAQ, 5 LAQ, print set, activities |
| `dashboard/lib/lesson-package/schema.ts` | The lesson package contract |
| `content/primary/origins-2/assessments/semester-1/` | Last semester's test, teacher script, answer key, audio kit, build script |
| `content/primary/_step-directions/` | 13 approved step directions and 5 approved Tutor directions, their manifests |
| `../mastery-advantage/english/cefr-vocabulary/data/cambridge-vocabulary-inventory.json` | Starters 495 words, Movers 399 words, Flyers 513 words |
| <https://www.cambridgeenglish.org/exams-and-tests/starters/test-format> | The Cambridge listening part types used as an internal reference |
| <https://www.cambridgeenglish.org/exams-and-tests/movers/test-format> | The Cambridge listening part types used as an internal reference |
| <https://www.cambridgeenglish.org/exams-and-tests/flyers/test-format> | The Cambridge listening part types used as an internal reference |

---

## 1. Summary

The catalogue holds 16 books in the active programme. The books cover levels 1 to 9. Each book holds 14 workbook lessons.

| Band | Levels | Books | Book folders | Workbook lessons |
|---|---|---|---|---|
| Pre-A1 (A0) | 1–3 | Origins 1, Origins 2, Origins 3.1, Origins 3.2 | `origins-1`, `origins-2`, `origins-3.1`, `origins-3.2` | 56 |
| A1 | 4–6 | Quest 4, Quest 5, Quest 6.1, Quest 6.2 | `quest-4`, `quest-5`, `quest-6.1`, `quest-6.2` | 56 |
| A2 | 7–9 | Adventure 7.1, 7.2, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3 | `adventure-7.1` … `adventure-9.3` | 112 |
| **Total** | **1–9** | **16 books** | **16 folders** | **224** |

Each of the 16 folders holds 14 lesson package files. The `bank-1` to `bank-9` folders hold online-only articles. They carry no print set, so they carry no book test.

The design makes 35 tests.

| Test kind | Count | When |
|---|---|---|
| Book test, first | 16 | After lesson 7 of the book |
| Book test, second | 16 | After lesson 14 of the book |
| Level test | 3 | Pre-A1, A1, A2 |
| **Total** | **35** | |

Each test draws its content from the lesson packages of the book. A first book test covers lessons 1 to 7. A second book test covers lessons 8 to 14. A level test covers every lesson of the band.

**Default:** a book test is a classroom progress test. The teacher holds the paper, the script, the answer key and the audio. The teacher marks the paper. A level test is a secure test. Its items live in a private place and never enter this repository.

**Default:** this repository keeps the form document and the build tools. The last semester's test moves to the private place when the private place exists. Until then the last semester's test stays at `content/primary/origins-2/assessments/semester-1/`, and Daniel decides.

---

## 2. The test form by band

### 2.1 The shape that all bands share

Every test has the parts A to F. Each part mirrors a printed workbook step. The rule of last semester's plan holds: a part mirrors a step that students have already practised.

| Part | Mirrors | Content | Scored |
|---|---|---|---|
| A | Step 2, Key Vocabulary | Words I Know | Yes |
| B | Step 3, Read the Article | Listening | Yes |
| C | Steps 5 and 7, Deep Reading Notes and Comprehension Check | Reading | Yes |
| D | Steps 9 and 10, Vocabulary Practice and Sentence Practice | Vocabulary and Sentences | Yes |
| E | Step 11, Guided Writing | Writing | Yes |
| F | Step 13, Lesson Reflection | Reflection | No |

The plan omits Step 1, Step 4, Step 6 and Step 12. Those steps are learning actions. They do not show a result.

Two marks rules apply to every band.

1. A tick item in Part A gives one point. A wrong tick gives no point. A tick on a word that the student knows gives no penalty.
2. Part E uses a rubric. The rubric is in the answer key.

**Default:** the teacher reports the score as a band, not as a percentage. The last semester's plan set the same rule for the running record: one small sample does not make a grade.

### 2.2 Band Pre-A1 (A0)

Four books. Eight book tests. The first test follows lessons 1 to 7. The second test follows lessons 8 to 14.

**Test after lesson 7 — 45 minutes, 60 points**

| Part | Item type | Items | Marks | Minutes |
|---|---|---|---|---|
| A1 | Tick each word you know | 6 words | 6 | 3 |
| A2 | Write the Thai meaning | 4 words | 4 | 2 |
| B1 | Listening passage, multiple choice, 3 options | 4 | 8 | 6 |
| B2 | Listening picture, circle the correct object | 3 | 6 | 4 |
| C1 | Reading text, multiple choice, 4 options | 4 | 8 | 6 |
| C2 | Reading text, one short answer | 1 | 4 | 4 |
| D1 | Match the word to the meaning, write the letter | 4 | 4 | 2 |
| D2 | Fill the gap with a word from the word bank | 4 | 4 | 3 |
| D3 | Put the words in order | 1 | 2 | 2 |
| D4 | Finish the sentence | 2 | 4 | 3 |
| E1 | Guided writing, choose the word and write the sentence | 1 | 5 | 4 |
| E2 | Free writing, two sentences | 1 | 5 | 4 |
| F | Reflection, circle one face | 3 | 0 | 2 |
| | **Total** | | **60** | **45** |

**Test after lesson 14 — 60 minutes, 100 points**

| Part | Item type | Items | Marks | Minutes |
|---|---|---|---|---|
| A1 | Tick each word you know | 10 words | 10 | 3 |
| A2 | Write the Thai meaning | 5 words | 5 | 3 |
| B1 | Listening passage, multiple choice, 3 options | 5 | 10 | 6 |
| B2 | Listening picture, circle the correct object | 4 | 8 | 5 |
| C1 | Reading text, multiple choice, 4 options | 6 | 12 | 8 |
| C2 | Reading text, short answer | 2 | 8 | 8 |
| D1 | Match the word to the meaning, write the letter | 8 | 8 | 3 |
| D2 | Fill the gap with a word from the word bank | 4 | 4 | 3 |
| D3 | Put the words in order | 3 | 9 | 3 |
| D4 | Finish the sentence | 3 | 6 | 3 |
| E1 | Guided writing, choose the word and write the sentence | 2 | 10 | 6 |
| E2 | Free writing, two sentences | 1 | 10 | 6 |
| F | Reflection, circle one face | 3 | 0 | 3 |
| | **Total** | | **100** | **60** |

The 100 point test follows last semester's test for lessons 1 to 8. It uses the same parts and a similar point weight. Last semester's Part A gave 12 points for 12 ticks and 6 Thai meanings. This design splits Part A into A1 and A2. The split keeps the marks legible.

### 2.3 Band A1

Four books. Eight book tests.

**Test after lesson 7 — 45 minutes, 80 points**

| Part | Item type | Items | Marks | Minutes |
|---|---|---|---|---|
| A1 | Tick each word you know | 8 words | 8 | 3 |
| A2 | Write the Thai meaning | 4 words | 4 | 2 |
| B1 | Listening passage, multiple choice, 4 options | 4 | 8 | 6 |
| B2 | Listening picture, circle the correct object | 3 | 6 | 3 |
| B3 | Listening gap, write one word or one number | 3 | 6 | 3 |
| C1 | Reading text, multiple choice, 4 options | 4 | 8 | 5 |
| C2 | Reading text, short answer | 2 | 8 | 5 |
| D1 | Match the word to the meaning, write the letter | 6 | 6 | 2 |
| D2 | Fill the gap with a word from the word bank | 4 | 4 | 2 |
| D3 | Put the words in order | 2 | 6 | 3 |
| D4 | Finish the sentence | 2 | 4 | 3 |
| E1 | Guided writing, choose the word and write the sentence | 1 | 6 | 3 |
| E2 | Free writing, three sentences | 1 | 6 | 3 |
| F | Reflection, circle one face | 3 | 0 | 2 |
| | **Total** | | **80** | **45** |

**Test after lesson 14 — 60 minutes, 120 points**

| Part | Item type | Items | Marks | Minutes |
|---|---|---|---|---|
| A1 | Tick each word you know | 12 words | 12 | 3 |
| A2 | Write the Thai meaning | 6 words | 6 | 2 |
| B1 | Listening passage, multiple choice, 4 options | 6 | 12 | 7 |
| B2 | Listening picture, circle the correct object | 4 | 8 | 4 |
| B3 | Listening gap, write one word or one number | 5 | 10 | 3 |
| C1 | Reading text, multiple choice, 4 options | 6 | 12 | 8 |
| C2 | Reading text, short answer | 3 | 12 | 6 |
| D1 | Match the word to the meaning, write the letter | 8 | 8 | 3 |
| D2 | Fill the gap with a word from the word bank | 6 | 6 | 3 |
| D3 | Put the words in order | 3 | 9 | 3 |
| D4 | Finish the sentence | 3 | 9 | 3 |
| E1 | Guided writing, choose the word and write the sentence | 2 | 10 | 6 |
| E2 | Free writing, three sentences | 1 | 6 | 6 |
| F | Reflection, circle one face | 3 | 0 | 3 |
| | **Total** | | **120** | **60** |

### 2.4 Band A2

Eight books. Sixteen book tests.

**Test after lesson 7 — 50 minutes, 110 points**

| Part | Item type | Items | Marks | Minutes |
|---|---|---|---|---|
| A1 | Tick each word you know | 8 words | 8 | 3 |
| A2 | Write the Thai meaning | 4 words | 4 | 2 |
| A3 | Match the word to the definition | 4 | 4 | 2 |
| B1 | Listening passage, multiple choice, 4 options | 5 | 10 | 6 |
| B2 | Listening picture, circle the correct object | 3 | 6 | 3 |
| B3 | Listening gap, write one word or one number | 4 | 8 | 3 |
| C1 | Reading text, multiple choice, 4 options | 6 | 12 | 5 |
| C2 | Reading text, short answer | 2 | 12 | 5 |
| D1 | Match the word to the meaning, write the letter | 8 | 8 | 3 |
| D2 | Fill the gap with a word from the word bank | 4 | 4 | 2 |
| D3 | Put the words in order | 2 | 8 | 3 |
| D4 | Finish the sentence | 2 | 8 | 3 |
| E1 | Guided writing, choose the word and write the sentence | 1 | 8 | 4 |
| E2 | Free writing, five sentences | 1 | 10 | 4 |
| F | Reflection, circle one face | 3 | 0 | 2 |
| | **Total** | | **110** | **50** |

**Test after lesson 14 — 60 minutes, 150 points**

| Part | Item type | Items | Marks | Minutes |
|---|---|---|---|---|
| A1 | Tick each word you know | 12 words | 12 | 3 |
| A2 | Write the Thai meaning | 6 words | 6 | 2 |
| A3 | Match the word to the definition | 6 | 6 | 2 |
| B1 | Listening passage, multiple choice, 4 options | 6 | 12 | 6 |
| B2 | Listening picture, circle the correct object | 5 | 10 | 4 |
| B3 | Listening gap, write one word or one number | 4 | 12 | 3 |
| C1 | Reading text, multiple choice, 4 options | 6 | 12 | 6 |
| C2 | Reading text, short answer | 2 | 12 | 6 |
| C3 | Reading text, choose the best title | 1 | 8 | 2 |
| D1 | Match the word to the meaning, write the letter | 10 | 10 | 3 |
| D2 | Fill the gap with a word from the word bank | 6 | 6 | 3 |
| D3 | Put the words in order | 2 | 8 | 3 |
| D4 | Finish the sentence | 3 | 12 | 3 |
| E1 | Guided writing, choose the word and write the sentence | 2 | 12 | 6 |
| E2 | Free writing, six sentences | 1 | 12 | 5 |
| F | Reflection, circle one face | 3 | 0 | 3 |
| | **Total** | | **150** | **60** |

### 2.5 The listening part of a book test

Part B is the listening part. It has three blocks at band A1 and A2. It has two blocks at band Pre-A1.

| Block | Pre-A1 | A1 | A2 | What the student does |
|---|---|---|---|---|
| B1 | 4 then 5 MCQ | 4 then 6 MCQ | 5 then 6 MCQ | Listens to a passage, then circles one option |
| B2 | 3 then 4 picture | 3 then 4 picture | 3 then 5 picture | Listens to a short talk, then circles the correct object in one picture |
| B3 | — | 3 then 5 gap | 4 then 4 gap | Listens to a short talk, then writes one word or one number |

The first count belongs to the test after lesson 7. The second count belongs to the test after lesson 14.

A gap item at bands A1 and A2 accepts a wrong spelling in a name. The Cambridge handbook states: "In Part 2 of the Listening paper some misspellings are allowed." This design follows that rule at bands A1 and A2.

---

## 3. The listening part in detail

### 3.1 The rules of a listening script

1. The listening text is new. It never appears in a lesson.
2. The listening text uses only words and sentence patterns from the lessons that the test covers.
3. The listening text differs from the reading text. A student must listen, not recall.
4. The listening passage plays twice. The judge sentences and the picture items play once.
5. The papers stay closed during the passage. The teacher opens the papers after the second reading.
6. Each sentence is short. It uses one clause.
7. The script states the number of each item in English and in Thai.
8. The teacher reads the passage at a slow, clear pace. The teacher pauses 2 seconds after each sentence.
9. The gap between the two readings is 5 seconds.
10. The teacher reads each picture item once, with a 5 second pause after it.

These rules follow `semester-test-plan.md` §5 and `semester-test-teacher-script.md`.

### 3.2 The voices and the audio form

| Use | Voice | Speed | Source |
|---|---|---|---|
| Test items and passages | `English_captivating_female1` | 0.9 | `content/primary/_step-directions/manifest.json` |
| Bilingual directions | `English_captivating_female1` then `Thai_male_1_sample8` | 0.9 then 1.0 | Same file |
| Thai direction | `Thai_male_1_sample8` | 1.0 | Same file |

**Default:** every item clip uses `English_captivating_female1` at speed 0.9. Last semester's test used `English_Graceful_Lady` at speed 0.85 to 0.9. The step directions already carry Daniel's approval for `English_captivating_female1`. One voice keeps the whole programme consistent.

**Default:** the reading passage uses speed 0.85. A slow passage gives the young learner time to hear each word. Last semester's build script already used 0.85 for the passage.

The bilingual direction file keeps the form that Daniel approved on 2026-10-27. His words were: "A. Yes. B. One button. English first. Thai second. C. Yes". The form is one joined file. The file plays English first. It plays 1.2 seconds of silence. It plays Thai second.

### 3.3 The speech recognizer check

The English clip passes the recognizer check before the file joins. The Thai clip does not pass a recognizer check. The Thai check is Daniel's ear only. This rule comes from the step directions build.

| Check | Limit | Source |
|---|---|---|
| The clip is not silent | True | `manifest-tutor.json` `checks.not_silent` |
| The peak level | At most -1.5 dBFS for a joined file | `manifest.json` `build.part_level` |
| The loudness | -18 LUFS for each part | Same |
| The inner silence | At most 1.2 s | `manifest-tutor.json` `checks.max_inner_silence_s` |
| The shift rate | At most 0.35 s per character | Same |
| The English word error rate | At most 0.10 | Same |
| The Thai recognizer | For information only | Same |

The step directions reached a word error rate of 0.0 for twelve of the thirteen clips and 0.048 for the remaining clip. The Thai recognizer read the step number and a few more digits. That result is expected, because the Thai voice reads a Thai script.

### 3.4 The Thai direction template

One template serves every test. Daniel approves the template once.

| Part | English | Thai |
|---|---|---|
| Opening | "Today we have a test. This test has parts A, B, C, D, E and F. The parts are like our workbook. Write your name and class on the paper." | "วันนี้เรามีการสอบ ข้อสอบมีส่วน A ถึง F รูปแบบเหมือนสมุดงานที่เราเรียนมา เขียนชื่อและห้องเรียนลงในกระดาษคำตอบ" |
| Part B close | "Part B is a listening test. Close your paper now. Put your pencil down. Eyes on me." | "ส่วนที่ B เป็นการฟัง ปิดเล่มคำตอบ วางดินสอ และมองที่หน้าจอ ฟังครูเล่าเรื่องให้จบสองรอบก่อน ห้ามเปิดดูข้อสอบ" |
| Part B open | "Now open your paper. Do questions one to [n]. Circle the correct answer." | "เปิดกระดาษคำตอบ ทำข้อหนึ่งถึง [n] วงคำตอบที่ถูกต้อง" |
| Part C | "Part C. Read the story quietly. Read it two times. Then answer questions [n] to [m]. Circle the answer. Then write [k] sentences." | "ส่วนที่ C อ่านเรื่องเงียบ ๆ สองรอบ แล้วตอบข้อ [n] ถึง [m] วงคำตอบที่ถูกต้อง จากนั้นเขียน [k] ประโยค" |
| Part D | "Part D. D one: match the word and the meaning, write the letter. D two: fill the blanks with words from the word bank. D three: put the words in order. D four: finish the sentence." | "ส่วนที่ D มี 4 ตอนย่อย D1 จับคู่คำกับความหมาย เขียนตัวอักษร D2 เติมคำจากกล่องคำ D3 เรียงคำเป็นประโยค D4 เติมประโยคให้สมบูรณ์" |
| Part E | "Part E. [first task]. Then write [k] sentences about [topic]. Capital letter. Full stop." | "ส่วนที่ E [งานแรก] จากนั้นเขียน [k] ประโยคเกี่ยวกับ [หัวข้อ] ใช้ตัวใหญ่ต้นประโยคและจุดท้ายประโยค" |
| Part F | "Last part. No points. Circle one face for each line. This part is for you, not for me." | "ส่วนสุดท้าย ไม่มีคะแนน วงหน้าสำหรับแต่ละบรรทัด ส่วนนี้เพื่อเธอเอง" |

The template keeps the wording of last semester's build script. The words `[n]`, `[m]` and `[k]` take the numbers of the test. A band A2 test adds one line for Part C because that test has a title item.

**Default:** the teacher reads the English line, then the Thai line. The teacher does not play the direction file when the teacher stands in front of the class. The file exists for a tutor who teaches without a live teacher.

### 3.5 The rule for the Thai word meanings

The PM decided this on 2026-10-27 at 22:41 ICT. His words were: "the Thai word meanings in the tests come only from the glossary Thai of the lesson packages. One condition: use only glossary Thai that Daniel already checked, that is, the Thai in the printed and ordered books. For a book that is not made yet, its test Thai comes from its glossary, and Daniel checks that Thai one time, with the book."

The rule has four parts.

| Part | Rule |
|---|---|
| The source | Every Thai word meaning in a test comes from the glossary Thai of the lesson packages. A test writes no new Thai. |
| The condition | The glossary Thai must be Thai that Daniel already checked. That is the Thai of the printed and ordered books. |
| The books that are not made yet | The test Thai comes from the glossary of the book. Daniel checks that Thai one time, with the book. |
| The other Thai | Every other Thai in a test comes from the direction templates of section 3.4. Daniel approves those one time. |

The printed and ordered books are these four.

| Book | State | Source |
|---|---|---|
| Primary Advantage Origins 2 | Printed | Strategy §2, line 41 |
| Primary Advantage Origins 3.1 | Printed | Strategy §2, line 41 |
| Primary Advantage Origins 3.2 | Ordered on 2026-10-26 | Strategy §3.1, line 74 |
| Primary Advantage Quest 4 | Ordered on 2026-10-26 | Strategy §3.1, line 74 |

The other 12 books are not made yet. Their Thai comes with the book, and the same Thai serves both tests of that book.

**Default:** the rule holds for every test in this design. No test holds new Thai. The build script reads the Thai from the glossary of the lesson packages. It writes no Thai of its own.

**Default:** the check for the 12 books that are not made yet sits with the book. It is not a test check. Section 7.5 holds the test check time.

### 3.6 The pictures for listen-and-point

| Rule | Detail |
|---|---|
| The style | Printed-book style. The picture sits on the paper beside the item. |
| The characters | Characters show hair and clothes only. The pictures mark no race. |
| The text | No text appears in a picture. The caption is below the picture. |
| The count | One picture per picture item. The picture shows three numbered objects. |
| The answer | The student circles one number. |
| The audio | The teacher reads one short talk. The talk names three places or three objects. |
| The size | The picture is at least 30 mm wide on an A4 page. |

**Default:** the talk names three objects in the same order as the numbers. The student hears "one", "two", "three" in the talk.

**Default:** the picture for a listening item is not the same picture as the picture in the lesson. The test must not ask the student to recall a picture.

### 3.7 The faults in last semester's audio kit

The PM relayed these faults to Workbooks. They must not appear in a new test.

| Fault | Where | Fix for the new design |
|---|---|---|
| The Thai in the audio differs from the printed teacher script | Files 00, 01, 02a, 06 | The script file and the build script take the Thai text from one file |
| The README says every file is bilingual, but two files hold English only | Files 02b and 02e | The build script writes the file list from the joined files. The README lists each file with its two languages. |
| The test plan still reads "v0.1 (draft for approval)" | `semester-test-plan.md` | The plan moves to version 1.0 when Daniel approves it. The new tests have no plan file. The form document replaces the plan. |
| The spoken numbers differ from the printed numbers | Files 02c, 02d, 04, 05 | The build script reads the numbers from the manifest. The manifest holds the item numbers. |

The last three faults are number-format differences. They sound the same when spoken. They still show that the script and the audio have two sources. One source fixes them.

---

## 4. The level tests

### 4.1 What this document holds and what it does not hold

This document holds the listening form of the three level tests. It holds the parts, the item counts, the marks, the minutes and the administration rules.

This document holds no level test item. It holds no passage. It holds no answer key. It holds no audio file. The level test items live in the private place described in section 6.

**Default:** the level test papers and the level test answer keys never enter this repository. The Workbooks repository is public.

### 4.2 The three level tests

| Level test | Band | Covers | Listening items | Whole test items | Whole test minutes |
|---|---|---|---|---|---|
| Pre-A1 level test | Pre-A1 | Levels 1 to 3, all four books, 56 lessons | 20 | 45 | 45 |
| A1 level test | A1 | Levels 4 to 6, all four books, 56 lessons | 25 | 60 | 60 |
| A2 level test | A2 | Levels 7 to 9, all eight books, 112 lessons | 25 | 69 | 72 |

The listening items are the part that this document designs. The whole test items and the whole test minutes also hold the reading and writing paper and the spoken paper. The minutes come from the Cambridge reference formats. Pre-A1 uses about 45 minutes. A1 uses about 60 minutes. A2 uses about 72 minutes. The Cambridge reference is a planning tool only. This document does not claim a Cambridge alignment.

### 4.3 The listening form of the Pre-A1 level test

| Part | Item type | Items | Marks | What the student does |
|---|---|---|---|---|
| L1 | Match the name to the person in one picture | 5 | 5 | Draws a line from each name to the person |
| L2 | Write a name or a number | 5 | 5 | Writes the answer in the gap |
| L3 | Choose the correct picture | 5 | 5 | Circles A, B or C |
| L4 | Colour the object and write a word | 5 | 5 | Colours three objects and writes two words |
| | **Total** | **20** | **20** | |

The parts follow the Cambridge Pre A1 Starters listening paper: four parts, twenty questions, about twenty minutes. Each part begins with one or two examples. Each recording plays twice.

### 4.4 The listening form of the A1 level test

| Part | Item type | Items | Marks | What the student does |
|---|---|---|---|---|
| L1 | Match the name to the person in one picture | 5 | 5 | Draws a line from each name to the person |
| L2 | Write a missing word or a number | 5 | 5 | Writes the answer in the gap |
| L3 | Match the picture to the named picture | 5 | 5 | Draws a line from each letter to the picture |
| L4 | Choose the correct picture | 5 | 5 | Circles A, B or C |
| L5 | Colour the object and write a word | 5 | 5 | Follows the instruction in the picture |
| | **Total** | **25** | **25** | |

The parts follow the Cambridge A1 Movers listening paper: five parts, twenty-five questions, about twenty-five minutes.

### 4.5 The listening form of the A2 level test

| Part | Item type | Items | Marks | What the student does |
|---|---|---|---|---|
| L1 | Match the name to the person in one picture | 5 | 5 | Draws a line from each name to the person |
| L2 | Write a missing word or a number | 5 | 5 | Writes the answer in the gap |
| L3 | Match the picture to the named picture | 5 | 5 | Draws a line from each letter to the picture |
| L4 | Choose the correct picture | 5 | 5 | Circles A, B or C |
| L5 | Colour three objects and write two words | 5 | 5 | Follows the instruction in the picture |
| | **Total** | **25** | **25** | |

The parts follow the Cambridge A2 Flyers listening paper: five parts, twenty-five questions, about twenty-five minutes.

### 4.6 The rules of a level test

1. The level test covers every lesson of the band. It does not cover one book.
2. The level test uses words from the Cambridge word list of the band. The list holds 495 Starters words, 399 Movers words and 513 Flyers words.
3. The level test passages are new. They do not appear in any lesson.
4. The level test audio plays each recording twice.
5. The level test has a spoken section and a written section. The two sections sit on the same day.
6. The teacher runs the level test. The assessor keeps the answer key.
7. The level test papers stay closed during the listening part.

**Default:** the assessor is the person whom Daniel names. Daniel names himself. The assessor holds the answer key and reports the level test band.

**Default:** the level test does not show a CEFR level, a Cambridge name or a band number on the student paper. The paper shows the book title and the student name.

---

## 5. Secure or classroom

### 5.0 The roles

| Role | Who | What the role does |
|---|---|---|
| The builder | Workbooks | Workbooks builds the tests and runs the checks |
| The assessor | The person whom Daniel names. Default: Daniel | The assessor marks the level test and holds the answer key |
| The teacher | The teacher of the class | The teacher runs a book test in the room and marks it |
| The holder of the private place | Daniel and the person he names | The holder has the access to the private place |
| The PM | The PM orchestrator session | The PM relays the files to Daniel's Drive. The PM relays Daniel's answers back to Workbooks. |

The PM is an AI coordinator session. It holds no key, marks no paper and builds no test.

### 5.1 The recommendation

| Test | Recommendation | Where it lives | Who marks it |
|---|---|---|---|
| Book test, after lesson 7 | Classroom | Private place, with a copy for the teacher | The teacher |
| Book test, after lesson 14 | Classroom | Private place, with a copy for the teacher | The teacher |
| Pre-A1, A1 and A2 level test | Secure | Private place only | The assessor |

### 5.2 The reasons

1. A book test checks taught content. A leak harms one class. The teacher needs the paper in the room.
2. A level test checks the whole band. A leak harms every future class in that band.
3. This repository is public. Any level test item in it stays in it.
4. The book test paper is useful in the room on the day. The level test paper is useful once.
5. The teacher marks the book test because the teacher knows the class. The assessor marks the level test because the answer key must stay with one person.
6. The book test needs no new process. The teacher already runs a test day. Last semester's teacher script has the timing table and the contingencies.

### 5.3 The decision that Daniel must make

**Decision 1. Does the private place exist before the first book test ships?**

The first book test is for Primary Advantage Origins 2. The strategy lists Origins 2 as a printed book on sale. It says of Tutor Advantage: "Sells Primary Origins 2, Primary Origins 3.1, and Reading Advantage Origins 2 today, because those books are printed." (`advantage-pr/08-strategy/product-strategy-2026-2027.md` §2, line 34.)

- **Default:** Workbooks builds the Origins 2 book test in a working folder outside this repository, at `~/Desktop/asset-requests/<date>/book-tests/`. That folder is not in git. The private place receives the files when Daniel creates it. The public repository keeps only this form document and the build tools.
- **Why:** the test must not wait for a new repository, and the test must not sit in the public repository.

**Decision 2. Who holds the access to the private place?**

- **Default:** Daniel and the person he names hold the access. The teacher holds a book test only while the test day runs. The teacher never holds a level test answer key.

**Decision 3. What happens to last semester's test?**

It is now at `content/primary/origins-2/assessments/semester-1/` in this public repository. It holds the paper, the plan, the teacher script, the answer key, the audio and the build script.

- **Default:** the last semester's test moves to the private place when the private place exists. Until then it stays in this repository, and Daniel decides.

**Decision 4. Who reports the level test band?**

- **Default:** the assessor reports the level test band. The assessor is the person whom Daniel names. Daniel names himself. The teacher reports the band of the book test and reports no number for the level test.

### 5.4 The approved direction library

The 13 step directions and the 5 Tutor directions live in `content/primary/_step-directions/`. The folder name starts with an underscore, so it is not a book.

| File | What it holds |
|---|---|
| `directions.json` | The source of every direction text, in English and in Thai |
| `manifest.json` | The 13 step directions, their checks, their approval record |
| `manifest-tutor.json` | The 5 Tutor directions, their checks, their approval record |
| `sd-01.mp3` … `sd-13.mp3` | The 13 joined step direction files |
| `sd-flashcards.mp3`, `sd-pair-conversation.mp3`, `sd-sentence-game.mp3`, `sd-vocabulary-game.mp3`, `sd-wrap-up.mp3` | The 5 joined Tutor direction files |

Daniel's listen check on the 13 files passed on 2026-10-27 at 15:51 ICT. His words were: "Beautiful, champ". His check on the 5 Tutor files passed on 2026-10-27 at 17:42 ICT. His words were: "Approved". The test directions in section 3.4 follow the same form and the same voices.

---

## 6. Where the items live

### 6.1 The private place

**Default:** a new private repository holds the tests. Its name is `advantage-assessment`. Daniel approves the name and the repository before Workbooks creates it. The repository is private and it is not a fork of a public repository.

| Path | Content |
|---|---|
| `tests/book/<book>/<test>/` | One folder per book test |
| `tests/level/<band>/` | One folder per level test |
| `tests/legacy/origins-2-semester-1/` | Last semester's test, after it moves |
| `tools/` | The generator and the checks |
| `media/pictures/` | The generated pictures |
| `media/audio/` | The joined audio files |

The folder name of a book test uses the book key and the test number. An example: `tests/book/quest-4/t1-after-lesson-7/`.

### 6.2 The files of one book test

| File | Name | Content |
|---|---|---|
| The paper | `paper.md` and `paper.pdf` | The student paper, ready to print |
| The teacher script | `teacher-script.md` | The bilingual script with the timing table and the contingencies |
| The answer key | `answer-key.md` | The answer of every item, the point of every item, the writing rubric |
| The audio | `audio/` | The joined direction files, the passage, the item clips, and the play order file |
| The manifest | `manifest.json` | The item counts, the marks, the objectives covered, the vocabulary covered, the file list, and the check results |

The manifest is the machine-readable source of the test. The check script reads the manifest. The paper, the script and the answer key are generated from the manifest.

### 6.3 The files of one level test

| File | Name | Content |
|---|---|---|
| The paper | `paper.md` and `paper.pdf` | The student paper, ready to print |
| The teacher script | `teacher-script.md` | The bilingual script with the timing table |
| The answer key | `answer-key.md` | The answer of every item, the point of every item |
| The audio | `audio/` | The joined direction files, the passages, the item clips, and the play order file |
| The manifest | `manifest.json` | The item counts, the marks, the objectives covered, the file list, and the check results |

### 6.4 What this repository keeps

| Item | Path here |
|---|---|
| This form document | `docs/content-plans/a25-book-tests-design.md` |
| The generator and the checks | A new folder `dashboard/scripts/build-test/`, and its tests in `dashboard/__tests__/` |
| The lesson packages that the tests draw from | `content/primary/<book>/l*.json` |
| The direction library | `content/primary/_step-directions/` |

**Default:** the generator and the checks stay in this repository. They hold no test item. Workbooks runs the generator. It reads a manifest from the private place and writes the paper, the script and the answer key into the private place.

---

## 7. The build and the checks

### 7.1 The inputs of the generator

| Input | Source | Use |
|---|---|---|
| The lesson packages | `content/primary/<book>/l*.json` | The glossary, the questions, the activities and the tags |
| The glossary | `package.glossary` | Part A, Part D1 and Part D3, and the Thai word meanings |
| The bank | `package.bank.mcq`, `package.bank.saq` | Parts C1 and C2 |
| The print set | `package.print.mcq` | The layout of the multiple choice items |
| The activities | `package.activities` | Parts D2, D4 and E1 |
| The tags | `package.tags` | The objective coverage report |
| The manifest of the test | The private place | The item counts, the marks and the answers |

### 7.2 The item checks

| Check | Rule | Source |
|---|---|---|
| The item count | The count of every part matches the table in section 2 | This document |
| The mark sum | The marks of every part add up to the total of the test | This document |
| The evidence | Every multiple choice item has a sentence in the lesson text that proves the answer | `McqSchema.evidence` |
| The word list | Every word in the test is in the vocabulary of the lessons that the test covers | `package.text.glossed` and `package.text.recycle` |
| The answer | Every item has an answer in the answer key | The manifest |
| The option count | Every multiple choice item has 3 options at band Pre-A1 and 4 options at bands A1 and A2 | `PrintSchema.mcqOptions` |
| The objective cover | Every part lists the objectives it covers, and every target objective of the covered lessons appears at least once | `package.tags.targetObjectives` |
| The band word list | Every word of the test is in the Cambridge word list of the band | `cambridge-vocabulary-inventory.json` |
| The Thai source | Every Thai word meaning in the test comes from the glossary Thai of the lesson packages | Section 3.5 |
| The Thai condition | The glossary Thai comes from a book whose Thai Daniel already checked | Section 3.5 |
| The new Thai | The test holds no Thai that the glossary does not hold | Section 3.5 |

Workbooks runs these checks. Workbooks also runs a page check on the printed PDF. The page check covers the paper, the answers, the key and the English audio.

### 7.3 The audio checks

| Check | Limit | Who |
|---|---|---|
| The English clip passes the recognizer | Word error rate at most 0.10 | Workbooks |
| The clip is not silent | True | Workbooks |
| The peak level of the joined file | At most -1.5 dBFS | Workbooks |
| The loudness of each part | -18 LUFS | Workbooks |
| The inner silence | At most 1.2 s | Workbooks |
| The shift rate | At most 0.35 s per character | Workbooks |
| The Thai clip | Daniel's ear | Daniel |
| The play order | The play order file lists every file in the teacher script | Workbooks |
| The file list | The README lists each file with its two languages | Workbooks |
| The script and the audio agree | The Thai text of the script matches the Thai text of the audio | Workbooks |

The English audio needs no ear check from Daniel. The recognizer check holds it. The Thai clip has no machine check. Daniel's ear holds it.

### 7.4 The print check

| Check | Rule | Who |
|---|---|---|
| The page | A4. The margins are Default or None. | Workbooks |
| The background graphics | The print dialog must have Background graphics enabled. | Workbooks |
| The pictures | At least 30 mm wide. At least 300 dpi in the PDF. | Workbooks |
| The answer lines | Every answer line has room for the longest accepted answer. | Workbooks |
| The reflection page | No points appear on the page. | Workbooks |
| The Thai | The Thai text uses one type size. It must not break across a line in a word. | Workbooks |

### 7.5 Daniel's check time

**Default:** the machine checks and the Workbooks page check cover the papers, the answers, the keys and the English audio. The English audio needs no ear check from Daniel. The recognizer check is enough for the English. Daniel's ear is the only check for the Thai.

Daniel makes two kinds of check.

| Check | What Daniel does | How many | Minutes a check | Minutes |
|---|---|---|---|---|
| The Thai direction template | Daniel listens to the seven direction files and approves the Thai once | 1 | 15 | 15 |
| One full book test for each band | Daniel reads the paper, checks the Thai and listens to the audio | 3 | 25 | 75 |
| **Total** | | | | **90** |

The 25 minutes of a full check break down as follows.

| Part of the full check | Minutes |
|---|---|
| Read the paper and check the layout | 10 |
| Check the Thai of the paper and of the key | 8 |
| Listen to the passage and to the item clips | 7 |
| **Total** | **25** |

**Default:** Daniel's total is 90 minutes. That is 1.5 hours.

**Default:** the Thai of the 12 books that are not made yet is checked one time with each book. That check sits with the book, not with the test. It adds no test check time. The same Thai serves both tests of that book.

**Default:** the full review is an option. In that option Daniel checks every test in full by ear. The cost is 40 minutes a book test and 80 minutes a level test. The 32 book tests and the 3 level tests then need 1,520 minutes. That is about 25 hours.

**Default:** Workbooks runs the machine checks and the page check. Daniel's ear covers only the Thai.

---

## 8. The counts and the MiniMax estimate

### 8.1 The speech characters

The count holds every character that the build script sends to MiniMax. Each item clip is synthesized once. A passage plays twice in its file, but the build script synthesizes each sentence once and repeats the clip. The count therefore holds each sentence once.

The count holds the direction clips once per band. Every test of a band reuses them.

| Group | Tests | Characters per test | Characters |
|---|---|---|---|
| Pre-A1 book test, first | 4 | 1,107 | 4,428 |
| Pre-A1 book test, second | 4 | 1,262 | 5,048 |
| A1 book test, first | 4 | 1,865 | 7,460 |
| A1 book test, second | 4 | 2,325 | 9,300 |
| A2 book test, first | 8 | 2,535 | 20,280 |
| A2 book test, second | 8 | 2,790 | 22,320 |
| Pre-A1 level test | 1 | 2,800 | 2,800 |
| A1 level test | 1 | 3,875 | 3,875 |
| A2 level test | 1 | 4,250 | 4,250 |
| Direction clips, 3 bands, shared | 1 | 4,269 | 4,269 |
| **Total** | **35** | | **84,030** |

The count for one book test holds four parts.

| Part of the count | Pre-A1 first | Pre-A1 second | A1 first | A1 second | A2 first | A2 second |
|---|---|---|---|---|---|---|
| The listening passage | 567 | 567 | 960 | 960 | 1,440 | 1,440 |
| The multiple choice clips | 300 | 375 | 380 | 570 | 475 | 570 |
| The picture clips | 240 | 320 | 240 | 320 | 240 | 400 |
| The gap clips | — | — | 285 | 475 | 380 | 380 |
| **Characters per test** | **1,107** | **1,262** | **1,865** | **2,325** | **2,535** | **2,790** |

The passage count holds 21 sentences of 27 characters at band Pre-A1. It holds 30 sentences of 32 characters at band A1. It holds 40 sentences of 36 characters at band A2.

The multiple choice clip count holds 75 characters for 3 options. It holds 95 characters for 4 options. The picture clip count holds 80 characters. The gap clip count holds 95 characters.

The count for the direction clips holds seven templates per band. The templates hold 243, 190, 123, 228, 304, 184 and 151 characters. One band holds 1,423 characters. Three bands hold 4,269 characters.

The count for a level test holds one recording per part and one clip per item.

| Level test | Recordings | Item clips | Characters |
|---|---|---|---|
| Pre-A1 | 4 recordings, 400 characters each, 1,600 | 20 clips, 60 characters each, 1,200 | 2,800 |
| A1 | 5 recordings, 450 characters each, 2,250 | 25 clips, 65 characters each, 1,625 | 3,875 |
| A2 | 5 recordings, 500 characters each, 2,500 | 25 clips, 70 characters each, 1,750 | 4,250 |

### 8.2 The price

| Item | Value |
|---|---|
| The list price | 100 US dollars per 1 million characters |
| The list price cost of this work | 8.40 US dollars |
| The quota | The MiniMax Token Plan quota. The step directions record no extra charge. |

**Default:** the quota covers the work. The cost of this work is 0 US dollars under the plan.

### 8.3 The pictures

| Group | Pictures per test | Tests | Pictures |
|---|---|---|---|
| Pre-A1 book test, first | 3 listening and 1 reading | 4 | 16 |
| Pre-A1 book test, second | 4 listening and 1 reading | 4 | 20 |
| A1 book test, first | 3 listening and 1 reading | 4 | 16 |
| A1 book test, second | 4 listening and 1 reading | 4 | 20 |
| A2 book test, first | 3 listening and 1 reading | 8 | 32 |
| A2 book test, second | 5 listening and 1 reading | 8 | 48 |
| Pre-A1 level test | 18 | 1 | 18 |
| A1 level test | 28 | 1 | 28 |
| A2 level test | 28 | 1 | 28 |
| **Total** | | **35** | **226** |

The level test picture count follows the Cambridge reference. The Pre-A1 count holds one big picture for L1. It holds one form page for L2. It holds fifteen option pictures for L3. It holds one big picture for L4. The A1 and A2 counts hold the same four sets. They hold ten more pictures for L3. They hold one more big picture for L5.

**Default:** the picture style test goes to Daniel's Drive before any volume of pictures is made. The 10 picture style test uses one book test of band A1, so it covers the small picture, the big picture and the option picture.

### 8.4 The totals of the design

| Item | Count |
|---|---|
| Tests | 35 |
| Student papers | 35 |
| Teacher scripts | 35 |
| Answer keys | 35 |
| Manifests | 35 |
| Audio files, joined | 155 |
| Speech characters | 84,030 |
| Pictures | 226 |
| Daniel's review time | about 90 minutes |

The 155 joined audio files hold 21 shared direction files, 120 book test files, and 14 level test files. A Pre-A1 book test holds 3 files: the passage, the multiple choice clips, and the picture clips. An A1 and A2 book test holds 4 files, because it also holds the gap clips. A Pre-A1 level test holds 4 files, one for each part. An A1 and A2 level test holds 5 files, one for each part.

---

## 9. The open questions

Each question holds a default. The PM relays the questions to Daniel. The PM relays Daniel's answers back to Workbooks.

| # | Question | Default | Who decides |
|---|---|---|---|
| 1 | Does the private place exist before the Origins 2 book test ships? | Workbooks builds the test in a working folder outside this repository, at `~/Desktop/asset-requests/<date>/book-tests/`. The private place receives the files when Daniel creates it. | Daniel |
| 2 | What is the name of the private repository? | `advantage-assessment` | Daniel |
| 3 | Does last semester's test move to the private place? | It moves when the private place exists. Until then it stays in this repository. | Daniel |
| 4 | Is the second book test after lesson 14 or at the end of the book? | After lesson 14. The paper is ready before the last lesson. | Daniel |
| 5 | Does the teacher report a score to the school? | The teacher reports the band of the book test. No number goes to the school. | Daniel |
| 6 | Does the book test hold a speaking part? | No. The teacher holds a separate reading check, as last semester's plan set out. | Daniel |
| 7 | Which English voice plays the test items? | `English_captivating_female1` at speed 0.9. The passage uses speed 0.85. | Daniel |
| 8 | Is there one Thai direction template for all bands? | Yes. Daniel approves it once. | Daniel |
| 9 | Do the level tests run in the school or in the office? | The level test runs in the office. The school runs the book tests. | Daniel |
| 10 | Does the level test paper show the band? | No. The paper shows the book title and the student name only. | Daniel |
| 11 | How many makes of each picture? | One make per item. The style test comes first. | Workbooks |
| 12 | What is the order of the build? | The Pre-A1 band first, because Origins 2 is a printed book on sale. Then A1, then A2. | Workbooks |
| 13 | Does the first book test cover lessons 1 to 7 of Origins 2 or of Origins 3.1? | Origins 2. The strategy says Tutor Advantage "Sells Primary Origins 2, Primary Origins 3.1, and Reading Advantage Origins 2 today, because those books are printed." | Workbooks |
| 14 | Does the answer key use a band scale or a mark total? | A mark total in the key. The band scale goes in the teacher script, once Daniel sets the bands. | Daniel |
| 15 | Does the level test have a spoken section? | Yes. The spoken section sits on the same day as the written section. | Daniel |
| 16 | Who marks the level test and holds its answer key? | The assessor whom Daniel names. Daniel names himself. | Daniel |
| 17 | Who holds the access to the private place? | Daniel and the person he names. | Daniel |
| 18 | Does Daniel check every test in full or only the Thai? | Only the Thai, plus one full book test a band. The full review costs 1,520 minutes. | Daniel |
| 19 | Which books hold Thai that Daniel already checked? | The printed and ordered books: Primary Advantage Origins 2, Origins 3.1, Origins 3.2 and Quest 4. | Daniel |
| 20 | When is the Thai of a book that is not made yet checked? | One time, with the book. The same Thai serves both tests of that book. | Daniel |

---

## 10. The known limits of this document

1. The document holds no item. The item counts are a design target, not a finished test.
2. The picture count for the level tests follows the Cambridge reference. The count may fall when Workbooks builds the first level test.
3. The character count is an estimate. It uses a fixed length for each clip type. The real count may differ by 10 percent.
4. The last semester's test still reads "v0.1 (draft for approval)". The document does not change that file.
5. The rule that external copy names CEFR only applies to customer, press and partner material. This document is internal and it names the Cambridge lists.
6. The 90 minutes of Daniel's check time cover the test checks only. The Thai of the 12 books that are not made yet is checked one time with each book. That check sits with the book and it adds no test check time.

---

**Revision history**

- **v0.1** — 2026-10-27 — First draft for the PM. The design covers 32 book tests and 3 level tests. It also covers the listening form, the private place, the build, the checks and the counts.
- **v0.2** — 2026-10-27 — The PM no longer acts as a person. Workbooks builds and checks the tests. The assessor marks the level test. Daniel and the person he names hold the access to the private place. Daniel's check time was 250 minutes at that version, and the 1,520-minute full review stays an option. The Boonyathat claim is gone, and the printed-book sale now carries that reason.
- **v0.3** — 2026-10-27 — The PM decided that the Thai word meanings in a test come only from glossary Thai that Daniel already checked. Section 3.5 holds that rule. The Thai of the 12 books that are not made yet is checked one time with each book, so it adds no test check time. Daniel's test check time is 90 minutes.
