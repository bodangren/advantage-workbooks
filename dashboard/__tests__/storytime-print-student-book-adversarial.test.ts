// @vitest-environment jsdom
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_QR_HOST, STORYTIME_ROOT, storytimeQrUrl, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

/**
 * Phase 2 adversarial guards for the week 1 student workbook.
 *
 * The guards attack three areas that the shipped Red tests do not cover:
 *
 * 1. The HTML escape of hostile week text and the QR input contract (Review B scope).
 * 2. The layout rules of the inside pages: the answer mark, the perforation, the strip
 *    marks, and the picture file names.
 * 3. The CLI and the output path: the hostile flag values and the filesystem containment.
 *
 * Every guard passes on the reviewed HEAD c8aba128. Each guard has a negative control where
 * a weaker assertion would pass vacuously (anti-patterns A4 and A7).
 */

interface PrintProfile {
    trim: { widthMm: number; heightMm: number };
    bleedMm: number;
    perforationMm: number;
    readerPage: { widthMm: number; heightMm: number };
}

interface StudentModule {
    compileStorytimeStudentBook: (
        weeks: StorytimeWeek[], options: { profile: PrintProfile; mode: 'proof' | 'final' },
    ) => { html: string } | Promise<{ html: string }>;
}

interface CliModule {
    parseStorytimeStudentBookArgs: (
        argv: string[], home: string, unit: number,
    ) => { level: number; weeks: number[]; mode: string; version: number; out?: string; outputPath: string };
    checkRequestedWeeks: (requested: number[], loaded: number[]) => void;
    checkStorytimeOutputContainment: (outputPath: string, home: string) => void;
}

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const studentModule = path.join(dashboardRoot, 'lib/storytime/print/student-book.ts');
const profileModule = path.join(dashboardRoot, 'lib/storytime/print/profile.ts');
const cliModule = path.join(dashboardRoot, 'lib/storytime/print/student-book-cli.ts');
const scriptFile = path.join(dashboardRoot, 'scripts/storytime/make-student-book-pdf.ts');
const temporaryFolders: string[] = [];

/** A hostile text that breaks out of a double-quoted attribute and of a text node. */
const HOSTILE = '"><img src=x onerror=alert(1)><script>alert(2)</script>&';

function temporaryFolder(): string {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-p2-adversarial-'));
    temporaryFolders.push(folder);
    return folder;
}

function shipped(): StorytimeWeek {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), 'utf8')));
}

/**
 * A changed week on a temporary copy. The copy passes the content schema, so the hostile
 * text reaches the print template through the real content boundary (rule 11.1).
 * @param change The change to the copy.
 * @returns The changed week.
 */
function changedWeek(change: (copy: StorytimeWeek) => void): StorytimeWeek {
    const file = path.join(temporaryFolder(), 'changed-week.json');
    const copy = JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), 'utf8')) as StorytimeWeek;
    change(copy);
    fs.writeFileSync(file, JSON.stringify(copy));
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
}

async function render(week: StorytimeWeek = shipped()): Promise<{ html: string; doc: Document }> {
    const student = await import(studentModule) as StudentModule;
    const profile = await import(profileModule) as { STORYTIME_PRINT_PROFILE: PrintProfile };
    const { html } = await student.compileStorytimeStudentBook([week], {
        profile: profile.STORYTIME_PRINT_PROFILE, mode: 'proof',
    });
    expect(html).toBeTypeOf('string');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelectorAll('.student-page').length, 'Render physical page sides.').toBeGreaterThan(0);
    return { html, doc };
}

async function cli(): Promise<CliModule> {
    expect(fs.existsSync(cliModule), 'Missing module: lib/storytime/print/student-book-cli.ts.').toBe(true);
    const mod = await import(cliModule) as CliModule;
    expect(typeof mod.parseStorytimeStudentBookArgs, 'Export parseStorytimeStudentBookArgs.').toBe('function');
    expect(typeof mod.checkStorytimeOutputContainment, 'Export checkStorytimeOutputContainment.').toBe('function');
    return mod;
}

