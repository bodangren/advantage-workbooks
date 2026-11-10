/**
 * Red of the cover print gate: PRINT_GATE must pass a full-page art cover page that holds live
 * text with embedded fonts and vector logos.
 *
 * The track: storytime_cover_options_20261106, Phase 2, the Task (Red, cover print gate) pair of
 * 2026-11-10.
 *
 * The PM decision of 2026-11-10 17:50, word for word:
 * "close the recorded check 1 deviation of Task 2.9. make-pdfx.ts --check (PRINT_GATE) excuses or
 * flags a full-page art cover page wrongly. ... Red: a test that proves the gate's verdict on a
 * full-page art cover page with live text and vector logos (the r5 and A2 files). Green: the
 * smallest change, so that PRINT_GATE passes the 4 cover files on its own merit. Done when
 * PRINT_GATE exits 0 on r5 and A2 with no deviation, and the r5 and A2 bytes stay unchanged (the
 * check only reads)."
 *
 * The reading of the code (the orchestrator, 2026-11-10): in the mode --check the CLI calls
 * checkPdfx with no sourcePageImages. The function pageImages then flags every full-page art page,
 * and the message reads "page(s) 1, 2 became one image each". A page that Ghostscript flattened
 * holds no font. A cover page holds the full-page art plus live text with embedded fonts.
 *
 * The design (the orchestrator, 2026-11-10; the tests decide):
 *   (1) checkPdfx takes an optional textPages. It lists the pages on which pdffonts -f N -l N
 *       lists at least 1 embedded font, and no font of the type Type 3.
 *   (2) A full-page image page that sits in textPages is not "became one image".
 *   (3) With sourcePageImages the result stays as it is now. The build path stays as it is now.
 *   (4) The CLI --check reads the fonts of each page with pdffonts -f N -l N, and passes
 *       textPages.
 *
 * The contract of this file:
 *   G1: The gate on a full-page art cover page with live text. The page holds a valid PDF/X-1a
 *       header, embedded fonts, and one page-size CMYK image on page 1 and on page 2. With
 *       textPages [1, 2] the gate gives no error. With textPages [] the gate gives the error
 *       "became one image" for the pages 1 and 2. With textPages [2] the gate gives the error for
 *       the page 1 only. The test reads no file and needs no poppler.
 *   G2: The build path stays as it is now. With sourcePageImages [1, 2] and no textPages the gate
 *       gives no error. With sourcePageImages [] and no textPages the error stays.
 *   G3: The 4 cover files sit in the print-ready folder, and each holds its pinned SHA-256. A
 *       missing file fails the test with its path. This test is a release gate of this machine.
 *   G4: The print gate on the 4 real cover files. The CLI runs with --check. The exit code is 0,
 *       the output holds "All checks pass.", and the output holds no "became one image".
 *   G5: The 4 cover files keep their SHA-256 after the print gate ran. The gate only reads.
 *
 * The 4 cover files, the r5 set and the A2 set of the print-ready folder:
 *   r5-student: student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf
 *   r5-teacher: teacher-candidate/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate_PDFX-1a.pdf
 *   a2-student: student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo_PDFX-1a.pdf
 *   a2-teacher: teacher-candidate/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate-alt-hlogo_PDFX-1a.pdf
 *
 * The 2 backs of the cover files hold Thai. The file prints no text of a cover: it prints file
 * paths, counts, exit codes, and SHA-256 values only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { checkPdfx, parsePdfinfo } from '../lib/print/pdfx';

/** The dashboard folder, the root of the CLI and of the test. */
const DASHBOARD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The print-ready folder of the cover set of the quest. */
const COVERS_DIR = path.join(os.homedir(), 'Desktop', 'print-ready', 'storytime', 'covers-quest-v1');

/** The 4 cover files with their pinned SHA-256. */
const COVER_FILES = [
    {
        label: 'r5-student',
        name: 'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf',
        sha256: '920f6ddf93ba4308e17a3cc7dc562786a331e55e48b970775101ed7727199c9d',
    },
    {
        label: 'r5-teacher',
        name: 'teacher-candidate/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate_PDFX-1a.pdf',
        sha256: 'd2e512552f6f1aea7c7b73f86d8072ad05d28d2909354737a17b782611970d37',
    },
    {
        label: 'a2-student',
        name: 'student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo_PDFX-1a.pdf',
        sha256: '8ae118b644765eaeab537b503cab76bc7bb573d9dae6d3b4ed567c465dc5d6fa',
    },
    {
        label: 'a2-teacher',
        name: 'teacher-candidate/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-candidate-alt-hlogo_PDFX-1a.pdf',
        sha256: '665c044f6e828e618fc4c488564d26c6e63ddaf3d61432b3dba8aebd7596bf1a',
    },
];

/** The head of a PDF/X-1a file of 2 A4 pages, with a TrimBox. */
const INFO = `Title:           Storytime Advantage L2 U1 Cover
Producer:        GPL Ghostscript 10.06.0
Pages:           2
Page size:       594.96 x 841.92 pts
MediaBox:            0.00     0.00   594.96   841.92
TrimBox:             0.00     0.00   594.96   841.92
PDF version:     1.3
`;

/** The fonts of a cover page: live text, embedded, no Type 3. */
const FONTS = [
    { name: 'SBHNEU+LeagueSpartanThin-Bold', type: 'CID TrueType', embedded: true },
    { name: 'CIODMH+Andika-Bold', type: 'CID TrueType', embedded: true },
];

