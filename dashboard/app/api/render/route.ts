import { NextRequest, NextResponse } from 'next/server';
import { renderLessonTemplate } from '@/lib/template-renderer';
import { readProjectMetadata } from '@/lib/filesystem';
import type { WorkbookLesson } from '@/lib/workbook-schema';

export async function POST(request: NextRequest) {
  try {
    const { lesson, projectId } = await request.json();

    // Read project metadata if projectId is provided
    let renderOptions;
    if (projectId) {
      const metadata = await readProjectMetadata(projectId);
      if (metadata) {
        renderOptions = {
          seriesName: `${metadata.seriesName} ${metadata.levelNumber}`,
          seriesLevel: metadata.cefrLevel,
        };
      }
    }

    const html = await renderLessonTemplate(lesson, renderOptions);

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Failed to render lesson:', error);
    return NextResponse.json(
      { error: 'Failed to render lesson' },
      { status: 500 }
    );
  }
}
