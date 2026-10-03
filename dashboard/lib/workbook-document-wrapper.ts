import { TocEntry, WorkbookDocumentOptions, AnswerKeyEntry, ThemeColors } from './document-wrapper/types';
import { getThemeColors, escapeHtml, brandName } from './document-wrapper/utils';
import { getPrintStyles } from './document-wrapper/styles';
import { generateTitlePage } from './document-wrapper/sections/title-page';
import { generatePrefaceSection } from './document-wrapper/sections/preface';
import { generateTocSection } from './document-wrapper/sections/toc';
import { generateProgressTracker } from './document-wrapper/sections/progress-tracker';
import { generateGlossarySection } from './document-wrapper/sections/glossary';
import { printFontFaceCss } from './document-wrapper/print-fonts';
import { generateAnswerKeySection } from './document-wrapper/sections/answer-key';
import { generateFlashcardsSection } from './document-wrapper/sections/flashcards';
import { generateTeacherGuideSection } from './document-wrapper/sections/teacher-guide';
import { generateSelfAssessmentSection } from './document-wrapper/sections/self-assessment';
import { generateCertificateSection } from './document-wrapper/sections/certificate';
import { generateSpellingPracticeSection } from './document-wrapper/sections/spelling-practice';
import { generateGoalSettingSection } from './document-wrapper/sections/goal-setting';

// Re-export all types so existing imports don't break
export * from './document-wrapper/types';

/** CSS page size of A4 paper, for a lesson that a teacher or a parent prints. */
export const A4_PAGE = '210mm 297mm';

/** The document head: title, Paged.js, the print fonts, and the print CSS with the page size. */
function documentHead(options: WorkbookDocumentOptions, theme: ThemeColors): string {
  return `<head>
  <meta charset="UTF-8">
  <title>${brandName(options.type)} Workbook - ${escapeHtml(options.seriesName)}</title>
  <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
  <style>
${printFontFaceCss()}
  </style>
  <style>
    ${getPrintStyles(theme, { pageSize: options.pageSize, cover: !options.lessonsOnly })}
  </style>
</head>`;
}

/**
 * One lesson to print on an office or home printer (Daniel, 2026-10-03): the lesson pages, then the
 * lesson's answer key on its own last page. A4 unless options.pageSize says otherwise.
 * @param lessonHtml The rendered lesson (renderMultipleLessons with one lesson).
 * @param answerKey The lesson's answer key entry, or null for none.
 * @param options The book name, level, and type.
 * @returns The HTML document for Paged.js.
 */
export function wrapSingleLessonDocument(lessonHtml: string, answerKey: AnswerKeyEntry | null, options: WorkbookDocumentOptions): string {
  const theme = getThemeColors(options.seriesName, options.type);
  const key = answerKey ? `<div class="single-lesson-key">${generateAnswerKeySection([answerKey])}</div>` : '';
  return `<!DOCTYPE html>
<html lang="en">
${documentHead({ ...options, pageSize: options.pageSize ?? A4_PAGE, lessonsOnly: true }, theme)}
<body>
  ${lessonHtml}
  ${key}
</body>
</html>`;
}

export function wrapWorkbookDocument(
  lessonsHtml: string,
  tocEntries: TocEntry[],
  options: WorkbookDocumentOptions
): string {
  const theme = getThemeColors(options.seriesName, options.type);
  if (options.lessonsOnly) {
    return `<!DOCTYPE html>
<html lang="en">
${documentHead(options, theme)}
<body>
  ${lessonsHtml}
</body>
</html>`;
  }
  const titlePage = generateTitlePage(options);
  const prefaceSection = generatePrefaceSection(options.prefaceText);
  const tocSection = generateTocSection(tocEntries);
  const goalSettingSection = options.includeGoalSetting ? generateGoalSettingSection(theme) : '';
  const progressTrackerSection = options.includeProgressTracker ? generateProgressTracker(tocEntries, theme) : '';
  const glossarySection = generateGlossarySection(options.glossary);
  const answerKeySection = generateAnswerKeySection(options.answerKey);
  const flashcardsSection = options.includeFlashcards ? generateFlashcardsSection(options.glossary) : '';
  const teacherGuideSection = options.includeTeacherGuide ? generateTeacherGuideSection(options.teacherGuide, theme) : '';
  const spellingPracticeSection = options.includeSpellingPractice ? generateSpellingPracticeSection(options.spellingPractice, theme) : '';
  const selfAssessmentSection = options.includeSelfAssessment ? generateSelfAssessmentSection(theme) : '';
  const certificateSection = options.includeCertificate ? generateCertificateSection(options, theme) : '';

  return `<!DOCTYPE html>
<html lang="en">
${documentHead(options, theme)}
<body>
  ${titlePage}

  ${prefaceSection}

  ${tocSection}

  ${goalSettingSection}

  ${progressTrackerSection}

  ${lessonsHtml}

  ${glossarySection}

  ${answerKeySection}

  ${flashcardsSection}

  ${teacherGuideSection}
  
  ${spellingPracticeSection}

  ${selfAssessmentSection}

  ${certificateSection}
</body>
</html>`;
}