/** The art of a cover page: one CMYK image the size of the page, on page 1 and on page 2. */
const IMAGES = [
    { page: 1, type: 'image', width: 2480, height: 3508, color: 'cmyk', xppi: 300, yppi: 300 },
    { page: 2, type: 'image', width: 2480, height: 3508, color: 'cmyk', xppi: 300, yppi: 300 },
];

/** The options of checkPdfx, with the optional textPages field that Green adds. */
type CheckPdfxOptions = Parameters<typeof checkPdfx>[0] & { textPages?: number[] };

/**
 * The pages of the "became one image" error of a check result.
 * @param errors The errors of the check.
 * @returns The page numbers as a list, or an empty string when the error is absent.
 */
function becameOneImagePages(errors: string[]): string {
    const line = errors.find((e) => e.includes('became one image'));
    if (!line) return '';
    const found = line.match(/page\(s\) ([0-9, ]+) became one image/);
    return found ? found[1].trim() : 'UNKNOWN';
}

/**
 * Runs the gate on a full-page art cover page that holds live text.
 * @param textPages The pages that hold an embedded font.
 * @param sourcePageImages The pages of the source PDF that were already one page-size picture.
 * @returns The result of the gate.
 */
function gateOnCoverPage(textPages: number[], sourcePageImages?: number[]): { errors: string[] } {
    const options: CheckPdfxOptions = {
        info: parsePdfinfo(INFO),
        pdfxVersion: 'PDF/X-1a:2001',
        hasOutputIntent: true,
        fonts: FONTS,
        images: IMAGES,
        textPages,
        ...(sourcePageImages ? { sourcePageImages } : {}),
    };
    return checkPdfx(options);
}

/**
 * The SHA-256 of a file.
 * @param file The path of the file.
 * @returns The hash, or an empty string when the file is absent.
 */
function sha256OfFile(file: string): string {
    if (!fs.existsSync(file)) return '';
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** The result of the print gate on one cover file. */
interface GateResult {
    exit: number;
    allPass: boolean;
    became: boolean;
}

/**
 * Runs the print gate on a cover file.
 * @param file The path of the cover file.
 * @returns The exit code, and the 2 marks of the output.
 */
function printGate(file: string): GateResult {
    const run = spawnSync('npx', ['tsx', 'scripts/print/make-pdfx.ts', file, '--check'], {
        cwd: DASHBOARD_DIR,
        encoding: 'utf8',
        timeout: 120_000,
        maxBuffer: 16 * 1024 * 1024,
    });
    const out = `${run.stdout ?? ''}\n${run.stderr ?? ''}`;
    return {
        exit: run.status === null ? -1 : run.status,
        allPass: out.includes('All checks pass.'),
        became: out.includes('became one image'),
    };
}

describe('quest-cover-print-gate: G1 to G5 (Red, the cover print gate on its own merit)', () => {
    it('G1: the gate passes a full-page art cover page that holds live text', () => {
        const withBoth = gateOnCoverPage([1, 2]);
        const withNone = gateOnCoverPage([]);
        const withPageTwo = gateOnCoverPage([2]);
        expect(
            {
                textPages12: { pages: becameOneImagePages(withBoth.errors), errors: withBoth.errors.length },
                textPagesNone: { pages: becameOneImagePages(withNone.errors), errors: withNone.errors.length },
                textPages2: { pages: becameOneImagePages(withPageTwo.errors), errors: withPageTwo.errors.length },
            },
            'the 3 verdicts of the gate on a full-page art cover page with live text.',
        ).toEqual({
            textPages12: { pages: '', errors: 0 },
            textPagesNone: { pages: '1, 2', errors: 1 },
            textPages2: { pages: '1', errors: 1 },
        });
    });

    it('G2: the build path of the gate stays as it is now', () => {
        const excused = gateOnCoverPage([], [1, 2]);
        const notExcused = gateOnCoverPage([], []);
        expect(
            {
                sourcePageImages12: { pages: becameOneImagePages(excused.errors), errors: excused.errors.length },
                sourcePageImagesNone: { pages: becameOneImagePages(notExcused.errors), errors: notExcused.errors.length },
            },
            'the 2 verdicts of the gate with the source page images.',
        ).toEqual({
            sourcePageImages12: { pages: '', errors: 0 },
            sourcePageImagesNone: { pages: '1, 2', errors: 1 },
        });
    });

    it('G3: the 4 cover files sit in the print-ready folder with their pinned SHA-256', () => {
        for (const file of COVER_FILES) {
            const pathOfFile = path.join(COVERS_DIR, file.name);
            expect(fs.existsSync(pathOfFile), `the cover file ${pathOfFile} exists.`).toBe(true);
            expect(sha256OfFile(pathOfFile), `the SHA-256 of ${pathOfFile}.`).toBe(file.sha256);
        }
    });

    it('G4: the print gate passes the 4 cover files on their own merit', () => {
        const results: Record<string, GateResult> = {};
        for (const file of COVER_FILES) {
            results[file.label] = printGate(path.join(COVERS_DIR, file.name));
        }
        expect(results, 'the 4 verdicts of the print gate on the cover files.').toEqual({
            'r5-student': { exit: 0, allPass: true, became: false },
            'r5-teacher': { exit: 0, allPass: true, became: false },
            'a2-student': { exit: 0, allPass: true, became: false },
            'a2-teacher': { exit: 0, allPass: true, became: false },
        });
    }, 120_000);

    it('G5: the 4 cover files keep their SHA-256 after the print gate ran', () => {
        for (const file of COVER_FILES) {
            const pathOfFile = path.join(COVERS_DIR, file.name);
            expect(sha256OfFile(pathOfFile), `the SHA-256 of ${pathOfFile} after the print gate.`).toBe(file.sha256);
        }
    });
});
