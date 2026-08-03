'use client';

import { Button } from '@/components/ui/button';
import LessonPreview from '@/components/lesson-preview';

export interface LessonPreviewModalProps {
  /** Rendered lesson HTML shown inside the preview iframe. */
  previewHtml: string;
  /** Called when the user dismisses the modal. */
  onClose: () => void;
}

/**
 * Full-screen modal that shows a rendered lesson preview inside an iframe.
 *
 * @param props - The preview html and a close callback; see LessonPreviewModalProps.
 * @returns The modal overlay with the LessonPreview iframe.
 */
export function LessonPreviewModal({ previewHtml, onClose }: LessonPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 p-4 overflow-hidden">
      <div className="h-full bg-white rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-xl font-bold">Lesson Preview</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="h-9 w-9 p-0"
          >
            ×
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <LessonPreview htmlContent={previewHtml} className="h-full" />
        </div>
      </div>
    </div>
  );
}
