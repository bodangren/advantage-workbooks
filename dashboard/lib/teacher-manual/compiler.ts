import type { WorkbookLesson } from '../workbook-schema';
import type { TeacherManualOptions } from './types';
import type { SupportedLanguage } from './i18n';
import { getThemeColors } from '../document-wrapper/utils';
import { generateFrontMatter } from './front-matter';
import { generateEndMatter } from './end-matter';
import { buildLessonPlan, renderLessonPlan } from './lesson-plan';
import { wrapTeacherManualDocument } from './document-wrapper';

export interface CompileTeacherManualResult {
  html: string;
  lessonCount: number;
}

export function compileTeacherManual(
  lessons: WorkbookLesson[],
  seriesName: string,
  seriesLevel: string,
  cefrLevel: string,
  type: 'primary' | 'secondary' = 'primary',
  lang: SupportedLanguage = 'en'
): CompileTeacherManualResult {
  const theme = getThemeColors(seriesName, type);
  const options: TeacherManualOptions = {
    seriesName,
    seriesLevel,
    cefrLevel,
    type,
    theme,
    lang,
  };

  const frontMatterHtml = generateFrontMatter(
    { seriesName, seriesLevel, cefrLevel },
    theme,
    lang
  );

  const lessonPlansHtml = lessons.map((lesson, index) => {
    const plan = buildLessonPlan(lesson, index, cefrLevel, lang);
    return renderLessonPlan(plan, theme, lang);
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
