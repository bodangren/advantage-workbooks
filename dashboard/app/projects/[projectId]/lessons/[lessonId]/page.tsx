'use client';

import { use } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useLessonEditor } from '@/components/lesson-editor/useLessonEditor';
import { LessonStatusBanners } from '@/components/lesson-editor/LessonStatusBanners';
import { LessonPreviewModal } from '@/components/lesson-editor/LessonPreviewModal';
import { BasicInfoEditor } from '@/components/lesson-editor/BasicInfoEditor';
import { ArticleEditor } from '@/components/lesson-editor/ArticleEditor';
import { VocabularyEditor } from '@/components/lesson-editor/VocabularyEditor';
import { PedagogicalConnectorsEditor } from '@/components/lesson-editor/PedagogicalConnectorsEditor';
import { ComprehensionQuestionsEditor } from '@/components/lesson-editor/ComprehensionQuestionsEditor';
import { WritingPromptEditor } from '@/components/lesson-editor/WritingPromptEditor';
import { LessonReflectionEditor } from '@/components/lesson-editor/LessonReflectionEditor';

interface LessonEditorProps {
  params: Promise<{ projectId: string; lessonId: string }>;
}

export default function LessonEditor({ params }: LessonEditorProps) {
  const { projectId, lessonId } = use(params);
  const decodedProjectId = decodeURIComponent(projectId);
  const decodedLessonId = decodeURIComponent(lessonId);

  const {
    lesson, loading, saving, augmenting, generatingImage, imagePrompt, errors,
    saveSuccess, augmentSuccess, sourceGeneratedSuccess, imageGenSuccess,
    previewHtml, showPreview, currentVisualBreakImageUrl,
    setLessonField, setImagePrompt, setShowPreview, updateVisualBreakImage,
    validateAndSave, augmentWithAI, generateImagePrompt, generateImage,
  } = useLessonEditor({ projectId, lessonId, decodedProjectId, decodedLessonId });

  if (loading) {
    return <div className="p-6">Loading lesson...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${encodeURIComponent(projectId)}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{decodedLessonId}</h1>
            <p className="text-muted-foreground mt-2">
              Project: {decodedProjectId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={augmentWithAI}
            disabled={augmenting || saving}
            variant="secondary"
          >
            {augmenting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Auto-Fill Pedagogy
              </>
            )}
          </Button>
          <Button onClick={validateAndSave} disabled={saving || augmenting}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant={showPreview ? 'default' : 'outline'}
            disabled={augmenting}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      </div>

      <LessonStatusBanners
        formError={errors._form}
        saveSuccess={saveSuccess}
        augmentSuccess={augmentSuccess}
        imageGenSuccess={imageGenSuccess}
        sourceGeneratedSuccess={sourceGeneratedSuccess}
      />

      <BasicInfoEditor
        lesson_number={lesson.lesson_number}
        lesson_title={lesson.lesson_title}
        level_name={lesson.level_name}
        cefr_level={lesson.cefr_level}
        genre={lesson.genre}
        onChange={setLessonField}
      />

      <div className="grid md:grid-cols-1 gap-6">
        <ArticleEditor
          article_url={lesson.article_url}
          article_caption={lesson.article_caption}
          article_image_url={lesson.article_image_url}
          article_images={lesson.article_images}
          article_paragraphs={lesson.article_paragraphs}
          projectId={decodedProjectId}
          onChange={setLessonField}
        />

        <VocabularyEditor
          vocabulary={lesson.vocabulary}
          onChange={setLessonField}
        />
      </div>

      <PedagogicalConnectorsEditor
          connection_question={lesson.connection_question}
          grammar_search_term={lesson.grammar_search_term}
          discussion_question={lesson.discussion_question}
          onChange={setLessonField}
        />

      <ComprehensionQuestionsEditor
        comprehension_questions={lesson.comprehension_questions}
        short_answer_question={lesson.short_answer_question}
        short_answer_hint={lesson.short_answer_hint}
        onChange={setLessonField}
      />

       <WritingPromptEditor
         writing_prompt={lesson.writing_prompt}
         writing_plan_prompts={lesson.writing_plan_prompts}
         writing_sentence_frames={lesson.writing_sentence_frames}
         projectId={decodedProjectId}
         imagePrompt={imagePrompt}
         generatingImage={generatingImage}
         augmenting={augmenting}
         currentVisualBreakImageUrl={currentVisualBreakImageUrl}
         onChange={setLessonField}
         onImagePromptChange={setImagePrompt}
         onGenerateImagePrompt={generateImagePrompt}
         onGenerateImage={generateImage}
         onVisualBreakImageUpload={updateVisualBreakImage}
       />

       <LessonReflectionEditor
         reflection_focus={lesson.reflection_focus}
         onChange={setLessonField}
       />

       {showPreview && previewHtml && (
         <LessonPreviewModal
           previewHtml={previewHtml}
           onClose={() => setShowPreview(false)}
         />
       )}
     </div>
   );
 }
