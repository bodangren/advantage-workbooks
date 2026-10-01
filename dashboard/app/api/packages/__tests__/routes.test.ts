// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { NextRequest } from 'next/server';
import {
  fixturePackage,
  fixtureIndex,
  FIXTURE_PROFILE,
  FIXTURE_SHAPE,
  FIXTURE_OBJECTIVES,
} from '@/__tests__/fixtures/lesson-package-fixture';

vi.mock('@/lib/lesson-package/context', () => ({
  checkContextFor: () => ({
    index: fixtureIndex,
    prior: [],
    profile: FIXTURE_PROFILE,
    shape: FIXTURE_SHAPE,
    objectiveIds: FIXTURE_OBJECTIVES,
  }),
}));

import { GET as listGET } from '../route';
import { GET, PUT } from '../[book]/[lesson]/route';
import { POST as approvePOST } from '../[book]/[lesson]/approve/route';
import { GET as fileGET } from '../../files/route';
import { GET as castGET, POST as castPOST } from '../../cast/route';

let root: string;
let sheets: string;
const params = (book: string, lesson: string) => ({ params: Promise.resolve({ book, lesson }) });
const json = (url: string, method: string, body: unknown) =>
  new NextRequest(url, { method, body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-'));
  sheets = fs.mkdtempSync(path.join(os.tmpdir(), 'sheets-'));
  process.env.LESSON_CONTENT_ROOT = root;
  process.env.CHARACTER_SHEETS_DIR = sheets;
  fs.mkdirSync(path.join(root, 'b'), { recursive: true });
  fs.writeFileSync(path.join(root, 'b', 't01.json'), JSON.stringify(fixturePackage()));
  fs.mkdirSync(path.join(sheets, 'candidates'));
  fs.writeFileSync(path.join(sheets, 'candidates', 'pip_001.jpg'), 'jpg-bytes');
  fs.writeFileSync(
    path.join(sheets, 'cast.json'),
    JSON.stringify({
      version: 1,
      style: 's',
      sheet: 'w',
      characters: [{ name: 'pip', description: 'Pip.', candidates: ['candidates/pip_001.jpg'] }],
    }),
  );
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(sheets, { recursive: true, force: true });
  delete process.env.LESSON_CONTENT_ROOT;
  delete process.env.CHARACTER_SHEETS_DIR;
});

describe('package routes', () => {
  it('lists the books', async () => {
    const res = await listGET();
    expect(res.status).toBe(200);
    const books = await res.json();
    expect(books[0]).toMatchObject({ book: 'b', lessons: [{ lesson: 't01', title: 'Where Is the Ball?', fail: 0 }] });
    expect(typeof books[0].lessons[0].warn).toBe('number');
  });

  it('reads a package with its check report', async () => {
    const res = await GET(new NextRequest('http://x/api/packages/b/t01'), params('b', 't01'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.package.meta.lesson).toBe('T01');
    expect(body.report.checks.length).toBeGreaterThan(5);
  });

  it('gives 404 for a missing package and 400 for a bad id', async () => {
    expect((await GET(new NextRequest('http://x'), params('b', 'zz'))).status).toBe(404);
    expect((await GET(new NextRequest('http://x'), params('..', 't01'))).status).toBe(400);
  });

  it('saves a valid edit and refuses an invalid one with the issues', async () => {
    const pkg = fixturePackage();
    pkg.text.summary = 'Pip finds the red ball.';
    const ok = await PUT(json('http://x', 'PUT', pkg), params('b', 't01'));
    expect(ok.status).toBe(200);
    expect((await ok.json()).saved).toBe(true);
    const bad = await PUT(json('http://x', 'PUT', { version: 1 }), params('b', 't01'));
    expect(bad.status).toBe(400);
    expect((await bad.json()).report.checks[0]).toMatchObject({ id: 'schema', status: 'fail' });
    expect(JSON.parse(fs.readFileSync(path.join(root, 'b', 't01.json'), 'utf8')).text.summary).toBe(
      'Pip finds the red ball.',
    );
  });

  it('approves a part, refuses an unknown part, and refuses the lesson while parts are open', async () => {
    const ok = await approvePOST(json('http://x', 'POST', { part: 'text' }), params('b', 't01'));
    expect(ok.status).toBe(200);
    expect((await ok.json()).package.approval.text.status).toBe('approved');
    expect((await approvePOST(json('http://x', 'POST', { part: 'everything' }), params('b', 't01'))).status).toBe(400);
    expect((await approvePOST(json('http://x', 'POST', { part: 'lesson' }), params('b', 't01'))).status).toBe(409);
  });
});

describe('file route', () => {
  it('serves a character-sheet file with its type and refuses paths outside the allowed folders', async () => {
    const ok = await fileGET(new NextRequest('http://x/api/files?root=sheets&path=candidates/pip_001.jpg'));
    expect(ok.status).toBe(200);
    expect(ok.headers.get('content-type')).toBe('image/jpeg');
    expect((await fileGET(new NextRequest('http://x/api/files?root=sheets&path=../cast.json'))).status).toBe(400);
    expect((await fileGET(new NextRequest('http://x/api/files?root=etc&path=passwd'))).status).toBe(400);
    expect((await fileGET(new NextRequest('http://x/api/files?root=content&path=b/none.png'))).status).toBe(404);
  });
});

describe('cast route', () => {
  it("reads the cast and records Daniel's choice as the sheet", async () => {
    const cast = await (await castGET()).json();
    expect(cast.characters[0].name).toBe('pip');
    const res = await castPOST(json('http://x', 'POST', { name: 'pip', candidate: 'candidates/pip_001.jpg' }));
    expect(res.status).toBe(200);
    const saved = JSON.parse(fs.readFileSync(path.join(sheets, 'cast.json'), 'utf8'));
    expect(saved.characters[0]).toMatchObject({ chosen: 'pip.jpg', chosenFrom: 'candidates/pip_001.jpg' });
    expect(saved.characters[0].approved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(fs.readFileSync(path.join(sheets, 'pip.jpg'), 'utf8')).toBe('jpg-bytes');
    expect((await castPOST(json('http://x', 'POST', { name: 'pip', candidate: 'candidates/other.jpg' }))).status).toBe(
      400,
    );
  });
});
