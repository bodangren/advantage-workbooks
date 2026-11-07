import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { STORYTIME_ROOT } from '../../lib/storytime/files';
import { StorytimeWeekSchema } from '../../lib/storytime/schema';
import { parseSilenceOnsets, videoLeadIn } from '../../lib/storytime/word-clips';

/**
 * The lead-in measure of the Storytime song videos (Phase 11, spec FR 5, decision K13). The lead-in
 * is the seconds from the start of a song video to the same sound in `song.mp3`. The script reads
 * each onset with ffmpeg silencedetect, checks the second onsets against the first value, and
 * writes `song.videoLeadInSeconds` by a text edit. Each run starts ffmpeg, so each track run goes
 * inside one heavy-run job.
 */

/** The usage text of the script. */
const USAGE = `Measures the lead-in of the song videos of one Storytime week (Phase 11, spec FR 5).

Usage: npx tsx scripts/storytime/measure-video-lead-in.ts --level <n> --week <n> [--write]

--level  The level of the week.
--week   The week.
--write  Sets song.videoLeadInSeconds in the week file. Without --write the script prints the value
         and writes nothing.

The script reads song.audio and each of song.video, song.videoPhone, and song.karaoke. A song with
no video prints "no video" and writes nothing. A song with no audio stops with exit 1. The two second
onsets must agree with the lead-in, and the videos of one song must agree with each other.

The w01 videos are not in git. Run the script on the work-tree videos only after their SHA-256
equals the lines of the w01-storytime-app-package-r3 MANIFEST.`;

/** The silencedetect settings of the measure (K13). */
const SILENCE_FILTER = 'silencedetect=noise=-40dB:d=0.05';

/** The options of one run (spec FR 5). */
export interface MeasureVideoLeadInOptions {
    /** The week file to read, and to edit with `write`. */
    weekFile: string;
    /** The content root. */
    contentRoot: string;
    /** Sets the field in the week file. */
    write?: boolean;
}

/** The result of one run. */
export interface MeasureVideoLeadInResult {
    /** The lead-in of the first video, in seconds, to 3 decimals. */
    leadIn: number | undefined;
    /** The printed lines of the run. */
    lines: string[];
}

/**
 * The length of a media file, in seconds, from ffprobe.
 * @param file The path of the file.
 * @returns The length.
 * @throws Error When ffprobe gives no finite length.
 */
function probeLength(file: string): number {
    const run = spawnSync('ffprobe', [
        '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file,
    ], { encoding: 'utf8', timeout: 120_000 });
    const value = Number(String(run.stdout).trim());
    if (!Number.isFinite(value)) throw new Error(`lead-in: no length for ${file}: ${String(run.stderr).trim().slice(0, 300)}`);
    return value;
}

/**
 * The sound onsets of one media file, in order (K13).
 * @param file The path of the file.
 * @returns The onsets, in seconds.
 * @throws Error When ffmpeg fails.
 */
function onsetsOf(file: string): number[] {
    const run = spawnSync('ffmpeg', [
        '-hide_banner', '-nostats', '-i', file, '-vn', '-af', SILENCE_FILTER, '-f', 'null', '-',
    ], { encoding: 'utf8', timeout: 120_000 });
    if (run.status !== 0) throw new Error(`lead-in: ffmpeg failed for ${file}: ${String(run.stderr).trim().slice(0, 300)}`);
    return parseSilenceOnsets(String(run.stderr), probeLength(file));
}

/**
 * The week text with one `videoLeadInSeconds` line (K13). An existing line changes on that line
 * only. Else the line goes after the `videoPhone`, `video`, or `karaoke` line of the song.
 * @param text The text of the week file.
 * @param value The lead-in, in seconds.
 * @returns The new text, or the same text when the value is already there.
 * @throws Error When the song names no line to put the field after.
 */
