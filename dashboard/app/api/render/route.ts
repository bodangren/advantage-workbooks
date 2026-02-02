import { NextRequest, NextResponse } from 'next/server';
import { renderLessonTemplate } from '@/lib/template-renderer';
import { readProjectMetadata } from '@/lib/filesystem';
import type { WorkbookLesson } from '@/lib/workbook-schema';

export async function POST(request: NextRequest) {
  try {
    const { lesson, projectId } = await request.json();

    console.log('[render] projectId:', projectId);

    // Read project metadata if projectId is provided
    let renderOptions;
    if (projectId) {
      // Decode the projectId since it may be URL-encoded
      const decodedProjectId = decodeURIComponent(projectId);
      console.log('[render] decodedProjectId:', decodedProjectId);

      const metadata = await readProjectMetadata(decodedProjectId);
      console.log('[render] metadata:', metadata);
      if (metadata) {
        renderOptions = {
          seriesName: `${metadata.seriesName} ${metadata.levelNumber}`,
          seriesLevel: metadata.cefrLevel,
        };
        console.log('[render] renderOptions:', renderOptions);
      }
    } else {
      console.log('[render] No projectId provided, using defaults');
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
