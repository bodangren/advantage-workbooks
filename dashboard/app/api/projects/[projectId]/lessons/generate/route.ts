import { NextRequest, NextResponse } from 'next/server';
import { writeLesson } from '@/lib/filesystem';
import { generateLessonFromSource, LessonGenerationError } from '@/lib/lesson-generator';
import { WorkbookLessonSchema } from '@/lib/workbook-schema';

const FETCH_TIMEOUT_MS = 10000;

function stripHtmlTags(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function generateLessonId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `generated-lesson-${timestamp}-${random}_workbook`;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        const body = await request.json();
        const { source_type, source, cefr_level } = body;

        if (!source_type || !['text', 'url'].includes(source_type)) {
            return NextResponse.json(
                { error: 'Invalid source_type. Must be "text" or "url".' },
                { status: 400 }
            );
        }

        if (!source || typeof source !== 'string') {
            return NextResponse.json(
                { error: 'Missing required field: source.' },
                { status: 400 }
            );
        }

        if (!cefr_level || typeof cefr_level !== 'string') {
            return NextResponse.json(
                { error: 'Missing required field: cefr_level.' },
                { status: 400 }
            );
        }

        let sourceText = source;

        if (source_type === 'url') {
            let url: URL;
            try {
                url = new URL(source);
            } catch {
                return NextResponse.json(
                    { error: 'Invalid URL format.' },
                    { status: 400 }
                );
            }

            if (!['http:', 'https:'].includes(url.protocol)) {
                return NextResponse.json(
                    { error: 'Invalid URL scheme. Only http and https are supported.' },
                    { status: 400 }
                );
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

            try {
                const response = await fetch(url.toString(), {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    return NextResponse.json(
                        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
                        { status: 400 }
                    );
                }

                const html = await response.text();
                sourceText = stripHtmlTags(html);

                if (sourceText.length < 50) {
                    return NextResponse.json(
                        { error: 'URL content is too short or empty after extracting text.' },
                        { status: 400 }
                    );
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return NextResponse.json(
                        { error: 'URL fetch timed out. Please try again.' },
                        { status: 400 }
                    );
                }
                return NextResponse.json(
                    { error: `Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
                    { status: 400 }
                );
            } finally {
                clearTimeout(timeoutId);
            }
        }

        const lessonId = generateLessonId();

        const generatedLesson = await generateLessonFromSource(sourceText, cefr_level);

        const validationResult = WorkbookLessonSchema.safeParse(generatedLesson);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: `Generated lesson does not match schema: ${validationResult.error.message}` },
                { status: 422 }
            );
        }

        await writeLesson(projectId, lessonId, validationResult.data);

        return NextResponse.json({
            success: true,
            lesson_id: lessonId,
            message: 'Lesson generated successfully!',
        }, { status: 201 });

    } catch (error) {
        console.error('Generate lesson error:', error);

        if (error instanceof LessonGenerationError) {
            return NextResponse.json(
                { error: `Lesson generation failed: ${error.message}` },
                { status: 422 }
            );
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate lesson' },
            { status: 500 }
        );
    }
}