import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { REPO_ROOT } from '../../lib/lesson-package/files';
import { KIT_LAYERS, pageSize, parseSvg, stripLayer, swapBadge } from '../../lib/covers/kit';

const USAGE = `Cuts the cover kit (the layers that every cover shares) from Daniel's Canva SVG export
(track book_covers_20261007).

Usage: npx tsx scripts/covers/extract-kit.ts --front <front.svg> --back <back.svg> [--badge <CEFR>=<back.svg>]... [--out <dir>]

  --front   A front page of the export (for example 8.svg, Origins 3.2)
  --back    A back page of the export with the A1 badge (for example 9.svg, Origins 3.2)
  --badge   One more CEFR badge: the badge picture of that back page (for example
            A2="Level 4 Back.svg" of the Reading Advantage export), placed where --back has its badge
  --out     Output folder (default assets/cover-kit in the repo)

Writes front-frame.png, back-overlay.png, badge-a1.png, and badge-<cefr>.png for each --badge
(RGBA, 2480 x 3366 px = 210 x 285 mm at 300 ppi; Chrome renders each layer with a transparent
background), and kit.json (the source files with their SHA-256). The art placement is part of each
book's cover data, not of the kit.`;

/** 210 x 285 mm at 300 ppi. */
const KIT_PIXELS = { width: 2480, height: 3366 };

/** Renders one layer SVG to an RGBA PNG of the kit size. */
async function renderLayer(page: import('@playwright/test').Page, svg: string, file: string): Promise<void> {
    const sized = svg.replace(/<svg\b([^>]*)>/, (_, attrs: string) => {
        const rest = attrs.replace(/\s(width|height|preserveAspectRatio)="[^"]*"/g, '');
        return `<svg${rest} width="${KIT_PIXELS.width}" height="${KIT_PIXELS.height}" preserveAspectRatio="none">`;
    });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${sized}</body></html>`, { waitUntil: 'load' });
    const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, ...KIT_PIXELS } });
    await sharp(png).png({ compressionLevel: 9 }).toFile(file);
}

const sha256 = (file: string) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

async function main(argv: string[]): Promise<number> {
    let front: string | undefined;
    let back: string | undefined;
    const badges: Record<string, string> = {};
    let out = path.join(REPO_ROOT, 'assets', 'cover-kit');
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--front') front = path.resolve(argv[++i]);
        else if (a === '--back') back = path.resolve(argv[++i]);
        else if (a === '--out') out = path.resolve(argv[++i]);
        else if (a === '--badge') {
            const m = (argv[++i] ?? '').match(/^([A-C][12])=(.+)$/);
            if (!m) {
                console.error(`--badge needs <CEFR>=<back.svg>, for example A2=Level 4 Back.svg\n\n${USAGE}`);
                return 2;
            }
            badges[m[1]] = path.resolve(m[2]);
        }
        else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
    }
    if (!front || !back) {
        console.error(USAGE);
        return 2;
    }
    const frontSvg = fs.readFileSync(front, 'utf8');
    const backSvg = fs.readFileSync(back, 'utf8');
    const size = pageSize(parseSvg(frontSvg));

    fs.mkdirSync(out, { recursive: true });
    const browser = await chromium.launch({ channel: 'chrome' });
    try {
        const page = await browser.newPage({ viewport: KIT_PIXELS, deviceScaleFactor: 1 });
        await renderLayer(page, stripLayer(frontSvg, KIT_LAYERS.frontFrame, { vectors: true }), path.join(out, 'front-frame.png'));
        await renderLayer(page, stripLayer(backSvg, KIT_LAYERS.backOverlay, { vectors: true }), path.join(out, 'back-overlay.png'));
        await renderLayer(page, stripLayer(backSvg, KIT_LAYERS.badge, { vectors: false }), path.join(out, 'badge-a1.png'));
        for (const [cefr, file] of Object.entries(badges)) {
            const swapped = swapBadge(backSvg, fs.readFileSync(file, 'utf8'));
            await renderLayer(page, stripLayer(swapped, KIT_LAYERS.badge, { vectors: false }), path.join(out, `badge-${cefr.toLowerCase()}.png`));
        }
    } finally {
        await browser.close();
    }
    const kit = {
        source: {
            front: { file: path.basename(front), sha256: sha256(front) },
            back: { file: path.basename(back), sha256: sha256(back) },
            badges: Object.fromEntries(Object.entries(badges).map(([cefr, file]) => [cefr, { file: path.basename(file), sha256: sha256(file) }])),
        },
        page: size,
        pixels: KIT_PIXELS,
        layers: {
            frontFrame: 'front-frame.png',
            backOverlay: 'back-overlay.png',
            badges: { A1: 'badge-a1.png', ...Object.fromEntries(Object.keys(badges).map((cefr) => [cefr, `badge-${cefr.toLowerCase()}.png`])) },
        },
    };
    fs.writeFileSync(path.join(out, 'kit.json'), JSON.stringify(kit, null, 2) + '\n');
    console.log(`Kit written to ${out}`);
    return 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
