/**
 * The A5 reader leaf contract (spec "Decisions of 2026-11-03", FR-5.1, FR-5.8, P15 default).
 * The readers build and the student book print the same leaf side, so both test files check it
 * with the one helper of this file.
 *
 * The DOM contract of one reader leaf side (a `[data-leaf-side]` element of the readers build, or
 * a `.student-page[data-page-kind="reader"]` element of the student book):
 * - two `[data-reader-page]` elements, in the order top half, bottom half; each has `data-half`
 *   (`top` or `bottom`), `data-turn-deg` (90 or -90), `data-page-number`, `data-width-mm`, and
 *   `data-height-mm` (the page before the turn: 148.5 × 198);
 * - one `[data-part="fold-line"]` with `data-position-mm` 148.5 (the middle of the A4 leaf);
 * - one `[data-part="leaf-mark"]` whose text names the reader title and `leaf N` (N from 1 to 3);
 * - one `[data-part="perforation"]` with `data-distance-mm` 12;
 * - no cut line and no strip.
 */

/** The reader page in millimeters (spec FR-5.1, P15 default). */
export const READER_PAGE_MM = { widthMm: 148.5, heightMm: 198 };

/** The imposition of the 3 nested folded leaves of a reader, outer to inner (spec FR-5.1). */
export const LEAF_IMPOSITION: ReadonlyArray<{ leaf: number; front: [number, number]; back: [number, number] }> = [
    { leaf: 1, front: [12, 1], back: [2, 11] },
    { leaf: 2, front: [10, 3], back: [4, 9] },
    { leaf: 3, front: [8, 5], back: [6, 7] },
];

/** What one leaf side must hold. */
export interface LeafSideExpectation {
    /** The reader title. */
    title: string;
    /** The leaf number from 1 to 3. */
    leaf: number;
    /** The printed face. */
    face: 'front' | 'back';
    /** The page numbers of the top half and of the bottom half. */
    pages: [number, number];
    /** The spine edge of the perforation: `left` or `right`. */
    spineEdge: 'left' | 'right';
}

/**
 * The expected leaf sides of one reader in printed order: leaf 1 front, leaf 1 back, leaf 2 front, and so on.
 * @param title The reader title.
 * @param frontSpineEdge The spine edge of a front side (`left` for the readers build).
 * @returns Six expectations.
 */
export function readerLeafSides(title: string, frontSpineEdge: 'left' | 'right' = 'left'): LeafSideExpectation[] {
    const backSpineEdge = frontSpineEdge === 'left' ? 'right' : 'left';
    return LEAF_IMPOSITION.flatMap(({ leaf, front, back }) => [
        { title, leaf, face: 'front' as const, pages: front, spineEdge: frontSpineEdge },
        { title, leaf, face: 'back' as const, pages: back, spineEdge: backSpineEdge },
    ]);
}

/**
 * Lists every way in which a leaf side breaks the A5 reader leaf contract. An empty list means that the side is right.
 * @param side The leaf side element.
 * @param want What the side must hold.
 * @returns The problems, each a short sentence that starts with a stable tag in brackets.
 */
export function leafSideProblems(side: Element, want: LeafSideExpectation): string[] {
    const problems: string[] = [];
    const pages = Array.from(side.querySelectorAll('[data-reader-page]'));
    if (pages.length !== 2) problems.push(`[pages-per-side] ${want.title} leaf ${want.leaf} ${want.face}: ${pages.length} reader pages, want 2`);
    const numbers = pages.map((page) => Number(page.getAttribute('data-page-number')));
    if (numbers.join('|') !== want.pages.join('|')) {
        problems.push(`[imposition] ${want.title} leaf ${want.leaf} ${want.face}: pages ${numbers.join('|')}, want ${want.pages.join('|')}`);
    }
    const halves = pages.map((page) => page.getAttribute('data-half'));
    if (halves.join('|') !== 'top|bottom') problems.push(`[halves] ${want.title} leaf ${want.leaf} ${want.face}: halves ${halves.join('|')}, want top|bottom`);
    for (const page of pages) {
        const turn = Number(page.getAttribute('data-turn-deg'));
        if (Math.abs(turn) !== 90) problems.push(`[turn] page ${page.getAttribute('data-page-number')}: data-turn-deg ${page.getAttribute('data-turn-deg')}, want 90 or -90`);
        if (Number(page.getAttribute('data-width-mm')) !== READER_PAGE_MM.widthMm || Number(page.getAttribute('data-height-mm')) !== READER_PAGE_MM.heightMm) {
            problems.push(`[page-size] page ${page.getAttribute('data-page-number')}: ${page.getAttribute('data-width-mm')} x ${page.getAttribute('data-height-mm')} mm, want 148.5 x 198`);
        }
    }
    const folds = side.querySelectorAll('[data-part="fold-line"]');
    if (folds.length !== 1) problems.push(`[fold-line] ${want.title} leaf ${want.leaf} ${want.face}: ${folds.length} fold lines, want 1`);
    else if (Number(folds[0].getAttribute('data-position-mm')) !== 148.5) problems.push(`[fold-line] data-position-mm ${folds[0].getAttribute('data-position-mm')}, want 148.5`);
    if (side.querySelector('[data-part="cut-line"], .cut-line, [data-reader-strip], [data-part="reader-strip"]')) problems.push('[cut-line] a cut line or a strip is still on the side');
    const marks = side.querySelectorAll('[data-part="leaf-mark"]');
    if (marks.length !== 1) problems.push(`[leaf-mark] ${want.title} leaf ${want.leaf} ${want.face}: ${marks.length} marks, want 1`);
    else {
        const text = (marks[0].textContent ?? '').replace(/\s+/g, ' ').trim();
        const leaf = text.match(/\bleaf\s+(\d+)/i);
        if (!text.includes(want.title) || !leaf || Number(leaf[1]) !== want.leaf) problems.push(`[leaf-mark] mark "${text}", want the title "${want.title}" and "leaf ${want.leaf}"`);
    }
    const perforations = side.querySelectorAll('[data-part="perforation"]');
    if (perforations.length !== 1) problems.push(`[perforation] ${want.title} leaf ${want.leaf} ${want.face}: ${perforations.length} perforations, want 1`);
    else {
        if (perforations[0].getAttribute('data-distance-mm') !== '12' && !/12mm/.test((perforations[0].getAttribute('style') ?? '').replace(/\s+/g, ''))) problems.push('[perforation] not 12 mm from the spine');
        if (perforations[0].getAttribute('data-spine-edge') !== want.spineEdge) problems.push(`[perforation] spine edge ${perforations[0].getAttribute('data-spine-edge')}, want ${want.spineEdge}`);
    }
    return problems;
}

