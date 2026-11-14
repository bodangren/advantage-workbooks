// @vitest-environment node
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOOP_CHECK_STATUS, checkStorytimeWeek, taughtTo } from '../lib/storytime/checks';
import { STORYTIME_ROOT, readLevelWeeks, readPhonemeBank, storytimeWeekFile } from '../lib/storytime/files';
import { phonemeAudioFields, phonemeAudioProblems } from '../lib/storytime/phonemes';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

// Phase 3 Red of track storytime_teaching_loops_20261103 (FR-10, spec D10, test-strategy 6.2): the content of
// the shipped weeks w01 to w08. Each test name holds `w0N`, so `-t "w0N"` selects one week (decision Q12).
//
// Baseline of the additive compare: commit 23ad4cf85a151564da7e2b2ce76344e6143b49ab, the last commit that
// changed a week file before this content (the planned cc7808c5 is older; the print content of 2026-11-03 changed
// the week files after it). The test never skips: a failed `git show` fails the test with a message.
//
// Allow-list of the additive compare (test-strategy 6.2, anti-pattern A7), exactly two keys, owner track
// `storytime_print_r1_20261025`: `print` and `approval.print`. Both sides drop them.

type Raw = any;

const BASELINE_COMMIT = '23ad4cf85a151564da7e2b2ce76344e6143b49ab';
const REPO_ROOT = path.resolve(STORYTIME_ROOT, '..', '..');
const WEEK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];
const LOOP_STEP_IDS = ['A1', 'A2', 'A3', 'A4', 'A6', 'C5', 'D2'];
const SIX_CHECKS = ['loops-blend', 'loops-sound', 'loops-sight', 'loops-questions', 'loops-recall', 'loops-minutes'];
const REVIEW_CHECKS = ['loops-recall', 'loops-minutes'];
/** The spoken sound of each teach week, as the week writes it. The `correct` line of a sound loop models it. */
const WEEK_SOUND: Record<number, string> = { 1: 'nnn', 2: '/a/', 3: '/p/', 4: 'mmm', 5: 'sss', 6: '/t/', 7: '/o/' };
/** English words that name a letter. A new line says a pure sound, never a letter name (spec FR-3). */
const LETTER_NAME_WORDS = ['ay', 'pee', 'em', 'es', 'tee', 'oh'];
const THAI = /[฀-๿]/;

const weekFile = (n: number) => storytimeWeekFile(STORYTIME_ROOT, 2, n);
const shippedRaw = (n: number): Raw => JSON.parse(fs.readFileSync(weekFile(n), 'utf8'));

/**
 * The script edits of track `storytime_print_r1_20261025` (A-48), exact text pairs of the baseline file: the
 * capital letter of the first word of a practice line quote (F2), the formation words of week 1 (E49), and the back list
 * of the week 5 read-along (E4: "one" and "four" are story words and week 2 family words).
 * The baseline side takes each edit before the compare, so any other change of a week file still fails. Each pair
 * must match exactly once: a stale pair fails the test.
 */
