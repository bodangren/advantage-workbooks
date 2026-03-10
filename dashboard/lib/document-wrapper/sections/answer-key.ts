import { AnswerKeyEntry } from '../types';
import { escapeHtml } from '../utils';

export function generateAnswerKeySection(answerKey?: AnswerKeyEntry[]): string {
  if (!answerKey || answerKey.length === 0) return '';

  const answerItems = answerKey.map(entry => {
    let content = '';

    if (entry.mcAnswers && entry.mcAnswers.length > 0) {
      const mc = entry.mcAnswers.map(ans => `${ans.number}. ${ans.letter}`).join('  ');
      content += `<div class="ak-block"><strong>Multiple Choice:</strong> ${escapeHtml(mc)}</div>`;
    }

    if (entry.vocabMatchAnswerString) {
      content += `<div class="ak-block"><strong>Vocabulary Match:</strong> ${escapeHtml(entry.vocabMatchAnswerString)}</div>`;
    }

    if (entry.vocabFillAnswerString) {
      content += `<div class="ak-block"><strong>Vocabulary Fill:</strong> ${escapeHtml(entry.vocabFillAnswerString)}</div>`;
    }

    if (entry.sentenceOrderAnswers && entry.sentenceOrderAnswers.length > 0) {
      const order = entry.sentenceOrderAnswers.map(ans => `<div>${ans.number}. ${escapeHtml(ans.sentence)}</div>`).join('');
      content += `<div class="ak-block"><strong>Sentence Order:</strong> ${order}</div>`;
    }

    if (entry.shortAnswerHint) {
      content += `<div class="ak-block"><strong>Short Answer Hint:</strong> ${escapeHtml(entry.shortAnswerHint)}</div>`;
    }

    if (!content) return '';

    return `
      <div class="ak-lesson-entry">
        <h3 class="ak-lesson-title">${escapeHtml(entry.lessonTitle)}</h3>
        ${content}
      </div>
    `;
  }).join('\n');

  return `
    <div class="section-answer-key">
      <h2 class="section-header">Answer Key</h2>
      <div class="ak-list">
        ${answerItems}
      </div>
    </div>
  `;
}