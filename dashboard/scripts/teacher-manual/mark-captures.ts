import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';

const USAGE = `Crops the Thai app captures for the Teacher's Manual section "The Primary Advantage app" and draws
the marks of their box files (track teacher_manual_app_20261020). The marks are black with a white
outline and a number, for the school's black-and-white office printer.

Usage: npx tsx scripts/teacher-manual/mark-captures.ts [--in <capture dir>] [--out <dir>]

  --in    The capture set of the Monorepo session (default
          ~/Desktop/primary-parity-progress/captures/pr-boonyathat-start-kit): <name>.png at 2x and
          <name>.json with [{label, x, y, w, h}] in CSS pixels
  --out   Output folder (default assets/teacher-manual/app): <id>.jpg and screens.json`;

/** One screenshot of the manual section: the capture, the marks (box labels, in number order), and the crop in CSS pixels. */
export interface ScreenSpec {
    id: string;
    capture: string;
    marks: string[];
    crop?: { x: number; y: number; w: number; h: number };
    /** Areas to cover in CSS pixels, with sample text: no class code, password, or name is printed (PR rule). */
    masks?: { x: number; y: number; w: number; h: number; text: string; size: number }[];
}

/** The screenshots, in the order of the PR teacher guide (K1): sign in, find the class, start the class, the book, the lesson, homework, the class sheet and QR cards. */
export const SCREENS: ScreenSpec[] = [
    // The teacher sign-in has English form labels until the fix a492b16c1 is live (PR README: use 01a for print).
    { id: 'signin-teacher-tab', capture: '01a-signin-teacher-tab-desktop-th', marks: ['ครู', 'Username', 'Password', 'Login'], crop: { x: 405, y: 205, w: 470, h: 405 } },
    { id: 'signin-new-password', capture: '02b-new-password-empty-desktop-th', marks: ['New password', 'Type the new password again', 'Save and sign in'], crop: { x: 405, y: 205, w: 470, h: 405 } },
    { id: 'teacher-menu', capture: '03b-my-classes-desktop-th', marks: ['ชั้นเรียนของฉัน', 'Demo Classroom'], crop: { x: 8, y: 70, w: 1242, h: 380 } },
    { id: 'class-signin-card', capture: '04b-class-signin-card-started-desktop-th', marks: ['รหัสชั้นเรียน', 'รหัสใหม่', 'จบชั้นเรียน', 'รหัสรูปภาพ', 'บัตร QR'], crop: { x: 268, y: 90, w: 992, h: 520 }, masks: [{ x: 540, y: 200, w: 460, h: 100, text: 'ABC123', size: 80 }] },
    { id: 'assign-book', capture: '08a-assign-book-form-desktop-th', marks: ['หนังสือ', 'รูปแบบการเรียน', 'วันเริ่ม', 'กำหนด'], crop: { x: 268, y: 140, w: 992, h: 300 } },
    { id: 'class-book', capture: '08b-class-book-assigned-desktop-th', marks: ['เปิดบทเรียน', 'แผนการสอน'], crop: { x: 268, y: 80, w: 992, h: 400 } },
    { id: 'lesson-guide', capture: '09c-lesson-guide-desktop-th', marks: [], crop: { x: 280, y: 90, w: 980, h: 545 } },
    { id: 'lesson-plan', capture: '09b-lesson-plan-steps-marked-desktop-th', marks: ['ขั้นที่ 4: Collect Vocabulary', 'ความก้าวหน้าของชั้นเรียน'], crop: { x: 280, y: 60, w: 990, h: 720 } },
    { id: 'progress-grid', capture: '09f-class-progress-grid-desktop-th', marks: [], crop: { x: 280, y: 70, w: 980, h: 560 } },
    { id: 'mark-taught', capture: '09g-mark-lesson-taught-desktop-th', marks: ['คู่มือ', 'ทำเครื่องหมายว่าสอนแล้ว'], crop: { x: 290, y: 60, w: 970, h: 330 } },
    { id: 'article-assign', capture: '10b-article-assign-button-desktop-th', marks: ['งานที่กำหนด'], crop: { x: 290, y: 80, w: 970, h: 300 } },
    { id: 'assign-form', capture: '10c-assign-form-filled-top-desktop-th', marks: ['ห้องเรียน', 'ชื่องานที่กำหนด', 'คำอธิบายงานที่กำหนด', 'เลือกนักเรียนทั้งหมด'], crop: { x: 386, y: 235, w: 508, h: 465 } },
    { id: 'class-sheet-confirm', capture: '06b-class-sheet-confirm-desktop-th', marks: ['ตั้งรหัสผ่านใหม่'], crop: { x: 280, y: 140, w: 960, h: 360 } },
    { id: 'qr-cards', capture: '07a-qr-cards-page-desktop-th', marks: ['ทำบัตรให้นักเรียนที่ยังไม่มีบัตร 4 คน', 'พิมพ์'], crop: { x: 268, y: 80, w: 992, h: 440 } },
];

interface Box { label: string; x: number; y: number; w: number; h: number }

/** The capture scale (2x for the desktop set). */
const SCALE = 2;
/** CSS pixels of space around the marked boxes when a screen has no fixed crop. */
const MARGIN = 48;

/**
 * The crop of a screen: its fixed crop, or the boxes with a margin, at least 640 x 240 CSS pixels.
 * @param spec The screen.
 * @param boxes The marked boxes.
 * @param size The capture size in CSS pixels.
 * @returns The crop in CSS pixels, inside the capture.
 */
