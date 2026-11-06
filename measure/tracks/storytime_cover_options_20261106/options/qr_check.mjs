// QR module check of the cut LINE QR (track storytime_cover_options_20261106, spec FR-4.4).
// Usage: node qr_check.mjs <hand-off folder>
// The encoder is the one of the cover module (`lib/qr-generator.ts`: qrcode-generator, type 0, level M).
// The script finds the dark-module box of assets/line-qr.png, samples the centre of each module, and
// compares the grid with the encoder output. Exit 0 when zero modules differ.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dashboard = path.resolve(here, '..', '..', '..', '..', 'dashboard');
const require = createRequire(path.join(dashboard, 'package.json'));
const qrcode = require('qrcode-generator');
const sharp = require('sharp');

const LINE = 'https://line.me/ti/p/Pf7_EF98Pv';
const file = path.join(process.argv[2], 'assets', 'line-qr.png');
const qr = qrcode(0, 'M');
qr.addData(LINE);
qr.make();
const n = qr.getModuleCount();
const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
const dark = (x, y) => data[y * info.width + x] < 128;
let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (dark(x, y)) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
}
const step = (x1 - x0 + 1) / n;
let differ = 0;
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const x = Math.round(x0 + (c + 0.5) * step), y = Math.round(y0 + (r + 0.5) * step);
    if (dark(x, y) !== qr.isDark(r, c)) differ++;
}
console.log(`QR ${file}: ${n} x ${n} modules, ${step.toFixed(2)} px each, ${differ} modules differ from the encoder output for ${LINE}`);
process.exit(differ === 0 ? 0 : 1);
