import fs from 'fs';
import path from 'path';
import { readLevelWeeks, readPhonemeBank, STORYTIME_ROOT } from '../../lib/storytime/files';
import { setPhonemeAudio } from '../../lib/storytime/phonemes';
import { StorytimeWeekSchema } from '../../lib/storytime/schema';

const USAGE = `Sets Daniel's phoneme recordings (S22) in the Storytime week files: the week sound, the sound cards,
the sound game days, and the benchmark sound cards and blend words. Other bytes of a file do not change.

Usage: npx tsx scripts/storytime/set-phoneme-audio.ts --level <n> | --file <week.json>`;

/** The raw number text of the file stays as it is (3.0 stays 3.0). */
type RawJson = { rawJSON(text: string): unknown };
const parseRaw = (text: string): unknown =>
    JSON.parse(text, (_key: string, value: unknown, context?: { source: string }) =>
        typeof value === 'number' && context ? (JSON as unknown as RawJson).rawJSON(context.source) : value,
    );

function main(argv: string[]): number {
    const at = (flag: string) => (argv.indexOf(flag) >= 0 ? argv[argv.indexOf(flag) + 1] : undefined);
    const level = Number(at('--level'));
    const files = at('--file') ? [path.resolve(at('--file')!)] : level >= 1 && level <= 4 ? readLevelWeeks(STORYTIME_ROOT, level).map((w) => w.file) : [];
    if (argv.includes('--help') || !files.length) {
        console.log(USAGE);
        return argv.includes('--help') ? 0 : 2;
    }
    const bank = readPhonemeBank();
    if (!bank) throw new Error('No phoneme bank in content/storytime');
    for (const file of files) {
        const text = fs.readFileSync(file, 'utf8');
        const raw = parseRaw(text);
        const n = setPhonemeAudio(raw, bank, StorytimeWeekSchema.parse(JSON.parse(text)));
        const out = JSON.stringify(raw, null, 2) + '\n';
        if (out !== text) fs.writeFileSync(file, out);
        console.log(`${path.relative(process.cwd(), file)}: ${n} field(s)${out === text ? ', no change' : ''}`);
    }
    return 0;
}

process.exitCode = main(process.argv.slice(2));
