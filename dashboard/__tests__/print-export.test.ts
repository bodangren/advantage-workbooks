import { describe, it, expect } from 'vitest';
import { BUCKET_IMAGES, bucketPictures, printExport, lessonDocument } from '@/lib/print/print-export';
import type { LessonPackage } from '@/lib/lesson-package/schema';
import type { WorkbookLesson } from '@/lib/workbook-schema';

const pkg = {
  meta: { key: 'o3-2/5', number: 5 },
  images: [
    { file: 'origins-3.2/media/p05/hero.jpg', position: 'hero' },
    { position: 'inline-para-1' },
    { file: 'origins-3.2/media/p05/inline-para-2.jpg', position: 'inline-para-2' },
  ],
  db: { legacy: { articleId: 'cmarticle' } },
} as unknown as LessonPackage;

const lesson = {
  lesson_title: 'At the Market',
  lesson_number: '5',
  article_images: [
    { url: '/api/files?root=content&path=origins-3.2/media/p05/hero.jpg', caption: 'A', position: 'hero' },
    { url: 'file:///home/x/Workbooks/content/primary/origins-3.2/media/p05/inline-para-2.jpg', caption: 'B', position: 'inline-para-2' },
  ],
} as unknown as WorkbookLesson;

describe('print export for the monorepo print kit', () => {
  it('points each local picture at the bucket object that the injector uploaded', () => {
    const out = bucketPictures(lesson, pkg);
    // The object number is the picture's place in pkg.images, a picture without a file too (inject/legacy.ts bucketObjects).
    expect(out.article_images?.map((img) => img.url)).toEqual([
      `${BUCKET_IMAGES}cmarticle_1.png`,
      `${BUCKET_IMAGES}cmarticle_3.png`,
    ]);
    expect(out.article_images?.[1].caption).toBe('B');
    expect(lesson.article_images?.[0].url).toMatch(/^\/api\/files/);
  });

  it('keeps a bucket picture and uses the printed article when the package has no legacy ids', () => {
    const printed = { ...pkg, db: {}, meta: { ...pkg.meta, printed: { articleId: 'cmprinted' } } } as unknown as LessonPackage;
    const bucket = { ...lesson, article_images: [{ url: `${BUCKET_IMAGES}cmold_2.png`, caption: 'C', position: 'hero' }] } as unknown as WorkbookLesson;
    expect(bucketPictures(bucket, printed).article_images?.[0].url).toBe(`${BUCKET_IMAGES}cmold_2.png`);
    expect(bucketPictures(lesson, printed).article_images?.[0].url).toBe(`${BUCKET_IMAGES}cmprinted_1.png`);
  });

  it('stops on a local picture that has no bucket object', () => {
    const stray = { ...lesson, article_images: [{ url: '/api/files?root=content&path=origins-3.2/media/p05/other.jpg', caption: 'D', position: 'hero' }] } as unknown as WorkbookLesson;
    expect(() => bucketPictures(stray, pkg)).toThrow(/o3-2\/5.*other\.jpg/);
    expect(() => bucketPictures(lesson, { ...pkg, db: {} } as unknown as LessonPackage)).toThrow(/o3-2\/5.*no app article/);
  });

  it('makes the export record with the series, the lesson number, and the package key', () => {
    expect(printExport({ name: 'Origins 3.2', level: 'A0+', number: 5, lesson, pkg })).toEqual({
      seriesName: 'Origins 3.2',
      seriesLevel: 'A0+',
      lessonNumber: 5,
      packageKey: 'o3-2/5',
      lesson: bucketPictures(lesson, pkg),
    });
  });

  it('renders one lesson with or without its answer key page', async () => {
    const full = { ...lesson, article_paragraphs: [{ number: 1, text: 'May goes to the market.' }], mc_answers: [{ number: 1, letter: 'a', text: 'Apples' }] } as unknown as WorkbookLesson;
    const withKey = await lessonDocument(full, 5, 'Origins 3.2', 'A0+');
    const noKey = await lessonDocument(full, 5, 'Origins 3.2', 'A0+', { answerKey: false });
    expect(withKey).toContain('<div class="single-lesson-key">');
    expect(noKey).not.toContain('<div class="single-lesson-key">');
    expect(noKey).toContain('May goes to the market.');
    expect(withKey).toContain('Lesson 5');
  });
});
