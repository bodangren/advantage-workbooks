import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { CastSchema, castImageArgs, chooseSheet, parseSavedFiles, type Cast } from '../../lib/media/cast';
import { OPENROUTER_IMAGES_URL, castMuseRequest, imagesFromResponse, openRouterKey } from '../../lib/media/openrouter-image';
import { REPO_ROOT } from '../../lib/lesson-package/files';

const DIR = path.join(REPO_ROOT, 'docs', 'content-plans', 'character-sheets');

const USAGE = `Makes character-sheet candidates with mmx or Meta Muse Image (track lesson_media_20261001).

Usage: npx tsx scripts/media/cast-sheets.ts [--only a,b] [--count 2] [--all] [--with-source] [--model mmx|muse]
       npx tsx scripts/media/cast-sheets.ts --choose <name>=<candidate>

Reads docs/content-plans/character-sheets/cast.json. By default it makes candidates only for
characters that have none and no approved sheet. --all makes new candidates for every character
that is not approved. --with-source (mmx only) passes the printed source picture as a subject
reference (off by default: a reference pulls MiniMax toward a 3D look). Jobs run one at a time.

--model muse: Meta Muse Image through OpenRouter (key OPENROUTER_API_KEY in dashboard/.env.local).
The anchor (cast.anchor) comes from its printed picture; every other character gets the approved
anchor sheet as the style reference and its printed picture for the look, so make and choose the
anchor first.

--choose copies a candidate to <name>.jpg and records it (the same as a pick on /review/cast).`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const save = (cast: Cast) => fs.writeFileSync(path.join(DIR, 'cast.json'), `${JSON.stringify(cast, null, 2)}\n`);

/** One Muse picture as JPEG; a failed call is tried once more after a wait. */
async function musePicture(body: object, key: string, file: string): Promise<number> {
    for (let attempt = 1; ; attempt++) {
        try {
            const res = await fetch(OPENROUTER_IMAGES_URL, {
                method: 'POST',
                headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'Advantage Workbooks' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(300_000),
            });
            const out = imagesFromResponse(await res.json());
            await sharp(out.images[0].data).jpeg({ quality: 90 }).toFile(file);
            return out.cost ?? 0;
        } catch (e) {
            if (attempt >= 2) throw e;
            await wait(10_000);
        }
    }
}

async function main(argv: string[]): Promise<number> {
    let only: string[] | undefined;
    let count = 2;
    let all = false;
    let withSource = false;
    let model: 'mmx' | 'muse' = 'mmx';
    let choose: string | undefined;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--only') only = argv[++i].split(',').map((s) => s.trim());
        else if (a === '--count') count = Number(argv[++i]);
        else if (a === '--all') all = true;
        else if (a === '--with-source') withSource = true;
        else if (a === '--model' && ['mmx', 'muse'].includes(argv[i + 1])) model = argv[++i] as 'mmx' | 'muse';
        else if (a === '--choose') choose = argv[++i];
        else {
            console.error(USAGE);
            return 2;
        }
    }
    const cast = CastSchema.parse(JSON.parse(fs.readFileSync(path.join(DIR, 'cast.json'), 'utf8')));
    if (choose) {
        const [name, candidate] = choose.split('=');
        chooseSheet(DIR, cast, name, candidate, new Date().toISOString().slice(0, 10));
        save(cast);
        console.log(`${name}: ${candidate} → ${name}.jpg`);
        return 0;
    }
    dotenv.config({ path: path.join(REPO_ROOT, 'dashboard', '.env.local'), quiet: true });
    const key = openRouterKey(process.env);
    if (model === 'muse' && !key) {
        console.error('Set OPENROUTER_API_KEY in dashboard/.env.local');
        return 2;
    }
    fs.mkdirSync(path.join(DIR, 'candidates'), { recursive: true });
    let failed = 0;
    let cost = 0;
    for (const character of cast.characters) {
        if (only && !only.includes(character.name)) continue;
        if (character.approved) continue;
        if (!only && !all && character.candidates.length > 0) continue;
        console.log(`${character.name}: making ${count} ${model} candidate(s)...`);
        let saved: string[] = [];
        if (model === 'muse') {
            try {
                const { body, refs } = castMuseRequest(cast, character, (rel) => fs.readFileSync(path.join(DIR, rel)));
                console.log(`  references: ${refs.join(', ') || 'none'}`);
                const prefix = `${character.candidates.length ? `${character.name}-${character.candidates.length + 1}` : character.name}-muse`;
                for (let k = 1; k <= count; k++) {
                    const file = path.join(DIR, 'candidates', `${prefix}_${String(k).padStart(3, '0')}.jpg`);
                    cost += await musePicture(body, key!, file);
                    saved.push(file);
                }
            } catch (e) {
                console.error(`${character.name}: ${(e as Error).message.slice(0, 300)}`);
            }
        } else {
            const run = spawnSync('mmx', castImageArgs(cast, character, { dir: DIR, count, withSource }), { encoding: 'utf8', timeout: 300_000 });
            saved = parseSavedFiles(run.stdout ?? '');
            if (saved.length === 0) console.error(`${character.name}: no image (${(run.stderr || run.stdout || String(run.error)).trim().slice(0, 300)})`);
        }
        if (saved.length === 0) {
            failed++;
            continue;
        }
        character.candidates = [...new Set([...character.candidates, ...saved.map((s) => path.join('candidates', path.basename(s)))])];
        save(cast);
        console.log(`${character.name}: ${saved.map((s) => path.basename(s)).join(', ')}`);
    }
    if (cost) console.log(`Muse cost: $${cost.toFixed(2)}`);
    return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
