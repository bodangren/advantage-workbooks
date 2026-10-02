import path from 'path';

/**
 * PDF/X-1a for the printer (track print_ready_pdf_20261002). Ghostscript converts a Chrome PDF;
 * poppler (`pdfinfo`, `pdffonts`, `pdfimages`) reads the result for the checks. Daniel
 * (2026-10-02): PDF/X-1a, full color, Japan Color 2001 Coated.
 */

/** The output profile. The Adobe license allows use and embedding in files. */
export const JAPAN_COLOR_2001_COATED = {
    description: 'Japan Color 2001 Coated',
    /** The name in the ICC characterization registry. */
    identifier: 'JC200103',
    file: 'JapanColor2001Coated.icc',
    zipUrl: 'https://download.adobe.com/pub/adobe/iccprofiles/win/AdobeICCProfilesCS4Win_end-user.zip',
    zipEntry: 'Adobe ICC Profiles (end-user)/CMYK/JapanColor2001Coated.icc',
};

export type Profile = typeof JAPAN_COLOR_2001_COATED;

export interface FontRow {
    name: string;
    type: string;
    embedded: boolean;
}

export interface ImageRow {
    page: number;
    type: string;
    width: number;
    height: number;
    color: string;
    xppi: number;
    yppi: number;
}

export interface PdfInfo {
    pages: number;
    version: string;
    /** Page size of the first page, in points. */
    width: number;
    height: number;
    trimBox: boolean;
}

/** A PostScript string body: ( ) \ escaped, other than printable ASCII dropped. */
function psString(s: string): string {
    return s.replace(/[^\x20-\x7e]/g, '').replace(/[\\()]/g, (c) => `\\${c}`);
}

/**
 * The PostScript prefix file that makes Ghostscript write a PDF/X-1a:2001 file: the version
 * marker and the output intent with the embedded profile.
 * @param profilePath Absolute path of the ICC profile.
 * @param title The document title (non-ASCII characters are dropped).
 * @param profile The output condition.
 * @returns The file content.
 */
export function pdfxDefinition(profilePath: string, title: string, profile: Profile = JAPAN_COLOR_2001_COATED): string {
    return `%!
% PDF/X-1a:2001 prefix for Ghostscript (dashboard/lib/print/pdfx.ts).
[ /GTS_PDFXVersion (PDF/X-1a:2001) /Title (${psString(title)}) /Trapped /False /DOCINFO pdfmark
[/_objdef {icc_PDFX} /type /stream /OBJ pdfmark
[{icc_PDFX} << /N 4 >> /PUT pdfmark
[{icc_PDFX} (${psString(profilePath)}) (r) file /PUT pdfmark
[/_objdef {OutputIntent_PDFX} /type /dict /OBJ pdfmark
[{OutputIntent_PDFX} <<
  /Type /OutputIntent
  /S /GTS_PDFX
  /OutputCondition (${psString(profile.description)})
  /Info (${psString(profile.description)})
  /OutputConditionIdentifier (${psString(profile.identifier)})
  /RegistryName (http://www.color.org)
  /DestOutputProfile {icc_PDFX}
>> /PUT pdfmark
[{Catalog} <</OutputIntents [ {OutputIntent_PDFX} ]>> /PUT pdfmark
`;
}

/**
 * Ghostscript arguments for the PDF/X-1a conversion.
 * @param o The input PDF, the output PDF, the prefix file from `pdfxDefinition`, the ICC profile,
 *   and whether to draw all text as outlines (no fonts in the output).
 * @returns The argument list (without the `gs` command).
 */
export function ghostscriptArgs(o: { input: string; output: string; definition: string; profile: string; outline: boolean }): string[] {
    return [
        '-dPDFX=1',
        `--permit-file-read=${path.dirname(o.profile)}/`,
        '-sDEVICE=pdfwrite',
        '-sColorConversionStrategy=CMYK',
        '-sProcessColorModel=DeviceCMYK',
        `-sOutputICCProfile=${o.profile}`,
        '-dPDFSETTINGS=/prepress',
        ...(o.outline ? ['-dNoOutputFonts'] : []),
        '-o',
        o.output,
        o.definition,
        o.input,
    ];
}

/** The data rows of a poppler table (after the header and the dash line). */
function rows(text: string): string[][] {
    const lines = text.split('\n');
    const dash = lines.findIndex((l) => /^-{3,}/.test(l));
    return lines.slice(dash + 1).filter((l) => l.trim()).map((l) => l.trim().split(/\s+/));
}

