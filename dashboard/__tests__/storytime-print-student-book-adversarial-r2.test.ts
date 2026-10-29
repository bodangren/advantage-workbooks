// @vitest-environment jsdom
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_QR_HOST, STORYTIME_ROOT, storytimeQrUrl, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

/**
 * Phase 2 adversarial guards, round 2, for the week 1 student workbook.
 *
 * Round 1 (adversarial-c8aba128) found the blocking QR defect: storytimeQrUrl accepted a path
 * that leaves the /th/st/ route. Red 2i and Green 2i (commit 8e929982) now accept only
 * `/th/st/<level>/<week>` with level 1 to 4 and week 1 to 32, and one optional `?part=book`,
 * `?part=decodable`, or `?part=song`. The shipped Red R48 cases already cover the dot segments,
 * the range edges 0 and 5 and 0 and 33, the leading zeros, the trailing space, tab, and newline,
 * the fragment, the wrong query key, the unknown part value, the doubled query, and the upper-case
 * part value, so no guard here repeats them.
 *
 * This round attacks what R48 and round 1 do not cover (Review B finding B-P2-08 names the gap):
 * percent-encoded forms, the backslash, non-ASCII digits, control and unicode separators,
 * many-digit values, the trailing slash, the bare question mark, the empty part, near-miss part
 * values, extra parameters around a valid part, a fragment after a valid query, an interior space,
 * and mixed-case routes and keys. Every guard passes on the reviewed HEAD 63cedaf0. Each reject
 * block has an accept control, so a reject-all implementation fails.
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

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const studentModule = path.join(dashboardRoot, 'lib/storytime/print/student-book.ts');
const profileModule = path.join(dashboardRoot, 'lib/storytime/print/profile.ts');
const temporaryFolders: string[] = [];

function temporaryFolder(): string {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-p2-adversarial-r2-'));
    temporaryFolders.push(folder);
    return folder;
}

function shipped(): StorytimeWeek {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), 'utf8')));
}

/**
 * A changed week on a temporary copy. The copy passes the content schema, so the hostile
 * path reaches the print template through the real content boundary (rule 11.1).
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

function page(doc: Document, kind: string): Element {
    const found = doc.querySelectorAll(`.student-page[data-page-kind="${kind}"]`);
    expect(found.length, `Exactly one ${kind} page must print.`).toBe(1);
    return found[0];
}

/** Reject probes that R48 and round 1 do not cover. Each must throw. */
const QR_REJECT_R2 = [
    // Percent-encoded forms: no decoded dot, slash, digit, query, or fragment reaches print.
    '/th/st/2/1%2e',
    '/th/st/2%2F1',
    '/th/st/%32/1',
    '/th/st/2/%31',
    '/th/st/2/1%3Fpart=song',
    '/th/st/2/1%23x',
    '/th/st/2/1?part=%73ong',
    '/th/st/2/1?part=%3Cscript%3E',
    // Non-ASCII digits: the digit class matches ASCII only, so no other digit prints.
    '/th/st/२/1',
    '/th/st/2/١',
    '/th/st/２/1',
    // Control and unicode separators inside or after the path.
    '/th/st/2/1\r',
    '/th/st/2/1\u2028',
    '/th/st/2/1\u00a0',
    // The backslash is not a segment separator of the canonical path.
    '/th/st/2\\1',
    '/th/st\\2/1',
    // Many-digit values stay outside the level 1 to 4 and week 1 to 32 ranges.
    '/th/st/12345678901234567890123456789/1',
    '/th/st/4/12345678901234567890123456789',
    // Range edges that R48 does not name.
    '/th/st/4/33',
    '/th/st/1/0',
    // Format edges: a trailing slash, a bare question mark, and an empty part.
    '/th/st/2/1/',
    '/th/st/2/1?',
    '/th/st/2/1?part=',
    // Near-miss part values and keys.
    '/th/st/2/1?part=Book',
    '/th/st/2/1?part=songs',
    '/th/st/2/1?part=decodables',
    '/th/st/2/1?part=song ',
    '/th/st/2/1?Part=song',
    // A valid part with more around it: an extra parameter, a fragment, a second query.
    '/th/st/2/1?part=song&x=1',
    '/th/st/2/1?x=1&part=song',
    '/th/st/2/1?part=song#frag',
    '/th/st/2/1?part=song?x=1',
    // Spaces and case outside the canonical form.
    '/th/st/2/ 1',
    '/th/st/ 2/1',
    '/Th/st/2/1',
    '/th/ST/2/1',
] as const;

