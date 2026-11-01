// @vitest-environment jsdom
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';

/**
 * Phase 4 adversarial cases (track storytime_print_r1_20261025, Forge delivery contract of the PM,
 * 2026-11-01). Each case writes small fixtures in a temporary folder under /tmp/opencode/ and never
 * writes into the picture folder of the content or into a print-ready folder. The mutation checks
 * of the adversarial role point `STORYTIME_ADV_PICTURE_CHECK` at a patched copy of picture-check.ts.
 */
const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const pictureCheckPath = process.env.STORYTIME_ADV_PICTURE_CHECK ?? path.join(dashboardRoot, 'lib/storytime/print/picture-check.ts');
const readersPath = path.join(dashboardRoot, 'lib/storytime/print/readers.ts');
const readersCliPath = path.join(dashboardRoot, 'scripts/storytime/make-readers-pdf.ts');
const batchCliPath = path.join(dashboardRoot, 'scripts/storytime/check-storytime-pictures.ts');

type BatchResult = { results: Array<{ rowId: string; status: string; reason?: string }>; exitCode: number };
type PictureApi = { checkStorytimePictureBatch: (rows: unknown[], batchFolder: string) => Promise<BatchResult> };
type ReadersApi = {
    compileStorytimeReaders: (weeks: StorytimeWeek[], o: { profile: typeof STORYTIME_PRINT_PROFILE; mode: 'proof' | 'final'; output: 'workbook' | 'a3-color' }) => { html: string };
    storytimeReaderPictureFiles: (weeks: StorytimeWeek[], o: { profile: typeof STORYTIME_PRINT_PROFILE; mode: 'proof' | 'final'; output: 'workbook' | 'a3-color'; bookTitle?: string }) => Array<{ rowId: string; fileName: string; file: string }>;
};

const scratch: string[] = [];
function temp(): string {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const dir = fs.mkdtempSync(path.join('/tmp/opencode', 'storytime-readers-adv-'));
    scratch.push(dir);
    return dir;
}
afterAll(() => scratch.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

const api = (): Promise<PictureApi> => import(pictureCheckPath) as Promise<PictureApi>;
const readers = (): Promise<ReadersApi> => import(readersPath) as Promise<ReadersApi>;
const hashOf = (file: string): string => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const shipped = (): StorytimeWeek => StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), 'utf8')));

/** A picture-list row at a small test size (the batch check reads the size from the row). */
const rowOf = (id: string, width = 200, height = 150) => ({ id, fileName: `${id}-v1.png`, lineArtFileName: `${id}-line-v1.png`, width, height });

/** A valid 8-bit sRGB color PNG with no alpha channel. */
async function writeColor(file: string, width: number, height: number, alpha = false): Promise<void> {
    const sharp = (await import('sharp')).default;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await sharp({ create: { width, height, channels: alpha ? 4 : 3, background: alpha ? { r: 59, g: 110, b: 165, alpha: 0.5 } : '#3b6ea5' } }).png().toFile(file);
}

/** A valid 8-bit grayscale line-art PNG: a white page with one black stroke. */
async function writeLine(file: string, width: number, height: number): Promise<void> {
    const sharp = (await import('sharp')).default;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const pixels = Buffer.alloc(width * height, 255);
    for (let y = Math.floor(height / 2); y < Math.min(height, Math.floor(height / 2) + 14); y++) pixels.fill(0, y * width + 10, y * width + width - 10);
    await sharp(pixels, { raw: { width, height, channels: 1 } }).png().toFile(file);
}

/** One Forge manifest job (advantage-forge `book-pictures.ts` at 11a06b9c): ready job, ready candidate, ready line art. */
function jobOf(id: string, colorFile: string, lineFile: string, hashes: { color: string; line: string }, size: { width: number; height: number }): Record<string, unknown> {
    return {
        id, week: 1, status: 'ready', selectedVersion: 1, selectedFile: colorFile, selectedSha256: hashes.color,
        candidates: [{
            jobId: id, version: 1, file: colorFile, fileSha256: hashes.color, status: 'ready',
            structural: { valid: true, ...size, sha256: hashes.color, errors: [] },
            lineArt: { file: lineFile, fileSha256: hashes.line, status: 'ready', structural: { valid: true, ...size, sha256: hashes.line, errors: [] } },
        }],
    };
}
const manifestOf = (jobs: unknown[], extra: Record<string, unknown> = {}) => ({ version: 1, batchHashAlgorithm: 'sha256', jobs, batches: [], ...extra });
const writeManifest = (dir: string, manifest: unknown): void => fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));

