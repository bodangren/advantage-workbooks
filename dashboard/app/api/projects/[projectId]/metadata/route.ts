import { NextRequest, NextResponse } from 'next/server';
import { readProjectMetadata, writeProjectMetadata, type ProjectMetadata } from '@/lib/filesystem';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const decodedProjectId = decodeURIComponent(projectId);

    const metadata = await readProjectMetadata(decodedProjectId);

    if (!metadata) {
      // Return default metadata if none exists
      return NextResponse.json({
        seriesName: 'Origins',
        levelNumber: '3.1',
        cefrLevel: 'A1',
      });
    }

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error reading project metadata:', error);
    return NextResponse.json(
      { error: 'Failed to read project metadata' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const decodedProjectId = decodeURIComponent(projectId);
    const metadata: ProjectMetadata = await request.json();

    // Validate metadata
    if (!metadata.seriesName || !metadata.levelNumber || !metadata.cefrLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await writeProjectMetadata(decodedProjectId, metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing project metadata:', error);
    return NextResponse.json(
      { error: 'Failed to write project metadata' },
      { status: 500 }
    );
  }
}
