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

export interface WorkbookDocumentOptions {
  seriesName: string;
  seriesLevel: string;
  seriesTagline: string;
  prefaceText?: string;
  type?: 'primary' | 'secondary';
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