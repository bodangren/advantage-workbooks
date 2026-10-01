import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { LessonPackageSchema } from '../../lib/lesson-package/schema';
import { checkContextFor } from '../../lib/lesson-package/context';
import { REPO_ROOT } from '../../lib/lesson-package/files';
import { chooseImage, renderPictures, savePackage } from '../../lib/lesson-package/store';
import { CastSchema, parseSavedFiles } from '../../lib/media/cast';
import { imageArgs, promptProblems, sheetFor } from '../../lib/media/images';

const SHEETS = path.join(REPO_ROOT, 'docs', 'content-plans', 'character-sheets');

const USAGE = `Makes picture candidates for a lesson package with mmx (track lesson_media_20261001).

Usage: npx tsx scripts/media/lesson-images.ts <package.json> [options]

Options:
  --only <pos,...>   Only these positions (for example hero,inline-para-2)
  --redo-marked      Only the images Daniel marked "new pictures" on the review page
  --count <n>        Candidates per image (default 2)
  --render           Draw the overlays again on the chosen pictures; make nothing new
  --dry-run          Print the prompts and references; make nothing

By default it makes candidates for every image that has none. The character sheets in
docs/content-plans/character-sheets are the subject references (the chosen sheet, or else the
printed source). An image with no picture yet gets its first candidate; Daniel can pick another
on /review. Prompts with skin, race, or nationality words are refused. Jobs run one at a time.`;

interface Options {
    file: string;
    only?: string[];
    redoMarked: boolean;
    count: number;
    render: boolean;
    dryRun: boolean;
}

function parseArgs(argv: string[]): Options | number {
    const opts: Partial<Options> = { redoMarked: false, count: 2, render: false, dryRun: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--only') opts.only = argv[++i].split(',').map((s) => s.trim());
        else if (a === '--redo-marked') opts.redoMarked = true;
        else if (a === '--count') opts.count = Number(argv[++i]);
        else if (a === '--render') opts.render = true;
        else if (a === '--dry-run') opts.dryRun = true;
        else if (!a.startsWith('--') && !opts.file) opts.file = path.resolve(a);
        else {
            console.error(USAGE);
            return 2;
        }
    }
    if (!opts.file || !(opts.count! >= 1)) {
        console.error(USAGE);
        return 2;
    }
    return opts as Options;
}

async function main(argv: string[]): Promise<number> {
    const opts = parseArgs(argv);
    if (typeof opts === 'number') return opts;
    const parsed = LessonPackageSchema.safeParse(JSON.parse(fs.readFileSync(opts.file, 'utf8')));
    if (!parsed.success) {
        console.error(`The package does not parse: ${parsed.error.issues[0]?.message}`);
        return 1;
    }
    let pkg = parsed.data;
    const root = path.dirname(path.dirname(opts.file));
    const book = path.basename(path.dirname(opts.file));
    const lesson = path.basename(opts.file, '.json');

    if (opts.render) {
        await renderPictures(root, pkg);
        console.log('Overlays drawn again.');
        return 0;
    }

    const bad = pkg.images.flatMap((img) => promptProblems(img.prompt).map((w) => `${img.position}: "${w}"`));
    if (bad.length) {
        console.error(`Prompts must describe hair and clothes only (series bible v1.2). Fix: ${bad.join('; ')}`);
        return 1;
    }
    const cast = CastSchema.parse(JSON.parse(fs.readFileSync(path.join(SHEETS, 'cast.json'), 'utf8')));
    const todo = pkg.images.filter((img) => (opts.only ? opts.only.includes(img.position) : opts.redoMarked ? img.redo : img.candidates.length === 0));
    if (todo.length === 0) {
        console.log('Nothing to make.');
        return 0;
    }
    const outRel = path.join(book, 'media', lesson, 'candidates');
    fs.mkdirSync(path.join(root, outRel), { recursive: true });
    let failed = 0;
    for (const img of todo) {
        // mmx numbers files from 001 on every run, so a later run needs its own prefix.
        const prefix = img.candidates.length ? `${img.position}-${img.candidates.length + 1}` : img.position;
        const args = imageArgs(cast, img, { sheetsDir: SHEETS, outDir: path.join(root, outRel), prefix, count: opts.count });
        const refs = img.characters.map((n) => `${n}=${sheetFor(cast, n) ?? 'none'}`).join(', ');
        if (opts.dryRun) {
            console.log(`${img.position} [${refs}]\n  ${args[args.indexOf('--prompt') + 1]}`);
            continue;
        }
        console.log(`${img.position}: making ${opts.count} candidate(s) [${refs}]...`);
        const run = spawnSync('mmx', args, { encoding: 'utf8', timeout: 300_000 });
        const saved = parseSavedFiles(run.stdout ?? '');
        if (saved.length === 0) {
            failed++;
            console.error(`${img.position}: no picture (${(run.stderr || run.stdout || String(run.error)).trim().slice(0, 300)})`);
            continue;
        }
        img.candidates = [...new Set([...img.candidates, ...saved.map((s) => path.join(outRel, path.basename(s)))])];
        img.redo = undefined;
        console.log(`${img.position}: ${saved.map((s) => path.basename(s)).join(', ')}`);
    }
    if (opts.dryRun) return 0;
    pkg = savePackage(root, book, lesson, pkg, checkContextFor).pkg ?? pkg;
    for (const img of pkg.images.filter((i) => !i.file && i.candidates.length)) {
        pkg = (await chooseImage(root, book, lesson, img.position, img.candidates[0], checkContextFor)).pkg ?? pkg;
    }
    console.log(`Saved ${path.relative(process.cwd(), opts.file)}; images approval: ${pkg.approval.images.status}. Pick on /review/${book}/${lesson}.`);
    return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
