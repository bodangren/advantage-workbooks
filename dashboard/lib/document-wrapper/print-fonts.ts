import fs from 'fs';
import path from 'path';

/**
 * Static print fonts (track print_ready_pdf_20261002). Chrome writes a variable font, which is
 * what Google Fonts serves, as a Type 3 font in a PDF, and it writes a bold or italic that it
 * synthesizes as Type 3 too. The printer (Acrobat 9 Pro) cannot use Type 3 fonts. So the print
 * document embeds one static face for each weight and style that the print CSS uses (measured on
 * an Origins 3.2 render with all sections), and Sarabun gives the Thai glyphs. Files:
 * `assets/print-fonts/` (Fontsource 5.3.0 builds of Google Fonts, SIL Open Font License).
 */

export interface PrintFontFace {
    family: string;
    weight: number;
    style: 'normal' | 'italic';
    file: string;
    /** Set for a face that only gives the glyphs of one script. */
    unicodeRange?: string;
    /** The CSS `size-adjust` descriptor, for example `83.18%`. */
    sizeAdjust?: string;
}

export const THAI = 'U+0E01-0E5B, U+200C-200D, U+25CC';

const faces = (family: string, slug: string, subset: string, list: [number, 'normal' | 'italic'][], unicodeRange?: string): PrintFontFace[] =>
    list.map(([weight, style]) => ({ family, weight, style, file: `${slug}-${subset}-${weight}-${style}.woff2`, unicodeRange }));

export const PRINT_FONT_FACES: PrintFontFace[] = [
    ...faces('Merriweather', 'merriweather', 'latin', [[300, 'normal'], [400, 'normal'], [400, 'italic'], [600, 'normal'], [700, 'normal'], [700, 'italic']]),
    ...faces('Open Sans', 'open-sans', 'latin', [[400, 'normal'], [400, 'italic'], [600, 'normal'], [700, 'normal'], [700, 'italic'], [800, 'normal']]),
    ...faces('Sarabun', 'sarabun', 'thai', [[400, 'normal'], [400, 'italic'], [600, 'normal'], [700, 'normal'], [700, 'italic']], THAI),
];

/**
 * The faces of the Chibi Quest look (track primary_v2_look_20261020), the fonts of the v2 app:
 * Fredoka (Latin) and Mitr (Thai) for signs, titles, and labels, and Quicksand (Latin) for text,
 * with Sarabun for its Thai. Static Fontsource 5.3.0 builds; none of the three has an italic face.
 * The document wrapper adds them only for `look: 'chibi-quest'`.
 */
export const CHIBI_QUEST_FONT_FACES: PrintFontFace[] = [
    ...faces('Fredoka', 'fredoka', 'latin', [[500, 'normal'], [600, 'normal'], [700, 'normal']]),
    ...faces('Mitr', 'mitr', 'thai', [[400, 'normal'], [500, 'normal'], [700, 'normal']], THAI),
    ...faces('Quicksand', 'quicksand', 'latin', [[400, 'normal'], [500, 'normal'], [700, 'normal']]),
];

let cached: string | undefined;
let cachedChibiQuest: string | undefined;

/** The folder with the print font files. */
export const PRINT_FONT_DIR = path.join(process.cwd(), 'assets', 'print-fonts');

/**
 * `@font-face` rules for a list of faces, with each font file as a data URL.
 * @param list The faces.
 * @param dir The folder with the font files.
 * @returns The CSS.
 */
export function fontFaceCss(list: PrintFontFace[], dir: string = PRINT_FONT_DIR): string {
    return list.map((f) => {
        const data = fs.readFileSync(path.join(dir, f.file)).toString('base64');
        const range = f.unicodeRange ? ` unicode-range: ${f.unicodeRange};` : '';
        const adjust = f.sizeAdjust ? ` size-adjust: ${f.sizeAdjust};` : '';
        return `@font-face { font-family: '${f.family}'; font-weight: ${f.weight}; font-style: ${f.style}; src: url(data:font/woff2;base64,${data}) format('woff2');${range}${adjust} }`;
    }).join('\n');
}

/**
 * The `@font-face` rules for the print document, with each font file as a data URL, so the
 * dashboard iframe, a file:// render, and Playwright all load the same fonts.
 * @param dir The folder with the font files.
 * @returns The CSS.
 */
export function printFontFaceCss(dir: string = PRINT_FONT_DIR): string {
    if (cached) return cached;
    cached = fontFaceCss(PRINT_FONT_FACES, dir);
    return cached;
}

/**
 * The `@font-face` rules of the Chibi Quest faces, with each font file as a data URL.
 * @param dir The folder with the font files.
 * @returns The CSS.
 */
export function chibiQuestFontFaceCss(dir: string = PRINT_FONT_DIR): string {
    if (cachedChibiQuest) return cachedChibiQuest;
    cachedChibiQuest = fontFaceCss(CHIBI_QUEST_FONT_FACES, dir);
    return cachedChibiQuest;
}
