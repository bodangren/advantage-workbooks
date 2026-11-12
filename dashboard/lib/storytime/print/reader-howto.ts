import { fontFaceCss } from './print-fonts';
import { STORYTIME_PRINT_PROFILE, type StorytimePrintProfile } from './profile';
import { readerPageCss, type StorytimeReaderLeafSide } from './readers';

/**
 * The teacher how-to "How to make a student book" (A-47, Daniel 2026-11-04): three steps, cut, fold,
 * and staple, one numbered diagram for each step, and one picture of the finished reader. Thai comes
 * first (the language of the teacher) and the English line stands under it, smaller. The page is A4
 * portrait, black and white, two sheets.
 *
 * The diagrams are SVG made by code. They read the real layout and do not retype it: the leaf size,
 * the perforation, and the reader page size come from the print profile; the picture box of a page
 * comes from the page style of `readers.ts`; and the page numbers and their print turns come from the
 * leaf sides that `readers.ts` makes for the student book.
 */

/** The number of staples on the fold (Daniel's step 3). */
export const HOWTO_STAPLES = 2;

/** The number of readers of a week (the how-to says "2 small books"). */
const READERS_PER_WEEK = 2;

/** The title of the how-to in the two languages (Daniel's title). */
export const HOWTO_TITLE = { th: 'วิธีทำหนังสือเล่มเล็กจากสมุดนักเรียน', en: 'How to make a student book' } as const;

/** The black and the white of the page. The diagrams use no other color. */
const INK = '#000';
const WHITE = '#fff';

/** One face of one leaf as the diagrams draw it. */
export interface HowtoLeafFace {
    /** The leaf number, from 1 to the number of leaves. */
    leaf: number;
    /** The printed face. */
    face: 'front' | 'back';
    /** The page numbers of the top half and the bottom half. */
    pages: [number, number];
    /** The print turn in degrees of the top page and of the bottom page (180 on most fronts, 0 on a back). */
    turns: [number, number];
    /** Whether the top page and the bottom page print a picture frame (the cover and the story pages do; pages 2, 11, and 12 do not). */
    frames: [boolean, boolean];
}

/** One page as a view of the finished book: its number, and whether it prints a picture frame. */
interface ViewPage {
    /** The page number. */
    number: number;
    /** Whether the page prints a picture frame. */
    frame: boolean;
}

/**
 * Reads the faces of the leaves of one reader from the leaf sides that `readers.ts` makes. The page
 * numbers come from `side.pages`, and the print turn of each page comes from the `data-turn-deg` of
 * the page HTML. The picture frame of a page comes from the `reader-picture` element of the page HTML.
 * A change of the imposition or of the pages in `readers.ts` changes the diagrams.
 * @param sides The 6 leaf sides of one reader (3 leaves, front then back).
 * @returns The faces in the order of the sides.
 * @throws Error When the sides are not the two faces of each leaf of one reader.
 */
export function readerHowtoLeaves(sides: StorytimeReaderLeafSide[]): HowtoLeafFace[] {
    if (!sides.length || sides.length % 2 !== 0) throw new Error(`the how-to needs the front and the back of each leaf; got ${sides.length} sides`);
    if (new Set(sides.map((side) => side.title)).size !== 1) throw new Error('the how-to needs the sides of one reader');
    const faces = sides.map((side): HowtoLeafFace => {
        const turns = Array.from(side.html.matchAll(/data-turn-deg="(\d+)"/g), (match) => Number(match[1]));
        if (side.pages.length !== 2 || turns.length !== 2) throw new Error(`leaf ${side.leaf} ${side.side}: the side must hold 2 pages, each with a turn`);
        const chunks = side.html.split('data-reader-page').slice(1);
        if (chunks.length !== 2) throw new Error(`leaf ${side.leaf} ${side.side}: the side HTML must hold 2 reader pages`);
        // changed 2026-11-12 (R-A47-16, the F5 page 1): the quest reader cover page 1 is a picture page too.
        const frames = chunks.map((chunk) => /class="(?:reader-picture|quest-reader-page)"/.test(chunk));
        return { leaf: side.leaf, face: side.side, pages: [side.pages[0], side.pages[1]], turns: [turns[0], turns[1]], frames: [frames[0], frames[1]] };
    });
    const leaves = Array.from(new Set(faces.map((face) => face.leaf)));
    for (const leaf of leaves) {
        for (const face of ['front', 'back'] as const) {
            if (faces.filter((entry) => entry.leaf === leaf && entry.face === face).length !== 1) throw new Error(`leaf ${leaf} has no single ${face}`);
        }
    }
    return faces;
}

/** The faces of a leaf; it throws when the leaf has none. */
function faceOf(leaves: HowtoLeafFace[], leaf: number, face: 'front' | 'back'): HowtoLeafFace {
    const found = leaves.find((entry) => entry.leaf === leaf && entry.face === face);
    if (!found) throw new Error(`no ${face} for leaf ${leaf}`);
    return found;
}

/** The widths of the view boxes of the two fold diagrams: the front has room for the fold arrow. */
const FOLD_BOX_W = { front: 290, back: 218 } as const;

/** The measures of the drawings, in millimeters of the real paper. */
interface Geometry {
    /** The width and the height of the student-book page (A4). */
    pageW: number;
    pageH: number;
    /** The distance of the perforation from the spine. */
    strip: number;
    /** The width and the height of the torn leaf. */
    leafW: number;
    leafH: number;
    /** The fold line, in the middle of the leaf. */
    foldY: number;
    /** The width and the height of one reader page. */
    half: { w: number; h: number };
    /** The picture box and the top of the text of a reader page. */
    picture: { left: number; top: number; width: number; height: number };
    textTop: number;
}

