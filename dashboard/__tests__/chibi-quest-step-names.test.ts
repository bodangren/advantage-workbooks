import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { renderMultipleLessons } from '../lib/template-renderer';
import { buildWorkbookLesson } from '../lib/lesson-package/build';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { wrapWorkbookDocument } from '../lib/workbook-document-wrapper';
import { lessonDocument, type PrintExport } from '../lib/print/print-export';
import { STEP_MAP } from '../lib/teacher-manual/app-section';

// Track primary_v2_look_20261020, story S4: the printed steps use the app names
// in the chibi-quest look. Classic output stays byte-identical.
const REPO = path.resolve(process.cwd(), '..');
const CONTENT = path.join(REPO, 'content', 'primary');

const CHIBI_NAMES = [
  'Introduction',
  'Preview Vocabulary',
  'First Reading',
  'Vocabulary Collection',
  'Deep Reading',
  'Sentence Collection',
  'Multiple Choice',
  'Short Answer',
  'Vocabulary Practice',
  'Sentence Practice',
  'Guided Writing',
  'Language Questions',
  'Lesson Summary',
];

const CLASSIC_NAMES = [
  'Before You Read',
  'Key Vocabulary',
  'Read the Article',
  'Collect Vocabulary',
  'Deep Reading Notes',
  'Collect Sentences',
  'Comprehension Check',
  'Guided Response',
  'Vocabulary Practice',
  'Sentence Practice',
  'Guided Writing',
  'Language Questions',
  'Lesson Reflection',
];

// Names that change in chibi-quest. Language Questions stays the same.
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

// App names that must not leak into classic.
const APP_ONLY = [
  'Introduction',
  'Preview Vocabulary',
  'First Reading',
  'Vocabulary Collection',
  'Deep Reading',
  'Sentence Collection',
  'Multiple Choice',
  'Short Answer',
  'Lesson Summary',
];

/** The section titles of a rendered lesson, without the step 6 grammar suffix. */
function sectionTitles(html: string): string[] {
  const matches = html.match(/<h2 class="section-title">([\s\S]*?)<\/h2>/g) ?? [];
  return matches.map((h) =>
    h
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s+–\s+.*$/, ''),
  );
}

async function quest5Lesson() {
  const file = path.join(CONTENT, 'quest-5', 'l01.json');
  const pkg = LessonPackageSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
  return buildWorkbookLesson(pkg, {});
}

describe('chibi-quest step names in lesson pages', () => {
  it('shows the 13 app names in order', async () => {
    const html = await renderMultipleLessons([await quest5Lesson()], {
      type: 'primary',
      look: 'chibi-quest',
    });
    const titles = sectionTitles(html);
    expect(titles).toHaveLength(13);
    expect(titles).toEqual(CHIBI_NAMES);
  });

  it('shows no classic-only name', async () => {
    const html = await renderMultipleLessons([await quest5Lesson()], {
      type: 'primary',
      look: 'chibi-quest',
    });
    const titles = sectionTitles(html);
    expect(titles).toHaveLength(13);
    for (const name of CLASSIC_ONLY) expect(titles).not.toContain(name);
  });

  it('keeps steps 9, 10, and 11 in the chibi-quest look', async () => {
    const html = await renderMultipleLessons([await quest5Lesson()], {
      type: 'primary',
      look: 'chibi-quest',
    });
    const titles = sectionTitles(html);
    expect(titles).toHaveLength(13);
    expect(titles.slice(8, 11)).toEqual([
      'Vocabulary Practice',
      'Sentence Practice',
      'Guided Writing',
    ]);
  });

  it('keeps the step 6 grammar conditional in both looks', async () => {
    const lesson = { ...(await quest5Lesson()), grammar_search_term: 'Past tense' };
    for (const look of ['classic', 'chibi-quest'] as const) {
      const html = await renderMultipleLessons([lesson], { type: 'primary', look });
      expect(html).toContain('Past tense');
    }
    const tpl = fs.readFileSync(
      path.join(process.cwd(), 'templates', 'primary_template.html'),
      'utf8',
    );
    expect(tpl).toContain('{{#if grammar_search_term}}');
  });
});

