/**
 * Print icons (track print_ready_pdf_20261002). They replace emoji: Chrome writes a color emoji
 * as a bitmap with a soft mask, which is transparency, and Ghostscript then renders the whole
 * page as one image for PDF/X-1a. These are line drawings (stroke only, no opacity).
 *
 * Lucide icons, lucide-static v1.49.0 (https://lucide.dev). ISC License:
 * Copyright (c) 2026 Lucide Icons and Contributors
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or
 * without fee is hereby granted, provided that the above copyright notice and this permission
 * notice appear in all copies.
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS
 * SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
 * AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
 * NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 * Some Lucide icons derive from Feather (MIT, Copyright (c) 2013-2023 Cole Bemis).
 */

/** The inner SVG elements of each icon (24 × 24 grid). */
const PATHS = {
    /** U+23F1 stopwatch: section time (Lucide timer) */
    timer: '<line x1="10" x2="14" y1="2" y2="2"/> <line x1="12" x2="15" y1="14" y2="11"/> <circle cx="12" cy="14" r="8"/>',
    /** U+2606 rating star; U+2B50 marking star (filled) (Lucide star) */
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    /** U+1F914 thinking face (Lucide message-circle-question) */
    think: '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/> <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/> <path d="M12 17h.01"/>',
    /** U+1F4A1 light bulb (Lucide lightbulb) */
    lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/> <path d="M9 18h6"/> <path d="M10 22h4"/>',
    /** U+1F524 Latin letters (Lucide case-sensitive) */
    letters: '<path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16"/> <path d="M22 9v7"/> <path d="M3.304 13h6.392"/> <circle cx="18.5" cy="12.5" r="3.5"/>',
    /** U+1F4F1 mobile phone (Lucide smartphone) */
    phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/> <path d="M12 18h.01"/>',
    /** U+1F4AC speech balloon (Lucide message-circle) */
    talk: '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',
    /** U+1F9E9 puzzle piece (Lucide puzzle) */
    puzzle: '<path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>',
    /** U+270D writing hand (Lucide pen-line) */
    pen: '<path d="M13 21h8"/> <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
    /** U+1F4DD memo (Lucide notebook-pen) */
    plan: '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/> <path d="M2 6h4"/> <path d="M2 10h4"/> <path d="M2 14h4"/> <path d="M2 18h4"/> <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
    /** U+1F310 globe (Lucide globe) */
    globe: '<circle cx="12" cy="12" r="10"/> <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/> <path d="M2 12h20"/>',
    /** U+1F331 seedling (Lucide sprout) */
    sprout: '<path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/> <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/> <path d="M5 21h14"/>',
    /** U+1F33F herb (Lucide leaf) */
    leaf: '<path d="M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20"/> <path d="M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13"/>',
    /** U+1F333 tree (Lucide tree-deciduous) */
    tree: '<path d="M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z"/> <path d="M12 19v3"/>',
} as const;

export type IconName = keyof typeof PATHS;

export const ICON_NAMES = Object.keys(PATHS) as IconName[];

/**
 * One inline SVG icon, 1em high, in the text color.
 * @param name The icon.
 * @param opts `filled` fills the shape with the text color (the marking star).
 * @returns The SVG markup.
 */
export function icon(name: IconName, opts: { filled?: boolean } = {}): string {
    const fill = opts.filled ? 'currentColor' : 'none';
    return `<svg class="icon icon-${name}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;
}