function pages(doc: Document): Element[] {
    return Array.from(doc.querySelectorAll('.student-page'));
}

function page(doc: Document, kind: string): Element {
    const found = doc.querySelectorAll(`.student-page[data-page-kind="${kind}"]`);
    expect(found.length, `Exactly one ${kind} page must print.`).toBe(1);
    return found[0];
}

function part(root: ParentNode, name: string): Element {
    const found = root.querySelectorAll(`[data-part="${name}"]`);
    expect(found.length, `Exactly one ${name} must print.`).toBe(1);
    return found[0];
}

function text(element: Element): string {
    return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function texts(root: ParentNode, selector: string): string[] {
    return Array.from(root.querySelectorAll(selector), text);
}

/** The hostile fields that print as text or as an attribute value. */
function poisonEnglish(week: StorytimeWeek): void {
    week.print!.practice[0].text = HOSTILE;
    week.print!.letterBox.formationWords = HOSTILE;
    week.print!.letterBox.startPoint = HOSTILE;
    week.print!.dictation.words[0] = HOSTILE;
    week.print!.writing.traceText = HOSTILE;
    week.home!.words[0] = HOSTILE;
    week.home!.line.en = HOSTILE;
    week.home!.activity.en = HOSTILE;
    week.song!.lines[0].text = HOSTILE;
    week.focus.frame = HOSTILE;
    week.focus.element!.sound = HOSTILE;
    week.books[0].title = HOSTILE;
}

describe('Adversarial guards: the Phase 2 student workbook of week 1', () => {
    afterAll(() => {
        for (const folder of temporaryFolders) fs.rmSync(folder, { recursive: true, force: true });
    });

    // ---- Area 1: the HTML escape and the QR input ----

    it('A1: keeps hostile week text out of the markup', async () => {
        const clean = await render();
        const dirty = await render(changedWeek(poisonEnglish));
        expect(dirty.doc.querySelectorAll('*').length, 'The hostile text must not add an element.')
            .toBe(clean.doc.querySelectorAll('*').length);
        expect(dirty.doc.querySelectorAll('script').length, 'The hostile text must not make a script element.').toBe(0);
        expect(dirty.doc.querySelectorAll('img').length, 'The hostile text must not make an image element.').toBe(0);
        for (const element of Array.from(dirty.doc.querySelectorAll('*'))) {
            for (const attribute of Array.from(element.attributes)) {
                expect(attribute.name.toLowerCase().startsWith('on'),
                    `The attribute ${attribute.name} must not be an event handler.`).toBe(false);
            }
        }
    }, 30000);

    it('A1: prints hostile week text as literal text', async () => {
        const dirty = await render(changedWeek(poisonEnglish));
        const practice = page(dirty.doc, 'practice');
        expect(texts(practice, '[data-part="practice-text"]')[0]).toBe(HOSTILE);
        expect(text(part(practice, 'formation-words'))).toBe(HOSTILE);
        expect(text(part(practice, 'letter'))).toBe('n');
        const front = page(dirty.doc, 'home-front');
        expect(texts(front, '[data-part="home-word"]')[0]).toBe(HOSTILE);
        expect(text(part(front, 'home-frame'))).toBe(HOSTILE);
        expect(text(part(front, 'home-sound'))).toBe(HOSTILE);
        const back = page(dirty.doc, 'home-back');
        expect(text(part(back, 'home-line'))).toBe(HOSTILE);
        expect(texts(back, '[data-part="song-line"]')[0]).toBe(HOSTILE);
        expect(text(part(page(dirty.doc, 'writing'), 'writing-trace'))).toBe(HOSTILE);
    }, 30000);

    it('A1: keeps a hostile start point inside its attribute', async () => {
        const dirty = await render(changedWeek(poisonEnglish));
        const dot = dirty.doc.querySelector('.letter-box [data-part="start-dot"]');
        expect(dot, 'The letter box must draw a start dot.').not.toBeNull();
        expect(dot!.getAttribute('data-start-point')).toBe(HOSTILE);
        expect(dirty.doc.querySelectorAll('.letter-box [data-part="start-dot"]').length).toBe(1);
    }, 30000);

    it('A1: keeps hostile Thai text as text and creates no element', async () => {
        const dirty = await render(changedWeek((copy) => {
            copy.home!.line.th = HOSTILE;
            copy.home!.activity.th = HOSTILE;
        }));
        const front = page(dirty.doc, 'home-front');
        expect(text(part(front, 'home-line'))).toBe(HOSTILE);
        expect(text(part(front, 'home-activity'))).toBe(HOSTILE);
        expect(front.querySelectorAll('.th-run').length, 'Each Thai run keeps one span.')
            .toBe(2 * HOSTILE.split(/\s+/).filter(Boolean).length);
        expect(dirty.doc.querySelectorAll('script').length).toBe(0);
        expect(dirty.doc.querySelectorAll('img').length).toBe(0);
    }, 30000);

    it('A1: catches a broken copy that injects the raw payload', async () => {
        const clean = await render();
        expect(clean.html.split('>n n n<').length - 1, 'The control must have one practice text.').toBe(1);
        const broken = clean.html.replace('>n n n<', `>${HOSTILE}<`);
        expect(broken, 'The control must change the page.').not.toBe(clean.html);
        const doc = new DOMParser().parseFromString(broken, 'text/html');
        expect(doc.querySelectorAll('img').length, 'The raw payload must create an element.').toBeGreaterThan(0);
        expect(doc.querySelectorAll('script').length, 'The raw payload must create an element.').toBeGreaterThan(0);
    }, 30000);

    it.each([
        'https://evil.example/th/st/2/1',
        '//evil.example/th/st/2/1',
        '/th/stx/2/1',
        '/TH/ST/2/1',
        ' /th/st/2/1',
        '/en/st/2/1',
        '',
    ])('A1: rejects the QR path "%s"', (input) => {
        expect(() => storytimeQrUrl(input)).toThrow();
    }, 30000);

    it('A1: prints the canonical S23 address for both codes of the home front', async () => {
        const { doc } = await render();
        const codes = Array.from(page(doc, 'home-front').querySelectorAll('[data-qr-input]'));
        expect(codes).toHaveLength(2);
        for (const code of codes) {
            const address = code.getAttribute('data-qr-input') ?? '';
            expect(address.startsWith(STORYTIME_QR_HOST), 'The address keeps the S23 host.').toBe(true);
            expect(address, 'The address keeps the Storytime route.').toMatch(/^https:\/\/storytime\.reading-advantage\.com\/th\/st\/2\/1(?:\?part=(?:song|book))?$/);
            expect(code.querySelector('svg'), 'Each code must print a QR module grid.').not.toBeNull();
        }
    }, 30000);

    it('A1: stops the build when the QR query is hostile', async () => {
        const week = changedWeek((copy) => {
            copy.home!.songUrl = '/th/st/2/1?part=song&x=<script>alert(1)</script>';
        });
        await expect(render(week)).rejects.toThrow('/th/st/2/1?part=song&x=<script>alert(1)</script>');
    }, 30000);

    it.each(['https://evil.example/th/st/2/1', '//evil.example/th/st/2/1'])(
        'A1: stops the build when the QR path is "%s"', async (url) => {
            const week = changedWeek((copy) => { copy.home!.songUrl = url; });
            await expect(render(week)).rejects.toThrow(url);
        }, 30000);

    // ---- Area 2: the layout rules of the inside pages ----

    it('A2: never prints the answer of a check row', async () => {
        const week = changedWeek((copy) => {
            const item = copy.check.items[0];
            if ('answer' in item) item.answer = 'ZZ-ANSWER-9f3';
        });
        const { html, doc } = await render(week);
        expect(html, 'The answer of a check row must not print.').not.toContain('ZZ-ANSWER-9f3');
        expect(text(page(doc, 'check')), 'The answer of a check row must not print.').not.toContain('ZZ-ANSWER-9f3');
        // The control: the same check must catch the answer when a broken page prints it.
        const broken = html.replace('<p class="check-cue">', '<p class="check-cue">ZZ-ANSWER-9f3 ');
        expect(broken, 'The control must print the answer.').toContain('ZZ-ANSWER-9f3');
    }, 30000);

    it('A2: carries no answer element anywhere in the book', async () => {
        const { doc } = await render();
        expect(doc.querySelectorAll('[data-answer], [data-correct], [data-solution], .answer, .correct, .answer-mark, .selected').length,
            'The book must carry no answer element.').toBe(0);
        for (const side of pages(doc)) {
            expect(text(side), `The ${side.getAttribute('data-page-kind')} side must carry no answer mark.`)
                .not.toMatch(/[✓✔☑]/);
        }
    }, 30000);

    it('A2: marks only the tear-out sides with a perforation', async () => {
        const { doc } = await render();
        const tearOut = ['home-front', 'home-back', 'reader'];
        for (const side of pages(doc)) {
            const kind = side.getAttribute('data-page-kind') ?? '';
            const marks = side.querySelectorAll('[data-part="perforation"]').length;
            expect(marks, `The ${kind} side must carry ${tearOut.includes(kind) ? 1 : 0} perforation mark(s).`)
                .toBe(tearOut.includes(kind) ? 1 : 0);
        }
    }, 30000);

    it('A2: names the reader, the strip number, and the back side on every strip mark', async () => {
        const { doc } = await render();
        const readerSides = pages(doc).filter((side) => side.getAttribute('data-page-kind') === 'reader');
        expect(readerSides).toHaveLength(6);
        readerSides.forEach((side, index) => {
            const strips = Array.from(side.querySelectorAll('[data-part="reader-strip"]'));
            expect(strips).toHaveLength(2);
            for (const strip of strips) {
                const mark = (strip.querySelector('.strip-mark')?.textContent ?? '').trim();
                expect(mark, 'Each strip mark names the book and the strip number.').toMatch(/^.+ · strip [123] of 3( \(back\))?$/);
                expect(mark.includes('(back)'), 'Only a back side names the back.').toBe(index % 2 === 1);
            }
        }, 30000);
    });

    it('A2: gives each reader the strips 1, 2, and 3 over three leaves', async () => {
        const { doc } = await render();
        const strips = Array.from(doc.querySelectorAll('[data-part="reader-strip"]'));
        expect(strips).toHaveLength(12);
        const byReader = new Map<string, Set<string>>();
        for (const strip of strips) {
            const reader = strip.getAttribute('data-reader') ?? '';
            const number = strip.getAttribute('data-strip') ?? '';
            if (!byReader.has(reader)) byReader.set(reader, new Set());
            byReader.get(reader)!.add(number);
        }
        expect([...byReader.keys()].sort()).toEqual(['decodable', 'readalong']);
        for (const numbers of byReader.values()) expect([...numbers].sort()).toEqual(['1', '2', '3']);
        expect(pages(doc).filter((side) => side.getAttribute('data-page-kind') === 'reader')).toHaveLength(6);
    }, 30000);

    it('A2: fills each reader side with the R32 reader pages and keeps both strip marks', async () => {
        const { doc } = await render();
        const readerSides = pages(doc).filter((side) => side.getAttribute('data-page-kind') === 'reader');
        const expectedBySide = [
            [12, 1, 10, 3], [2, 11, 4, 9],
            [8, 5, 12, 1], [6, 7, 2, 11],
            [10, 3, 8, 5], [4, 9, 6, 7],
        ];
        for (const [sideIndex, side] of readerSides.entries()) {
            const strips = Array.from(side.querySelectorAll('[data-part="reader-strip"]'));
            const sideName = sideIndex % 2 === 0 ? 'front' : 'back';
            const pageNumbers: number[] = [];
            expect(strips).toHaveLength(2);
            for (const strip of strips) {
                expect((strip.querySelector('.strip-mark')?.textContent ?? '').trim()).toMatch(/^.+ · strip [123] of 3( \(back\))?$/);
                const readerPages = Array.from(strip.querySelectorAll('[data-reader-page]'));
                expect(readerPages).toHaveLength(2);
                for (const page of readerPages) {
                    const pageNumber = Number(page.getAttribute('data-page-number'));
                    pageNumbers.push(pageNumber);
                    const expectedPictureCount = pageNumber === 1 || (pageNumber >= 3 && pageNumber <= 10) ? 1 : 0;
                    const pictureBoxes = Array.from(page.querySelectorAll('[data-picture-id]'));
                    expect(pictureBoxes, `Reader page ${pageNumber} picture-box count.`).toHaveLength(expectedPictureCount);
                    expect(pictureBoxes.filter((box) => text(box) === 'PICTURE MISSING'),
                        `Reader page ${pageNumber} proof-placeholder count.`).toHaveLength(expectedPictureCount);
                    expect(text(page), `Reader page ${pageNumber} text.`).not.toBe('');
                }
            }
            expect(pageNumbers, `A2 ${sideName} side has its own duplex page set.`).toEqual(expectedBySide[sideIndex]);
        }
    }, 30000);

    it('A2: prints the two QR codes on the home front and none on the back', async () => {
        const { doc } = await render();
        expect(page(doc, 'home-front').querySelectorAll('[data-qr-input]')).toHaveLength(2);
        expect(page(doc, 'home-back').querySelectorAll('[data-qr-input]')).toHaveLength(0);
        expect(page(doc, 'home-back').querySelectorAll('svg')).toHaveLength(0);
    }, 30000);

    it('A2: keeps the blank aligner side empty', async () => {
        const { doc } = await render();
        const blanks = pages(doc).filter((side) => side.getAttribute('data-page-kind') === 'blank');
        expect(blanks.length, 'The spread needs one aligner side.').toBeGreaterThan(0);
        for (const blank of blanks) {
            expect(text(blank), 'An aligner side holds no text.').toBe('');
            expect(blank.querySelectorAll('[data-student-work]').length).toBe(0);
            expect(blank.querySelectorAll('[data-part="perforation"]').length).toBe(0);
        }
    }, 30000);

    it('A2: names only the line-art picture file in any attribute', async () => {
        const week = shipped();
        const { storytimePrintPictures } = await import('../lib/storytime/print/pictures');
        const rows = storytimePrintPictures([week]);
        const printed = rows.filter((row) => row.use === 'check-row' || row.use === 'practice-line');
        expect(printed.length).toBeGreaterThan(0);
        const { html, doc } = await render(week);
        for (const row of printed) {
            expect(html, `The color file name ${row.fileName} must not print.`).not.toContain(row.fileName);
            expect(html, `The line-art file name ${row.lineArtFileName} must print.`).toContain(row.lineArtFileName);
        }
        // One pass over all attribute values, so the guard stays fast under load.
        const attributeValues = Array.from(doc.querySelectorAll('*'))
            .flatMap((element) => Array.from(element.attributes, (attribute) => attribute.value)).join('\n');
        for (const row of rows) {
            expect(attributeValues, `No attribute may name the color file ${row.fileName}.`)
                .not.toContain(row.fileName);
        }
    }, 30000);

    // ---- Area 3: the CLI and the output path ----

    it.each([
        '1;2',
        '1 2',
        '',
        '1,',
        ',1',
        '1,,1',
        '99999999999999999999',
        '-1',
        '1_0',
        '1e999',
        '0.5',
    ])('A3: rejects the --weeks value "%s"', async (value) => {
        const mod = await cli();
        expect(() => mod.parseStorytimeStudentBookArgs(['--level', '2', '--weeks', value], '/home/student', 1),
            `Reject the --weeks value "${value}".`).toThrow();
    }, 30000);

    it.each(['0', '-1', '1.5', 'Infinity', 'NaN', '9007199254740993', '1e999'])(
        'A3: rejects the --version value "%s"', async (value) => {
            const mod = await cli();
            expect(() => mod.parseStorytimeStudentBookArgs(['--level', '2', '--weeks', '1', '--version', value], '/home/student', 1),
                `Reject the --version value "${value}".`).toThrow();
        }, 30000);

    it.each(['--level', '--weeks', '--out'])('A3: rejects %s without a value', async (flag) => {
        const mod = await cli();
        expect(() => mod.parseStorytimeStudentBookArgs(['--level', '2', '--weeks', '1', flag], '/home/student', 1),
            `Reject ${flag} without a value.`).toThrow();
    }, 30000);

    it('A3: rejects an unknown argument', async () => {
        const mod = await cli();
        expect(() => mod.parseStorytimeStudentBookArgs(['--level', '2', '--weeks', '1', '--unknown'], '/home/student', 1)).toThrow();
    }, 30000);

    it('A3: rejects both build modes at once', async () => {
        const mod = await cli();
        expect(() => mod.parseStorytimeStudentBookArgs(
            ['--level', '2', '--weeks', '1', '--proof', '--final'], '/home/student', 1)).toThrow();
    }, 30000);

    it('A3: rejects an --out path that is not a PDF file inside the print folder', async () => {
        const mod = await cli();
        const home = path.join(temporaryFolder(), 'home');
        const folder = path.join(home, 'Desktop', 'print-ready', 'storytime');
        const cases = [
            'relative.pdf',
            '~',
            path.join(folder, 'x.PDF'),
            folder,
            `${folder}${path.sep}`,
            path.join(folder, '..', 'x.pdf'),
            path.join(folder, 'sub', '..', 'x.txt'),
        ];
        for (const out of cases) {
            expect(() => mod.parseStorytimeStudentBookArgs(['--level', '2', '--weeks', '1', '--out', out], home, 1),
                `Reject the output target ${out}.`).toThrow();
        }
    }, 30000);

    it('A3: accepts an --out path inside the print folder', async () => {
        const mod = await cli();
        const home = path.join(temporaryFolder(), 'home');
        const folder = path.join(home, 'Desktop', 'print-ready', 'storytime');
        const cases = [
            path.join(folder, 'x.pdf'),
            path.join(folder, 'sub', 'x.pdf'),
            path.join(folder, 'sub', '..', 'x.pdf'),
        ];
        for (const out of cases) {
            expect(() => mod.parseStorytimeStudentBookArgs(['--level', '2', '--weeks', '1', '--out', out], home, 1),
                `Accept the output target ${out}.`).not.toThrow();
        }
    }, 30000);

    it('A3: rejects an output below a chain of two links that ends outside', async () => {
        const mod = await cli();
        const root = temporaryFolder();
        const home = path.join(root, 'home');
        const folder = path.join(home, 'Desktop', 'print-ready', 'storytime');
        const outside = path.join(root, 'outside');
        fs.mkdirSync(folder, { recursive: true });
        fs.mkdirSync(outside, { recursive: true });
        fs.symlinkSync(outside, path.join(folder, 'chain-a'), 'dir');
        fs.symlinkSync('chain-a', path.join(folder, 'chain-b'), 'dir');
        expect(() => mod.checkStorytimeOutputContainment(path.join(folder, 'chain-b', 'x.pdf'), home),
            'Reject an output below a chain of two links that ends outside.').toThrow();
        expect(() => mod.checkStorytimeOutputContainment(path.join(folder, 'x.pdf'), home),
            'Accept a plain output inside the print folder.').not.toThrow();
    }, 30000);

    it('A3: rejects an output below a relative link that points outside', async () => {
        const mod = await cli();
        const root = temporaryFolder();
        const home = path.join(root, 'home');
        const folder = path.join(home, 'Desktop', 'print-ready', 'storytime');
        fs.mkdirSync(folder, { recursive: true });
        fs.mkdirSync(path.join(root, 'outside'), { recursive: true });
        fs.symlinkSync('../../../../outside', path.join(folder, 'rel-out'), 'dir');
        fs.symlinkSync('rel-out', path.join(folder, 'rel-chain'), 'dir');
        expect(() => mod.checkStorytimeOutputContainment(path.join(folder, 'rel-out', 'x.pdf'), home),
            'Reject an output below a relative link that points outside.').toThrow();
        expect(() => mod.checkStorytimeOutputContainment(path.join(folder, 'rel-chain', 'x.pdf'), home),
            'Reject an output below a relative chain that points outside.').toThrow();
        expect(() => mod.checkStorytimeOutputContainment(path.join(folder, 'x.pdf'), home),
            'Accept a plain output inside the print folder.').not.toThrow();
    }, 30000);

    it('A3: rejects an output that is a link to an outside file', async () => {
        const mod = await cli();
        const root = temporaryFolder();
        const home = path.join(root, 'home');
        const folder = path.join(home, 'Desktop', 'print-ready', 'storytime');
        fs.mkdirSync(folder, { recursive: true });
        fs.mkdirSync(path.join(root, 'outside'), { recursive: true });
        fs.writeFileSync(path.join(root, 'outside', 'existing.pdf'), 'outside');
        fs.symlinkSync('../../../../outside/existing.pdf', path.join(folder, 'rel-file.pdf'), 'file');
        expect(() => mod.checkStorytimeOutputContainment(path.join(folder, 'rel-file.pdf'), home),
            'Reject an output that is a relative link to an outside file.').toThrow();
        expect(() => mod.checkStorytimeOutputContainment(path.join(folder, 'x.pdf'), home),
            'Accept a plain output inside the print folder.').not.toThrow();
    }, 30000);

    it('A3: runs the output check before the write and the browser', async () => {
        expect(fs.existsSync(scriptFile), 'Missing script: scripts/storytime/make-student-book-pdf.ts.').toBe(true);
        const ts = await import('typescript');
        const source = ts.createSourceFile(scriptFile, fs.readFileSync(scriptFile, 'utf8'), ts.ScriptTarget.Latest, true);
        const calls = new Map<string, number>();
        const visit = (node: import('typescript').Node): void => {
            if (ts.isCallExpression(node)) {
                const name = node.expression.getText(source);
                if (!calls.has(name)) calls.set(name, node.getStart(source));
            }
            ts.forEachChild(node, visit);
        };
        visit(source);
        const check = calls.get('checkStorytimeOutputContainment');
        expect(check, 'The build must call checkStorytimeOutputContainment.').toBeDefined();
        for (const later of ['fs.mkdirSync', 'chromium.launch', 'execFileSync']) {
            expect(calls.get(later), `The build must call ${later}.`).toBeDefined();
            expect(check!, `The output check must run before ${later}.`).toBeLessThan(calls.get(later)!);
        }
    }, 30000);

    it('A3: writes the file that the output check covers', async () => {
        const ts = await import('typescript');
        const source = ts.createSourceFile(scriptFile, fs.readFileSync(scriptFile, 'utf8'), ts.ScriptTarget.Latest, true);
        let checked = '';
        let written = '';
        let assigned = '';
        const visit = (node: import('typescript').Node): void => {
            if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'out') {
                assigned = node.initializer?.getText(source) ?? '';
            }
            if (ts.isCallExpression(node)) {
                const name = node.expression.getText(source);
                if (name === 'checkStorytimeOutputContainment') {
                    const arg = node.arguments[0];
                    if (arg) checked = arg.getText(source);
                }
                if (name === 'execFileSync') {
                    const args = node.arguments[1];
                    if (args && ts.isArrayLiteralExpression(args)) {
                        args.elements.forEach((element, index) => {
                            if (ts.isStringLiteral(element) && element.text === '--out') {
                                const next = args.elements[index + 1];
                                if (next) written = next.getText(source);
                            }
                        }, 30000);
                    }
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(source);
        expect(checked, 'The output check must cover the parsed output path.').toBe('outputPath');
        expect(written, 'The PDF/X call must write the output path.').toBe('out');
        expect(assigned, 'The written path must hold the checked path.').toBe('outputPath');
    });
});
