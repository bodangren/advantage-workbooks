import fs from 'fs';
import path from 'path';
import type { SupportedLanguage } from './i18n';

/**
 * The manual section "The Primary Advantage app" (track teacher_manual_app_20261020): what the teacher
 * presses in the new app, in the order of the PR teacher picture guide (advantage-pr
 * `assets/docs/primary-advantage-guides/teacher-guide-th.html`): sign in, find the class, start the
 * class, the lesson of the day, homework, and the class sheet and QR cards. The facts and the Thai
 * labels come from advantage-pr `measure/tracks/boonyathat_start_kit_20261020/facts.md` (monorepo
 * master beb904102). A word in “ ” is the word on the screen. The text is not in the pinned i18n
 * files, so the app's lesson-guide import does not read it.
 */

/** A marked screenshot: a file of `assets/teacher-manual/app/` (scripts/teacher-manual/mark-captures.ts), or a placeholder. */
export interface AppScreen {
    /** The screen id (the JPEG name), or null for a placeholder. */
    id: string | null;
    caption: string;
    /** The placeholder text while the JPEG does not exist yet (a screen after an app fix, before the retake). */
    pending?: string;
}

/** One part of the section: a heading, numbered steps, screens, and notes in boxes. */
export interface AppPart {
    /** The parts that change with an app fix (AppVariant). */
    id?: 'signin' | 'class-sheet';
    heading: string;
    intro?: string;
    /** Notes to read before the steps (a warning, or the meanings of English screen words). */
    before?: { title: string; text: string }[];
    steps: string[];
    screens: AppScreen[];
    notes: { title: string; text: string }[];
}

export interface AppSectionText {
    heading: string;
    intro: string[];
    prepareTitle: string;
    prepare: string[];
    parts: AppPart[];
    stepMapTitle: string;
    stepMapIntro: string;
    stepMapHead: [string, string, string];
    /** The app name of each of the 14 app steps (monorepo `Lesson.tasks`). */
    appSteps: string[];
    noAppStep: string;
    /** The QR codes and the old app tasks on the printed pages (Monorepo check, 2026-10-20). */
    bookNoteTitle: string;
    bookNote: string;
    helpTitle: string;
    help: string;
}

/** The 13 printed steps of the workbook (as printed, in English) and their app steps (monorepo `step-map.ts`). */
export const STEP_MAP: { step: number; title: string; appSteps: number[] }[] = [
    { step: 1, title: 'Before You Read', appSteps: [1] },
    { step: 2, title: 'Key Vocabulary', appSteps: [2] },
    { step: 3, title: 'Read the Article', appSteps: [3] },
    { step: 4, title: 'Collect Vocabulary', appSteps: [4] },
    { step: 5, title: 'Deep Reading Notes', appSteps: [5] },
    { step: 6, title: 'Collect Sentences', appSteps: [6] },
    { step: 7, title: 'Comprehension Check', appSteps: [7] },
    { step: 8, title: 'Guided Response', appSteps: [8] },
    { step: 9, title: 'Vocabulary Practice', appSteps: [9, 10] },
    { step: 10, title: 'Sentence Practice', appSteps: [11, 12] },
    { step: 11, title: 'Guided Writing', appSteps: [] },
    { step: 12, title: 'Language Questions', appSteps: [13] },
    { step: 13, title: 'Lesson Reflection', appSteps: [14] },
];

