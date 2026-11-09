// Upscale of the final quest covers (track storytime_cover_options_20261106, spec D-A6).
// Usage: node upscale.mjs
// It loads sharp with createRequire from the dashboard package.json, as options/qr_check.mjs
// does. Each source picture becomes 2480 x 3508 px (300 ppi at the A4 trim) with the lanczos3
// kernel, no alpha, and a PNG density of 300. An existing output file stops the script.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..', '..', '..');
const dashboard = path.join(repo, 'dashboard');
const require = createRequire(path.join(dashboard, 'package.json'));
const sharp = require('sharp');

const OUT_DIR = path.join(repo, 'content/storytime/l2/print/pictures');
const WIDTH = 2480;
const HEIGHT = 3508;

const sources = [
  ['l2-u1-cover-quest-student-front-v1.jpg', 'l2-u1-cover-quest-student-front-v1-300ppi.png'],
  ['l2-u1-cover-quest-back-v1.jpg', 'l2-u1-cover-quest-back-v1-300ppi.png'],
];

for (const [sourceName, outName] of sources) {
  const source = path.join(OUT_DIR, sourceName);
  const target = path.join(OUT_DIR, outName);
  if (!fs.existsSync(source)) {
    throw new Error(`missing source ${source}`);
  }
  if (fs.existsSync(target)) {
    throw new Error(`the output exists, and this script never overwrites: ${target}`);
  }
  const meta = await sharp(source).metadata();
  await sharp(source)
    .removeAlpha()
    .resize(WIDTH, HEIGHT, { kernel: 'lanczos3', fit: 'fill' })
    .withMetadata({ density: 300 })
    .png()
    .toFile(target);
  const stat = fs.statSync(target);
  const outMeta = await sharp(target).metadata();
  console.log(`${sourceName} ${meta.width} x ${meta.height} -> ${outName} `
    + `${outMeta.width} x ${outMeta.height}, density ${outMeta.density}, `
    + `${stat.size} bytes`);
}
