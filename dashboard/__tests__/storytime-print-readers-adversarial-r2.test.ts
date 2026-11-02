import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT } from '../lib/storytime/files';
import { checkStorytimePictureBatch, resolveStorytimePictureFiles } from '../lib/storytime/print/picture-check';
import { fixtureBytes, sha256OfBytes, writePictureFolder } from './fixtures/storytime-picture-folder';

/**
 * Phase 4 adversarial round 2 (track storytime_print_r1_20261025, range 963cdfd8..544ffc79). The
 * cases attack the name form of PM option A (Green 4f, 4h), the final-mode resolver (Green 4g),
 * and the `.gitignore` rule of the picture folder. Each case writes small fixtures under
 * /tmp/opencode/ and never reads or writes the real Forge folder.
 */
const scratch: string[] = [];
function temp(): string {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const dir = fs.mkdtempSync(path.join('/tmp/opencode', 'storytime-readers-adv2-'));
    scratch.push(dir);
    return dir;
}
afterAll(() => scratch.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

const hashOf = (file: string): string => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const SIZE = { width: 200, height: 150 };
const rowOf = (id: string) => ({ id, fileName: `${id}-v1.png`, lineArtFileName: `${id}-line-v1.png`, width: SIZE.width, height: SIZE.height });

/** A valid 8-bit sRGB color PNG with no alpha channel. */
async function writeColor(file: string): Promise<void> {
    const sharp = (await import('sharp')).default;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await sharp({ create: { width: SIZE.width, height: SIZE.height, channels: 3, background: '#3b6ea5' } }).png().toFile(file);
}

/** A valid 8-bit grayscale line-art PNG: a white page with one black stroke. */
async function writeLine(file: string): Promise<void> {
    const sharp = (await import('sharp')).default;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const { width, height } = SIZE;
    const pixels = Buffer.alloc(width * height, 255);
    for (let y = Math.floor(height / 2); y < Math.floor(height / 2) + 14; y++) pixels.fill(0, y * width + 10, y * width + width - 10);
    await sharp(pixels, { raw: { width, height, channels: 1 } }).png().toFile(file);
}

/**
 * Writes two valid files with the given names and returns the Forge job of `jobId` that names them.
 * The job id and the file names are separate, so a case can attach the files of one name to
 * another row id.
 * @param dir The batch folder.
 * @param jobId The picture-list row id of the job.
 * @param colorName The color file name; the manifest path is the name.
 * @param lineName The line-art file name.
 * @param version The `selectedVersion` and the candidate version of the job.
 * @returns The job object.
 */
async function deliver(dir: string, jobId: string, colorName: string, lineName: string, version: number = 1): Promise<Record<string, unknown>> {
    await writeColor(path.join(dir, colorName));
    await writeLine(path.join(dir, lineName));
    const color = hashOf(path.join(dir, colorName));
    const line = hashOf(path.join(dir, lineName));
    return {
        id: jobId, week: 1, status: 'ready', selectedVersion: version, selectedFile: colorName, selectedSha256: color,
        candidates: [{
            jobId, version, file: colorName, fileSha256: color, status: 'ready',
            structural: { valid: true, ...SIZE, sha256: color, errors: [] },
            lineArt: { file: lineName, fileSha256: line, status: 'ready', structural: { valid: true, ...SIZE, sha256: line, errors: [] } },
        }],
    };
}
const exact = (dir: string, id: string, version = 1) => deliver(dir, id, `${id}-v${version}.png`, `${id}-line-v${version}.png`, version);
const writeManifest = (dir: string, jobs: unknown[]): void => {
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ version: 1, batchHashAlgorithm: 'sha256', jobs, batches: [] }));
};
type Report = Awaited<ReturnType<typeof checkStorytimePictureBatch>>;
const resultOf = (report: Report, id: string) => report.results.find((entry) => entry.rowId === id)!;

