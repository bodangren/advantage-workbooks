import fs from 'fs';
import path from 'path';
import type { z } from 'zod';
import { LessonPackageSchema, LegacyLocalesSchema, TargetIdsSchema, APPROVAL_PARTS, type ApprovalPart, type LegacyLocales, type LessonPackage } from './schema';
import { checkPackage, schemaFailure, type PackageCheckContext, type PackageReport } from './checks';
import { loadPackageFolder } from './files';
import { renderImage } from '../media/render';
import type { Overlay } from '../media/images';

/** Read and write lesson packages for the review page (track review_page_20261001). Server only. */

export class StoreError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
    }
}

type ContextFor = PackageCheckContext | ((pkg: LessonPackage) => PackageCheckContext);

const ID = /^[a-z0-9][a-z0-9.-]*$/;

/** Package keys that belong to each approval part; a change to them resets that part. */
const PART_KEYS: Record<Exclude<ApprovalPart, 'lesson'>, (keyof LessonPackage)[]> = {
    text: ['meta', 'text'],
    thai: ['thai', 'glossary'],
    bank: ['bank', 'print', 'activities', 'tags', 'glossary'],
    images: ['images'],
    audio: ['audio'],
};

/** Checks that must not fail before a part can be approved. */
const PART_CHECKS: Record<Exclude<ApprovalPart, 'lesson'>, string[]> = {
    text: ['schema', 'text'],
    thai: ['thai', 'glossary'],
    bank: ['bank-size', 'mcq-answer', 'mcq-evidence', 'bank-unique', 'print-set', 'activities', 'tags'],
    images: ['images'],
    audio: [],
};

const contextFor = (ctx: ContextFor, pkg: LessonPackage) => (typeof ctx === 'function' ? ctx(pkg) : ctx);

const countChecks = (report: PackageReport) => ({
    fail: report.checks.filter((c) => c.status === 'fail').length,
    warn: report.checks.filter((c) => c.status === 'warn').length,
});

/**
 * The file path of one package, refusing ids that could leave the content folder.
 * @param root The content root (`content/primary`).
 * @param book Book id, for example `origins-3.2`.
 * @param lesson Lesson file id, for example `p05`.
 * @returns The absolute path of `<root>/<book>/<lesson>.json`.
 */
export function packagePath(root: string, book: string, lesson: string): string {
    if (!ID.test(book) || !ID.test(lesson) || book.includes('..') || lesson.includes('..')) {
        throw new StoreError(400, `Invalid book or lesson id: ${book}/${lesson}`);
    }
    const file = path.resolve(root, book, `${lesson}.json`);
    if (!file.startsWith(path.resolve(root) + path.sep)) throw new StoreError(400, 'Path outside the content folder');
    return file;
}

/**
 * Every book folder and its lessons, with titles, approval states, and (with a context) the FAIL
 * and WARN counts.
 * @param root The content root.
 * @param ctx The check context, or a function that makes it; without it there are no counts.
 * @returns Books in name order; lessons in lesson-number order.
 */
/**
 * Approves every lesson of a book that is ready (track level_banks_20261002): no FAIL, all
 * pictures and the audio made. Each part goes through `approvePart`, so its checks apply; a lesson
 * with a refused part stays as it is (its earlier parts keep their new approval).
 * @param root The content root.
 * @param book The book folder.
 * @param ctx The check context.
 * @param date The approval date.
 * @returns The approved lessons and the skipped lessons with the reason.
 */
export function approveBook(root: string, book: string, ctx: ContextFor, date: string): { approved: string[]; skipped: { lesson: string; reason: string }[] } {
    if (!ID.test(book)) throw new StoreError(400, `Bad book name: ${book}`);
    const approved: string[] = [];
    const skipped: { lesson: string; reason: string }[] = [];
    for (const f of loadPackageFolder(path.join(root, book))) {
        const lesson = path.basename(f.file, '.json');
        if (!f.pkg) {
            skipped.push({ lesson, reason: 'does not parse' });
            continue;
        }
        if (f.pkg.approval.lesson.status === 'approved') continue;
        try {
            for (const part of APPROVAL_PARTS) {
                if (f.pkg.approval[part].status !== 'approved') approvePart(root, book, lesson, part, ctx, date);
            }
            approved.push(lesson);
        } catch (e) {
            skipped.push({ lesson, reason: (e as Error).message });
        }
    }
    return { approved, skipped };
}

