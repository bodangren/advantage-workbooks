import { describe, it, expect } from 'vitest';
import { answerKeyEntry } from '@/lib/document-wrapper/sections/answer-key';
import { wrapSingleLessonDocument, wrapWorkbookDocument, A4_PAGE } from '@/lib/workbook-document-wrapper';
import { lessonPdfName, localPictures } from '@/lib/print/lesson-pdf';
import type { WorkbookLesson } from '@/lib/workbook-schema';

const lesson = {
  lesson_title: 'At the Market',
  lesson_number: 'Lesson 1',
  mc_answers: [{ number: 1, letter: 'b', text: 'Apples' }],
  vocab_match_answer_string: '1. c, 2. a',
  vocab_fill_answer_string: '1. apple',
  sentence_order_answers: [{ number: 1, sentence: 'May buys apples.' }],
  short_answer_hint: 'May buys ___.',
} as unknown as WorkbookLesson;

describe('single-lesson print PDF', () => {
  it('makes the answer key entry with the lesson number in the book', () => {
    expect(answerKeyEntry(lesson, 5)).toEqual({
      lessonTitle: 'Lesson 5: At the Market',
      mcAnswers: lesson.mc_answers,
      vocabMatchAnswerString: '1. c, 2. a',
      vocabFillAnswerString: '1. apple',
      sentenceOrderAnswers: lesson.sentence_order_answers,
      shortAnswerHint: 'May buys ___.',
    });
    expect(answerKeyEntry({ lesson_title: 'Empty' } as unknown as WorkbookLesson, 2)).toBeNull();
  });

  it('wraps one lesson for A4 paper, with its answer key on its own last page', () => {
    const html = wrapSingleLessonDocument('<div class="lesson-section">LESSON</div>', answerKeyEntry(lesson, 5), { seriesName: 'Origins 3.2', seriesLevel: 'A0+', seriesTagline: '', type: 'primary' });
    expect(A4_PAGE).toBe('210mm 297mm');
    expect(html).toContain('size: 210mm 297mm;');
    expect(html).toContain('<title>Primary Advantage Workbook - Origins 3.2</title>');
    expect(html.indexOf('LESSON')).toBeLessThan(html.indexOf('<div class="single-lesson-key">'));
    expect(html).toContain('Lesson 5: At the Market');
    expect(html).toMatch(/\.single-lesson-key\s*\{[^}]*break-before:\s*page/);
    expect(html).not.toContain('<div class="cover-page"');
    expect(html).not.toContain('<div class="section-toc">');
    // No cover, so the first page keeps its margin and page number.
    expect(html).not.toContain('@page :first');
  });

  it('keeps the book page size for a whole book', () => {
    const html = wrapWorkbookDocument('', [], { seriesName: 'Origins 3.2', seriesLevel: 'A0+', seriesTagline: '', type: 'primary' });
    expect(html).toContain('size: 210mm 285mm;');
    expect(html).toContain('@page :first');
  });

  it('names the file by product, book, lesson number, and title', () => {
    expect(lessonPdfName('Origins 3.2', 5, "Let's Make a Kite!")).toBe('Primary-Advantage-Origins-3.2-Lesson-05-Lets-Make-a-Kite.pdf');
    expect(lessonPdfName('Quest 4', 13, 'Have You Seen Our Kitten?')).toBe('Primary-Advantage-Quest-4-Lesson-13-Have-You-Seen-Our-Kitten.pdf');
  });

  it('points the pictures at local files: bucket pictures in a cache, package pictures in content', () => {
    const html = [
      '<img src="https://storage.googleapis.com/primary-app-storage/images/abc_1.png">',
      '<img src="/api/files?root&#x3D;content&amp;path&#x3D;origins-3.2/media/p05/hero.jpg">',
      '<img src="/api/files?root=content&path=quest-4/media/l01/hero.jpg">',
    ].join('');
    const r = localPictures(html, '/cache/img', '/repo/content/primary');
    expect(r.html).toBe([
      '<img src="file:///cache/img/abc_1.png">',
      '<img src="file:///repo/content/primary/origins-3.2/media/p05/hero.jpg">',
      '<img src="file:///repo/content/primary/quest-4/media/l01/hero.jpg">',
    ].join(''));
    expect(r.downloads).toEqual([{ url: 'https://storage.googleapis.com/primary-app-storage/images/abc_1.png', file: '/cache/img/abc_1.png' }]);
  });
});
