import { NextRequest, NextResponse } from 'next/server';
import { listLessons, writeLesson } from '@/lib/filesystem';
import type { WorkbookLesson } from '@/lib/workbook-schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const lessons = await listLessons(projectId);
    return NextResponse.json(lessons);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to list lessons';
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('not found') ? 404 : 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Lesson title is required' },
        { status: 400 }
      );
    }

    // Generate a slug for the lesson ID
    const baseId = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseId) {
      return NextResponse.json(
        { error: 'Invalid lesson title' },
        { status: 400 }
      );
    }

    const lessonId = `${baseId}_workbook`;

    // Create a basic lesson object
    const newLesson: WorkbookLesson = {
      lesson_title: title,
      lesson_number: ((await listLessons(projectId)).length + 1).toString(),
      genre: 'Non-fiction',
      article_type: 'Informational',
      vocabulary: [],
      comprehension_questions: [],
      article_paragraphs: [
        { number: 1, text: 'Start writing your article here...' }
      ],
      short_answer_question: 'What is the main idea of this article?',
      writing_prompt: 'Write a summary of what you learned today.'
    };

    await writeLesson(projectId, lessonId, newLesson);

    return NextResponse.json({
      id: lessonId,
      name: title,
      path: `${projectId}/${lessonId}.json`
    });
  } catch (error) {
    console.error('Failed to create lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
