import path from 'path';
import { fileURLToPath } from 'url';
import { THAI } from '../../document-wrapper/print-fonts';

/**
 * The print faces of the Storytime workbook and its readers (spec FR-3): Andika for English and
 * Sarabun for Thai, each a static OFL file with no package change. Both documents load the same
 * faces from this module, so the student workbook and the reader pages embed one face set.
 */

interface PrintFace {
    family: 'Andika' | 'Sarabun';
    weight: number;
    file: string;
    format: 'truetype' | 'opentype' | 'woff' | 'woff2';
    unicodeRange?: string;
}

/**
 * One static face for each weight in use, so that Chrome embeds no synthesized face (which would
 * become a Type 3 font in the PDF/X file, lessons-learned 2026-10-02).
 */
const PRINT_FACES: PrintFace[] = [
    { family: 'Andika', weight: 400, file: 'andika-regular.ttf', format: 'truetype' },
    { family: 'Andika', weight: 700, file: 'andika-bold.ttf', format: 'truetype' },
    { family: 'Sarabun', weight: 400, file: 'sarabun-thai-400-normal.woff2', format: 'woff2', unicodeRange: THAI },
];

/** The folder with the print font files (the Fontsource builds and the Andika TTFs). */
const PRINT_FONT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'assets', 'print-fonts');

let cachedFontCss: string | undefined;

/**
 * The `@font-face` rules of the two documents, with each static face as a `file:` URL, so that a
 * `file://` render in Chrome and the tests load the same faces. The faces are not data URLs: a
 * base64 blob can contain a forbidden label by chance (the R28 label check reads the whole HTML),
 * and a static file needs no embedding.
 * @returns The CSS.
 */
export function fontFaceCss(): string {
    if (cachedFontCss) return cachedFontCss;
    cachedFontCss = PRINT_FACES.map((f) => {
        const range = f.unicodeRange ? ` unicode-range: ${f.unicodeRange};` : '';
        return `@font-face { font-family: '${f.family}'; font-weight: ${f.weight}; font-style: normal; src: url('file://${PRINT_FONT_DIR}/${f.file}') format('${f.format}');${range} }`;
    }).join('\n');
    return cachedFontCss;
}