function setLeadInLine(text: string, value: number): string {
    const lines = text.split('\n');
    const valueText = String(value);
    const existing = lines.findIndex((line) => /^\s*"videoLeadInSeconds":/.test(line));
    if (existing >= 0) {
        const match = /^(\s*)"videoLeadInSeconds":\s*([^,]*?)(,?)\s*$/.exec(lines[existing]);
        if (!match) throw new Error('lead-in: the videoLeadInSeconds line has no number');
        lines[existing] = `${match[1]}"videoLeadInSeconds": ${valueText}${match[3]}`;
        return lines.join('\n');
    }
    for (const key of ['videoPhone', 'video', 'karaoke']) {
        const at = lines.findIndex((line) => new RegExp(`^\\s*"${key}":`).test(line));
        if (at < 0) continue;
        const line = lines[at];
        const comma = /,\s*$/.test(line);
        if (!comma) lines[at] = `${line},`;
        const indent = /^(\s*)/.exec(line)?.[1] ?? '';
        lines.splice(at + 1, 0, `${indent}"videoLeadInSeconds": ${valueText}${comma ? ',' : ''}`);
        return lines.join('\n');
    }
    throw new Error('lead-in: the song names no video line');
}

/**
 * Measures the lead-in of the song videos of one week (spec FR 5, decision K13).
 * @param options The week file, the content root, and the write flag.
 * @returns The lead-in of the first video, and the printed lines.
 * @throws Error When the song or its audio is absent, or two videos give different values.
 */
export function measureVideoLeadIn(options: MeasureVideoLeadInOptions): MeasureVideoLeadInResult {
    const text = fs.readFileSync(options.weekFile, 'utf8');
    const week = JSON.parse(text) as {
        song?: { audio?: string; video?: string; videoPhone?: string; karaoke?: string; videoLeadInSeconds?: number };
    };
    const song = week.song;
    if (!song) throw new Error('lead-in: the week has no song');
    if (!song.audio) throw new Error('lead-in: the song has no audio');
    const videos = [song.video, song.videoPhone, song.karaoke]
        .filter((file): file is string => typeof file === 'string' && file.length > 0);
    if (!videos.length) return { leadIn: undefined, lines: ['no video'] };
    const audioOnsets = onsetsOf(path.join(options.contentRoot, song.audio));
    const lines: string[] = [];
    const values: number[] = [];
    for (const video of videos) {
        const videoOnsets = onsetsOf(path.join(options.contentRoot, video));
        const value = videoLeadIn(audioOnsets, videoOnsets);
        if (values.length && Math.abs(value - values[0]) > 0.01) {
            throw new Error(`lead-in: the videos of the song differ by ${Math.abs(value - values[0]).toFixed(3)} s`);
        }
        values.push(value);
        lines.push([video, videoOnsets[0].toFixed(3), audioOnsets[0].toFixed(3), value.toFixed(3)].join('\t'));
    }
    const leadIn = values[0];
    lines.push(`lead-in: ${leadIn.toFixed(3)}`);
    if (options.write) {
        const updated = setLeadInLine(text, leadIn);
        if (updated !== text) {
            StorytimeWeekSchema.parse(JSON.parse(updated));
            fs.writeFileSync(options.weekFile, updated);
        }
    }
    return { leadIn, lines };
}

/**
 * Runs the script with the arguments of the command line.
 * @param argv The arguments after the file name.
 * @returns The exit code: 0 for success, 1 for a data error, 2 for a usage error.
 */
export function main(argv: string[]): number {
    if (argv.includes('--help') || argv.includes('-h')) {
        console.log(USAGE);
        return 0;
    }
    const value = (flag: string): string | undefined => {
        const at = argv.indexOf(flag);
        return at >= 0 ? argv[at + 1] : undefined;
    };
    const level = Number(value('--level'));
    const week = Number(value('--week'));
    if (!Number.isInteger(level) || level < 1 || level > 4 || !Number.isInteger(week) || week < 1 || week > 99) {
        console.error(USAGE);
        return 2;
    }
    try {
        const result = measureVideoLeadIn({
            weekFile: path.join(STORYTIME_ROOT, `l${level}/w${String(week).padStart(2, '0')}.json`),
            contentRoot: STORYTIME_ROOT,
            write: argv.includes('--write'),
        });
        for (const line of result.lines) console.log(line);
        return 0;
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return 1;
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main(process.argv.slice(2));
}
