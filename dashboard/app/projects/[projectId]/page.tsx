'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, ArrowLeft, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

interface LessonFile {
  id: string;
  name: string;
  path: string;
}

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = use(params);
  const decodedProjectId = decodeURIComponent(projectId);
  const [lessons, setLessons] = useState<LessonFile[]>([]);
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

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleCreateLesson = () => {
    console.log('Create lesson for project:', projectId);
  };

  if (loading) {
    return <div className="p-6">Loading lessons...</div>;
  }

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
            <h1 className="text-3xl font-bold tracking-tight">{decodedProjectId}</h1>
            <p className="text-muted-foreground mt-2">
              {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} in this project
            </p>
          </div>
        </div>
        <Button onClick={handleCreateLesson}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lesson
        </Button>
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
