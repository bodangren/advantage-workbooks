import { NextRequest, NextResponse } from 'next/server';
import { readLesson, writeLesson } from '@/lib/filesystem';
import { augmentLesson } from '@/lib/ai-augmentor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; lessonId: string }> }
) {
  try {
    const { projectId, lessonId } = await params;

    // Get API key from environment or request header
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
                   request.headers.get('x-google-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in environment.' },
        { status: 500 }
      );
    }

    // Read the current lesson
    const lesson = await readLesson(projectId, lessonId);

    // Augment the lesson with AI-generated pedagogical content
    const augmented = await augmentLesson(lesson, apiKey);

    // Save the augmented lesson back to disk
    await writeLesson(projectId, lessonId, augmented);

    return NextResponse.json({
      success: true,
      lesson: augmented,
      message: 'Lesson pedagogy auto-filled successfully!'
    });
  } catch (error) {
    console.error('Augment lesson error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to augment lesson';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
