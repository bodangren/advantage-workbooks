/**
 * The landscape reader leaf contract (spec "Decisions of 2026-11-04", FR-5.1, FR-5.8, P15 default).
 * The readers build and the student book print the same leaf side, so both test files check it
 * with the one helper of this file.
 *
 * The DOM contract of one reader leaf side (a `[data-leaf-side]` element of the readers build, or
 * a `.student-page[data-page-kind="reader"]` element of the student book):
 * - two `[data-reader-page]` elements, in the order top half, bottom half; each has `data-half`
 *   (`top` or `bottom`), `data-turn-deg` (180 on a front, 0 on a back), `data-page-number`,
 *   `data-width-mm`, and `data-height-mm` (the page as printed, no turn of 90 degrees: 198 x 148.5);
 * - one `[data-part="fold-line"]` with `data-position-mm` 148.5 (the middle of the A4 leaf);
 * - one `[data-part="leaf-mark"]` whose text names the reader title and `leaf N` (N from 1 to 3);
 * - one `[data-part="perforation"]` with `data-distance-mm` 12;
 * - no cut line and no strip.
 */

/** The reader page in millimeters (spec FR-5.1, P15 default): landscape, two on the 198 x 297 mm torn leaf. */
export const READER_PAGE_MM = { widthMm: 198, heightMm: 148.5 };

/** A printed face of a reader leaf. */
export type LeafFace = 'front' | 'back';

/** A half of a reader leaf. */
export type LeafHalf = 'top' | 'bottom';

/** A 3 x 3 matrix of the fold model. */
type Matrix = number[][];

const matrixProduct = (a: Matrix, b: Matrix): Matrix => a.map((row) => b[0].map((_, column) => row.reduce((sum, value, k) => sum + value * b[k][column], 0)));
/** A half turn of the paper about the x axis (the horizontal fold line), the y axis (the vertical spine edge), or the z axis (in the plane). */
const TURN_X: Matrix = [[1, 0, 0], [0, -1, 0], [0, 0, -1]];
const TURN_Y: Matrix = [[-1, 0, 0], [0, 1, 0], [0, 0, -1]];
const TURN_Z: Matrix = [[-1, 0, 0], [0, -1, 0], [0, 0, 1]];
const IDENTITY: Matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

/** One page of a reader as the fold model finds it: where it is printed, when the child sees it, and the print turn that makes it upright. */
export interface FoldSlot {
    /** The leaf number from 1 to 3 (leaf 1 is outside). */
    leaf: number;
    /** The printed face. */
    face: LeafFace;
    /** The half of the leaf on that face. */
    half: LeafHalf;
    /** The reading position from 1 to 12: the page number that must print on this slot. */
    position: number;
    /** The turn in degrees (0 or 180) that the print gives the page so that it reads upright. */
    uprightTurnDeg: number;
    /** The spread of the child: the page lies `above` the fold line, `below` it, is the closed `cover`, or is the `back` cover (the closed reader turned over about its vertical axis, the fold at the top). */
    place: 'cover' | 'above' | 'below' | 'back';
}

/**
 * Folds and nests the 3 leaves of one reader as paper does, and reads the pages in the order of the child (spec FR-5.1).
 *
 * The model: each leaf is a sheet with a front face and a back face. The back face has the same top
 * as the front (the bound book turns the leaf over on its vertical spine edge), so the back top half lies
 * behind the front top half. The child folds the leaf on the horizontal fold line with the front outside:
 * the bottom half turns half a turn about the fold axis. The child then holds the fold at the top, a half turn
 * in the plane. The stack from the front to the back is leaf 1 top, leaf 2 top, leaf 3 top, leaf 3 bottom,
 * leaf 2 bottom, leaf 1 bottom. The cover is the front of leaf 1 top. The child turns the layers up over the
 * fold one at a time: a turned layer shows its other face above the fold, and the next layer shows the face
 * that looks at the child below the fold. For each page the model multiplies the half turns that move its
 * face frame (the face as printed, upright) into the frame of the child. The page reads upright when the
 * result is a turn of 0 degrees in the plane (and the face looks at the child, which the model checks).
 * The last page (12, the back cover) is not read by turning the last layer up over the fold: the child turns the
 * closed reader over like a book, about its vertical axis, with the fold still at the top (Daniel 2026-11-04, fix 5).
 * @returns The 12 slots in reading order (page 1 first).
 */
