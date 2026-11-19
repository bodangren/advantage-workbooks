import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { renderMultipleLessons } from '../lib/template-renderer';
import { buildWorkbookLesson } from '../lib/lesson-package/build';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { wrapWorkbookDocument } from '../lib/workbook-document-wrapper';
import { parseLook } from '../lib/look';

// Track primary_v2_look_20261020, Phase S4, adversarial round (review A F1 and F3).
// This file closes the test gaps that the reviews found. It does not replace
// chibi-quest-step-names.test.ts.

const REPO = path.resolve(process.cwd(), '..');
const CONTENT = path.join(REPO, 'content', 'primary');

// The nine classic step names that must not appear in the chibi-quest output.
const CLASSIC_ONLY = [
  'Before You Read',
  'Key Vocabulary',
  'Read the Article',
  'Collect Vocabulary',
  'Deep Reading Notes',
  'Collect Sentences',
  'Comprehension Check',
  'Guided Response',
  'Lesson Reflection',
];

/** The section titles of a rendered lesson, with the step 6 grammar suffix intact. */
function rawSectionTitles(html: string): string[] {
  const matches = html.match(/<h2 class="section-title">[\s\S]*?<\/h2>/g) ?? [];
  return matches.map((h) => h.replace(/<\/?h2[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

/** The text that a page shows: no style block, no script block, and no comment. */
function visibleText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

async function quest5Lesson() {
  const file = path.join(CONTENT, 'quest-5', 'l01.json');
  const pkg = LessonPackageSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
  return buildWorkbookLesson(pkg, {});
}

describe('adversarial: the rendered step 6 title holds its grammar term', () => {
  it('prints the grammar term in the step 6 title of both looks', async () => {
    const lesson = { ...(await quest5Lesson()), grammar_search_term: 'Past tense' };
    const classic = await renderMultipleLessons([lesson], { type: 'primary', look: 'classic' });
    const chibi = await renderMultipleLessons([lesson], { type: 'primary', look: 'chibi-quest' });
    const classicTitles = rawSectionTitles(classic);
    const chibiTitles = rawSectionTitles(chibi);
    expect(classicTitles).toHaveLength(13);
    expect(chibiTitles).toHaveLength(13);
    expect(classicTitles[5]).toBe('Collect Sentences – Past tense');
    expect(chibiTitles[5]).toBe('Sentence Collection – Past tense');
  });

  it('prints no dangling separator when the grammar term is empty', async () => {
    const lesson = { ...(await quest5Lesson()), grammar_search_term: '' };
    for (const look of ['classic', 'chibi-quest'] as const) {
      const titles = rawSectionTitles(await renderMultipleLessons([lesson], { type: 'primary', look }));
      expect(titles).toHaveLength(13);
      expect(titles[5]).toBe(look === 'chibi-quest' ? 'Sentence Collection' : 'Collect Sentences');
      for (const title of titles) expect(title).not.toContain('–');
    }
  });
});

describe('adversarial: the look set stays closed', () => {
  it('throws on a look outside the closed set and defaults to classic', () => {
    expect(parseLook(undefined, 'probe')).toBe('classic');
    expect(parseLook(null, 'probe')).toBe('classic');
    expect(parseLook('classic', 'probe')).toBe('classic');
    expect(parseLook('chibi-quest', 'probe')).toBe('chibi-quest');
    for (const bad of ['riven-lands', 'Classic', 'CHIBI-QUEST', 'chibi-quest ', '', 42, true]) {
      expect(() => parseLook(bad, 'probe')).toThrow(/unknown look/);
    }
  });
});

describe('adversarial: the classic book keeps its own names', () => {
  const toc = [{ id: 'lesson-0', title: 'Lesson 1: Test' }];
  const answerKey = [
    {
      lessonTitle: 'Lesson 1: Test',
      mcAnswers: [{ number: 1, letter: 'a', text: 'A map' }],
      shortAnswerHint: 'Use the article.',
    },
  ];
  const teacherGuide = [
    {
      lessonTitle: 'Lesson 1: Test',
      vocabulary: [{ word: 'map', phonetic: '', definition: 'A picture of a place.' }],
    },
  ];
  const base = {
    seriesName: 'Quest 5',
    seriesLevel: 'A1',
    seriesTagline: 'x',
    type: 'primary' as const,
  };

  it('prints Key Vocabulary in the classic teacher pages', async () => {
    const lessonHtml = await renderMultipleLessons([await quest5Lesson()], {
      type: 'primary',
      look: 'classic',
    });
    const doc = wrapWorkbookDocument(lessonHtml, toc, {
      ...base,
      look: 'classic',
      answerKey,
      includeTeacherGuide: true,
      teacherGuide,
    });
    expect(doc).toContain('<h4 class="tg-section-title">Key Vocabulary</h4>');
    expect(doc).not.toContain('<h4 class="tg-section-title">Preview Vocabulary</h4>');
  });

  it('prints Key Vocabulary in the teacher pages when the look is absent', async () => {
    const lessonHtml = await renderMultipleLessons([await quest5Lesson()], { type: 'primary' });
    const doc = wrapWorkbookDocument(lessonHtml, toc, {
      ...base,
      answerKey,
      includeTeacherGuide: true,
      teacherGuide,
    });
    expect(doc).toContain('<h4 class="tg-section-title">Key Vocabulary</h4>');
    expect(doc).not.toContain('<h4 class="tg-section-title">Preview Vocabulary</h4>');
  });

  it('keeps the answer key labels in the classic book document', async () => {
    const lessonHtml = await renderMultipleLessons([await quest5Lesson()], {
      type: 'primary',
      look: 'classic',
    });
    const doc = wrapWorkbookDocument(lessonHtml, toc, { ...base, look: 'classic', answerKey });
    expect(doc).toContain('<strong>Multiple Choice:</strong>');
    expect(doc).toContain('<strong>Short Answer Hint:</strong>');
    expect(doc).not.toContain('<strong>Comprehension Check:</strong>');
    expect(doc).not.toContain('<strong>Guided Response:</strong>');
  });
});

describe('adversarial: no classic name in the chibi-quest visible text', () => {
  const toc = [{ id: 'lesson-0', title: 'Lesson 1: Test' }];
  const answerKey = [
    {
      lessonTitle: 'Lesson 1: Test',
      mcAnswers: [{ number: 1, letter: 'a', text: 'A map' }],
      shortAnswerHint: 'Use the article.',
    },
  ];
  const teacherGuide = [
    {
      lessonTitle: 'Lesson 1: Test',
      vocabulary: [{ word: 'map', phonetic: '', definition: 'A picture of a place.' }],
    },
  ];
  const base = {
    seriesName: 'Quest 5',
    seriesLevel: 'A1',
    seriesTagline: 'x',
    type: 'primary' as const,
  };

  it('shows no classic step name in the lesson pages or the book document', async () => {
    const lessonHtml = await renderMultipleLessons([await quest5Lesson()], {
      type: 'primary',
      look: 'chibi-quest',
    });
    const doc = wrapWorkbookDocument(lessonHtml, toc, {
      ...base,
      look: 'chibi-quest',
      answerKey,
      includeTeacherGuide: true,
      teacherGuide,
    });
    for (const html of [lessonHtml, doc]) {
      const text = visibleText(html);
      for (const name of CLASSIC_ONLY) expect(text).not.toContain(name);
    }
  });
});
