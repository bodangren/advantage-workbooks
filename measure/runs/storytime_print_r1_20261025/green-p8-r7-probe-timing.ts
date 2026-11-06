import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { STORYTIME_ROOT } from '../../../dashboard/lib/storytime/files';
import { resolveStorytimePictureFiles } from '../../../dashboard/lib/storytime/print/picture-check';
import type { StorytimePictureRow } from '../../../dashboard/lib/storytime/print/pictures';

const folder = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures');
const rows = JSON.parse(fs.readFileSync(path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures.json'), 'utf8')) as StorytimePictureRow[];
const bookRows = rows.filter((row) => row.use !== 'card');

const t0 = Date.now();
const color = resolveStorytimePictureFiles(folder, bookRows, 'color');
const t1 = Date.now();
resolveStorytimePictureFiles(folder, bookRows, 'line');
const t2 = Date.now();
let bytes = 0;
for (const entry of color) bytes += fs.statSync(entry.file).size;
const t3 = Date.now();
console.log(`color rows: ${color.length}`);
console.log(`color resolve ms: ${t1 - t0}`);
console.log(`line resolve ms: ${t2 - t1}`);
console.log(`stat ms: ${t3 - t2}`);
console.log(`color bytes: ${Math.round(bytes / 1e6)} MB`);
const hash = createHash('sha256');
hash.update(fs.readFileSync(color[0].file));
console.log(`one file hash ms: ${Date.now() - t3}`);
