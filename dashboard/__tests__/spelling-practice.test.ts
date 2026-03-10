import { describe, it, expect } from 'vitest';
import { generateSpellingPracticeSection } from '../lib/document-wrapper/sections/spelling-practice';

describe('Spelling Practice Generator', () => {
  const mockTheme = {
    primary: '#ff0000',
    secondary: '#00ff00',
    gradient: 'linear-gradient(to right, #ff0000, #00ff00)'
  };

  it('returns empty string if no entries provided', () => {
    expect(generateSpellingPracticeSection(undefined, mockTheme)).toBe('');
    expect(generateSpellingPracticeSection([], mockTheme)).toBe('');
  });

  it('generates a spelling practice section with table', () => {
    const entries = [
      {
        lessonTitle: 'Lesson 1: Animals',
        vocabulary: [
          { word: 'cat', phonetic: '/kæt/', definition: 'A small animal' },
          { word: 'dog', phonetic: '/dɒg/', definition: 'A pet' }
        ]
      }
    ];

    const html = generateSpellingPracticeSection(entries, mockTheme);

    expect(html).toContain('section-spelling-practice');
    expect(html).toContain('Spelling Practice: Lesson 1: Animals');
    expect(html).toContain('cat');
    expect(html).toContain('dog');
    expect(html).toContain('<table class="sp-table">');
    expect(html).toContain('<td class="sp-col-word"><strong>cat</strong></td>');
  });

  it('skips lessons with no vocabulary', () => {
    const entries = [
      {
        lessonTitle: 'Lesson 1',
        vocabulary: []
      },
      {
        lessonTitle: 'Lesson 2',
        vocabulary: [
          { word: 'apple', phonetic: '', definition: 'A fruit' }
        ]
      }
    ];

    const html = generateSpellingPracticeSection(entries, mockTheme);

    expect(html).toContain('section-spelling-practice');
    expect(html).not.toContain('Spelling Practice: Lesson 1');
    expect(html).toContain('Spelling Practice: Lesson 2');
    expect(html).toContain('apple');
  });
});
