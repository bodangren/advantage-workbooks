// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/projects/route';
import { PUT } from '@/app/api/projects/[projectId]/metadata/route';
import {
    createProject, listLessons, listProjects, readProjectMetadata, writeProjectMetadata,
    type CreateProjectOptions, type ProjectMetadata, type ProjectType,
} from '@/lib/filesystem';
import { bookLook, projectLook } from '@/lib/look';
import { bookLessons } from '@/lib/print/book-lessons';

// These tests use synthetic English fixtures. They never read the repository's books.
const SHIPPED = [
    ['origins-2-a0', 'Origins', '2', 'A0'],
    ['adventures-1.0-a1', 'Adventures', '1.0', 'A1'],
    ['origins-3.1-a0', 'Origins', '3.1', 'A0'],
    ['origins-3.2-a0', 'Origins', '3.2', 'A0'],
    ['quest-4-a1', 'Quest', '4', 'A1'],
] as const;
const PRIMARY: CreateProjectOptions = {
    type: 'primary', seriesName: 'Origins', levelNumber: '2', cefrLevel: 'A0',
};

function request(url: string, method: 'POST' | 'PUT', body: unknown) {
    return new NextRequest(`http://localhost${url}`, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
}

function signal() {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => { resolve = done; });
    return { promise, resolve };
}

