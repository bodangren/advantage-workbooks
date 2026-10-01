// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { VOICES, voicesFor } from '../lib/media/audio';
import { stableAudioId, tutorClips, tutorItems, tutorManifest, tutorUploads } from '../lib/media/tutor-audio';
import { fixturePackage } from './fixtures/lesson-package-fixture';

/**
 * The expected ids come from tutor-advantage's own formula (scripts/generate-article-tts.mjs and
 * services/learning-service/src/services/ttsManifest.ts), so Tutor finds every clip.
 */
const pkg = () => LessonPackageSchema.parse(fixturePackage());

describe('Tutor audio items', () => {
    it('makes the same ids as Tutor', () => {
        expect(stableAudioId('word', 0, 'ball')).toBe('word-001-1813d29a26');
        expect(stableAudioId('sentence', 4, 'It is under the sofa!')).toBe('sentence-005-fc0b497d36');
    });

    it('lists the sentences, the glossary words, the other words, and the questions in Tutor order', () => {
        const items = tutorItems(pkg());
        expect(items.sentences.map((s) => s.text)).toEqual([
            'This is Pip.',
            'Pip is a small brown puppy.',
            'Pip can see a red ball.',
            '"Where is the ball?" says Tom.',
            'It is under the sofa!',
            'Pip is happy.',
        ]);
        expect(items.sentences[4].id).toBe('sentence-005-fc0b497d36');
        expect(items.words.map((w) => [w.id, w.text])[0]).toEqual(['word-001-cd1cb4a3aa', 'sofa']);
        expect(items.sentenceWords.map((w) => w.text)).toEqual(['this', 'is', 'pip', 'a', 'small', 'brown', 'can', 'see', 'red', 'ball', 'where', 'the', 'says', 'tom', 'it', 'happy']);
        expect(items.sentenceWords[0].id).toBe('word-004-4972694ae8');
        expect(items.sentenceWords.at(-1)!.id).toBe('word-019-c51185c2d1');
        expect(items.questions.map((q) => [q.type, q.order])).toEqual([
            ['mcq', 0],
            ['mcq', 1],
            ['mcq', 2],
            ['saq', 3],
            ['saq', 4],
        ]);
        expect(items.questions[0].id).toBe('mcq-001-75f5ec8e11');
        expect(items.questions[0].options[0]).toEqual({ key: 'option1', id: 'mcq-001-75f5ec8e11-option1-faec0f06', text: 'under the sofa' });
        expect(items.questions[3]).toMatchObject({ id: 'saq-004-0c0744ca17', options: [] });
    });

    it('gives the story sentences the narrator voice and every other clip the teacher voice', () => {
        const clips = tutorClips(tutorItems(pkg()));
        expect(clips).toHaveLength(6 + 3 + 16 + 5 + 12);
        expect(new Set(clips.map((c) => c.id)).size).toBe(clips.length);
        expect(clips.filter((c) => c.role === 'narrator').map((c) => c.kind)).toEqual(Array(6).fill('sentence'));
        expect(clips.find((c) => c.text === 'under the sofa')?.role).toBe('teacher');
    });

    it('builds the manifest Tutor reads, with every clip ready', () => {
        const m = tutorManifest(tutorItems(pkg()), {
            articleId: 'cabc',
            bucket: 'tb',
            title: 'Where Is the Ball?',
            narratorVoice: 'N',
            teacherVoice: 'T',
            speed: 0.75,
            generatedAt: '2026-10-01T00:00:00.000Z',
        });
        expect(m).toMatchObject({ version: 1, articleId: 'cabc', source: 'PRIMARY_ADVANTAGE', voice: { voiceId: 'T', narratorVoiceId: 'N', languageCode: 'en-US', speakingRate: 0.75 } });
        expect(m.words[0]).toEqual({
            id: 'word-001-cd1cb4a3aa',
            order: 0,
            text: 'sofa',
            objectPath: 'articles/cabc/words/word-001-cd1cb4a3aa.mp3',
            audioUrl: 'https://storage.googleapis.com/tb/articles/cabc/words/word-001-cd1cb4a3aa.mp3',
            status: 'ready',
        });
        expect(m.sentences[0].objectPath).toBe(`articles/cabc/sentences/${m.sentences[0].id}.mp3`);
        expect(m.sentenceWords).toHaveLength(16);
        const q = m.questions[0];
        expect(q.questionAudioUrl).toBe('https://storage.googleapis.com/tb/articles/cabc/questions/mcq-001-75f5ec8e11.mp3');
        expect(Object.keys(q.optionAudioUrls)).toEqual(['option1', 'option2', 'option3', 'option4']);
        expect(m.questions[3].optionAudioUrls).toEqual({});
    });

    it('maps each local clip file to its bucket path', () => {
        const up = tutorUploads(tutorItems(pkg()), 'tb/media/1/tutor', 'cabc');
        expect(up).toHaveLength(42);
        expect(up[0]).toEqual({ from: 'tb/media/1/tutor/sentence-001-' + up[0].from.split('sentence-001-')[1], to: `articles/cabc/sentences/${up[0].from.split('/').at(-1)}` });
        expect(up.find((u) => u.to.endsWith('mcq-001-75f5ec8e11-option1-faec0f06.mp3'))).toEqual({
            from: 'tb/media/1/tutor/mcq-001-75f5ec8e11-option1-faec0f06.mp3',
            to: 'articles/cabc/questions/mcq-001-75f5ec8e11-option1-faec0f06.mp3',
        });
    });
});

describe('lesson voices', () => {
    it('uses the American voices: the package narrator for the story, the female voice for the teacher', () => {
        expect(voicesFor(pkg())).toEqual({ narrator: VOICES.female, teacher: VOICES.female });
        const p = pkg();
        p.audio.voice = VOICES.male;
        expect(voicesFor(p)).toEqual({ narrator: 'English_magnetic_voiced_man', teacher: 'English_captivating_female1' });
    });
});
