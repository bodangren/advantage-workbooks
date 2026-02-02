import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { WorkbookLesson, MatchItemSchema, FillItemSchema, OrderQuestionSchema } from "./workbook-schema";

// Schema for AI-generated article images
const ArticleImageSuggestionSchema = z.object({
    position: z.enum(['hero', 'vocabulary', 'inline-para-1', 'inline-para-2', 'inline-para-3', 'inline-para-4', 'inline-para-5', 'writing-prompt']),
    caption: z.string().describe("Short, engaging caption for the image"),
    image_prompt: z.string().describe("Detailed prompt for AI image generation"),
});

// Schema for Content QA fixes
const ContentQASchema = z.object({
    vocab_match_issues: z.array(z.string()).optional().describe("List of issues found in vocab_match"),
    vocab_fill_issues: z.array(z.string()).optional().describe("List of issues found in vocab_fill"),
    sentence_order_issues: z.array(z.string()).optional().describe("List of issues found in sentence_order"),
});

// Main schema for AI-generated pedagogical content
const PedagogicalContentSchema = z.object({
    short_answer_hint: z.string().describe("Helpful hint for the short answer question"),
    writing_plan_prompts: z.array(z.string()).min(3).max(3).describe("Exactly 3 prompts to help plan writing"),
    reflection_focus: z.string().describe("Thought-provoking question or focus for reflection"),
    connection_question: z.string().describe("Question to activate background knowledge"),
    grammar_search_term: z.string().describe("CEFR-appropriate grammar challenge"),
    discussion_question: z.string().describe("Turn & Talk prompt for discussion"),
    writing_sentence_frames: z.array(z.string()).min(2).max(3).describe("2-3 sentence starters for writing"),
    // Note: article_images removed - user already has hero image via article_image_url
    content_qa: z.union([ContentQASchema, z.string()]).optional().describe("Issues found in existing activities (object or string)"),
});

export async function augmentLesson(lesson: WorkbookLesson, apiKey: string): Promise<WorkbookLesson> {
    const ai = new GoogleGenAI({});

    // Build content QA section if activities exist
    let contentQASection = "";
    if (lesson.vocab_match && lesson.vocab_match.length > 0) {
        contentQASection += `\nVocabulary Matching Activity:\n${JSON.stringify(lesson.vocab_match, null, 2)}`;
    }
    if (lesson.vocab_fill && lesson.vocab_fill.length > 0) {
        contentQASection += `\nVocabulary Fill-in Activity:\n${JSON.stringify(lesson.vocab_fill, null, 2)}`;
    }
    if (lesson.sentence_order_questions && lesson.sentence_order_questions.length > 0) {
        contentQASection += `\nSentence Order Activity:\n${JSON.stringify(lesson.sentence_order_questions, null, 2)}`;
    }

    const prompt = `
You are an expert educational content creator specializing in CEFR-aligned ESL materials.
Analyze the following lesson content and generate pedagogical metadata.

Lesson Title: ${lesson.lesson_title}
CEFR Level: ${lesson.cefr_level || "Not specified (assume B1)"}

Article Text:
${lesson.article_paragraphs.map((p, i) => `Paragraph ${i + 1}: ${p.text}`).join('\n\n')}

Vocabulary: ${JSON.stringify(lesson.vocabulary)}
Short Answer Question: ${lesson.short_answer_question}
Writing Prompt: ${lesson.writing_prompt}
${contentQASection ? `\n=== CONTENT QA SECTION ===\nReview the following activities and identify any issues (incorrect answers, unclear instructions, vocabulary not from article, etc.):${contentQASection}` : ''}

Generate the following fields:
1. connection_question (string): A pre-reading question to activate background knowledge
2. grammar_search_term (string): A CEFR-${lesson.cefr_level || 'B1'} appropriate grammar pattern from the text
3. discussion_question (string): An open-ended question for partner discussion
4. short_answer_hint (string): Guide students to the relevant paragraph
5. writing_sentence_frames (array of 2-3 strings): Sentence starters to scaffold writing
6. writing_plan_prompts (array of exactly 3 strings): Planning questions for writing
7. reflection_focus (string): A thought-provoking reflection question
${contentQASection ? `8. content_qa (object or omit): Only if issues found:
   - vocab_match_issues (array of strings)
   - vocab_fill_issues (array of strings)
   - sentence_order_issues (array of strings)` : ''}

IMPORTANT: Return valid JSON matching the schema exactly.
    `;

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: zodToJsonSchema(PedagogicalContentSchema),
        },
    });

    // Parse and validate the response
    const responseJson = JSON.parse(response.text);
    const validationResult = PedagogicalContentSchema.safeParse(responseJson);

    if (!validationResult.success) {
        console.error("AI Response validation failed:", validationResult.error);
        console.error("Raw response:", JSON.stringify(responseJson, null, 2));
        throw new Error(`Invalid AI response: ${validationResult.error.message}`);
    }

    const generatedData = validationResult.data;

    // Log Content QA issues if found
    if (generatedData.content_qa && typeof generatedData.content_qa === 'object') {
        const { vocab_match_issues, vocab_fill_issues, sentence_order_issues } = generatedData.content_qa;
        if (vocab_match_issues?.length || vocab_fill_issues?.length || sentence_order_issues?.length) {
            console.warn("Content QA Issues Found:");
            if (vocab_match_issues?.length) console.warn("Vocab Match:", vocab_match_issues);
            if (vocab_fill_issues?.length) console.warn("Vocab Fill:", vocab_fill_issues);
            if (sentence_order_issues?.length) console.warn("Sentence Order:", sentence_order_issues);
        }
    }

    return {
        ...lesson,
        short_answer_hint: generatedData.short_answer_hint,
        writing_plan_prompts: generatedData.writing_plan_prompts,
        reflection_focus: generatedData.reflection_focus,
        connection_question: generatedData.connection_question,
        grammar_search_term: generatedData.grammar_search_term,
        discussion_question: generatedData.discussion_question,
        writing_sentence_frames: generatedData.writing_sentence_frames,
        // Note: article_images preserved from original lesson - not modified by AI
    };
}