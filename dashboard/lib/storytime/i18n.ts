import type { SupportedLanguage } from '../teacher-manual/i18n';

/**
 * The labels of the Storytime teacher book (track storytime_week_package_20261022). The four step
 * headings come from the Primary manual i18n (pinned, read only). The Thai here is a draft until
 * Daniel checks it.
 */
export interface StorytimeLabels {
    product: string;
    badge: string;
    subtitle: string;
    grades: Record<number, string>;
    level: (level: number, grade: string) => string;
    week: (week: number) => string;
    reviewWeek: string;
    day: (day: number) => string;
    script: (id: string, title: string) => string;
    minutes: (n: number) => string;
    thisWeek: string;
    element: string;
    paSkill: string;
    frame: string;
    family: string;
    tricky: string;
    readAlong: string;
    decodable: string;
    song: string;
    homeLine: string;
    materials: string;
    opening: (minutes: number, recall: number) => string;
    prep: string;
    songActions: (title: string) => string;
    lyricLine: string;
    action: string;
    parts: Record<'verse' | 'chorus', string>;
    songStart: string;
    songEnd: string;
    /** Thai names of the 24 gestures, printed after the English name (empty in English). */
    gestures: Record<string, string>;
    openingSteps: string[];
    /** Opening item 2 when the week has a sound game line for the day (it replaces the calendar). */
    soundGame: (line: string) => string;
    strip: string;
    noCards: string;
    cardKinds: Record<'sound' | 'tricky' | 'frame' | 'word', string>;
    recall: string;
    nextOpening: string;
    easier: string;
    harder: string;
    group: string;
    /** Review weeks (design §3.5). */
    block: string;
    weeksList: (weeks: number[]) => string;
    dayPlan: string;
    benchmark: string;
    /** Opening item 3 in a review week: the two karaoke videos of the day. */
    medley: (titles: string) => string;
    paperPart: (minutes: number) => string;
    pictureItem: Record<'first' | 'middle' | 'last', (sound: string) => string>;
    circleWord: string;
    pictureSort: Record<'first' | 'middle' | 'last', string>;
    reviewPages: string;
    reviewPage: (day: number) => string;
    writeLetterFor: (sound: string) => string;
    writeLetter: (letter: string) => string;
    writeWord: (word: string) => string;
    answer: string;
    pass: string;
    oneToOne: (minutes: number) => string;
    letterStrip: (pass: number, of: number) => string;
    soundCards: (pass: number, of: number) => string;
    blendWords: (pass: number, of: number) => string;
    readingRecord: (minutes: number, pass: number) => string;
    recordSheet: string;
    recordColumns: { no: string; name: string; letters: string; sounds: string; blend: string; pictures: string; written: string; book: string; accuracy: string; date: string };
    readingForm: (title: string, week: number) => string;
    formChild: string;
    formDate: string;
    formMarks: string;
    formTotals: string[];
}