/** Accept probes that R48 does not name. Each must return the host and the path unchanged. */
const QR_ACCEPT_R2 = [
    '/th/st/2/8',
    '/th/st/4/1',
    '/th/st/3/32',
    '/th/st/3/17?part=book',
    '/th/st/4/32?part=decodable',
    '/th/st/1/32?part=song',
] as const;

describe('Adversarial guards r2: the strict QR rule of the Phase 2 student workbook', () => {
    afterAll(() => {
        for (const folder of temporaryFolders) fs.rmSync(folder, { recursive: true, force: true });
    });

    it.each([...QR_REJECT_R2])('R2: rejects the QR path "%s"', (input) => {
        expect(() => storytimeQrUrl(input), `Reject the QR path ${JSON.stringify(input)}.`).toThrow();
    }, 30000);

    it.each([...QR_ACCEPT_R2])('R2: keeps the good QR path "%s" byte-identical', (input) => {
        expect(storytimeQrUrl(input), `Keep the good path ${input} byte-identical.`)
            .toBe(`${STORYTIME_QR_HOST}${input}`);
    }, 30000);

    it('R2: names the rejected path in the error', () => {
        for (const input of ['/th/st/2/1%2F1', '/th/st/２/1', '/th/st/2/1?part=']) {
            try {
                storytimeQrUrl(input);
                expect.unreachable(`The path ${input} must throw.`);
            } catch (error) {
                expect((error as Error).message, 'The error must name the path.').toContain(input);
            }
        }
    }, 30000);

    it('R2: stops the build when the song path holds an encoded attack', async () => {
        const hostile = '/th/st/2/1?part=%3Cscript%3E';
        const week = changedWeek((copy) => { copy.home!.songUrl = hostile; });
        await expect(render(week), 'The build must stop on an encoded song path.').rejects.toThrow(hostile);
    }, 30000);

    it('R2: stops the build when the read-along path holds a non-ASCII digit', async () => {
        const hostile = '/th/st/２/1';
        const week = changedWeek((copy) => { copy.home!.readAlongUrl = hostile; });
        await expect(render(week), 'The build must stop on a non-ASCII read-along path.')
            .rejects.toThrow(hostile);
    }, 30000);

    it('R2: stops the build when the song path holds an empty part', async () => {
        const hostile = '/th/st/2/1?part=';
        const week = changedWeek((copy) => { copy.home!.songUrl = hostile; });
        await expect(render(week), 'The build must stop on an empty part.').rejects.toThrow(hostile);
    }, 30000);

    it('R2: prints the exact address of a good non-shipped path', async () => {
        const good = '/th/st/3/17?part=book';
        const week = changedWeek((copy) => { copy.home!.songUrl = good; });
        const { doc } = await render(week);
        const codes = Array.from(page(doc, 'home-front').querySelectorAll('[data-qr-input]'));
        expect(codes, 'Both codes still print.').toHaveLength(2);
        expect(codes[0].getAttribute('data-qr-input'), 'The song code keeps the good path byte-identical.')
            .toBe(`${STORYTIME_QR_HOST}${good}`);
        expect(codes[0].querySelector('svg'), 'The good path must produce a QR module grid.').not.toBeNull();
    }, 30000);

    it('R2: prints one code when the read-along path is absent', async () => {
        const week = changedWeek((copy) => { delete copy.home!.readAlongUrl; });
        const { doc } = await render(week);
        const codes = Array.from(page(doc, 'home-front').querySelectorAll('[data-qr-input]'));
        // The control: the song code still prints, so the guard is not a rule that finds no code.
        expect(codes, 'One code prints when the read-along path is absent.').toHaveLength(1);
        expect(codes[0].getAttribute('data-qr-input'), 'The song code keeps the shipped address.')
            .toBe('https://storytime.reading-advantage.com/th/st/2/1?part=song');
    }, 30000);

    it('R2: prints no code and still renders when both paths are absent', async () => {
        const week = changedWeek((copy) => { delete copy.home!.songUrl; delete copy.home!.readAlongUrl; });
        const { doc } = await render(week);
        expect(page(doc, 'home-front').querySelectorAll('[data-qr-input]').length,
            'No code prints when both paths are absent.').toBe(0);
        expect(page(doc, 'home-back'), 'The home leaf still renders.').toBeDefined();
    }, 30000);
});
