import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/projects/[projectId]/compile/route';
import { CHIBI_QUEST_BOOKS, bookLook, parseLook, projectLook } from '@/lib/look';
import { BOOK_ORDER } from '@/lib/lesson-package/files';
import { renderMultipleLessons } from '@/lib/template-renderer';
import { wrapSingleLessonDocument, wrapWorkbookDocument, type WorkbookDocumentOptions } from '@/lib/workbook-document-wrapper';
import { lessonDocument, type PrintExport } from '@/lib/print/print-export';
import { bookLessons } from '@/lib/print/book-lessons';
import type { WorkbookLesson } from '@/lib/workbook-schema';

// Track primary_v2_look_20261020, story S1: levels 5–9 print in the Chibi Quest look, and the books
// of levels 1–4 print exactly as before.

const REPO = path.resolve(process.cwd(), '..');
const CONTENT = path.join(REPO, 'content', 'primary');
const CHIBI = 'class="look-chibi-quest"';

const lesson = (title: string) => ({
  lesson_title: title,
  lesson_number: 'Lesson 1',
  level_name: 'Quest 5',
  cefr_level: 'A1',
  article_type: 'fiction',
  genre: 'School',
  vocabulary: [{ word: 'map', phonetic: '', definition: 'A picture of a place.', thai_definition: 'แผนที่' }],
  article_paragraphs: [{ number: 1, text: 'Mia has a map.' }],
  comprehension_questions: [{ number: 1, question: 'What does Mia have?', options: ['A map', 'A cat'] }],
  writing_prompt: 'Write about a map.',
  mc_answers: [{ number: 1, letter: 'a', text: 'A map' }],
});

describe('look values', () => {
  it('gives classic for no look and refuses an unknown look', () => {
    expect(parseLook(undefined, 'x')).toBe('classic');
    expect(parseLook('classic', 'x')).toBe('classic');
    expect(parseLook('chibi-quest', 'x')).toBe('chibi-quest');
    expect(() => parseLook('riven-lands', 'quest-5-a1')).toThrow(/quest-5-a1.*riven-lands/);
    expect(() => parseLook(5, 'x')).toThrow();
  });

  it('gives chibi-quest to the books from Quest 5 to Adventure 9.3 only', () => {
    const at = BOOK_ORDER.indexOf('quest-5');
    expect(at).toBeGreaterThan(0);
    for (const book of BOOK_ORDER.slice(0, at)) expect(bookLook(book)).toBe('classic');
    for (const book of BOOK_ORDER.slice(at)) expect(bookLook(book)).toBe('chibi-quest');
    expect([...CHIBI_QUEST_BOOKS].sort()).toEqual(BOOK_ORDER.slice(at).sort());
    for (const book of ['origins-2', 'bank-5', 'bank-9', 'adventures-1.0', '']) expect(bookLook(book)).toBe('classic');
  });

  it('takes the look of a project from project.json, or else from its book', () => {
    expect(projectLook({ seriesName: 'Quest', levelNumber: '5', cefrLevel: 'A1' })).toBe('chibi-quest');
    expect(projectLook({ seriesName: 'Adventure', levelNumber: '9.3', cefrLevel: 'A2' })).toBe('chibi-quest');
    expect(projectLook({ seriesName: 'Quest', levelNumber: '4', cefrLevel: 'A1' })).toBe('classic');
    expect(projectLook({ seriesName: 'Origins', levelNumber: '3.2', cefrLevel: 'A0+' })).toBe('classic');
    expect(projectLook({ seriesName: 'Quest', levelNumber: '5', cefrLevel: 'A1', look: 'classic' })).toBe('classic');
    expect(projectLook({ seriesName: 'Origins', levelNumber: '2', cefrLevel: 'A0', look: 'chibi-quest' })).toBe('chibi-quest');
    expect(projectLook(null)).toBe('classic');
  });
});

