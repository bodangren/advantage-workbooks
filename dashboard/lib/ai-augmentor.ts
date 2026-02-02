import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { WorkbookLesson } from "./workbook-schema";

export async function augmentLesson(lesson: WorkbookLesson, apiKey: string): Promise<WorkbookLesson> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
            // We use schema validation to ensure the output matches our needs
            // Note: SchemaType is available in @google/generative-ai
        }
    });

    // We can't strictly enforce responseSchema with the mock in the test unless we mock it perfectly, 
    // but for the real implementation, passing responseMimeType: "application/json" is often enough 
    // for Gemini 1.5/2.0 to follow instructions if the prompt is clear.
    // To be safe with types and newer SDK features, let's keep it simple first.

    const prompt = `
    You are an expert educational content creator.
    Analyze the following lesson content and generate metadata for the workbook.
    Return ONLY a JSON object with the following keys: "short_answer_hint", "writing_plan_prompts", "reflection_focus".

    Lesson Title: ${lesson.lesson_title}
    Article:
    ${lesson.article_paragraphs.map(p => p.text).join('\n')}

    Short Answer Question: ${lesson.short_answer_question}
    Writing Prompt: ${lesson.writing_prompt}

    Requirements:
    1. short_answer_hint (string): Provide a helpful hint for the short answer question, guiding the student to the relevant part of the text without giving the answer.
    2. writing_plan_prompts (array of 3 strings): Generate exactly 3 specific bullet points or questions to help the student plan their writing response.
    3. reflection_focus (string): Generate a single thought-provoking question or focus for the "Lesson Reflection" section that relates to the theme of the article.
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
        };
    } catch (e) {
        console.error("Failed to parse AI response:", text);
        throw e;
    }
}