/**
 * The measures of the diagrams. The picture box and the text top are read from the page style of
 * `readers.ts`, so that the sketch of a page follows the real reader page.
 * @param profile The print profile.
 * @returns The measures.
 * @throws Error When the page style holds no picture box or no text box.
 */
function geometryOf(profile: StorytimePrintProfile): Geometry {
    const css = readerPageCss(profile);
    const picture = /\.reader-picture \{[^}]*?left: ([\d.]+)mm; top: ([\d.]+)mm; width: ([\d.]+)mm; height: ([\d.]+)mm/.exec(css);
    const text = /\.reader-text \{[^}]*?top: ([\d.]+)mm/.exec(css);
    if (!picture || !text) throw new Error('the reader page style holds no picture box or no text box');
    const leafH = profile.trim.heightMm;
    return {
        pageW: profile.trim.widthMm,
        pageH: leafH,
        strip: profile.perforationMm,
        leafW: profile.trim.widthMm - profile.perforationMm,
        leafH,
        foldY: leafH / 2,
        half: { w: profile.readerPage.widthMm, h: profile.readerPage.heightMm },
        picture: { left: Number(picture[1]), top: Number(picture[2]), width: Number(picture[3]), height: Number(picture[4]) },
        textTop: Number(text[1]),
    };
}

/**
 * The place of the leaf mark on the v13 leaf (`readers.ts` and `student-book.ts`, rule `.leaf-mark`): the top of the
 * text is 2 mm from the top edge of the side, the text is centered over the width of the torn leaf, and it is upright.
 * The mark is a child of the side, so the turn of page 1 does not turn it. The test compares this value with both style rules.
 */
const LEAF_MARK = { topMm: 2 } as const;

/** The ticks of step 1 on the sheet, in millimeters of the printed how-to. The printed ticks are 5 mm long and 0.4 mm thick; the diagram draws them large so that a teacher sees them. */
const TICK_MM = { length: 12, thick: 1.6 } as const;

/** The mark of a leaf, as the book prints it (`<title> · sheet N of M`, D-A of 2026-11-12). */
const leafMark = (title: string, leaf: number, leaves: number): string => `${title} · sheet ${leaf} of ${leaves}`;

/** HTML-escapes a text. */
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const r2 = (value: number): number => Math.round(value * 100) / 100;

/** The stroke of a line of `mm` millimeters at the scale `s` (millimeters of paper for each drawing unit). */
function stroke(s: number, mm: number, dash?: [number, number]): string {
    const base = `fill="none" stroke="${INK}" stroke-width="${r2(mm / s)}"`;
    return dash ? `${base} stroke-dasharray="${r2(dash[0] / s)} ${r2(dash[1] / s)}"` : base;
}

/** The size of a text in drawing units for a font size in points. */
const unitsOfPt = (s: number, points: number): number => r2((points * 25.4) / 72 / s);

/** One text element of a drawing. */
function drawText(s: number, cls: 'th' | 'en' | 'num' | 'mark', x: number, y: number, points: number, content: string, anchor: 'start' | 'middle' | 'end' = 'middle', extra = ''): string {
    return `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" font-size="${unitsOfPt(s, points)}" text-anchor="${anchor}"${extra}>${esc(content)}</text>`;
}

/** A label of a drawing: the Thai line and, under it and smaller, the English line. */
function label(s: number, x: number, y: number, th: string, en: string, anchor: 'start' | 'middle' | 'end' = 'middle', thPt = 9, enPt = 7, attrs = ''): string {
    const enY = y + unitsOfPt(s, thPt * 0.25 + enPt * 1.1);
    return `<g data-label${attrs ? ` ${attrs}` : ''}>${drawText(s, 'th', x, y, thPt, th, anchor)}${drawText(s, 'en', x, enY, enPt, en, anchor)}</g>`;
}

/** The arrow head of a drawing. */
function arrowDefs(id: string, s: number): string {
    const size = r2(2.1 / s);
    return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="${size}" markerHeight="${size}" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${INK}"/></marker></defs>`;
}

/** The start of a drawing: the view box in millimeters of paper, and the width on the sheet. */
function svgOpen(diagram: string, box: [number, number, number, number], widthMm: number, attrs = ''): string {
    const [x, y, w, h] = box;
    return `<svg data-diagram="${diagram}"${attrs ? ` ${attrs}` : ''} xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${r2(widthMm)}mm" height="${r2((widthMm * h) / w)}mm">`;
}

/** The scale of a drawing: millimeters of paper for each drawing unit. */
const scaleOf = (box: [number, number, number, number], widthMm: number): number => widthMm / box[2];

/**
 * The sketch of one reader page in its own corner, as the v13 leaf prints it. A page with a picture (the cover and the
 * story pages) has one solid picture frame and two text lines under it. A page with no picture (page 2, page 11, and
 * the back cover, page 12) has no frame and shows only text lines at the top. The page area (`data-part="page"`) is
 * not drawn: the v13 leaf has no line around a page. All lines are solid: the fold line is the only dashed line of a leaf.
 */
function pageSketch(g: Geometry, s: number, frame: boolean): string {
    const { picture, half, textTop } = g;
    const area = `<rect data-part="page" x="0" y="0" width="${half.w}" height="${half.h}" fill="none" stroke="none"/>`;
    const bar = (y: number, share: number): string => `<line x1="${picture.left}" y1="${r2(y)}" x2="${r2(picture.left + picture.width * share)}" y2="${r2(y)}" ${stroke(s, 0.8)}/>`;
    if (frame) {
        return `${area}<rect data-part="frame" x="${picture.left}" y="${picture.top}" width="${picture.width}" height="${picture.height}" fill="${WHITE}" ${stroke(s, 0.3)}/>${bar(textTop + 7, 0.7)}${bar(textTop + 16, 0.4)}`;
    }
    return `${area}${bar(picture.top + 14, 0.3)}${bar(picture.top + 26, 0.5)}${bar(picture.top + 42, 0.55)}${bar(picture.top + 54, 0.85)}`;
}