const A48_SCRIPT_EDITS: Record<number, [string, string][]> = {
    8: [
        ['"ant",\n                  "alligator"', '"ant",\n                  "axe"'],
        ['"sound": "nnn",\n                "pictures": [\n                  "nest"', '"sound": "/n/",\n                "pictures": [\n                  "nest"'],
        ['"sound": "mmm",\n                "pictures": [\n                  "moon"', '"sound": "/m/",\n                "pictures": [\n                  "moon"'],
        ['"sound": "sss",\n                "pictures": [\n                  "sun"', '"sound": "/s/",\n                "pictures": [\n                  "sun"'],
    ],
    1: [
        ['Decodable: read together', 'First-sound book: read together'],
        ['หนังสือฝึกสะกดอ่าน: อ่านด้วยกัน', 'หนังสือเสียงแรก: อ่านด้วยกัน'],
        ['"\\"Start at the top. Down. Up. Over the hill. Down.\\""', '"\\"Start at the dot. Down. Up. Over the hill. Down.\\""'],
        ['"\\"เริ่มที่ด้านบน ลง ขึ้น ข้ามเนิน ลง\\""', '"\\"เริ่มที่จุด ลง ขึ้น ข้ามเนิน ลง\\""'],
        ["start at the top, down, up, over the hill, down.", "start at the dot, down, up, over the hill, down."],
        ['(เริ่มที่ด้านบน ลง ขึ้น ข้ามเนิน ลง)', '(เริ่มที่จุด ลง ขึ้น ข้ามเนิน ลง)'],
    
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['  "print": {\n    "letterBox": {',
         '  "print": {\n    "checkRows": {\n      "trickyWord": "a",\n      "blendWord": "net"\n    },\n    "letterBox": {'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"Collect the books and mark the check."\n            ]',
         '"Collect the books and mark the check.",\n              "While the class does the written rows, the teacher calls one child at a time for row 5 and row 6 and ticks the box when the child is right."\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ"\n            ]',
         '"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ",\n              "ขณะที่ชั้นเรียนทำแถวที่ต้องเขียน ครูเรียกเด็กมาทีละคนเพื่อทำแถว 5 และแถว 6 แล้วขีดถูกเมื่อเด็กทำถูก"\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"Now write the letter n.\\""\n            ]',
         '"\\"Now write the letter n.\\"",\n              "\\"Row 5: Read this word: a.\\"",\n              "\\"Row 6: /n/ /e/ /t/. What is the word?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"ทีนี้เขียนตัวอักษร n\\""\n            ]',
         '"\\"ทีนี้เขียนตัวอักษร n\\"",\n              "\\"แถว 5: อ่านคำนี้: a\\"",\n              "\\"แถว 6: /n/ /e/ /t/. คำนี้คือคำอะไร?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['[Verse]\\nHello, hello, I am Pip\\nHello, hello, I am Nan\\nWave your hand and say it too\\nHello, I am you\\n\\n[Chorus]\\nHello, I am Pip (clap clap)\\nHello, I am Nan (clap clap)\\nHello, I am, hello, I am\\nHello, who are you?\\n\\n[Verse]\\nPoint to me, I am Pip\\nPoint to you, you are Nan\\nNod your head and say it too\\nHello, I am you\\n\\n[Chorus]\\nHello, I am Pip (clap clap)\\nHello, I am Nan (clap clap)\\nHello, I am, hello, I am\\nHello, who are you?',
         '[Verse]\\nHello, hello, I am Pip\\nHello, hello, I am Nan\\nWave your hand and say it too\\nHello, I am you\\n\\n[Chorus]\\nHello, I am Pip (Hello, I am Pip!)\\nHello, I am Nan (Hello, I am Nan!)\\nHello, who are you? (Hello, who are you?)\\nHello, who are you?\\n\\n[Verse]\\nPoint to me, I am Pip\\nPoint to you, you are Nan\\nNod your head and say it too\\nHello, I am you\\n\\n[Chorus]\\nHello, I am Pip (Hello, I am Pip!)\\nHello, I am Nan (Hello, I am Nan!)\\nHello, who are you? (Hello, who are you?)'],
        ['"Pairs take turns, page by page."', '"Pairs take turns, page by page.",\n              "Each child colors their own book."'],
        ['"คู่ผลัดกันอ่านทีละหน้า"', '"คู่ผลัดกันอ่านทีละหน้า",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"Nan Can Nod\\""\n          ]', '{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Nan Can Nod\\"",\n            "crayons"\n          ]'],
        ['{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "books (one for each pair): \\"Nan Can Nod\\""\n          ]', '{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Nan Can Nod\\""\n          ]'],
        ['{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "books (one for each pair): \\"Nan Can Nod\\""\n          ]', '{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Nan Can Nod\\""\n          ]'],
        ['"books (one for each pair): \\"Nan Can Nod\\"",', '"small books (each child\'s own): \\"Nan Can Nod\\"",'],
        ['"books (one for each pair): \\"Hello!\\", \\"Nan Can Nod\\"",', '"small books (each child\'s own): \\"Hello!\\", \\"Nan Can Nod\\"",'],
        ['"Children read \\"Hello!\\" together, then in pairs."', '"Children read \\"Hello!\\" together, then in pairs.",\n              "Each child colors their own book."'],
        ['"เด็ก ๆ อ่าน \\"Hello!\\" พร้อมกัน แล้วอ่านเป็นคู่"', '"เด็ก ๆ อ่าน \\"Hello!\\" พร้อมกัน แล้วอ่านเป็นคู่",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['"Give out the class set of \\"Hello!\\" (Sprout band)."', '"Children take out their own small books."'],
        ['"แจกหนังสือ \\"Hello!\\" ชุดสำหรับทั้งชั้น (ระดับ Sprout)"', '"เด็ก ๆ หยิบหนังสือเล่มเล็กของตัวเองออกมา"'],
        ['{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"Hello!\\""\n          ]', '{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Hello!\\" (Sprout band)",\n            "crayons"\n          ]'],
        ['    "thai": {\n      "status": "approved",\n      "date": "2026-10-22",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 67"\n    },', '    "thai": {\n      "status": "approved",\n      "date": "2026-11-05",\n      "words": "\\"Approved\\" (2026-11-05 21:4x ICT; the 3 color-own-book Thai lines)",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 67 (2026-10-22); PM relay of 2026-11-05 (owner answer on the color-own-book Thai lines, ~/Desktop/handoff/storytime-color-own-book/lines-2026-11-05.md)"\n    },'],
    ],
    2: [
        ['"pig",\n          "bed",\n          "alligator"\n        ],\n        "answer": "alligator"', '"pig",\n          "bed",\n          "axe"\n        ],\n        "answer": "axe"'],
        ['Row 3: pig, bed, alligator. Which', 'Row 3: pig, bed, axe. Which'],
        ['แถว 3: pig, bed, alligator คำไหน', 'แถว 3: pig, bed, axe คำไหน'],
        ['with me: an. Nan.', 'with me: An. Nan.'], ['Read the words: an. Nan.', 'Read the words: An. Nan.'],
        ['Then they count the apples in the picture and trace the number word under it: three.', 'Then they count the ducks in the picture: three.'],
        ['"\\"Count the apples. How many? Three! Trace the word three.\\""', '"\\"Count the ducks. How many? Three!\\""'],
        ['Children trace the frame and the number word.', 'Children trace the frame and count the ducks.'],
        ['จากนั้นนับแอปเปิลในภาพ และลากเส้นตามคำศัพท์ตัวเลขใต้ภาพ: three', 'จากนั้นนับเป็ดในภาพ: three'],
        ['"\\"นับแอปเปิล How many? Three! ลากเส้นตามคำ three\\""', '"\\"นับเป็ด How many? Three!\\""'],
        ['เด็ก ๆ ลากเส้นตามกรอบประโยคและคำศัพท์ตัวเลข', 'เด็ก ๆ ลากเส้นตามกรอบประโยคและนับเป็ด'],
    
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['  "print": {\n    "letterBox": {',
         '  "print": {\n    "checkRows": {\n      "trickyWord": "I",\n      "blendWord": "cat"\n    },\n    "letterBox": {'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"Collect the books and mark the check."\n            ]',
         '"Collect the books and mark the check.",\n              "While the class does the written rows, the teacher calls one child at a time for row 8 and row 9 and ticks the box when the child is right."\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ"\n            ]',
         '"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ",\n              "ขณะที่ชั้นเรียนทำแถวที่ต้องเขียน ครูเรียกเด็กมาทีละคนเพื่อทำแถว 8 และแถว 9 แล้วขีดถูกเมื่อเด็กทำถูก"\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"Now write the letter a. Then write the word an.\\""\n            ]',
         '"\\"Now write the letter a. Then write the word an.\\"",\n              "\\"Row 8: Read this word: I.\\"",\n              "\\"Row 9: /k/ /a/ /t/. What is the word?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"ทีนี้เขียนตัวอักษร a แล้วเขียนคำ an\\""\n            ]',
         '"\\"ทีนี้เขียนตัวอักษร a แล้วเขียนคำ an\\"",\n              "\\"แถว 8: อ่านคำนี้: I\\"",\n              "\\"แถว 9: /k/ /a/ /t/. คำนี้คือคำอะไร?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['[Verse]\\nHow many suns? One sun!\\nHow many kites? Two kites!\\n\\n[Chorus]\\nHow many? How many? One, two, three!\\nRed, red apples! Count with me!\\n\\n[Verse]\\nHow many ducks? Three ducks!\\nHow many birds? Four birds!\\n\\n[Chorus]\\nHow many? How many? One, two, three!\\nRed, red apples! Count with me!\\n\\n[Verse]\\nHow many balls? Five balls!\\nHow many friends? Six friends!\\n\\n[Chorus]\\nHow many? How many? One, two, three!\\nRed, red apples! Count with me!\\n\\n[Chorus]\\nHow many? How many? One, two, three!\\nRed, red apples! Count with me!',
         '[Verse]\\nHow many suns? One sun!\\nHow many kites? Two kites!\\n\\n[Chorus]\\nHow many? How many? One, two, three!\\nRed, red apples! Count with me!\\n\\n[Verse]\\nHow many ducks? Three ducks!\\nHow many birds? Four birds!\\n\\n[Chorus]\\nHow many? How many? One, two, three!\\nRed, red apples! Count with me!\\n\\n[Verse]\\nHow many balls? Five balls!\\nHow many friends? Six friends! (How many friends? Six friends!)\\n\\n[Chorus]\\nHow many? How many? One, two, three!\\nRed, red apples! Count with me!\\n\\n[Chorus]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['sound picture cards: apple, ant, alligator, astronaut",\n            "picture cards: dog, sun, bus",\n            "picture cards: cat, hat, fan"',
         'sound picture cards: apple, ant, axe, astronaut",\n            "picture cards: dog, sun, bus",\n            "picture cards: cat, hat, fan"'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"sorting mat: /a/ / not /a/",\n            "sound picture cards: apple, ant, alligator, astronaut",',
         '"sorting mat: /a/ / not /a/",\n            "sound picture cards: apple, ant, axe, astronaut",'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"group signs",\n            "sound picture cards: apple, ant, alligator, astronaut"\n          ],',
         '"group signs",\n            "sound picture cards: apple, ant, axe, astronaut"\n          ],'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['apple, ant, alligator, astronaut."',
         'apple, ant, axe, astronaut."'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['apple, ant, alligator, astronaut"',
         'apple, ant, axe, astronaut"'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['วางช้อนหรือของเล่นจำนวนหนึ่งบนโต๊ะ แล้วถามบุตรหลานเป็นภาษาอังกฤษว่า \\"How many?\\" ให้บุตรหลานนับเป็นภาษาอังกฤษ: \\"One, two, three. Three!\\" จากนั้นพูด \\"ap, ap, apple\\" และ \\"an, an, ant\\" พร้อมกับบุตรหลาน (ออกเสียง /a/ สั้น ๆ ใกล้กับเสียงสระ แอะ ไม่ใช่ชื่อตัวอักษร \\"เอ\\")',
         'วางช้อนหรือของเล่นจำนวนหนึ่งบนโต๊ะ แล้วถามบุตรหลานเป็นภาษาอังกฤษว่า \\"How many?\\" ให้บุตรหลานนับเป็นภาษาอังกฤษ: \\"One, two, three. Three!\\" จากนั้นพูด \\"ap, ap, apple\\" และ \\"an, an, ant\\" พร้อมกับบุตรหลาน'],
        ['"Pairs take turns, page by page."', '"Pairs take turns, page by page.",\n              "Each child colors their own book."'],
        ['"คู่ผลัดกันอ่านทีละหน้า"', '"คู่ผลัดกันอ่านทีละหน้า",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"Can I?\\""\n          ]', '{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Can I?\\"",\n            "crayons"\n          ]'],
        ['{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "books (one for each pair): \\"Can I?\\""\n          ]', '{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Can I?\\""\n          ]'],
        ['{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "books (one for each pair): \\"Can I?\\""\n          ]', '{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Can I?\\""\n          ]'],
        ['"books (one for each pair): \\"Can I?\\"",', '"small books (each child\'s own): \\"Can I?\\"",'],
        ['"books (one for each pair): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\"",', '"small books (each child\'s own): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\"",'],
        ['"Children read \\"How Many?\\" together, then in pairs."', '"Children read \\"How Many?\\" together, then in pairs.",\n              "Each child colors their own book."'],
        ['"เด็ก ๆ อ่าน \\"How Many?\\" พร้อมกัน แล้วอ่านเป็นคู่"', '"เด็ก ๆ อ่าน \\"How Many?\\" พร้อมกัน แล้วอ่านเป็นคู่",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['"Give out the class set of \\"How Many?\\" (Sprout band)."', '"Children take out their own small books."'],
        ['"แจกหนังสือ \\"How Many?\\" ชุดสำหรับทั้งชั้น (ระดับ Sprout)"', '"เด็ก ๆ หยิบหนังสือเล่มเล็กของตัวเองออกมา"'],
        ['{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"How Many?\\""\n          ]', '{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"How Many?\\" (Sprout band)",\n            "crayons"\n          ]'],
        ['    "thai": {\n      "status": "approved",\n      "date": "2026-10-22",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 80"\n    },', '    "thai": {\n      "status": "approved",\n      "date": "2026-11-05",\n      "words": "\\"Approved\\" (2026-11-05 21:4x ICT; the 3 color-own-book Thai lines)",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 80 (2026-10-22); PM relay of 2026-11-05 (owner answer on the color-own-book Thai lines, ~/Desktop/handoff/storytime-color-own-book/lines-2026-11-05.md)"\n    },'],
    ],
    3: [
        ['"pear",\n      "cup"\n', '"pear",\n      "pencil"\n'],
        ['with me: pan. Nap.', 'with me: Pan. Nap.'], ['Read the words: pan. Nap.', 'Read the words: Pan. Nap.'],
        ['children color the balloon in the second box red, blue, or yellow.', 'children draw one thing in the second box and color it red, blue, or yellow.'],
        ['"\\"Now color the balloon. What color is it? Find the word and trace it.\\""', '"\\"Now draw something and color it. What color is it? Find the word and trace it.\\""'],
        ['Children color the balloon, then find and trace the color word.', 'Children draw one thing and color it, then find and trace the color word.'],
        ['point to the balloon and ask:', 'point to the picture and ask:'],
        ['Color the balloon with the child; the child traces the word.', 'Draw and color with the child; the child traces the word.'],
        ['ระบายสีลูกโป่งพร้อมกับเด็ก แล้วให้เด็กลากเส้นตามคำ', 'วาดและระบายสีพร้อมกับเด็ก แล้วให้เด็กลากเส้นตามคำ'],
        ['เด็ก ๆ ระบายสีลูกโป่งในช่องที่สองเป็นสีแดง สีน้ำเงิน หรือสีเหลือง แล้วหาคำศัพท์สีใต้ช่องที่ตรงกับสีลูกโป่ง', 'เด็ก ๆ วาดสิ่งของ 1 อย่างในช่องที่สองและระบายสีแดง สีน้ำเงิน หรือสีเหลือง แล้วหาคำศัพท์สีใต้ช่องที่ตรงกับสีที่ระบาย'],
        ['"\\"ทีนี้ระบายสีลูกโป่ง What color is it? (สีอะไร) หาคำนั้นแล้วลากเส้นตาม\\""', '"\\"ทีนี้วาดสิ่งของแล้วระบายสี What color is it? (สีอะไร) หาคำนั้นแล้วลากเส้นตาม\\""'],
        ['เด็ก ๆ ระบายสีลูกโป่ง แล้วหาคำศัพท์สีและลากเส้นตาม', 'เด็ก ๆ วาดสิ่งของ 1 อย่างและระบายสี แล้วหาคำศัพท์สีและลากเส้นตาม'],
        ['ชี้ที่ลูกโป่งแล้วถามว่า', 'ชี้ที่ภาพแล้วถามว่า'],
    
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['  "print": {\n    "letterBox": {',
         '  "print": {\n    "checkRows": {\n      "trickyWord": "get",\n      "blendWord": "pan"\n    },\n    "letterBox": {'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"Collect the books and mark the check."\n            ]',
         '"Collect the books and mark the check.",\n              "While the class does the written rows, the teacher calls one child at a time for row 8 and row 9 and ticks the box when the child is right."\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ"\n            ]',
         '"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ",\n              "ขณะที่ชั้นเรียนทำแถวที่ต้องเขียน ครูเรียกเด็กมาทีละคนเพื่อทำแถว 8 และแถว 9 แล้วขีดถูกเมื่อเด็กทำถูก"\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"Now write the letter p. Then write the word pan.\\""\n            ]',
         '"\\"Now write the letter p. Then write the word pan.\\"",\n              "\\"Row 8: Read this word: get.\\"",\n              "\\"Row 9: /p/ /a/ /n/. What is the word?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"ทีนี้เขียนตัวอักษร p แล้วเขียนคำ pan\\""\n            ]',
         '"\\"ทีนี้เขียนตัวอักษร p แล้วเขียนคำ pan\\"",\n              "\\"แถว 8: อ่านคำนี้: get\\"",\n              "\\"แถว 9: /p/ /a/ /n/. คำนี้คือคำอะไร?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['[Verse]\\nLook at the apple. It is red!\\nLook at the sky. It is blue!\\n\\n[Chorus]\\nPaint, paint, paint! What color is it?\\nIt is red! It is blue! It is yellow, too!\\n\\n[Verse]\\nLook at the sun. It is yellow!\\nLook at the tree. It is green!\\n\\n[Chorus]\\nPaint, paint, paint! What color is it?\\nIt is red! It is blue! It is yellow, too!\\n\\n[Verse]\\nLook at the grape. It is purple!\\nLook at the flower. It is pink!\\n\\n[Chorus]\\nPaint, paint, paint! What color is it?\\nIt is red! It is blue! It is yellow, too!\\n\\n[Chorus]\\nPaint, paint, paint! What color is it?\\nIt is red! It is blue! It is yellow, too!',
         '[Verse]\\nLook at the apple. It is red!\\nLook at the sky. It is blue!\\n\\n[Chorus]\\nPaint, paint, paint! What color is it?\\nIt is red! It is blue! It is yellow, too!\\n\\n[Verse]\\nLook at the sun. It is yellow!\\nLook at the tree. It is green!\\n\\n[Chorus]\\nPaint, paint, paint! What color is it?\\nIt is red! It is blue! It is yellow, too!\\n\\n[Verse]\\nLook at the grape. It is purple!\\nLook at the flower. It is pink!\\n\\n[Chorus]\\nPaint, paint, paint! What color is it?\\nIt is red! It is blue! It is yellow, too!\\n\\n[Chorus]'],
        ['"Pairs take turns, page by page."', '"Pairs take turns, page by page.",\n              "Each child colors their own book."'],
        ['"คู่ผลัดกันอ่านทีละหน้า"', '"คู่ผลัดกันอ่านทีละหน้า",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"The Pan\\""\n          ]', '{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"The Pan\\"",\n            "crayons"\n          ]'],
        ['{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "books (one for each pair): \\"The Pan\\""\n          ]', '{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"The Pan\\""\n          ]'],
        ['{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "books (one for each pair): \\"The Pan\\""\n          ]', '{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"The Pan\\""\n          ]'],
        ['"books (one for each pair): \\"The Pan\\"",', '"small books (each child\'s own): \\"The Pan\\"",'],
        ['"books (one for each pair): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\", \\"Paint!\\", \\"The Pan\\"",', '"small books (each child\'s own): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\", \\"Paint!\\", \\"The Pan\\"",'],
        ['"Children read \\"Paint!\\" together, then in pairs."', '"Children read \\"Paint!\\" together, then in pairs.",\n              "Each child colors the pictures in their own Paint! book with the color that each page names."'],
        ['"เด็ก ๆ อ่าน \\"Paint!\\" พร้อมกัน แล้วอ่านเป็นคู่"', '"เด็ก ๆ อ่าน \\"Paint!\\" พร้อมกัน แล้วอ่านเป็นคู่",\n              "เด็ก ๆ ระบายสีภาพในหนังสือเล่มเล็ก \\"Paint!\\" ของตัวเอง ด้วยสีที่เขียนไว้ในแต่ละหน้า"'],
        ['"Give out the class set of \\"Paint!\\" (Sprout band)."', '"Children take out their own small books."'],
        ['"แจกหนังสือ \\"Paint!\\" ชุดสำหรับทั้งชั้น (ระดับ Sprout)"', '"เด็ก ๆ หยิบหนังสือเล่มเล็กของตัวเองออกมา"'],
        ['{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"Paint!\\""\n          ]', '{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Paint!\\" (Sprout band)",\n            "crayons"\n          ]'],
        ['    "thai": {\n      "status": "approved",\n      "date": "2026-10-22",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 80"\n    },', '    "thai": {\n      "status": "approved",\n      "date": "2026-11-05",\n      "words": "\\"Approved\\" (2026-11-05 21:4x ICT; the 3 color-own-book Thai lines)",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 80 (2026-10-22); PM relay of 2026-11-05 (owner answer on the color-own-book Thai lines, ~/Desktop/handoff/storytime-color-own-book/lines-2026-11-05.md)"\n    },'],
    ],
    4: [['with me: am. Man.', 'with me: Am. Man.'], ['Read the words: am. Man.', 'Read the words: Am. Man.'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['  "print": {\n    "letterBox": {',
         '  "print": {\n    "checkRows": {\n      "trickyWord": "is",\n      "blendWord": "jam"\n    },\n    "letterBox": {'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"Collect the books and mark the check."\n            ]',
         '"Collect the books and mark the check.",\n              "While the class does the written rows, the teacher calls one child at a time for row 8 and row 9 and ticks the box when the child is right."\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ"\n            ]',
         '"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ",\n              "ขณะที่ชั้นเรียนทำแถวที่ต้องเขียน ครูเรียกเด็กมาทีละคนเพื่อทำแถว 8 และแถว 9 แล้วขีดถูกเมื่อเด็กทำถูก"\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"Now write the letter m. Then write the word map.\\""\n            ]',
         '"\\"Now write the letter m. Then write the word map.\\"",\n              "\\"Row 8: Read this word: is.\\"",\n              "\\"Row 9: /j/ /a/ /m/. What is the word?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"ทีนี้เขียนตัวอักษร m แล้วเขียนคำ map\\""\n            ]',
         '"\\"ทีนี้เขียนตัวอักษร m แล้วเขียนคำ map\\"",\n              "\\"แถว 8: อ่านคำนี้: is\\"",\n              "\\"แถว 9: /j/ /a/ /m/. คำนี้คือคำอะไร?\\""\n            ]'],
        ['"Pairs take turns, page by page."', '"Pairs take turns, page by page.",\n              "Each child colors their own book."'],
        ['"คู่ผลัดกันอ่านทีละหน้า"', '"คู่ผลัดกันอ่านทีละหน้า",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"Pam\\""\n          ]', '{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Pam\\"",\n            "crayons"\n          ]'],
        ['{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "books (one for each pair): \\"Pam\\""\n          ]', '{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Pam\\""\n          ]'],
        ['{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "books (one for each pair): \\"Pam\\""\n          ]', '{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Pam\\""\n          ]'],
        ['"books (one for each pair): \\"Pam\\"",', '"small books (each child\'s own): \\"Pam\\"",'],
        ['"books (one for each pair): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\", \\"Paint!\\", \\"The Pan\\", \\"My Family\\", \\"Pam\\"",', '"small books (each child\'s own): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\", \\"Paint!\\", \\"The Pan\\", \\"My Family\\", \\"Pam\\"",'],
        ['"Children read \\"My Family\\" together, then in pairs."', '"Children read \\"My Family\\" together, then in pairs.",\n              "Each child colors their own book."'],
        ['"เด็ก ๆ อ่าน \\"My Family\\" พร้อมกัน แล้วอ่านเป็นคู่"', '"เด็ก ๆ อ่าน \\"My Family\\" พร้อมกัน แล้วอ่านเป็นคู่",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['"Give out the class set of \\"My Family\\" (Sprout band)."', '"Children take out their own small books."'],
        ['"แจกหนังสือ \\"My Family\\" ชุดสำหรับทั้งชั้น (ระดับ Sprout)"', '"เด็ก ๆ หยิบหนังสือเล่มเล็กของตัวเองออกมา"'],
        ['{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"My Family\\""\n          ]', '{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"My Family\\" (Sprout band)",\n            "crayons"\n          ]'],
        ['    "thai": {\n      "status": "approved",\n      "date": "2026-10-22",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 80"\n    },', '    "thai": {\n      "status": "approved",\n      "date": "2026-11-05",\n      "words": "\\"Approved\\" (2026-11-05 21:4x ICT; the 3 color-own-book Thai lines)",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 80 (2026-10-22); PM relay of 2026-11-05 (owner answer on the color-own-book Thai lines, ~/Desktop/handoff/storytime-color-own-book/lines-2026-11-05.md)"\n    },'],
    ],
    5: [['        "feet",\n        "nose"\n      ]', '        "feet",\n        "one",\n        "nose",\n        "four"\n      ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['  "print": {\n    "letterBox": {',
         '  "print": {\n    "checkRows": {\n      "trickyWord": "off",\n      "blendWord": "sad"\n    },\n    "letterBox": {'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"Collect the books and mark the check."\n            ]',
         '"Collect the books and mark the check.",\n              "While the class does the written rows, the teacher calls one child at a time for row 8 and row 9 and ticks the box when the child is right."\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ"\n            ]',
         '"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ",\n              "ขณะที่ชั้นเรียนทำแถวที่ต้องเขียน ครูเรียกเด็กมาทีละคนเพื่อทำแถว 8 และแถว 9 แล้วขีดถูกเมื่อเด็กทำถูก"\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"Now write the letter s. Then write the word Sam, with a big letter S.\\""\n            ]',
         '"\\"Now write the letter s. Then write the word Sam, with a big letter S.\\"",\n              "\\"Row 8: Read this word: off.\\"",\n              "\\"Row 9: /s/ /a/ /d/. What is the word?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"ทีนี้เขียนตัวอักษร s แล้วเขียนคำ Sam โดยใช้ S ตัวพิมพ์ใหญ่\\""\n            ]',
         '"\\"ทีนี้เขียนตัวอักษร s แล้วเขียนคำ Sam โดยใช้ S ตัวพิมพ์ใหญ่\\"",\n              "\\"แถว 8: อ่านคำนี้: off\\"",\n              "\\"แถว 9: /s/ /a/ /d/. คำนี้คือคำอะไร?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['[Verse]\\nI have two eyes. Look, look, look!\\nI have two ears. Listen, listen!\\n\\n[Chorus]\\nSam, Sam, Sam! Look at me!\\nI have two hands and I have two feet!\\n\\n[Verse]\\nI have two hands. Clap, clap, clap!\\nI have two feet. Stamp, stamp, stamp!\\n\\n[Chorus]\\nSam, Sam, Sam! Look at me!\\nI have two hands and I have two feet!\\n\\n[Verse]\\nI have two arms. Reach up high!\\nI have two legs. Hop, hop, hop!\\n\\n[Chorus]\\nSam, Sam, Sam! Look at me!\\nI have two hands and I have two feet!\\n\\n[Chorus]\\nSam, Sam, Sam! Look at me!\\nI have two hands and I have two feet!',
         '[Verse]\\nI have two eyes. Look, look, look!\\nI have two ears. Listen, listen!\\nI have two eyes. Look, look, look!\\nI have two ears. Listen, listen!\\n\\n[Chorus]\\nSam, Sam, Sam! Look at me!\\nI have two hands and I have two feet!\\n\\n[Verse]\\nI have two hands. Clap, clap, clap!\\nI have two feet. Stamp, stamp, stamp!\\n\\n[Chorus]\\nSam, Sam, Sam! Look at me!\\nI have two hands and I have two feet!\\n\\n[Verse]\\nI have two arms. Reach up high!\\nI have two legs. Hop, hop, hop!\\n\\n[Chorus]\\nSam, Sam, Sam! Look at me!\\nI have two hands and I have two feet!\\nSam, Sam, Sam! Look at me!\\nI have two hands and I have two feet!\\n\\n[Chorus]'],
        ['"Pairs take turns, page by page."', '"Pairs take turns, page by page.",\n              "Each child colors their own book."'],
        ['"คู่ผลัดกันอ่านทีละหน้า"', '"คู่ผลัดกันอ่านทีละหน้า",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"Sam and Pam\\""\n          ]', '{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Sam and Pam\\"",\n            "crayons"\n          ]'],
        ['{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "books (one for each pair): \\"Sam and Pam\\""\n          ]', '{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Sam and Pam\\""\n          ]'],
        ['{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "books (one for each pair): \\"Sam and Pam\\""\n          ]', '{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Sam and Pam\\""\n          ]'],
        ['"books (one for each pair): \\"Sam and Pam\\"",', '"small books (each child\'s own): \\"Sam and Pam\\"",'],
        ['"books (one for each pair): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\", \\"Paint!\\", \\"The Pan\\", \\"My Family\\", \\"Pam\\", \\"I Have Two\\", \\"Sam and Pam\\"",', '"small books (each child\'s own): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\", \\"Paint!\\", \\"The Pan\\", \\"My Family\\", \\"Pam\\", \\"I Have Two\\", \\"Sam and Pam\\"",'],
        ['"Children read \\"I Have Two\\" together, then in pairs."', '"Children read \\"I Have Two\\" together, then in pairs.",\n              "Each child colors their own book."'],
        ['"เด็ก ๆ อ่าน \\"I Have Two\\" พร้อมกัน แล้วอ่านเป็นคู่"', '"เด็ก ๆ อ่าน \\"I Have Two\\" พร้อมกัน แล้วอ่านเป็นคู่",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['"Give out the class set of \\"I Have Two\\" (Sprout band)."', '"Children take out their own small books."'],
        ['"แจกหนังสือ \\"I Have Two\\" ชุดสำหรับทั้งชั้น (ระดับ Sprout)"', '"เด็ก ๆ หยิบหนังสือเล่มเล็กของตัวเองออกมา"'],
        ['{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"I Have Two\\""\n          ]', '{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"I Have Two\\" (Sprout band)",\n            "crayons"\n          ]'],
        ['    "thai": {\n      "status": "approved",\n      "date": "2026-10-22",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 82"\n    },', '    "thai": {\n      "status": "approved",\n      "date": "2026-11-05",\n      "words": "\\"Approved\\" (2026-11-05 21:4x ICT; the 3 color-own-book Thai lines)",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 82 (2026-10-22); PM relay of 2026-11-05 (owner answer on the color-own-book Thai lines, ~/Desktop/handoff/storytime-color-own-book/lines-2026-11-05.md)"\n    },'],
    ],
    6: [['with me: sat. Mat.', 'with me: Sat. Mat.'], ['Read the words: sat. Mat.', 'Read the words: Sat. Mat.'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['  "print": {\n    "letterBox": {',
         '  "print": {\n    "checkRows": {\n      "trickyWord": "he",\n      "blendWord": "ten"\n    },\n    "letterBox": {'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"Collect the books and mark the check."\n            ]',
         '"Collect the books and mark the check.",\n              "While the class does the written rows, the teacher calls one child at a time for row 8 and row 9 and ticks the box when the child is right."\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ"\n            ]',
         '"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ",\n              "ขณะที่ชั้นเรียนทำแถวที่ต้องเขียน ครูเรียกเด็กมาทีละคนเพื่อทำแถว 8 และแถว 9 แล้วขีดถูกเมื่อเด็กทำถูก"\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"Now write the letter t. Then write the word sat.\\""\n            ]',
         '"\\"Now write the letter t. Then write the word sat.\\"",\n              "\\"Row 8: Read this word: he.\\"",\n              "\\"Row 9: /t/ /e/ /n/. What is the word?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"ทีนี้เขียนตัวอักษร t แล้วเขียนคำ sat\\""\n            ]',
         '"\\"ทีนี้เขียนตัวอักษร t แล้วเขียนคำ sat\\"",\n              "\\"แถว 8: อ่านคำนี้: he\\"",\n              "\\"แถว 9: /t/ /e/ /n/. คำนี้คือคำอะไร?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['[Verse]\\nI can see a cat. Meow, meow!\\nI can see a dog. Woof, woof!\\n\\n[Chorus]\\nTap, tap, tap! Look and see!\\nWhat can you see? I can see an animal!\\n\\n[Verse]\\nI can see a bird. Tweet, tweet!\\nI can see a fish. Swim, swim!\\n\\n[Chorus]\\nTap, tap, tap! Look and see!\\nWhat can you see? I can see an animal!\\n\\n[Verse]\\nI can see a frog. Hop, hop!\\nI can see a duck. Quack, quack!\\n\\n[Chorus]\\nTap, tap, tap! Look and see!\\nWhat can you see? I can see an animal!\\n\\n[Chorus]\\nTap, tap, tap! Look and see!\\nWhat can you see? I can see an animal!',
         '[Verse]\\nI can see a cat. Meow, meow!\\nI can see a dog. Woof, woof!\\n\\n[Chorus]\\nTap, tap, tap! Look and see!\\nWhat can you see? I can see an animal! (What can you see? I can see an animal!)\\n\\n[Verse]\\nI can see a bird. Tweet, tweet!\\nI can see a fish. Swim, swim!\\n\\n[Chorus]\\nTap, tap, tap! Look and see!\\nWhat can you see? I can see an animal! (What can you see? I can see an animal!)\\n\\n[Verse]\\nI can see a frog. Hop, hop!\\nI can see a duck. Quack, quack!\\n\\n[Chorus]\\nTap, tap, tap! Look and see!\\nWhat can you see? I can see an animal!\\n\\n[Chorus]'],
        ['"Pairs take turns, page by page."', '"Pairs take turns, page by page.",\n              "Each child colors their own book."'],
        ['"คู่ผลัดกันอ่านทีละหน้า"', '"คู่ผลัดกันอ่านทีละหน้า",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"Tap, Tap!\\""\n          ]', '{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Tap, Tap!\\"",\n            "crayons"\n          ]'],
        ['{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "books (one for each pair): \\"Tap, Tap!\\""\n          ]', '{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Tap, Tap!\\""\n          ]'],
        ['{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "books (one for each pair): \\"Tap, Tap!\\""\n          ]', '{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Tap, Tap!\\""\n          ]'],
        ['"books (one for each pair): \\"Tap, Tap!\\"",', '"small books (each child\'s own): \\"Tap, Tap!\\"",'],
        ['"books (one for each pair): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\", \\"Paint!\\", \\"The Pan\\", \\"My Family\\", \\"Pam\\", \\"I Have Two\\", \\"Sam and Pam\\", \\"I Can See\\", \\"Tap, Tap!\\"",', '"small books (each child\'s own): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\", \\"Paint!\\", \\"The Pan\\", \\"My Family\\", \\"Pam\\", \\"I Have Two\\", \\"Sam and Pam\\", \\"I Can See\\", \\"Tap, Tap!\\"",'],
        ['"Children read \\"I Can See\\" together, then in pairs."', '"Children read \\"I Can See\\" together, then in pairs.",\n              "Each child colors their own book."'],
        ['"เด็ก ๆ อ่าน \\"I Can See\\" พร้อมกัน แล้วอ่านเป็นคู่"', '"เด็ก ๆ อ่าน \\"I Can See\\" พร้อมกัน แล้วอ่านเป็นคู่",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['"Give out the class set of \\"I Can See\\" (Sprout band)."', '"Children take out their own small books."'],
        ['"แจกหนังสือ \\"I Can See\\" ชุดสำหรับทั้งชั้น (ระดับ Sprout)"', '"เด็ก ๆ หยิบหนังสือเล่มเล็กของตัวเองออกมา"'],
        ['{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"I Can See\\""\n          ]', '{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"I Can See\\" (Sprout band)",\n            "crayons"\n          ]'],
        ['    "thai": {\n      "status": "approved",\n      "date": "2026-10-22",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 82"\n    },', '    "thai": {\n      "status": "approved",\n      "date": "2026-11-05",\n      "words": "\\"Approved\\" (2026-11-05 21:4x ICT; the 3 color-own-book Thai lines)",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 82 (2026-10-22); PM relay of 2026-11-05 (owner answer on the color-own-book Thai lines, ~/Desktop/handoff/storytime-color-own-book/lines-2026-11-05.md)"\n    },'],
    ],
    7: [
        ['"pen",\n          "bus",\n          "olive"\n        ],\n        "answer": "olive"', '"pen",\n          "bus",\n          "ostrich"\n        ],\n        "answer": "ostrich"'],
        ['Row 3: pen, bus, olive. Which', 'Row 3: pen, bus, ostrich. Which'],
        ['แถว 3: pen, bus, olive คำไหน', 'แถว 3: pen, bus, ostrich คำไหน'],
        ['with me: on. Top.', 'with me: On. Top.'], ['Read the words: on. Top.', 'Read the words: On. Top.']
    ,
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['  "print": {\n    "letterBox": {',
         '  "print": {\n    "checkRows": {\n      "trickyWord": "from",\n      "blendWord": "pot"\n    },\n    "letterBox": {'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"Collect the books and mark the check."\n            ]',
         '"Collect the books and mark the check.",\n              "While the class does the written rows, the teacher calls one child at a time for row 8 and row 9 and ticks the box when the child is right."\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ"\n            ]',
         '"เก็บหนังสือ แล้วตรวจหน้าตรวจสอบ",\n              "ขณะที่ชั้นเรียนทำแถวที่ต้องเขียน ครูเรียกเด็กมาทีละคนเพื่อทำแถว 8 และแถว 9 แล้วขีดถูกเมื่อเด็กทำถูก"\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"Now write the letter o. Then write the word top.\\""\n            ]',
         '"\\"Now write the letter o. Then write the word top.\\"",\n              "\\"Row 8: Read this word: from.\\"",\n              "\\"Row 9: /p/ /o/ /t/. What is the word?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['"\\"ทีนี้เขียนตัวอักษร o แล้วเขียนคำ top\\""\n            ]',
         '"\\"ทีนี้เขียนตัวอักษร o แล้วเขียนคำ top\\"",\n              "\\"แถว 8: อ่านคำนี้: from\\"",\n              "\\"แถว 9: /p/ /o/ /t/. คำนี้คือคำอะไร?\\""\n            ]'],
        // v15, A-48 part F (PM decisions of 2026-11-05)
        ['[Chorus]\\nLook in the box! Knock, knock, knock!\\nIs it a toy? Yes, yes, yes!\\n\\n[Verse]\\nIs it a ball? No, no, no!\\nIs it a doll? No, no, no!\\n\\n[Chorus]\\nLook in the box! Knock, knock, knock!\\nIs it a toy? Yes, yes, yes!\\n\\n[Verse]\\nIs it a car? No, no, no!\\nIs it a kite? No, no, no!\\n\\n[Chorus]\\nLook in the box! Knock, knock, knock!\\nIs it a toy? Yes, yes, yes!\\n\\n[Verse]\\nIs it a drum? No, no, no!\\nIs it a train? No, no, no!\\n\\n[Verse]\\nIs it a top? Yes, yes, yes!\\nTop in the box! Yes, yes, yes!',
         '[Chorus]\\nLook in the box! Knock, knock, knock!\\nIs it a toy? Yes, yes, yes!\\n\\n[Verse]\\nIs it a ball? No, no, no!\\nIs it a doll? No, no, no!\\n\\n[Chorus]\\nLook in the box! Knock, knock, knock!\\nIs it a toy? Yes, yes, yes!\\n\\n[Verse]\\nIs it a car? No, no, no!\\nIs it a kite? No, no, no!\\n\\n[Chorus]\\nLook in the box! Knock, knock, knock!\\nIs it a toy? Yes, yes, yes!\\n\\n[Verse]\\nIs it a drum? No, no, no!\\nIs it a train? No, no, no!\\nIs it a top? Yes, yes, yes!\\nTop in the box!\\n\\n[Verse]'],
        ['"Pairs take turns, page by page."', '"Pairs take turns, page by page.",\n              "Each child colors their own book."'],
        ['"คู่ผลัดกันอ่านทีละหน้า"', '"คู่ผลัดกันอ่านทีละหน้า",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"The Top\\""\n          ]', '{\n            "en": "Pairs; the teacher sits with one pair.",\n            "th": "ทำเป็นคู่ ครูนั่งกับ 1 คู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"The Top\\"",\n            "crayons"\n          ]'],
        ['{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "books (one for each pair): \\"The Top\\""\n          ]', '{\n            "en": "Pairs ask each other one question.",\n            "th": "ทำเป็นคู่: ผลัดกันถามคำถามคนละ 1 ข้อ"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"The Top\\""\n          ]'],
        ['{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "books (one for each pair): \\"The Top\\""\n          ]', '{\n            "en": "Whole class.",\n            "th": "ทั้งชั้น"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"The Top\\""\n          ]'],
        ['"books (one for each pair): \\"The Top\\"",', '"small books (each child\'s own): \\"The Top\\"",'],
        ['"books (one for each pair): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\", \\"Paint!\\", \\"The Pan\\", \\"My Family\\", \\"Pam\\", \\"I Have Two\\", \\"Sam and Pam\\", \\"I Can See\\", \\"Tap, Tap!\\", \\"Is It a Ball?\\", \\"The Top\\"",', '"small books (each child\'s own): \\"Hello!\\", \\"Nan Can Nod\\", \\"How Many?\\", \\"Can I?\\", \\"Paint!\\", \\"The Pan\\", \\"My Family\\", \\"Pam\\", \\"I Have Two\\", \\"Sam and Pam\\", \\"I Can See\\", \\"Tap, Tap!\\", \\"Is It a Ball?\\", \\"The Top\\"",'],
        ['"Children read \\"Is It a Ball?\\" together, then in pairs."', '"Children read \\"Is It a Ball?\\" together, then in pairs.",\n              "Each child colors their own book."'],
        ['"เด็ก ๆ อ่าน \\"Is It a Ball?\\" พร้อมกัน แล้วอ่านเป็นคู่"', '"เด็ก ๆ อ่าน \\"Is It a Ball?\\" พร้อมกัน แล้วอ่านเป็นคู่",\n              "เด็ก ๆ ระบายสีหนังสือเล่มเล็กของตัวเอง"'],
        ['"Give out the class set of \\"Is It a Ball?\\" (Sprout band)."', '"Children take out their own small books."'],
        ['"แจกหนังสือ \\"Is It a Ball?\\" ชุดสำหรับทั้งชั้น (ระดับ Sprout)"', '"เด็ก ๆ หยิบหนังสือเล่มเล็กของตัวเองออกมา"'],
        ['{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "books (one for each pair): \\"Is It a Ball?\\""\n          ]', '{\n            "en": "Pairs.",\n            "th": "ทำเป็นคู่"\n          },\n          "materials": [\n            "small books (each child\'s own): \\"Is It a Ball?\\" (Sprout band)",\n            "crayons"\n          ]'],
        ['    "thai": {\n      "status": "approved",\n      "date": "2026-10-22",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 82"\n    },', '    "thai": {\n      "status": "approved",\n      "date": "2026-11-05",\n      "words": "\\"Approved\\" (2026-11-05 21:4x ICT; the 3 color-own-book Thai lines)",\n      "source": "reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line 82 (2026-10-22); PM relay of 2026-11-05 (owner answer on the color-own-book Thai lines, ~/Desktop/handoff/storytime-color-own-book/lines-2026-11-05.md)"\n    },'],
    ],
};

/** The week file at the baseline commit, with the A-48 script edits. A failed `git show` fails the test. */
function baselineRaw(n: number): Raw {
    const file = `content/storytime/l2/w0${n}.json`;
    try {
        let raw = execFileSync('git', ['show', `${BASELINE_COMMIT}:${file}`], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
        for (const [from, to] of A48_SCRIPT_EDITS[n] ?? []) {
            if (raw.split(from).length !== 2) throw new Error(`the A-48 edit "${from}" does not match once in the baseline of w0${n}`);
            raw = raw.replace(from, () => to);
        }
        return JSON.parse(raw);
    } catch (error) {
        throw new Error(`git show ${BASELINE_COMMIT}:${file} failed: ${(error as Error).message}`);
    }
}

let weeksCache: StorytimeWeek[] | undefined;
/** The eight parsed shipped weeks of Level 2, in week order. */
function shippedWeeks(): StorytimeWeek[] {
    if (!weeksCache) {
        const read = readLevelWeeks(STORYTIME_ROOT, 2);
        const failed = read.filter((w) => !w.week);
        expect(failed.map((w) => `${w.file}: ${w.error}`), 'every shipped week parses').toEqual([]);
        weeksCache = read.map((w) => w.week!);
    }
    return weeksCache;
}
const shippedWeek = (n: number): StorytimeWeek => shippedWeeks().find((w) => w.meta.week === n)!;

/** The six (or two) loop checks of a shipped week, run the way `check-weeks.ts` runs them. */
function loopReport(n: number) {
    const known = shippedWeeks();
    const week = shippedWeek(n);
    const report = checkStorytimeWeek(week, taughtTo(known, week), undefined, known);
    return report.checks.filter((c) => c.id.startsWith('loops-'));
}

/** The words of a line. Punctuation is not a word; "don't" is one word. */
function wordCount(line: string): number {
    return (line.match(/[A-Za-z0-9]+(?:['’][A-Za-z]+)?/g) ?? []).length;
}

/** Sorts the keys of every object, recursively. The order of arrays stays. */
function sortKeys(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys((value as Raw)[k])]));
    return value;
}

/**
 * The week without the FR-1 fields, without the two keys of the print track, without the two media approvals, and without the
 * Phase 3b share moment of each script. Both sides of the additive compare go through this function. `dropTh` is a mutant: a
 * deleter that also removes the Thai notes.
 */
function withoutNewFields(week: Raw, dropTh = false): Raw {
    const copy = structuredClone(week);
    for (const script of copy.scripts) {
        delete script.recall;
        // The parent-share moment of Phase 3b (FR-14) is additive content: both sides of the compare lose it (AC-14.5).
        delete script.share;
        for (const step of script.steps) {
            delete step.blendDrill;
            delete step.soundLoop;
            delete step.sightWords;
            delete step.loopMinutes;
            if (dropTh) delete step.th;
        }
    }
    for (const book of copy.books ?? []) {
        delete book.questions;
        // The app word clips of the book words are Phase 11 media, not loops content (Phase 11, K15).
        delete book.audio?.wordClips;
        // The sentence clips of the decodable books are Phase 12 media, not loops content (Phase 12, L7).
        delete book.audio?.sentenceClips;
        // The app picture paths of the book covers and pages are media paths, not loops content.
        delete book.cover?.file;
        for (const page of book.pages ?? []) delete page.image?.file;
    }
    // The app picture paths of the family words are media paths, not loops content (Phase 10, E8).
    for (const word of copy.focus?.family?.words ?? []) delete word.image?.file;
    // The word clips of the opening words, the family words, and the tricky words are Phase 12 media (Phase 12, L3).
    delete copy.opening?.wordClips;
    delete copy.focus?.family?.wordClips;
    delete copy.focus?.trickyWordClips;
    if (copy.approval) {
        delete copy.approval.loops;
        delete copy.approval.print;
        // Daniel approved the w01 audio and song on 2026-11-04, after the baseline commit; the media approvals are not loops content.
        delete copy.approval.audio;
        delete copy.approval.song;
        // The owner approved the images of weeks 2 to 7 on 2026-11-05, after the baseline commit; the media approvals are not loops content.
        delete copy.approval.images;
    }
    delete copy.print;
    // The song video lead-in is the Phase 11 media of the song video (Phase 11, K15).
    delete copy.song?.videoLeadInSeconds;
    return copy;
}

const P14_PATHS: Record<number, string[]> = {
    1: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.harder', 'scripts.2.steps.1.harder', 'tags.taught', 'opening.wordClips'],
    2: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'tags.taught', 'opening.wordClips'],
    3: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'scripts.0.steps.3.en.teacherActions', 'scripts.0.steps.3.th.teacherActions', 'scripts.0.steps.4.harder', 'tags.reviewed', 'opening.wordClips'],
    4: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'tags.reviewed', 'opening.wordClips'],
    5: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'scripts.0.steps.4.harder', 'scripts.0.steps.0.en.watchFor', 'scripts.0.steps.0.th.watchFor', 'scripts.4.steps.0.en.teacherActions', 'scripts.4.steps.0.th.teacherActions', 'scripts.4.steps.0.materials', 'scripts.4.steps.1.en.teacherActions', 'scripts.4.steps.1.th.teacherActions', 'scripts.4.steps.1.materials', 'tags.reviewed', 'opening.wordClips'],
    6: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'scripts.0.steps.4.harder', 'scripts.0.steps.0.en.watchFor', 'scripts.0.steps.0.th.watchFor', 'scripts.0.steps.3.en.teacherActions', 'scripts.0.steps.3.th.teacherActions', 'scripts.0.steps.3.en.watchFor', 'scripts.0.steps.3.th.watchFor', 'scripts.4.steps.0.en.teacherActions', 'scripts.4.steps.0.th.teacherActions', 'scripts.4.steps.0.materials', 'scripts.4.steps.1.en.teacherActions', 'scripts.4.steps.1.th.teacherActions', 'scripts.4.steps.1.materials', 'tags.reviewed', 'opening.wordClips'],
    7: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'scripts.0.steps.4.harder', 'scripts.4.steps.0.en.teacherActions', 'scripts.4.steps.0.th.teacherActions', 'scripts.4.steps.0.materials', 'scripts.4.steps.1.en.teacherActions', 'scripts.4.steps.1.th.teacherActions', 'scripts.4.steps.1.materials', 'tags.reviewed', 'opening.wordClips'],
    8: ['focus.paSkill', 'focus.paStage', 'opening.pa.2', 'opening.pa.4', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'benchmark.paper.items.4', 'benchmark.paper.items.5', 'benchmark.paper.items.6', 'benchmark.paper.items.7', 'tags.reviewed'],
};