export function simulateTopFold(): FoldSlot[] {
    const stack: Array<{ leaf: number; half: LeafHalf }> = [
        { leaf: 1, half: 'top' }, { leaf: 2, half: 'top' }, { leaf: 3, half: 'top' },
        { leaf: 3, half: 'bottom' }, { leaf: 2, half: 'bottom' }, { leaf: 1, half: 'bottom' },
    ];
    const view = (layer: number, how: 'closed' | 'turnedUp' | 'turnedOver'): Omit<FoldSlot, 'position' | 'place'> => {
        const { leaf, half } = stack[layer];
        // The top half keeps its face; the folded bottom half hangs behind with its front face away from the child.
        const facing: LeafFace = half === 'top' ? 'front' : 'back';
        const face: LeafFace = how === 'closed' ? facing : (facing === 'front' ? 'back' : 'front');
        const fold = half === 'bottom' ? TURN_X : IDENTITY;
        const extra = how === 'turnedUp' ? TURN_X : how === 'turnedOver' ? TURN_Y : IDENTITY;
        const motion = [fold, TURN_Z, extra].reduce((total, step) => matrixProduct(step, total), IDENTITY);
        const total = matrixProduct(motion, face === 'back' ? TURN_Y : IDENTITY);
        if (total[2][2] !== 1) throw new Error(`fold model: leaf ${leaf} ${face} ${half} does not look at the child`);
        // The page is upright when the in-plane turn is 0 degrees; otherwise the print must give the opposite turn.
        return { leaf, face, half, uprightTurnDeg: total[0][0] === 1 ? 0 : 180 };
    };
    const slots: FoldSlot[] = [{ ...view(0, 'closed'), position: 1, place: 'cover' }];
    for (let layer = 0; layer < stack.length; layer++) {
        const last = layer + 1 === stack.length;
        slots.push({ ...view(layer, last ? 'turnedOver' : 'turnedUp'), position: slots.length + 1, place: last ? 'back' : 'above' });
        if (!last) slots.push({ ...view(layer + 1, 'closed'), position: slots.length + 1, place: 'below' });
    }
    return slots;
}

/**
 * The imposition of the 3 nested folded leaves, outer to inner (spec FR-5.1, PM table of 2026-11-04).
 * The pairs read top|bottom as seen on each side. The bound book turns the leaf over on its vertical spine edge, so a
 * back side keeps the top and the bottom of its front: page 2 is behind page 1 (top half), page 11 is behind page 12.
 * The test `R-P4-2e` checks that the fold model gives this table.
 */
export const LEAF_IMPOSITION: ReadonlyArray<{ leaf: number; front: [number, number]; back: [number, number] }> = [
    { leaf: 1, front: [1, 12], back: [2, 11] },
    { leaf: 2, front: [3, 10], back: [4, 9] },
    { leaf: 3, front: [5, 8], back: [6, 7] },
];

/** The turn, in degrees, of a page on each face that reads upright after the fold: 180 on a front, 0 on a back (page 12 is the one exception, see `pageTurnDeg`). */
export const LEAF_TURN_DEG: Readonly<Record<LeafFace, number>> = { front: 180, back: 0 };

/** The back cover: it reads upright when the closed reader is turned over about its vertical axis, so it prints upright (Daniel 2026-11-04, fix 5). */
export const BACK_COVER_PAGE = 12;

/**
 * The turn, in degrees, that a reader page must print with.
 * @param face The printed face of the leaf side.
 * @param pageNumber The reader page number from 1 to 12.
 * @returns 0 for the back cover (page 12), otherwise 180 on a front and 0 on a back.
 */
export function pageTurnDeg(face: LeafFace, pageNumber: number): number {
    return pageNumber === BACK_COVER_PAGE ? 0 : LEAF_TURN_DEG[face];
}

