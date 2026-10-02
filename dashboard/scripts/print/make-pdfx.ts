import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { JAPAN_COLOR_2001_COATED, checkPdfx, ghostscriptArgs, pageImages, parsePdffonts, parsePdfimages, parsePdfinfo, pdfxDefinition, type FontRow, type ImageRow, type PdfInfo } from '../../lib/print/pdfx';

const USAGE = `Converts a Chrome PDF of a workbook to PDF/X-1a for the printer and checks the result
(track print_ready_pdf_20261002).

Usage: npx tsx scripts/print/make-pdfx.ts <book.pdf> [--out <file.pdf>] [--outline | --keep-fonts]
       npx tsx scripts/print/make-pdfx.ts <file.pdf> --check

  --out         Output file (default: <book>-pdfx1a.pdf next to the input)
  --outline     Draw all text as vector outlines, so the file has no fonts. This is the default
                when the input has Type 3 fonts (old renders); the text stays sharp.
  --keep-fonts  Keep the fonts, also when the input has Type 3 fonts (the check then fails)
  --check       Only check <file.pdf>; convert nothing

Output: CMYK, output intent Japan Color 2001 Coated, PDF 1.3, TrimBox = page size, no bleed.
The profile is cached in ~/.cache/workbooks-print/ (downloaded from Adobe on first use; the
Adobe license allows use and embedding). Needs Ghostscript (gs), poppler (pdfinfo, pdffonts,
pdfimages), and unzip.

Checks: PDF 1.3, PDF/X-1a marker, output intent, TrimBox, no Type 3 font, every font embedded,
no page that became one image (transparency in the source), no RGB image, no soft mask.
Exit code 1 when a check fails.`;

const PROFILE = JAPAN_COLOR_2001_COATED;

function run(cmd: string, args: string[]): string {
    const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.error) throw new Error(`${cmd}: ${r.error.message}`);
    if (r.status !== 0) throw new Error(`${cmd} failed (${r.status}): ${(r.stderr || r.stdout).trim().split('\n').slice(-5).join('\n')}`);
    return r.stdout;
}

/** The cached profile; downloads and unpacks it on first use. */
async function profilePath(): Promise<string> {
    const dir = path.join(os.homedir(), '.cache', 'workbooks-print');
    const file = path.join(dir, PROFILE.file);
    if (fs.existsSync(file)) return file;
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Downloading the ${PROFILE.description} profile from Adobe (once)`);
    const res = await fetch(PROFILE.zipUrl);
    if (!res.ok) throw new Error(`profile download failed: HTTP ${res.status}`);
    const zip = path.join(dir, 'adobe-icc-profiles.zip');
    fs.writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
    const icc = spawnSync('unzip', ['-p', zip, PROFILE.zipEntry], { maxBuffer: 16 * 1024 * 1024 });
    fs.rmSync(zip);
    if (icc.status !== 0 || !icc.stdout.length) throw new Error(`unzip could not read ${PROFILE.zipEntry}`);
    fs.writeFileSync(`${file}.part`, icc.stdout);
    fs.renameSync(`${file}.part`, file);
    return file;
}

interface Read {
    info: PdfInfo;
    title: string;
    pdfxVersion?: string;
    hasOutputIntent: boolean;
    fonts: FontRow[];
    images: ImageRow[];
}

function readPdf(file: string): Read {
    const custom = run('pdfinfo', ['-custom', file]);
    const field = (name: string) => custom.match(new RegExp(`^${name}:\\s+(.+)$`, 'm'))?.[1].trim();
    const raw = fs.readFileSync(file);
    return {
        info: parsePdfinfo(run('pdfinfo', ['-box', file])),
        title: field('Title') ?? path.basename(file, '.pdf'),
        pdfxVersion: field('GTS_PDFXVersion'),
        hasOutputIntent: (raw.includes('/S/GTS_PDFX') || raw.includes('/S /GTS_PDFX')) && raw.includes('/DestOutputProfile'),
        fonts: parsePdffonts(run('pdffonts', [file])),
        images: parsePdfimages(run('pdfimages', ['-list', file])),
    };
}

function report(file: string, r: Read, sourcePageImages?: number[]): number {
    const { errors } = checkPdfx({ ...r, sourcePageImages });
    const mb = (fs.statSync(file).size / 1024 / 1024).toFixed(1);
    const fonts = r.fonts.length ? `${r.fonts.length} font(s)` : 'no fonts (text as outlines)';
    console.log(`${path.relative(process.cwd(), file)}: ${r.info.pages} pages, ${mb} MB, PDF ${r.info.version}, ${r.pdfxVersion ?? 'no PDF/X marker'}, ${fonts}`);
    if (!errors.length) {
        console.log('All checks pass.');
        return 0;
    }
    for (const e of errors) console.log(`  FAIL ${e}`);
    return 1;
}

async function main(argv: string[]): Promise<number> {
    let input: string | undefined;
    let out: string | undefined;
    let outline: boolean | undefined;
    let check = false;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--out') out = path.resolve(argv[++i]);
        else if (a === '--outline') outline = true;
        else if (a === '--keep-fonts') outline = false;
        else if (a === '--check') check = true;
        else if (!a.startsWith('--') && !input) input = path.resolve(a);
        else {
            console.error(USAGE);
            return 2;
        }
    }
    if (!input || !fs.existsSync(input)) {
        console.error(input ? `No such file: ${input}` : USAGE);
        return 2;
    }
    const source = readPdf(input);
    if (check) return report(input, source);

    const type3 = source.fonts.filter((f) => f.type === 'Type 3');
    if (outline === undefined) {
        outline = type3.length > 0;
        if (outline) console.log(`The input has ${type3.length} Type 3 font(s), so the text becomes outlines (use --keep-fonts to keep them).`);
    }
    const output = out ?? input.replace(/(\.pdf)?$/i, '-pdfx1a.pdf');
    const profile = await profilePath();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pdfx-'));
    const definition = path.join(tmp, 'pdfx_def.ps');
    fs.writeFileSync(definition, pdfxDefinition(profile, source.title));
    console.log(`Converting ${source.info.pages} pages with Ghostscript (${outline ? 'text as outlines' : 'fonts kept'}) ...`);
    const started = Date.now();
    const gs = spawnSync('gs', ghostscriptArgs({ input, output, definition, profile, outline }), { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    fs.rmSync(tmp, { recursive: true, force: true });
    const warnings = [...new Set(`${gs.stdout}\n${gs.stderr}`.split('\n').map((l) => l.trim()).filter((l) => /warning|error/i.test(l)))];
    if (gs.status !== 0) {
        console.error(`Ghostscript failed (${gs.status}):\n${warnings.slice(-8).join('\n')}`);
        return 1;
    }
    console.log(`Done in ${Math.round((Date.now() - started) / 1000)} s.${warnings.length ? ` Ghostscript notes: ${warnings.slice(0, 5).join(' | ')}` : ''}`);
    return report(output, readPdf(output), pageImages(source.images, source.info));
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
