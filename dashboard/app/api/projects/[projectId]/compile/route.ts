import { NextRequest, NextResponse } from 'next/server';
import { listLessons, readLesson, readProjectMetadata } from '@/lib/filesystem';
import { renderMultipleLessons } from '@/lib/template-renderer';
import { wrapWorkbookDocument, type TocEntry, type AnswerKeyEntry } from '@/lib/workbook-document-wrapper';
import { getPrefaceByCefrLevel } from '@/lib/preface-loader';
import type { WorkbookLesson } from '@/lib/workbook-schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeFlashcards = searchParams.get('includeFlashcards') !== 'false';
    const includeProgressTracker = searchParams.get('includeProgressTracker') !== 'false';

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

    // Extract, deduplicate, and sort glossary
    const glossaryMap = new Map<string, { word: string; phonetic: string; definition: string }>();
    loadedLessons.forEach(lesson => {
      if (Array.isArray(lesson.vocabulary)) {
        lesson.vocabulary.forEach(v => {
          if (v && v.word) {
            const key = v.word.trim().toLowerCase();
            if (!glossaryMap.has(key)) {
              glossaryMap.set(key, {
                word: v.word.trim(),
                phonetic: v.phonetic?.trim() || '',
                definition: v.definition?.trim() || ''
              });
            }
          }
        });
      }
    });

    const glossary = Array.from(glossaryMap.values()).sort((a, b) => 
      a.word.localeCompare(b.word)
    );

    // Extract answer keys
    const answerKey: AnswerKeyEntry[] = loadedLessons.map(lesson => {
      const entry: AnswerKeyEntry = {
        lessonTitle: `${lesson.lesson_number ? lesson.lesson_number + ': ' : ''}${lesson.lesson_title || 'Untitled'}`,
        mcAnswers: lesson.mc_answers,
        vocabMatchAnswerString: lesson.vocab_match_answer_string,
        vocabFillAnswerString: lesson.vocab_fill_answer_string,
        sentenceOrderAnswers: lesson.sentence_order_answers,
        shortAnswerHint: lesson.short_answer_hint,
      };
      
      const hasAnswers = (entry.mcAnswers && entry.mcAnswers.length > 0) || 
                         entry.vocabMatchAnswerString || 
                         entry.vocabFillAnswerString || 
                         (entry.sentenceOrderAnswers && entry.sentenceOrderAnswers.length > 0) || 
                         entry.shortAnswerHint;
                         
      return hasAnswers ? entry : null;
    }).filter((e): e is AnswerKeyEntry => e !== null);

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
      type: metadata?.type,
      glossary: glossary.length > 0 ? glossary : undefined,
      answerKey: answerKey.length > 0 ? answerKey : undefined,
      includeFlashcards,
      includeProgressTracker,
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
