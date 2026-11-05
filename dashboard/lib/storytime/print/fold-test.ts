import { fontFaceCss } from './print-fonts';
import { STORYTIME_PRINT_PROFILE, type StorytimePrintProfile } from './profile';

/**
 * The lead sheets of the reader fold test (A-48 part F, B1): a plain office-print PDF of two A4
 * portrait sheets that a teacher prints to check a printer before the reader prints. Sheet 1
 * holds the agreed print instruction; sheet 2 is its blank back, so the teacher sees both sides
 * of one duplex sheet. Black and white, made by Chrome like the how-to (not PDF/X).
 */

/**
 * The one print instruction that sheet 1 carries (A-48 part F, B1): the duplex setting of the
 * school printer for the reader leaves.
 */
export const STORYTIME_FOLD_TEST_PRINT_LINE = 'Print at 100 %, both sides, flip on long edge.' as const;

/**
 * The style of the fold-test lead: two A4 portrait sheets in black and white, with the print
 * faces of the student book.
 * @param profile The print profile; the trim gives the sheet size.
 * @returns The CSS text.
 */
function foldTestCss(profile: StorytimePrintProfile): string {
    const { widthMm, heightMm } = profile.trim;
    return `${fontFaceCss()}
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; color: #000; }
body { font-family: 'Andika', sans-serif; font-weight: 400; font-synthesis: none; }
.sheet { width: ${widthMm}mm; height: ${heightMm - 0.5}mm; padding: 24mm; position: relative; overflow: hidden; break-after: page; page-break-after: always; }
.sheet:last-of-type { break-after: auto; page-break-after: auto; }
.lead-title { font-size: 20pt; font-weight: 700; }
.lead-subtitle { font-size: 14pt; margin-top: 4mm; }
.print-line { margin-top: 24mm; font-size: 13pt; }
`;
}

/**
 * Compiles the fold-test lead to one print HTML document: two A4 portrait sheets. Sheet 1 holds
 * the series title, the sheet name, and the print line once; sheet 2 is the blank back and holds
 * no text.
 * @param profile The print profile; the default is the profile of the student book.
 * @returns The HTML of the document.
 */
export function compileFoldTestLead(profile: StorytimePrintProfile = STORYTIME_PRINT_PROFILE): { html: string } {
    const sheet1 = `<section class="sheet" data-sheet="1">
<h1 class="lead-title">Storytime Advantage</h1>
<p class="lead-subtitle">Reader fold test</p>
<p class="print-line">${STORYTIME_FOLD_TEST_PRINT_LINE}</p>
</section>`;
    const sheet2 = '<section class="sheet" data-sheet="2"></section>';
    return {
        html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Storytime Advantage: Reader fold test</title>
<style>
${foldTestCss(profile)}
</style>
</head>
<body>
${sheet1}
${sheet2}
</body>
</html>`,
    };
}
