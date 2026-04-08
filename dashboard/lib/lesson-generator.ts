import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { WorkbookLessonSchema, WorkbookLesson } from "./workbook-schema";

export class LessonGenerationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LessonGenerationError';
    }
}

const MIN_SOURCE_LENGTH = 50;

export async function generateLessonFromSource(
    sourceText: string,
    cefrLevel: string
): Promise<WorkbookLesson> {
    if (!sourceText || sourceText.trim().length < MIN_SOURCE_LENGTH) {
        throw new LessonGenerationError(
            `Source text too short: "${sourceText}". Minimum ${MIN_SOURCE_LENGTH} characters required.`
        );
    }

    const ai = new GoogleGenAI({});

    const prompt = `
You are an expert educational content creator specializing in CEFR-aligned ESL materials.
Generate a complete WorkbookLesson JSON object based on the source text provided.

CEFR Level: ${cefrLevel}

Source Text:
${sourceText}

Generate a complete lesson with the following structure:

1. lesson_title (string): A compelling title for the lesson based on the source content
2. cefr_level (string): The CEFR level provided (${cefrLevel})
3. vocabulary (array of 8-12 items): Key vocabulary from the article
   - Each item: { word, phonetic (IPA), definition, thai_definition (optional) }
4. article_paragraphs (array): 2-4 short paragraphs extracted from the source
   - Each item: { number, text }
5. comprehension_questions (array of 5): Multiple choice questions
   - Each item: { number, question, options (array of 4 strings, starting with A, B, C, D) }
6. short_answer_question (string): A question requiring a brief written response
7. short_answer_hint (string): A helpful hint for the short answer
8. writing_prompt (string): A 2-3 sentence writing prompt appropriate for ${cefrLevel} level
9. writing_plan_prompts (array of 3 strings): Planning questions for writing
10. writing_sentence_frames (array of 2-3 strings): Sentence starters to scaffold writing
11. connection_question (string): A pre-reading question to activate background knowledge
12. grammar_search_term (string): A CEFR-${cefrLevel} appropriate grammar pattern from the text
13. discussion_question (string): An open-ended question for pair/small group discussion
14. reflection_focus (string): A thought-provoking reflection question

IMPORTANT: Return ONLY valid JSON matching the schema. No markdown, no explanation, just the JSON object.
`;

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            responseJsonSchema: zodToJsonSchema(WorkbookLessonSchema as any) as any,
        },
    });

    const responseText = response.text;
    if (!responseText) {
        throw new LessonGenerationError("Empty response from AI");
    }

    let parsedJson: unknown;
    try {
        parsedJson = JSON.parse(responseText);
    } catch {
        throw new LessonGenerationError(
            `Failed to parse AI response as JSON: "${responseText.substring(0, 100)}..."`
        );
    }

    const validationResult = WorkbookLessonSchema.safeParse(parsedJson);

    if (!validationResult.success) {
        console.error("Generated lesson validation failed:", validationResult.error);
        console.error("Raw generated content:", JSON.stringify(parsedJson, null, 2));
        throw new LessonGenerationError(
            `Generated lesson does not match schema: ${validationResult.error.message}`
        );
    }

    return validationResult.data;
}