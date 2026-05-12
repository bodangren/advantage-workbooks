import type { TeachingNote } from './types';
import type { SupportedLanguage } from './i18n';
import { getTranslations } from './i18n';

export function getTeachingNotes(stepNumber: number, _lessonData?: unknown, lang: SupportedLanguage = 'en'): TeachingNote {
  const t = getTranslations(lang);
  const notes = t.teachingNotesContent[stepNumber as keyof typeof t.teachingNotesContent];

  if (!notes) {
    return {
      teacherActions: [],
      teacherLanguage: [],
      studentActions: [],
      watchFor: [],
    };
  }

  return {
    teacherActions: notes.teacherActions,
    teacherLanguage: notes.teacherLanguage,
    studentActions: notes.studentActions,
    watchFor: notes.watchFor,
  };
}

export function renderTeachingNotes(
  note: TeachingNote,
  theme?: { primary: string },
  lang: SupportedLanguage = 'en'
): string {
  const primaryColor = theme?.primary || '#1e40af';
  const t = getTranslations(lang);
  const headers = t.teachingNotes;

  return `
    <div class="tm-teaching-notes">
      <div class="tm-note-section">
        <h5 class="tm-note-title" style="color: ${primaryColor};">${escapeHtml(headers.teacherActions)}</h5>
        <ul class="tm-note-list">
          ${note.teacherActions.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
        </ul>
      </div>
      <div class="tm-note-section">
        <h5 class="tm-note-title" style="color: ${primaryColor};">${escapeHtml(headers.teacherLanguage)}</h5>
        <div class="tm-language-box">
          ${note.teacherLanguage.map(l => `<p class="tm-language-quote">${escapeHtml(l)}</p>`).join('')}
        </div>
      </div>
      <div class="tm-note-section">
        <h5 class="tm-note-title" style="color: ${primaryColor};">${escapeHtml(headers.studentActions)}</h5>
        <ul class="tm-note-list">
          ${note.studentActions.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
        </ul>
      </div>
      <div class="tm-note-section tm-watch-for">
        <h5 class="tm-note-title tm-watch-title">${escapeHtml(headers.watchFor)}</h5>
        <ul class="tm-note-list tm-watch-list">
          ${note.watchFor.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
