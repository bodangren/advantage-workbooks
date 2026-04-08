import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateLessonFromSource, LessonGenerationError } from '../lib/lesson-generator';
import { WorkbookLessonSchema } from '../lib/workbook-schema';
import { GoogleGenAI } from '@google/genai';

// Mock the module
vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: vi.fn(),
    };
});

describe('generateLessonFromSource', () => {
    const mockGenerateContent = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock the constructor of GoogleGenAI
        (GoogleGenAI as unknown as any).mockImplementation(function(this: any) {
            return {
                models: {
                    generateContent: mockGenerateContent,
                },
            };
        });
    });

    const validLessonJson = {
        lesson_title: 'The Discovery of Fire',
        cefr_level: 'B1',
        vocabulary: [
            { word: 'fire', phonetic: '/faɪər/', definition: 'the state of burning', thai_definition: 'ไฟ' },
            { word: 'discover', phonetic: '/dɪˈskʌvər/', definition: 'to find something for the first time', thai_definition: 'ค้นพบ' },
            { word: 'ancient', phonetic: '/ˈeɪnʃənt/', definition: 'belonging to the very distant past', thai_definition: 'โบราณ' },
        ],
        article_paragraphs: [
            { number: 1, text: 'Fire was discovered millions of years ago.' },
            { number: 2, text: 'Early humans learned to control fire.' },
        ],
        comprehension_questions: [
            { number: 1, question: 'When was fire discovered?', options: ['A. Yesterday', 'B. Millions of years ago', 'C. Last week', 'D. Never'] },
            { number: 2, question: 'What did early humans learn to do?', options: ['A. Ignore fire', 'B. Control fire', 'C. Fear fire', 'D. Create fire'] },
        ],
        short_answer_question: 'Why was the discovery of fire important?',
        short_answer_hint: 'Think about warmth and cooking.',
        writing_prompt: 'Write a paragraph about an important discovery in history.',
        writing_plan_prompts: ['What did you learn?', 'Why is it important?', 'How did it change things?'],
        reflection_focus: 'What discovery would you like to have made?',
        connection_question: 'What do you know about fire?',
        grammar_search_term: 'Past simple vs present perfect',
        discussion_question: 'What other discoveries changed human history?',
        writing_sentence_frames: ['I believe that...', 'In my opinion...'],
    };

    it('should generate a lesson that passes WorkbookLessonSchema validation', async () => {
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify(validLessonJson),
        });

        const result = await generateLessonFromSource(
            'Fire was discovered millions of years ago. Early humans learned to control fire for warmth and cooking.',
            'B1'
        );

        // The result should be a valid WorkbookLesson
        const validation = WorkbookLessonSchema.safeParse(result);
        expect(validation.success).toBe(true);
    });

    it('should include required fields in generated lesson', async () => {
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify(validLessonJson),
        });

        const result = await generateLessonFromSource('This is a sample article text about discovery that is long enough.', 'B1');

        expect(result.lesson_title).toBeDefined();
        expect(result.vocabulary).toBeDefined();
        expect(result.vocabulary.length).toBeGreaterThan(0);
        expect(result.article_paragraphs).toBeDefined();
        expect(result.comprehension_questions).toBeDefined();
        expect(result.short_answer_question).toBeDefined();
        expect(result.writing_prompt).toBeDefined();
    });

    it('should generate vocabulary with word and definition', async () => {
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify(validLessonJson),
        });

        const result = await generateLessonFromSource('This is a sample text about ancient discoveries and early humans.', 'B1');

        for (const vocab of result.vocabulary) {
            expect(vocab.word).toBeDefined();
            expect(typeof vocab.word).toBe('string');
            expect(vocab.definition).toBeDefined();
            expect(typeof vocab.definition).toBe('string');
        }
    });

    it('should generate comprehension questions with 4 options each', async () => {
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify(validLessonJson),
        });

        const result = await generateLessonFromSource('This is a sample text that should be long enough for testing.', 'B1');

        for (const question of result.comprehension_questions) {
            expect(question.options).toBeDefined();
            expect(question.options.length).toBe(4);
        }
    });

    it('should call Gemini API with correct parameters', async () => {
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify(validLessonJson),
        });

        await generateLessonFromSource('This is a test article text that is long enough for validation.', 'B1');

        expect(mockGenerateContent).toHaveBeenCalledWith(
            expect.objectContaining({
                model: expect.any(String),
                contents: expect.any(String),
            })
        );
    });

    it('should throw LessonGenerationError when Gemini returns malformed JSON', async () => {
        mockGenerateContent.mockResolvedValue({
            text: 'Invalid JSON { not properly formatted',
        });

        await expect(
            generateLessonFromSource('Sample text.', 'B1')
        ).rejects.toThrow(LessonGenerationError);
    });

    it('should throw LessonGenerationError when source text is under 50 characters', async () => {
        await expect(
            generateLessonFromSource('Too short.', 'B1')
        ).rejects.toThrow(LessonGenerationError);
    });

    it('should include CEFR level in generated lesson when provided', async () => {
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify({ ...validLessonJson, cefr_level: 'C1' }),
        });

        const result = await generateLessonFromSource('Sample article text that is long enough to pass validation checks.', 'C1');

        expect(result.cefr_level).toBe('C1');
    });

    it('should generate pedagogical metadata fields', async () => {
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify(validLessonJson),
        });

        const result = await generateLessonFromSource('Sample text about ancient history and discoveries of early humans.', 'B1');

        // Check pedagogical fields are generated
        expect(result.connection_question).toBeDefined();
        expect(result.discussion_question).toBeDefined();
        expect(result.grammar_search_term).toBeDefined();
        expect(result.writing_plan_prompts).toBeDefined();
        expect(result.writing_sentence_frames).toBeDefined();
    });
});