describe('S8 adversarial default look', () => {
    let root: string;

    beforeEach(async () => {
        root = await fs.mkdtemp(path.join(os.tmpdir(), 's8-adversarial-'));
        vi.stubEnv('WORKBOOKS_ROOT', root);
        vi.stubEnv('WORKBOOKS_READ_ONLY', '');
        await fs.mkdir(path.join(root, 'primary'));
        await fs.mkdir(path.join(root, 'secondary'));
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        await fs.rm(root, { recursive: true, force: true });
    });

    async function seed(type: ProjectType, id: string, metadata: ProjectMetadata) {
        const dir = path.join(root, type, id);
        await fs.mkdir(dir);
        const file = path.join(dir, 'project.json');
        await fs.writeFile(file, JSON.stringify(metadata, null, 2));
        await fs.writeFile(path.join(dir, 'content_sentinel.json'), JSON.stringify({
            lesson_title: 'The sentinel lesson', marker: 'Keep this lesson',
        }));
        return file;
    }

    async function put(id: string, metadata: unknown) {
        return PUT(request(`/api/projects/${id}/metadata`, 'PUT', metadata), {
            params: Promise.resolve({ projectId: id }),
        });
    }

    it.each(SHIPPED)(
        'POST refuses a secondary twin of shipped id %s',
        async (id, seriesName, levelNumber, cefrLevel) => {
            const meta: ProjectMetadata = { type: 'primary', seriesName, levelNumber, cefrLevel, look: 'classic' };
            const file = await seed('primary', id, meta);
            const before = await fs.readFile(file, 'utf8');
            expect((await listLessons(id)).map((lesson) => lesson.id)).toEqual(['content_sentinel']);

            const response = await POST(request('/api/projects', 'POST', {
                type: 'secondary', seriesName, levelNumber, cefrLevel,
            }));

            // Check the real downstream lookup as well as the HTTP conflict.
            expect.soft(response.status).toBe(409);
            expect.soft((await listLessons(id)).map((lesson) => lesson.id)).toEqual(['content_sentinel']);
            expect.soft(await readProjectMetadata(id)).toEqual(meta);
            expect.soft((await listProjects()).map((project) => project.id)).toEqual([id]);
            expect.soft(await fs.readdir(path.join(root, 'secondary'))).toEqual([]);
            expect(await fs.readFile(file, 'utf8')).toBe(before);
        },
    );

    it('POST refuses a legacy secondary twin of a shipped Primary id', async () => {
        const file = await seed('primary', 'origins-2-a0', { ...PRIMARY, look: 'classic' });
        const before = await fs.readFile(file, 'utf8');
        const response = await POST(request('/api/projects', 'POST', { name: 'origins-2-a0' }));
        expect.soft(response.status).toBe(409);
        expect.soft((await listLessons('origins-2-a0')).map((lesson) => lesson.id)).toEqual(['content_sentinel']);
        expect.soft(await fs.readdir(path.join(root, 'secondary'))).toEqual([]);
        expect(await fs.readFile(file, 'utf8')).toBe(before);
    });

    it('POST refuses a Primary twin of an existing secondary id', async () => {
        const meta: ProjectMetadata = { ...PRIMARY, type: 'secondary' };
        const file = await seed('secondary', 'origins-2-a0', meta);
        const before = await fs.readFile(file, 'utf8');
        const response = await POST(request('/api/projects', 'POST', PRIMARY));
        expect.soft(response.status).toBe(409);
        expect.soft(await fs.readdir(path.join(root, 'primary'))).toEqual([]);
        expect.soft((await listProjects()).map((project) => project.id)).toEqual(['origins-2-a0']);
        expect(await fs.readFile(file, 'utf8')).toBe(before);
    });

    it('POST returns 409 for an existing same-type project and preserves its bytes', async () => {
        const file = await seed('primary', 'origins-2-a0', { ...PRIMARY, look: 'classic' });
        const before = await fs.readFile(file, 'utf8');
        const response = await POST(request('/api/projects', 'POST', PRIMARY));
        expect(response.status).toBe(409);
        expect((await response.json()).error).toBe(
            "Project 'origins-2-a0' already exists. Choose another name, or edit the existing project.",
        );
        expect(await fs.readFile(file, 'utf8')).toBe(before);
    });

    it.each(['classic', 'chibi-quest'] as const)(
        'PUT look null preserves a stored %s marker',
        async (look) => {
            const meta = { ...PRIMARY, look };
            const file = await seed('primary', 'origins-2-a0', meta);
            const response = await put('origins-2-a0', { ...PRIMARY, look: null });
            // Either reject null or treat it as omission. Neither policy may remove the marker.
            expect([200, 400]).toContain(response.status);
            const stored = JSON.parse(await fs.readFile(file, 'utf8')) as ProjectMetadata;
            expect.soft(stored).toEqual(meta);
            expect(projectLook(stored)).toBe(look);
        },
    );

    it('PUT omission keeps the shipped marker through the real print loader', async () => {
        const file = await seed('primary', 'origins-2-a0', { ...PRIMARY, look: 'classic' });
        const response = await put('origins-2-a0', PRIMARY);
        expect(response.status).toBe(200);
        expect(JSON.parse(await fs.readFile(file, 'utf8')).look).toBe('classic');
        // A project-backed book must not read packages from this nonexistent directory.
        const book = await bookLessons('origins-2', path.join(root, 'unused-packages'));
        expect(book.look).toBe('classic');
        expect(book.lessons.map(({ lesson }) => lesson.lesson_title)).toEqual(['The sentinel lesson']);
    });

    it('a new Primary project uses chibi-quest through the real print loader', async () => {
        await seed('primary', 'origins-2-a0', PRIMARY);
        const book = await bookLessons('origins-2', path.join(root, 'unused-packages'));
        expect(book.look).toBe('chibi-quest');
        expect(book.lessons).toHaveLength(1);
        expect(bookLook('origins-2')).toBe('classic');
    });

    it('PUT rejects unknown looks without changing a shipped metadata byte', async () => {
        const file = await seed('primary', 'origins-2-a0', { ...PRIMARY, look: 'classic' });
        const before = await fs.readFile(file, 'utf8');
        for (const look of ['riven-lands', '', 'Classic', 'classic ', false, 0, [], {}]) {
            const response = await put('origins-2-a0', { ...PRIMARY, look });
            expect(response.status, JSON.stringify(look)).toBe(400);
            expect(await fs.readFile(file, 'utf8')).toBe(before);
        }
    });

    it('PUT accepts a known explicit look instead of the Primary default', async () => {
        const file = await seed('primary', 'origins-2-a0', PRIMARY);
        const response = await put('origins-2-a0', { ...PRIMARY, look: 'classic' });
        expect(response.status).toBe(200);
        expect(projectLook(JSON.parse(await fs.readFile(file, 'utf8')))).toBe('classic');
    });

    it('selects the default only for the exact primary type', () => {
        expect(projectLook(PRIMARY)).toBe('chibi-quest');
        for (const type of ['secondary', undefined, null, '', 'Primary', 'PRIMARY', 'primary ', ' primary', 'storytime', 0]) {
            expect(projectLook({ ...PRIMARY, type } as ProjectMetadata), String(type)).toBe('classic');
        }
        for (const broken of [null, undefined, 'primary', 0, true, [], [{ type: 'primary' }]]) {
            expect(projectLook(broken as never)).toBe('classic');
        }
        expect(projectLook({ ...PRIMARY, look: null } as unknown as ProjectMetadata)).toBe('classic');
    });

    it('POST rejects case, whitespace, and unsupported type values without a write', async () => {
        for (const type of ['Primary', 'primary ', ' primary', 'storytime', 1]) {
            const response = await POST(request('/api/projects', 'POST', { ...PRIMARY, type }));
            expect(response.status, String(type)).toBe(400);
        }
        expect(await fs.readdir(path.join(root, 'primary'))).toEqual([]);
        expect(await fs.readdir(path.join(root, 'secondary'))).toEqual([]);
    });

    it('concurrent look-less PUTs preserve a shipped classic marker across truncation', async () => {
        const file = await seed('primary', 'origins-2-a0', { ...PRIMARY, look: 'classic' });
        const originalWrite = fs.writeFile.bind(fs);
        const truncated = signal();
        const secondWrite = signal();
        const releaseFirst = signal();
        const firstFinished = signal();
        let targetWrites = 0;

        // Intercept only the actual metadata target. Keep all reads and storage real.
        // fs.writeFile opens with "w", truncates, writes, then closes.
        // Pause that real truncate window, then let the second writer read the empty file.
        vi.spyOn(fs, 'writeFile').mockImplementation(async (target, data, options) => {
            if (target !== file || options !== 'utf-8' || typeof data !== 'string') {
                return originalWrite(target, data, options);
            }
            targetWrites++;
            if (targetWrites === 1) {
                const handle = await fs.open(file, 'w');
                truncated.resolve();
                try {
                    await releaseFirst.promise;
                    await handle.writeFile(data, options);
                } finally {
                    await handle.close();
                    firstFinished.resolve();
                }
                return;
            }
            secondWrite.resolve();
            await firstFinished.promise;
            return originalWrite(target, data, options);
        });

        const first = put('origins-2-a0', PRIMARY);
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            // Atomic replacement can finish without opening the target for truncation.
            await Promise.race([truncated.promise, first]);
            const second = put('origins-2-a0', PRIMARY);
            // A serialized implementation may block the second write until the first finishes.
            await Promise.race([
                secondWrite.promise,
                new Promise<void>((resolve) => { timer = setTimeout(resolve, 1000); }),
            ]);
            releaseFirst.resolve();
            const responses = await Promise.all([first, second]);
            expect(responses.map((response) => response.status)).toEqual([200, 200]);
            const stored = JSON.parse(await fs.readFile(file, 'utf8')) as ProjectMetadata;
            expect.soft(stored.look).toBe('classic');
            expect(projectLook(stored)).toBe('classic');
        } finally {
            if (timer) clearTimeout(timer);
            releaseFirst.resolve();
            await first;
        }
    });

    it('keeps a stored explicit look across a direct look-less write', async () => {
        await seed('primary', 'origins-2-a0', { ...PRIMARY, look: 'classic' });
        await writeProjectMetadata('origins-2-a0', PRIMARY);
        expect((await readProjectMetadata('origins-2-a0'))?.look).toBe('classic');
    });

    it('creates a new Primary project without an explicit look', async () => {
        const project = await createProject(PRIMARY);
        expect(project.metadata).toEqual(PRIMARY);
        expect(projectLook(await readProjectMetadata(project.id))).toBe('chibi-quest');
    });
});