/**
 * Writes the two valid files of one row at `<folder>/<name>` under `dir` and returns the job. The
 * manifest path of each file is `<folder>/<name>` (a free folder prefix).
 */
async function deliverRow(dir: string, folder: string, id: string, size = { width: 200, height: 150 }): Promise<Record<string, unknown>> {
    const row = rowOf(id, size.width, size.height);
    const color = path.join(dir, folder, row.fileName);
    const line = path.join(dir, folder, row.lineArtFileName);
    await writeColor(color, size.width, size.height);
    await writeLine(line, size.width, size.height);
    return jobOf(id, path.posix.join(folder, row.fileName), path.posix.join(folder, row.lineArtFileName), { color: hashOf(color), line: hashOf(line) }, size);
}
const byId = (report: BatchResult, id: string) => report.results.find((entry) => entry.rowId === id)!;

describe('Storytime Forge batch check: adversarial cases', () => {
    it('ADV-P4-CONTROL a row with a folder prefix passes (the control for every negative case below)', async () => {
        const { checkStorytimePictureBatch } = await api();
        const dir = temp();
        writeManifest(dir, manifestOf([await deliverRow(dir, 'w01/rows', 'adv-a')]));
        const report = await checkStorytimePictureBatch([rowOf('adv-a')], dir);
        expect(report.results.map((entry) => `${entry.status} ${entry.reason ?? ''}`)).toEqual(['pass ']);
        expect(report.exitCode).toBe(0);
    }, 120_000);

    it('ADV-P4-SYMLINK fails a row whose file or folder is a symbolic link out of the batch root, and keeps the other rows', async () => {
        // A2-P4-3: the link branch of the outside-root guard has no other test. A link to a valid
        // file outside the root, a link to a folder outside the root, and a link to a sibling
        // folder whose name starts with the root name must each fail their own row.
        const { checkStorytimePictureBatch } = await api();
        const parent = temp();
        const dir = path.join(parent, 'batch');
        const sibling = path.join(parent, 'batch-evil');
        const outside = path.join(parent, 'outside');
        fs.mkdirSync(dir);
        const good = await deliverRow(dir, 'w01/rows', 'adv-good');
        // Row 1: the color and line files are real files outside the root, linked from inside.
        const fileLinkJob = await deliverRow(outside, 'x', 'adv-filelink');
        fs.mkdirSync(path.join(dir, 'links'));
        for (const name of ['adv-filelink-v1.png', 'adv-filelink-line-v1.png']) fs.symlinkSync(path.join(outside, 'x', name), path.join(dir, 'links', name));
        const fileLink = jobOf('adv-filelink', 'links/adv-filelink-v1.png', 'links/adv-filelink-line-v1.png',
            { color: hashOf(path.join(outside, 'x', 'adv-filelink-v1.png')), line: hashOf(path.join(outside, 'x', 'adv-filelink-line-v1.png')) }, { width: 200, height: 150 });
        expect(fileLinkJob.id, 'the fixture row exists outside the root').toBe('adv-filelink');
        // Row 2: a folder link to a folder outside the root.
        await deliverRow(outside, 'dirtarget', 'adv-dirlink');
        fs.symlinkSync(path.join(outside, 'dirtarget'), path.join(dir, 'w02'));
        const dirLink = jobOf('adv-dirlink', 'w02/adv-dirlink-v1.png', 'w02/adv-dirlink-line-v1.png',
            { color: hashOf(path.join(outside, 'dirtarget', 'adv-dirlink-v1.png')), line: hashOf(path.join(outside, 'dirtarget', 'adv-dirlink-line-v1.png')) }, { width: 200, height: 150 });
        // Row 3: a folder link to a sibling whose name starts with the root name (`batch-evil`).
        await deliverRow(sibling, 'inner', 'adv-sibling');
        fs.symlinkSync(path.join(sibling, 'inner'), path.join(dir, 'w03'));
        const siblingLink = jobOf('adv-sibling', 'w03/adv-sibling-v1.png', 'w03/adv-sibling-line-v1.png',
            { color: hashOf(path.join(sibling, 'inner', 'adv-sibling-v1.png')), line: hashOf(path.join(sibling, 'inner', 'adv-sibling-line-v1.png')) }, { width: 200, height: 150 });
        writeManifest(dir, manifestOf([good, fileLink, dirLink, siblingLink]));
        const report = await checkStorytimePictureBatch(['adv-good', 'adv-filelink', 'adv-dirlink', 'adv-sibling'].map((id) => rowOf(id)), dir);
        expect(report.results.map((entry) => entry.rowId), 'one result for each row, in request order').toEqual(['adv-good', 'adv-filelink', 'adv-dirlink', 'adv-sibling']);
        expect(byId(report, 'adv-good').status, 'the clean row after no link still passes').toBe('pass');
        for (const id of ['adv-filelink', 'adv-dirlink', 'adv-sibling']) {
            const result = byId(report, id);
            expect(result.status, `${id} fails: ${result.reason ?? ''}`).toBe('fail');
            expect(result.reason ?? '', `${id} names the link problem`).toMatch(/symbolic link|outside the batch root/i);
        }
        expect(report.exitCode).toBe(1);
    }, 120_000);

    it('ADV-P4-ROOT-LINK passes a batch that the operator opens through a symbolic link to the batch folder', async () => {
        const { checkStorytimePictureBatch } = await api();
        const parent = temp();
        const real = path.join(parent, 'real-batch');
        fs.mkdirSync(real);
        writeManifest(real, manifestOf([await deliverRow(real, 'w01/rows', 'adv-root')]));
        const link = path.join(parent, 'linked-batch');
        fs.symlinkSync(real, link);
        const report = await checkStorytimePictureBatch([rowOf('adv-root')], link);
        expect(report.results.map((entry) => `${entry.status} ${entry.reason ?? ''}`)).toEqual(['pass ']);
        expect(report.exitCode).toBe(0);
    }, 120_000);

    it('ADV-P4-SIBLING-PREFIX fails a ../ path into a sibling folder whose name starts with the batch folder name', async () => {
        const { checkStorytimePictureBatch } = await api();
        const parent = temp();
        const dir = path.join(parent, 'batch');
        const evil = path.join(parent, 'batch-evil');
        fs.mkdirSync(dir);
        const job = await deliverRow(evil, 'rows', 'adv-evil');
        const color = '../batch-evil/rows/adv-evil-v1.png';
        const line = '../batch-evil/rows/adv-evil-line-v1.png';
        const sibling = jobOf('adv-evil', color, line, { color: hashOf(path.join(evil, 'rows', 'adv-evil-v1.png')), line: hashOf(path.join(evil, 'rows', 'adv-evil-line-v1.png')) }, { width: 200, height: 150 });
        expect(job.id).toBe('adv-evil');
        writeManifest(dir, manifestOf([sibling]));
        const report = await checkStorytimePictureBatch([rowOf('adv-evil')], dir);
        expect(report.results[0].status, report.results[0].reason ?? '').toBe('fail');
        expect(report.results[0].reason ?? '').toMatch(/outside the batch root/i);
        expect(report.exitCode).toBe(1);
    }, 120_000);

    it('ADV-P4-OTHER-ROW-NAME fails a job whose files carry the names of another row, although the files are valid', async () => {
        // Delivery contract: candidate.file is <row id>-v1.png and lineArt.file is
        // <row id>-line-v1.png. A job that points at another row's files must not pass the row.
        const { checkStorytimePictureBatch } = await api();
        const dir = temp();
        await deliverRow(dir, 'w01/rows', 'adv-other');
        const wrong = jobOf('adv-mine', 'w01/rows/adv-other-v1.png', 'w01/rows/adv-other-line-v1.png',
            { color: hashOf(path.join(dir, 'w01/rows/adv-other-v1.png')), line: hashOf(path.join(dir, 'w01/rows/adv-other-line-v1.png')) }, { width: 200, height: 150 });
        writeManifest(dir, manifestOf([wrong]));
        const report = await checkStorytimePictureBatch([rowOf('adv-mine')], dir);
        expect(report.results[0].status, report.results[0].reason ?? '').toBe('fail');
        expect(report.results[0].reason ?? '').toMatch(/adv-other|file name|manifest/i);
        expect(report.exitCode).toBe(1);
    }, 120_000);

    it('ADV-P4-DECOY reads the file at the manifest path, not a file of the same name elsewhere in the batch', async () => {
        const { checkStorytimePictureBatch } = await api();
        const dir = temp();
        const good = await deliverRow(dir, 'w01/rows', 'adv-decoy');
        // A garbage file with the same name sits at the batch root and in another folder.
        fs.writeFileSync(path.join(dir, 'adv-decoy-v1.png'), 'not a png');
        fs.writeFileSync(path.join(dir, 'adv-decoy-line-v1.png'), 'not a png');
        writeManifest(dir, manifestOf([good]));
        const pass = await checkStorytimePictureBatch([rowOf('adv-decoy')], dir);
        expect(pass.results.map((entry) => `${entry.status} ${entry.reason ?? ''}`), 'the manifest path wins over the decoy').toEqual(['pass ']);
        // The reverse: the manifest points at a garbage file in a second folder that holds the same name.
        fs.mkdirSync(path.join(dir, 'old'), { recursive: true });
        fs.writeFileSync(path.join(dir, 'old', 'adv-decoy-v1.png'), 'not a png');
        fs.copyFileSync(path.join(dir, 'w01/rows/adv-decoy-line-v1.png'), path.join(dir, 'old', 'adv-decoy-line-v1.png'));
        const bad = jobOf('adv-decoy', 'old/adv-decoy-v1.png', 'old/adv-decoy-line-v1.png',
            { color: hashOf(path.join(dir, 'old/adv-decoy-v1.png')), line: hashOf(path.join(dir, 'old/adv-decoy-line-v1.png')) }, { width: 200, height: 150 });
        writeManifest(dir, manifestOf([bad]));
        const fail = await checkStorytimePictureBatch([rowOf('adv-decoy')], dir);
        expect(fail.results[0].status, 'the garbage file at the manifest path fails the row').toBe('fail');
    }, 120_000);

    it('ADV-P4-MANIFEST-SHAPES fails every row of a manifest without a jobs list, and accepts extra keys', async () => {
        const { checkStorytimePictureBatch } = await api();
        const dir = temp();
        const job = await deliverRow(dir, 'w01/rows', 'adv-shape');
        const rows = [rowOf('adv-shape')];
        for (const [label, manifest] of [
            ['no jobs key', { version: 1, batchHashAlgorithm: 'sha256', batches: [] }],
            ['jobs is an object', { version: 1, jobs: { 'adv-shape': job } }],
            ['an empty list', []],
            ['null', null],
            ['a number', 7],
            ['empty jobs', manifestOf([])],
        ] as Array<[string, unknown]>) {
            writeManifest(dir, manifest);
            const report = await checkStorytimePictureBatch(rows, dir);
            expect(report.results.map((entry) => entry.status), `${label}: the row fails`).toEqual(['fail']);
            expect(report.results[0].reason ?? '', `${label}: the reason is a text`).not.toBe('');
            expect(report.exitCode, `${label}: exit code 1`).toBe(1);
        }
        writeManifest(dir, manifestOf([{ ...job, futureField: { nested: [1, 2, 3] } }], { generatedBy: 'forge', batchId: 'w01-adv' }));
        const extra = await checkStorytimePictureBatch(rows, dir);
        expect(extra.results.map((entry) => `${entry.status} ${entry.reason ?? ''}`), 'extra keys at any level are accepted').toEqual(['pass ']);
    }, 120_000);

    it('ADV-P4-TAMPER fails a row when a file changed after the manifest, or when the manifest declares a wrong size', async () => {
        const { checkStorytimePictureBatch } = await api();
        const dir = temp();
        const tampered = await deliverRow(dir, 'w01/rows', 'adv-tamper');
        const lying = await deliverRow(dir, 'w01/rows', 'adv-lying');
        // adv-tamper: a different valid PNG replaces the color file after the manifest hash.
        await writeColor(path.join(dir, 'w01/rows/adv-tamper-v1.png'), 200, 150);
        const sharp = (await import('sharp')).default;
        await sharp({ create: { width: 200, height: 150, channels: 3, background: '#aa3b3b' } }).png().toFile(path.join(dir, 'w01/rows/adv-tamper-v1.png'));
        // adv-lying: the manifest says 4000 x 3000 for a file that is 200 x 150 (the row size).
        const candidates = lying.candidates as Array<{ structural: { width: number; height: number } }>;
        candidates[0].structural.width = 4000;
        candidates[0].structural.height = 3000;
        writeManifest(dir, manifestOf([tampered, lying]));
        const report = await checkStorytimePictureBatch([rowOf('adv-tamper'), rowOf('adv-lying')], dir);
        expect(byId(report, 'adv-tamper').status, byId(report, 'adv-tamper').reason ?? '').toBe('fail');
        expect(byId(report, 'adv-tamper').reason ?? '').toMatch(/SHA-256/i);
        expect(byId(report, 'adv-lying').status, byId(report, 'adv-lying').reason ?? '').toBe('fail');
        expect(byId(report, 'adv-lying').reason ?? '').toMatch(/pixel size/i);
        expect(report.exitCode).toBe(1);
    }, 120_000);

    it('ADV-P4-IMAGE-FACTS fails a color file with alpha, a color file in the line-art place, and a line art at the wrong size', async () => {
        const { checkStorytimePictureBatch } = await api();
        const dir = temp();
        const size = { width: 200, height: 150 };
        const hashes = (id: string) => ({ color: hashOf(path.join(dir, 'f', `${id}-v1.png`)), line: hashOf(path.join(dir, 'f', `${id}-line-v1.png`)) });
        const names = (id: string) => [`f/${id}-v1.png`, `f/${id}-line-v1.png`] as const;
        // alpha: the color file has an alpha channel.
        await writeColor(path.join(dir, 'f/adv-rgba-v1.png'), 200, 150, true);
        await writeLine(path.join(dir, 'f/adv-rgba-line-v1.png'), 200, 150);
        // swap: the color file sits in the line-art place.
        await writeColor(path.join(dir, 'f/adv-swap-v1.png'), 200, 150);
        await writeColor(path.join(dir, 'f/adv-swap-line-v1.png'), 200, 150);
        // small: the line art keeps no size of its class (150 x 112 for a 200 x 150 row).
        await writeColor(path.join(dir, 'f/adv-small-v1.png'), 200, 150);
        await writeLine(path.join(dir, 'f/adv-small-line-v1.png'), 150, 112);
        const jobs = ['adv-rgba', 'adv-swap', 'adv-small'].map((id) => jobOf(id, names(id)[0], names(id)[1], hashes(id), size));
        (jobs[2].candidates as Array<{ lineArt: { structural: { width: number; height: number } } }>)[0].lineArt.structural = { ...size, width: 150, height: 112 } as never;
        writeManifest(dir, manifestOf(jobs));
        const report = await checkStorytimePictureBatch(['adv-rgba', 'adv-swap', 'adv-small'].map((id) => rowOf(id)), dir);
        expect(byId(report, 'adv-rgba').reason ?? '', 'rgba color file has an alpha channel').toMatch(/alpha/i);
        expect(byId(report, 'adv-swap').reason ?? '', 'color file as line art').toMatch(/grayscale|ink/i);
        expect(byId(report, 'adv-small').reason ?? '', 'wrong line-art size').toMatch(/pixel size/i);
        for (const result of report.results) expect(result.status, `${result.rowId}: ${result.reason ?? ''}`).toBe('fail');
    }, 120_000);
});

