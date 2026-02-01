import { NextRequest, NextResponse } from 'next/server';
import { listProjects, createProject } from '@/lib/filesystem';

export async function GET() {
  try {
    const projects = await listProjects();
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
    const { name, level } = body;

    if (!name || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: name, level' },
        { status: 400 }
      );
    }

    const project = await createProject(name, level);
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
