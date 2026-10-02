import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { LessonPackageSchema, type LessonPackage } from '../../lib/lesson-package/schema';

const USAGE = `Makes the missing pictures and audio for every package in some book folders
(track level_banks_20261002). It runs the one-lesson scripts: lesson-images.ts (Muse) and
lesson-audio.ts (mmx).

Usage: npx tsx scripts/media/make-media.ts <book folder>... [--images] [--audio] [--count <n>] [--jobs <n>]

  --images     Pictures for each image that has no candidate yet (Muse, --count candidates each;
               the first one becomes the picture until someone picks another on /review)
  --audio      Audio for each package whose audio is missing or no longer matches the text
  --count <n>  Muse candidates per image (default 1)
  --jobs <n>   Picture jobs at the same time (default 3). Audio runs one lesson at a time in a
               run; for more speed, start runs on different book folders (separate mmx
               processes work in parallel, tested 2026-10-02).

Without --images and --audio it does both. A failed lesson is reported, and the run goes on.
Each lesson is checked again just before its turn, so two runs on the same folders do not
repeat a lesson that the other run finished.`;

const DASHBOARD = path.resolve(__dirname, '..', '..');

function needsImages(p: LessonPackage): boolean {
    return p.images.some((img) => !img.file && img.candidates.length === 0);
}

function needsAudio(p: LessonPackage): boolean {
    if (!p.audio.article || !p.audio.flashcard) return true;
    const sentences = p.thai.paragraphs.flat().map((s) => s.en.trim());
    if (sentences.length !== p.audio.sentences.length || sentences.some((s, i) => s !== p.audio.sentences[i]?.text)) return true;
    if (p.glossary.some((g, i) => p.audio.wordTimes[i]?.text !== g.word)) return true;
    return p.meta.role !== 'bank' && !p.audio.tutor;
}

function run(args: string[], label: string): Promise<boolean> {
    return new Promise((resolve) => {
        const child = spawn('npx', ['tsx', ...args], { cwd: DASHBOARD, stdio: ['ignore', 'pipe', 'pipe'] });
        let tail = '';
        const keep = (d: Buffer) => {
            tail = (tail + d.toString()).slice(-600);
        };
        child.stdout.on('data', keep);
        child.stderr.on('data', keep);
        child.on('close', (code) => {
            console.log(`${code === 0 ? 'done ' : 'FAIL '} ${label}${code === 0 ? '' : `\n${tail.trim().split('\n').slice(-4).map((l) => `    ${l}`).join('\n')}`}`);
            resolve(code === 0);
        });
    });
}

async function pool<T>(items: T[], jobs: number, work: (item: T) => Promise<boolean>): Promise<number> {
    let next = 0;
    let failed = 0;
    await Promise.all(
        Array.from({ length: Math.min(jobs, items.length) }, async () => {
            while (next < items.length) {
                const item = items[next++];
                if (!(await work(item))) failed++;
            }
        }),
    );
    return failed;
}

async function main(argv: string[]): Promise<number> {
    const folders: string[] = [];
    let images = false;
    let audio = false;
    let count = 1;
    let jobs = 3;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--images') images = true;
        else if (a === '--audio') audio = true;
        else if (a === '--count') count = Number(argv[++i]);
        else if (a === '--jobs') jobs = Number(argv[++i]);
        else if (!a.startsWith('--')) folders.push(path.resolve(a));
        else {
            console.error(USAGE);
            return 2;
        }
    }
    if (!folders.length || !(count >= 1) || !(jobs >= 1)) {
        console.error(USAGE);
        return 2;
    }
    if (!images && !audio) images = audio = true;
    const files = folders.flatMap((d) => fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort().map((f) => path.join(d, f)));
    const read = (f: string) => LessonPackageSchema.safeParse(JSON.parse(fs.readFileSync(f, 'utf8')));
    const label = (f: string) => `${path.basename(path.dirname(f))}/${path.basename(f, '.json')}`;
    let failed = 0;
    if (images) {
        const todo = files.filter((f) => {
            const p = read(f);
            return p.success && needsImages(p.data);
        });
        console.log(`Pictures: ${todo.length} package(s), ${count} candidate(s) per image, ${jobs} at a time`);
        failed += await pool(todo, jobs, async (f) => {
            const p = read(f);
            if (p.success && !needsImages(p.data)) return true;
            return run(['scripts/media/lesson-images.ts', f, '--model', 'muse', '--count', String(count)], `pictures ${label(f)}`);
        });
    }
    if (audio) {
        const todo = files.filter((f) => {
            const p = read(f);
            return p.success && needsAudio(p.data);
        });
        console.log(`Audio: ${todo.length} package(s), one at a time`);
        failed += await pool(todo, 1, async (f) => {
            const p = read(f);
            if (p.success && !needsAudio(p.data)) return true;
            return run(['scripts/media/lesson-audio.ts', f], `audio ${label(f)}`);
        });
    }
    console.log(failed ? `${failed} job(s) failed; run again to retry them` : 'All jobs done');
    return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
