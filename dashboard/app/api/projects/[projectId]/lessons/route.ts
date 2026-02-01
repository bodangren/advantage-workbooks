import { NextResponse } from 'next/server';
import { listLessons } from '@/lib/filesystem';

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
