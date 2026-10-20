import type { WorkbookLesson } from '../workbook-schema';
import type { TeacherManualOptions, TeacherManualPaper } from './types';
import type { SupportedLanguage } from './i18n';
import { brandName, getThemeColors } from '../document-wrapper/utils';
import { generateFrontMatter } from './front-matter';
import { generateEndMatter } from './end-matter';
import { buildLessonPlan, renderLessonPlan } from './lesson-plan';
import { wrapTeacherManualDocument } from './document-wrapper';
import { bookLessonNote } from './app-section';

export interface CompileTeacherManualResult {
  html: string;
  lessonCount: number;
}

/**
 * Compiles the teacher's manual of a book: front matter, the 4-period plan of each lesson, and end matter.
 * @param lessons The lessons in book order.
 * @param seriesName The series name for the title page, for example "Origins" (the route passes "Origins 3.1").
 * @param seriesLevel The level, for example "3.1".
 * @param cefrLevel The CEFR level of the book.
 * @param type The product line.
 * @param lang The manual language.
 * @param paper `book` (the 210 x 285 mm book page, the default) or `a4` (the office print).
 * @returns The HTML document and the lesson count.
 */
export function compileTeacherManual(
  lessons: WorkbookLesson[],
  seriesName: string,
  seriesLevel: string,
  cefrLevel: string,
  type: 'primary' | 'secondary' = 'primary',
  lang: SupportedLanguage = 'en',
  paper: TeacherManualPaper = 'book'
): CompileTeacherManualResult {
  const theme = getThemeColors(seriesName, type);
  const options: TeacherManualOptions = {
    seriesName,
    seriesLevel,
    cefrLevel,
    type,
    theme,
    lang,
    paper,
  };

  const frontMatterHtml = generateFrontMatter(
    { productName: brandName(type), seriesName, seriesLevel, cefrLevel },
    theme,
    lang
  );

  const lessonPlansHtml = lessons.map((lesson, index) => {
    const plan = buildLessonPlan(lesson, index, cefrLevel, lang);
    return renderLessonPlan(plan, theme, lang, bookLessonNote({ seriesName, seriesLevel }, index + 1, lang));
  }).join('\n');

  const endMatterHtml = generateEndMatter(
    { seriesName, seriesLevel },
    theme,
    lang
  );

  const fullHtml = wrapTeacherManualDocument(
    frontMatterHtml,
    lessonPlansHtml,
    endMatterHtml,
    options
  );

  return {
    html: fullHtml,
    lessonCount: lessons.length,
  };
}