/** The page number: in the middle of the picture frame, or (on a page with no frame) in the lower middle of the page, in the page corner system. */
function pageNumber(g: Geometry, number: number, size: number, frame: boolean): string {
    const { picture, half } = g;
    const x = frame ? picture.left + picture.width / 2 : half.w / 2;
    const y = (frame ? picture.top + picture.height / 2 : picture.top + 94) + size * 0.36;
    return `<text class="num" x="${r2(x)}" y="${r2(y)}" font-size="${size}" text-anchor="middle">${number}</text>`;
}

/**
 * One printed page of a leaf face at (ox, oy): the group holds the sketch and the number, turned by the
 * print turn about the center of the page. The page is upside down in the diagram exactly when it is
 * printed upside down. The group names its origin, so that a test can place the frames.
 */
function printedPage(g: Geometry, s: number, face: HowtoLeafFace, half: 'top' | 'bottom', ox: number, oy: number, numberSize: number): string {
    const index = half === 'top' ? 0 : 1;
    const number = face.pages[index];
    const turn = face.turns[index];
    const frame = face.frames[index];
    const cx = ox + g.half.w / 2;
    const cy = oy + g.half.h / 2;
    return `<g data-page data-leaf="${face.leaf}" data-face="${face.face}" data-half="${half}" data-page-number="${number}" data-turn-deg="${turn}" data-origin-x="${r2(ox)}" data-origin-y="${r2(oy)}" transform="rotate(${turn} ${r2(cx)} ${r2(cy)})">`
        + `<g transform="translate(${r2(ox)} ${r2(oy)})">${pageSketch(g, s, frame)}${pageNumber(g, number, numberSize, frame)}</g></g>`;
}

/** One page as the child sees it after the fold: upright (a view turn of 0 degrees). */
function viewedPage(g: Geometry, s: number, page: ViewPage, ox: number, oy: number, numberSize: number): string {
    return `<g data-page data-page-number="${page.number}" data-view-turn-deg="0" data-origin-x="${r2(ox)}" data-origin-y="${r2(oy)}"><g transform="translate(${r2(ox)} ${r2(oy)})">${pageSketch(g, s, page.frame)}${pageNumber(g, page.number, numberSize, page.frame)}</g></g>`;
}

/**
 * The leaf mark as the v13 leaf prints it: upright, centered over the torn leaf, the top of the text 2 mm from the
 * top edge. It is drawn after the pages and outside their groups, so a turned page does not turn it. The diagram
 * draws the text larger than the 5 pt of the print, so that a teacher can read it.
 * @param left The x of the left edge of the torn leaf in the drawing.
 */
function leafMarkText(g: Geometry, s: number, left: number, title: string, leaves: number): string {
    const size = 5.5;
    const baseline = LEAF_MARK.topMm + unitsOfPt(s, size) * 0.85;
    return drawText(s, 'mark', left + g.leafW / 2, baseline, size, leafMark(title, 1, leaves), 'middle', ` data-part="leaf-mark" data-top-mm="${LEAF_MARK.topMm}" data-center-mm="${g.leafW / 2}" data-turn-deg="0"`);
}

/**
 * The fold line of a leaf across the middle, the only dashed line of a leaf, with "พับ / fold" at each end as the
 * printed leaf shows it. The labels stand in the page margin, and the dashes run between them, so that no label
 * needs a white box over a page frame.
 */
function foldLine(s: number, x0: number, x1: number, y: number, position: number, thPt: number, enPt: number): string {
    const gap = r2(0.8 / s);
    const labelW = r2(4.3 / s);
    const base = y - r2(0.3 / s);
    return `<line data-part="fold-line" data-position-mm="${position}" x1="${r2(x0 + labelW + gap)}" y1="${y}" x2="${r2(x1 - labelW - gap)}" y2="${y}" ${stroke(s, 0.5, [2.2, 1.4])}/>`
        + label(s, x0 + gap, base, 'พับ', 'fold', 'start', thPt, enPt)
        + label(s, x1 - gap, base, 'พับ', 'fold', 'end', thPt, enPt);
}

/**
 * The diagram of step 1: the open student book, drawn from the v13 leaf. The right page holds the leaf. The leaf is cut
 * out of the book along its bound edge, between two large solid ticks at the top and at the bottom edge, with a label
 * "ขีดสั้น ๆ / tick" and a leader line at each tick. The scissors have cut the part under them (a slit). The cut is not
 * along the side of the reader pages, and the fold line is the only dashed line. Page 1 has its own picture frame; page 12
 * has none; the leaf mark is upright at the top, centered over the leaf.
 */
