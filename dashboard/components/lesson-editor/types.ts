import type { WorkbookLesson, ArticleImage } from '@/lib/workbook-schema';

export interface BasicInfoEditorProps {
  lesson_number?: string;
  lesson_title?: string;
  level_name?: string;
  cefr_level?: string;
  genre?: string;
  onChange: (field: keyof Pick<WorkbookLesson, 'lesson_number' | 'lesson_title' | 'level_name' | 'cefr_level' | 'genre'>, value: string) => void;
}

export interface ArticleEditorProps {
  article_url?: string;
  article_caption?: string;
  article_image_url?: string;
  article_images?: ArticleImage[];
  article_paragraphs?: { number: number; text: string }[];
  projectId: string;
  onChange: (field: 'article_url' | 'article_caption' | 'article_image_url' | 'article_images' | 'article_paragraphs', value: string | ArticleImage[] | { number: number; text: string }[]) => void;
}

export interface VocabularyEditorProps {
  vocabulary?: { word: string; phonetic?: string; definition: string; thai_definition?: string }[];
  onChange: (field: 'vocabulary', value: { word: string; phonetic?: string; definition: string; thai_definition?: string }[]) => void;
}

export interface PedagogicalConnectorsEditorProps {
  connection_question?: string;
  grammar_search_term?: string;
  discussion_question?: string;
  onChange: (field: 'connection_question' | 'grammar_search_term' | 'discussion_question', value: string) => void;
}

export interface ComprehensionQuestionsEditorProps {
  comprehension_questions?: { number: number; question: string; options: string[] }[];
  short_answer_question?: string;
  short_answer_hint?: string;
  onChange: (
    field: 'comprehension_questions' | 'short_answer_question' | 'short_answer_hint',
    value: { number: number; question: string; options: string[] }[] | string
  ) => void;
}

export type LessonEditorSectionProps<T extends keyof WorkbookLesson = keyof WorkbookLesson> = {
  value: WorkbookLesson[T];
  onChange: (field: T, value: WorkbookLesson[T]) => void;
};