/**
 * The S5 proof PDFs (track primary_v2_look_20261020, Phase S5).
 *
 * It makes one Chrome PDF from one proof HTML with `renderPagedPdf`, the same
 * function `scripts/print/make-book-pdf.ts` calls, and the Paged.js polyfill
 * from `node_modules`. It removes the unpkg CDN tag from the document, as the
 * product print scripts do, and writes the stripped copy into the proof folder
 * for check P7. It writes into a versioned proof folder. The folder holds the
 * identity of the whole proof round (the HTML and the package of every proof).
 * The driver refuses a folder that holds a different round identity and refuses
 * a PDF that already exists, so an approved proof is never overwritten. It also
 * writes the page-box count of Paged.js for check P4.
 *
 * Usage: npx tsx make-proof-pdf.ts --round-html <file.html> --round-html <file.html>
 *          --round-package <package.json> --round-package <package.json>
 *          --html <file.html> --package <package.json> --out <file.pdf>
 *          --folder <proof folder> --tag <name>
 */
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { chromium } from '../../../../dashboard/node_modules/@playwright/test';
import { renderPagedPdf } from '../../../../dashboard/lib/print/render';

interface Args {
    roundHtml: string[];
    roundPackages: string[];
    html: string;
    packages: string[];
    out: string;
    folder: string;
    tag: string;
}

/**
 * The SHA-256 of a file.
 * @param file The file path.
 * @returns The hex digest.
 */
function sha256(file: string): string {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * The identity of a proof round: every HTML and every package of the round.
 * @param args The command arguments.
 * @returns The identity text.
 */
function roundIdentity(args: Args): string {
    const lines: string[] = [];
    for (const html of args.roundHtml) lines.push(`html ${path.basename(html)} ${sha256(html)}`);
    for (const packagePath of args.roundPackages) lines.push(`package ${path.basename(path.dirname(packagePath))}/${path.basename(packagePath)} ${sha256(packagePath)}`);
    return `${lines.join('\n')}\n`;
}

/**
 * Reads the command arguments.
 * @param argv The command arguments.
 * @returns The arguments.
 */
function parseArgs(argv: string[]): Args {
    const args: Args = { roundHtml: [], roundPackages: [], html: '', packages: [], out: '', folder: '', tag: '' };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--round-html') args.roundHtml.push(path.resolve(argv[++i]));
        else if (a === '--round-package') args.roundPackages.push(path.resolve(argv[++i]));
        else if (a === '--html') args.html = path.resolve(argv[++i]);
        else if (a === '--package') args.packages.push(path.resolve(argv[++i]));
        else if (a === '--out') args.out = path.resolve(argv[++i]);
        else if (a === '--folder') args.folder = path.resolve(argv[++i]);
        else if (a === '--tag') args.tag = argv[++i];
        else throw new Error(`Unknown argument: ${a}`);
    }
    if (!args.html || !args.out || !args.folder || !args.tag) throw new Error('--html, --out, --folder, and --tag are required');
    if (!args.roundHtml.length || !args.roundPackages.length) throw new Error('--round-html and --round-package are required');
    return args;
}

/**
 * Makes the proof PDF.
 * @param argv The command arguments.
 * @returns The exit code.
 */
async function main(argv: string[]): Promise<number> {
    const args = parseArgs(argv);
    if (fs.existsSync(args.out)) {
        console.error(`REFUSED: ${args.out} already exists; a proof PDF is never overwritten`);
        return 1;
    }
    const proof = roundIdentity(args);
    const identityFile = path.join(args.folder, 'round-identity.txt');
    if (fs.existsSync(args.folder)) {
        const entries = fs.readdirSync(args.folder).filter((name) => name !== 'round-identity.txt');
        const current = fs.existsSync(identityFile) ? fs.readFileSync(identityFile, 'utf8') : '';
        if (entries.length > 0 && current !== proof) {
            console.error(`REFUSED: ${args.folder} holds a different proof round; a proof folder is never overwritten`);
            return 1;
        }
    }
    fs.mkdirSync(args.folder, { recursive: true });
    fs.writeFileSync(identityFile, proof);

    const pagedSrc = fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'), 'utf8');
    // The proof HTML loads Paged.js from unpkg.com and the driver injects the
    // polyfill from node_modules. Both renderers then run on the same page: the
    // document holds the lesson twice (26 step headings, 31 page boxes) and the
    // PDF prints every step on two pages. The classic product books print each
    // lesson once (quest-4-a1.pdf: 234 pages, 14 lessons). The driver removes the
    // CDN tag, as `make-book-pdf.ts` line 60 does, and keeps the polyfill of
    // node_modules as the only renderer, so the proof shows the page as the book
    // prints it. The stripped copy stays in the proof folder for check P7.
    const source = fs.readFileSync(args.html, 'utf8');
    const stripped = source.replace(/<script src="https:\/\/unpkg[^>]*><\/script>/, '');
    if (stripped.includes('unpkg')) throw new Error(`${args.html} still holds an unpkg reference after the strip`);
    const printCopy = path.join(args.folder, `${args.tag}.print.html`);
    fs.writeFileSync(printCopy, stripped);

    const browser = await chromium.launch({ channel: 'chrome', args: ['--host-resolver-rules=MAP unpkg.com ~NOTFOUND'] });
    let pages: number;
    try {
        pages = await renderPagedPdf(browser, printCopy, args.out, pagedSrc);
    } finally {
        await browser.close();
    }
    // The page-box count of Paged.js, written for check P4. The PDF page count is
    // compared with it, so a frozen render with fewer boxes fails the check.
    fs.writeFileSync(path.join(args.folder, `${args.tag}-pagebox.txt`), `${pages}\n`);
    console.log(`PDF ${args.tag}: ${args.out} (${pages} pages, ${fs.statSync(args.out).size} bytes, sha256 ${sha256(args.out)})`);
    return 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
