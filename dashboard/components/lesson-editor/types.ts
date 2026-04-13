import type { WorkbookLesson } from '@/lib/workbook-schema';

export interface BasicInfoEditorProps {
  lesson_number?: string;
  lesson_title?: string;
  level_name?: string;
  cefr_level?: string;
  genre?: string;
  onChange: (field: keyof Pick<WorkbookLesson, 'lesson_number' | 'lesson_title' | 'level_name' | 'cefr_level' | 'genre'>, value: string) => void;
}

export type LessonEditorSectionProps<T extends keyof WorkbookLesson = keyof WorkbookLesson> = {
  value: WorkbookLesson[T];
  onChange: (field: T, value: WorkbookLesson[T]) => void;
};