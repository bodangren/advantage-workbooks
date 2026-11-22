import type { WorkbookLook } from './document-wrapper/types';
import type { ProjectMetadata } from './filesystem';

export type { WorkbookLook } from './document-wrapper/types';

/** Every print look (track primary_v2_look_20261020). */
export const WORKBOOK_LOOKS: readonly WorkbookLook[] = ['classic', 'chibi-quest'];

/**
 * The book folders (content/primary/<book>) that print in the Chibi Quest look of the v2 app
 * (Daniel, 2026-10-20: Quest 5 to Adventure 9.3). Every other book prints in `classic`.
 */
export const CHIBI_QUEST_BOOKS: readonly string[] = [
    'quest-5', 'quest-6.1', 'quest-6.2',
    'adventure-7.1', 'adventure-7.2', 'adventure-8.1', 'adventure-8.2', 'adventure-8.3',
    'adventure-9.1', 'adventure-9.2', 'adventure-9.3',
];

/**
 * Reads a look value, for example from project.json or a command line.
 * @param value The value; `undefined` or `null` means `classic`.
 * @param where The source of the value, for the error message.
 * @returns The look.
 * @throws When the value is not a known look.
 */
export function parseLook(value: unknown, where: string): WorkbookLook {
    if (value === undefined || value === null) return 'classic';
    if (WORKBOOK_LOOKS.includes(value as WorkbookLook)) return value as WorkbookLook;
    throw new Error(`${where}: unknown look "${String(value)}" (${WORKBOOK_LOOKS.join(' or ')})`);
}

/**
 * The look of a book folder.
 * @param book A book folder name, for example `quest-5` or `origins-3.2`.
 * @returns `chibi-quest` for Quest 5 to Adventure 9.3, else `classic`.
 */
export function bookLook(book: string): WorkbookLook {
    return CHIBI_QUEST_BOOKS.includes(book) ? 'chibi-quest' : 'classic';
}

/**
 * Whether a value can hold project metadata. A damaged project.json that holds a string, a
 * number, or an array is not metadata, and it fails safe to the classic look.
 */
function isMetadataObject(value: unknown): value is ProjectMetadata {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The look of a dashboard project: the `look` of its project.json, or `chibi-quest` when the
 * project is a new or rewritten Primary Advantage edition with no look. A Reading Advantage
 * project, a project with no type, and a shipped edition that states `classic` keep `classic`
 * (track primary_v2_look_20261020, Daniel 2026-11-21).
 * @param meta The project.json values, or null when the project has none.
 * @returns `classic` for null or for a value that is not an object, else the project's look.
 * @throws When project.json has an unknown look.
 */
export function projectLook(meta: ProjectMetadata | null | undefined): WorkbookLook {
    if (!isMetadataObject(meta)) return 'classic';
    if (meta.look === undefined) return meta.type === 'primary' ? 'chibi-quest' : 'classic';
    const book = `${meta.seriesName ?? ''}-${meta.levelNumber ?? ''}`.toLowerCase();
    return parseLook(meta.look, `project.json of ${book}`);
}
