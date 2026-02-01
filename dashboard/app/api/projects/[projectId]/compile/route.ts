import { NextRequest, NextResponse } from 'next/server';
import { listLessons, readLesson } from '@/lib/filesystem';
import { renderMultipleLessons } from '@/lib/template-renderer';
import type { WorkbookLesson } from '@/lib/workbook-schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const decodedProjectId = decodeURIComponent(projectId);

    // Get all lessons in the project
    const lessons = await listLessons(decodedProjectId);

    if (lessons.length === 0) {
      return NextResponse.json(
        { error: 'No lessons found in this project' },
        { status: 404 }
      );
    }

    // Load all lessons
    const loadedLessons: WorkbookLesson[] = [];

    for (const lessonFile of lessons) {
      try {
        const lesson = await readLesson(decodedProjectId, lessonFile.id);
        loadedLessons.push(lesson as WorkbookLesson);
      } catch (error) {
        console.error(`Failed to load lesson ${lessonFile.id}:`, error);
        // Continue with other lessons even if one fails
      }
    }

    if (loadedLessons.length === 0) {
      return NextResponse.json(
        { error: 'Failed to load any lessons' },
        { status: 500 }
      );
    }

    // Render all lessons into a single HTML document
    const compiledHtml = await renderMultipleLessons(loadedLessons);

    return NextResponse.json({
      html: compiledHtml,
      lessonCount: loadedLessons.length,
      totalLessons: lessons.length,
    });
  } catch (error) {
    console.error('Failed to compile project:', error);
    return NextResponse.json(
      { error: 'Failed to compile project' },
      { status: 500 }
    );
  }
}
