import { NextRequest, NextResponse } from 'next/server';
import { listLessons, readLesson, readProjectMetadata } from '@/lib/filesystem';
import { compileTeacherManual } from '@/lib/teacher-manual/compiler';
import type { WorkbookLesson } from '@/lib/workbook-schema';
import type { SupportedLanguage } from '@/lib/teacher-manual/i18n';

const VALID_LANGUAGES: SupportedLanguage[] = ['en', 'th'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const decodedProjectId = decodeURIComponent(projectId);

    const langParam = request.nextUrl.searchParams.get('lang') || 'en';
    const lang: SupportedLanguage = VALID_LANGUAGES.includes(langParam as SupportedLanguage)
      ? (langParam as SupportedLanguage)
      : 'en';

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
      lessons.map(async (lessonFile) => {
        try {
          const lesson = await readLesson(decodedProjectId, lessonFile.id) as WorkbookLesson;
          return lesson;
        } catch (error) {
          console.error(`Failed to load lesson ${lessonFile.id}:`, error);
          return null;
        }
      })
    );

    const loadedLessons = lessonResults.filter((l): l is WorkbookLesson => l !== null);

    if (loadedLessons.length === 0) {
      return NextResponse.json(
        { error: 'Failed to load any lessons' },
        { status: 500 }
      );
    }

    const seriesName = metadata?.seriesName || 'Reading Advantage';
    const levelNumber = metadata?.levelNumber || '';
    const cefrLevel = metadata?.cefrLevel || 'A1';
    const type = metadata?.type || 'primary';

    const result = compileTeacherManual(
      loadedLessons,
      `${seriesName}${levelNumber ? ` ${levelNumber}` : ''}`,
      levelNumber,
      cefrLevel,
      type,
      lang
    );

    return NextResponse.json({
      html: result.html,
      lessonCount: result.lessonCount,
      totalLessons: lessons.length,
      lang,
    });
  } catch (error) {
    console.error('Failed to compile teacher manual:', error);
    return NextResponse.json(
      { error: 'Failed to compile teacher manual' },
      { status: 500 }
    );
  }
}
