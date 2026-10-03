import { TocEntry, WorkbookDocumentOptions } from './document-wrapper/types';
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

export function wrapWorkbookDocument(
  lessonsHtml: string,
  tocEntries: TocEntry[],
  options: WorkbookDocumentOptions
): string {
  const theme = getThemeColors(options.seriesName, options.type);
  if (options.lessonsOnly) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${brandName(options.type)} Workbook - ${escapeHtml(options.seriesName)}</title>
  <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
  <style>
${printFontFaceCss()}
  </style>
  <style>
    ${getPrintStyles(theme)}
  </style>
</head>
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
<head>
  <meta charset="UTF-8">
  <title>${brandName(options.type)} Workbook - ${escapeHtml(options.seriesName)}</title>
  <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
  <style>
${printFontFaceCss()}
  </style>
  <style>
    ${getPrintStyles(theme)}
  </style>
</head>
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