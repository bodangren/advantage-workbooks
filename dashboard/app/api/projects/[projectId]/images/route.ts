import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, listImages } from '@/lib/image-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the image
    const result = await uploadImage(projectId, buffer, file.name);

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';

    // Determine appropriate status code
    let status = 500;
    if (errorMessage.includes('Invalid file type')) {
      status = 400;
    } else if (errorMessage.includes('File size exceeds')) {
      status = 400;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const images = await listImages(projectId);

    return NextResponse.json({ images });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to list images';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
