import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import type { WorkbookLesson } from './workbook-schema';

let cachedTemplate: HandlebarsTemplateDelegate | null = null;

async function getTemplate(): Promise<HandlebarsTemplateDelegate> {
  // Disable caching in development for hot-reloading
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (cachedTemplate && !isDevelopment) {
    return cachedTemplate;
  }

  // Register helpers (idempotent, safe to call multiple times)
  Handlebars.registerHelper('concat', function(...args) {
    // Slice off the options object at the end
    return args.slice(0, -1).join('');
  });

  const templatePath = path.join(process.cwd(), 'templates/workbook_template.html');
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const compiledTemplate = Handlebars.compile(templateContent);

  if (!isDevelopment) {
    cachedTemplate = compiledTemplate;
  }

  return compiledTemplate;
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
): any {
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
    // Pre-process images for the template
    images_hero: lesson.article_images?.filter(img => img.position === 'hero') || [],
    images_vocabulary: lesson.article_images?.filter(img => img.position === 'vocabulary') || [],
    images_writing_prompt: lesson.article_images?.filter(img => img.position === 'writing-prompt') || [],
    // Group inline images by paragraph index
    images_inline: lesson.article_images?.reduce((acc, img) => {
      if (img.position.startsWith('inline-para-')) {
        const key = img.position; // e.g., 'inline-para-1'
        if (!acc[key]) acc[key] = [];
        acc[key].push(img);
      }
      return acc;
    }, {} as Record<string, typeof lesson.article_images>) || {},
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