const th: AppSectionText = {
    heading: 'แอป Primary Advantage: ครูใช้อย่างไร',
    intro: [
        'หนังสือเรียนเล่มนี้ใช้คู่กับแอป Primary Advantage แบบใหม่ บทนี้บอกว่าครูกดอะไรในแอป ทีละขั้น ตามลำดับเดียวกับ “คู่มือครูฉบับภาพ”',
        'ภาพทุกภาพมาจากแอปจริงและใช้ข้อมูลทดสอบ ตัวเลขในภาพตรงกับตัวเลขในข้อความ คำในเครื่องหมาย “ ” ตรงกับคำบนหน้าจอ',
    ],
    prepareTitle: 'สิ่งที่ต้องเตรียม',
    prepare: [
        'คอมพิวเตอร์ที่ต่อกับโปรเจกเตอร์',
        'อีเมลและรหัสผ่านที่โรงเรียนให้',
        'หนังสือเรียนของนักเรียน',
    ],
    parts: [
        {
            id: 'signin',
            heading: '1. เข้าสู่ระบบ',
            intro: 'ครูเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน ปุ่ม Google ไม่มีแล้ว',
            before: [
                { title: 'คำบนฟอร์มเป็นภาษาอังกฤษ', text: 'ตอนนี้คำบนฟอร์มเข้าสู่ระบบของครูยังเป็นภาษาอังกฤษ: Username = ชื่อผู้ใช้ · Password = รหัสผ่าน · Login = เข้าสู่ระบบ · New password = รหัสผ่านใหม่ · Type the new password again = พิมพ์รหัสผ่านใหม่อีกครั้ง · Save and sign in = บันทึกและเข้าสู่ระบบ' },
            ],
            steps: [
                'เปิด primary.reading-advantage.com',
                'กดแท็บ “ครู” (1) หน้าเข้าสู่ระบบเปิดแท็บ “นักเรียน” ไว้ก่อนเสมอ',
                'ในช่องชื่อผู้ใช้ (2) พิมพ์อีเมลของคุณ ในช่องรหัสผ่าน (3) พิมพ์รหัสผ่าน แล้วกดปุ่มเข้าสู่ระบบ (4)',
                'เข้าสู่ระบบครั้งแรก: ใช้รหัสผ่านชั่วคราวที่โรงเรียนให้ แอปเปิดหน้าตั้งรหัสผ่านใหม่ พิมพ์รหัสผ่านใหม่ (1) พิมพ์อีกครั้ง (2) แล้วกดปุ่มบันทึกและเข้าสู่ระบบ (3)',
            ],
            screens: [
                { id: 'signin-teacher-tab', caption: 'หน้าเข้าสู่ระบบ แท็บครู' },
                { id: 'signin-new-password', caption: 'หน้าตั้งรหัสผ่านใหม่ (เข้าสู่ระบบครั้งแรก)' },
            ],
            notes: [
                { title: 'รหัสผ่านใหม่', text: 'มีอย่างน้อย 8 ตัวอักษร และต้องไม่ซ้ำกับรหัสผ่านชั่วคราว หลังจากนี้ รหัสผ่านชั่วคราวใช้ไม่ได้อีก' },
                { title: 'ลืมรหัสผ่าน', text: 'ติดต่อผู้ดูแลระบบของโรงเรียน เพื่อขอรหัสผ่านใหม่' },
            ],
        },
        {
            heading: '2. หาชั้นเรียนของคุณ',
            intro: 'หลังเข้าสู่ระบบ แอปเปิด “หน้าหลัก” ของครู',
            steps: [
                'ที่เมนูด้านซ้าย กด “ชั้นเรียนของฉัน” (1)',
                'กดชื่อชั้นเรียนในตาราง (2) แอปเปิดหน้าชั้นเรียน',
            ],
            screens: [{ id: 'teacher-menu', caption: 'ชั้นเรียนของฉัน' }],
            notes: [
                { title: 'เมนูของครู', text: '“หน้าหลัก” “ชั้นเรียนของฉัน” “นักเรียนของฉัน” “รายงาน” “งานที่กำหนด” “คู่มือครู”' },
                { title: 'ทางลัดบนหน้าหลัก', text: 'ในตารางชั้นเรียนบนหน้าหลัก ลิงก์ “เริ่มชั้นเรียน” เปิดหน้าชั้นเรียนให้ แต่ยังไม่เริ่มชั้นเรียน บนหน้าชั้นเรียน ครูกด “เริ่มชั้นเรียน” อีกครั้ง (ข้อ 3)' },
            ],
        },
        {
            heading: '3. เปิดชั้นเรียนให้นักเรียนเข้าสู่ระบบ',
            intro: 'นักเรียนเข้าสู่ระบบด้วยรหัส 6 ตัวและรูป 3 รูป หรือด้วยบัตร QR ได้เฉพาะเมื่อครูเปิดชั้นเรียน',
            steps: [
                'บนหน้าชั้นเรียน ที่กรอบ “การเข้าสู่ระบบของชั้นเรียน” กด “เริ่มชั้นเรียน”',
                'เขียนรหัส 6 ตัวใต้ “รหัสชั้นเรียน” (1) บนกระดาน รหัสแสดงเพียงครั้งเดียว หน้าจอของนักเรียนเรียกรหัสนี้ว่า “รหัสห้องเรียน”',
                'ต้องการรหัสอีกครั้ง: กด “รหัสใหม่” (2) แอปแสดงรหัสใหม่ และรหัสเดิมใช้ไม่ได้อีก',
                'เมื่อจบคาบ กด “จบชั้นเรียน” (3) ชั้นเรียนปิดเองหลัง 3 ชั่วโมงด้วย',
            ],
            screens: [{ id: 'class-signin-card', caption: 'กรอบการเข้าสู่ระบบของชั้นเรียน หลังกด “เริ่มชั้นเรียน”' }],
            notes: [
                { title: 'รหัสรูปภาพ (4)', text: 'ครูปิด “รหัสรูปภาพ” ได้ แล้วนักเรียนเข้าสู่ระบบด้วยรหัสและชื่อเท่านั้น บางฟีเจอร์ เช่น Reedy ต้องเข้าสู่ระบบแบบเต็ม ปุ่ม “บัตร QR” (5) อยู่ในข้อ 6' },
                { title: 'นักเรียนหนึ่งคนเข้าสู่ระบบไม่ได้', text: 'แตะรูปผิด 5 ครั้ง: แอปล็อกนักเรียนคนนั้น 5 นาที ให้รอ แล้วลองอีกครั้ง จำรูปไม่ได้: ในรายชื่อ “นักเรียน” กด “ตั้งรหัสรูปภาพใหม่” ที่แถวของนักเรียนคนนั้น แล้วให้นักเรียนดูรูปใหม่ทันที เพราะรูปแสดงเพียงครั้งเดียว ปุ่มนี้ไม่ถามยืนยัน และนักเรียนคนนั้นออกจากระบบ ยังไม่มีรูป: กด “ตั้งรหัสรูปภาพ” ที่แถวของนักเรียนคนนั้น' },
            ],
        },
        {
            heading: '4.1 กำหนดหนังสือให้ชั้นเรียน (ทำครั้งเดียว)',
            intro: 'ทำครั้งเดียวต่อชั้นเรียน ก่อนบทเรียนแรก',
            steps: [
                'บนหน้าชั้นเรียน เลื่อนลงไปที่ส่วนหนังสือ ชั้นเรียนใหม่แสดงข้อความ “ยังไม่ได้กำหนดหนังสือให้ชั้นเรียนนี้ เลือกหนังสือด้านล่างเพื่อเริ่มต้น”',
                'ที่ “หนังสือ” (1) เลือก {book}',
                'ที่ “รูปแบบการเรียน” (2) เลือก “ครูนำ (ทำแบบฝึกหัดก่อน)”',
                'ที่ “วันเริ่ม” (3) เลือกวันของบทเรียนแรก แล้วกด “กำหนด” (4) แอปแสดง “กำหนดหนังสือแล้ว”',
            ],
            screens: [{ id: 'assign-book', caption: 'ฟอร์มกำหนดหนังสือ (ภาพจากชั้นเรียนทดสอบ)' }],
            notes: [
                { title: 'รูปแบบการเรียน', text: '“ครูนำ (ทำแบบฝึกหัดก่อน)”: นักเรียนเปิดขั้นในแอปได้หลังครูทำเครื่องหมายขั้นนั้นในแบบฝึกหัด (ข้อ 4.2) “เรียนด้วยตนเอง”: นักเรียนเปิดได้ทุกขั้น' },
                { title: 'ไม่มีหนังสือในรายการ', text: 'หน้าจอแสดง “รายการหนังสือยังไม่พร้อมใช้งาน” ให้ติดต่อเรา (ท้ายบทนี้)' },
            ],
        },
        {
            heading: '4.2 สอนบทเรียน',
            intro: 'ครูสอนจากหนังสือเรียน และกดในแอปทีละขั้น แอปเปิดขั้นเดียวกันให้นักเรียน',
            steps: [
                'บนหน้าชั้นเรียน ที่กรอบ “กำลังเรียนในชั้น” กด “เปิดบทเรียน” (1) กรอบนี้แสดงบทที่สอนอยู่และ “ขั้นต่อไป”',
                'หน้าบทเรียนมีกรอบ “คู่มือสด” ของขั้นแรกที่ชั้นเรียนยังไม่ได้ทำ: สิ่งที่ครูทำ ภาษาที่ครูใช้ และ “เคล็ดลับ” ใต้กรอบนี้ “คู่มือครู” แสดงทั้ง 13 ขั้น แต่ละขั้นมี “สิ่งที่ครูทำ” “ภาษาที่ครูใช้” “สิ่งที่นักเรียนทำ” “สิ่งที่ต้องสังเกต” และ “สคริปต์ฉบับเต็ม”',
                'เมื่อชั้นเรียนทำขั้นนั้นในหนังสือเรียนเสร็จ กด “ทำเครื่องหมายว่าทำขั้นนี้แล้ว” แอปเปิดขั้นเดียวกันให้นักเรียน และปุ่มเปลี่ยนเป็น “ยกเลิก” กด “ถัดไป” เพื่อไปขั้นต่อไป กดผิด: กด “ยกเลิก”',
                'อ่านทั้งชั้น: กด “โปรเจกเตอร์” คลิกย่อหน้าเพื่อโฟกัส กด “แสดงคำตอบ” เพื่อเฉลย',
                'ใน “แผนการสอน” (2) ครูเห็นปุ่มของทั้ง 13 ขั้นของบทเรียนปัจจุบัน และกดทำเครื่องหมายได้ที่นี่ด้วย',
            ],
            screens: [
                { id: 'class-book', caption: 'กรอบกำลังเรียนในชั้น (ภาพจากชั้นเรียนทดสอบ)' },
                { id: 'lesson-guide', caption: 'หน้าบทเรียน: กรอบ “คู่มือสด” ของขั้นที่ชั้นเรียนกำลังทำ' },
                { id: 'lesson-plan', caption: 'แผนการสอน: ปุ่มของ 13 ขั้น (1) และ “ความก้าวหน้าของชั้นเรียน” (2)' },
            ],
            notes: [
                { title: 'ครูต้องกดทุกขั้น', text: 'นักเรียนเปิดขั้นในแอปได้หลังครูกด “ทำเครื่องหมายว่าทำขั้นนี้แล้ว” เท่านั้น ถ้าครูยังไม่กด นักเรียนเห็นข้อความ “ครูจะเปิดบทเรียนนี้ในชั้นเรียน”' },
            ],
        },
        {
            heading: '4.3 หลังจบบทเรียน',
            steps: [
                'บนหน้าชั้นเรียน กด “แผนการสอน” แล้วกด “ความก้าวหน้าของชั้นเรียน” ตารางแสดงขั้นในแอปที่นักเรียนแต่ละคนทำแล้ว จาก 14 ขั้น',
                'กลับไปที่ “แผนการสอน” แล้วกด “ทำเครื่องหมายว่าสอนแล้ว” (2) ที่บทเรียนนั้น ปุ่ม “คู่มือ” (1) เปิดหน้าบทเรียนของบทนั้น',
            ],
            screens: [
                { id: 'progress-grid', caption: 'ตารางความก้าวหน้าของชั้นเรียน (ชื่อทดสอบ)' },
                { id: 'mark-taught', caption: 'แผนการสอน: ทำเครื่องหมายว่าสอนแล้ว' },
            ],
            notes: [
                { title: 'สีในตาราง (บนหน้าจอ)', text: 'เขียว: เสร็จแล้ว · น้ำเงิน: กำลังทำ · เทา: ยังไม่เริ่ม · วงแดง: ชั้นเรียนสอนบทนี้แล้ว แต่นักเรียนยังไม่เสร็จ ดูสีบนหน้าจอ เพราะคู่มือพิมพ์เป็นขาวดำ' },
                { title: 'กด “ทำเครื่องหมายว่าสอนแล้ว” หลังจบบทเรียนเท่านั้น', text: 'ปุ่มนี้ทำเครื่องหมายทั้ง 13 ขั้นของบทเรียนว่าทำแล้ว นักเรียนจึงเปิดทุกขั้นในแอปได้ ถ้าเป็นบทเรียนปัจจุบัน ชั้นเรียนไปต่อที่บทเรียนถัดไป' },
                { title: 'ปุ่มที่มีประโยชน์ในหน้าบทเรียน', text: '“ซ้อมสอน (มุมมองนักเรียน)”: ครูเห็นบทเรียนแบบที่นักเรียนเห็น สิ่งที่ครูทำในหน้านี้ไม่ถูกบันทึก “พิมพ์บทเรียนนี้”: ในหน้าต่างพิมพ์ เลือกกระดาษ A4 และปิด “ส่วนหัวและส่วนท้าย” “สอนอีกครั้ง” (ในแผนการสอน): เริ่มบทเรียนใหม่ ผลงานของนักเรียนแต่ละคนถูกเก็บไว้ในประวัติ และ XP ยังอยู่' },
            ],
        },
        {
            heading: '5. ให้การบ้าน',
            intro: 'การบ้านคือเรื่องอ่านหนึ่งเรื่อง ครูเลือกเรื่อง แล้วให้ทั้งชั้นหรือบางคน',
            steps: [
                'ที่เมนู กด “งานที่กำหนด” แล้วกด “สร้างงานใหม่” แอปเปิดหน้ารวมเรื่อง',
                'เลือกเรื่อง แล้วเปิดเรื่องนั้น ในหน้าเรื่อง กดปุ่ม “งานที่กำหนด” (1)',
                'ในหน้าต่าง “สร้างงานที่กำหนด”: เลือก “ห้องเรียน” (1) พิมพ์ “ชื่องานที่กำหนด” (2) และ “คำอธิบายงานที่กำหนด” (3) เลือกนักเรียน หรือ “เลือกนักเรียนทั้งหมด” (4) เลือก “วันที่กำหนด” แล้วกด “ส่ง” แอปแสดง “บันทึกงานที่กำหนดแล้ว”',
                'ดูผล: ที่เมนู “งานที่กำหนด” เลือกห้องเรียน แล้วกดชื่องาน เพื่อดูความก้าวหน้าของนักเรียนแต่ละคน',
            ],
            screens: [
                { id: 'article-assign', caption: 'หน้าเรื่อง: ปุ่ม “งานที่กำหนด” (1)' },
                { id: 'assign-form', caption: 'หน้าต่างสร้างงานที่กำหนด (ข้อมูลทดสอบ)' },
            ],
            notes: [
                { title: 'นักเรียนเห็นการบ้านที่ไหน', text: 'บนหน้าหลักของนักเรียน ที่กรอบ “บทเรียนวันนี้” (งานที่ใกล้วันส่งที่สุด) และในเมนู “งานที่กำหนด” ที่หน้า “งานของฉัน” กรอบ “บทเรียนวันนี้” แสดงการบ้าน ไม่ใช่บทเรียนในหนังสือ' },
                { title: 'การบ้านที่บ้าน ต้องใช้ชื่อผู้ใช้และรหัสผ่าน', text: 'รหัส 6 ตัว รูป 3 รูป และบัตร QR ใช้ได้เฉพาะเมื่อครูเปิดชั้นเรียน ที่บ้าน นักเรียนเข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านจาก “ใบรายชื่อชั้นเรียน” (ข้อ 6)' },
            ],
        },
        {
            id: 'class-sheet',
            heading: '6. ใบรายชื่อชั้นเรียนและบัตร QR: อ่านก่อนกด',
            before: [
                { title: 'เมื่อกด “ทำใบรายชื่อชั้นเรียน”', text: 'แอปตั้งรหัสผ่านใหม่ให้นักเรียนทุกคนในชั้นเรียนนี้ นักเรียนทุกคนออกจากระบบ ใบรายชื่อเดิมใช้ไม่ได้อีก และรหัสผ่านใหม่แสดงเพียงครั้งเดียว' },
            ],
            intro: 'ทั้งสองปุ่มอยู่บนหน้าชั้นเรียน ในกรอบ “การเข้าสู่ระบบของชั้นเรียน”: “ใบรายชื่อชั้นเรียน” และ “บัตร QR” ใบรายชื่อแสดงชื่อผู้ใช้และรหัสผ่านของนักเรียนแต่ละคน สำหรับเข้าสู่ระบบนอกห้องเรียน เช่น ทำการบ้านที่บ้าน',
            steps: [
                'ถ้าทีมงานแจกใบรายชื่อชั้นเรียนให้ชั้นเรียนของคุณแล้ว ให้ใช้ชุดนั้น และเก็บสำเนาไว้หนึ่งชุด',
                'ถ้ายังไม่มีใบรายชื่อ หรือใบรายชื่อหายทั้งชุด: ทำใบรายชื่อหนึ่งครั้ง นอกเวลาเรียน กด “ใบรายชื่อชั้นเรียน” แล้วกด “ทำใบรายชื่อชั้นเรียน”',
                'ในหน้าต่าง “ตั้งรหัสผ่านใหม่ให้ทั้งชั้นเรียนใช่ไหม” กด “ตั้งรหัสผ่านใหม่” (1)',
                'กด “พิมพ์” ทันที ก่อนออกจากหน้านี้ พิมพ์ 2 ชุด: ชุดหนึ่งตัดแจกนักเรียนแต่ละคน อีกชุดครูเก็บไว้',
                'บัตร QR: กด “บัตร QR” แล้วกด “ทำบัตรให้นักเรียนที่ยังไม่มีบัตร … คน” (1) แอปทำบัตรเฉพาะนักเรียนที่ยังไม่มีบัตร แล้วกด “พิมพ์” (2) ทันที บัตรแสดงเพียงครั้งเดียว',
            ],
            screens: [
                { id: 'class-sheet-confirm', caption: 'หน้าต่างยืนยันของใบรายชื่อชั้นเรียน' },
                { id: 'qr-cards', caption: 'หน้าบัตร QR สำหรับเข้าสู่ระบบ' },
            ],
            notes: [
                { title: 'นักเรียนลืมรหัสผ่าน', text: 'ครูดูชื่อผู้ใช้และรหัสผ่านของนักเรียนจากชุดที่ครูเก็บไว้ ที่โรงเรียน นักเรียนเข้าสู่ระบบด้วยรหัส 6 ตัวและรูป 3 รูป หรือบัตร QR ได้เสมอเมื่อครูเปิดชั้นเรียน' },
                { title: 'บัตรหาย', text: 'ในรายชื่อ “นักเรียน” กด “บัตรใหม่” ที่แถวของนักเรียนคนนั้น แล้วยืนยัน บัตรเดิมใช้ไม่ได้ทันที และนักเรียนคนนั้นออกจากระบบ' },
            ],
        },
    ],
    stepMapTitle: 'ขั้นในหนังสือและขั้นในแอป',
    stepMapIntro: 'หนังสือเรียนมี 13 ขั้น แอปของนักเรียนมี 14 ขั้น แอปจับคู่ขั้นให้เอง เมื่อครูทำเครื่องหมายขั้นในหนังสือ แอปเปิดขั้นในแอปที่ตรงกัน',
    stepMapHead: ['ขั้นในหนังสือ', 'ชื่อในหนังสือ', 'ขั้นในแอปของนักเรียน'],
    appSteps: [
        'แนะนำบทเรียน', 'ดูตัวอย่างคำศัพท์', 'อ่านครั้งแรก', 'รวบรวมคำศัพท์', 'อ่านอย่างลึกซึ้ง', 'รวบรวมประโยค', 'หลายตัวเลือก',
        'คำตอบสั้น', 'แฟลชการ์ดคำศัพท์', 'จับคู่คำศัพท์', 'แฟลชการ์ดประโยค', 'กิจกรรมประโยค', 'คำถามภาษา', 'สรุปบทเรียน',
    ],
    noAppStep: 'ไม่มีในแอป (ทำในหนังสือเท่านั้น)',
    bookNoteTitle: 'คิวอาร์โค้ดและกรอบงานในแอปในหนังสือ',
    bookNote: 'คิวอาร์โค้ดในหนังสือเปิดบทความของบทเรียนในแอป ถ้านักเรียนยังไม่ได้เข้าสู่ระบบ แอปเปิดหน้าเข้าสู่ระบบก่อน หลังเข้าสู่ระบบ แอปเปิดหน้าหลัก ให้นักเรียนสแกนคิวอาร์โค้ดอีกครั้ง กรอบบางกรอบในหนังสือพูดถึงงานในแอปที่คู่มือนี้ไม่ได้ใช้ เช่น คำแนะนำจาก AI การเพิ่มคำศัพท์ในแอป และบัตรคำในแอป ให้สอนตามคู่มือนี้: ขั้นที่ 11 นักเรียนเขียนบนกระดาษ การบ้านในแอปคือบทความ (ข้อ 5)',
    helpTitle: 'ต้องการความช่วยเหลือ',
    help: 'LINE: ReadingAdvantage · อีเมล: support@reading-advantage.com · โทร: 099-005-8038',
};

