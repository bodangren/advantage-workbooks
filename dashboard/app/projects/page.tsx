'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus, ChevronRight, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { CreateProjectDialog } from '@/components/create-project-dialog';

type ProjectType = 'secondary' | 'primary';

interface WorkbookProject {
  id: string;
  name: string;
  path: string;
  type: ProjectType;
  metadata?: {
    seriesName: string;
    levelNumber: string;
    cefrLevel: string;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<WorkbookProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectType>('secondary');

  useEffect(() => {
    fetchProjects(activeTab);
  }, [activeTab]);

  const fetchProjects = async (type: ProjectType) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    fetchProjects(activeTab);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workbook Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage your workbook projects and their contents
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Tabbed Navigation */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('secondary')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'secondary'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Secondary
        </button>
        <button
          onClick={() => setActiveTab('primary')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'primary'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Primary
        </button>
      </div>

      {loading ? (
        <div className="p-6">Loading projects...</div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No {activeTab} workbook projects found. Create your first project to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <span className="truncate">{project.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {project.metadata && (
                      <div className="flex gap-2">
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {project.metadata.seriesName}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                          {project.metadata.cefrLevel}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>Open project</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleProjectCreated}
        defaultType={activeTab}
      />
    </div>
  );
}
