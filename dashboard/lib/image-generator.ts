import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export interface ImageGenerationRequest {
  prompt: string;
  projectId: string;
  lessonId: string;
}

export interface ImageGenerationResult {
  url: string;
  prompt: string;
}

/**
 * Generate an image using Google Gemini's Nano Banana (native image generation)
 *
 * Uses gemini-2.5-flash-image model for fast, efficient image generation.
 * All generated images include a SynthID watermark.
 */
export async function generateImage(
  request: ImageGenerationRequest,
  apiKey: string
): Promise<ImageGenerationResult> {
  const ai = new GoogleGenAI({ apiKey });

  const imageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

  // Generate image using Nano Banana
  const response = await ai.models.generateContent({
    model: imageModel,
    contents: request.prompt,
  });

  // Extract image data from response
  let imageData: string | undefined;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      imageData = part.inlineData.data;
      break;
    }
  }

  if (!imageData) {
    throw new Error('No image data returned from Nano Banana API');
  }

  // Save the generated image
  const filename = `${request.lessonId}-visual-break.png`;
  const projectDir = path.join(process.cwd(), 'public', 'projects', request.projectId, 'images');

  // Ensure directory exists
  await fs.mkdir(projectDir, { recursive: true });

  // Decode base64 and save as PNG
  const buffer = Buffer.from(imageData, 'base64');
  const filePath = path.join(projectDir, filename);
  await fs.writeFile(filePath, buffer);

  // Return the URL path (relative to public directory)
  const url = `/projects/${request.projectId}/images/${filename}`;

  return {
    url,
    prompt: request.prompt,
  };
}

/**
 * Generate a context-aware image prompt based on lesson content
 */
export function generateImagePrompt(
  title: string,
  articleText: string,
  writingPrompt: string,
  cefrLevel?: string
): string {
  // Extract key themes and concepts
  const prompt = `Create a photorealistic educational illustration for a CEFR ${cefrLevel || 'B1'} level ESL lesson.

Lesson Topic: ${title}
Context: ${articleText.substring(0, 500)}...

The image should:
- Be appropriate for ${cefrLevel || 'B1'} level students (ages 12-16)
- Support the writing prompt: "${writingPrompt}"
- Be clear, engaging, and educational
- Use vibrant but not overwhelming colors
- Be suitable for classroom display
- Avoid text or words in the image

Style: Photorealistic educational illustration with clear focus and good lighting`;

  return prompt;
}