describe('Storytime picture CLI and reader preflight: adversarial cases', () => {
    it('ADV-P4-CLI-NO-MANIFEST exits 2 on a batch folder without manifest.json, on an unknown flag, and writes no file', () => {
        const dir = temp();
        const before = fs.readdirSync(dir);
        const run = spawnSync(process.execPath, ['--import', 'tsx', batchCliPath, '--batch', dir, '--level', '2', '--weeks', '1'], { encoding: 'utf8', timeout: 120_000 });
        const out = `${run.stdout}\n${run.stderr}`;
        expect(run.status, `no manifest.json gives exit 2: ${out}`).toBe(2);
        expect(out).toMatch(/manifest\.json/);
        expect(fs.readdirSync(dir), 'the check writes no file into the batch folder').toEqual(before);
        const flag = spawnSync(process.execPath, ['--import', 'tsx', batchCliPath, '--batch', dir, '--fix'], { encoding: 'utf8', timeout: 120_000 });
        expect(flag.status, 'an unknown flag gives exit 2').toBe(2);
    }, 240_000);

    it('ADV-P4-A3-PREFLIGHT the final color A3 build stops on a missing color file, and no output folder is made', () => {
        // A2-P4-6: R-P4-13 covers --workbook only. All line-art files exist, so a preflight that
        // lists the line-art names would pass here; the A3 build needs the color names.
        const week = shipped();
        return readers().then(({ compileStorytimeReaders }) => {
            const namesOf = (output: 'workbook' | 'a3-color'): string[] => {
                const doc = new DOMParser().parseFromString(compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output }).html, 'text/html');
                return [...new Set(Array.from(doc.querySelectorAll('[data-picture-file]'), (el) => el.getAttribute('data-picture-file')!))].sort();
            };
            const colorNames = namesOf('a3-color');
            const lineNames = namesOf('workbook');
            expect(colorNames.length, 'the two readers request 18 color files').toBe(18);
            expect(lineNames.length, 'the two readers request 18 line-art files').toBe(18);
            expect(colorNames.some((name) => lineNames.includes(name)), 'the color and line-art names differ').toBe(false);
            const missing = colorNames[9];
            const home = temp();
            const repo = temp();
            const pictures = path.join(repo, 'content', 'storytime', 'l2', 'print', 'pictures');
            fs.mkdirSync(pictures, { recursive: true });
            fs.copyFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), path.join(repo, 'content', 'storytime', 'l2', 'w01.json'));
            const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            for (const name of [...lineNames, ...colorNames]) if (name !== missing) fs.writeFileSync(path.join(pictures, name), png);
            const run = spawnSync(process.execPath, ['--import', 'tsx', readersCliPath, '--level', '2', '--weeks', '1', '--final', '--a3-color'], { encoding: 'utf8', env: { ...process.env, HOME: home, WORKBOOKS_ROOT: repo }, timeout: 120_000 });
            const out = `${run.stdout}\n${run.stderr}`;
            expect(run.status, 'the run was not killed by the spawn timeout').not.toBeNull();
            expect(run.status, `the final A3 build exits nonzero: ${out}`).not.toBe(0);
            expect(out, 'the run names the missing color file').toContain(missing);
            const printRoot = path.join(home, 'Desktop', 'print-ready');
            expect(fs.existsSync(printRoot) ? fs.readdirSync(printRoot, { recursive: true }) : [], 'the stopped A3 build creates no print-ready folder or file').toEqual([]);
        });
    }, 240_000);

    it('ADV-P4-PICTURE-FILES lists the line-art names for the workbook and the color names for the A3 pages, for one reader or both', async () => {
        const { storytimeReaderPictureFiles } = await readers();
        const week = shipped();
        const workbook = storytimeReaderPictureFiles([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'final', output: 'workbook' });
        const a3 = storytimeReaderPictureFiles([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'final', output: 'a3-color' });
        const one = storytimeReaderPictureFiles([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'final', output: 'a3-color', bookTitle: 'Hello!' });
        expect(workbook).toHaveLength(18);
        expect(a3).toHaveLength(18);
        expect(one, 'one reader: its cover and 8 pages').toHaveLength(9);
        expect(a3.map((entry) => entry.rowId), 'both outputs list the same rows').toEqual(workbook.map((entry) => entry.rowId));
        for (const entry of workbook) expect(entry.fileName, `${entry.rowId} workbook`).toBe(`${entry.rowId}-line-v1.png`);
        for (const entry of a3) expect(entry.fileName, `${entry.rowId} A3`).toBe(`${entry.rowId}-v1.png`);
        for (const entry of [...workbook, ...a3]) expect(entry.file, 'the file sits in the picture folder of the level').toBe(path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures', entry.fileName));
        expect(one.every((entry) => a3.some((other) => other.rowId === entry.rowId)), 'the one-reader list is a part of the full list').toBe(true);
        expect(new Set(workbook.map((entry) => entry.rowId)).size, 'no row is listed twice').toBe(18);
    }, 60_000);
});
