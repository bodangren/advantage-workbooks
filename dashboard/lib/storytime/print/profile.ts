/**
 * The one place that holds the print geometry (spec P2 defaults, 2026-10-25; Daniel checks them).
 * Every student-book page, perforation, and reader page reads its millimeters from this constant,
 * so the same week renders at another trim by changing one field (strategy 4.13, mutant M42).
 */
export interface StorytimePrintProfile {
    /** The trim of a physical side, in millimeters. The default is A4 portrait. */
    trim: { widthMm: number; heightMm: number };
    /** Bleed in millimeters; the picture frames sit on white pages, so the default is none. */
    bleedMm: number;
    /** The distance of the perforation from the spine, in millimeters (P2: 12 mm). */
    perforationMm: number;
    /** Pages per binding multiple for perfect binding (spec P2; PM default 2026-11-04). */
    bindingPageMultiple: number;
    /** The trim of one reader page (P15 default: 148.5 × 198 mm). */
    readerPage: { widthMm: number; heightMm: number };
}

/**
 * The print profile of the unit 1 student workbook (spec P2 and P15 defaults, 2026-10-25):
 * A4 portrait, no bleed, every tear-out leaf perforated 12 mm from the spine, and reader
 * pages of 148.5 × 198 mm, so that two turned pages fill each A4 leaf side. The printer confirms
 * the perfect-binding page multiple on the print order sheet; the default is four pages.
 */
export const STORYTIME_PRINT_PROFILE: StorytimePrintProfile = {
    trim: { widthMm: 210, heightMm: 297 },
    bleedMm: 0,
    perforationMm: 12,
    bindingPageMultiple: 4,
    readerPage: { widthMm: 148.5, heightMm: 198 },
};