const en: AppSectionText = {
    heading: 'The Primary Advantage app: how the teacher uses it',
    intro: [
        'This workbook goes with the new Primary Advantage app. This section shows what the teacher presses in the app, one step at a time, in the same order as the "Teacher picture guide".',
        'Every picture comes from the real app with test data. The numbers in a picture are the numbers in the text. A word in “ ” is the word on the screen.',
    ],
    prepareTitle: 'You need',
    prepare: ['A computer with a projector', 'The e-mail address and password from the school', "The students' workbooks"],
    parts: [
        {
            id: 'signin',
            heading: '1. Sign in',
            intro: 'Teachers sign in with an e-mail address and a password. The Google button is gone.',
            before: [
                { title: 'The form words are English', text: 'The words on the teacher sign-in form are English for now: Username, Password, Login; New password, Type the new password again, Save and sign in.' },
            ],
            steps: [
                'Open primary.reading-advantage.com.',
                'Press the “Teacher” tab (1). The sign-in page always opens on the “Student” tab.',
                'In the username field (2), type your e-mail address. In the password field (3), type your password. Then press the sign-in button (4).',
                'First sign-in: use the temporary password from the school. The app opens the new-password page. Type the new password (1), type it again (2), then press the save-and-sign-in button (3).',
            ],
            screens: [
                { id: 'signin-teacher-tab', caption: 'The sign-in page, Teacher tab' },
                { id: 'signin-new-password', caption: 'The new-password page (first sign-in)' },
            ],
            notes: [
                { title: 'New password', text: '8 characters or more, and not the temporary password. After this, the temporary password stops working.' },
                { title: 'Forgot the password', text: "Ask the school's administrator for a new password." },
            ],
        },
        {
            heading: '2. Find your class',
            intro: 'After sign-in, the app opens the teacher “Home”.',
            steps: ['In the menu at the left, press “My Classes” (1).', 'Press the class name in the table (2). The app opens the class page.'],
            screens: [{ id: 'teacher-menu', caption: 'My Classes' }],
            notes: [
                { title: 'The teacher menu', text: '“Home”, “My Classes”, “My Students”, “Reports”, “Assignments”, “Teacher manual”.' },
                { title: 'Shortcut on Home', text: 'In the class table on Home, the “Start class” link opens the class page, but it does not start the class. On the class page, press “Start class” again (section 3).' },
            ],
        },
        {
            heading: '3. Start the class so that students can sign in',
            intro: "Students sign in with a 6-character code and 3 pictures, or with a QR card, only while the teacher's class is open.",
            steps: [
                'On the class page, in the “Class sign-in” card, press “Start class”.',
                'Write the 6-character code under “Class code” (1) on the board. The code shows only once. The student screen calls it “Classroom code”.',
                'To show a code again, press “New code” (2). The app shows a new code, and the old code stops working.',
                'At the end of the period, press “End class” (3). The class also closes by itself after 3 hours.',
            ],
            screens: [{ id: 'class-signin-card', caption: 'The class sign-in card after “Start class”' }],
            notes: [
                { title: 'Picture password (4)', text: 'You can turn off “Picture password”. Then students sign in with the code and the name only. Some features, such as Reedy, need a full sign-in. The “QR cards” button (5) is in section 6.' },
                { title: 'One student cannot sign in', text: '5 wrong taps lock that student for 5 minutes: wait, then try again. Forgot the pictures: in the “Students” list, press “Reset pictures” on that student\'s row, and show the new pictures at once, because they show only once. This button asks no question, and it signs that student out. No pictures yet: press “Set pictures” on that student\'s row.' },
            ],
        },
        {
            heading: '4.1 Assign the book to the class (once)',
            intro: 'Do this once for each class, before the first lesson.',
            steps: [
                'On the class page, go down to the book part. A new class shows “No book is assigned to this class yet. Choose a book below to start.”',
                'At “Book” (1), choose {book}.',
                'At “Mode” (2), choose “Teacher-led (workbook first)”.',
                'At “Start date” (3), choose the day of the first lesson. Then press “Assign” (4). The app shows “Book assigned”.',
            ],
            screens: [{ id: 'assign-book', caption: 'The assign-book form (test class)' }],
            notes: [
                { title: 'Mode', text: '“Teacher-led (workbook first)”: a student opens an app step only after the teacher marks that workbook step (4.2). “Independent”: the student opens every step.' },
                { title: 'No book in the list', text: 'The screen shows “The book list is not ready”. Contact us (end of this section).' },
            ],
        },
        {
            heading: '4.2 Teach the lesson',
            intro: 'The teacher teaches from the workbook and presses in the app one step at a time. The app opens the same step for the students.',
            steps: [
                'On the class page, in the “Now in class” card, press “Open lesson” (1). The card shows the current lesson and the “Next step”.',
                'The lesson page has the “Live guide” box for the first step that the class has not done: the teacher actions, the teacher language, and a “Tip”. Under this box, the “Teacher guide” shows all 13 steps, each with “Teacher actions”, “Teacher language”, “Student actions”, “Watch for”, and “Full script”.',
                'When the class finishes the step in the workbook, press “Mark step done”. The app opens the same step for the students, and the button changes to “Undo”. Press “Next” to go to the next step. A wrong press: press “Undo”.',
                'Whole-class reading: press “Projector”. Click a paragraph to focus it. Press “Show answers” to reveal the answers.',
                'In the “Lesson plan” (2), the teacher sees the buttons of all 13 steps of the current lesson, and can mark them there too.',
            ],
            screens: [
                { id: 'class-book', caption: 'The “Now in class” card (test class)' },
                { id: 'lesson-guide', caption: 'The lesson page: the “Live guide” box of the step that the class is doing' },
                { id: 'lesson-plan', caption: 'Lesson plan: the 13 step buttons (1) and “Class progress” (2)' },
            ],
            notes: [{ title: 'Mark every step', text: 'A student opens an app step only after the teacher presses “Mark this step done”. Until then, the student sees “The teacher will open this lesson in class”.' }],
        },
        {
            heading: '4.3 After the lesson',
            steps: [
                'On the class page, press “Lesson plan”, then “Class progress”. The table shows the app steps that each student did, of 14.',
                'Go back to “Lesson plan” and press “Mark taught” (2) on that lesson. The “Guide” button (1) opens the lesson page of that lesson.',
            ],
            screens: [
                { id: 'progress-grid', caption: 'The class progress table (test names)' },
                { id: 'mark-taught', caption: 'Lesson plan: mark the lesson taught' },
            ],
            notes: [
                { title: 'Colors in the table (on the screen)', text: 'Green: done · blue: in progress · gray: not started · red ring: the class was taught this lesson, but the student has not finished. Look at the colors on the screen, because this manual prints in black and white.' },
                { title: 'Press “Mark taught” only after the lesson', text: 'This button marks all 13 steps of the lesson done, so the students can open every app step. If it is the current lesson, the class moves on to the next lesson.' },
                { title: 'Useful buttons on the lesson page', text: '“Rehearse (student view)”: see the lesson as a student sees it; nothing saves. “Print this lesson”: in the print window, choose A4 and turn off “Headers and footers”. “Teach again” (lesson plan): starts the lesson again; each student\'s work stays in the history, and the XP stays.' },
            ],
        },
        {
            heading: '5. Give homework',
            intro: 'Homework is one reading story. The teacher chooses a story and gives it to the whole class or to some students.',
            steps: [
                'In the menu, press “Assignments”, then “New assignment”. The app opens the story list.',
                'Choose a story and open it. On the story page, press the “Assignments” button (1).',
                'In the “Create assignment” window: choose the “Classroom” (1), type the “Assignment name” (2) and the “Assignment description” (3), choose the students or “Select all students” (4), choose the “Due date”, then press “Submit”. The app shows “Assignment saved”.',
                'See the results: in the menu “Assignments”, choose the class, then press the assignment name to see the progress of each student.',
            ],
            screens: [
                { id: 'article-assign', caption: 'The story page: the “Assignments” button (1)' },
                { id: 'assign-form', caption: 'The create-assignment window (test data)' },
            ],
            notes: [
                { title: 'Where students see the homework', text: 'On the student home, in the “Today\'s lesson” card (the assignment with the nearest due date), and in the menu “Assignments”, on the page “My work”. The “Today\'s lesson” card shows homework, not the lesson of the book.' },
                { title: 'Homework at home needs the username and password', text: "The code, the pictures, and the QR card work only while the teacher's class is open. At home, students sign in with the username and password from the “Class sheet” (section 6)." },
            ],
        },
        {
            id: 'class-sheet',
            heading: '6. Class sheet and QR cards: read before you press',
            before: [
                { title: 'When you press “Make class sheet”', text: 'The app sets a new password for every student in this class, every student is signed out, the old sheet stops working, and the new passwords show only once.' },
            ],
            intro: 'Both buttons are on the class page, in the “Class sign-in” card: “Class sheet” and “QR cards”. The class sheet shows each student\'s username and password, for sign-in away from the classroom, for example homework at home.',
            steps: [
                'If the team already gave your class its class sheet, use that sheet and keep one copy.',
                'If there is no sheet, or the whole sheet is lost: make the sheet once, outside class time. Press “Class sheet”, then “Make class sheet”.',
                'In the window “Set new passwords for the whole class?”, press “Set new passwords” (1).',
                'Press “Print” at once, before you leave the page. Print 2 copies: cut one copy and give each student the part with the student\'s name; keep the other copy.',
                'QR cards: press “QR cards”, then “Make cards for … students without a card” (1). The app makes cards only for students without a card. Then press “Print” (2) at once: a card shows only once.',
            ],
            screens: [
                { id: 'class-sheet-confirm', caption: 'The confirm window of the class sheet' },
                { id: 'qr-cards', caption: 'The QR sign-in card page' },
            ],
            notes: [
                { title: 'A student forgets the password', text: "The teacher reads the student's username and password on the kept copy. At school, the student can always sign in with the 6-character code and the 3 pictures, or the QR card, while the class is open." },
                { title: 'Lost card', text: 'In the “Students” list, press “New card” on that student\'s row and confirm. The old card stops at once, and that student is signed out.' },
            ],
        },
    ],
    stepMapTitle: 'Book steps and app steps',
    stepMapIntro: 'The workbook has 13 steps. The student app has 14 steps. The app matches the steps: when the teacher marks a book step, the app opens the matching app steps.',
    stepMapHead: ['Book step', 'Name in the book', 'Student app step'],
    appSteps: [
        'Introduction', 'Preview Vocabulary', 'First Reading', 'Vocabulary Collection', 'Deep Reading', 'Sentence Collection', 'Multiple Choice',
        'Short Answer', 'Vocabulary Flashcards', 'Vocabulary Matching', 'Sentence Flashcards', 'Sentence Activities', 'Language Questions', 'Lesson Summary',
    ],
    noAppStep: 'Not in the app (workbook only)',
    bookNoteTitle: 'QR codes and app boxes in the book',
    bookNote: 'The QR codes in the book open the article of the lesson in the app. A student who is not signed in sees the sign-in page first; after the sign-in, the app opens the home page, so the student scans the QR code again. Some boxes in the book name app tasks that this manual does not use, for example AI feedback, adding words to the app, and flashcards in the app. Teach from this manual: in step 11, the students write on paper; homework in the app is an article (section 5).',
    helpTitle: 'Help',
    help: 'LINE: ReadingAdvantage · E-mail: support@reading-advantage.com · Phone: 099-005-8038',
};

