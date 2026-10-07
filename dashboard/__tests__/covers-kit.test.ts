import { describe, it, expect } from 'vitest';
import { KIT_LAYERS, findArt, findBadge, pagePictures, pageSize, parseSvg, parseTransform, stripLayer, swapBadge } from '../lib/covers/kit';

// Track book_covers_20261007: a small page in the structure of Daniel's Canva export (white page
// fill, art, a masked picture, a badge, a masked vector group, one text run).
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const img = (w: number, h: number) => `<image x="0" y="0" width="${w}" xlink:href="${PNG}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
const PAGE = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="794" viewBox="0 0 595.5 807.749976" height="1077">
<defs><mask id="m1"><g transform="matrix(0.5, 0, 0, 0.5, 12, 0)">${img(1055, 1491)}</g></mask><mask id="m2"><rect x="0" y="0" width="10" height="10" fill-opacity="0.85"/></mask></defs>
<g clip-path="url(#c)"><path fill="#ffffff" d="M 0 0.214844 L 595 0.214844 L 595 807.285156 L 0 807.285156 Z" fill-opacity="1"/>
<g transform="matrix(1, 0, 0, 1, -0, 0)">
<g><g transform="matrix(0.56443, 0, 0, 0.564453, 0, -17.265753)">${img(1054, 1492)}</g></g>
<g mask="url(#m1)"><g transform="matrix(0.5, 0, 0, 0.5, 12, 0)">${img(1055, 1491)}</g></g>
<g mask="url(#m2)"><g transform="matrix(1, 0, 0, 1, 82, 657)"><path fill="#b57739" d="M 1 1 L 400 1 L 400 100 Z"/></g></g>
<g transform="matrix(0.201229, 0, 0, 0.201229, 418.374231, 4.395521)">${img(700, 700)}</g>
<g fill="#000000" fill-opacity="1"><g transform="translate(12.45, 14.54)"><g><path d="M 1 1 L 2 2 Z"/></g></g><g transform="translate(20, 14.54)"><g/></g></g>
</g></g></svg>`;

describe('cover kit', () => {
    it('reads matrix and translate transforms', () => {
        expect(parseTransform('matrix(2, 0, 0, 3, 10, 20) translate(1, 2)')).toEqual([2, 0, 0, 3, 12, 26]);
        expect(() => parseTransform('rotate(45)')).toThrow('Unsupported transform');
    });

    it('finds the page pictures with their place in points, not the mask pictures', () => {
        const doc = parseSvg(PAGE);
        expect(pageSize(doc)).toEqual({ width: 595.5, height: 807.749976 });
        const pics = pagePictures(doc);
        expect(pics).toHaveLength(3);
        expect(pics[0].box.width).toBeCloseTo(594.91, 1);
        expect(pics[0].box.y).toBeCloseTo(-17.27, 2);
        expect(pics.map((p) => p.masked)).toEqual([false, true, false]);
        expect(pics[2].box.x).toBeCloseTo(418.37, 2);
    });

    it('finds the art and the badge', () => {
        const doc = parseSvg(PAGE);
        const page = pageSize(doc);
        const pics = pagePictures(doc);
        expect(findArt(pics, page)).toBe(pics[0]);
        expect(findBadge(pics, page)).toBe(pics[2]);
        expect(() => findArt(pics.slice(1), page)).toThrow('Expected one full-width art picture, found 0');
    });

    it('keeps only the layer pictures and removes the text and the white page fill', () => {
        const overlay = stripLayer(PAGE, KIT_LAYERS.backOverlay, { vectors: true });
        expect(overlay.match(/<image /g)).toHaveLength(2); // the masked picture and its mask picture in <defs>
        expect(overlay).not.toContain('418.374231, 4.395521)"><image'); // the badge
        expect(overlay).not.toContain('translate(12.45');
        expect(overlay).not.toContain('fill="#ffffff"');
        expect(overlay).toContain('#b57739'); // the wooden sign stays
    });

    it('removes the vector drawings from the badge layer', () => {
        const badge = stripLayer(PAGE, KIT_LAYERS.badge, { vectors: false });
        expect(badge).toContain('418.374231, 4.395521)"><image');
        expect(badge).not.toContain('#b57739');
        expect(pagePictures(parseSvg(badge))).toHaveLength(1);
    });

    it('puts the badge picture of another back in the place of the page badge', () => {
        const other = PAGE.replace('418.374231, 4.395521)">' + img(700, 700), '419.985965, 4.571461)">' + img(800, 800).replace(PNG, 'data:image/png;base64,QTI='));
        const swapped = swapBadge(PAGE, other);
        const doc = parseSvg(swapped);
        const badge = findBadge(pagePictures(doc), pageSize(doc));
        expect(badge.box.x).toBeCloseTo(418.37, 2);
        expect(badge.element.getAttribute('xlink:href')).toBe('data:image/png;base64,QTI=');
        expect(swapped.match(/base64,QTI=/g)).toHaveLength(1);
        expect(() => swapBadge(PAGE, PAGE.replace(img(700, 700), ''))).toThrow('found 0');
    });
});
