import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the lesson generator
vi.mock('@/lib/lesson-generator', () => {
    return {
        generateLessonFromSource: vi.fn(),
        LessonGenerationError: class LessonGenerationError extends Error {
            constructor(message: string) {
                super(message);
                this.name = 'LessonGenerationError';
            }
        },
    };
});

// Mock the filesystem module
vi.mock('@/lib/filesystem', () => {
    return {
        writeLesson: vi.fn(),
        resolveProjectPath: vi.fn().mockResolvedValue({ fullPath: '/fake/path' }),
    };
});

import { generateLessonFromSource } from '@/lib/lesson-generator';
import { writeLesson } from '@/lib/filesystem';

describe('POST /api/projects/[projectId]/lessons/generate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockLesson = {
        lesson_title: 'Test Lesson',
        cefr_level: 'B1',
        vocabulary: [
            { word: 'test', definition: 'a test' },
        ],
        article_paragraphs: [
            { number: 1, text: 'Test paragraph.' },
        ],
        comprehension_questions: [
            { number: 1, question: 'Test question?', options: ['A', 'B', 'C', 'D'] },
        ],
        short_answer_question: 'Short answer?',
        writing_prompt: 'Write something.',
    };

    it('should return 201 with lesson id on successful text generation', async () => {
        vi.mocked(generateLessonFromSource).mockResolvedValue(mockLesson as any);

        const request = new NextRequest('http://localhost/api/projects/test-project/lessons/generate', {
            method: 'POST',
            body: JSON.stringify({
                source_type: 'text',
                source: 'This is a valid source text that is long enough to pass validation.',
                cefr_level: 'B1',
            }),
        });

        const response = await POST(request, { params: Promise.resolve({ projectId: 'test-project' }) });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.lesson_id).toBeDefined();
        expect(generateLessonFromSource).toHaveBeenCalledWith(
            'This is a valid source text that is long enough to pass validation.',
            'B1'
        );
        expect(writeLesson).toHaveBeenCalled();
    });

    it('should return 201 with lesson id on successful URL fetch', async () => {
        vi.mocked(generateLessonFromSource).mockResolvedValue(mockLesson as any);

        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<html><body><p>Article content here that should be long enough to pass validation checks.</p></body></html>'),
        });
        const spy = vi.spyOn(global, 'fetch').mockImplementation(mockFetch);

        const request = new NextRequest('http://localhost/api/projects/test-project/lessons/generate', {
            method: 'POST',
            body: JSON.stringify({
                source_type: 'url',
                source: 'https://example.com/article',
                cefr_level: 'B1',
            }),
        });

        const response = await POST(request, { params: Promise.resolve({ projectId: 'test-project' }) });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.lesson_id).toBeDefined();
        expect(spy).toHaveBeenCalled();

        spy.mockRestore();
    });

    it('should return 400 for non-http URL scheme', async () => {
        const request = new NextRequest('http://localhost/api/projects/test-project/lessons/generate', {
            method: 'POST',
            body: JSON.stringify({
                source_type: 'url',
                source: 'file:///etc/passwd',
                cefr_level: 'B1',
            }),
        });

        const response = await POST(request, { params: Promise.resolve({ projectId: 'test-project' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Invalid URL scheme');
    });

    it('should return 400 for upstream fetch timeout', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('Timeout'));
        global.fetch = mockFetch;

        const request = new NextRequest('http://localhost/api/projects/test-project/lessons/generate', {
            method: 'POST',
            body: JSON.stringify({
                source_type: 'url',
                source: 'https://slow-example.com/article',
                cefr_level: 'B1',
            }),
        });

        const response = await POST(request, { params: Promise.resolve({ projectId: 'test-project' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.toLowerCase()).toContain('timeout');
    });

    it('should return 422 when generated lesson fails schema validation', async () => {
        // Return something that doesn't match the schema
        vi.mocked(generateLessonFromSource).mockResolvedValue({
            invalid: 'structure',
            missing: 'required fields',
        } as any);

        const request = new NextRequest('http://localhost/api/projects/test-project/lessons/generate', {
            method: 'POST',
            body: JSON.stringify({
                source_type: 'text',
                source: 'This is valid source text that will be used to generate a lesson.',
                cefr_level: 'B1',
            }),
        });

        const response = await POST(request, { params: Promise.resolve({ projectId: 'test-project' }) });
        const data = await response.json();

        expect(response.status).toBe(422);
        expect(data.error).toBeDefined();
    });

    it('should return 400 when source text is missing', async () => {
        const request = new NextRequest('http://localhost/api/projects/test-project/lessons/generate', {
            method: 'POST',
            body: JSON.stringify({
                source_type: 'text',
                cefr_level: 'B1',
            }),
        });

        const response = await POST(request, { params: Promise.resolve({ projectId: 'test-project' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('source');
    });

    it('should return 400 when source_type is invalid', async () => {
        const request = new NextRequest('http://localhost/api/projects/test-project/lessons/generate', {
            method: 'POST',
            body: JSON.stringify({
                source_type: 'invalid',
                source: 'Some source text here.',
                cefr_level: 'B1',
            }),
        });

        const response = await POST(request, { params: Promise.resolve({ projectId: 'test-project' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('source_type');
    });
});