/** The section text in each language. */
export const APP_SECTION: Record<SupportedLanguage, AppSectionText> = { en, th };

/**
 * The app version that the section describes. `live` is the app on primary.reading-advantage.com
 * on 2026-10-20. `new` is the app after a fix (Daniel's go, 2026-10-20; the deploy is Daniel's
 * decision): `signin` is the teacher sign-in with Thai labels (monorepo a492b16c1), and `reset` is
 * the "New password" button for one student (monorepo d9c02df5b). The text is the PR picture guide
 * K1 with the classes `v-new` and `r-new`.
 */
export interface AppVariant {
    signin: 'live' | 'new';
    reset: 'live' | 'new';
}

/** The live app (the default). */
export const LIVE_APP: AppVariant = { signin: 'live', reset: 'live' };

/** The text of the parts after the fixes. */
interface FixText {
    /** Sign-in steps 3 and 4 with the Thai labels. */
    signinSteps: [string, string];
    signinScreens: AppScreen[];
    /** A note before the other sign-in notes. */
    signinNote: { title: string; text: string };
    /** Added to the class-sheet warning. */
    resetWarning: string;
    /** Class-sheet step 4: one copy, because the teacher can now reset one student's password. */
    resetPrintStep: string;
    /** The note "A student forgets the password". */
    resetForgot: string;
}

