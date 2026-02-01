import { NextRequest, NextResponse } from 'next/server';
import { readLesson, writeLesson } from '@/lib/filesystem';
import { WorkbookLessonSchema } from '@/lib/workbook-schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; lessonId: string }> }
) {
  try {
    const { projectId, lessonId } = await params;
    const lesson = await readLesson(projectId, lessonId);
    return NextResponse.json(lesson);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to read lesson';
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('not found') ? 404 : 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; lessonId: string }> }
) {
  try {
    const { projectId, lessonId } = await params;
    const body = await request.json();

    const validationResult = WorkbookLessonSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid lesson data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    await writeLesson(projectId, lessonId, validationResult.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to write lesson';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
