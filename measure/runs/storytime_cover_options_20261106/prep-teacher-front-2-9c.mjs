// The teacher front preparation of the Task 2.9 part 3 A2 r2 build (track storytime_cover_options_20261106).
//
// This script is `prep-teacher-front-2-9b.mjs` with only the target folder changed. It starts from
// `upscale-teacher-fallback-2-9a-a2.mjs` of the A2 round: the same sharp loader from the dashboard
// package, and the same create-only guard. It reads the Forge teacher front of the PM hand-off TC1
// and writes the prepared teacher front of the build.
//
// Difference to the A2 script: there is no resize. The Forge art is already 2480 x 3508 px, the
// size of the A4 trim (D-A6), and the script must not change a pixel. It sets only the PNG density
// to 300 with the same `withMetadata` call as the A2 script, and it removes the alpha channel.
// Reason: the PNG density field of the Forge file holds 25.4 ppi.
//
// The proof of unchanged pixels: the SHA-256 of `sharp(file).raw().toBuffer()` of the source and of
// the output must be equal. When the values differ, the script exits 1.
//
// Usage: node measure/runs/storytime_cover_options_20261106/prep-teacher-front-2-9c.mjs
//
// It prints the source SHA-256, the output SHA-256, the size, the channels, the density, and both
// raw SHA-256 values. It never opens or shows a page image.
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

const SOURCE = '/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/l2-u1-cover-quest-teacher-front-forge-v1.png';
const TARGET = '/tmp/opencode/c29c/pictures/l2-u1-cover-quest-teacher-front-v1-300ppi.png';
const WIDTH = 2480;
const HEIGHT = 3508;
const SOURCE_SHA = 'c91719903d3803bc02498f8e097528c9a64ddae263102ebf28d06d8d37f11a53';

function sha256(path) {
    return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
}

function rawSha256(file) {
    return sharp(file).raw().toBuffer()
        .then((buffer) => crypto.createHash('sha256').update(buffer).digest('hex'));
}

if (fs.existsSync(TARGET)) {
    throw new Error(`the output exists, and this script never overwrites: ${TARGET}`);
}
if (!fs.existsSync(SOURCE)) {
    throw new Error(`missing source ${SOURCE}`);
}

const stat = fs.statSync(SOURCE);
const meta = await sharp(SOURCE).metadata();
console.log(`SOURCE ${SOURCE}`);
console.log(`SOURCE_SIZE ${meta.width} x ${meta.height}`);
console.log(`SOURCE_CHANNELS ${meta.channels}`);
console.log(`SOURCE_FORMAT ${meta.format}`);
console.log(`SOURCE_DENSITY ${meta.density}`);
console.log(`SOURCE_BYTES ${stat.size}`);
console.log(`SOURCE_SHA256 ${sha256(SOURCE)}`);
console.log(`SOURCE_SHA_EXPECTED ${String(sha256(SOURCE) === SOURCE_SHA).toLowerCase()}`);
console.log(`SOURCE_SIZE_OK ${String(meta.width === WIDTH && meta.height === HEIGHT).toLowerCase()}`);
console.log(`SOURCE_CHANNELS_OK ${String(meta.channels === 3).toLowerCase()}`);

await sharp(SOURCE)
    .removeAlpha()
    .withMetadata({ density: 300 })
    .png()
    .toFile(TARGET);

const outMeta = await sharp(TARGET).metadata();
const outStat = fs.statSync(TARGET);
const sourceRaw = await rawSha256(SOURCE);
const outputRaw = await rawSha256(TARGET);
console.log(`OUTPUT ${TARGET}`);
console.log(`OUTPUT_SIZE ${outMeta.width} x ${outMeta.height}`);
console.log(`OUTPUT_CHANNELS ${outMeta.channels}`);
console.log(`OUTPUT_FORMAT ${outMeta.format}`);
console.log(`OUTPUT_HAS_ALPHA ${outMeta.hasAlpha}`);
console.log(`OUTPUT_DENSITY ${outMeta.density}`);
console.log(`OUTPUT_BYTES ${outStat.size}`);
console.log(`OUTPUT_SHA256 ${sha256(TARGET)}`);
console.log(`SOURCE_RAW_SHA256 ${sourceRaw}`);
console.log(`OUTPUT_RAW_SHA256 ${outputRaw}`);
console.log(`RAW_EQUAL ${String(sourceRaw === outputRaw).toLowerCase()}`);
console.log(`PREP_OK ${String(sourceRaw === outputRaw && outMeta.width === WIDTH
    && outMeta.height === HEIGHT && outMeta.channels === 3
    && outMeta.density === 300 && outMeta.hasAlpha === false).toLowerCase()}`);

if (sourceRaw !== outputRaw) {
    throw new Error('the raw pixels of the output differ from the source');
}