const FIX_TEXT: Record<SupportedLanguage, FixText> = {
    th: {
        signinSteps: [
            'ในช่อง “ชื่อผู้ใช้” (2) พิมพ์อีเมลของคุณ ในช่อง “รหัสผ่าน” (3) พิมพ์รหัสผ่าน แล้วกด “เข้าสู่ระบบ” (4)',
            'เข้าสู่ระบบครั้งแรก: ใช้รหัสผ่านชั่วคราวที่โรงเรียนให้ แอปแสดงหน้า “ตั้งรหัสผ่านใหม่” พิมพ์รหัสผ่านใหม่ในช่อง “รหัสผ่านใหม่” (1) พิมพ์อีกครั้งในช่อง “พิมพ์รหัสผ่านใหม่อีกครั้ง” (2) แล้วกด “บันทึกและเข้าสู่ระบบ” (3)',
        ],
        signinScreens: [
            { id: 'signin-teacher-tab-th', caption: 'หน้าเข้าสู่ระบบ แท็บครู', pending: 'รอภาพ: หน้าเข้าสู่ระบบของครูภาษาไทย (หลังการแก้ไข)' },
            { id: 'signin-new-password-th', caption: 'หน้าตั้งรหัสผ่านใหม่ (เข้าสู่ระบบครั้งแรก)', pending: 'รอภาพ: หน้าตั้งรหัสผ่านใหม่ภาษาไทย (หลังการแก้ไข)' },
        ],
        signinNote: { title: 'ครูที่ย้ายมาจากระบบเดิม', text: 'หน้าจอบอกว่า “พิมพ์ชื่อผู้ใช้ของคุณ ครูที่ย้ายมาจากระบบเดิมให้พิมพ์อีเมลของตนเอง”' },
        resetWarning: 'นักเรียนคนเดียวลืมรหัสผ่าน: ใช้ปุ่ม “รหัสผ่านใหม่” ที่แถวของนักเรียนคนนั้น (ด้านล่าง)',
        resetPrintStep: 'กด “พิมพ์” ทันที ก่อนออกจากหน้านี้ ตัดใบรายชื่อ แล้วให้นักเรียนแต่ละคนเฉพาะส่วนที่มีชื่อของตนเอง',
        resetForgot: 'ในรายชื่อ “นักเรียน” กด “รหัสผ่านใหม่” ที่แถวของนักเรียนคนนั้น ในหน้าต่าง “ตั้งรหัสผ่านใหม่ให้ … ใช่ไหม” กด “ตั้งรหัสผ่านใหม่” แอปตั้งรหัสผ่านใหม่ให้นักเรียนคนนั้นคนเดียว และนักเรียนคนนั้นออกจากระบบ นักเรียนคนอื่นใช้รหัสผ่านเดิมต่อได้ รหัสผ่านใหม่แสดงเพียงครั้งเดียว ให้นักเรียนจดไว้ทันที หรือกด “พิมพ์”',
    },
    en: {
        signinSteps: [
            'In the “Username” field (2), type your e-mail address. In the “Password” field (3), type your password. Then press “Sign in” (4).',
            'First sign-in: use the temporary password from the school. The app shows the page “Set a new password”. Type the new password in “New password” (1), type it again in “Type the new password again” (2), then press “Save and sign in” (3).',
        ],
        signinScreens: [
            { id: 'signin-teacher-tab-th', caption: 'The sign-in page, Teacher tab', pending: 'Picture to come: the Thai teacher sign-in page (after the fix)' },
            { id: 'signin-new-password-th', caption: 'The new-password page (first sign-in)', pending: 'Picture to come: the Thai new-password page (after the fix)' },
        ],
        signinNote: { title: 'Teachers from the old system', text: 'The screen says “Type your username. Teachers from the old app type their e-mail address.”' },
        resetWarning: 'One student forgot the password: use the “New password” button on that student\'s row (below).',
        resetPrintStep: 'Press “Print” at once, before you leave the page. Cut the sheet and give each student only the part with the student\'s name.',
        resetForgot: 'In the “Students” list, press “New password” on that student\'s row. In the window “Set a new password for …?”, press “Set new password”. The app sets a new password for that student only, and signs that student out. The other students keep their passwords. The new password shows only once: the student writes it down at once, or you press “Print”.',
    },
};

