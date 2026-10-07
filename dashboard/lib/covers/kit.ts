import { JSDOM } from 'jsdom';

/**
 * The cover kit (track book_covers_20261007): the layers that every cover shares, cut from Daniel's
 * Canva SVG export. Canva writes each cover page as pictures (`<image>` with a data URL, placed by
 * `matrix()` transforms, sometimes under a mask) and text as outlined letters (one
 * `<g fill="…" fill-opacity="1">` run of `translate()` groups per word). A layer is the page with
 * every other element removed; Chrome then renders it with a transparent background, so the masks,
 * clips, and opacities stay exactly as Canva drew them. Pure: `scripts/covers/extract-kit.ts`
 * renders the layers.
 */

/** A rectangle on the page, in points (the SVG user units). */
export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** A picture on the page. */
export interface PagePicture {
    element: Element;
    /** The size of the embedded picture in pixels. */
    pixels: { width: number; height: number };
    /** Where the picture sits on the page. */
    box: Box;
    /** True when the picture is under a mask (Canva's transparency). */
    masked: boolean;
}

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

const multiply = (m: Matrix, n: Matrix): Matrix => [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
];

/**
 * Reads an SVG `transform` attribute (Canva uses `matrix()` and `translate()` only).
 * @param value The attribute value, or null.
 * @returns The matrix. Throws on another transform function.
 */
export function parseTransform(value: string | null): Matrix {
    if (!value) return IDENTITY;
    let m = IDENTITY;
    for (const [, fn, args] of value.matchAll(/(\w+)\(([^)]*)\)/g)) {
        const n = args.split(/[\s,]+/).filter(Boolean).map(Number);
        if (fn === 'matrix' && n.length === 6) m = multiply(m, n as Matrix);
        else if (fn === 'translate') m = multiply(m, [1, 0, 0, 1, n[0] ?? 0, n[1] ?? 0]);
        else throw new Error(`Unsupported transform: ${fn}(${args})`);
    }
    return m;
}

/**
 * Parses an SVG file.
 * @param svg The SVG text.
 * @returns The document.
 */
export function parseSvg(svg: string): Document {
    return new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;
}

/**
 * The page size from the root `viewBox`.
 * @param doc The SVG document.
 * @returns The width and height in points.
 */
export function pageSize(doc: Document): { width: number; height: number } {
    const vb = (doc.documentElement.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || vb.some((v) => !Number.isFinite(v))) throw new Error('The SVG has no viewBox');
    return { width: vb[2], height: vb[3] };
}

const inDefs = (el: Element) => el.closest('defs') !== null;

/**
 * The pictures that are drawn on the page (not the mask pictures in `<defs>`), in document order.
 * @param doc The SVG document.
 * @returns The pictures with their place on the page.
 */
export function pagePictures(doc: Document): PagePicture[] {
    return [...doc.getElementsByTagName('image')]
        .filter((el) => !inDefs(el))
        .map((el) => {
            let m = IDENTITY;
            const chain: Element[] = [];
            for (let p: Element | null = el; p && p !== doc.documentElement; p = p.parentElement) chain.unshift(p);
            for (const p of chain) m = multiply(m, parseTransform(p.getAttribute('transform')));
            const width = Number(el.getAttribute('width'));
            const height = Number(el.getAttribute('height'));
            const x = Number(el.getAttribute('x') ?? 0);
            const y = Number(el.getAttribute('y') ?? 0);
            return {
                element: el,
                pixels: { width, height },
                box: { x: m[0] * x + m[4], y: m[3] * y + m[5], width: m[0] * width, height: m[3] * height },
                masked: chain.some((p) => p.hasAttribute('mask')),
            };
        });
}

/**
 * The book art: the one unmasked picture as wide as the page.
 * @param pictures The page pictures.
 * @param page The page size.
 * @returns The art. Throws when there is not exactly one.
 */
export function findArt(pictures: PagePicture[], page: { width: number }): PagePicture {
    const art = pictures.filter((p) => !p.masked && p.box.width >= 0.98 * page.width);
    if (art.length !== 1) throw new Error(`Expected one full-width art picture, found ${art.length}`);
    return art[0];
}

/**
 * The CEFR badge: a square picture in the top-right corner of the back.
 * @param pictures The page pictures.
 * @param page The page size.
 * @returns The badge. Throws when there is not exactly one.
 */
