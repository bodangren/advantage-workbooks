import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import type { Browser } from '@playwright/test';
import sharp from 'sharp';

/**
 * Runs a command and returns its standard output.
 * @param cmd The program.
 * @param args Its arguments.
 * @returns The output; throws with the end of stderr when the command fails.
 */
export function run(cmd: string, args: string[]): string {
    const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.error) throw new Error(`${cmd}: ${r.error.message}`);
    if (r.status !== 0) throw new Error(`${cmd} failed (${r.status}): ${(r.stderr || r.stdout).trim().split('\n').slice(-3).join('\n')}`);
    return r.stdout;
}

/**
 * Downloads the bucket pictures that the cache does not have yet (three tries each), as JPEG files.
 * @param files The picture URLs and their cache files (from `localPictures`).
 */
export async function downloadPictures(files: { url: string; file: string }[]): Promise<void> {
    for (const { url, file } of files) {
        if (fs.existsSync(file) && fs.statSync(file).size > 0) continue;
        fs.mkdirSync(path.dirname(file), { recursive: true });
        let last = '';
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const jpeg = await sharp(Buffer.from(await res.arrayBuffer())).flatten({ background: '#ffffff' }).jpeg({ quality: 88 }).toBuffer();
                fs.writeFileSync(`${file}.part`, jpeg);
                fs.renameSync(`${file}.part`, file);
                last = '';
                break;
            } catch (e) {
                last = e instanceof Error ? e.message : String(e);
            }
        }
        if (last) throw new Error(`picture download failed: ${url} (${last})`);
    }
}

/**
 * Renders one HTML file with Paged.js in Chrome and prints it to PDF, as Chrome's print dialog does.
 * @param browser A Playwright browser (system Chrome).
 * @param htmlFile The document, with local pictures.
 * @param pdfFile The output file.
 * @param pagedSrc The Paged.js polyfill source.
 * @returns The page count.
 */
export async function renderPagedPdf(browser: Browser, htmlFile: string, pdfFile: string, pagedSrc: string): Promise<number> {
    const page = await browser.newPage();
    try {
        page.setDefaultTimeout(900_000);
        await page.goto(`file://${htmlFile}`, { waitUntil: 'load', timeout: 300_000 });
        await page.addScriptTag({ content: 'window.PagedConfig = { auto: false };' });
        await page.addScriptTag({ content: pagedSrc });
        await page.evaluate('(async () => { await document.fonts.ready; await window.PagedPolyfill.preview(); await document.fonts.ready; })()');
        const pages = (await page.evaluate('document.querySelectorAll(".pagedjs_page").length')) as number;
        // As in Chrome's print dialog: Paged.js lays out the pages, then the print CSS applies.
        await page.emulateMedia({ media: 'print' });
        await page.pdf({ path: pdfFile, preferCSSPageSize: true, printBackground: true });
        return pages;
    } finally {
        await page.close();
    }
}