export function cropOf(spec: ScreenSpec, boxes: Box[], size: { w: number; h: number }): { x: number; y: number; w: number; h: number } {
    if (spec.crop) return spec.crop;
    if (boxes.length === 0) return { x: 0, y: 0, ...size };
    let x0 = Math.min(...boxes.map((b) => b.x)) - MARGIN;
    let y0 = Math.min(...boxes.map((b) => b.y)) - MARGIN;
    let x1 = Math.max(...boxes.map((b) => b.x + b.w)) + MARGIN;
    let y1 = Math.max(...boxes.map((b) => b.y + b.h)) + MARGIN;
    const grow = (a: number, b: number, min: number, max: number): [number, number] => {
        const need = min - (b - a);
        return need > 0 ? [Math.max(0, a - need / 2), Math.min(max, b + need / 2)] : [a, b];
    };
    [x0, x1] = grow(x0, x1, 640, size.w);
    [y0, y1] = grow(y0, y1, 240, size.h);
    const x = Math.round(Math.max(0, x0));
    const y = Math.round(Math.max(0, y0));
    return { x, y, w: Math.min(size.w - x, Math.round(Math.min(size.w, x1) - x)), h: Math.min(size.h - y, Math.round(Math.min(size.h, y1) - y)) };
}

/**
 * The SVG of the marks: each box with a white outline, a black line, and its number in a black circle.
 * @param boxes The boxes in number order, in CSS pixels relative to the crop.
 * @param w The crop width in CSS pixels.
 * @param h The crop height in CSS pixels.
 * @returns SVG text at the capture scale.
 */
export function marksSvg(boxes: Box[], w: number, h: number, masks: NonNullable<ScreenSpec['masks']> = []): string {
    const s = SCALE;
    const covers = masks.map((m) => `<rect x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" fill="#ffffff"/><text x="${m.x + m.w / 2}" y="${m.y + m.h / 2 + m.size * 0.35}" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-weight="700" font-size="${m.size}" fill="#111111">${m.text}</text>`);
    const parts = boxes.map((b, i) => {
        // The number sits on the top-right corner of the box: a field label is at the top left, and a
        // button to the right has only padding at its top-left corner.
        const r = 13;
        const cx = Math.min(w - r - 2, b.x + b.w + 4);
        const cy = Math.max(r + 2, b.y - 4);
        return {
            box: `<rect x="${b.x - 4}" y="${b.y - 4}" width="${b.w + 8}" height="${b.h + 8}" rx="8" fill="none" stroke="#ffffff" stroke-width="7"/>`
                + `<rect x="${b.x - 4}" y="${b.y - 4}" width="${b.w + 8}" height="${b.h + 8}" rx="8" fill="none" stroke="#000000" stroke-width="3.5"/>`,
            number: `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#000000" stroke="#ffffff" stroke-width="3"/>`
                + `<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-family="Open Sans, Arial, sans-serif" font-weight="700" font-size="17" fill="#ffffff">${i + 1}</text>`,
        };
    });
    // All boxes first, then all numbers: a box line never covers a number.
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * s}" height="${h * s}" viewBox="0 0 ${w} ${h}">${covers.join('')}${parts.map((p) => p.box).join('')}${parts.map((p) => p.number).join('')}</svg>`;
}

async function main(argv: string[]): Promise<number> {
    let inDir = path.join(os.homedir(), 'Desktop', 'primary-parity-progress', 'captures', 'pr-boonyathat-start-kit');
    let outDir = path.join(process.cwd(), 'assets', 'teacher-manual', 'app');
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--in') inDir = path.resolve(argv[++i]);
        else if (a === '--out') outDir = path.resolve(argv[++i]);
        else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
    }
    fs.mkdirSync(outDir, { recursive: true });
    const index: Record<string, { file: string; width: number; height: number; capture: string; marks: string[] }> = {};
    for (const spec of SCREENS) {
        const png = path.join(inDir, `${spec.capture}.png`);
        const all = JSON.parse(fs.readFileSync(path.join(inDir, `${spec.capture}.json`), 'utf8')) as Box[];
        const boxes = spec.marks.map((label) => {
            const box = all.find((b) => b.label === label);
            if (!box) throw new Error(`${spec.id}: no box "${label}" in ${spec.capture}.json`);
            return box;
        });
        const meta = await sharp(png).metadata();
        const size = { w: (meta.width ?? 0) / SCALE, h: (meta.height ?? 0) / SCALE };
        const crop = cropOf(spec, boxes, size);
        const local = boxes.map((b) => ({ ...b, x: b.x - crop.x, y: b.y - crop.y }));
        const masks = (spec.masks ?? []).map((m) => ({ ...m, x: m.x - crop.x, y: m.y - crop.y }));
        const file = `${spec.id}.jpg`;
        await sharp(png)
            .extract({ left: crop.x * SCALE, top: crop.y * SCALE, width: crop.w * SCALE, height: crop.h * SCALE })
            .composite([{ input: Buffer.from(marksSvg(local, crop.w, crop.h, masks)), left: 0, top: 0 }])
            .flatten({ background: '#ffffff' })
            .jpeg({ quality: 82 })
            .toFile(path.join(outDir, file));
        index[spec.id] = { file, width: crop.w * SCALE, height: crop.h * SCALE, capture: spec.capture, marks: spec.marks };
        console.log(`${spec.id}: ${spec.capture} (${spec.marks.length} marks, ${crop.w} x ${crop.h} CSS px)`);
    }
    fs.writeFileSync(path.join(outDir, 'screens.json'), `${JSON.stringify(index, null, 2)}\n`);
    console.log(`${SCREENS.length} screens in ${path.relative(process.cwd(), outDir)}/`);
    return 0;
}

if (process.argv[1] && /mark-captures\.ts$/.test(process.argv[1])) {
    main(process.argv.slice(2)).then(
        (code) => (process.exitCode = code),
        (e) => {
            console.error(e instanceof Error ? e.message : e);
            process.exitCode = 1;
        },
    );
}