/** The index of the print step in part 6. */
const PRINT_STEP = 3;

/**
 * The parts of the section for one app version: the live parts, with the sign-in part and the
 * class-sheet part changed after a fix.
 * @param lang The manual language.
 * @param app The app version.
 * @returns The parts.
 */
export function appParts(lang: SupportedLanguage, app: AppVariant = LIVE_APP): AppPart[] {
    const f = FIX_TEXT[lang];
    return APP_SECTION[lang].parts.map((p) => {
        if (p.id === 'signin' && app.signin === 'new') {
            // No note about English form words: the form has Thai labels.
            return { ...p, before: undefined, steps: [...p.steps.slice(0, 2), ...f.signinSteps], screens: f.signinScreens, notes: [f.signinNote, ...p.notes] };
        }
        if (p.id === 'class-sheet' && app.reset === 'new') {
            const [warning, ...rest] = p.before ?? [];
            return {
                ...p,
                before: [{ ...warning, text: `${warning.text} ${f.resetWarning}` }, ...rest],
                steps: p.steps.map((s, i) => (i === PRINT_STEP ? f.resetPrintStep : s)),
                notes: p.notes.map((n, i) => (i === 0 ? { ...n, text: f.resetForgot } : n)),
            };
        }
        return p;
    });
}

/** The book of a manual: the product name, the series, and the level. */
export interface ManualBook {
    productName?: string;
    seriesName: string;
    seriesLevel: string;
}