const P14_ENGLISH: Record<number, string[]> = {
    1: ['the first sound n; blend three sounds by ear', '"Listen: hello. Say it with me: hello! Listen: goodbye. Say it with me: goodbye!"', '"Listen: nest. What is the first sound? Nnn! Listen: nose. What is the first sound? Nnn!"', 'A child says the first sound alone: "Net. Nnn!" Then the next child: "Nut. Nnn!"', 'Add two more words, nut and dog. Children push the card into the first box for nut only.'],
    2: ['the first sound /a/; blend three sounds by ear', '"Listen: nose. What is the first sound? Nnn! Listen: net. What is the first sound? Nnn!"', '"Listen: apple. What is the first sound? /a/! Listen: ant. What is the first sound? /a/!"', 'Mix the /a/ words with other words.', '"Listen. Ant. Does ant start with /a/? Yes!"', 'A child says the first sound alone: "Axe. /a/!" Then the next child: "Astronaut. /a/!"'],
    3: ['the first sound /p/; blend three sounds by ear', '"Listen: ant. What is the first sound? /a/! Listen: net. What is the first sound? Nnn!"', '"Listen: pen. What is the first sound? /p/! Listen: pear. What is the first sound? /p/!"', 'Mix the /p/ words with other words.', '"Listen. Pear. Does pear start with /p/? Yes!"', 'A child says the first sound alone: "Pencil. /p/!" Then the next child: "Pineapple. /p/!"', 'Show the word card "nap". Hold nnn, and say /p/ as a short puff.', 'A child reads one word on the wall alone, then says its first sound.'],
    4: ['the first sound mmm; blend three sounds by ear', '"Listen: pan. What is the first sound? /p/! Listen: apple. What is the first sound? /a/!"', '"Listen: milk. What is the first sound? Mmm! Listen: mango. What is the first sound? Mmm!"', 'Mix the mmm words with other words.', '"Listen. Mouse. Does mouse start with mmm? Yes!"', 'A child says the first sound alone: "Mango. Mmm!" Then the next child: "Milk. Mmm!"'],
    5: ['the first sound sss; blend three sounds by ear', '"Listen: map. What is the first sound? Mmm! Listen: pan. What is the first sound? /p/!"', '"Listen: sun. What is the first sound? Sss! Listen: sock. What is the first sound? Sss!"', 'Mix the sss words with other words.', '"Listen. Sock. Does sock start with sss? Yes!"', 'A child says the first sound alone: "Sofa. Sss!" Then the next child: "Sandwich. Sss!"', 'A child reads one word on the wall alone, then says its first sound.', 'Hold up each sound picture card and say the word with the class: sun, sock, sofa, sandwich.', 'sound picture cards: sun, sock, sofa, sandwich', 'Groups work at their center. Picture sort: sort the picture cards into "sss at the start" and "not sss". Letter cards: build the words "Sam" and "map", and read them. Book corner: read the ten books of weeks 1 to 5. Karaoke corner: sing with the karaoke videos on the tablet, with the sound low.', 'sorting mat: sss / not sss'],
    6: ['the first sound /t/; blend three sounds by ear', '"Listen: see. What is the first sound? Sss! Listen: map. What is the first sound? Mmm!"', '"Listen: tiger. What is the first sound? /t/! Listen: ten. What is the first sound? /t/!"', 'Mix the /t/ words with other words.', '"Listen. Table. Does table start with /t/? Yes!"', 'A child says the first sound alone: "Tomato. /t/!" Then the next child: "Ten. /t/!"', 'A child reads one word on the wall alone, then says its first sound.', 'Children who stop a word with no release at the end ("ca" for "cat"): let the tongue go with a small puff of air at the end.', 'Hold up each sound picture card and say the word with the class: tiger, ten, table, tomato.', 'Groups work at their center. Picture sort: sort the picture cards into "/t/ at the start" and "not /t/". Letter cards: build the words "sat" and "tap", and read them. Book corner: read the twelve books of weeks 1 to 6. Karaoke corner: sing with the karaoke videos on the tablet, with the sound low.', 'sorting mat: /t/ / not /t/'],
    7: ['the first sound /o/; blend three sounds by ear', '"Listen: teddy. What is the first sound? /t/! Listen: see. What is the first sound? Sss!"', '"Listen: octopus. What is the first sound? /o/! Listen: ox. What is the first sound? /o/!"', 'Mix the /o/ words with other words.', '"Listen. Ostrich. Does ostrich start with /o/? Yes!"', 'A child says the first sound alone: "Otter. /o/!" Then the next child: "Ox. /o/!"', 'A child reads one word on the wall alone, then says its first sound.', 'Hold up each sound picture card and say the word with the class: octopus, ox, ostrich, otter.', 'Groups work at their center. Picture sort: sort the picture cards into "/o/ at the start" and "not /o/". Letter cards: build the words "top" and "pot", and read them. Book corner: read the fourteen books of weeks 1 to 7. Karaoke corner: sing with the karaoke videos on the tablet, with the sound low.', 'sorting mat: /o/ / not /o/'],
    8: ['the mixed sound game over the seven sounds: first sounds and blends by ear', '"Listen: sun. What is the first sound? Sss! Listen: /t/ - /a/ - /p/. What is the word? Tap!"', '"Listen: ten. What is the first sound? /t/! Listen: mmm - /o/ - mmm. What is the word? Mom!"', 'Rows 1 to 8: say the three pictures of the row two times, then the sound. Children circle the picture that starts with the sound.', '"Row 5: drum, ten, fish. Which one starts with /t/? Circle it."'],
};


