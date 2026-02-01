'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';

interface LessonPreviewProps {
  htmlContent: string;
  className?: string;
}

export default function LessonPreview({ htmlContent, className = '' }: LessonPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!previewRef.current) return;

    const iframe = previewRef.current;
    if (iframe) {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent]);

  return (
    <div className={`flex flex-col ${className}`}>
      <Card className="flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <CardTitle className="text-lg">Live Preview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="h-[calc(100vh-200px)] overflow-auto bg-gray-100"
          >
            <iframe
              ref={previewRef}
              title="Lesson Preview"
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-modals"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
