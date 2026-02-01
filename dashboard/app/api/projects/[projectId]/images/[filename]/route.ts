import { NextResponse } from 'next/server';
import { deleteImage } from '@/lib/image-handler';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; filename: string }> }
) {
  try {
    const { projectId, filename } = await params;
    await deleteImage(projectId, decodeURIComponent(filename));

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';

    // Determine appropriate status code
    let status = 500;
    if (errorMessage.includes('not found')) {
      status = 404;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}