/**
 * The Phase 14 alignment of the additive compare (Red retry R1, D-R1-2): at each changed path of the change
 * list, both sides take the shipped value, so the compare allows the P14 edits and any other change still
 * fails. A path that the shipped week does not hold fails the test.
 */
function p14Align(week: Raw, shipped: Raw, n: number): Raw {
    const copy = structuredClone(week);
    for (const path of P14_PATHS[n]) {
        const shippedValue = path.split('.').reduce<unknown>((node, key) => (node == null ? undefined : (node as Record<string, unknown>)[key]), shipped);
        if (shippedValue === undefined) throw new Error(`the Phase 14 path ${path} is missing in the shipped w0${n}`);
        const parts = path.split('.');
        const parent = parts.slice(0, -1).reduce<Record<string, unknown>>((node, key) => node[key] as Record<string, unknown>, copy);
        parent[parts[parts.length - 1]] = structuredClone(shippedValue);
    }
    return copy;
}

/** Every string of a value, for the English-only check of the change list (no Thai string is written here). */
function stringsOf(value: unknown, out: Set<string>): Set<string> {
    if (typeof value === 'string') out.add(value);
    else if (Array.isArray(value)) for (const item of value) stringsOf(item, out);
    else if (value && typeof value === 'object') for (const item of Object.values(value)) stringsOf(item, out);
    return out;
}

