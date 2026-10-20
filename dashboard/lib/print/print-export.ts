import { renderMultipleLessons } from '../template-renderer';
import { wrapSingleLessonDocument } from '../workbook-document-wrapper';
import { answerKeyEntry } from '../document-wrapper/sections/answer-key';
import type { LessonPackage } from '../lesson-package/schema';
import type { WorkbookLesson } from '../workbook-schema';
import type { WorkbookLook } from '../document-wrapper/types';

/**
 * Print data for the monorepo print kit (track primary_parity_print_lesson_20261011, 2026-10-12):
 * one file for each lesson of the printed books, with public bucket pictures, so the new app can
 * print a lesson with a copy of the primary template. scripts/print/export-print-data.ts writes them.
 */

/** The public bucket folder of the app pictures; the injector uploads `images/<articleId>_<n>.png`. */
export const BUCKET_IMAGES = 'https://storage.googleapis.com/primary-app-storage/images/';

/** A dashboard file route (also HTML-escaped) or a file:// URL under content/primary; group 1 is the content path. */
const LOCAL_PICTURE = /^(?:\/api\/files\?root(?:=|&#x3D;)content(?:&amp;|&)path(?:=|&#x3D;)|file:\/\/.*\/content\/primary\/)(.+)$/;

export interface PrintExport {
    seriesName: string;
    seriesLevel: string;
    lessonNumber: number;
    packageKey: string;
    lesson: WorkbookLesson;
}

/**
 * Points the lesson's local pictures at the bucket objects that the injector uploaded. The object
 * number is the picture's place in `pkg.images` (`bucketObjects` in lib/inject/legacy.ts), and the
 * bucket PNG is a lossless copy of the local file. A bucket picture stays as it is.
 * @param lesson The lesson as the print renders it.
 * @param pkg The lesson's package.
 * @returns A copy of the lesson with bucket picture URLs.
 * @throws When a local picture is not in the package, or the package names no app article.
 */
export function bucketPictures(lesson: WorkbookLesson, pkg: LessonPackage): WorkbookLesson {
    const articleId = pkg.db?.legacy?.articleId ?? pkg.meta.printed?.articleId;
    const article_images = lesson.article_images?.map((img) => {
        const local = LOCAL_PICTURE.exec(img.url)?.[1];
        if (local === undefined) return img;
        if (!articleId) throw new Error(`${pkg.meta.key}: no app article for the bucket pictures`);
        const index = pkg.images.findIndex((p) => p.file === decodeURIComponent(local));
        if (index < 0) throw new Error(`${pkg.meta.key}: picture ${local} is not in the package`);
        return { ...img, url: `${BUCKET_IMAGES}${articleId}_${index + 1}.png` };
    });
    return { ...lesson, article_images };
}

/**
 * The export record of one lesson.
 * @param input The book name with its number, the CEFR level, the lesson's place in the book, the lesson, and its package.
 * @returns The record that goes into content/primary/<book>/print/<package file>.
 */
export function printExport(input: { name: string; level: string; number: number; lesson: WorkbookLesson; pkg: LessonPackage }): PrintExport {
    return {
        seriesName: input.name,
        seriesLevel: input.level,
        lessonNumber: input.number,
        packageKey: input.pkg.meta.key,
        lesson: bucketPictures(input.lesson, input.pkg),
    };
}

/**
 * The A4 print document of one lesson, the same as scripts/print/make-lesson-pdfs.ts renders.
 * @param lesson The lesson.
 * @param number The lesson's place in the book.
 * @param name The book name with its number.
 * @param level The CEFR level.
 * @param opts `answerKey: false` leaves out the answer key page; `look` is the book's print look (`classic` when absent).
 * @returns The HTML document (Paged.js from unpkg; fonts as data URLs).
 */
export async function lessonDocument(lesson: WorkbookLesson, number: number, name: string, level: string, opts: { answerKey?: boolean; look?: WorkbookLook } = {}): Promise<string> {
    const lessonHtml = await renderMultipleLessons([lesson], { type: 'primary', seriesName: name, seriesLevel: level, firstLessonNumber: number, look: opts.look });
    const key = opts.answerKey === false ? null : answerKeyEntry(lesson, number);
    return wrapSingleLessonDocument(lessonHtml, key, { seriesName: name, seriesLevel: level, seriesTagline: '', type: 'primary', look: opts.look });
}
