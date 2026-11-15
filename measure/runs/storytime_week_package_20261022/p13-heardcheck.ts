/**
 * Phase 13 (spec M10): the heard check of the shipped read-along sentence clips. This script is a
 * script under `measure/runs/`, not repository code.
 *
 * Run from `dashboard/` inside one heavy-run wrapper:
 *     npx tsx ../measure/runs/storytime_week_package_20261022/p13-heardcheck.ts [--week <n>] [--listen <file>]
 *
 * For each read-along clip (book 0) of w01 to w07 (or of one week with `--week <n>`): the recognizer
 * of K9 (`word-times.py`, the faster-whisper venv of the local model) runs on the shipped mp3 file,
 * and the library decision `sentenceHeardPasses` decides. Each clip prints one line: `heard ok`, or
 * `heard differs '<x>'` with the recognized words.
 *
 * The script reads the provenance file `sentences/manifest.json` of each week for the sentence text,
 * the take, and the note of each read-along item. It reads no week text and prints no week text.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { sentenceHeardPasses } from '../../../dashboard/lib/storytime/sentence-clips';

const ROOT = path.resolve(process.cwd(), '../content/storytime');
const PYTHON = path.join(os.homedir(), '.local/share/storytime-word-audio-venv/bin/python');
const WORD_TIMES = path.resolve(process.cwd(), '../dashboard/scripts/storytime/word-times.py');

/** The week argument, or 0 for every week. */
const weekArgument = (() => {
    const at = process.argv.indexOf('--week');
    const value = at >= 0 ? Number(process.argv[at + 1]) : 0;
    return Number.isInteger(value) && value >= 1 && value <= 7 ? value : 0;
})();

/** The file of the listen list, or empty when the run writes no list. */
const listenArgument = (() => {
    const at = process.argv.indexOf('--listen');
    return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : '';
})();

interface ManifestItem {
    book?: number;
    n?: number;
    text?: string;
    file?: string;
    take?: number;
    note?: string;
}

const first = weekArgument || 1;
const last = weekArgument || 7;
const clips: { week: number; file: string; text: string; take: number; note: string }[] = [];
for (let n = first; n <= last; n += 1) {
    const manifestPath = path.join(ROOT, `l2/media/w0${n}/sentences/manifest.json`);
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { items?: ManifestItem[] };
    for (const item of manifest.items ?? []) {
        if (item.book !== 0) continue;
        clips.push({
            week: n,
            file: String(item.file ?? ''),
            text: String(item.text ?? ''),
            take: Number(item.take ?? 0),
            note: String(item.note ?? ''),
        });
    }
}

if (clips.length === 0) {
    console.log('no read-along clips found');
    process.exitCode = 1;
} else {
    const paths = clips.map((clip) => path.join(ROOT, clip.file));
    const run = spawnSync(PYTHON, [WORD_TIMES], { input: JSON.stringify(paths), encoding: 'utf8', maxBuffer: 1 << 26 });
    if (run.status !== 0) {
        console.error(`word-times.py failed: ${(run.stderr || run.stdout || String(run.error)).trim().slice(0, 300)}`);
        process.exitCode = 1;
    } else {
        const parsed = JSON.parse(run.stdout) as { word: string }[][];
        const listen: string[] = [];
        let differs = 0;
        clips.forEach((clip, index) => {
            const heard = (parsed[index] ?? []).map((entry) => String(entry.word));
            const ok = sentenceHeardPasses(clip.text, heard);
            if (!ok) differs += 1;
            console.log(`w0${clip.week} ${clip.file} take ${clip.take} heard ${ok ? 'ok' : `differs '${heard.join(' ')}'`}`);
            if (!ok || clip.take >= 3 || clip.note !== '') {
                listen.push(`w0${clip.week} ${clip.file} take ${clip.take} note "${clip.note}" heard ${ok ? 'ok' : `differs '${heard.join(' ')}'`}`);
            }
        });
        if (listenArgument) {
            fs.writeFileSync(listenArgument, `${listen.join('\n')}\n`, 'utf8');
        }
        console.log(`clips: ${clips.length}, heard differs: ${differs}, listen list: ${listen.length}`);
        process.exitCode = 0;
    }
}
