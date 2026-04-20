import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import type { ArticleImage, WorkbookLesson } from './workbook-schema';
import { generateQRCodeDataURL } from './qr-generator';

type WorkbookType = 'primary' | 'secondary';

const cachedTemplates: Record<WorkbookType, HandlebarsTemplateDelegate | null> = {
  primary: null,
  secondary: null,
};

async function getTemplate(type: WorkbookType = 'secondary'): Promise<HandlebarsTemplateDelegate> {
  // Disable caching in development for hot-reloading
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (cachedTemplates[type] && !isDevelopment) {
    return cachedTemplates[type];
  }

  // Register helpers (idempotent, safe to call multiple times)
  Handlebars.registerHelper('concat', function(...args) {
    // Slice off the options object at the end
    return args.slice(0, -1).join('');
  });

  const templateFileName = type === 'primary' ? 'primary_template.html' : 'secondary_template.html';
  const templatePath = path.join(process.cwd(), 'templates', templateFileName);
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const compiledTemplate = Handlebars.compile(templateContent);

  if (!isDevelopment) {
    cachedTemplates[type] = compiledTemplate;
  }

  return compiledTemplate;
}

export interface RenderOptions {
  seriesName?: string;
  seriesLevel?: string;
  seriesTagline?: string;
  type?: WorkbookType;
}

type ArticleImages = NonNullable<WorkbookLesson['article_images']>;

type PreparedLessonData = Omit<WorkbookLesson, 'article_image_url' | 'article_images'> & {
  lesson_number: string;
  series_name: string;
  series_level: string;
  series_tagline: string;
  article_image_url?: string;
  article_images?: ArticleImages;
  qr_code_url?: string;
  writing_qr_code_url?: string;
  images_hero: ArticleImages;
  images_vocabulary: ArticleImages;
  images_writing_prompt: ArticleImages;
  images_inline: Record<string, ArticleImages>;
};

function getArticleImageUrl(lesson: WorkbookLesson): string | undefined {
  const value = (lesson as Record<string, unknown>).article_image_url;
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function getLegacyArticleImageUrls(lesson: WorkbookLesson): string[] {
  const value = (lesson as Record<string, unknown>).article_image_url;
  if (!Array.isArray(value)) return [];

  return value
    .filter((url): url is string => typeof url === 'string' && url.trim() !== '')
    .map(url => url.trim());
}

function normalizeArticleImages(lesson: WorkbookLesson): ArticleImages {
  const articleImages = lesson.article_images ?? [];
  if (articleImages.length > 0) return articleImages;

  return getLegacyArticleImageUrls(lesson).map((url, index) => ({
    url,
    caption: lesson.article_caption || `Article image ${index + 1}`,
    position: `inline-para-${Math.min(index + 1, 5)}` as ArticleImage['position'],
  }));
}

function prepareLessonData(
  lesson: WorkbookLesson,
  index: number,
  options: RenderOptions = {}
): PreparedLessonData {
  const {
    seriesName = 'Reading Advantage',
    seriesLevel = 'A1',
    seriesTagline = 'Learning Made Fun'
  } = options;
  const articleImageUrl = getArticleImageUrl(lesson);
  const articleImages = normalizeArticleImages(lesson);
  
  const existingQRCodeUrl = (lesson as Record<string, unknown>).qr_code_url;
  let qrCodeUrl: string | undefined;
  
  if (typeof existingQRCodeUrl === 'string' && existingQRCodeUrl.trim() !== '') {
    qrCodeUrl = existingQRCodeUrl;
  } else if (lesson.article_url) {
    qrCodeUrl = generateQRCodeDataURL(lesson.article_url) ?? undefined;
  }

  let writingQrCodeUrl: string | undefined;
  const existingWritingQrCodeUrl = (lesson as Record<string, unknown>).writing_qr_code_url;
  if (typeof existingWritingQrCodeUrl === 'string' && existingWritingQrCodeUrl.trim() !== '') {
    writingQrCodeUrl = existingWritingQrCodeUrl;
  } else if (lesson.writing_practice_url) {
    writingQrCodeUrl = generateQRCodeDataURL(lesson.writing_practice_url) ?? undefined;
  } else if (lesson.article_url) {
    const baseUrl = lesson.article_url.endsWith('/') ? lesson.article_url.slice(0, -1) : lesson.article_url;
    writingQrCodeUrl = generateQRCodeDataURL(`${baseUrl}/writing`) ?? undefined;
  }

  // Force sequential lesson numbering regardless of JSON field
  const forcedLessonNumber = `Lesson ${index + 1}`;

  return {
    ...lesson,
    lesson_number: forcedLessonNumber,
    series_name: seriesName,
    series_level: seriesLevel,
    series_tagline: seriesTagline,
    article_image_url: articleImageUrl,
    article_images: articleImages,
    qr_code_url: qrCodeUrl,
    writing_qr_code_url: writingQrCodeUrl,
    // Pre-process images for the template
    images_hero: articleImages.filter(img => img.position === 'hero'),
    images_vocabulary: articleImages.filter(img => img.position === 'vocabulary'),
    images_writing_prompt: articleImages.filter(img => img.position === 'writing-prompt'),
    // Group inline images by paragraph index
    images_inline: articleImages.reduce<Record<string, typeof articleImages>>((acc, img) => {
      if (img.position.startsWith('inline-para-')) {
        const key = img.position; // e.g., 'inline-para-1'
        if (!acc[key]) acc[key] = [];
        acc[key].push(img);
      }
      return acc;
    }, {}),
  };
}

export async function renderLessonTemplate(
  lesson: WorkbookLesson,
  options: RenderOptions = {}
): Promise<string> {
  const template = await getTemplate(options.type ?? 'secondary');
  const lessonData = prepareLessonData(lesson, 0, options);
  return template(lessonData);
}

export async function renderMultipleLessons(
  lessons: WorkbookLesson[],
  options: RenderOptions = {}
): Promise<string> {
  const template = await getTemplate(options.type ?? 'secondary');
  
  const renderedLessons = lessons.map((lesson, index) => {
    const lessonData = prepareLessonData(lesson, index, options);
    const lessonHtml = template(lessonData);
    return `<div id="lesson-${index}" class="lesson-section">${lessonHtml}</div>`;
  });

  const fullHtml = renderedLessons.join('\n');
  return fullHtml;
}

export function clearTemplateCache(): void {
  cachedTemplates.primary = null;
  cachedTemplates.secondary = null;
}