/** What one leaf side must hold. */
export interface LeafSideExpectation {
    /** The reader title. */
    title: string;
    /** The leaf number from 1 to 3. */
    leaf: number;
    /** The printed face. */
    face: LeafFace;
    /** The page numbers of the top half and of the bottom half. */
    pages: [number, number];
    /** The turn of each page of the face: 180 on a front, 0 on a back, and 0 for page 12 (see `pageTurnDeg`). */
    turnDeg: number;
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
        { title, leaf, face: 'front' as const, pages: front, turnDeg: LEAF_TURN_DEG.front, spineEdge: frontSpineEdge },
        { title, leaf, face: 'back' as const, pages: back, turnDeg: LEAF_TURN_DEG.back, spineEdge: backSpineEdge },
    ]);
}

/**
 * Lists every way in which a leaf side breaks the landscape reader leaf contract. An empty list means that the side is right.
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
        const wantTurn = pageTurnDeg(want.face, Number(page.getAttribute('data-page-number')));
        if (turn !== wantTurn) problems.push(`[turn] ${want.title} leaf ${want.leaf} ${want.face} page ${page.getAttribute('data-page-number')}: data-turn-deg ${page.getAttribute('data-turn-deg')}, want ${wantTurn}`);
        if (Number(page.getAttribute('data-width-mm')) !== READER_PAGE_MM.widthMm || Number(page.getAttribute('data-height-mm')) !== READER_PAGE_MM.heightMm) {
            problems.push(`[page-size] page ${page.getAttribute('data-page-number')}: ${page.getAttribute('data-width-mm')} x ${page.getAttribute('data-height-mm')} mm, want ${READER_PAGE_MM.widthMm} x ${READER_PAGE_MM.heightMm}`);
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
 * Lists every way in which the reader sides of a student book break the landscape reader leaf contract
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

/** One reader page as the built HTML prints it on a leaf side. */
export interface ObservedReaderPage {
    /** The leaf number from 1 to 3. */
    leaf: number;
    /** The printed face. */
    face: LeafFace;
    /** The half of the leaf. */
    half: LeafHalf;
    /** The printed page number from 1 to 12. */
    pageNumber: number;
    /** The printed turn in degrees. */
    turnDeg: number;
}

/**
 * Folds and nests the 3 leaves of one reader with the geometric model of `simulateTopFold` and lists every
 * way in which the printed pages break the reading contract: the pages must read 1 to 12 in the fold order,
 * each page must print once, and each page must print with the turn that reads upright after the fold.
 * @param pages Every printed reader page of one reader, as the built HTML holds it.
 * @returns The problems, each a short sentence that starts with a stable tag in brackets.
 */
