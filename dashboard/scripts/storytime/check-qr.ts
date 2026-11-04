import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';
import { compareQrs, decodeQrCodes, expectedStudentBookQrs, qrReportText } from '../../lib/storytime/print/qr-check';
import { storytimeStudentBookPages } from '../../lib/storytime/print/step-pages';

const USAGE = `Decodes every QR code of a printed student book PDF and compares each address with the data (A-48 I1).

Usage: npx tsx scripts/storytime/check-qr.ts <book.pdf> [--level <n>] [--out <report.txt>]

The script renders each page with pdftoppm at 300 dpi, decodes every QR code, and compares the
address with storytimeQrUrl of the song and book paths of each home card. It prints one line for
each code (page, address, expected, pass or fail). Exit code 1 when a code does not decode, an
address is wrong, an expected code is missing, or a code is not expected; 2 when the arguments are wrong.`;

async function main(argv: string[]): Promise<number> {
    if (argv.includes('--help')) {
        console.log(USAGE);
        return 0;
    }
    const flag = (name: string): string | undefined => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
    const level = Number(flag('--level') ?? 2);
    const out = flag('--out');
    const pdf = argv.find((arg, i) => !arg.startsWith('--') && (i === 0 || !argv[i - 1].startsWith('--')));
    if (!pdf || !Number.isInteger(level) || level < 1 || level > 4 || !fs.existsSync(pdf)) {
        console.log(USAGE);
        return 2;
    }
    const weeks = readLevelWeeks(STORYTIME_ROOT, level);
    const broken = weeks.filter((w) => !w.week);
    if (!weeks.length || broken.length) {
        for (const w of broken) console.error(`${w.file}: ${w.error}`);
        console.error(`level ${level}: no week files, or a week does not parse`);
        return 1;
    }
    const parsed = weeks.flatMap((w) => (w.week ? [w.week] : []));
    const pages = storytimeStudentBookPages(parsed);
    const info = execFileSync('pdfinfo', [pdf], { encoding: 'utf8' });
    const pdfPages = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1] ?? 0);
    if (pdfPages !== pages.length) {
        console.error(`the PDF has ${pdfPages} pages and the book of level ${level} has ${pages.length}: the page list does not fit`);
        return 1;
    }
    const expected = expectedStudentBookQrs(parsed, pages);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-qr-'));
    try {
        execFileSync('pdftoppm', ['-r', '300', '-gray', '-png', pdf, path.join(dir, 'pg')]);
        const found: { page: number; data: string }[] = [];
        for (const file of fs.readdirSync(dir).sort()) {
            const page = Number(/-(\d+)\.png$/.exec(file)?.[1]);
            for (const code of await decodeQrCodes(fs.readFileSync(path.join(dir, file)), expected.filter((e) => e.page === page).length)) found.push({ page, data: code.data });
        }
        const rows = compareQrs(expected, found);
        const report = qrReportText(rows);
        process.stdout.write(report);
        if (out) fs.writeFileSync(out, report);
        return rows.every((row) => row.status === 'pass') && expected.length > 0 ? 0 : 1;
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (error) => { console.error(error); process.exitCode = 1; });
