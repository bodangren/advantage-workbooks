import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import type { WorkbookLesson } from './workbook-schema';

let cachedTemplate: HandlebarsTemplateDelegate | null = null;

async function getTemplate(): Promise<HandlebarsTemplateDelegate> {
  if (cachedTemplate) {
    return cachedTemplate;
  }

  const templatePath = path.join(process.cwd(), '../workbook_template.html');
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  cachedTemplate = Handlebars.compile(templateContent);
  return cachedTemplate;
}

export interface RenderOptions {
  seriesName?: string;
  seriesLevel?: string;
  seriesTagline?: string;
}

function prepareLessonData(
  lesson: WorkbookLesson,
  index: number,
  options: RenderOptions = {}
): WorkbookLesson & {
  lesson_number: string;
  series_name?: string;
  series_level?: string;
  series_tagline?: string;
} {
  const {
    seriesName = 'Reading Advantage',
    seriesLevel = 'A1',
    seriesTagline = 'Learning Made Fun'
  } = options;

  return {
    ...lesson,
    lesson_number: lesson.lesson_number || `Lesson ${index + 1}`,
    series_name: seriesName,
    series_level: seriesLevel,
    series_tagline: seriesTagline,
    qr_code_url: (lesson as any).qr_code_url || undefined,
  };
}

export async function renderLessonTemplate(
  lesson: WorkbookLesson,
  options: RenderOptions = {}
): Promise<string> {
  const template = await getTemplate();
  const lessonData = prepareLessonData(lesson, 0, options);
  return template(lessonData);
}

export async function renderMultipleLessons(
  lessons: WorkbookLesson[],
  options: RenderOptions = {}
): Promise<string> {
  const template = await getTemplate();
  
  const renderedLessons = lessons.map((lesson, index) => {
    const lessonData = prepareLessonData(lesson, index, options);
    return template(lessonData);
  });

  const fullHtml = renderedLessons.join('\n');
  return fullHtml;
}

export function clearTemplateCache(): void {
  cachedTemplate = null;
}