const en: StorytimeLabels = {
    product: 'Storytime Advantage',
    badge: "Teacher's Book",
    subtitle: 'Five scripts a week, one a day',
    grades: { 1: 'Anuban 2', 2: 'Anuban 3', 3: 'P1', 4: 'P2' },
    level: (level, grade) => `Level ${level} (${grade})`,
    week: (week) => `Week ${week}`,
    reviewWeek: 'Review week',
    day: (day) => `Day ${day}`,
    script: (id, title) => `Script ${id}: ${title}`,
    minutes: (n) => `${n} min`,
    thisWeek: 'This week',
    element: 'Sound of the week',
    paSkill: 'Listening for sounds',
    frame: 'Sentence frame',
    family: 'Picture words',
    tricky: 'New tricky words',
    readAlong: 'Read-along book',
    decodable: 'Decodable book',
    song: 'Song',
    homeLine: 'Home card',
    materials: 'Materials',
    opening: (minutes, recall) => `Opening routine (${minutes} min${recall ? `, incl. ${recall} min recall` : ''})`,
    prep: 'Before this lesson',
    songActions: (title) => `Song actions: ${title}`,
    lyricLine: 'Line',
    action: 'Action',
    parts: { verse: 'Verse', chorus: 'Chorus' },
    songStart: 'Start',
    songEnd: 'End',
    gestures: {},
    soundGame: (line) => `Sound game (1 min): ${line}`,
    openingSteps: [
        'Greeting song and call-and-response: "Hello, Sprouts!" "Hello, Teacher ___!"',
        'Calendar: the day and the weather. One child points.',
        'Song of the week with the actions.',
        'Review strip: read the cards of the day (below).',
    ],
    strip: 'Review strip',
    noCards: 'No review cards today.',
    cardKinds: { sound: 'Sounds', tricky: 'Tricky words', frame: 'Frame', word: 'Words' },
    recall: 'Recall from the last lesson (1 min each, inside the opening: the routine is shorter on these days)',
    nextOpening: 'At the next opening (1 min each)',
    easier: 'Easier',
    harder: 'Harder',
    group: 'Group',
    block: 'Block',
    weeksList: (weeks) => `${weeks.length === 1 ? 'week' : 'weeks'} ${weeks.join(', ')}`,
    dayPlan: 'Day plan',
    benchmark: 'Benchmark',
    medley: (titles) => `Song medley (2 min): ${titles}.`,
    paperPart: (minutes) => `Paper part, whole class (${minutes} min)`,
    pictureItem: {
        first: (sound) => `Circle the picture with ${sound} at the start`,
        middle: (sound) => `Circle the picture with ${sound} in the middle`,
        last: (sound) => `Circle the picture with ${sound} at the end`,
    },
    circleWord: 'Circle the word that I say',
    pictureSort: { first: 'Sort the pictures by the first sound', middle: 'Sort the pictures by the middle sound', last: 'Sort the pictures by the last sound' },
    reviewPages: 'Review pages: answer key (the paper center)',
    reviewPage: (day) => `Review page ${day} (day ${day})`,
    writeLetterFor: (sound) => `Write the letter for ${sound}`,
    writeLetter: (letter) => `Write the letter ${letter}`,
    writeWord: (word) => `Write the word ${word}`,
    answer: 'answer',
    pass: 'Pass',
    oneToOne: (minutes) => `One to one, at the check table (${minutes} min)`,
    letterStrip: (pass, of) => `Letter strip: the child says the name of each letter (pass: ${pass} of ${of})`,
    soundCards: (pass, of) => `Sound cards: the child says the sound of each letter (pass: ${pass} of ${of})`,
    blendWords: (pass, of) => `Blend by ear: say the sounds; the child says the word (pass: ${pass} of ${of})`,
    readingRecord: (minutes, pass) =>
        `Reading record (${minutes} min): the child reads one decodable as far as possible in ${minutes} min. Mark each error and each self-correction. Accuracy = words correct ÷ words read × 100. Pass: ${pass} percent.`,
    recordSheet: 'Class record sheet',
    recordColumns: { no: 'No.', name: 'Name', letters: 'Letter names', sounds: 'Sounds', blend: 'Blend', pictures: 'Paper: pictures', written: 'Paper: letters', book: 'Book', accuracy: 'Accuracy %', date: 'Date' },
    readingForm: (title, week) => `Reading record: "${title}" (week ${week})`,
    formChild: 'Child',
    formDate: 'Date',
    formMarks: 'Under each word: a tick for a correct word, a line for an error, and SC for a self-correction.',
    formTotals: ['Words read', 'Errors', 'Self-corrections', 'Accuracy %'],
};