function cutSvg(g: Geometry, leaves: HowtoLeafFace[], title: string, leafCount: number, widthMm: number): string {
    const box: [number, number, number, number] = [-6, -6, 2 * g.pageW + 12, g.pageH + 12];
    const s = scaleOf(box, widthMm);
    const px = g.pageW + g.strip;
    const front = faceOf(leaves, 1, 'front');
    const tickLen = r2(TICK_MM.length / s);
    const tickW = r2(TICK_MM.thick / s);
    const slitHalf = r2(0.7 / s);
    const slitTop = 128;
    const slitBottom = g.pageH - tickLen;
    const handle = (cx: number): string => `<circle cx="${r2(cx)}" cy="72" r="7" fill="${WHITE}" ${stroke(s, 0.5)}/>`;
    const scissors = `<rect x="${px - 17}" y="${tickLen + 4}" width="34" height="${slitTop - tickLen - 4}" fill="${WHITE}"/>${handle(px - 8)}${handle(px + 8)}`
        + `<line x1="${px - 6}" y1="78" x2="${px + 7}" y2="${slitTop}" ${stroke(s, 0.7)}/><line x1="${px + 6}" y1="78" x2="${px - 7}" y2="${slitTop}" ${stroke(s, 0.7)}/>`
        + `<circle cx="${px}" cy="${(78 + slitTop) / 2 + 3}" r="2.2" fill="${INK}"/>`;
    const tick = (edge: 'top' | 'bottom'): string => {
        const y1 = edge === 'top' ? 0 : g.pageH - tickLen;
        const mid = r2(y1 + tickLen / 2);
        const labelEnd = g.pageW - 26;
        return `<line data-part="tick" data-edge="${edge}" data-distance-mm="${g.strip}" x1="${px}" y1="${r2(y1)}" x2="${px}" y2="${r2(y1 + tickLen)}" stroke="${INK}" stroke-width="${tickW}"/>`
            + `<line data-part="tick-leader" data-for="tick-${edge}" x1="${labelEnd + 4}" y1="${mid}" x2="${r2(px - tickW / 2)}" y2="${mid}" ${stroke(s, 0.5)} marker-end="url(#arrow-cut)"/>`
            + label(s, labelEnd, r2(mid - unitsOfPt(s, 3)), 'ขีดสั้น ๆ', 'tick', 'end', 10, 8, `data-for="tick-${edge}"`);
    };
    return `${svgOpen('cut', box, widthMm, `data-page-width-mm="${g.pageW}" data-page-height-mm="${g.pageH}"`)}${arrowDefs('arrow-cut', s)}`
        + `<defs><pattern id="hatch-cut" width="${r2(1.1 / s)}" height="${r2(1.1 / s)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${r2(1.1 / s)}" stroke="${INK}" stroke-width="${r2(0.2 / s)}"/></pattern></defs>`
        + `<rect data-part="left-page" x="0" y="0" width="${g.pageW}" height="${g.pageH}" fill="${WHITE}" ${stroke(s, 0.3)}/>`
        + `<rect data-part="student-page" x="${g.pageW}" y="0" width="${g.pageW}" height="${g.pageH}" fill="${WHITE}" ${stroke(s, 0.3)}/>`
        + `<rect data-part="strip" x="${g.pageW}" y="0" width="${g.strip}" height="${g.pageH}" fill="url(#hatch-cut)"/>`
        + `<rect data-part="leaf" x="${px}" y="0" width="${g.leafW}" height="${g.leafH}" fill="${WHITE}" ${stroke(s, 0.25)}/>`
        + printedPage(g, s, front, 'top', px, 0, 44) + printedPage(g, s, front, 'bottom', px, g.foldY, 44)
        + foldLine(s, px, g.pageW * 2, g.foldY, g.foldY, 6.5, 5)
        + `<line data-part="spine" x1="${g.pageW}" y1="0" x2="${g.pageW}" y2="${g.pageH}" ${stroke(s, 0.5)}/>`
        + `<rect data-part="cut-slit" data-distance-mm="${g.strip}" x="${r2(px - slitHalf)}" y="${slitTop}" width="${r2(2 * slitHalf)}" height="${r2(slitBottom - slitTop)}" fill="${WHITE}" ${stroke(s, 0.4)}/>`
        + tick('top') + tick('bottom')
        + leafMarkText(g, s, px, title, leafCount)
        + scissors
        + label(s, g.pageW - 26, 196, 'ตัดออกจากเล่ม', 'cut out of the book', 'end', 9.5, 7.5)
        + `<path d="M ${g.pageW - 21} 192 L ${px - 4} 192" ${stroke(s, 0.5)} marker-end="url(#arrow-cut)"/></svg>`;
}

/**
 * The diagram of step 2 for one face of leaf 1: the torn leaf with its two pages in their real places and
 * turns, the dashed fold line (the only dashed line), and (on the front) the arrow that folds the bottom
 * half behind the top half.
 */
function foldLeafSvg(g: Geometry, leaves: HowtoLeafFace[], title: string, leafCount: number, face: 'front' | 'back', widthMm: number, s: number): string {
    const entry = faceOf(leaves, 1, face);
    const arrow = face === 'front';
    const box: [number, number, number, number] = [-10, -12, arrow ? FOLD_BOX_W.front : FOLD_BOX_W.back, g.leafH + 24];
    const ink = (mm: number): string => stroke(s, mm);
    const folded = arrow
        ? `<path d="M ${g.leafW + 5} 262 C ${g.leafW + 34} 245 ${g.leafW + 34} 75 ${g.leafW + 7} 44" ${ink(0.5)} marker-end="url(#arrow-fold-${face})"/>`
            + label(s, g.leafW + 42, g.foldY + 2, 'พับ', 'fold', 'start', 9, 7)
        : '';
    return `${svgOpen('fold-leaf', box, widthMm, `data-face="${face}" data-leaf="1"`)}${arrowDefs(`arrow-fold-${face}`, s)}`
        + `<rect data-part="leaf" x="0" y="0" width="${g.leafW}" height="${g.leafH}" fill="${WHITE}" ${ink(0.25)}/>`
        + printedPage(g, s, entry, 'top', 0, 0, 64) + printedPage(g, s, entry, 'bottom', 0, g.foldY, 64)
        + foldLine(s, 0, g.leafW, g.foldY, g.foldY, 6.5, 5)
        + leafMarkText(g, s, 0, title, leafCount)
        + folded + '</svg>';
}

