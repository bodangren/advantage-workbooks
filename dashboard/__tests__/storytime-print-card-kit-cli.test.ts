import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    parseStorytimeCardKitArgs,
    storytimeCardKitFileNames,
} from '../lib/storytime/print/card-kit-cli';

/**
 * Phase 8 Green r3: the pure argument parser of the card kit build (Review B, B-P8-1) and the
 * unit marker of the print file names (Review C, C-P8-1).
 *
 * The parser does file access only for the containment check, which the build calls after the
 * parse; these guards read no week file and write no file.
 */

/** A home folder that no test touches: the parser resolves names under it and writes nothing. */
const HOME = '/home/card-kit-test';
const PRINT_READY = path.join(HOME, 'Desktop', 'print-ready', 'storytime');

describe('the card kit argument parser', () => {
    it('G-P8-C1 the defaults: version 1, the unit folder of the version, and no file access', () => {
        const args = parseStorytimeCardKitArgs(['--level', '2', '--weeks', '1,2,3'], HOME);
        expect(args.level, 'the level').toBe(2);
        expect(args.weeks, 'the weeks').toEqual([1, 2, 3]);
        expect(args.version, 'the default version').toBe(1);
        expect(args.outDir, 'the default output folder').toBe(path.join(PRINT_READY, 'card-kit-v1'));
    });

    it('G-P8-C2 --version 2 names the card-kit-v2 folder', () => {
        const args = parseStorytimeCardKitArgs(['--level', '2', '--weeks', '1', '--version', '2'], HOME);
        expect(args.version, 'the version').toBe(2);
        expect(args.outDir, 'the output folder of version 2').toBe(path.join(PRINT_READY, 'card-kit-v2'));
    });

    it('G-P8-C3 a path-like week is an argument error', () => {
        expect(() => parseStorytimeCardKitArgs(['--level', '2', '--weeks', '../1'], HOME), 'a path-like week')
            .toThrow(/--weeks/);
        expect(() => parseStorytimeCardKitArgs(['--level', '2', '--weeks', '1,../2'], HOME), 'a path-like second week')
            .toThrow(/--weeks/);
    });

    it('G-P8-C4 a duplicate week is an argument error', () => {
        expect(() => parseStorytimeCardKitArgs(['--level', '2', '--weeks', '1,1'], HOME), 'a repeated week')
            .toThrow(/duplicate/);
    });

    it('G-P8-C5 --version 0 is an argument error', () => {
        expect(() => parseStorytimeCardKitArgs(['--level', '2', '--weeks', '1', '--version', '0'], HOME), 'version 0')
            .toThrow(/--version/);
    });

    it('G-P8-C6 a relative --out is an argument error', () => {
        expect(() => parseStorytimeCardKitArgs(['--level', '2', '--weeks', '1', '--out', 'out/card-kit'], HOME),
            'a relative output folder').toThrow(/--out/);
    });

    it('G-P8-C7 an --out outside the print-ready Storytime folder is an argument error', () => {
        expect(() => parseStorytimeCardKitArgs(
            ['--level', '2', '--weeks', '1', '--out', '/tmp/opencode/card-kit'], HOME,
        ), 'an output folder outside the print folder').toThrow(/--out/);
        expect(() => parseStorytimeCardKitArgs(
            ['--level', '2', '--weeks', '1', '--out', path.join(HOME, 'Desktop', 'print-ready', 'other')], HOME,
        ), 'a sibling folder of the print folder').toThrow(/--out/);
        // Negative control: a folder inside the print folder passes.
        const inside = path.join(PRINT_READY, 'card-kit-v2');
        expect(parseStorytimeCardKitArgs(['--level', '2', '--weeks', '1', '--out', inside], HOME).outDir, 'an inside folder')
            .toBe(inside);
    });

    it('G-P8-C8 the file names carry the unit marker of the other print files', () => {
        const names = storytimeCardKitFileNames(2, 1, 2);
        expect(names.a5, 'the A5 file').toBe('Storytime-Advantage-L2-U1-Card-Kit-A5-v2_PDFX-1a.pdf');
        expect(names.a6, 'the A6 file').toBe('Storytime-Advantage-L2-U1-Card-Kit-A6-v2_PDFX-1a.pdf');
        expect(names.stickers, 'the sticker file').toBe('Storytime-Advantage-L2-U1-Card-Kit-Stickers-v2_PDFX-1a.pdf');
        expect(names.match, 'the match report').toBe('card-picture-match.txt');
        expect(names.a5, 'the unit marker of the student book stem').toContain('-U1-');
    });
});
