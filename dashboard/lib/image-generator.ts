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
  console.log('[generateImage] Starting image generation for:', request.lessonId);
  console.log('[generateImage] Prompt length:', request.prompt.length);

  const ai = new GoogleGenAI({ apiKey });

  const imageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  console.log('[generateImage] Using model:', imageModel);

  // Generate image using Nano Banana
  console.log('[generateImage] Calling Nano Banana API...');
  const response = await ai.models.generateContent({
    model: imageModel,
    contents: request.prompt,
  });
  console.log('[generateImage] API response received');

  // Extract image data from response
  let imageData: string | undefined;
  console.log('[generateImage] Response has', response.candidates?.length, 'candidates');
  for (const part of response.candidates[0].content.parts) {
    console.log('[generateImage] Checking part:', part.inlineData ? 'has inlineData' : 'no inlineData');
    if (part.inlineData) {
      imageData = part.inlineData.data;
      console.log('[generateImage] Found image data, length:', imageData?.length);
      break;
    }
  }

  if (!imageData) {
    console.error('[generateImage] No image data found in response');
    throw new Error('No image data returned from Nano Banana API');
  }

  // Save the generated image
  const filename = `${request.lessonId}-visual-break.png`;
  const projectDir = path.join(process.cwd(), 'public', 'projects', request.projectId, 'images');
  console.log('[generateImage] Saving to directory:', projectDir);

  // Ensure directory exists
  await fs.mkdir(projectDir, { recursive: true });
  console.log('[generateImage] Directory created/verified');

  // Decode base64 and save as PNG
  const buffer = Buffer.from(imageData, 'base64');
  const filePath = path.join(projectDir, filename);
  console.log('[generateImage] Writing file:', filePath);
  console.log('[generateImage] File size:', buffer.length, 'bytes');
  await fs.writeFile(filePath, buffer);
  console.log('[generateImage] File saved successfully');

  // Return the URL path (relative to public directory)
  const url = `/projects/${request.projectId}/images/${filename}`;
  console.log('[generateImage] Returning URL:', url);

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
