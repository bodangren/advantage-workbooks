'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, ArrowLeft, Edit, Eye, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { ProjectSettingsDialog } from '@/components/project-settings-dialog';

interface LessonFile {
  id: string;
  name: string;
  path: string;
}

interface ProjectMetadata {
  seriesName: string;
  levelNumber: string;
  cefrLevel: string;
  type?: 'primary' | 'secondary';
}

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = use(params);
  const decodedProjectId = decodeURIComponent(projectId);
  const [lessons, setLessons] = useState<LessonFile[]>([]);
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLessons = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/lessons`);
      if (response.ok) {
        const data = await response.json();
        setLessons(data);
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchMetadata = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/metadata`);
      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  }, [projectId]);

  useEffect(() => {
    fetchLessons();
    fetchMetadata();
  }, [fetchLessons, fetchMetadata]);

  const handleCreateLesson = () => {
    console.log('Create lesson for project:', projectId);
  };

  if (loading) {
    return <div className="p-6">Loading lessons...</div>;
  }

  const projectType = metadata?.type || 'secondary';
  const TypeIcon = projectType === 'primary' ? BookOpen : GraduationCap;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{decodedProjectId}</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                projectType === 'primary'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                <TypeIcon className="h-3 w-3" />
                {projectType === 'primary' ? 'Primary' : 'Secondary'}
              </span>
            </div>
            <p className="text-muted-foreground mt-2">
              {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} in this project
              {metadata && ` • ${metadata.seriesName} ${metadata.levelNumber} • ${metadata.cefrLevel}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ProjectSettingsDialog projectId={projectId} />
          {lessons.length > 0 && (
            <Link href={`/projects/${projectId}/compile`}>
              <Button variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Compile All
              </Button>
            </Link>
          )}
          <Button onClick={handleCreateLesson}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lesson
          </Button>
        </div>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No lessons found in this project. Add your first lesson to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="truncate">{lesson.name}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Link
                    href={`/projects/${projectId}/lessons/${encodeURIComponent(lesson.id)}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Link
                    href={`/projects/${projectId}/lessons/${encodeURIComponent(lesson.id)}/preview`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
