'use client';

import { Card, CardContent } from '@/components/ui/card';

export interface LessonStatusBannersProps {
  formError?: string;
  saveSuccess: boolean;
  augmentSuccess: boolean;
  imageGenSuccess: boolean;
  sourceGeneratedSuccess: boolean;
}

/**
 * Renders the transient status/feedback banners for the lesson editor:
 * form errors, save/augment/image-generation success messages, and the
 * generated-lesson notice.
 *
 * @param props - The active message flags; see LessonStatusBannersProps.
 * @returns The active banners, or nothing when no messages are active.
 */
export function LessonStatusBanners({
  formError,
  saveSuccess,
  augmentSuccess,
  imageGenSuccess,
  sourceGeneratedSuccess,
}: LessonStatusBannersProps) {
  return (
    <>
      {formError && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-destructive">
            {formError}
          </CardContent>
        </Card>
      )}

      {saveSuccess && (
        <Card className="border-green-600 bg-green-50 dark:bg-green-950">
          <CardContent className="py-4 text-green-700 dark:text-green-400">
            Lesson saved successfully!
          </CardContent>
        </Card>
      )}

      {augmentSuccess && (
        <Card className="border-purple-600 bg-purple-50 dark:bg-purple-950">
          <CardContent className="py-4 text-purple-700 dark:text-purple-400">
            ✨ Pedagogical content auto-filled! Review the generated fields and save when ready.
          </CardContent>
        </Card>
      )}

      {imageGenSuccess && (
        <Card className="border-blue-600 bg-blue-50 dark:bg-blue-950">
          <CardContent className="py-4 text-blue-700 dark:text-blue-400">
            🎨 Visual break image generated successfully! Check the Writing Prompt section.
          </CardContent>
        </Card>
      )}

      {sourceGeneratedSuccess && (
        <div role="status" className="p-4 rounded-lg bg-green-100 border border-green-600 text-green-700 dark:bg-green-950 dark:text-green-400">
          Lesson generated successfully.
        </div>
      )}
    </>
  );
}