/** The diagram of the nesting: the cross section of the folded leaves, the fold at the top, leaf 1 outside. */
function nestSvg(leafCount: number, widthMm: number): string {
    const box: [number, number, number, number] = [0, 0, 130, 190];
    const s = scaleOf(box, widthMm);
    const [, , width] = box;
    const arcs = Array.from({ length: leafCount }, (_, i) => {
        const x0 = 10 + i * 14;
        const y = 44 + i * 30;
        const radius = 12;
        return `<path data-leaf="${i + 1}" d="M ${x0} 180 L ${x0} ${y + radius} Q ${x0} ${y} ${x0 + radius} ${y} L ${width - x0 - radius} ${y} Q ${width - x0} ${y} ${width - x0} ${y + radius} L ${width - x0} 180" ${stroke(s, 0.55)}/>`
            + label(s, width / 2, y + 14, `แผ่น ${i + 1}`, `leaf ${i + 1}`, 'middle', 9, 7);
    }).join('');
    return `${svgOpen('nest', box, widthMm)}${arrowDefs('arrow-nest', s)}`
        + label(s, width / 2, 8, 'รอยพับ', 'fold', 'middle', 9, 7)
        + `<path d="M ${width / 2} 21 L ${width / 2} 38" ${stroke(s, 0.5)} marker-end="url(#arrow-nest)"/>`
        + arcs + '</svg>';
}

/**
 * The diagram of step 3: the closed reader with the fold at the top and the 2 staples on the fold. The
 * staples sit at the quarter points of the fold, each one across the fold edge.
 */
function stapleSvg(g: Geometry, cover: ViewPage, widthMm: number): string {
    const box: [number, number, number, number] = [-10, -60, 296, g.half.h + 92];
    const s = scaleOf(box, widthMm);
    const w = g.half.w;
    const staples = Array.from({ length: HOWTO_STAPLES }, (_, i) => {
        const x = r2((w * (2 * i + 1)) / (2 * HOWTO_STAPLES));
        return `<g data-staple data-on-fold="true" data-x="${x}" data-y="0" transform="translate(${x} 0)">`
            + `<rect x="-13" y="-3.5" width="26" height="7" fill="${WHITE}" ${stroke(s, 0.45)}/><line x1="-10" y1="0" x2="10" y2="0" ${stroke(s, 0.45)}/></g>`
            + `<path d="M ${x} -25 L ${x} -7" ${stroke(s, 0.45)} marker-end="url(#arrow-staple)"/>`
            + label(s, x, -44, `ลวดเย็บ ${i + 1}`, `staple ${i + 1}`, 'middle', 9, 7);
    }).join('');
    return `${svgOpen('staple', box, widthMm)}${arrowDefs('arrow-staple', s)}`
        + `<rect data-part="closed-reader" x="0" y="0" width="${w}" height="${g.half.h}" fill="${WHITE}" ${stroke(s, 0.4)}/>`
        + `<g transform="translate(0 0)">${pageSketch(g, s, cover.frame)}${pageNumber(g, cover.number, 64, cover.frame)}</g>`
        + `<line data-part="fold-edge" data-side="top" x1="0" y1="0" x2="${w}" y2="0" ${stroke(s, 1.4)}/>`
        + staples
        + label(s, w + 8, 6, 'รอยพับอยู่ด้านบน', 'the fold is at the top', 'start', 9, 7)
        + '</svg>';
}

/** The picture of the closed reader: page 1 upright, the fold at the top, and the arrow that turns a page UP over the fold. */
function closedSvg(g: Geometry, cover: ViewPage, widthMm: number): string {
    const box: [number, number, number, number] = [-10, -70, 300, g.half.h + 82];
    const s = scaleOf(box, widthMm);
    const w = g.half.w;
    return `${svgOpen('closed', box, widthMm)}${arrowDefs('arrow-closed', s)}`
        + `<rect x="0" y="0" width="${w}" height="${g.half.h}" fill="${WHITE}" ${stroke(s, 0.4)}/>`
        + viewedPage(g, s, cover, 0, 0, 64)
        + `<line data-part="fold-edge" data-side="top" x1="0" y1="0" x2="${w}" y2="0" ${stroke(s, 1.4)}/>`
        + `<path data-turn-arrow="up" d="M ${w - 22} 128 C ${w + 54} 118 ${w + 66} 14 ${w - 8} -34" ${stroke(s, 0.7)} marker-end="url(#arrow-closed)"/>`
        + label(s, w + 8, -50, 'พลิกขึ้นข้างบน', 'turn UP', 'start', 9, 7)
        + label(s, 0, -16, 'รอยพับ', 'fold', 'start', 9, 7)
        + '</svg>';
}

/**
 * The picture of the back cover: the closed reader turned over like a book, about its vertical axis. The
 * fold stays at the top, and the back cover (page 12) is upright (Daniel 2026-11-04, fix 5).
 */
function backSvg(g: Geometry, backCover: ViewPage, widthMm: number): string {
    const box: [number, number, number, number] = [-10, -72, 218, g.half.h + 84];
    const s = scaleOf(box, widthMm);
    const w = g.half.w;
    return `${svgOpen('back', box, widthMm)}${arrowDefs('arrow-back', s)}`
        + `<rect x="0" y="0" width="${w}" height="${g.half.h}" fill="${WHITE}" ${stroke(s, 0.4)}/>`
        + viewedPage(g, s, backCover, 0, 0, 64)
        + `<line data-part="fold-edge" data-side="top" x1="0" y1="0" x2="${w}" y2="0" ${stroke(s, 1.4)}/>`
        + `<path data-turn-arrow="over" d="M 30 -12 C 60 -40 ${w - 60} -40 ${w - 28} -12" ${stroke(s, 0.6)} marker-end="url(#arrow-back)"/>`
        + label(s, w / 2, -52, 'พลิกเล่มกลับ', 'turn the book over', 'middle', 9, 7)
        + '</svg>';
}