const normalize = (week: Raw, dropTh = false): string => JSON.stringify(sortKeys(withoutNewFields(week, dropTh)));
const parsed = (raw: Raw): Raw => StorytimeWeekSchema.parse(raw);

/** Every new `BiText` of a week, with its place. */
function newBiTexts(week: StorytimeWeek): { where: string; bi: { en: string; th: string } }[] {
    const out: { where: string; bi: { en: string; th: string } }[] = [];
    for (const script of week.scripts) {
        if (script.recall) out.push({ where: `${script.id} recall.ask`, bi: script.recall.ask });
        for (const step of script.steps) {
            const d = step.blendDrill;
            if (d) for (const k of ['model', 'lead', 'test', 'correction'] as const) out.push({ where: `${step.id} blendDrill.${k}`, bi: d[k] });
            const s = step.soundLoop;
            if (s) for (const k of ['correct', 'practise', 'retest'] as const) out.push({ where: `${step.id} soundLoop.${k}`, bi: s[k] });
            const w = step.sightWords;
            if (w) for (const k of ['slide', 'check'] as const) out.push({ where: `${step.id} sightWords.${k}`, bi: w[k] });
        }
    }
    for (const book of week.books) for (const q of book.questions ?? []) out.push({ where: `${book.title} ${q.kind}.ask`, bi: q.ask });
    return out;
}