export function findBadge(pictures: PagePicture[], page: { width: number; height: number }): PagePicture {
    const badge = pictures.filter(
        (p) => p.box.x > page.width / 2 && p.box.y < page.height / 8 && p.box.width < page.width / 3 && Math.abs(p.box.width - p.box.height) < 0.05 * p.box.width,
    );
    if (badge.length !== 1) throw new Error(`Expected one badge picture in the top-right corner, found ${badge.length}`);
    return badge[0];
}

/** Text runs: Canva's outlined letters, one `<g fill fill-opacity>` group of `translate()` groups. */
function textRuns(doc: Document): Element[] {
    return [...doc.getElementsByTagName('g')].filter(
        (g) =>
            !inDefs(g) &&
            g.hasAttribute('fill') &&
            g.hasAttribute('fill-opacity') &&
            g.children.length > 0 &&
            [...g.children].every((c) => c.tagName === 'g' && (c.getAttribute('transform') ?? '').startsWith('translate(')),
    );
}

/** The white rectangles that Canva puts under the whole page. */
function pageFills(doc: Document, page: { width: number; height: number }): Element[] {
    return [...doc.getElementsByTagName('path')].filter((p) => {
        if (inDefs(p) || (p.getAttribute('fill') ?? '').toLowerCase() !== '#ffffff') return false;
        const n = (p.getAttribute('d') ?? '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
        const xs = n.filter((_, i) => i % 2 === 0);
        const ys = n.filter((_, i) => i % 2 === 1);
        return xs.length > 0 && Math.max(...xs) - Math.min(...xs) >= 0.98 * page.width && Math.max(...ys) - Math.min(...ys) >= 0.98 * page.height;
    });
}

/** Vector drawings: masked groups without a picture (the wooden sign on the back). */
function vectorGroups(doc: Document): Element[] {
    return [...doc.getElementsByTagName('g')].filter((g) => !inDefs(g) && g.hasAttribute('mask') && g.getElementsByTagName('image').length === 0);
}

/**
 * One kit layer: the page with the text, the white page fill, and every picture not in `keep`
 * removed.
 * @param svg The Canva SVG text.
 * @param select Picks the pictures to keep from the page pictures.
 * @param opts `vectors: false` also removes the vector drawings.
 * @returns The layer SVG.
 */
export function stripLayer(svg: string, select: (pictures: PagePicture[], page: { width: number; height: number }) => PagePicture[], opts: { vectors: boolean }): string {
    const doc = parseSvg(svg);
    const page = pageSize(doc);
    const pictures = pagePictures(doc);
    const keep = new Set(select(pictures, page).map((p) => p.element));
    const remove = [...pictures.filter((p) => !keep.has(p.element)).map((p) => p.element), ...textRuns(doc), ...pageFills(doc, page), ...(opts.vectors ? [] : vectorGroups(doc))];
    for (const el of remove) el.remove();
    return new (doc.defaultView as unknown as { XMLSerializer: typeof XMLSerializer }).XMLSerializer().serializeToString(doc);
}

/** How Canva placed the book art: scaled to the page width, aligned to the top or the middle. */
export interface ArtPlacement {
    align: 'top' | 'center';
}

/**
 * The art placement of a page.
 * @param art The art picture.
 * @param page The page size.
 * @returns `top` when the art starts at the top edge, else `center`.
 */
export function artPlacement(art: PagePicture, page: { height: number }): ArtPlacement {
    const centerOffset = (page.height - art.box.height) / 2;
    return { align: Math.abs(art.box.y) <= Math.abs(art.box.y - centerOffset) ? 'top' : 'center' };
}

/** The kit layers and the pictures each one keeps. */
export const KIT_LAYERS = {
    /** Front: the level bar, the PA logo, and the empty title banner. */
    frontFrame: (pictures: PagePicture[], page: { width: number; height: number }) => {
        const art = findArt(pictures, page);
        return pictures.filter((p) => p !== art);
    },
    /** Back: the paper panel, the RA logo, the CEFR steps, the QR code, and the wooden sign. */
    backOverlay: (pictures: PagePicture[], page: { width: number; height: number }) => {
        const art = findArt(pictures, page);
        const badge = findBadge(pictures, page);
        return pictures.filter((p) => p !== art && p !== badge);
    },
    /** Back: the CEFR badge only. */
    badge: (pictures: PagePicture[], page: { width: number; height: number }) => [findBadge(pictures, page)],
};
