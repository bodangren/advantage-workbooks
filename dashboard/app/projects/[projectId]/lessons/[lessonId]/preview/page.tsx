'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Printer, Eye, EyeOff } from 'lucide-react';
import { use } from 'react';

interface PreviewPageProps {
  params: Promise<{ projectId: string; lessonId: string }>;
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const { projectId, lessonId } = use(params);
  const router = useRouter();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/lessons/${lessonId}`);
        if (response.ok) {
          const lesson = await response.json();
          const renderResponse = await fetch('/api/render', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lesson),
          });
          if (renderResponse.ok) {
            const { html } = await renderResponse.json();
            setHtmlContent(html);
          }
        }
      } catch (error) {
        console.error('Failed to load preview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [projectId, lessonId]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.back();
  };

  const decodedProjectId = decodeURIComponent(projectId);
  const decodedLessonId = decodeURIComponent(lessonId);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={handleBack} variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Preview</h1>
              <p className="text-sm text-muted-foreground">
                {decodedProjectId} / {decodedLessonId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowFullscreen(!showFullscreen)} variant="outline">
              {showFullscreen ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Fullscreen Preview
                </>
              )}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleBack}>
              Back to Editor
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading preview...</p>
          </div>
        ) : showFullscreen ? (
          <div className="fixed inset-0 z-50 bg-white flex flex-col">
            <div className="flex items-center justify-between border-b px-6 py-3">
              <h2 className="text-lg font-bold">Fullscreen Preview</h2>
              <Button onClick={() => setShowFullscreen(false)} variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                srcDoc={htmlContent}
                className="w-full h-full border-0"
                title="Lesson Preview"
              />
            </div>
          </div>
        ) : (
          <Card>
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Lesson Preview</h2>
                <Button onClick={handlePrint} size="sm">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
            <div className="h-[calc(100vh-250px)] overflow-auto p-6">
              <iframe
                srcDoc={htmlContent}
                className="w-full h-full border-0 rounded-md"
                title="Lesson Preview"
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