/** The picture of the open middle: the two middle pages, upright, one on each side of the fold. */
function middleSvg(g: Geometry, pages: [ViewPage, ViewPage], widthMm: number): string {
    const box: [number, number, number, number] = [-10, -10, 218, g.leafH + 20];
    const s = scaleOf(box, widthMm);
    return `${svgOpen('middle', box, widthMm)}`
        + `<rect data-part="leaf" x="0" y="0" width="${g.leafW}" height="${g.leafH}" fill="${WHITE}" ${stroke(s, 0.25)}/>`
        + viewedPage(g, s, pages[0], 0, 0, 64) + viewedPage(g, s, pages[1], 0, g.foldY, 64)
        + `<line data-part="fold-line" x1="0" y1="${g.foldY}" x2="${g.half.w}" y2="${g.foldY}" ${stroke(s, 1.2)}/>`
        + '</svg>';
}

/** One line of text in the two languages. */
interface HowtoLine {
    /** The Thai line. */
    th: string;
    /** The English line. */
    en: string;
}

/** The text of the how-to in the two languages, filled from the leaf data and the profile. */
export interface HowtoCopy {
    /** The title. */
    title: HowtoLine;
    /** The line before the steps. */
    intro: HowtoLine;
    /** The three steps in the order cut, fold, staple. */
    steps: Array<{ id: 'cut' | 'fold' | 'staple'; title: HowtoLine; lines: HowtoLine[]; notes: HowtoLine[] }>;
    /** The finished book. */
    finished: { title: HowtoLine; lines: HowtoLine[] };
    /** The captions of the diagrams. */
    captions: { cut: HowtoLine; front: HowtoLine; back: HowtoLine; nest: HowtoLine; closed: HowtoLine; backCover: HowtoLine; middle: HowtoLine };
}

/**
 * The words for the page turns of one leaf face, read from the print turns: "pages 1 and 12 upside down"
 * when both pages print with the same turn, and one phrase for each page when the turns differ.
 */
function pagesPhrase(face: HowtoLeafFace): HowtoLine {
    const word = (turn: number): HowtoLine => (turn === 180 ? { th: 'กลับหัว', en: 'upside down' } : { th: 'ตั้งตรง', en: 'upright' });
    const [a, b] = face.pages;
    const [wa, wb] = [word(face.turns[0]), word(face.turns[1])];
    if (wa.en === wb.en) return { th: `หน้า ${a} และ ${b} ${wa.th}`, en: `pages ${a} and ${b} ${wa.en}` };
    return { th: `หน้า ${a} ${wa.th} หน้า ${b} ${wb.th}`, en: `page ${a} ${wa.en}, page ${b} ${wb.en}` };
}

/**
 * The text of the how-to. Every number in it (the leaves, the perforation, the leaf size, the pages)
 * comes from the leaf faces and the profile.
 * @param leaves The faces of the leaves of one reader.
 * @param profile The print profile.
 * @returns The Thai lines with their English lines.
 */
export function howtoCopy(leaves: HowtoLeafFace[], profile: StorytimePrintProfile = STORYTIME_PRINT_PROFILE): HowtoCopy {
    const g = geometryOf(profile);
    const leafCount = new Set(leaves.map((entry) => entry.leaf)).size;
    const front = faceOf(leaves, 1, 'front');
    const back = faceOf(leaves, 1, 'back');
    const cover = front.pages[0];
    const backCover = front.pages[1];
    const middle = faceOf(leaves, leafCount, 'back').pages;
    const mm = profile.perforationMm;
    return {
        title: { ...HOWTO_TITLE },
        intro: {
            th: `แต่ละสัปดาห์มีหนังสือเล่มเล็ก ${READERS_PER_WEEK} เล่ม หนังสือแต่ละเล่มมี ${leafCount} แผ่น ทุกแผ่นมีชื่อเรื่องเดียวกัน และมีข้อความเล็กว่า “leaf 1 of ${leafCount}” ถึง “leaf ${leafCount} of ${leafCount}”`,
            en: `Each week has ${READERS_PER_WEEK} small books. Each book has ${leafCount} leaves with the same title and the marks "leaf 1 of ${leafCount}" to "leaf ${leafCount} of ${leafCount}".`,
        },
        steps: [
            {
                id: 'cut',
                title: { th: 'ตัด', en: 'Cut' },
                lines: [
                    {
                        th: `ตัดแผ่นทั้ง ${leafCount} แผ่นของหนังสือ 1 เล่มออกจากสมุดนักเรียน ตัดตามแนวระหว่างขีดสั้น ๆ 2 ขีดที่ขอบบนและขอบล่าง`,
                        en: `Cut the ${leafCount} leaves of one book out of the student book. Cut between the two short ticks at the top and the bottom edge.`,
                    },
                ],
                notes: [
                    { th: `แนวตัดอยู่ห่างจากสันสมุด ${mm} มม.`, en: `The cut is ${mm} mm from the spine.` },
                    { th: 'ค่อย ๆ ฉีกตามแนวตัดก็ได้', en: 'You can also tear slowly along the cut.' },
                ],
            },
            {
                id: 'fold',
                title: { th: 'พับ', en: 'Fold' },
                lines: [
                    {
                        th: 'พับแต่ละแผ่นครึ่งหนึ่งตามเส้นประ ให้ด้านที่หน้ากลับหัวอยู่ข้างนอก ครึ่งล่างพับไปอยู่ด้านหลังครึ่งบน',
                        en: 'Fold each leaf in half on the dashed line, with the upside-down pages outside. The bottom half goes behind the top half.',
                    },
                    {
                        th: 'ใส่แผ่นที่ 2 ไว้ในแผ่นที่ 1 แล้วใส่แผ่นที่ 3 ไว้ในแผ่นที่ 2',
                        en: 'Put leaf 2 inside leaf 1. Then put leaf 3 inside leaf 2.',
                    },
                ],
                notes: [],
            },
            {
                id: 'staple',
                title: { th: 'เย็บ', en: 'Staple' },
                lines: [
                    { th: `ใช้ลวดเย็บกระดาษ ${HOWTO_STAPLES} ตัวตรงรอยพับ`, en: `Put ${HOWTO_STAPLES} staples on the fold.` },
                    { th: 'รอยพับอยู่ด้านบนของเล่มที่ปิด', en: 'The fold is at the top of the closed book.' },
                ],
                notes: [{ th: 'ครูเป็นคนถือที่เย็บกระดาษ เพราะเด็กอายุ 4 ถึง 8 ปี', en: 'The teacher holds the stapler. The children are 4 to 8 years old.' }],
            },
        ],
        finished: {
            title: { th: 'หนังสือเล่มเสร็จ', en: 'The finished book' },
            lines: [
                { th: `รอยพับอยู่ด้านบน ปกคือหน้า ${cover} และตั้งตรง`, en: `The fold is at the top. The cover is page ${cover}, and it is upright.` },
                { th: 'เด็กพลิกแต่ละหน้าขึ้นข้างบน ข้ามรอยพับ', en: 'The child turns each page UP over the fold.' },
                {
                    th: `พลิกเล่มกลับเหมือนพลิกหนังสือ รอยพับยังอยู่ด้านบน ปกหลังคือหน้า ${backCover} และตั้งตรง`,
                    en: `Turn the book over like a book. The fold stays at the top. The back cover is page ${backCover}, and it is upright.`,
                },
            ],
        },
        captions: {
            cut: { th: `หลังตัดได้แผ่นขนาด ${g.leafW} x ${g.leafH} มม.`, en: `After the cut, each leaf is ${g.leafW} x ${g.leafH} mm.` },
            front: { th: `ด้านหน้า (อยู่ข้างนอก): ${pagesPhrase(front).th}`, en: `Front (outside): ${pagesPhrase(front).en}.` },
            back: { th: `ด้านหลัง (อยู่ข้างใน): ${pagesPhrase(back).th}`, en: `Back (inside): ${pagesPhrase(back).en}.` },
            nest: { th: `วางซ้อนกัน: แผ่น 1 อยู่นอกสุด แผ่น ${leafCount} อยู่ในสุด`, en: `Nested: leaf 1 is outside, leaf ${leafCount} is inside.` },
            closed: { th: 'เล่มที่ปิด: รอยพับอยู่ด้านบน', en: 'The closed book: the fold is at the top.' },
            backCover: { th: `ปกหลัง: หน้า ${backCover} ตั้งตรง`, en: `The back cover: page ${backCover}, upright.` },
            middle: { th: `ตรวจ: เปิดตรงกลาง ต้องเห็นหน้า ${middle[0]} และ ${middle[1]}`, en: `Check: open the middle. You see pages ${middle[0]} and ${middle[1]}.` },
        },
    };
}

