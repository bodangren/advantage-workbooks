import { NextRequest, NextResponse } from 'next/server';
import { renderLessonTemplate } from '@/lib/template-renderer';
import type { WorkbookLesson } from '@/lib/workbook-schema';

export async function POST(request: NextRequest) {
  try {
    const lesson: WorkbookLesson = await request.json();

    const html = await renderLessonTemplate(lesson);

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Failed to render lesson:', error);
    return NextResponse.json(
      { error: 'Failed to render lesson' },
      { status: 500 }
    );
  }
}
