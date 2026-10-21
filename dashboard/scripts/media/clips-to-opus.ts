import fs from 'fs';
import path from 'path';
import { CONTENT_ROOT } from '../../lib/lesson-package/files';
import { parseWav, trimSilence } from '../../lib/media/audio';
import { readClipOpus, writeClipOpus } from '../../lib/media/clip-cache';

const USAGE = `Converts the WAV clip cache to trimmed Opus clips (lib/media/clip-cache.ts), once (2026-10-21).

Usage: npx tsx scripts/media/clips-to-opus.ts [--root <dir>] [--shard <i>/<n>] [--dry-run]

Options:
  --root <dir>      The content folder (default: content/primary)
  --shard <i>/<n>   Do only the clips whose key modulo n is i (0-based), for parallel runs
  --dry-run         Count the files and their size; change nothing

Each <book>/media/<lesson>/.clips/<key>.wav is trimmed as lesson-audio.ts trims it and written as
<key>.opus. The WAV is deleted only after the Opus file reads back with the same rate and sample
count. Unfinished takes (*.take*.wav, *.part.wav) and clips that are quiet from end to end stay.`;

interface Options {
    root: string;
    shard: number;
    shards: number;
    dryRun: boolean;
}

function parseArgs(argv: string[]): Options | number {
    const opts: Options = { root: CONTENT_ROOT, shard: 0, shards: 1, dryRun: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--root') opts.root = path.resolve(argv[++i]);
        else if (a === '--shard') [opts.shard, opts.shards] = argv[++i].split('/').map(Number);
        else if (a === '--dry-run') opts.dryRun = true;
        else {
            console.error(USAGE);
            return 2;
        }
    }
    if (!(Number.isInteger(opts.shard) && Number.isInteger(opts.shards) && opts.shard >= 0 && opts.shard < opts.shards)) {
        console.error(USAGE);
        return 2;
    }
    return opts;
}

/** Every `.clips` folder under the content folder. */
function clipFolders(root: string): string[] {
    const out: string[] = [];
    for (const book of fs.readdirSync(root).sort()) {
        const media = path.join(root, book, 'media');
        if (!fs.existsSync(media)) continue;
        for (const lesson of fs.readdirSync(media).sort()) {
            const dir = path.join(media, lesson, '.clips');
            if (fs.existsSync(dir)) out.push(dir);
        }
    }
    return out;
}

function main(argv: string[]): number {
    const opts = parseArgs(argv);
    if (typeof opts === 'number') return opts;
    const wavs = clipFolders(opts.root).flatMap((dir) =>
        fs
            .readdirSync(dir)
            .filter((f) => f.endsWith('.wav'))
            .sort()
            .map((f) => path.join(dir, f)),
    );
    const isClip = (f: string) => /^[0-9a-f]{16}\.wav$/.test(path.basename(f));
    // The shard comes from the clip key, not the list index: the list gets shorter while other shards run.
    const shardOf = (f: string) => parseInt(path.basename(f).slice(0, 8), 16) % opts.shards;
    const mine = wavs.filter(isClip).filter((f) => shardOf(f) === opts.shard);
    const left = wavs.filter((f) => !isClip(f));
    const bytes = mine.reduce((n, f) => n + fs.statSync(f).size, 0);
    console.log(`Shard ${opts.shard}/${opts.shards}: ${mine.length} WAV clips (${(bytes / 2 ** 20).toFixed(0)} MB); ${left.length} other WAV files stay`);
    if (opts.dryRun) return 0;

    let done = 0;
    let wavBytes = 0;
    let opusBytes = 0;
    const quiet: string[] = [];
    const failed: string[] = [];
    for (const [i, wav] of mine.entries()) {
        const opus = wav.replace(/\.wav$/, '.opus');
        try {
            const pcm = parseWav(fs.readFileSync(wav));
            const samples = trimSilence(pcm.samples, pcm.rate);
            if (samples.length === 0) {
                quiet.push(wav);
                continue;
            }
            writeClipOpus({ rate: pcm.rate, samples }, opus);
            const back = readClipOpus(opus);
            if (back.rate !== pcm.rate || back.samples.length !== samples.length) throw new Error(`read back ${back.rate} Hz, ${back.samples.length} samples`);
            wavBytes += fs.statSync(wav).size;
            opusBytes += fs.statSync(opus).size;
            fs.rmSync(wav);
            done++;
        } catch (e) {
            failed.push(`${wav}: ${(e as Error).message}`);
        }
        if ((i + 1) % 2000 === 0) console.log(`  ${i + 1}/${mine.length}`);
    }
    const mb = (n: number) => (n / 2 ** 20).toFixed(0);
    console.log(`Converted ${done} clips: ${mb(wavBytes)} MB WAV -> ${mb(opusBytes)} MB Opus`);
    if (quiet.length) console.log(`Quiet from end to end (kept as WAV): ${quiet.length}\n  ${quiet.slice(0, 20).join('\n  ')}`);
    if (failed.length) console.error(`Failed (kept as WAV): ${failed.length}\n  ${failed.slice(0, 20).join('\n  ')}`);
    return failed.length ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
