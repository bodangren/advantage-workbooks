import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';
import { checkStorytimeOutputContainment } from '../../lib/storytime/print/student-book-cli';
import {
    classCountProblems, classifiedMarkdown, classifyReport, parseTextGateReport, TEXT_DIFF_CLASSES, weekSection,
} from '../../lib/storytime/print/text-diff-classes';

const USAGE = `Classifies every difference of a text gate report of the Thai Storytime teacher book (A-48 H1).

Usage: npx tsx scripts/storytime/classify-text-gate.ts --report <text-gate-v<n>.txt> --book <teacher book chrome PDF> --level <n> --out <list.md>

  --report  The text gate report that make-teacher-book-print.ts wrote
  --book    The Chrome PDF of the same build (pdftotext -layout gives the new text of each week)
  --level   The Storytime level whose week files in content/storytime/l<n>/ the report belongs to
  --out     The markdown list to write: a new file inside ~/Desktop/print-ready/storytime/

Each difference gets one of six classes: ${TEXT_DIFF_CLASSES.join(', ')}.
Exit code 1 when a report line does not parse, a week file does not parse, or the class counts
do not add up to the count of the report. Exit code 2 on an argument error, when the output
exists already, or when the output path is a symbolic link or lies outside the print folder.`;

async function main(argv: string[]): Promise<number> {
    if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
        console.log(USAGE);
        return argv.length === 0 ? 2 : 0;
    }
    const flags = new Map<string, string>();
    for (let i = 0; i < argv.length; i += 2) {
        const name = argv[i];
        if (!['--report', '--book', '--level', '--out'].includes(name) || argv[i + 1] === undefined) {
            console.error(`unknown argument or missing value: ${name}\n\n${USAGE}`);
            return 2;
        }
        flags.set(name, argv[i + 1]);
    }
    const missing = ['--report', '--book', '--level', '--out'].filter((name) => !flags.has(name));
    if (missing.length) {
        console.error(`missing: ${missing.join(', ')}\n\n${USAGE}`);
        return 2;
    }
    const level = Number(flags.get('--level'));
    if (!Number.isSafeInteger(level) || level < 1 || level > 4) {
        console.error(`--level must be a whole number from 1 to 4, got "${flags.get('--level')}"`);
        return 2;
    }
    // B-P3-01 (rule 12.2): the output is a new file inside the print folder; a link or an existing file stops the run.
    const printReady = path.join(os.homedir(), 'Desktop', 'print-ready', 'storytime');
    const out = path.resolve(flags.get('--out')!);
    if (!out.startsWith(printReady + path.sep)) {
        console.error(`--out must be a file inside ${printReady}, got "${out}"`);
        return 2;
    }
    try {
        checkStorytimeOutputContainment(out, os.homedir());
    } catch (e) {
        console.error(e instanceof Error ? e.message : String(e));
        return 2;
    }
    if (fs.lstatSync(out, { throwIfNoEntry: false }) !== undefined) {
        console.error(`The output exists already; use a new file name (rule 12.2): ${out}`);
        return 2;
    }
    const reportFile = path.resolve(flags.get('--report')!);
    if (!fs.existsSync(reportFile)) {
        console.error(`The report does not exist: ${reportFile}`);
        return 2;
    }
    const reportBytes = fs.readFileSync(reportFile);
    let report;
    try {
        report = parseTextGateReport(reportBytes.toString('utf8'));
    } catch (e) {
        console.error(e instanceof Error ? e.message : String(e));
        return 1;
    }
    const weeks = readLevelWeeks(STORYTIME_ROOT, level);
    const broken = weeks.filter((entry) => !entry.week);
    if (!weeks.length || broken.length) {
        for (const entry of broken) console.error(`${entry.file}: ${entry.error}`);
        console.error(`level ${level}: no week files, or a week does not parse`);
        return 1;
    }
    const bookFile = path.resolve(flags.get('--book')!);
    if (!fs.existsSync(bookFile)) {
        console.error(`The book PDF does not exist: ${bookFile}`);
        return 2;
    }
    const bookText = execFileSync('pdftotext', ['-layout', bookFile, '-'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    const classified = classifyReport(report, weeks.flatMap((entry) => (entry.week ? [entry.week] : [])), (week) => weekSection(bookText, week));
    const problems = classCountProblems(classified, report);
    if (problems.length) {
        console.error(`The class counts do not add up to the report:\n  ${problems.join('\n  ')}`);
        return 1;
    }
    const markdown = classifiedMarkdown({
        sourcePath: reportFile,
        sourceSha256: crypto.createHash('sha256').update(reportBytes).digest('hex'),
        report,
        classified,
    });
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, markdown, { flag: 'wx' });
    for (const cls of TEXT_DIFF_CLASSES) console.log(`${cls}\t${classified.filter((item) => item.cls === cls).length}`);
    console.log(`done  ${classified.length} differences classified: ${out}`);
    return 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