export function listBooks(root: string, ctx?: ContextFor) {
    if (!fs.existsSync(root)) return [];
    return fs
        .readdirSync(root, { withFileTypes: true })
        .filter((d) => d.isDirectory() && ID.test(d.name))
        .map((d) => d.name)
        .sort()
        .map((book) => ({
            book,
            lessons: loadPackageFolder(path.join(root, book)).map((f) => ({
                lesson: path.basename(f.file, '.json'),
                title: f.pkg?.meta.title,
                number: f.pkg?.meta.number,
                code: f.pkg?.meta.lesson,
                approval: f.pkg?.approval,
                error: f.error,
                ...(ctx && f.pkg ? countChecks(checkPackage(f.pkg, contextFor(ctx, f.pkg))) : {}),
            })),
        }));
}

/**
 * Reads one package as stored (not parsed).
 * @param root The content root.
 * @param book Book id.
 * @param lesson Lesson file id.
 * @returns The JSON value; throws StoreError 404 when the file does not exist.
 */
export function readPackageFile(root: string, book: string, lesson: string): unknown {
    const file = packagePath(root, book, lesson);
    if (!fs.existsSync(file)) throw new StoreError(404, `No package ${book}/${lesson}`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const write = (file: string, pkg: LessonPackage) => fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Saves an edited package. The database ids and the old translations always come from the file on
 * disk (only the injector and the fetch script change them). A part that changes loses its approval,
 * and any change resets the lesson approval.
 * @param root The content root.
 * @param book Book id.
 * @param lesson Lesson file id.
 * @param input The edited package from the page.
 * @param ctx The check context, or a function that makes it for the package.
 * @returns Whether it was saved, the saved package, and the check report.
 */
export function savePackage(root: string, book: string, lesson: string, input: unknown, ctx: ContextFor): { saved: boolean; pkg?: LessonPackage; report: PackageReport } {
    const file = packagePath(root, book, lesson);
    const parsed = LessonPackageSchema.safeParse(input);
    if (!parsed.success) {
        return { saved: false, report: schemaFailure(parsed.error.issues) };
    }
    const next = parsed.data;
    const before = fs.existsSync(file) ? LessonPackageSchema.safeParse(JSON.parse(fs.readFileSync(file, 'utf8'))) : undefined;
    if (before?.success) {
        const old = before.data;
        next.db = old.db;
        next.locales = old.locales;
        let changed = false;
        for (const part of Object.keys(PART_KEYS) as (keyof typeof PART_KEYS)[]) {
            const differs = PART_KEYS[part].some((k) => !same(old[k], next[k]));
            if (differs) {
                changed = true;
                next.approval[part] = { status: 'draft' };
            }
        }
        if (changed) next.approval.lesson = { status: 'draft' };
    } else {
        next.db = {};
        next.locales = undefined;
    }
    write(file, next);
    return { saved: true, pkg: next, report: checkPackage(next, contextFor(ctx, next)) };
}

/**
 * Approves one part (or the whole lesson) with a date.
 * @param root The content root.
 * @param book Book id.
 * @param lesson Lesson file id.
 * @param part The part to approve.
 * @param ctx The check context, or a function that makes it for the package.
 * @param date The approval date (YYYY-MM-DD).
 * @returns The saved package. Throws StoreError 409 when a check for the part fails, or (for the
 * lesson) when a part is not approved or any check fails.
 */
export function approvePart(root: string, book: string, lesson: string, part: ApprovalPart, ctx: ContextFor, date: string): LessonPackage {
    const raw = readPackageFile(root, book, lesson);
    const parsed = LessonPackageSchema.safeParse(raw);
    if (!parsed.success) throw new StoreError(400, 'The package does not parse; fix it before approval');
    const pkg = parsed.data;
    const report = checkPackage(pkg, contextFor(ctx, pkg));
    if (part === 'lesson') {
        const open = APPROVAL_PARTS.filter((p) => p !== 'lesson' && pkg.approval[p].status !== 'approved');
        if (open.length) throw new StoreError(409, `Parts not approved: ${open.join(', ')}`);
        const failing = report.checks.filter((c) => c.status === 'fail').map((c) => c.id);
        if (failing.length) throw new StoreError(409, `Checks fail: ${failing.join(', ')}`);
    } else {
        const failing = report.checks.filter((c) => c.status === 'fail' && PART_CHECKS[part].includes(c.id)).map((c) => c.id);
        if (failing.length) throw new StoreError(409, `${part}: checks fail: ${failing.join(', ')}`);
        const exists = (rel?: string) => !!rel && fs.existsSync(path.resolve(root, rel));
        if (part === 'images') {
            const none = pkg.images.filter((img) => !exists(img.file)).map((img) => img.position);
            if (none.length) throw new StoreError(409, `images: no picture for ${none.join(', ')}`);
        }
        if (part === 'audio' && (!exists(pkg.audio.article) || pkg.audio.sentences.length === 0)) {
            throw new StoreError(409, 'audio: no article audio with sentence times');
        }
    }
    pkg.approval[part] = { status: 'approved', date };
    write(packagePath(root, book, lesson), pkg);
    return pkg;
}

/**
 * The raw (no signs) copy of a final picture. Rule: a picture with signs always has a raw copy next
 * to it; a picture without a raw copy has nothing drawn on it. So git holds one file per picture
 * unless it has signs.
 */
export const rawPicture = (file: string) => file.replace(/\.(jpe?g|png)$/i, '.raw.$1');

/** Draws the signs of one picture from its raw copy, or puts the raw picture back when it has none. */
async function drawSigns(root: string, file: string, overlays: Overlay[]): Promise<void> {
    const final = path.resolve(root, file);
    const raw = path.resolve(root, rawPicture(file));
    if (overlays.length) {
        if (!fs.existsSync(raw)) fs.copyFileSync(final, raw);
        await renderImage(raw, final, overlays);
    } else if (fs.existsSync(raw)) {
        fs.copyFileSync(raw, final);
        fs.rmSync(raw);
    }
}

/**
 * Makes a candidate the picture for one image position: copies it to
 * `<book>/media/<lesson>/<position>.jpg`, draws the signs, and saves the package (the images part
 * goes back to draft).
 * @param root The content root.
 * @param book Book id.
 * @param lesson Lesson file id.
 * @param position The image position, for example `hero`.
 * @param candidate One of the image's candidates (relative to the content root).
 * @param ctx The check context, or a function that makes it for the package.
 * @returns The save result.
 */
export async function chooseImage(root: string, book: string, lesson: string, position: string, candidate: string, ctx: ContextFor) {
    const parsed = LessonPackageSchema.safeParse(readPackageFile(root, book, lesson));
    if (!parsed.success) throw new StoreError(400, 'The package does not parse');
    const pkg = parsed.data;
    const image = pkg.images.find((img) => img.position === position);
    if (!image) throw new StoreError(404, `No image at ${position}`);
    if (!image.candidates.includes(candidate)) throw new StoreError(400, `${candidate} is not a candidate for ${position}`);
    const file = `${book}/media/${lesson}/${position}.jpg`;
    fs.mkdirSync(path.join(root, book, 'media', lesson), { recursive: true });
    fs.rmSync(path.resolve(root, rawPicture(file)), { force: true });
    fs.copyFileSync(path.resolve(root, candidate), path.resolve(root, file));
    await drawSigns(root, file, image.overlay);
    image.file = file;
    image.chosenFrom = candidate;
    return savePackage(root, book, lesson, pkg, ctx);
}

/**
 * Draws the signs again on every picture (after an overlay edit).
 * @param root The content root.
 * @param pkg A parsed package.
 */
export async function renderPictures(root: string, pkg: LessonPackage): Promise<void> {
    for (const image of pkg.images) {
        if (image.file && fs.existsSync(path.resolve(root, image.file))) await drawSigns(root, image.file, image.overlay);
    }
}

/**
 * Writes the database ids of an injection into the package (only the injector calls this). The
 * approvals do not change.
 * @param root The content root.
 * @param book Book id.
 * @param lesson Lesson file id.
 * @param target `legacy` or `new`.
 * @param ids The article id, the question id maps, the content hash, and the time.
 * @returns The saved package.
 */
export function recordInjection(root: string, book: string, lesson: string, target: 'legacy' | 'new', ids: z.input<typeof TargetIdsSchema>): LessonPackage {
    const parsed = LessonPackageSchema.safeParse(readPackageFile(root, book, lesson));
    if (!parsed.success) throw new StoreError(400, 'The package does not parse');
    const pkg = parsed.data;
    pkg.db[target] = TargetIdsSchema.parse(ids);
    write(packagePath(root, book, lesson), pkg);
    return pkg;
}

/**
 * Writes a printed lesson's old cn, tw, and vi into the package (only
 * `scripts/fetch-legacy-locales.ts` calls this). The approvals do not change.
 * @param root The content root.
 * @param book Book id.
 * @param lesson Lesson file id.
 * @param locales The values from `legacyLocalesFrom`.
 * @returns The saved package.
 */
export function recordLocales(root: string, book: string, lesson: string, locales: LegacyLocales): LessonPackage {
    const parsed = LessonPackageSchema.safeParse(readPackageFile(root, book, lesson));
    if (!parsed.success) throw new StoreError(400, 'The package does not parse');
    const pkg = parsed.data;
    pkg.locales = LegacyLocalesSchema.parse(locales);
    write(packagePath(root, book, lesson), pkg);
    return pkg;
}
