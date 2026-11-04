import type { StorytimeIcon } from './step-map';

/**
 * The line icons of the student book (A-48, B section 5.2): black on white, drawn as strokes on a
 * 24 x 24 grid, with no color, no transparency, and no gradient (PRINT_GATE). The same SVG serves
 * the step head, a row start, and the icon key of page 1; the CSS class sets the printed size.
 */
const ICON_PATHS: Record<StorytimeIcon, string> = {
    // ear: the outer rim and the inner fold
    ear: '<path d="M9.5 19.5 C7 18.5 6 15.5 6 12 C6 7.5 8.5 4.5 12 4.5 C15.5 4.5 18 7 18 10.5 C18 13.5 15.5 14.5 14.5 16.5 C13.6 18.3 12.5 20 10.8 20 C10.3 20 9.9 19.8 9.5 19.5 Z"/><path d="M9.5 11 C9.5 9.2 10.6 8 12 8 C13.4 8 14.5 9.1 14.5 10.5 C14.5 12 13 12.4 12.4 13.6"/>',
    // mouth: open lips and the line between them
    mouth: '<path d="M3.5 12 C6 8 9 8.2 12 9.8 C15 8.2 18 8 20.5 12 C18 16.8 15 17.8 12 17.8 C9 17.8 6 16.8 3.5 12 Z"/><path d="M3.5 12 C8 13.4 16 13.4 20.5 12"/>',
    // read: an eye above a line of text, and a finger that points at the line
    read: '<path d="M3 8 C5.5 4.2 9 3 12 3 C15 3 18.5 4.2 21 8 C18.5 11.8 15 13 12 13 C9 13 5.5 11.8 3 8 Z"/><circle cx="12" cy="8" r="2.2" fill="#000"/><path d="M4 18.5 H20"/><path d="M12.6 22.5 V17.2 C12.6 15.9 14.8 15.9 14.8 17.2 V22.5"/>',
    // pencil: a tilted pencil with its tip at the lower left
    pencil: '<path d="M4 20.5 L5.2 15.6 L16.2 4.6 C17 3.8 18.3 3.8 19.1 4.6 L19.9 5.4 C20.7 6.2 20.7 7.5 19.9 8.3 L8.9 19.3 Z"/><path d="M14.4 6.4 L18.1 10.1"/><path d="M5.2 15.6 L8.9 19.3"/>',
    // circle: a hand-drawn loop that overlaps at its end
    circle: '<path d="M12 4 C17.5 3.5 21 7.5 20 12 C19 17 14.5 20 9.5 19 C5 18 3 13.5 4.5 9.5 C6 5.5 10 4 13 4.5"/>',
    // book: an open book
    book: '<path d="M12 6.5 C9.5 4.8 6.5 4.5 3.5 5 V18.5 C6.5 18 9.5 18.3 12 20 C14.5 18.3 17.5 18 20.5 18.5 V5 C17.5 4.5 14.5 4.8 12 6.5 Z"/><path d="M12 6.5 V20"/>',
    // star: five points
    star: '<path d="M12 3.5 L14.6 9 L20.5 9.7 L16.1 13.8 L17.3 19.7 L12 16.8 L6.7 19.7 L7.9 13.8 L3.5 9.7 L9.4 9 Z"/>',
};

/**
 * The SVG of one icon.
 * @param name The icon name of the step map.
 * @param className The CSS class that sets the printed size.
 * @param part The `data-part` hook of the SVG.
 * @returns The SVG markup.
 */
export function iconSvg(name: StorytimeIcon | string, className = 'step-icon', part = 'step-icon'): string {
    const paths = ICON_PATHS[name as StorytimeIcon];
    if (!paths) throw new Error(`no icon named "${name}"`);
    return `<svg class="${className}" data-part="${part}" data-icon="${name}" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
}

/**
 * One icon as a stand-alone SVG file (the step map folder for the app): the same strokes, black on a transparent ground.
 * @param name The icon name.
 * @returns The file text, ending with a line feed.
 */
export function iconSvgFile(name: StorytimeIcon): string {
    const paths = ICON_PATHS[name];
    if (!paths) throw new Error(`no icon named "${name}"`);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>\n`;
}
