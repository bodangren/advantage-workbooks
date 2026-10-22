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
};

/**
 * The Storytime labels of a manual language.
 * @param lang The manual language.
 * @returns The labels.
 */
export function storytimeLabels(lang: SupportedLanguage): StorytimeLabels {
    return lang === 'th' ? th : en;
}
