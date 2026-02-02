import { NextRequest, NextResponse } from 'next/server';
import { readLesson, writeLesson } from '@/lib/filesystem';
import { generateImage, generateImagePrompt } from '@/lib/image-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; lessonId: string }> }
) {
  try {
    const { projectId, lessonId } = await params;
    const body = await request.json();

    // Get API key from environment
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in environment.' },
        { status: 500 }
      );
    }

    // Read the current lesson
    const lesson = await readLesson(projectId, lessonId);

    // Generate or use provided image prompt
    let imagePrompt = body.prompt;

    if (!imagePrompt) {
      // Auto-generate prompt from lesson content
      const articleText = lesson.article_paragraphs.map(p => p.text).join(' ');
      imagePrompt = generateImagePrompt(
        lesson.lesson_title,
        articleText,
        lesson.writing_prompt,
        lesson.cefr_level
      );
    }

    // Generate the image
    const result = await generateImage(
      {
        prompt: imagePrompt,
        projectId,
        lessonId,
      },
      apiKey
    );

    // Update lesson with the new visual break image
    const existingImages = lesson.article_images || [];
    const writingPromptImageIndex = existingImages.findIndex(img => img.position === 'writing-prompt');

    let updatedImages;
    if (writingPromptImageIndex >= 0) {
      // Update existing visual break image
      updatedImages = [...existingImages];
      updatedImages[writingPromptImageIndex] = {
        ...updatedImages[writingPromptImageIndex],
        url: result.url,
        image_prompt: result.prompt,
      };
    } else {
      // Add new visual break image
      updatedImages = [
        ...existingImages,
        {
          url: result.url,
          caption: 'Visual break illustration',
          position: 'writing-prompt' as const,
          image_prompt: result.prompt,
        },
      ];
    }

    const updatedLesson = {
      ...lesson,
      article_images: updatedImages,
    };

    // Save the updated lesson
    await writeLesson(projectId, lessonId, updatedLesson);

    return NextResponse.json({
      success: true,
      imageUrl: result.url,
      imagePrompt: result.prompt,
      message: 'Visual break image generated successfully!',
    });
  } catch (error) {
    console.error('Generate image error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
