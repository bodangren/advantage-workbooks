import { z } from "zod";

// Zod Schema for Reading Advantage Workbook Data
// Matches the structure defined in schema.json

export const VocabularyItemSchema = z.object({
    word: z.string(),
    phonetic: z.string().optional(), // Made optional based on common usage, strictly generic string in JSON schema
    definition: z.string(),
});

export const ParagraphSchema = z.object({
    number: z.number().int(),
    text: z.string(),
});

export const QuestionSchema = z.object({
    number: z.number().int(),
    question: z.string(),
    options: z.array(z.string()),
});

export const MatchItemSchema = z.object({
    number: z.number().int(),
    word: z.string(),
    letter: z.string(),
    definition: z.string(),
});

export const FillItemSchema = z.object({
    number: z.number().int(),
    sentence: z.string(),
});

export const OrderQuestionSchema = z.object({
    words: z.array(z.string()),
});

export const CompletionPromptSchema = z.object({
    number: z.number().int(),
    prompt: z.string(),
});

export const McAnswerSchema = z.object({
    number: z.number().int(),
    letter: z.string(),
    text: z.string(),
});

export const OrderAnswerSchema = z.object({
    number: z.number().int(),
    sentence: z.string(),
});

export const TranslationParagraphSchema = z.object({
    label: z.string(),
    text: z.string(),
});

export const WorkbookLessonSchema = z.object({
    lesson_number: z.string().describe("e.g., 'Lesson 1'"),
    lesson_title: z.string(),
    level_name: z.string().optional(),
    cefr_level: z.string().optional(),
    article_type: z.string().optional(),
    genre: z.string().optional(),

    vocabulary: z.array(VocabularyItemSchema),

    article_image_url: z.string().url().optional(),
    article_caption: z.string().optional(),

    article_paragraphs: z.array(ParagraphSchema),

    comprehension_questions: z.array(QuestionSchema),
    short_answer_question: z.string(),

    sentence_starters: z.array(z.string()).optional(),

    vocab_match: z.array(MatchItemSchema).optional(),
    vocab_fill: z.array(FillItemSchema).optional(),
    vocab_word_bank: z.array(z.string()).optional(),

    sentence_order_questions: z.array(OrderQuestionSchema).optional(),
    sentence_completion_prompts: z.array(CompletionPromptSchema).optional(),

    writing_prompt: z.string(),

    mc_answers: z.array(McAnswerSchema).optional(),
    vocab_match_answer_string: z.string().optional(),
    vocab_fill_answer_string: z.string().optional(),
    sentence_order_answers: z.array(OrderAnswerSchema).optional(),

    translation_paragraphs: z.array(TranslationParagraphSchema).optional(),
});

// Type inference for use in TypeScript code
export type WorkbookLesson = z.infer<typeof WorkbookLessonSchema>;
