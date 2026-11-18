// Upscale check of the final quest covers (track storytime_cover_options_20261106, D-A6/D-A8).
// Usage:
//   node upscale_check.mjs --dir <folder> --out <out name> --source <source name> --side <side> [--real]
//
// Checks on the output, one labelled line each, exit 0 when every check passes:
//   1. exactly 2480 x 3508 px
//   2. format png
//   3. hasAlpha false
//   4. 3 channels
//   5. a lanczos3 downscale to the source size differs from the source by a mean of at most 3 of 255
//   6. the name matches l2-u1-cover-quest-<side>-v1-300ppi.png
//   7. with --real: the file is in content/storytime/l2/print/pictures/
//   8. with --real: `git check-ignore` confirms that git ignores the file
//
// The --real flag is off for a check on a copy in another folder (the mutants of the proof).
import { createRequire } from 'node:module';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..', '..', '..');
const dashboard = path.join(repo, 'dashboard');
const require = createRequire(path.join(dashboard, 'package.json'));
const sharp = require('sharp');

const WIDTH = 2480;
const HEIGHT = 3508;

function argOf(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const dir = path.resolve(argOf('--dir', path.join(repo, 'content/storytime/l2/print/pictures')));
const outName = argOf('--out');
const sourceName = argOf('--source');
const side = argOf('--side');
const real = process.argv.includes('--real');

if (!outName || !sourceName || !side) {
  console.error('usage: node upscale_check.mjs --dir <folder> --out <name> --source <name> --side <side> [--real]');
  process.exit(2);
}

const outPath = path.join(dir, outName);
const sourcePath = path.join(dir, sourceName);
const failures = [];
let checks = 0;

function report(label, ok, detail) {
  checks += 1;
  if (!ok) failures.push(label);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${detail}`);
}

const meta = await sharp(outPath).metadata();
report('size', meta.width === WIDTH && meta.height === HEIGHT, `${meta.width} x ${meta.height}`);
report('format', meta.format === 'png', String(meta.format));
report('no alpha', meta.hasAlpha === false, `hasAlpha=${meta.hasAlpha}`);
report('3 channels', meta.channels === 3, `${meta.channels} channels`);

const source = await sharp(sourcePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const down = await sharp(outPath)
  .resize(source.info.width, source.info.height, { kernel: 'lanczos3', fit: 'fill' })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
let total = 0;
let count = 0;
for (let i = 0; i < source.data.length; i += 1) {
  total += Math.abs(source.data[i] - down.data[i]);
  count += 1;
}
const mean = total / count;
report('mean difference at most 3 of 255', mean <= 3, `${mean.toFixed(3)}`);
report('name of spec D-A8', outName === `l2-u1-cover-quest-${side}-v1-300ppi.png`, outName);

if (real) {
  const wanted = path.resolve(repo, 'content/storytime/l2/print/pictures');
  report('file in the print pictures folder', dir === wanted, dir);
  let ignored = false;
  try {
    execFileSync('git', ['check-ignore', '-q', outPath], { cwd: repo, stdio: 'ignore' });
    ignored = true;
  } catch {
    ignored = false;
  }
  report('git ignores the file', ignored, `git check-ignore exit ${ignored ? 0 : 1}`);
}

console.log(`checks=${checks} failures=${failures.length}`);
process.exit(failures.length === 0 ? 0 : 1);
