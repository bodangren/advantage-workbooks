import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { NextRequest } from 'next/server';
import { projectLook } from '@/lib/look';
import { createProject, readProjectMetadata, writeProjectMetadata } from '@/lib/filesystem';
import { PUT } from '@/app/api/projects/[projectId]/metadata/route';
import type { ProjectMetadata } from '@/lib/filesystem';

// Track primary_v2_look_20261020, story S8, Green r4: the chibi-quest default reaches
// Primary Advantage projects only. A Reading Advantage project, a project with no type,
// and a damaged project.json keep classic. A create never overwrites an existing
// project, and a write never drops the look of a project.

const REPO = path.resolve(process.cwd(), '..');
const SECONDARY = path.join(REPO, 'secondary', 'origins-3.1-a1', 'project.json');

describe('the look guards', () => {
    it('gives classic to a Reading Advantage project with no look', () => {
        const meta = JSON.parse(fs.readFileSync(SECONDARY, 'utf8')) as ProjectMetadata;
        expect(meta.type).toBe('secondary');
        expect(meta.look).toBe(undefined);
        expect(projectLook(meta)).toBe('classic');
    });

    it('gives classic to a project with no type', () => {
        expect(projectLook({ seriesName: 'Origins', levelNumber: '1', cefrLevel: 'A0' })).toBe('classic');
    });

    it('gives classic to a project.json that is not an object', () => {
        for (const broken of ['a string', 42, true, ['classic']]) {
            expect(projectLook(broken as never)).toBe('classic');
        }
    });

    it('gives chibi-quest to a new Primary project with no look', () => {
        expect(projectLook({ seriesName: 'Origins', levelNumber: '1', cefrLevel: 'A0', type: 'primary' })).toBe('chibi-quest');
    });

    it('keeps an explicit look, and refuses an unknown look', () => {
        expect(projectLook({ seriesName: 'Origins', levelNumber: '1', cefrLevel: 'A0', type: 'primary', look: 'classic' })).toBe('classic');
        expect(projectLook({ seriesName: 'Origins', levelNumber: '1', cefrLevel: 'A0', type: 'primary', look: 'chibi-quest' })).toBe('chibi-quest');
        expect(() => projectLook({ seriesName: 'Origins', levelNumber: '1', cefrLevel: 'A0', type: 'primary', look: 'riven-lands' as never })).toThrow(/origins-1/);
    });
});

describe('the project writers', () => {
    let root: string;
    let savedRoot: string | undefined;

    const project = async (type: 'primary' | 'secondary', id: string, meta: Record<string, unknown>) => {
        const dir = path.join(root, type, id);
        await fsp.mkdir(dir, { recursive: true });
        await fsp.writeFile(path.join(dir, 'project.json'), JSON.stringify(meta, null, 2));
        return dir;
    };

    beforeAll(async () => {
        savedRoot = process.env.WORKBOOKS_ROOT;
        root = await fsp.mkdtemp(path.join(os.tmpdir(), 'look-guards-'));
        process.env.WORKBOOKS_ROOT = root;
        await project('primary', 'origins-2-a0', { seriesName: 'Origins', levelNumber: '2', cefrLevel: 'A0', type: 'primary', look: 'classic' });
        await project('secondary', 'origins-3.1-a1', { seriesName: 'Origins', levelNumber: '3.1', cefrLevel: 'A1', type: 'secondary', look: 'classic' });
        await project('primary', 'quest-4-a1', { seriesName: 'Quest', levelNumber: '4', cefrLevel: 'A1-', type: 'primary', look: 'classic' });
    });

    afterAll(async () => {
        if (savedRoot === undefined) delete process.env.WORKBOOKS_ROOT;
        else process.env.WORKBOOKS_ROOT = savedRoot;
        await fsp.rm(root, { recursive: true, force: true });
    });

    it('refuses to create a Primary project whose folder exists, and leaves its file unchanged', async () => {
        const file = path.join(root, 'primary', 'origins-2-a0', 'project.json');
        const before = await fsp.readFile(file, 'utf8');
        await expect(createProject({ type: 'primary', seriesName: 'Origins', levelNumber: '2', cefrLevel: 'A0' })).rejects.toThrow(/already exists/);
        expect(await fsp.readFile(file, 'utf8')).toBe(before);
    });

    it('refuses to create a secondary project whose folder exists, and leaves its file unchanged', async () => {
        const file = path.join(root, 'secondary', 'origins-3.1-a1', 'project.json');
        const before = await fsp.readFile(file, 'utf8');
        await expect(createProject('origins-3.1-a1')).rejects.toThrow(/already exists/);
        expect(await fsp.readFile(file, 'utf8')).toBe(before);
    });

    it('keeps the look of a project when a write has none', async () => {
        await writeProjectMetadata('quest-4-a1', { seriesName: 'Quest', levelNumber: '4', cefrLevel: 'A1-', type: 'primary' });
        const meta = await readProjectMetadata('quest-4-a1');
        expect(meta?.look).toBe('classic');
    });

    it('refuses an unknown look in the metadata route', async () => {
        const res = await PUT(
            new NextRequest('http://localhost/api/projects/quest-4-a1/metadata', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seriesName: 'Quest', levelNumber: '4', cefrLevel: 'A1-', type: 'primary', look: 'riven-lands' }),
            }),
            { params: Promise.resolve({ projectId: 'quest-4-a1' }) },
        );
        expect(res.status).toBe(400);
    });

    it('writes a known look in the metadata route', async () => {
        const res = await PUT(
            new NextRequest('http://localhost/api/projects/quest-4-a1/metadata', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seriesName: 'Quest', levelNumber: '4', cefrLevel: 'A1-', type: 'primary', look: 'chibi-quest' }),
            }),
            { params: Promise.resolve({ projectId: 'quest-4-a1' }) },
        );
        expect(res.status).toBe(200);
        expect((await readProjectMetadata('quest-4-a1'))?.look).toBe('chibi-quest');
    });
});
