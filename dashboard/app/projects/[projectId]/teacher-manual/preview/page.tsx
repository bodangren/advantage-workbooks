'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Printer, Eye, EyeOff, Loader2, Info, Globe } from 'lucide-react';
import { use } from 'react';

interface TeacherManualPreviewPageProps {
  params: Promise<{ projectId: string }>;
}

export default function TeacherManualPreviewPage({ params }: TeacherManualPreviewPageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lessonCount, setLessonCount] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showPrintInfo, setShowPrintInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'th'>('en');

  useEffect(() => {
    const fetchCompiled = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/teacher-manual?lang=${lang}`);
        if (response.ok) {
          const data = await response.json();
          setHtmlContent(data.html);
          setLessonCount(data.lessonCount);
          setTotalLessons(data.totalLessons);
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to compile teacher manual');
        }
      } catch (error) {
        console.error('Failed to load teacher manual preview:', error);
        setError('Failed to load teacher manual preview');
      } finally {
        setLoading(false);
      }
    };

    fetchCompiled();
  }, [projectId, lang]);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  const handleBack = () => {
    router.back();
  };

  const decodedProjectId = decodeURIComponent(projectId);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b px-6 py-4 shadow-sm print:hidden">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={handleBack} variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Teacher Manual Preview</h1>
              <p className="text-sm text-muted-foreground">
                {decodedProjectId}
                {lessonCount > 0 && ` - ${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}`}
                {lessonCount !== totalLessons && ` (${totalLessons - lessonCount} failed to render)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-md px-2 py-1">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'en' | 'th')}
                className="bg-transparent text-sm outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="th">ไทย</option>
              </select>
            </div>
            <Button onClick={() => setShowPrintInfo(!showPrintInfo)} variant="ghost" size="icon" title="Print Instructions">
              <Info className="h-4 w-4" />
            </Button>
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
            <Button onClick={handlePrint} disabled={loading || !!error}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleBack}>
              Back to Project
            </Button>
          </div>
        </div>

        {showPrintInfo && (
          <div className="container mx-auto mt-4">
            <Card className="bg-blue-50 border-blue-200 p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Print Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>1. Click the <strong>Print</strong> button or press <kbd className="px-1 py-0.5 bg-blue-100 rounded">Ctrl+P</kbd></li>
                <li>2. Set Destination to <strong>&quot;Save as PDF&quot;</strong> or your printer</li>
                <li>3. <strong className="text-red-600">Important:</strong> Enable <strong>&quot;Background graphics&quot;</strong> in More Settings</li>
                <li>4. Set Margins to <strong>Default</strong> or <strong>None</strong></li>
                <li>5. Click Save/Print</li>
              </ul>
            </Card>
          </div>
        )}
      </div>

      <div className="container mx-auto py-6">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Compiling teacher manual...</p>
          </div>
        ) : error ? (
          <Card>
            <div className="p-12 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={handleBack}>Back to Project</Button>
            </div>
          </Card>
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
                ref={iframeRef}
                srcDoc={htmlContent}
                className="w-full h-full border-0"
                title="Teacher Manual Preview"
              />
            </div>
          </div>
        ) : (
          <Card>
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-bold">Teacher Manual — All Lessons</h2>
            </div>
            <div className="h-[calc(100vh-250px)] overflow-auto p-6">
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                className="w-full h-full border-0 rounded-md"
                title="Teacher Manual Preview"
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