/**
 * Reads `pdffonts` output.
 * @param text The command output.
 * @returns One row per font.
 */
export function parsePdffonts(text: string): FontRow[] {
    // name, type (one or more words), encoding, emb, sub, uni, object, generation
    return rows(text).map((t) => ({ name: t[0], type: t.slice(1, -6).join(' '), embedded: t[t.length - 5] === 'yes' }));
}

/**
 * Reads `pdfimages -list` output.
 * @param text The command output.
 * @returns One row per image.
 */
export function parsePdfimages(text: string): ImageRow[] {
    return rows(text).map((t) => ({ page: Number(t[0]), type: t[2], width: Number(t[3]), height: Number(t[4]), color: t[5], xppi: Number(t[12]), yppi: Number(t[13]) }));
}

/**
 * Reads `pdfinfo -box` output.
 * @param text The command output.
 * @returns The page count, the PDF version, the first page size, and whether a TrimBox exists.
 */
export function parsePdfinfo(text: string): PdfInfo {
    const field = (name: string) => text.match(new RegExp(`^${name}:\\s+(.+)$`, 'm'))?.[1].trim() ?? '';
    const size = field('Page size').match(/([\d.]+) x ([\d.]+)/);
    return { pages: Number(field('Pages')), version: field('PDF version'), width: Number(size?.[1] ?? 0), height: Number(size?.[2] ?? 0), trimBox: /^TrimBox:/m.test(text) };
}

/**
 * Pages that hold one image the size of the page: Ghostscript renders a page with transparency
 * this way for PDF/X-1a.
 * @param images The `pdfimages` rows.
 * @param info The page size.
 * @returns The page numbers, ascending.
 */
export function pageImages(images: ImageRow[], info: PdfInfo): number[] {
    const full = images.filter((i) => i.type === 'image' && i.xppi > 0 && i.yppi > 0 && (i.width / i.xppi) * 72 >= 0.95 * info.width && (i.height / i.yppi) * 72 >= 0.95 * info.height);
    return [...new Set(full.map((i) => i.page))].sort((a, b) => a - b);
}

const pageList = (pages: number[]) => [...new Set(pages)].sort((a, b) => a - b).join(', ');

/**
 * The checks on a converted file.
 * @param o What poppler read from the file, the PDF/X marker, whether an output intent exists, and
 *   the pages of the source PDF that already were one page-size picture.
 * @returns The failed checks (empty when the file is good).
 */
export function checkPdfx(o: { info: PdfInfo; pdfxVersion?: string; hasOutputIntent: boolean; fonts: FontRow[]; images: ImageRow[]; sourcePageImages?: number[] }): { errors: string[] } {
    const errors: string[] = [];
    if (o.info.version !== '1.3') errors.push(`PDF version ${o.info.version || '?'} (PDF/X-1a:2001 needs 1.3)`);
    if (o.pdfxVersion !== 'PDF/X-1a:2001') errors.push('no PDF/X-1a marker (GTS_PDFXVersion)');
    if (!o.hasOutputIntent) errors.push('no output intent (ICC profile)');
    if (!o.info.trimBox) errors.push('no TrimBox');
    const type3 = o.fonts.filter((f) => f.type === 'Type 3');
    if (type3.length) errors.push(`${type3.length} Type 3 font(s): ${[...new Set(type3.map((f) => f.name.replace(/^[A-Z]{6}\+/, '')))].join(', ')}`);
    const loose = o.fonts.filter((f) => !f.embedded);
    if (loose.length) errors.push(`fonts not embedded: ${[...new Set(loose.map((f) => f.name))].join(', ')}`);
    const source = new Set(o.sourcePageImages ?? []);
    const rendered = pageImages(o.images, o.info).filter((p) => !source.has(p));
    if (rendered.length) errors.push(`page(s) ${pageList(rendered)} became one image each (in the source: emoji, rgba, opacity, shadows, gradients, or dashed rounded boxes with a background)`);
    const rgb = o.images.filter((i) => i.color === 'rgb');
    if (rgb.length) errors.push(`RGB image(s) on page(s) ${pageList(rgb.map((i) => i.page))}`);
    const masks = o.images.filter((i) => i.type === 'smask');
    if (masks.length) errors.push(`soft mask(s) on page(s) ${pageList(masks.map((i) => i.page))} (transparency)`);
    return { errors };
}
