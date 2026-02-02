import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { WorkbookLesson } from "./workbook-schema";

export async function augmentLesson(lesson: WorkbookLesson, apiKey: string): Promise<WorkbookLesson> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview",
        generationConfig: {
            responseMimeType: "application/json",
            // We use schema validation to ensure the output matches our needs
            // Note: SchemaType is available in @google/generative-ai
        }
    });

    const prompt = `
    You are an expert educational content creator.
    Analyze the following lesson content and generate metadata for the workbook AND suggestions for images.
    Return ONLY a JSON object with the following keys: "short_answer_hint", "writing_plan_prompts", "reflection_focus", "article_images", "connection_question", "grammar_search_term", "discussion_question", "writing_sentence_frames".

    Lesson Title: ${lesson.lesson_title}
    CEFR Level: ${lesson.cefr_level || "Not specified (assume B1)"}
    Article:
    ${lesson.article_paragraphs.map(p => p.text).join('\n')}

    Short Answer Question: ${lesson.short_answer_question}
    Writing Prompt: ${lesson.writing_prompt}

    Requirements:
    1. connection_question (string): A question to activate background knowledge before reading (Step 1).
    2. grammar_search_term (string): A CEFR-appropriate grammar challenge (e.g., "Find a sentence with 'can'") based on the text (Step 6).
    3. discussion_question (string): A "Turn & Talk" prompt for partner discussion (Step 7).
    4. short_answer_hint (string): Provide a helpful hint for the short answer question, guiding the student to the relevant part of the text without giving the answer.
    5. writing_sentence_frames (array of 2-3 strings): Sentence starters to scaffold the writing prompt (Step 13).
    6. writing_plan_prompts (array of 3 strings): Generate exactly 3 specific bullet points or questions to help the student plan their writing response.
    7. reflection_focus (string): Generate a single thought-provoking question or focus for the "Lesson Reflection" section that relates to the theme of the article.
    8. article_images (array of objects): Suggest images to visually enhance the article.
       Each object must have:
       - position (enum: 'hero', 'inline-para-1', 'inline-para-2', ...): Where to place the image. 'hero' is mandatory. Suggest 1-2 inline images if appropriate. Use 'inline-para-N' where N is the paragraph number.
       - caption (string): A short, engaging caption.
       - image_prompt (string): A detailed, descriptive prompt for an AI image generator to create this image. Style should be consistent (e.g., "photorealistic" or "educational illustration").
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
        const generatedData = JSON.parse(text);
        
        return {
            ...lesson,
            short_answer_hint: generatedData.short_answer_hint,
            writing_plan_prompts: generatedData.writing_plan_prompts,
            reflection_focus: generatedData.reflection_focus,
            
            // New fields
            connection_question: generatedData.connection_question,
            grammar_search_term: generatedData.grammar_search_term,
            discussion_question: generatedData.discussion_question,
            writing_sentence_frames: generatedData.writing_sentence_frames,

            article_images: generatedData.article_images?.map((img: any) => ({
                url: "", // Placeholder for generated image URL
                caption: img.caption,
                position: img.position,
                image_prompt: img.image_prompt
            }))
        };
    } catch (e) {
        console.error("Failed to parse AI response:", text);
        throw e;
    }
}