describe('Storytime name form: exact names under hostile row ids and spellings (PM option A)', () => {
    it('ADV-P4-R2-REGEX-ID a row id with regular-expression characters matches its own file names only', async () => {
        // The name rule is an exact name. An unescaped `.`, `+`, `*`, `?`, `(`, or `[` in the row id
        // would also accept a different name (`advXdot`, `advvplus`, ...). Each impostor holds real,
        // valid files, so only the name rule can fail it. The control rows own their exact names.
        const cases: Array<[string, string]> = [
            ['adv.dot', 'advXdot'],
            ['adv+plus', 'advvplus'],
            ['adv*star', 'adstar'],
            ['adv?opt', 'adopt'],
            ['adv(grp)', 'advgrp'],
            ['adv[cls]', 'advc'],
        ];
        const controlDir = temp();
        const controls: unknown[] = [];
        for (const [id] of cases) controls.push(await exact(controlDir, id));
        writeManifest(controlDir, controls);
        const controlReport = await checkStorytimePictureBatch(cases.map(([id]) => rowOf(id)), controlDir);
        expect(controlReport.results.map((entry) => `${entry.rowId} ${entry.status} ${entry.reason ?? ''}`.trim()), 'the control rows with exact names pass')
            .toEqual(cases.map(([id]) => `${id} pass`));
        for (const [id, impostorStem] of cases) {
            // the job of `id` carries the file names of `impostorStem`, which the unescaped pattern of `id` accepts
            const impostorDir = temp();
            writeManifest(impostorDir, [await deliver(impostorDir, id, `${impostorStem}-v1.png`, `${impostorStem}-line-v1.png`)]);
            const report = await checkStorytimePictureBatch([rowOf(id)], impostorDir);
            const result = resultOf(report, id);
            expect(result.status, `${id} with the files of ${impostorStem} fails: ${result.reason ?? ''}`).toBe('fail');
            expect(result.reason ?? '', `${id}: the reason names the row id`).toContain(id);
            expect(result.reason ?? '', `${id}: the reason names the impostor file`).toContain(`${impostorStem}-`);
            expect(report.exitCode).toBe(1);
        }
    }, 300_000);

    it('ADV-P4-R2-CASE a name that differs from the exact form in case fails: -V1, .PNG, and a row id in another case', async () => {
        const dir = temp();
        const requested = ['adv-ctl', 'adv-bigv', 'adv-bigpng', 'Adv-Rowcase', 'adv-bigstem'].map(rowOf);
        const jobs = [
            await exact(dir, 'adv-ctl'), // control: exact names
            await deliver(dir, 'adv-bigv', 'adv-bigv-V1.png', 'adv-bigv-line-V1.png'),
            await deliver(dir, 'adv-bigpng', 'adv-bigpng-v1.PNG', 'adv-bigpng-line-v1.PNG'),
            await deliver(dir, 'Adv-Rowcase', 'adv-rowcase-v1.png', 'adv-rowcase-line-v1.png'),
            await deliver(dir, 'adv-bigstem', 'ADV-BIGSTEM-v1.png', 'ADV-BIGSTEM-line-v1.png'),
        ];
        writeManifest(dir, jobs);
        const report = await checkStorytimePictureBatch(requested, dir);
        expect(report.results.map((entry) => entry.rowId), 'one result for each row, in order').toEqual(requested.map((row) => row.id));
        expect(resultOf(report, 'adv-ctl').status, 'the control row passes').toBe('pass');
        for (const row of requested.slice(1)) {
            const result = resultOf(report, row.id);
            expect(result.status, `${row.id} fails: ${result.reason ?? ''}`).toBe('fail');
            expect(result.reason ?? '', `${row.id}: the reason names the row id`).toContain(row.id);
        }
        expect(report.exitCode).toBe(1);
    }, 300_000);

    it('ADV-P4-R2-LARGE-N a large safe version number passes when the names, the candidate, and selectedVersion agree, and fails when the name is one higher', async () => {
        const dir = temp();
        const big = 123456789012;
        writeManifest(dir, [
            await exact(dir, 'adv-bigok', big),
            await deliver(dir, 'adv-bigbad', `adv-bigbad-v${big + 1}.png`, `adv-bigbad-line-v${big + 1}.png`, big),
        ]);
        const report = await checkStorytimePictureBatch([rowOf('adv-bigok'), rowOf('adv-bigbad')], dir);
        expect(resultOf(report, 'adv-bigok').status, `the large N row passes: ${resultOf(report, 'adv-bigok').reason ?? ''}`).toBe('pass');
        const bad = resultOf(report, 'adv-bigbad');
        expect(bad.status, 'a name one above selectedVersion fails').toBe('fail');
        expect(bad.reason ?? '').toContain('adv-bigbad');
    }, 120_000);

    it('ADV-P4-R2-JOB-ID the job is selected by the whole row id: a prefix id and a different-case id find no job', async () => {
        // Only the long-id job is in the manifest. The short row id is a prefix of it, and the
        // upper-case row id differs by case. Neither row has a job, so both must fail with "no job".
        const dir = temp();
        const longId = 'adv-nest-and-a-nut';
        writeManifest(dir, [await exact(dir, longId)]);
        const rows = [rowOf(longId), rowOf('adv-nest'), rowOf('adv-nest-and'), rowOf(longId.toUpperCase()), rowOf(`${longId} `)];
        const report = await checkStorytimePictureBatch(rows, dir);
        expect(report.results.map((entry) => entry.rowId), 'one result for each row, in order').toEqual(rows.map((row) => row.id));
        expect(resultOf(report, longId).status, 'the row with its own job passes').toBe('pass');
        for (const row of rows.slice(1)) {
            const result = resultOf(report, row.id);
            expect(result.status, `${JSON.stringify(row.id)} has no job and fails: ${result.reason ?? ''}`).toBe('fail');
            expect(result.reason ?? '', `${JSON.stringify(row.id)}: the reason says that no job exists`).toMatch(/no job/i);
        }
        expect(report.exitCode).toBe(1);
    }, 120_000);
});

