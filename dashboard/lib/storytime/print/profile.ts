/**
 * The one place that holds the print geometry (spec P2 defaults, 2026-10-25; Daniel checks them).
 * Every student-book page, perforation, and reader strip reads its millimeters from this constant,
 * so the same week renders at another trim by changing one field (strategy 4.13, mutant M42).
 */
export interface StorytimePrintProfile {
    /** The trim of a physical side, in millimeters. The default is A4 portrait. */
    trim: { widthMm: number; heightMm: number };
    /** Bleed in millimeters; the picture frames sit on white pages, so the default is none. */
    bleedMm: number;
    /** The distance of the perforation from the spine, in millimeters (P2: 12 mm). */
    perforationMm: number;
    /** The trim of one reader page inside a strip (P15 default: 99 × 140 mm). */
    readerPage: { widthMm: number; heightMm: number };
}

/**
 * The print profile of the unit 1 student workbook (spec P2 and P15 defaults, 2026-10-25):
 * A4 portrait, no bleed, every tear-out leaf perforated 12 mm from the spine, and reader
 * pages of 99 × 140 mm, so that two pages fill the 198 mm leaf that is left after the tear.
 */
export const STORYTIME_PRINT_PROFILE: StorytimePrintProfile = {
    trim: { widthMm: 210, heightMm: 297 },
    bleedMm: 0,
    perforationMm: 12,
    readerPage: { widthMm: 99, heightMm: 140 },
};