const stepsOf = (week: StorytimeWeek) => week.scripts.flatMap((s) => s.steps);

describe('the content test itself', () => {
    it('counts words: "don\'t" is one word, punctuation is not a word, and 13 words are more than 12', () => {
        expect(wordCount("Don't slide, stop!")).toBe(3);
        expect(wordCount('One two three four five six seven eight nine ten eleven twelve')).toBe(12);
        expect(wordCount('One two three four five six seven eight nine ten eleven twelve thirteen')).toBe(13);
    });

    it('compares the baseline with itself and finds a real change (falsifiers on copies)', () => {
        const base = parsed(baselineRaw(1));
        const same = normalize(base);
        const mutate = (change: (w: Raw) => void) => {
            const copy = structuredClone(base);
            change(copy);
            return copy;
        };
        const thaiStep = (w: Raw) => w.scripts[0].steps[0];
        expect(normalize(structuredClone(base))).toBe(same);
        expect(normalize(mutate((w) => (thaiStep(w).th.teacherActions[0] = 'X' + thaiStep(w).th.teacherActions[0].slice(1)))), 'one Thai character').not.toBe(same);
        expect(normalize(mutate((w) => thaiStep(w).en.teacherActions.pop())), 'one deleted line').not.toBe(same);
        expect(normalize(mutate((w) => (thaiStep(w).minutes += 1))), 'one minutes value').not.toBe(same);
        expect(normalize(mutate((w) => w.scripts[0].steps.reverse())), 'two steps reordered').not.toBe(same);
        expect(normalize(mutate((w) => thaiStep(w).th.teacherActions.reverse())), 'a Thai array reordered').not.toBe(same);
        const keysReordered = Object.fromEntries(Object.entries(structuredClone(base)).reverse());
        expect(normalize(keysReordered), 'a key reorder alone').toBe(same);
        // A deleter that also removes `th` cannot see the Thai change: the real deleter must.
        const thaiChanged = mutate((w) => (thaiStep(w).th.teacherActions[0] = 'X' + thaiStep(w).th.teacherActions[0].slice(1)));
        expect(normalize(thaiChanged, true)).toBe(normalize(base, true));
        expect(normalize(thaiChanged)).not.toBe(same);
    });

    it('has the loop checks at the status fail', () => {
        expect(LOOP_CHECK_STATUS).toBe('fail');
    });

    it('ignores the share moment in the compare, and still sees a change next to a share', () => {
        const base = parsed(baselineRaw(1));
        const same = normalize(base);
        const withShare = (w: Raw) => {
            w.scripts[0].share = { shots: [{ step: 'A3', media: 'video' }], caption: { en: 'A caption of the test.', th: 'คำบรรยายของการทดสอบ' } };
            return w;
        };
        // The share moment is additive (FR-14, AC-14.5): the compare must not see it.
        expect(normalize(withShare(structuredClone(base))), 'a copy with only an added share').toBe(same);
        // A change of an existing line next to the share must still fail the compare.
        const changed = withShare(structuredClone(base));
        const step = changed.scripts[0].steps[0];
        step.en.teacherActions[0] = 'X' + step.en.teacherActions[0].slice(1);
        expect(normalize(changed), 'a changed existing line next to a share').not.toBe(same);
    });
});

