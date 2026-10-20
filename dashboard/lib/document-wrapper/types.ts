export interface TocEntry {
  id: string;
  title: string;
  genre?: string;
  articleType?: string;
}

export interface GlossaryEntry {
  word: string;
  phonetic: string;
  definition: string;
  thaiDefinition?: string;
}

export interface McAnswer {
  number: number;
  letter: string;
  text: string;
}

export interface OrderAnswer {
  number: number;
  sentence: string;
}

export interface AnswerKeyEntry {
  lessonTitle: string;
  mcAnswers?: McAnswer[];
  vocabMatchAnswerString?: string;
  vocabFillAnswerString?: string;
  sentenceOrderAnswers?: OrderAnswer[];
  shortAnswerHint?: string;
}

export interface TeacherGuideEntry {
  lessonTitle: string;
  genre?: string;
  articleType?: string;
  cefrLevel?: string;
  vocabulary: GlossaryEntry[];
  writingPrompt?: string;
  comprehensionQuestions?: { question: string; options?: string[]; answer?: string }[];
}

export interface SpellingPracticeEntry {
  lessonTitle: string;
  vocabulary: GlossaryEntry[];
}

/**
 * The print look of a book (track primary_v2_look_20261020). `classic` is the look of Origins 1 to
 * Quest 4; `chibi-quest` is the Chibi Quest look of the v2 app, for Quest 5 to Adventure 9.3.
 */
export type WorkbookLook = 'classic' | 'chibi-quest';

export interface WorkbookDocumentOptions {
  seriesName: string;
  seriesLevel: string;
  seriesTagline: string;
  prefaceText?: string;
  type?: 'primary' | 'secondary';
  /** Only the lesson pages (for an insert): no cover, preface, contents, or back matter. */
  lessonsOnly?: boolean;
  /** CSS page size; the book page (210mm 285mm) when absent. */
  pageSize?: string;
  /** The print look; `classic` when absent. */
  look?: WorkbookLook;
  glossary?: GlossaryEntry[];
  answerKey?: AnswerKeyEntry[];
  teacherGuide?: TeacherGuideEntry[];
  spellingPractice?: SpellingPracticeEntry[];
  includeFlashcards?: boolean;
  includeProgressTracker?: boolean;
  includeCertificate?: boolean;
  includeTeacherGuide?: boolean;
  includeSelfAssessment?: boolean;
  includeSpellingPractice?: boolean;
  includeGoalSetting?: boolean;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  gradient: string;
}