import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { CastSchema, castImageArgs, parseSavedFiles } from '../../lib/media/cast';
import { REPO_ROOT } from '../../lib/lesson-package/files';

const DIR = path.join(REPO_ROOT, 'docs', 'content-plans', 'character-sheets');

const USAGE = `Makes character-sheet candidates with mmx (track lesson_media_20261001).

Usage: npx tsx scripts/media/cast-sheets.ts [--only a,b] [--count 2] [--all] [--with-source]

Reads docs/content-plans/character-sheets/cast.json. By default it makes candidates only for
characters that have none and no approved sheet. --all makes new candidates for every character
that is not approved. --with-source passes the printed source picture as a subject reference
(off by default: a reference pulls MiniMax toward a 3D look). Jobs run one at a time (mmx gives no output for parallel calls).
Daniel picks one candidate per character on /review/cast.`;

function main(argv: string[]): number {
    let only: string[] | undefined;
    let count = 2;
    let all = false;
    let withSource = false;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--only') only = argv[++i].split(',').map((s) => s.trim());
        else if (a === '--count') count = Number(argv[++i]);
        else if (a === '--all') all = true;
        else if (a === '--with-source') withSource = true;
        else {
            console.error(USAGE);
            return 2;
        }
    }
    const file = path.join(DIR, 'cast.json');
    const cast = CastSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
    fs.mkdirSync(path.join(DIR, 'candidates'), { recursive: true });
    let failed = 0;
    for (const character of cast.characters) {
        if (only && !only.includes(character.name)) continue;
        if (character.approved) continue;
        if (!only && !all && character.candidates.length > 0) continue;
        console.log(`${character.name}: making ${count} candidate(s)...`);
        const run = spawnSync('mmx', castImageArgs(cast, character, { dir: DIR, count, withSource }), { encoding: 'utf8', timeout: 300_000 });
        const saved = parseSavedFiles(run.stdout ?? '');
        if (saved.length === 0) {
            failed++;
            console.error(`${character.name}: no image (${(run.stderr || run.stdout || String(run.error)).trim().slice(0, 300)})`);
            continue;
        }
        character.candidates = [...new Set([...character.candidates, ...saved.map((s) => path.join('candidates', path.basename(s)))])];
        fs.writeFileSync(file, `${JSON.stringify(cast, null, 2)}\n`);
        console.log(`${character.name}: ${saved.join(', ')}`);
    }
    return failed ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
