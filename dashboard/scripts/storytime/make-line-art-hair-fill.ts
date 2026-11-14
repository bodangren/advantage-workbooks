import fs from 'fs';
import path from 'path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { STORYTIME_ROOT } from '../../lib/storytime/files';
import { fillStorytimeLineArtHair, readStorytimeLineArtFixTable } from '../../lib/storytime/print/line-art-fix';

const USAGE = `Makes the hair fill files of the line-art fix table (spec P9-A5, decision D7).

Usage: npx tsx scripts/storytime/make-line-art-hair-fill.ts --write | --check

--write  reads each D7 entry of content/storytime/l2/print/pictures-line-fix.json, fills the hair
         region of its source line art with black, and writes the replacement file. A file that
         exists stops the run. The run prints the SHA-256 of each file for the table.
--check  recomputes each fill from the source and compares the pixels of the committed file, and
         compares the file SHA-256 with the table. It prints "hair fills equal N of N".

Exit code 1 when a source, a fill, or a file differs, 2 when the arguments are wrong.`;

const PICTURE_FOLDER = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures');

const sha256Of = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

/** The 8-bit gray pixels of an image file. */
async function grayOf(file: string): Promise<{ data: Uint8Array; width: number; height: number }> {
    const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
    return { data: new Uint8Array(data), width: info.width, height: info.height };
}

/** The filled hair copy of the source of one D7 entry; the source must hold the table SHA-256. */
async function filledOf(sourceFile: string, sourceSha256: string, fill: Parameters<typeof fillStorytimeLineArtHair>[1]): Promise<{ data: Uint8Array; width: number; height: number }> {
    const source = path.join(PICTURE_FOLDER, sourceFile);
    if (sha256Of(fs.readFileSync(source)) !== sourceSha256) throw new Error(`the SHA-256 of ${sourceFile} is not the table SHA-256`);
    const gray = await grayOf(source);
    return { data: fillStorytimeLineArtHair(gray, fill), width: gray.width, height: gray.height };
}

async function main(argv: string[]): Promise<number> {
    const write = argv.includes('--write');
    const check = argv.includes('--check');
    if (argv.includes('--help') || write === check) {
        console.log(USAGE);
        return argv.includes('--help') ? 0 : 2;
    }
    const entries = Object.entries(readStorytimeLineArtFixTable()).filter(([, entry]) => entry.reason === 'D7');
    if (!entries.length) {
        console.error('the fix table holds no D7 entry');
        return 1;
    }
    let equal = 0;
    for (const [rowId, entry] of entries) {
        if (!entry.fill) {
            console.error(`${rowId}: the D7 entry has no fill`);
            return 1;
        }
        const target = path.join(STORYTIME_ROOT, entry.replacement);
        const filled = await filledOf(entry.sourceFile, entry.sourceSha256, entry.fill);
        if (write) {
            if (fs.existsSync(target)) {
                console.error(`${rowId}: ${entry.replacement} exists; remove it first`);
                return 1;
            }
            fs.mkdirSync(path.dirname(target), { recursive: true });
            const png = await sharp(Buffer.from(filled.data), { raw: { width: filled.width, height: filled.height, channels: 1 } }).toColourspace('b-w').png().toBuffer();
            fs.writeFileSync(target, png);
            console.log(`${rowId} ${entry.replacement} ${sha256Of(png)}`);
            continue;
        }
        if (!fs.existsSync(target)) {
            console.error(`${rowId}: ${entry.replacement} is missing`);
            return 1;
        }
        const committed = await grayOf(target);
        const same = committed.width === filled.width && committed.height === filled.height && Buffer.compare(Buffer.from(committed.data), Buffer.from(filled.data)) === 0;
        if (!same) {
            console.error(`${rowId}: the pixels of ${entry.replacement} differ from the recomputed fill`);
            return 1;
        }
        if (sha256Of(fs.readFileSync(target)) !== entry.replacementSha256) {
            console.error(`${rowId}: the SHA-256 of ${entry.replacement} is not the table SHA-256`);
            return 1;
        }
        equal += 1;
    }
    if (check) console.log(`hair fills equal ${equal} of ${entries.length}`);
    return 0;
}

main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    },
);
