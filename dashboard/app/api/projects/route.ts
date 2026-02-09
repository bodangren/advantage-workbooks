import { NextRequest, NextResponse } from 'next/server';
import { listProjects, createProject, type CreateProjectOptions, type ProjectType } from '@/lib/filesystem';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as ProjectType | null;

    // Validate type parameter if provided
    if (type && type !== 'primary' && type !== 'secondary') {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "primary" or "secondary"' },
        { status: 400 }
      );
    }

    const projects = await listProjects(type || undefined);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error listing projects:', error);
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if using new format with type, seriesName, levelNumber, cefrLevel
    if ('type' in body || 'seriesName' in body) {
      const { type, seriesName, levelNumber, cefrLevel } = body;

      // Validate all required fields are present
      if (!type || !seriesName || !levelNumber || !cefrLevel) {
        return NextResponse.json(
          { error: 'Missing required fields: type, seriesName, levelNumber, cefrLevel' },
          { status: 400 }
        );
      }

      // Validate type value
      if (type !== 'primary' && type !== 'secondary') {
        return NextResponse.json(
          { error: 'Invalid type. Must be "primary" or "secondary"' },
          { status: 400 }
        );
      }

      const options: CreateProjectOptions = { type, seriesName, levelNumber, cefrLevel };
      const project = await createProject(options);
      return NextResponse.json(project);
    }

    // Legacy format: { name }
    const { name } = body;
    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name or (type, seriesName, levelNumber, cefrLevel)' },
        { status: 400 }
      );
    }

    const project = await createProject(name);
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
