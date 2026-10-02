import { describe, it, expect } from 'vitest';
import { JAPAN_COLOR_2001_COATED, checkPdfx, ghostscriptArgs, pageImages, parsePdffonts, parsePdfimages, parsePdfinfo, pdfxDefinition } from '../lib/print/pdfx';

const FONTS = `name                                 type              encoding         emb sub uni object ID
------------------------------------ ----------------- ---------------- --- --- --- ---------
AAAAAA+MerriweatherLight18pt-Regular Type 3            Custom           yes yes yes      4  0
DAAAAA+NotoSansThai-Regular          CID TrueType      Identity-H       yes yes yes      7  0
[none]                               Type 3            Custom           yes no  yes     34  0
OpenSans-Bold                        TrueType          WinAnsi          no  no  no      12  0
`;

const IMAGES = `page   num  type   width height color comp bpc  enc interp  object ID x-ppi y-ppi size ratio
--------------------------------------------------------------------------------------------
   1     0 image    2479  3367  cmyk    4   8  image  no        12  0   300   300  273K 0.8%
   2     1 image     800   600  rgb     3   8  jpeg   no        20  0   240   240   61K 4.3%
   2     2 smask      80    76  gray    1   8  image  no        21  0   144   144  2.1K 35%
`;

const INFO = `Title:           Primary Advantage Origins 3.2
Producer:        GPL Ghostscript 10.06.0
Pages:           29
Page size:       594.96 x 808.08 pts
MediaBox:            0.00     0.00   594.96   808.08
TrimBox:             0.00     0.00   594.96   808.08
PDF version:     1.3
`;

describe('print PDF/X-1a', () => {
    it('writes a PDF/X-1a definition with the Japan Color 2001 Coated output intent', () => {
        const ps = pdfxDefinition('/cache/JapanColor2001Coated.icc', 'Origins (3.2) \\ test ภาษา');
        expect(ps).toContain('/GTS_PDFXVersion (PDF/X-1a:2001)');
        expect(ps).toContain('/OutputConditionIdentifier (JC200103)');
        expect(ps).toContain('/OutputCondition (Japan Color 2001 Coated)');
        expect(ps).toContain('/RegistryName (http://www.color.org)');
        expect(ps).toContain('<< /N 4 >>');
        expect(ps).toContain('(/cache/JapanColor2001Coated.icc) (r) file');
        // PostScript string: escape ( ) \ and drop non-ASCII.
        expect(ps).toContain('/Title (Origins \\(3.2\\) \\\\ test )');
        expect(JAPAN_COLOR_2001_COATED.file).toBe('JapanColor2001Coated.icc');
    });

    it('builds the Ghostscript arguments, with text outlines only on request', () => {
        const base = { input: '/in/book.pdf', output: '/out/book-pdfx1a.pdf', definition: '/tmp/x/pdfx_def.ps', profile: '/cache/icc/JC.icc' };
        const args = ghostscriptArgs({ ...base, outline: false });
        expect(args).toEqual(expect.arrayContaining(['-dPDFX=1', '-sDEVICE=pdfwrite', '-sColorConversionStrategy=CMYK', '-sProcessColorModel=DeviceCMYK', '-sOutputICCProfile=/cache/icc/JC.icc', '-dPDFSETTINGS=/prepress', '--permit-file-read=/cache/icc/']));
        expect(args.slice(-4)).toEqual(['-o', '/out/book-pdfx1a.pdf', '/tmp/x/pdfx_def.ps', '/in/book.pdf']);
        expect(args).not.toContain('-dNoOutputFonts');
        expect(ghostscriptArgs({ ...base, outline: true })).toContain('-dNoOutputFonts');
    });

    it('reads pdffonts, pdfimages, and pdfinfo output', () => {
        expect(parsePdffonts(FONTS)).toEqual([
            { name: 'AAAAAA+MerriweatherLight18pt-Regular', type: 'Type 3', embedded: true },
            { name: 'DAAAAA+NotoSansThai-Regular', type: 'CID TrueType', embedded: true },
            { name: '[none]', type: 'Type 3', embedded: true },
            { name: 'OpenSans-Bold', type: 'TrueType', embedded: false },
        ]);
        expect(parsePdfimages(IMAGES)).toEqual([
            { page: 1, type: 'image', width: 2479, height: 3367, color: 'cmyk', xppi: 300, yppi: 300 },
            { page: 2, type: 'image', width: 800, height: 600, color: 'rgb', xppi: 240, yppi: 240 },
            { page: 2, type: 'smask', width: 80, height: 76, color: 'gray', xppi: 144, yppi: 144 },
        ]);
        expect(parsePdfinfo(INFO)).toEqual({ pages: 29, version: '1.3', width: 594.96, height: 808.08, trimBox: true });
    });

    it('finds the pages that are one page-size image', () => {
        const info = parsePdfinfo(INFO);
        expect(pageImages(parsePdfimages(IMAGES), info)).toEqual([1]);
    });

    it('passes a clean PDF/X-1a file', () => {
        const r = checkPdfx({
            info: parsePdfinfo(INFO),
            pdfxVersion: 'PDF/X-1a:2001',
            hasOutputIntent: true,
            fonts: [{ name: 'ABCDEF+Sarabun-Regular', type: 'CID TrueType', embedded: true }],
            images: [{ page: 2, type: 'image', width: 800, height: 600, color: 'cmyk', xppi: 300, yppi: 300 }],
        });
        expect(r.errors).toEqual([]);
    });

    it('reports every failed check, with page numbers', () => {
        const r = checkPdfx({
            info: { ...parsePdfinfo(INFO), version: '1.4', trimBox: false },
            pdfxVersion: undefined,
            hasOutputIntent: false,
            fonts: parsePdffonts(FONTS),
            images: parsePdfimages(IMAGES),
            sourcePageImages: [],
        });
        expect(r.errors.join('\n')).toMatch(/PDF version 1\.4/);
        expect(r.errors.join('\n')).toMatch(/no PDF\/X-1a marker/);
        expect(r.errors.join('\n')).toMatch(/no output intent/);
        expect(r.errors.join('\n')).toMatch(/no TrimBox/);
        expect(r.errors.join('\n')).toMatch(/2 Type 3 font\(s\).*MerriweatherLight18pt-Regular/);
        expect(r.errors.join('\n')).toMatch(/not embedded: OpenSans-Bold/);
        expect(r.errors.join('\n')).toMatch(/page\(s\) 1 became one image/);
        expect(r.errors.join('\n')).toMatch(/RGB image\(s\) on page\(s\) 2/);
        expect(r.errors.join('\n')).toMatch(/soft mask\(s\) on page\(s\) 2/);
    });

    it('does not count a page-size picture that the source PDF already had', () => {
        const r = checkPdfx({
            info: parsePdfinfo(INFO),
            pdfxVersion: 'PDF/X-1a:2001',
            hasOutputIntent: true,
            fonts: [],
            images: [{ page: 1, type: 'image', width: 2479, height: 3367, color: 'cmyk', xppi: 300, yppi: 300 }],
            sourcePageImages: [1],
        });
        expect(r.errors).toEqual([]);
    });
});