/**
 * The series and level of a book, once: the dashboard route passes the level inside the series name
 * too ("Origins 3.1" and "3.1").
 * @param book The book.
 * @returns For example "Origins 3.1".
 */
function seriesAndLevel(book: ManualBook): string {
    const series = book.seriesName.trim();
    const level = book.seriesLevel.trim();
    return series.toLowerCase().endsWith(level.toLowerCase()) ? series : `${series} ${level}`;
}

/**
 * The key of a book in BOOK_NOTES.
 * @param book The book.
 * @returns For example "origins 3.1".
 */
export function bookKey(book: ManualBook): string {
    return seriesAndLevel(book).toLowerCase();
}

/** The notes of one printed book: a note in the app section, and notes at the top of some lesson plans. */
export interface BookNotes {
    appNote: Record<SupportedLanguage, { title: string; text: string }>;
    lessons: Record<number, Record<SupportedLanguage, string>>;
}

/**
 * Notes that are true for one printed book only. Origins 3.1: the printed lesson 12 repeats lesson 9
 * (Daniel, 2026-09-30: an errata insert replaces it; advantage-pr product strategy v1.11).
 */
export const BOOK_NOTES: Record<string, BookNotes> = {
    'origins 3.1': {
        appNote: {
            th: {
                title: 'บทที่ 12 ในหนังสือ',
                text: 'บทที่ 12 ในหนังสือที่พิมพ์แล้วผิด (เป็นเรื่อง “My Happy Holiday” ซ้ำกับบทที่ 9) ให้สอนบทที่ 12 ใหม่ “Hello! I Am Tom” แอปแสดงบทนี้แล้ว หน้าพิมพ์ของบทที่ 12 ใหม่จะส่งตามมาภายหลัง ระหว่างนี้ ให้ฉายบทเรียนบนโปรเจกเตอร์ หรือกด “พิมพ์บทเรียนนี้” ในแอป แล้วพิมพ์ให้นักเรียน (ข้อ 4.3) คิวอาร์โค้ดในหน้าบทที่ 12 ของหนังสือเปิดบทความเดียวกับบทที่ 9',
            },
            en: {
                title: 'Lesson 12 in the book',
                text: 'Lesson 12 in the printed book is a printing error (it repeats "My Happy Holiday" from lesson 9). Teach the new lesson 12, "Hello! I Am Tom". The app shows this lesson. The printed pages of the new lesson 12 come later. Until then, show the lesson on the projector, or press “Print this lesson” in the app and print it for the students (4.3). The QR code on the lesson 12 page of the book opens the same article as lesson 9.',
            },
        },
        lessons: {
            12: {
                th: 'หนังสือที่พิมพ์แล้ว: บทที่ 12 เป็นเรื่อง “My Happy Holiday” ซ้ำกับบทที่ 9 แผนนี้สอนบทที่ 12 ใหม่ “Hello! I Am Tom” (ดู “บทที่ 12 ในหนังสือ” ในบท “แอป Primary Advantage”) คิวอาร์โค้ดในหน้าบทที่ 12 ของหนังสือเปิดบทความเดียวกับบทที่ 9',
                en: 'The printed book: lesson 12 is "My Happy Holiday", the same as lesson 9. This plan teaches the new lesson 12, "Hello! I Am Tom" (see "Lesson 12 in the book" in the section "The Primary Advantage app"). The QR code on the lesson 12 page of the book opens the same article as lesson 9.',
            },
        },
    },
};