describe('classic output does not change', () => {
  const golden = path.join(CONTENT, 'origins-3.2', 'print', 'golden');
  const record = JSON.parse(fs.readFileSync(path.join(CONTENT, 'origins-3.2', 'print', 'p05.json'), 'utf8')) as PrintExport;
  const render = (opts: Parameters<typeof lessonDocument>[4] = {}) =>
    lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, opts);

  it('renders the Origins 3.2 golden lesson byte for byte, with no look and with classic', async () => {
    const withKey = fs.readFileSync(path.join(golden, 'lesson-05.html'), 'utf8');
    const noKey = fs.readFileSync(path.join(golden, 'lesson-05-no-key.html'), 'utf8');
    expect(await render()).toBe(withKey);
    expect(await render({ look: 'classic' })).toBe(withKey);
    expect(await render({ answerKey: false })).toBe(noKey);
    expect(await render({ answerKey: false, look: 'classic' })).toBe(noKey);
  });

  it('gives the same lesson HTML and documents for no look and for classic', async () => {
    const lessons = [lesson('One'), lesson('Two')] as unknown as WorkbookLesson[];
    const plain = await renderMultipleLessons(lessons, { type: 'primary' });
    expect(await renderMultipleLessons(lessons, { type: 'primary', look: 'classic' })).toBe(plain);
    const options: WorkbookDocumentOptions = { seriesName: 'Origins 3.2', seriesLevel: 'A0+', seriesTagline: '', type: 'primary' };
    const book = wrapWorkbookDocument(plain, [], options);
    expect(wrapWorkbookDocument(plain, [], { ...options, look: 'classic' })).toBe(book);
    expect(book).toContain('<body>');
    expect(book).not.toContain('look-chibi-quest');
    expect(book).not.toContain('--cq-');
    expect(wrapWorkbookDocument(plain, [], { ...options, lessonsOnly: true, look: 'classic' })).toBe(wrapWorkbookDocument(plain, [], { ...options, lessonsOnly: true }));
    expect(wrapSingleLessonDocument(plain, null, { ...options, look: 'classic' })).toBe(wrapSingleLessonDocument(plain, null, options));
  });

  it('prints the books of levels 1–4 in the classic look', async () => {
    for (const book of ['origins-1', 'origins-2', 'origins-3.1', 'origins-3.2', 'quest-4']) {
      expect((await bookLessons(book, CONTENT)).look).toBe('classic');
    }
  });
});

describe('the chibi-quest look', () => {
  const options: WorkbookDocumentOptions = { seriesName: 'Quest 5', seriesLevel: 'A1', seriesTagline: '', type: 'primary', look: 'chibi-quest' };

  it('adds its own style block and body class to every kind of document', async () => {
    const html = await renderMultipleLessons([lesson('One')] as unknown as WorkbookLesson[], { type: 'primary', look: 'chibi-quest' });
    for (const doc of [
      wrapWorkbookDocument(html, [], options),
      wrapWorkbookDocument(html, [], { ...options, lessonsOnly: true }),
      wrapSingleLessonDocument(html, null, options),
    ]) {
      expect(doc).toContain(`<body ${CHIBI}>`);
      expect(doc).toContain('<style data-look="chibi-quest">');
      expect(doc).toContain('--cq-parchment: #f3e4c3;');
      // The classic print CSS stays; the look block comes after it, so it wins on equal selectors.
      expect(doc.indexOf('<style data-look="chibi-quest">')).toBeGreaterThan(doc.indexOf('@page'));
    }
  });

  it('reaches the single-lesson PDF document', async () => {
    const doc = await lessonDocument(lesson('One') as unknown as WorkbookLesson, 1, 'Quest 5', 'A1', { look: 'chibi-quest' });
    expect(doc).toContain(`<body ${CHIBI}>`);
  });
});

describe('compile route look', () => {
  let root: string;
  let savedRoot: string | undefined;
  const project = async (id: string, meta: Record<string, unknown>) => {
    const dir = path.join(root, 'primary', id);
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(path.join(dir, 'project.json'), JSON.stringify({ cefrLevel: 'A1', type: 'primary', ...meta }));
    await fsp.writeFile(path.join(dir, '01-One _workbook.json'), JSON.stringify(lesson('One')));
  };

  beforeAll(async () => {
    savedRoot = process.env.WORKBOOKS_ROOT;
    root = await fsp.mkdtemp(path.join(os.tmpdir(), 'look-route-'));
    process.env.WORKBOOKS_ROOT = root;
    await fsp.mkdir(path.join(root, 'secondary'), { recursive: true });
    await project('quest-5-a1', { seriesName: 'Quest', levelNumber: '5' });
    await project('quest-4-a1', { seriesName: 'Quest', levelNumber: '4' });
    await project('quest-5-classic', { seriesName: 'Quest', levelNumber: '5', look: 'classic' });
    await project('quest-5-bad', { seriesName: 'Quest', levelNumber: '5', look: 'riven-lands' });
  });

  afterAll(async () => {
    if (savedRoot === undefined) delete process.env.WORKBOOKS_ROOT;
    else process.env.WORKBOOKS_ROOT = savedRoot;
    await fsp.rm(root, { recursive: true, force: true });
  });

  const compile = async (id: string) => {
    const res = await GET(new NextRequest(`http://localhost/api/projects/${id}/compile`), { params: Promise.resolve({ projectId: id }) });
    return { status: res.status, html: ((await res.json()) as { html?: string }).html ?? '' };
  };

  it('compiles a Quest 5 project in chibi-quest and a Quest 4 project in classic', async () => {
    expect((await compile('quest-5-a1')).html).toContain(`<body ${CHIBI}>`);
    const classic = await compile('quest-4-a1');
    expect(classic.status).toBe(200);
    expect(classic.html).toContain('<body>');
    expect(classic.html).not.toContain('look-chibi-quest');
  });

  it('obeys the look in project.json, and fails on an unknown look', async () => {
    expect((await compile('quest-5-classic')).html).not.toContain('look-chibi-quest');
    expect((await compile('quest-5-bad')).status).toBe(500);
  });
});