const th: StorytimeLabels = {
    product: 'Storytime Advantage',
    badge: 'คู่มือครู',
    subtitle: 'บทสอนสัปดาห์ละห้าบท วันละหนึ่งบท',
    grades: { 1: 'อนุบาล 2', 2: 'อนุบาล 3', 3: 'ป.1', 4: 'ป.2' },
    level: (level, grade) => `ระดับ ${level} (${grade})`,
    week: (week) => `สัปดาห์ที่ ${week}`,
    reviewWeek: 'สัปดาห์ทบทวน',
    day: (day) => `วันที่ ${day}`,
    script: (id, title) => `บทสอน ${id}: ${title}`,
    minutes: (n) => `${n} นาที`,
    thisWeek: 'สัปดาห์นี้',
    element: 'เสียงประจำสัปดาห์',
    paSkill: 'การฟังแยกเสียง',
    frame: 'กรอบประโยค',
    family: 'คำศัพท์ประจำหมวด',
    tricky: 'คำที่ต้องจำชุดใหม่',
    readAlong: 'หนังสืออ่านตาม',
    decodable: 'หนังสือฝึกสะกดอ่าน',
    song: 'เพลง',
    homeLine: 'บัตรกิจกรรมที่บ้าน',
    materials: 'สื่อการสอน',
    opening: (minutes, recall) => `กิจวัตรเปิดคาบ (${minutes} นาที${recall ? ` รวมทบทวน ${recall} นาที` : ''})`,
    prep: 'ก่อนเริ่มคาบ',
    songActions: (title) => `ท่าทางประกอบเพลง: ${title}`,
    lyricLine: 'เนื้อเพลง',
    action: 'ท่าทาง',
    parts: { verse: 'ท่อนเวิร์ส', chorus: 'ท่อนฮุก' },
    songStart: 'เริ่มเพลง',
    songEnd: 'จบเพลง',
    gestures: {
        'clap': 'ปรบมือ',
        'stamp': 'กระทืบเท้า',
        'point up': 'ชี้ขึ้นข้างบน',
        'point to self': 'ชี้ที่ตัวเอง',
        'wave': 'โบกมือ',
        'reach': 'เอื้อมมือ',
        'hop': 'กระโดดขาเดียว',
        'turn': 'หมุนตัว',
        'sway': 'โยกตัว',
        'hands on head': 'วางมือบนหัว',
        'stretch up': 'ยืดตัวขึ้น',
        'crouch': 'ย่อตัวลง',
        'nod': 'พยักหน้า',
        'shake head': 'ส่ายหน้า',
        'count fingers': 'นับนิ้ว',
        'point forward': 'ชี้ไปข้างหน้า',
        'hands out': 'กางแขนแบมือ',
        'hug self': 'กอดตัวเอง',
        'march': 'ย่ำเท้าอยู่กับที่',
        'sleep': 'ทำท่านอนหลับ',
        'eat': 'ทำท่ากิน',
        'look': 'ป้องตามอง',
        'listen': 'ป้องหูฟัง',
        'bow': 'โค้งคำนับ',
    },
    soundGame: (line) => `เกมเสียง (1 นาที): ${line}`,
    openingSteps: [
        'ร้องเพลงทักทายและพูดโต้ตอบ: "Hello, Sprouts!" "Hello, Teacher ___!"',
        'ปฏิทิน: วันและสภาพอากาศ ให้เด็กหนึ่งคนชี้',
        'ร้องเพลงประจำสัปดาห์พร้อมท่าทาง',
        'แถบทบทวน: อ่านบัตรของวันนี้ (ด้านล่าง)',
    ],
    strip: 'แถบทบทวน',
    noCards: 'วันนี้ไม่มีบัตรทบทวน',
    cardKinds: { sound: 'เสียง', tricky: 'คำที่ต้องจำ', frame: 'กรอบประโยค', word: 'คำ' },
    recall: 'ทบทวนจากคาบที่แล้ว (ข้อละ 1 นาที อยู่ในช่วงเปิดคาบ: วันที่มีการทบทวน ให้ย่อกิจวัตรเปิดคาบให้สั้นลง)',
    nextOpening: 'ทำในช่วงเปิดคาบครั้งถัดไป (ข้อละ 1 นาที)',
    easier: 'ง่ายขึ้น',
    harder: 'ท้าทายขึ้น',
    group: 'คู่หรือกลุ่ม',
    block: 'ช่วงที่ทบทวน',
    weeksList: (weeks) => `สัปดาห์ที่ ${weeks.join(', ')}`,
    dayPlan: 'แผนรายวัน',
    benchmark: 'การประเมิน',
    medley: (titles) => `เพลงรวม (2 นาที): ${titles}`,
    paperPart: (minutes) => `แบบทดสอบบนกระดาษ ทั้งชั้น (${minutes} นาที)`,
    pictureItem: {
        first: (sound) => `วงกลมภาพที่มีเสียง ${sound} ที่ต้นคำ`,
        middle: (sound) => `วงกลมภาพที่มีเสียง ${sound} กลางคำ`,
        last: (sound) => `วงกลมภาพที่มีเสียง ${sound} ท้ายคำ`,
    },
    circleWord: 'วงกลมคำที่ครูพูด',
    pictureSort: { first: 'แยกภาพตามเสียงแรก', middle: 'แยกภาพตามเสียงกลางคำ', last: 'แยกภาพตามเสียงท้ายคำ' },
    reviewPages: 'หน้าทบทวน: เฉลย (มุมใบงาน)',
    reviewPage: (day) => `หน้าทบทวน ${day} (วันที่ ${day})`,
    writeLetterFor: (sound) => `เขียนตัวอักษรของเสียง ${sound}`,
    writeLetter: (letter) => `เขียนตัวอักษร ${letter}`,
    writeWord: (word) => `เขียนคำ ${word}`,
    answer: 'คำตอบ',
    pass: 'เกณฑ์ผ่าน',
    oneToOne: (minutes) => `ประเมินรายบุคคลที่โต๊ะประเมิน (${minutes} นาที)`,
    letterStrip: (pass, of) => `แถบตัวอักษร: เด็กบอกชื่อตัวอักษรทีละตัว (ผ่าน: ${pass} จาก ${of})`,
    soundCards: (pass, of) => `บัตรเสียง: เด็กออกเสียงของตัวอักษรทีละใบ (ผ่าน: ${pass} จาก ${of})`,
    blendWords: (pass, of) => `ฟังแล้วผสมเสียง: ครูพูดเสียงทีละเสียง เด็กบอกคำ (ผ่าน: ${pass} จาก ${of})`,
    readingRecord: (minutes, pass) =>
        `บันทึกการอ่าน (${minutes} นาที): เด็กอ่านหนังสือฝึกสะกดอ่าน 1 เล่มให้ได้มากที่สุดใน ${minutes} นาที ครูทำเครื่องหมายทุกคำที่อ่านผิดและทุกคำที่เด็กแก้เองได้ ความแม่นยำ = จำนวนคำที่อ่านถูก ÷ จำนวนคำที่อ่าน × 100 เกณฑ์ผ่าน: ร้อยละ ${pass}`,
    recordSheet: 'แบบบันทึกผลทั้งชั้น',
    recordColumns: { no: 'ที่', name: 'ชื่อ', letters: 'ชื่อตัวอักษร', sounds: 'เสียง', blend: 'ผสมเสียง', pictures: 'กระดาษ: ภาพ', written: 'กระดาษ: ตัวอักษร', book: 'หนังสือ', accuracy: 'ความแม่นยำ %', date: 'วันที่' },
    readingForm: (title, week) => `บันทึกการอ่าน: "${title}" (สัปดาห์ที่ ${week})`,
    formChild: 'ชื่อเด็ก',
    formDate: 'วันที่',
    formMarks: 'ใต้แต่ละคำ: ทำเครื่องหมายถูกเมื่ออ่านถูก ขีดเส้นเมื่ออ่านผิด และเขียน SC เมื่อเด็กแก้เองได้',
    formTotals: ['จำนวนคำที่อ่าน', 'อ่านผิด', 'แก้เองได้', 'ความแม่นยำ %'],
};

/**
 * The Storytime labels of a manual language.
 * @param lang The manual language.
 * @returns The labels.
 */
export function storytimeLabels(lang: SupportedLanguage): StorytimeLabels {
    return lang === 'th' ? th : en;
}
