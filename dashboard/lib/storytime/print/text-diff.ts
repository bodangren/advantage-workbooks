/**
 * The text gate of the Storytime teacher book (spec FR-4.2 and AC-3): the `pdftotext -layout`
 * text of the new Chrome PDF of a week against the text of the draft that Daniel approved.
 * Only the page numbers may differ. Read the Chrome PDF, never the PDF/X file: `pdftotext`
 * drops Thai tone marks in a PDF/X file (lessons-learned, 2026-10-02).
 */

/** One line that differs between the draft text and the new text. */
export interface PrintTextDifference {
    /** The 1-based line in the reference text; for an added line, the reference line it comes before. */
    line: number;
    /** The reference line, trimmed, with its space runs as one space; empty for an added line. */
    expected: string;
    /** The new line, in the same form; empty for a removed line. */
    actual: string;
}

/**
 * A line that holds only a page number: the page footer of the Thai manual ("หน้า 2") or of
 * the English manual ("Page 2"), with an optional page total. A bare number is not in this
 * set, because a bare number can be content (anti-pattern A7: no filter wider than the need).
 */
const PAGE_NUMBER_LINE = /^(?:หน้า|page)\s*\d+(?:\s*(?:\/|of|จาก)\s*\d+)?$/i;

interface TextLine {
    /** The 1-based line number in the source text. */
    line: number;
    /** The compared form of the line. */
    text: string;
}

/**
 * The compared lines of one `pdftotext -layout` output: each line trimmed, each space run
 * (the layout columns) as one space, and the form feed of a page break removed. Blank lines
 * and page-number lines drop out, so a page break that moves gives no difference.
 * @param text The `pdftotext -layout` output.
 * @returns The compared lines with their source line numbers.
 */
function comparedLines(text: string): TextLine[] {
    return text.split(/\r?\n/).flatMap((raw, index) => {
        const line = raw.replace(/\f/g, '').replace(/\s+/g, ' ').trim();
        return line && !PAGE_NUMBER_LINE.test(line) ? [{ line: index + 1, text: line }] : [];
    });
}

/**
 * Compares two `pdftotext -layout` outputs line by line, with a longest-common-subsequence
 * match, so that one added or removed line gives one difference and not a shift of every line
 * after it. In a changed block, the removed and the added lines pair in order; a changed Thai
 * word, or a lost tone mark, gives one difference on its line. Page-number lines and blank
 * lines are not compared.
 * @param reference The text of the approved draft.
 * @param actual The text of the new Chrome PDF.
 * @returns Every difference in reference order; an empty list when the texts agree.
 */
export function diffPrintText(reference: string, actual: string): PrintTextDifference[] {
    const a = comparedLines(reference);
    const b = comparedLines(actual);
    let start = 0;
    while (start < a.length && start < b.length && a[start].text === b[start].text) start++;
    let endA = a.length;
    let endB = b.length;
    while (endA > start && endB > start && a[endA - 1].text === b[endB - 1].text) {
        endA--;
        endB--;
    }
    const rows = endA - start;
    const cols = endB - start;
    // lcs[i * (cols + 1) + j]: the common-subsequence length of a[start + i..endA) and b[start + j..endB).
    const lcs = new Uint32Array((rows + 1) * (cols + 1));
    for (let i = rows - 1; i >= 0; i--) {
        for (let j = cols - 1; j >= 0; j--) {
            lcs[i * (cols + 1) + j] = a[start + i].text === b[start + j].text
                ? lcs[(i + 1) * (cols + 1) + j + 1] + 1
                : Math.max(lcs[(i + 1) * (cols + 1) + j], lcs[i * (cols + 1) + j + 1]);
        }
    }
    const differences: PrintTextDifference[] = [];
    let removed: TextLine[] = [];
    let added: TextLine[] = [];
    // The reference line that an added line comes before: the next matched or removed line.
    const lineAt = (i: number) => (start + i < a.length ? a[start + i].line : (a.at(-1)?.line ?? 0) + 1);
    const flush = (i: number) => {
        for (let k = 0; k < Math.max(removed.length, added.length); k++) {
            differences.push({
                line: removed[k]?.line ?? lineAt(i),
                expected: removed[k]?.text ?? '',
                actual: added[k]?.text ?? '',
            });
        }
        removed = [];
        added = [];
    };
    let i = 0;
    let j = 0;
    while (i < rows || j < cols) {
        if (i < rows && j < cols && a[start + i].text === b[start + j].text) {
            flush(i);
            i++;
            j++;
        } else if (j < cols && (i === rows || lcs[i * (cols + 1) + j + 1] >= lcs[(i + 1) * (cols + 1) + j])) {
            added.push(b[start + j]);
            j++;
        } else {
            removed.push(a[start + i]);
            i++;
        }
    }
    flush(i);
    return differences;
}

/**
 * The file name of the Thai teacher-book print file (spec FR-4.3, rule 12.2: a changed print
 * file gets a new version).
 * @param level The Storytime level.
 * @param unit The unit of the weeks in the book.
 * @param lang The book language; the teacher book is Thai only (spec P6).
 * @param version The version of the print file.
 * @returns The PDF/X-1a file name, e.g. `Storytime-Advantage-L2-U1-Teachers-Book-TH-v1_PDFX-1a.pdf`.
 */
export function teacherBookPrintFileName(level: number, unit: number, lang: 'th', version: number): string {
    return `Storytime-Advantage-L${level}-U${unit}-Teachers-Book-${lang.toUpperCase()}-v${version}_PDFX-1a.pdf`;
}
