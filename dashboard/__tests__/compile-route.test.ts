import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/projects/[projectId]/compile/route';

/** A lesson that says "Lesson 1" whatever its place, like the printed Origins 2 and 3.1 files. */
const lesson = (title: string) => ({
  lesson_title: title,
  lesson_number: 'Lesson 1',
  level_name: 'Level 2',
  cefr_level: 'CEFR A0',
  article_type: 'fiction',
  genre: 'Animals',
  vocabulary: [{ word: 'dog', phonetic: '', definition: 'An animal.', thai_definition: 'สุนัข' }],
  article_paragraphs: [{ number: 1, text: 'This is a dog.' }],
  comprehension_questions: [{ number: 1, question: 'What is it?', options: ['A dog', 'A cat'] }],
  writing_prompt: 'Write about a dog.',
  mc_answers: [{ number: 1, letter: 'a', text: 'A dog' }],
});

describe('compile route', () => {
  let root: string;
  let savedRoot: string | undefined;

  beforeAll(async () => {
    savedRoot = process.env.WORKBOOKS_ROOT;
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'compile-route-'));
    process.env.WORKBOOKS_ROOT = root;
    const dir = path.join(root, 'primary', 'book-a0');
    await fs.mkdir(dir, { recursive: true });
    await fs.mkdir(path.join(root, 'secondary'), { recursive: true });
    await fs.writeFile(path.join(dir, 'project.json'), JSON.stringify({ seriesName: 'Origins', levelNumber: '2', cefrLevel: 'A0', type: 'primary' }));
    await fs.writeFile(path.join(dir, '01-First _workbook.json'), JSON.stringify(lesson('First')));
    await fs.writeFile(path.join(dir, '02-Second _workbook.json'), JSON.stringify(lesson('Second')));
  });

  afterAll(async () => {
    if (savedRoot === undefined) delete process.env.WORKBOOKS_ROOT;
    else process.env.WORKBOOKS_ROOT = savedRoot;
    await fs.rm(root, { recursive: true, force: true });
  });

  const compile = async (query = '') => {
    const res = await GET(new NextRequest(`http://localhost/api/projects/book-a0/compile${query}`), { params: Promise.resolve({ projectId: 'book-a0' }) });
    expect(res.status).toBe(200);
    return ((await res.json()) as { html: string }).html;
  };

  it('numbers the answer key by the place of the lesson in the book', async () => {
    const html = await compile();
    expect(html).toContain('<div class="section-answer-key">');
    expect(html).toContain('Lesson 2: Second');
    expect(html).not.toContain('Lesson 1: Second');
  });

  it('leaves the teacher guide out of the student book unless asked for', async () => {
    // Daniel (2026-10-03): each workbook gets a separate teacher's manual.
    expect(await compile()).not.toContain('<div class="section-teacher-guide">');
    expect(await compile('?includeTeacherGuide=true')).toContain('<div class="section-teacher-guide">');
  });
});
