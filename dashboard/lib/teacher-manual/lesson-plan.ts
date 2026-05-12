import type { WorkbookLesson } from '../workbook-schema';
import type { LessonPlan } from './types';
import type { SupportedLanguage } from './i18n';
import { getTranslations } from './i18n';
import { buildPeriodPlan, renderPeriodPlan } from './period-plan';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildLessonPlan(
  lesson: WorkbookLesson,
  lessonIndex: number,
  cefrLevel: string,
  lang: SupportedLanguage = 'en'
): LessonPlan {
  const t = getTranslations(lang);
  const lp = t.lessonPlan;
  const lessonNumber = lessonIndex + 1;
  const vocabulary = (lesson.vocabulary || []).map(v => ({
    word: v.word,
    definition: v.definition,
  }));

  const objectives = [
    lp.objectiveRead(lesson.genre || '', lesson.lesson_title || lp.untitled),
    lp.objectiveVocab,
    lp.objectiveComprehension,
    lp.objectiveWriting,
  ];

  const periods = [1, 2, 3, 4].map(pn =>
    buildPeriodPlan(pn, lesson, lessonIndex, undefined, lang)
  );

  return {
    lessonNumber,
    lessonTitle: lesson.lesson_title || lp.untitled,
    cefrLevel,
    genre: lesson.genre,
    articleType: lesson.article_type,
    objectives,
    periods,
    vocabulary,
  };
}

export function renderLessonPlan(
  plan: LessonPlan,
  theme?: { primary: string },
  lang: SupportedLanguage = 'en'
): string {
  const primaryColor = theme?.primary || '#1e40af';
  const t = getTranslations(lang);
  const lp = t.lessonPlan;

  const periodsHtml = plan.periods.map(p =>
    renderPeriodPlan(p, plan.lessonNumber - 1, theme, lang)
  ).join('\n');

  const vocabHtml = plan.vocabulary.length > 0 ? `
    <div class="tm-vocab-overview">
      <h4 class="tm-vocab-title" style="color: ${primaryColor};">${escapeHtml(lp.lessonVocabulary)}</h4>
      <div class="tm-vocab-grid">
        ${plan.vocabulary.map(v => `
          <div class="tm-vocab-item">
            <strong>${escapeHtml(v.word)}</strong>: ${escapeHtml(v.definition)}
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    <div class="tm-lesson-plan" id="lesson-${plan.lessonNumber}">
      <div class="tm-lesson-header" style="background: linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05); border-left: 4px solid ${primaryColor};">
        <h2 class="tm-lesson-title" style="color: ${primaryColor};">${escapeHtml(lp.lesson)} ${plan.lessonNumber}: ${escapeHtml(plan.lessonTitle)}</h2>
        <div class="tm-lesson-meta">
          ${plan.genre ? `<span class="tm-meta-item"><strong>${escapeHtml(lp.genre)}:</strong> ${escapeHtml(plan.genre)}</span>` : ''}
          ${plan.articleType ? `<span class="tm-meta-item"><strong>${escapeHtml(lp.type)}:</strong> ${escapeHtml(plan.articleType)}</span>` : ''}
          <span class="tm-meta-item"><strong>${escapeHtml(lp.cefr)}:</strong> ${escapeHtml(plan.cefrLevel)}</span>
          <span class="tm-meta-item"><strong>${escapeHtml(lp.duration)}:</strong> ${escapeHtml(lp.durationValue)}</span>
        </div>
      </div>
      <div class="tm-lesson-objectives">
        <h4 style="color: ${primaryColor};">${escapeHtml(lp.objectives)}</h4>
        <ul>
          ${plan.objectives.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
        </ul>
      </div>
      ${vocabHtml}
      ${periodsHtml}
    </div>
  `;
}
