import { NextRequest, NextResponse } from 'next/server';
import { listLessons, readLesson, readProjectMetadata } from '@/lib/filesystem';
import { renderMultipleLessons } from '@/lib/template-renderer';
import { wrapWorkbookDocument, type TocEntry } from '@/lib/workbook-document-wrapper';
import { getPrefaceByCefrLevel } from '@/lib/preface-loader';
import type { WorkbookLesson } from '@/lib/workbook-schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const decodedProjectId = decodeURIComponent(projectId);

    const [lessons, metadata] = await Promise.all([
      listLessons(decodedProjectId),
      readProjectMetadata(decodedProjectId),
    ]);

    if (lessons.length === 0) {
      return NextResponse.json(
        { error: 'No lessons found in this project' },
        { status: 404 }
      );
    }

    const lessonResults = await Promise.all(
      lessons.map(async (lessonFile, i) => {
        try {
          const lesson = await readLesson(decodedProjectId, lessonFile.id) as WorkbookLesson;
          const tocEntry: TocEntry = {
            id: `lesson-${i}`,
            title: `${lesson.lesson_number || `Lesson ${i + 1}`}: ${lesson.lesson_title || 'Untitled'}`,
            genre: lesson.genre,
            articleType: lesson.article_type,
          };
          return { lesson, tocEntry };
        } catch (error) {
          console.error(`Failed to load lesson ${lessonFile.id}:`, error);
          return null;
        }
      })
    );

    const successful = lessonResults.filter((r): r is NonNullable<typeof r> => r !== null);

    if (successful.length === 0) {
      return NextResponse.json(
        { error: 'Failed to load any lessons' },
        { status: 500 }
      );
    }

    const loadedLessons = successful.map(r => r.lesson);
    const tocEntries = successful.map(r => r.tocEntry);

    const seriesName = metadata?.seriesName || 'Reading Advantage';
    const levelNumber = metadata?.levelNumber || '';
    const cefrLevel = metadata?.cefrLevel || 'A1';
    const seriesTagline = 'Learning Made Fun';

    const renderOptions = metadata ? {
      seriesName,
      seriesLevel: cefrLevel,
      type: metadata.type,
    } : undefined;

    const lessonsHtml = await renderMultipleLessons(loadedLessons, renderOptions);

    const prefaceData = getPrefaceByCefrLevel(cefrLevel);

    const fullHtml = wrapWorkbookDocument(lessonsHtml, tocEntries, {
      seriesName: `${seriesName}${levelNumber ? ` ${levelNumber}` : ''}`,
      seriesLevel: cefrLevel,
      seriesTagline,
      prefaceText: prefaceData?.text,
    });

    return NextResponse.json({
      html: fullHtml,
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
