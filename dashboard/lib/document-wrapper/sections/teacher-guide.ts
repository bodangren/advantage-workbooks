import { TeacherGuideEntry, ThemeColors } from '../types';
import { escapeHtml } from '../utils';

export function generateTeacherGuideSection(entries?: TeacherGuideEntry[], theme?: ThemeColors): string {
  if (!entries || entries.length === 0) return '';

  const pages = entries.map(entry => {
    let vocabHtml = '';
    if (entry.vocabulary && entry.vocabulary.length > 0) {
      vocabHtml = `
        <div class="tg-section">
          <h4 class="tg-section-title">Key Vocabulary</h4>
          <ul class="tg-vocab-list">
            ${entry.vocabulary.map(v => `<li><strong>${escapeHtml(v.word)}</strong>: ${escapeHtml(v.definition)} ${v.thaiDefinition ? `<em>(${escapeHtml(v.thaiDefinition)})</em>` : ''}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    let compHtml = '';
    if (entry.comprehensionQuestions && entry.comprehensionQuestions.length > 0) {
      compHtml = `
        <div class="tg-section">
          <h4 class="tg-section-title">Comprehension Questions</h4>
          <ol class="tg-comp-list">
            ${entry.comprehensionQuestions.map(q => `<li><strong>Q:</strong> ${escapeHtml(q.question)}<br/><strong>A:</strong> ${q.answer ? escapeHtml(q.answer) : '<em>See Answer Key</em>'}</li>`).join('')}
          </ol>
        </div>
      `;
    }

    let writingHtml = '';
    if (entry.writingPrompt) {
      writingHtml = `
        <div class="tg-section">
          <h4 class="tg-section-title">Writing Task</h4>
          <p class="tg-writing-prompt"><strong>Prompt:</strong> ${escapeHtml(entry.writingPrompt)}</p>
          <div class="tg-rubric">
            <strong>Suggested Rubric:</strong>
            <ul>
              <li><strong>Content:</strong> Directly addresses the prompt (40%)</li>
              <li><strong>Vocabulary:</strong> Uses key vocabulary from the lesson (30%)</li>
              <li><strong>Grammar/Mechanics:</strong> Correct sentence structure and spelling (30%)</li>
            </ul>
          </div>
        </div>
      `;
    }

    return `
      <div class="tg-lesson-page">
        <div class="tg-header" style="border-bottom: 3px solid ${theme?.primary || '#333'};">
          <h3 class="tg-lesson-title" style="color: ${theme?.primary || '#333'};">Teacher's Guide: ${escapeHtml(entry.lessonTitle)}</h3>
          <div class="tg-meta">
            ${entry.genre ? `<span class="tg-meta-item"><strong>Genre:</strong> ${escapeHtml(entry.genre)}</span>` : ''}
            ${entry.articleType ? `<span class="tg-meta-item"><strong>Type:</strong> ${escapeHtml(entry.articleType)}</span>` : ''}
            ${entry.cefrLevel ? `<span class="tg-meta-item"><strong>CEFR:</strong> ${escapeHtml(entry.cefrLevel)}</span>` : ''}
          </div>
        </div>
        <div class="tg-content">
          ${vocabHtml}
          ${compHtml}
          ${writingHtml}
        </div>
      </div>
    `;
  }).join('\n');

  return `
    <div class="section-teacher-guide">
      <h2 class="section-header">Teacher's Guide</h2>
      <p class="tg-intro">This section provides a quick reference for each lesson to assist with classroom instruction.</p>
      ${pages}
    </div>
  `;
}