/** A Thai line with the English line under it. */
const lineHtml = (line: HowtoLine, cls = 'line'): string => `<p class="${cls}"><span class="th" lang="th">${esc(line.th)}</span><span class="en" lang="en">${esc(line.en)}</span></p>`;

/** A figure: the diagram and its caption in the two languages. */
const figureHtml = (svg: string, widthMm: number, caption?: HowtoLine): string => `<figure style="width: ${r2(widthMm)}mm;">${svg}${caption ? `<figcaption><span class="th" lang="th">${esc(caption.th)}</span><span class="en" lang="en">${esc(caption.en)}</span></figcaption>` : ''}</figure>`;

/** The title row of a section: the number badge, the Thai title, and the English title. */
const headingHtml = (badge: string, title: HowtoLine): string => `<h2><span class="badge">${badge}</span><span class="th" lang="th">${esc(title.th)}</span><span class="en" lang="en">${esc(title.en)}</span></h2>`;

/** The check mark in the badge of the finished book, drawn as a path, because the print faces hold no check mark glyph. */
const CHECK_MARK = '<svg width="5mm" height="5mm" viewBox="0 0 10 10"><path d="M1.5 5.5 L4 8 L8.5 2" fill="none" stroke="#000" stroke-width="1.4"/></svg>';

/** The style of the how-to: two A4 portrait sheets in black and white, with the print faces of the student book. */
function howtoCss(): string {
    return `${fontFaceCss()}
@page { size: 210mm 297mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; color: #000; }
body { font-family: 'Andika', sans-serif; font-weight: 400; font-synthesis: none; }
.th { font-family: 'Sarabun', 'Andika', sans-serif; font-weight: 400; }
.en { font-family: 'Andika', sans-serif; font-weight: 400; }
.num { font-family: 'Andika', sans-serif; font-weight: 700; }
.mark { font-family: 'Andika', sans-serif; font-weight: 400; }
.badge svg { margin: 0.9mm; }
.sheet { width: 210mm; height: 296.5mm; padding: 11mm 14mm 0; position: relative; overflow: hidden; break-after: page; page-break-after: always; }
.sheet:last-of-type { break-after: auto; page-break-after: auto; }
.head { border-bottom: 0.6mm solid #000; padding-bottom: 2.5mm; margin-bottom: 3.5mm; }
.series { font-family: 'Andika', sans-serif; font-weight: 700; font-size: 10pt; margin-bottom: 1mm; }
.head h1 .th { display: block; font-size: 23pt; line-height: 1.35; }
.head h1 .en { display: block; font-size: 13pt; font-weight: 700; line-height: 1.3; }
.line { margin-bottom: 2mm; }
.line .th { display: block; font-size: 12pt; line-height: 1.5; }
.line .en { display: block; font-size: 8.5pt; line-height: 1.3; }
.line.note .th { font-size: 10.5pt; }
.line.note .en { font-size: 7.5pt; }
.step { margin-top: 3.5mm; padding-top: 2.5mm; border-top: 0.35mm solid #000; }
.step h2, .finished h2 { display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm; }
.badge { display: inline-block; width: 8mm; height: 8mm; border: 0.6mm solid #000; border-radius: 50%; text-align: center; line-height: 6.8mm; font-family: 'Andika', sans-serif; font-weight: 700; font-size: 12pt; flex: none; }
.step h2 .th, .finished h2 .th { font-size: 18pt; line-height: 1.3; }
.step h2 .en, .finished h2 .en { font-size: 12pt; font-weight: 700; }
.step-grid { display: grid; gap: 6mm; align-items: start; }
.fig-row { display: flex; gap: 4mm; align-items: flex-end; margin-top: 1.5mm; }
figure { flex: none; }
svg { display: block; }
figcaption { margin-top: 1.2mm; }
figcaption .th { display: block; font-size: 9pt; line-height: 1.35; }
figcaption .en { display: block; font-size: 7pt; line-height: 1.25; }
.finished { margin-top: 5mm; padding-top: 3mm; border-top: 0.35mm solid #000; }
.foot { position: absolute; left: 14mm; right: 14mm; bottom: 6mm; display: flex; justify-content: space-between; font-family: 'Andika', sans-serif; font-size: 7pt; }
`;
}

