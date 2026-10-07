import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { BACK_LINES, backText, richHtml } from '../lib/covers/back-text';
import { COVER_BOOKS, coverBook } from '../lib/covers/catalogue';
import { CoverDataSchema, CoverSeriesSchema } from '../lib/covers/schema';
import { BACK_TEXT, COVER_FONT_FACES, backPage } from '../lib/covers/template';

// Track book_covers_20261007: the back text and the back page.
const SERIES = { Origins: ['ซีรีส์ **{series}**'], Quest: ['ซีรีส์ **{series}**'] };
const DATA = { back: { book: '**{book}** มี **{lessons}** บทเรียน', canDo: ['อ่าน', 'เขียน'] } };

describe('cover back text', () => {
    it('fills the names from the catalogue and adds the next-book point', () => {
        const t = backText(coverBook('origins-3.2'), DATA, SERIES);
        expect(t.seriesHeading).toBe('เกี่ยวกับซีรีส์ **Origins**');
        expect(t.bookParagraph).toBe('**Origins 3.2** มี **14** บทเรียน');
        expect(t.canDo).toEqual(['อ่าน', 'เขียน', 'พร้อมก้าวสู่ **Quest 4** เพื่อเดินทางต่อไป']);
        expect(t.contact).toBe(BACK_LINES.contact);
    });

    it('adds no next-book point on the last book, and fails on a copy error or a missing series', () => {
        expect(backText(coverBook('adventure-9.3'), DATA, { Adventure: ['p'] }).canDo).toEqual(['อ่าน', 'เขียน']);
        expect(() => backText(coverBook('quest-4'), { back: { ...DATA.back, book: 'Origins 2' } }, SERIES)).toThrow('back.book: names "Origins 2"');
        expect(() => backText(coverBook('adventure-7.1'), DATA, SERIES)).toThrow('no Adventure paragraphs');
    });

    it('keeps each run between spaces on one line, breaks at |, and keeps bold across spaces', () => {
        expect(richHtml('a **b c** d', true)).toBe('<span class="ph">a</span> <span class="ph"><b>b</b></span> <span class="ph"><b>c</b></span> <span class="ph">d</span>');
        expect(richHtml('ออกแบบมา|สำหรับ', true)).toBe('<span class="ph">ออกแบบมา</span><wbr><span class="ph">สำหรับ</span>');
        expect(richHtml('x|y <z>\n**w**')).toBe('xy &lt;z&gt;<br><b>w</b>');
    });
});

describe('cover back page', () => {
    it('places the two text boxes at the measured baselines and limits', () => {
        const page = backPage('data:image/jpeg;base64,AAAA', backText(coverBook('quest-4'), DATA, SERIES));
        expect(page).toContain(`data-baseline="${BACK_TEXT.body.baseline}" data-bottom="${BACK_TEXT.body.bottom}"`);
        expect(page).toContain(`data-baseline="${BACK_TEXT.contact.baseline}" data-bottom="${BACK_TEXT.contact.bottom}"`);
        expect(page.match(/class="baseline-mark"/g)).toHaveLength(2);
        expect(page).toContain('<li><span class="ph">พร้อมก้าวสู่</span> <span class="ph"><b>Quest</b></span> <span class="ph"><b>5</b></span>');
    });

    it('scales Noto Sans Thai to the measured Thai size, and has every font file', () => {
        expect(COVER_FONT_FACES.filter((f) => f.family === 'Noto Sans Thai').map((f) => f.sizeAdjust)).toEqual(['83.18%', '83.18%']);
        for (const f of COVER_FONT_FACES) expect(fs.existsSync(path.join(process.cwd(), 'assets', 'print-fonts', f.file)), f.file).toBe(true);
    });
});

describe('cover data files', () => {
    const dir = path.join(process.cwd(), '..', 'content', 'covers');
    const series = CoverSeriesSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, 'series.json'), 'utf8')));
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'series.json');

    it('has a valid file for each book that passes the copy check', () => {
        expect(files.length).toBeGreaterThanOrEqual(5);
        for (const f of files) {
            const data = CoverDataSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
            expect(`${data.book}.json`).toBe(f);
            expect(COVER_BOOKS).toContain(data.book);
            expect(() => backText(coverBook(data.book), data, series), f).not.toThrow();
        }
    });
});

describe('cover contact lines', () => {
    it('has the Thai phone form and the brand spelling (Daniel, 2026-10-07)', () => {
        expect(BACK_LINES.contact).toContain('โทรศัพท์: **099-005-8038**');
        expect(BACK_LINES.contact).toContain('**TikTok @reading.advantage**');
        expect(BACK_LINES.contact.join(' ')).not.toMatch(/\+66|Tiktok/);
    });
});