export function foldSimulationProblems(pages: ObservedReaderPage[]): string[] {
    const problems: string[] = [];
    const model = simulateTopFold();
    const slots = new Map<string, ObservedReaderPage>();
    for (const page of pages) {
        const key = `${page.leaf}|${page.face}|${page.half}`;
        if (slots.has(key)) problems.push(`[fold-duplicate] leaf ${page.leaf} ${page.face} ${page.half}: more than one page`);
        slots.set(key, page);
    }
    if (pages.length !== model.length) {
        problems.push(`[fold-count] ${pages.length} pages, want ${model.length} (3 leaves x 2 faces x 2 halves)`);
    }
    const printed = new Set<number>();
    for (const slot of model) {
        const page = slots.get(`${slot.leaf}|${slot.face}|${slot.half}`);
        if (!page) {
            problems.push(`[fold-missing] position ${slot.position}: no page on leaf ${slot.leaf} ${slot.face} ${slot.half}`);
            continue;
        }
        if (page.pageNumber !== slot.position) problems.push(`[fold-order] leaf ${slot.leaf} ${slot.face} ${slot.half}: page ${page.pageNumber}, want ${slot.position}`);
        if (printed.has(page.pageNumber)) problems.push(`[fold-duplicate] page ${page.pageNumber}: printed more than once`);
        printed.add(page.pageNumber);
        if ((((page.turnDeg - slot.uprightTurnDeg) % 360) + 360) % 360 !== 0) {
            problems.push(`[fold-turn] leaf ${slot.leaf} ${slot.face} page ${page.pageNumber}: data-turn-deg ${page.turnDeg}, want ${slot.uprightTurnDeg} to read upright after the fold`);
        }
    }
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

/** A box in millimeters from the top left corner of its frame. */
export interface BoxMm { left: number; top: number; right: number; bottom: number }

/** What the browser measured on one reader page, in millimeters from the top left corner of the page (before any turn). */
export interface MeasuredReaderPage {
    /** The page number from 1 to 12. */
    number: number;
    /** The page box. */
    page: BoxMm;
    /** The picture box, when the page has one. */
    picture?: BoxMm;
    /** The page text under the picture (a story page), with its computed font size in pt, its line height in mm, and its text alignment. */
    text?: BoxMm & { fontPt: number; lineMm: number; align: string };
    /** The page number element, with its text. */
    pageNumber?: BoxMm & { text: string };
    /** The footer element, with its text and its computed font size in pt. */
    footer?: BoxMm & { text: string; fontPt: number };
    /** The boxes of every other element of the page (each descendant that has a size). */
    others: BoxMm[];
    /** True when the page holds the quest reader cover (`.quest-reader-page`). */
    quest?: boolean;
}

/** The numbers of the landscape layout of a reader page (spec FR-5.1 "page layout", Daniel's reference of 2026-11-04). */
export const READER_LAYOUT = {
    /** The smallest distance of any content to the page edge, in mm. */
    minMarginMm: 5,
    /** The smallest text size of a story page in pt: the A5 text of 2026-11-03 (17 pt at 1.4143). */
    minTextPt: 24,
    /** The picture aspect range: 4:3 at most 5 percent lost at each edge gives 4:2.7 at the other end. */
    aspectMin: 4 / 3,
    aspectMax: 4 / 2.7,
    /** The picture is as wide as the page allows: at least this part of the page width. */
    minPictureShare: 0.75,
    /** The largest footer size in pt: a small footer. */
    maxFooterPt: 9,
} as const;

const intersects = (a: BoxMm, b: BoxMm): boolean => a.left < b.right - 0.01 && b.left < a.right - 0.01 && a.top < b.bottom - 0.01 && b.top < a.bottom - 0.01;

/**
 * Lists every way in which the measured pages of one reader break the landscape page layout (spec FR-5.1).
 * @param pages The measured pages of one reader, any order.
 * @param title The reader title.
 * @param level The level number (2 prints "Level 2").
 * @returns The problems, each a short sentence that starts with a stable tag in brackets.
 */
export function readerLayoutProblems(pages: MeasuredReaderPage[], title: string, level: number): string[] {
    const problems: string[] = [];
    const { minMarginMm, minTextPt, aspectMin, aspectMax, minPictureShare, maxFooterPt } = READER_LAYOUT;
    const wide = READER_PAGE_MM.widthMm;
    const high = READER_PAGE_MM.heightMm;
    if (pages.length !== 12) problems.push(`[layout-pages] ${pages.length} measured pages, want 12`);
    for (const page of pages) {
        // changed 2026-11-12 (F5, PM look): page 1 is the quest reader cover, whose layout D6 of quest-cover-f3f6.test.ts pins, so the story page rules skip it.
        if (page.number === 1) {
            if (!page.quest) problems.push(`[layout-quest] ${title} page 1: no quest reader cover`);
            continue;
        }
        const tag = `${title} page ${page.number}`;
        if (Math.abs(page.page.right - page.page.left - wide) > 0.3 || Math.abs(page.page.bottom - page.page.top - high) > 0.3) {
            problems.push(`[layout-page] ${tag}: ${(page.page.right - page.page.left).toFixed(1)} x ${(page.page.bottom - page.page.top).toFixed(1)} mm, want ${wide} x ${high}`);
        }
        const content = [page.picture, page.text, page.pageNumber, page.footer, ...page.others].filter((box): box is BoxMm => Boolean(box));
        for (const box of content) {
            if (box.left < minMarginMm - 0.3 || box.top < minMarginMm - 0.3 || box.right > wide - minMarginMm + 0.3 || box.bottom > high - minMarginMm + 0.3) {
                problems.push(`[layout-margin] ${tag}: a box (${box.left.toFixed(1)}, ${box.top.toFixed(1)}, ${box.right.toFixed(1)}, ${box.bottom.toFixed(1)}) is closer than ${minMarginMm} mm to the page edge`);
            }
        }
        const hasPicture = page.number === 1 || (page.number >= 3 && page.number <= 10);
        if (hasPicture && !page.picture) problems.push(`[layout-picture] ${tag}: no picture box`);
        if (page.picture) {
            const w = page.picture.right - page.picture.left;
            const h = page.picture.bottom - page.picture.top;
            const aspect = w / h;
            if (aspect < aspectMin - 0.002 || aspect > aspectMax + 0.002) problems.push(`[picture-aspect] ${tag}: picture box ${w.toFixed(1)} x ${h.toFixed(1)} mm, aspect ${aspect.toFixed(3)}, want ${aspectMin.toFixed(3)} to ${aspectMax.toFixed(3)}`);
            if (w < minPictureShare * wide) problems.push(`[picture-width] ${tag}: picture ${w.toFixed(1)} mm wide, want at least ${(minPictureShare * wide).toFixed(1)}`);
            if (page.picture.top > 12) problems.push(`[picture-top] ${tag}: the picture starts ${page.picture.top.toFixed(1)} mm from the top, want the top of the page`);
        }
        if (page.number >= 3 && page.number <= 10) {
            if (!page.text || !page.picture) { problems.push(`[layout-text] ${tag}: no text or no picture`); continue; }
            if (page.text.top < page.picture.bottom - 0.01) problems.push(`[text-under] ${tag}: the text starts at ${page.text.top.toFixed(1)} mm, above the picture bottom ${page.picture.bottom.toFixed(1)}`);
            if (Math.abs(page.text.left - page.picture.left) > 0.5) problems.push(`[text-left] ${tag}: the text left edge ${page.text.left.toFixed(1)} mm, the picture left edge ${page.picture.left.toFixed(1)} mm`);
            if (!/^(left|start)$/.test(page.text.align)) problems.push(`[text-left] ${tag}: text-align ${page.text.align}, want left`);
            if (page.text.fontPt < minTextPt - 0.05) problems.push(`[text-size] ${tag}: ${page.text.fontPt.toFixed(2)} pt, want at least ${minTextPt}`);
            if (page.text.bottom - page.text.top > 2 * page.text.lineMm + 0.5) problems.push(`[text-lines] ${tag}: text is ${((page.text.bottom - page.text.top) / page.text.lineMm).toFixed(1)} lines, want at most 2`);
        }
        const wantsNumber = page.number >= 2 && page.number <= 11;
        if (wantsNumber && !page.pageNumber) problems.push(`[page-number] ${tag}: no page number`);
        if (!wantsNumber && page.pageNumber) problems.push(`[page-number] ${tag}: a page number on the cover or the back cover`);
        if (page.pageNumber) {
            if (page.pageNumber.text.trim() !== String(page.number)) problems.push(`[page-number] ${tag}: number text "${page.pageNumber.text.trim()}"`);
            if (page.pageNumber.right < wide - 25 || page.pageNumber.bottom < high - 15) problems.push(`[page-number] ${tag}: the number is not at the bottom right`);
        }
        const wantsFooter = page.number >= 2;
        if (wantsFooter && !page.footer) problems.push(`[footer] ${tag}: no footer`);
        if (!wantsFooter && page.footer) problems.push(`[footer] ${tag}: a footer on the cover`);
        if (page.footer) {
            if (!page.footer.text.includes(title) || !page.footer.text.includes(`Level ${level}`)) problems.push(`[footer] ${tag}: footer "${page.footer.text.trim()}", want the title "${title}" and "Level ${level}"`);
            if (page.footer.left > 25 || page.footer.bottom < high - 15) problems.push(`[footer] ${tag}: the footer is not at the bottom left`);
            if (page.footer.fontPt > maxFooterPt) problems.push(`[footer] ${tag}: footer ${page.footer.fontPt.toFixed(1)} pt, want a small footer (${maxFooterPt} pt or less)`);
        }
        const named = [['picture', page.picture], ['text', page.text], ['number', page.pageNumber], ['footer', page.footer]] as const;
        for (let i = 0; i < named.length; i++) {
            for (let j = i + 1; j < named.length; j++) {
                const a = named[i][1], b = named[j][1];
                if (a && b && intersects(a, b)) problems.push(`[layout-overlap] ${tag}: the ${named[i][0]} overlaps the ${named[j][0]}`);
            }
        }
    }
    return problems;
}

/**
 * Measures the reader pages of a document in the browser: one entry for each `[data-reader-page]` element, in
 * millimeters from the top left corner of the page. The page must not be turned. `scale` is the CSS scale of the
 * page (2 on the A3 output). The function holds no outer variable, so the browser can run it.
 * @param scale The CSS scale of the reader page against its 198 x 148.5 mm box.
 * @returns The measured pages in document order.
 */
export function measureReaderPagesInBrowser(scale: number): MeasuredReaderPage[] {
    const pxPerMm = 96 / 25.4 * scale;
    return Array.from(document.querySelectorAll<HTMLElement>('[data-reader-page]'), (reader) => {
        const origin = reader.getBoundingClientRect();
        const box = (element: Element): { left: number; top: number; right: number; bottom: number } => {
            const r = element.getBoundingClientRect();
            return { left: (r.left - origin.left) / pxPerMm, top: (r.top - origin.top) / pxPerMm, right: (r.right - origin.left) / pxPerMm, bottom: (r.bottom - origin.top) / pxPerMm };
        };
        const picture = reader.querySelector('.reader-picture');
        const text = reader.querySelector('[data-part="reader-text"]');
        const number = reader.querySelector('[data-part="reader-number"]');
        const footer = reader.querySelector('[data-part="reader-footer"]');
        const special = new Set<Element | null>([picture, text, number, footer]);
        const others = Array.from(reader.querySelectorAll('*'))
            .filter((element) => !special.has(element) && !picture?.contains(element) && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0)
            .map(box);
        const style = (element: Element) => getComputedStyle(element);
        return {
            number: Number(reader.getAttribute('data-page-number')),
            page: box(reader),
            picture: picture ? box(picture) : undefined,
            text: text ? { ...box(text), fontPt: parseFloat(style(text).fontSize) * 0.75, lineMm: parseFloat(style(text).lineHeight) / (96 / 25.4), align: style(text).textAlign } : undefined,
            pageNumber: number ? { ...box(number), text: number.textContent ?? '' } : undefined,
            footer: footer ? { ...box(footer), text: footer.textContent ?? '', fontPt: parseFloat(style(footer).fontSize) * 0.75 } : undefined,
            others,
            quest: reader.querySelector('.quest-reader-page') !== null,
        };
    });
}

/** The measure of one leaf side in the browser: the boxes that the leaf mark must clear. */
export interface MeasuredLeafSide {
    /** The side box. */
    side: BoxMm;
    /** The leaf mark box. */
    mark: BoxMm;
    /** The fold line y position, in millimeters from the side top. */
    foldY: number;
    /** The perforation x position, in millimeters from the side left edge. */
    perforationX: number;
    /** The boxes of the two reader pages, top then bottom. */
    pages: BoxMm[];
    /** The boxes of the content of the two pages (every element with a size inside a reader page). */
    content: BoxMm[];
}

/**
 * Measures the leaf sides of a document in the browser, in millimeters from the top left corner of each side
 * (a `[data-leaf-side]` element of the readers build, or a reader `.student-page` of the student book).
 * @param selector The selector of the leaf sides.
 * @returns One measure for each side in document order.
 */
export function measureLeafSidesInBrowser(selector: string): MeasuredLeafSide[] {
    const pxPerMm = 96 / 25.4;
    return Array.from(document.querySelectorAll<HTMLElement>(selector), (side) => {
        const origin = side.getBoundingClientRect();
        const box = (element: Element): { left: number; top: number; right: number; bottom: number } => {
            const r = element.getBoundingClientRect();
            return { left: (r.left - origin.left) / pxPerMm, top: (r.top - origin.top) / pxPerMm, right: (r.right - origin.left) / pxPerMm, bottom: (r.bottom - origin.top) / pxPerMm };
        };
        const fold = side.querySelector('[data-part="fold-line"]')!.getBoundingClientRect();
        const perforation = side.querySelector('[data-part="perforation"]')!.getBoundingClientRect();
        const content = Array.from(side.querySelectorAll('[data-reader-page] *'))
            .filter((element) => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0)
            .map(box);
        const pages = Array.from(side.querySelectorAll('[data-reader-page]'), box);
        return { side: box(side), pages, mark: box(side.querySelector('[data-part="leaf-mark"]')!), foldY: (fold.top - origin.top) / pxPerMm, perforationX: (perforation.left - origin.left) / pxPerMm, content };
    });
}

/**
 * Lists every way in which a measured leaf side breaks the placement rules (spec FR-5.1): the two pages fill the torn leaf, and the leaf mark lies inside a page margin
 * (it touches no content box), near the top of the side, clear of the fold line and of the perforation, and inside the torn leaf.
 * @param sides The measured leaf sides in printed order (front, back, front, back, and so on).
 * @returns The problems, each a short sentence that starts with a stable tag in brackets.
 */
export function leafSidePlacementProblems(sides: MeasuredLeafSide[]): string[] {
    const problems: string[] = [];
    sides.forEach((entry, index) => {
        const tag = `side ${index + 1}`;
        const front = index % 2 === 0;
        const { mark } = entry;
        // The two upright pages lie on the torn leaf: 198 mm wide, one above the other, from the perforation to the outer edge.
        const leafLeft = front ? entry.perforationX : 0;
        entry.pages.forEach((box, half) => {
            const want = { left: leafLeft, top: half * READER_PAGE_MM.heightMm };
            if (Math.abs(box.left - want.left) > 0.3 || Math.abs(box.top - want.top) > 0.3
                || Math.abs(box.right - box.left - READER_PAGE_MM.widthMm) > 0.3 || Math.abs(box.bottom - box.top - READER_PAGE_MM.heightMm) > 0.3) {
                problems.push(`[page-place] ${tag} page ${half + 1}: box (${box.left.toFixed(1)}, ${box.top.toFixed(1)}, ${box.right.toFixed(1)}, ${box.bottom.toFixed(1)}), want ${READER_PAGE_MM.widthMm} x ${READER_PAGE_MM.heightMm} mm at (${want.left}, ${want.top})`);
            }
        });
        if (mark.top < 0.5 || mark.top > 10) problems.push(`[mark-position] ${tag}: the mark starts ${mark.top.toFixed(1)} mm from the top, want a page margin at the top`);
        if (Math.abs(mark.bottom - entry.foldY) < 3 || (mark.top < entry.foldY && mark.bottom > entry.foldY - 3)) problems.push(`[mark-fold] ${tag}: the mark is within 3 mm of the fold line`);
        if (Math.abs(mark.left - entry.perforationX) < 3 || Math.abs(mark.right - entry.perforationX) < 3 || (mark.left < entry.perforationX && mark.right > entry.perforationX)) problems.push(`[mark-perforation] ${tag}: the mark is within 3 mm of the perforation`);
        if (front ? mark.left < entry.perforationX + 3 : mark.right > entry.perforationX - 3) problems.push(`[mark-leaf] ${tag}: the mark is not inside the torn leaf`);
        for (const box of entry.content) if (intersects(mark, box)) problems.push(`[mark-overlap] ${tag}: the mark overlaps page content`);
    });
    return problems;
}

/** The former name of `leafSidePlacementProblems`, kept for the test files that import it. */
export const leafMarkProblems = leafSidePlacementProblems;