/**
 * The note at the top of one lesson plan, if the book has one.
 * @param book The book.
 * @param lessonNumber The lesson number in the book.
 * @param lang The manual language.
 * @returns The note text, or null.
 */
export function bookLessonNote(book: ManualBook, lessonNumber: number, lang: SupportedLanguage): string | null {
    return BOOK_NOTES[bookKey(book)]?.lessons[lessonNumber]?.[lang] ?? null;
}

/** The folder of the marked screenshots. */
export const APP_SCREEN_DIR = path.join(process.cwd(), 'assets', 'teacher-manual', 'app');

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The CSS of the section: black, white, and gray only (the school prints in black and white). */
const APP_SECTION_CSS = `
/* A heading stays with its intro and its steps: no heading alone at the foot of a page. */
.tm-app-section .tm-app-head { break-inside: avoid; }
.tm-app-section h3 { font-size: 15pt; margin: 0 0 6pt; padding-bottom: 3pt; border-bottom: 2pt solid #000000; }
.tm-app-section .tm-app-intro { margin: 0 0 6pt; }
.tm-app-section ol.tm-app-steps { margin: 0 0 8pt 18pt; padding: 0; }
.tm-app-section ol.tm-app-steps li { margin: 0 0 3pt; }
.tm-app-section figure { margin: 6pt 0 8pt; break-inside: avoid; }
.tm-app-section figure img { display: block; max-width: 100%; max-height: 105mm; margin: 0 auto; border: 0.75pt solid #555555; }
.tm-app-section figcaption { font-size: 9pt; color: #333333; text-align: center; margin-top: 3pt; }
.tm-app-section .tm-app-placeholder { border: 1.5pt dashed #555555; padding: 18pt 8pt; text-align: center; color: #333333; }
.tm-app-section .tm-app-note { border: 1pt solid #000000; border-left: 5pt solid #000000; padding: 5pt 8pt; margin: 0 0 6pt; break-inside: avoid; }
.tm-app-section .tm-app-note strong { display: block; margin-bottom: 2pt; }
/* A contact item (for example the phone number) stays on one line. */
.tm-app-section .tm-app-keep { white-space: nowrap; }
.tm-app-section table.tm-app-map { width: 100%; border-collapse: collapse; font-size: 10pt; break-inside: avoid; }
.tm-app-section table.tm-app-map th, .tm-app-section table.tm-app-map td { border: 0.75pt solid #000000; padding: 3pt 5pt; text-align: left; vertical-align: top; }
.tm-app-section table.tm-app-map th { background: #e6e6e6; }
`;

/**
 * A screenshot as a figure with its JPEG as a data URL, or a dashed placeholder box.
 * @param screen The screen.
 * @param dir The folder of the marked screenshots.
 * @returns The HTML.
 */
function screenHtml(screen: AppScreen, dir: string): string {
    const caption = `<figcaption>${escapeHtml(screen.caption)}</figcaption>`;
    if (!screen.id) return `<figure><div class="tm-app-placeholder">${escapeHtml(screen.caption)}</div></figure>`;
    const file = path.join(dir, `${screen.id}.jpg`);
    if (screen.pending && !fs.existsSync(file)) return `<figure><div class="tm-app-placeholder">${escapeHtml(screen.pending)}</div>${caption}</figure>`;
    const data = fs.readFileSync(file).toString('base64');
    return `<figure><img src="data:image/jpeg;base64,${data}" alt="${escapeHtml(screen.caption)}">${caption}</figure>`;
}

/**
 * The section "The Primary Advantage app" for the front matter.
 * @param lang The manual language.
 * @param book The book: its name goes into step 4.1, and its notes (BOOK_NOTES) into the section. Without it, the text names "the class's book" and has no book note.
 * @param app The app version (default: the live app).
 * @param dir The folder of the marked screenshots (default `assets/teacher-manual/app`).
 * @returns The HTML of the section, with its own style block.
 */
export function generateAppSection(lang: SupportedLanguage = 'en', book?: ManualBook, app: AppVariant = LIVE_APP, dir: string = APP_SCREEN_DIR): string {
    const t = APP_SECTION[lang];
    const name = book ? `${book.productName ? `${book.productName} ` : ''}${seriesAndLevel(book)}` : lang === 'th' ? 'หนังสือของชั้นเรียน' : "the class's book";
    const bookNote = book ? BOOK_NOTES[bookKey(book)]?.appNote[lang] : undefined;
    const note = (n: { title: string; text: string }) => `<div class="tm-app-note"><strong>${escapeHtml(n.title)}</strong>${escapeHtml(n.text)}</div>`;
    const parts = appParts(lang, app).map((p) => `
      <div class="tm-app-part">
        <div class="tm-app-head">
          <h3>${escapeHtml(p.heading)}</h3>
          ${p.intro ? `<p class="tm-app-intro">${escapeHtml(p.intro)}</p>` : ''}
          ${(p.before ?? []).map(note).join('')}
          <ol class="tm-app-steps">${p.steps.map((s) => `<li>${escapeHtml(s.replace('{book}', name))}</li>`).join('')}</ol>
        </div>
        ${p.screens.map((s) => screenHtml(s, dir)).join('')}
        ${p.notes.map(note).join('')}
      </div>`).join('');
    const rows = STEP_MAP.map((s) => {
        const app = s.appSteps.length ? s.appSteps.map((n) => `${n}. ${escapeHtml(t.appSteps[n - 1])}`).join('<br>') : escapeHtml(t.noAppStep);
        return `<tr><td>${s.step}</td><td>${escapeHtml(s.title)}</td><td>${app}</td></tr>`;
    }).join('');
    return `
    <div class="tm-section tm-app-section">
      <style>${APP_SECTION_CSS}</style>
      <h2 class="tm-section-header">${escapeHtml(t.heading)}</h2>
      ${t.intro.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
      ${note({ title: t.prepareTitle, text: t.prepare.join(' · ') })}
      ${bookNote ? note(bookNote) : ''}
      <div class="tm-app-head">
        <h3>${escapeHtml(t.stepMapTitle)}</h3>
        <p class="tm-app-intro">${escapeHtml(t.stepMapIntro)}</p>
      </div>
      <table class="tm-app-map"><thead><tr>${t.stepMapHead.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
      ${note({ title: t.bookNoteTitle, text: t.bookNote })}
      ${parts}
      <div class="tm-app-note"><strong>${escapeHtml(t.helpTitle)}</strong>${t.help.split(' · ').map((item) => `<span class="tm-app-keep">${escapeHtml(item)}</span>`).join(' · ')}</div>
    </div>`;
}