/**
 * Lists every way in which the reader sides of a student book break the A5 reader leaf contract
 * (spec FR-3 and FR-5.1): 12 reader sides for a teaching week (2 readers x 3 leaves x 2 faces), in
 * printed order, each front on an odd (right) page and each back on the next even (left) page.
 * A reader side is a `.student-page[data-page-kind="reader"]` element with `data-reader` (the kind),
 * `data-reader-title`, and `data-leaf-number`.
 * @param allPages Every `.student-page` element of the student book of one teaching week, in order.
 * @param books The readers of the week in print order: the title and the kind of each.
 * @returns The problems; an empty list means that the week keeps the contract.
 */
export function studentReaderProblems(allPages: Element[], books: Array<{ title: string; kind: string }>): string[] {
    const problems: string[] = [];
    const sides = allPages.map((side, index) => ({ side, number: index + 1 }))
        .filter(({ side }) => side.getAttribute('data-page-kind') === 'reader');
    const want = books.flatMap((book) => readerLeafSides(book.title).map((entry) => ({ ...entry, kind: book.kind })));
    if (sides.length !== want.length) problems.push(`[reader-sides] ${sides.length} reader sides, want ${want.length} (${books.length} readers x 3 leaves x 2 faces)`);
    sides.forEach(({ side, number }, index) => {
        const expected = want[index];
        if (!expected) return;
        if (side.getAttribute('data-reader') !== expected.kind) problems.push(`[reader-kind] side ${number}: data-reader ${side.getAttribute('data-reader')}, want ${expected.kind}`);
        if (side.getAttribute('data-reader-title') !== expected.title) problems.push(`[leaf-title] side ${number}: data-reader-title ${side.getAttribute('data-reader-title')}, want ${expected.title}`);
        if (Number(side.getAttribute('data-leaf-number')) !== expected.leaf) problems.push(`[leaf-number] side ${number}: data-leaf-number ${side.getAttribute('data-leaf-number')}, want ${expected.leaf}`);
        if ((number % 2 === 1) !== (expected.face === 'front')) problems.push(`[face] side ${number}: a ${expected.face} must be on an ${expected.face === 'front' ? 'odd' : 'even'} page`);
        problems.push(...leafSideProblems(side, { ...expected, spineEdge: number % 2 === 1 ? 'left' : 'right' }));
    });
    return problems;
}

/**
 * Lists the problems of the style text of a reader document: the fold line must be dashed and the leaf mark must be small.
 * @param css The text of all `<style>` elements.
 * @returns The problems; empty when the style is right.
 */
export function leafStyleProblems(css: string): string[] {
    const problems: string[] = [];
    if (!/\.fold-line\s*\{[^}]*dashed/.test(css)) problems.push('[fold-style] no `.fold-line` rule with a dashed border');
    const size = css.match(/\.leaf-mark\s*\{[^}]*font-size:\s*([\d.]+)pt/);
    if (!size) problems.push('[mark-style] no `.leaf-mark` rule with a font size in pt');
    else if (Number(size[1]) > 8) problems.push(`[mark-style] leaf mark font size ${size[1]}pt, want 8pt or less`);
    return problems;
}
