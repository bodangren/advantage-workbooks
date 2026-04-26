import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { WorkbookLessonSchema } from '@/lib/workbook-schema';

const PROJECT_DIRS = [
  'primary/origins-2-a0',
  'primary/origins-3.1-a0',
];

describe('Origins Thai support content', () => {
  for (const projectDir of PROJECT_DIRS) {
    it(`validates bilingual vocabulary fields for ${projectDir}`, () => {
      const absDir = path.resolve(process.cwd(), '..', projectDir);
      const lessonFiles = fs.readdirSync(absDir)
        .filter(name => name.endsWith('_workbook.json'))
        .sort();

      expect(lessonFiles.length).toBeGreaterThan(0);

      for (const lessonFile of lessonFiles) {
        const lessonPath = path.join(absDir, lessonFile);
        const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
        const result = WorkbookLessonSchema.safeParse(lesson);

        expect(result.success, `${projectDir}/${lessonFile} should satisfy WorkbookLessonSchema`).toBe(true);
        if (!result.success) continue;

        for (const vocab of result.data.vocabulary) {
          expect(vocab.thai_definition, `${projectDir}/${lessonFile} vocabulary "${vocab.word}" is missing thai_definition`).toBeTruthy();
        }

        for (const match of result.data.vocab_match ?? []) {
          expect(match.thai_definition, `${projectDir}/${lessonFile} match item "${match.word}" is missing thai_definition`).toBeTruthy();
        }
      }
    });
  }
});