describe('chibi-quest step names in the book document', () => {
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

  it('shows Preview Vocabulary in the in-book teacher pages', async () => {
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
    // The exact heading: the template comment `<!-- STEP 2: Preview Vocabulary -->`
    // also holds the string, so a bare substring check would pass without the change.
    expect(doc).toContain('<h4 class="tg-section-title">Preview Vocabulary</h4>');
    expect(doc).not.toContain('<h4 class="tg-section-title">Key Vocabulary</h4>');
  });

  it('keeps the answer key labels Multiple Choice and Short Answer Hint', async () => {
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
    expect(doc).toContain('<strong>Multiple Choice:</strong>');
    expect(doc).toContain('<strong>Short Answer Hint:</strong>');
  });

  it('shows no step name in the TOC, and the TOC does not change with the look', async () => {
    const lessonHtml = await renderMultipleLessons([await quest5Lesson()], {
      type: 'primary',
      look: 'chibi-quest',
    });
    const tocOf = (look: 'classic' | 'chibi-quest') => {
      const doc = wrapWorkbookDocument(lessonHtml, toc, { ...base, look });
      return doc.match(/<div class="section-toc">[\s\S]*?<\/ul>\s*<\/div>/)?.[0] ?? '';
    };
    const chibiToc = tocOf('chibi-quest');
    const classicToc = tocOf('classic');
    expect(chibiToc).toContain('Lesson 1: Test');
    expect(chibiToc).toBe(classicToc);
    for (const name of [...CLASSIC_ONLY, ...APP_ONLY]) expect(chibiToc).not.toContain(name);
  });
});

describe('classic step names do not change', () => {
  it('shows the 13 classic names with classic and with no look', async () => {
    const lesson = await quest5Lesson();
    for (const options of [
      { type: 'primary' as const, look: 'classic' as const },
      { type: 'primary' as const },
    ]) {
      const titles = sectionTitles(await renderMultipleLessons([lesson], options));
      expect(titles).toHaveLength(13);
      expect(titles).toEqual(CLASSIC_NAMES);
    }
  });

  it('leaks no app-only name into classic', async () => {
    const lesson = await quest5Lesson();
    for (const options of [
      { type: 'primary' as const, look: 'classic' as const },
      { type: 'primary' as const },
    ]) {
      const titles = sectionTitles(await renderMultipleLessons([lesson], options));
      expect(titles).toHaveLength(13);
      for (const name of APP_ONLY) expect(titles).not.toContain(name);
    }
  });

  it('keeps the golden Origins 3.2 lesson byte-identical', async () => {
    const golden = path.join(CONTENT, 'origins-3.2', 'print', 'golden');
    const record = JSON.parse(
      fs.readFileSync(path.join(CONTENT, 'origins-3.2', 'print', 'p05.json'), 'utf8'),
    ) as PrintExport;
    const withKey = fs.readFileSync(path.join(golden, 'lesson-05.html'), 'utf8');
    const noKey = fs.readFileSync(path.join(golden, 'lesson-05-no-key.html'), 'utf8');
    expect(await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel)).toBe(
      withKey,
    );
    expect(
      await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
        look: 'classic',
      }),
    ).toBe(withKey);
    expect(
      await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
        answerKey: false,
      }),
    ).toBe(noKey);
    expect(
      await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
        answerKey: false,
        look: 'classic',
      }),
    ).toBe(noKey);
  });
});

describe('pinned teacher-manual text does not change', () => {
  it('keeps the classic step names and the step map', () => {
    expect(STEP_MAP.map((s) => s.title)).toEqual(CLASSIC_NAMES);
    const en = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'teacher-manual', 'i18n', 'en.ts'),
      'utf8',
    );
    for (const name of CLASSIC_NAMES) expect(en).toContain(name);
    const appSection = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'teacher-manual', 'app-section.ts'),
      'utf8',
    );
    expect(appSection).toContain("{ step: 1, title: 'Before You Read'");
    expect(appSection).toContain("{ step: 13, title: 'Lesson Reflection'");
  });
});