for (const n of WEEK_NUMBERS) {
    const name = `w0${n}`;
    const teach = n !== 8;

    describe(`${name} content`, () => {
        it(`${name} adds only the FR-1 fields to its baseline file (additive, spec D10)`, () => {
            const shipped = shippedRaw(n);
            expect(normalize(p14Align(parsed(shipped), shipped, n))).toBe(normalize(p14Align(parsed(baselineRaw(n)), shipped, n)));
            const strings = stringsOf(shipped, new Set<string>());
            for (const value of P14_ENGLISH[n]) expect(strings.has(value), `the English new value of w0${n}: ${value}`).toBe(true);
        });

        it(`${name} passes ${teach ? 'the six loop checks' : 'loops-recall and loops-minutes'} with the status pass`, () => {
            const checks = loopReport(n);
            expect(checks.map((c) => c.id)).toEqual(teach ? SIX_CHECKS : REVIEW_CHECKS);
            expect(checks.filter((c) => c.status !== 'pass').map((c) => `${c.id}: ${c.status} ${c.detail ?? ''}`)).toEqual([]);
        });

        it(`${name} gives every new line English and Thai`, () => {
            const lines = newBiTexts(shippedWeek(n));
            expect(lines.length, 'the week has new lines').toBeGreaterThan(0);
            expect(lines.filter((l) => !l.bi.en.trim() || !l.bi.th.trim() || !THAI.test(l.bi.th)).map((l) => l.where)).toEqual([]);
        });

        it(`${name} fills each day to the period with loopMinutes, and only the seven loop steps change`, () => {
            const week = shippedWeek(n);
            const base = parsed(baselineRaw(n));
            expect(week.meta.periodMinutes).toBe(30);
            const baseMinutes = new Map<string, number>(stepsOf(base).map((s: Raw) => [s.id, s.minutes]));
            for (const script of week.scripts) {
                const sum = script.steps.filter((s) => !s.moved).reduce((total, s) => total + (s.loopMinutes ?? s.minutes), 0);
                expect(week.meta.openingMinutes + sum, `${script.id} day ${script.day}`).toBe(week.meta.periodMinutes);
            }
            for (const step of stepsOf(week)) {
                expect(step.minutes, `${step.id} keeps its minutes`).toBe(baseMinutes.get(step.id));
                const minutes = step.loopMinutes ?? step.minutes;
                if (!LOOP_STEP_IDS.includes(step.id)) expect(minutes, `${step.id} is not a loop step`).toBe(step.minutes);
                else if (!step.moved && teach) expect(minutes, `${step.id} has 2 minutes or more`).toBeGreaterThanOrEqual(2);
            }
            // C5 and D2 are the only loop steps of their days: their minutes stay at the baseline value.
            for (const id of teach ? ['C5', 'D2'] : []) {
                const step = stepsOf(week).find((s) => s.id === id)!;
                expect(step.loopMinutes ?? step.minutes, `${id} stays at the baseline`).toBe(baseMinutes.get(id));
            }
        });

        if (teach) {
            it(`${name} takes the loop minutes from the donors A4 and A6 of day 1 (spec Terms, D8)`, () => {
                const steps = stepsOf(shippedWeek(n));
                for (const id of ['A4', 'A6']) {
                    const step = steps.find((s) => s.id === id)!;
                    expect(step.loopMinutes, `${id} loopMinutes`).toBeDefined();
                    expect(step.loopMinutes!, `${id} gives at least one minute`).toBeLessThan(step.minutes);
                }
            });
        }

        it(`${name} repeats only short lines in class (12 words or less)`, () => {
            const long: string[] = [];
            for (const step of stepsOf(shippedWeek(n))) {
                const lines = [step.blendDrill?.lead, step.blendDrill?.test, step.sightWords?.slide, step.sightWords?.check];
                for (const line of lines) if (line && wordCount(line.en) > 12) long.push(`${step.id}: ${line.en}`);
            }
            expect(long).toEqual([]);
        });

        it(`${name} says a pure sound and never a letter name in the new English lines`, () => {
            const bad = newBiTexts(shippedWeek(n)).filter((l) => LETTER_NAME_WORDS.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(l.bi.en)));
            expect(bad.map((l) => `${l.where}: ${l.bi.en}`)).toEqual([]);
        });

        it(`${name} keeps approval.loops draft, or approved with the words and the date`, () => {
            const loops = shippedWeek(n).approval.loops;
            expect(loops, 'the part exists').toBeDefined();
            expect(['draft', 'approved']).toContain(loops!.status);
            if (loops!.status === 'approved') {
                expect(loops!.words?.trim()).toBeTruthy();
                expect(loops!.date).toBeTruthy();
            }
        });

        it(`${name} puts the recall cards in every script (day 1 of week 1 has none), copied from existing strip cards`, () => {
            const week = shippedWeek(n);
            const pool = new Set(
                shippedWeeks()
                    .filter((w) => w.meta.week <= n)
                    .flatMap((w) => w.review.flatMap((strip) => strip.cards.map((c) => JSON.stringify([c.kind, c.text, c.week, c.audio ?? null])))),
            );
            // A frame card of the current week may have no strip card on every day; it still equals the focus frame.
            const frames = new Set(shippedWeeks().filter((w) => w.meta.week <= n).map((w) => w.focus.frame));
            for (const script of week.scripts) {
                if (n === 1 && script.day === 1) {
                    expect(script.recall, 'day 1 of week 1 has no recall').toBeUndefined();
                    continue;
                }
                expect(script.recall?.items.length, `${script.id} recall items`).toBe(5);
                const unknown = script.recall!.items.filter((c) => !pool.has(JSON.stringify([c.kind, c.text, c.week, c.audio ?? null])) && !(c.kind === 'frame' && frames.has(c.text)));
                expect(unknown.map((c) => `${script.id}: ${c.kind} ${c.text}`), 'every recall card exists in a strip').toEqual([]);
            }
        });

        if (teach) {
            it(`${name} puts a sound loop on A1, A2, and A3 that models the pure sound again`, () => {
                const week = shippedWeek(n);
                expect(stepsOf(week).filter((s) => s.soundLoop).map((s) => s.id)).toEqual(['A1', 'A2', 'A3']);
                for (const step of stepsOf(week).filter((s) => s.soundLoop)) {
                    expect(step.soundLoop!.correct.en.toLowerCase(), `${step.id} correct line`).toContain(WEEK_SOUND[n]);
                }
            });

            it(`${name} puts the blend drill on A4 only, with 3 repeats and a recording for each sound`, () => {
                const week = shippedWeek(n);
                expect(stepsOf(week).filter((s) => s.blendDrill).map((s) => s.id)).toEqual(['A4']);
                const drill = stepsOf(week).find((s) => s.id === 'A4')!.blendDrill!;
                expect(drill.repeats).toBe(3);
                expect(drill.words.length).toBeGreaterThanOrEqual(3);
                for (const w of drill.words) {
                    expect(w.sounds.every((s) => /^\/[a-z-]+\/$/.test(s)), `${w.word} sounds are written as /x/`).toBe(true);
                    expect(w.audio?.length, `${w.word} has one recording for each sound`).toBe(w.sounds.length);
                }
                const bank = readPhonemeBank();
                expect(bank, 'the phoneme bank exists').toBeDefined();
                expect(phonemeAudioFields(week, bank!).unresolved, 'every drill sound is in the bank').toEqual([]);
                expect(phonemeAudioProblems(week, bank!), 'the drill recordings match the bank').toEqual([]);
            });

            it(`${name} puts the sight words on A6 and D2 only when the week has tricky words, 3 seconds each`, () => {
                const week = shippedWeek(n);
                const holders = stepsOf(week).filter((s) => s.sightWords).map((s) => s.id);
                if (!week.focus.trickyWords.length) {
                    expect(holders).toEqual([]);
                    return;
                }
                expect(holders).toEqual(['A6', 'D2']);
                for (const step of stepsOf(week).filter((s) => s.sightWords)) {
                    const sight = step.sightWords!;
                    expect(sight.words, `${step.id} words`).toEqual(week.focus.trickyWords);
                    expect(sight.seconds).toBe(3);
                    expect(sight.slide.en, `${step.id} slide line`).toMatch(/slide/i);
                    expect(sight.slide.en, `${step.id} slide line`).toMatch(/finger/i);
                    expect(sight.slide.en, `${step.id} slide line`).toMatch(/read it the fast way/i);
                    expect(sight.check.en, `${step.id} check line names the seconds`).toContain(String(sight.seconds));
                }
            });

            it(`${name} asks who, what, and where about the read-along, with an answer on a page`, () => {
                const week = shippedWeek(n);
                const readAlong = week.books.find((b) => b.kind === 'readalong')!;
                expect(readAlong.questions?.map((q) => q.kind)).toEqual(['who', 'what', 'where']);
                for (const q of readAlong.questions!) {
                    expect(q.answer.page, `${q.kind} page`).toBeGreaterThanOrEqual(1);
                    expect(q.answer.page, `${q.kind} page`).toBeLessThanOrEqual(readAlong.pages.length);
                    const text = readAlong.pages[q.answer.page - 1].text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
                    expect(text, `${q.kind} word on its page`).toContain(q.answer.word.toLowerCase());
                }
                for (const book of week.books.filter((b) => b !== readAlong)) expect(book.questions, 'the decodable has no questions').toBeUndefined();
            });
        } else {
            it(`${name} has the recall and nothing else (the review week, spec D11)`, () => {
                const week = shippedWeek(n);
                for (const step of stepsOf(week)) {
                    expect(step.blendDrill, step.id).toBeUndefined();
                    expect(step.soundLoop, step.id).toBeUndefined();
                    expect(step.sightWords, step.id).toBeUndefined();
                    expect(step.loopMinutes ?? step.minutes, `${step.id} minutes`).toBe(step.minutes);
                }
                for (const book of week.books) expect(book.questions).toBeUndefined();
                expect(week.scripts.map((s) => s.recall?.items.length)).toEqual([5, 5, 5, 5, 5]);
            });
        }
    });
}
