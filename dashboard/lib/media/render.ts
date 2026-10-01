import fs from 'fs';
import sharp from 'sharp';
import { overlaySvg, type Overlay } from './images';

/**
 * Writes the final picture: the raw mmx picture with its signs drawn on top (server only).
 * @param rawFile The chosen raw picture.
 * @param outFile The final picture (JPEG).
 * @param overlays The text overlays; with none, the raw picture is copied.
 */
export async function renderImage(rawFile: string, outFile: string, overlays: Overlay[]): Promise<void> {
    if (overlays.length === 0) {
        fs.copyFileSync(rawFile, outFile);
        return;
    }
    const meta = await sharp(rawFile).metadata();
    const width = meta.width ?? 1024;
    const height = meta.height ?? 1024;
    await sharp(rawFile)
        .composite([{ input: Buffer.from(overlaySvg(overlays, width, height)), top: 0, left: 0 }])
        .jpeg({ quality: 90 })
        .toFile(outFile);
}