/**
 * Compiles the how-to to one print HTML document: two A4 portrait sheets. Sheet 1 holds the title,
 * the line before the steps, step 1 (cut), and step 2 (fold); sheet 2 holds step 3 (staple) and the
 * finished book.
 * @param sides The 6 leaf sides of one reader, from `storytimeReaderLeafSides` of `readers.ts`.
 * @param profile The print profile; the default is the profile of the student book.
 * @returns The HTML of the document.
 * @throws Error When the sides are not the leaf faces of one reader.
 */
export function compileReaderHowto(sides: StorytimeReaderLeafSide[], profile: StorytimePrintProfile = STORYTIME_PRINT_PROFILE): { html: string } {
    const leaves = readerHowtoLeaves(sides);
    const g = geometryOf(profile);
    const copy = howtoCopy(leaves, profile);
    const leafCount = new Set(leaves.map((entry) => entry.leaf)).size;
    const leaf1Front = faceOf(leaves, 1, 'front');
    const lastBack = faceOf(leaves, leafCount, 'back');
    const cover: ViewPage = { number: leaf1Front.pages[0], frame: leaf1Front.frames[0] };
    const backCover: ViewPage = { number: leaf1Front.pages[1], frame: leaf1Front.frames[1] };
    const middle: [ViewPage, ViewPage] = [{ number: lastBack.pages[0], frame: lastBack.frames[0] }, { number: lastBack.pages[1], frame: lastBack.frames[1] }];
    const title = sides[0].title;
    const [cut, fold, staple] = copy.steps;
    const frontWidth = 70;
    const foldScale = frontWidth / FOLD_BOX_W.front;
    const backWidth = r2(FOLD_BOX_W.back * foldScale);
    const stepOpen = (step: HowtoCopy['steps'][number], index: number): string => `<section class="step" data-step="${step.id}" data-step-number="${index + 1}">${headingHtml(String(index + 1), step.title)}`;
    const sheet1 = `<section class="sheet" data-sheet="1">
<header class="head"><p class="series">Storytime Advantage</p><h1><span class="th" lang="th">${esc(copy.title.th)}</span><span class="en" lang="en">${esc(copy.title.en)}</span></h1></header>
${lineHtml(copy.intro)}
${stepOpen(cut, 0)}<div class="step-grid" style="grid-template-columns: 78mm 1fr;"><div>${cut.lines.map((line) => lineHtml(line)).join('')}${cut.notes.map((line) => lineHtml(line, 'line note')).join('')}</div>${figureHtml(cutSvg(g, leaves, title, leafCount, 94), 94, copy.captions.cut)}</div></section>
${stepOpen(fold, 1)}${fold.lines.map((line) => lineHtml(line)).join('')}<div class="fig-row">${figureHtml(foldLeafSvg(g, leaves, title, leafCount, 'front', frontWidth, foldScale), frontWidth, copy.captions.front)}${figureHtml(foldLeafSvg(g, leaves, title, leafCount, 'back', backWidth, foldScale), backWidth, copy.captions.back)}${figureHtml(nestSvg(leafCount, 46), 46, copy.captions.nest)}</div></section>
<footer class="foot"><span>Storytime Advantage</span><span>1 / 2</span></footer>
</section>`;
    const sheet2 = `<section class="sheet" data-sheet="2">
${stepOpen(staple, 2)}<div class="step-grid" style="grid-template-columns: 76mm 1fr;"><div>${staple.lines.map((line) => lineHtml(line)).join('')}${staple.notes.map((line) => lineHtml(line, 'line note')).join('')}</div>${figureHtml(stapleSvg(g, cover, 100), 100)}</div></section>
<section class="finished" data-finished>${headingHtml(CHECK_MARK, copy.finished.title)}${copy.finished.lines.map((line) => lineHtml(line)).join('')}<div class="fig-row">${figureHtml(closedSvg(g, cover, 86), 86, copy.captions.closed)}${figureHtml(backSvg(g, backCover, 48), 48, copy.captions.backCover)}${figureHtml(middleSvg(g, middle, 38), 38, copy.captions.middle)}</div></section>
<footer class="foot"><span>Storytime Advantage</span><span>2 / 2</span></footer>
</section>`;
    return {
        html: `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>Storytime Advantage: ${esc(HOWTO_TITLE.en)}</title>
<style>
${howtoCss()}
</style>
</head>
<body>
${sheet1}
${sheet2}
</body>
</html>`,
    };
}