describe('Storytime final-mode resolver: manifest shapes, unrequested rows, and links (Green 4g)', () => {
    /** A picture folder for the given jobs, made by the Red 4g fixture. */
    function folderOf(...rowIds: string[]): string {
        const folder = path.join(temp(), 'pictures');
        writePictureFolder(folder, rowIds.map((rowId) => ({ rowId })));
        return folder;
    }
    const messageOf = (run: () => unknown): string => {
        try {
            run();
        } catch (e) {
            return e instanceof Error ? e.message : String(e);
        }
        return '';
    };

    it('ADV-P4-R2-RESOLVER-SHAPES a manifest that is valid JSON but not a usable object stops the build and names the row id', () => {
        const folder = folderOf('adv-shape');
        expect(resolveStorytimePictureFiles(folder, [{ id: 'adv-shape' }], 'color'), 'the control manifest resolves').toHaveLength(1);
        const shapes = ['[]', 'null', '42', '"text"', 'true', '{}', '{"jobs":null}', '{"jobs":{}}', '{"jobs":[]}', '{"jobs":[null]}', '{"jobs":[1,"a"]}', '{"jobs":[[]]}'];
        for (const shape of shapes) {
            fs.writeFileSync(path.join(folder, 'manifest.json'), shape);
            for (const kind of ['color', 'line'] as const) {
                const message = messageOf(() => resolveStorytimePictureFiles(folder, [{ id: 'adv-shape' }], kind));
                expect(message, `${shape} (${kind}) stops the build`).not.toBe('');
                expect(message, `${shape} (${kind}) names the row id`).toContain('adv-shape');
            }
        }
        // A truncated file does not parse: the message names manifest.json.
        fs.writeFileSync(path.join(folder, 'manifest.json'), '{"jobs":[');
        expect(messageOf(() => resolveStorytimePictureFiles(folder, [{ id: 'adv-shape' }], 'color'))).toContain('manifest.json');
    }, 60_000);

    it('ADV-P4-R2-UNREQUESTED a broken job of a row that the build does not request does not stop the build', () => {
        // The build resolves "each requested row". The manifest also holds a pending job, a job with
        // a bad hash, a job with a path outside the folder, and a duplicate of an unrequested row id.
        // The anchor proves the same four faults stop a build that requests the row.
        const folder = path.join(temp(), 'pictures');
        writePictureFolder(folder, [
            { rowId: 'adv-want-a' },
            { rowId: 'adv-want-b', version: 2 },
            { rowId: 'adv-skip-pending' },
            { rowId: 'adv-skip-hash' },
            { rowId: 'adv-skip-out', colorPath: '../outside/adv-skip-out-v1.png', linePath: '../outside/adv-skip-out-line-v1.png' },
            { rowId: 'adv-skip-dup' },
            { rowId: 'adv-skip-dup' },
        ]);
        const manifestFile = path.join(folder, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8')) as { jobs: Array<Record<string, unknown> & { id: string; candidates: Array<Record<string, any>> }> };
        manifest.jobs.find((job) => job.id === 'adv-skip-pending')!.status = 'pending';
        const hashJob = manifest.jobs.find((job) => job.id === 'adv-skip-hash')!;
        hashJob.candidates[0].structural.sha256 = '0'.repeat(64);
        hashJob.candidates[0].lineArt.structural.sha256 = '0'.repeat(64);
        fs.writeFileSync(manifestFile, JSON.stringify(manifest));
        const resolved = resolveStorytimePictureFiles(folder, [{ id: 'adv-want-a' }, { id: 'adv-want-b' }], 'line');
        expect(resolved.map((entry) => entry.fileName), 'the two requested rows resolve').toEqual(['adv-want-a-line-v1.png', 'adv-want-b-line-v2.png']);
        for (const id of ['adv-skip-pending', 'adv-skip-hash', 'adv-skip-out', 'adv-skip-dup']) {
            expect(messageOf(() => resolveStorytimePictureFiles(folder, [{ id }], 'line')), `anchor: the fault of ${id} stops a build that requests it`).toContain(id);
        }
    }, 60_000);

    it('ADV-P4-R2-LINKS a link inside the folder resolves when the bytes match; a wrong target, a link out of the folder, and a dangling link stop the row', () => {
        const kinds = ['color', 'line'] as const;
        const nameOf = (id: string, kind: 'color' | 'line') => `${id}${kind === 'line' ? '-line' : ''}-v1.png`;
        for (const kind of kinds) {
            const folder = folderOf('adv-in', 'adv-wrong', 'adv-out', 'adv-dangle', 'adv-other');
            const outside = path.join(path.dirname(folder), 'outside');
            fs.mkdirSync(outside);
            const file = (id: string) => path.join(folder, nameOf(id, kind));
            // adv-in: the file moves into a sub folder; a link inside the folder takes its place
            fs.mkdirSync(path.join(folder, 'real'));
            fs.renameSync(file('adv-in'), path.join(folder, 'real', nameOf('adv-in', kind)));
            fs.symlinkSync(path.join(folder, 'real', nameOf('adv-in', kind)), file('adv-in'));
            // adv-wrong: the link points to the file of another row, so the bytes differ from the manifest
            fs.rmSync(file('adv-wrong'));
            fs.symlinkSync(file('adv-other'), file('adv-wrong'));
            // adv-out: the link points out of the folder to a copy with the exact manifest bytes
            const copy = path.join(outside, nameOf('adv-out', kind));
            fs.copyFileSync(file('adv-out'), copy);
            fs.rmSync(file('adv-out'));
            fs.symlinkSync(copy, file('adv-out'));
            // adv-dangle: the link points to nothing
            fs.rmSync(file('adv-dangle'));
            fs.symlinkSync(path.join(folder, 'nothing-here.png'), file('adv-dangle'));
            expect(fs.readFileSync(copy).equals(fixtureBytes(nameOf('adv-out', kind))), 'the outside copy holds the manifest bytes').toBe(true);
            expect(sha256OfBytes(fs.readFileSync(copy)), 'the outside copy has the manifest hash').toBe(sha256OfBytes(fixtureBytes(nameOf('adv-out', kind))));

            const inside = resolveStorytimePictureFiles(folder, [{ id: 'adv-in' }], kind);
            expect(inside.map((entry) => entry.fileName), `${kind}: a link to a file inside the folder with the right bytes resolves`).toEqual([nameOf('adv-in', kind)]);
            const wrong = messageOf(() => resolveStorytimePictureFiles(folder, [{ id: 'adv-wrong' }], kind));
            expect(wrong, `${kind}: a link to the file of another row fails on the SHA-256`).toMatch(/sha-?256/i);
            expect(wrong).toContain('adv-wrong');
            const out = messageOf(() => resolveStorytimePictureFiles(folder, [{ id: 'adv-out' }], kind));
            expect(out, `${kind}: a link out of the folder fails although the SHA-256 is right`).not.toBe('');
            expect(out).toContain('adv-out');
            expect(out, `${kind}: the reason names the root or the link`).toMatch(/outside|symbolic link/i);
            const dangle = messageOf(() => resolveStorytimePictureFiles(folder, [{ id: 'adv-dangle' }], kind));
            expect(dangle, `${kind}: a dangling link fails`).not.toBe('');
            expect(dangle).toContain('adv-dangle');
        }
    }, 60_000);

    it('ADV-P4-R2-RESOLVER-REGEX-ID the resolver matches a row id with regular-expression characters by its exact name', () => {
        const folder = path.join(temp(), 'pictures');
        writePictureFolder(folder, [
            { rowId: 'adv.dot' },
            { rowId: 'adv+plus', colorPath: 'advvplus-v1.png', linePath: 'advvplus-line-v1.png' },
            { rowId: 'adv.case', colorPath: 'adv.case-V1.png', linePath: 'adv.case-line-V1.png' },
        ]);
        expect(resolveStorytimePictureFiles(folder, [{ id: 'adv.dot' }], 'color').map((entry) => entry.fileName), 'control: the exact names resolve').toEqual(['adv.dot-v1.png']);
        for (const id of ['adv+plus', 'adv.case']) {
            const message = messageOf(() => resolveStorytimePictureFiles(folder, [{ id }], 'color'));
            expect(message, `${id}: a name that is not the exact form stops the row`).toContain(id);
        }
    }, 60_000);
});

describe('Storytime picture folder in the public repository: the ignore rule for every level', () => {
    const repoRoot = path.resolve(STORYTIME_ROOT, '..', '..');
    const ignoredCode = (rel: string): number | null => spawnSync('git', ['check-ignore', '-q', '--', rel], { cwd: repoRoot, encoding: 'utf8' }).status;

    it('ADV-P4-R2-GITIGNORE-LEVELS the picture folder of level 1, 3, 4, 9, and 10 is ignored at any depth; the picture list and week files of those levels are not', () => {
        for (const level of [1, 3, 4, 9, 10]) {
            const folder = `content/storytime/l${level}/print/pictures`;
            for (const rel of [
                `${folder}/manifest.json`,
                `${folder}/l${level}-w01-cover-x-v1.png`,
                `${folder}/l${level}-w01-cover-x-line-v2.png`,
                `${folder}/w01/rows/l${level}-w01-story-x-v1.png`,
                `${folder}/he said "no"/x-v1.png`,
            ]) expect(ignoredCode(rel), `${rel} is ignored`).toBe(0);
            for (const rel of [
                `content/storytime/l${level}/print/pictures.json`,
                `content/storytime/l${level}/print/pictures.md`,
                `content/storytime/l${level}/w01.json`,
            ]) expect(ignoredCode(rel), `${rel} stays tracked, not ignored`).toBe(1);
        }
    }, 30_000);

    it('ADV-P4-R2-GITIGNORE-TRACKED no file of any picture folder is tracked in git', () => {
        const listed = spawnSync('git', ['ls-files', '--', 'content/storytime/*/print/pictures/*'], { cwd: repoRoot, encoding: 'utf8' });
        expect(listed.status, `git ls-files ran: ${listed.stderr}`).toBe(0);
        expect(listed.stdout.trim().split('\n').filter(Boolean), 'no tracked picture file').toEqual([]);
    }, 30_000);
});
