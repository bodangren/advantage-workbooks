// The teacher fallback upscale of the Task 2.9 part 1 A2 build (track storytime_cover_options_20261106).
//
// It makes the same file as the r2, r3, r4, and r5 rounds: the art `Q-teacher-a1-clean2.jpg` becomes
// `l2-u1-cover-quest-teacher-front-v1-300ppi.png`, 2480 x 3508 px (300 ppi at the A4 trim), with the
// lanczos3 kernel, no alpha, and a PNG density of 300. The method is the method of
// `measure/tracks/storytime_cover_options_20261106/options/upscale.mjs`: sharp from the dashboard
// package, and the script never overwrites an existing output.
//
// Usage: node measure/runs/storytime_cover_options_20261106/upscale-teacher-fallback-2-9a-a2.mjs
//
// It prints the source size, the output size, the format, the alpha flag, the density, the byte
// size, and the SHA-256 of both files. It never opens or shows a page image.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..', '..');
const dashboard = path.join(repo, 'dashboard');
const require = createRequire(path.join(dashboard, 'package.json'));
const sharp = require('sharp');

const SOURCE = '/home/daniebo/Desktop/print-ready/storytime/covers-quest-art-v1/Q-teacher-a1-clean2.jpg';
const TARGET = '/tmp/opencode/c29a2/pictures/l2-u1-cover-quest-teacher-front-v1-300ppi.png';
const WIDTH = 2480;
const HEIGHT = 3508;

function sha256(path) {
    return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
}

if (fs.existsSync(TARGET)) {
    throw new Error(`the output exists, and this script never overwrites: ${TARGET}`);
}
if (!fs.existsSync(SOURCE)) {
    throw new Error(`missing source ${SOURCE}`);
}

const meta = await sharp(SOURCE).metadata();
await sharp(SOURCE)
    .removeAlpha()
    .resize(WIDTH, HEIGHT, { kernel: 'lanczos3', fit: 'fill' })
    .withMetadata({ density: 300 })
    .png()
    .toFile(TARGET);

const outMeta = await sharp(TARGET).metadata();
const stat = fs.statSync(TARGET);
console.log(`SOURCE ${SOURCE} ${meta.width} x ${meta.height} ${meta.format}`);
console.log(`OUTPUT_SIZE ${outMeta.width} x ${outMeta.height}`);
console.log(`OUTPUT_FORMAT ${outMeta.format}`);
console.log(`OUTPUT_HAS_ALPHA ${outMeta.hasAlpha}`);
console.log(`OUTPUT_DENSITY ${outMeta.density}`);
console.log(`OUTPUT_BYTES ${stat.size}`);
console.log(`SOURCE_SHA256 ${sha256(SOURCE)}`);
console.log(`OUTPUT_SHA256 ${sha256(TARGET)}`);
