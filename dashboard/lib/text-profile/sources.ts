import fs from 'fs';
import path from 'path';
import { splitParagraphs } from './text';

/** One lesson text with its glossed words, from a draft file or a lesson JSON. */
export interface LessonText {
    id: string;
    title: string;
    source: string;
    paragraphs: string[];
    /** Glossed (taught) words, lower case. */
    glossed: string[];
    /** Words from earlier lessons that the brief says the text must use again. */
    recycle?: string[];
    /** Extra proper names for this text. */
    names?: string[];
    /** Words above Starters that the brief allows; the Starters share does not count them. */
    allow?: string[];
    /** Profile id; the book default applies when it is absent. */
    profile?: string;
}

const list = (v: string | undefined, lower: boolean) =>
    (v ?? '')
        .split(',')
        .map((x) => (lower ? x.trim().toLowerCase() : x.trim()))
        .filter(Boolean);

/**
 * Parses a draft Markdown file: optional front matter (lesson, title, profile, glossed, recycle,
 * names, allow; lists are comma-separated), then paragraphs separated by blank lines. Headings and
 * HTML comments are ignored.
 * @param markdown File content.
 * @param source File path, for the report and the default id.
 * @returns The lesson text.
 */
export function parseDraft(markdown: string, source: string): LessonText {
    const text = markdown.replace(/\r\n/g, '\n');
    const fm: Record<string, string> = {};
    let body = text;
    const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
    if (m) {
        for (const line of m[1].split('\n')) {
            const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
            if (kv) fm[kv[1].toLowerCase()] = kv[2].trim();
        }
        body = text.slice(m[0].length);
    }
    body = body
        .replace(/<!--[\s\S]*?-->/g, '')
        .split('\n')
        .filter((l) => !/^\s*#/.test(l))
        .join('\n');
    const id = fm.lesson || path.basename(source).replace(/\.md$/i, '');
    const lesson: LessonText = {
        id,
        title: fm.title || id,
        source,
        paragraphs: splitParagraphs(body),
        glossed: list(fm.glossed, true),
    };
    if (fm.recycle) lesson.recycle = list(fm.recycle, true);
    if (fm.names) lesson.names = list(fm.names, false);
    if (fm.allow) lesson.allow = list(fm.allow, true);
    if (fm.profile) lesson.profile = fm.profile;
    return lesson;
}

interface WorkbookLessonJson {
    lesson_title?: string;
    article_paragraphs?: { number?: number; text: string }[];
    vocabulary?: { word: string }[];
}

/**
 * Reads the article text and glossed words from a workbook lesson JSON.
 * @param json Parsed `*_workbook.json` content.
 * @param source File path; its leading digits become the id.
 * @returns The lesson text.
 */
export function parseLessonJson(json: unknown, source: string): LessonText {
    const j = json as WorkbookLessonJson;
    const base = path.basename(source);
    const id = base.match(/^(\d+)/)?.[1] ?? base.replace(/_workbook\.json$/, '').trim();
    const paragraphs = [...(j.article_paragraphs ?? [])]
        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
        .map((p) => p.text.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    return {
        id,
        title: j.lesson_title ?? id,
        source,
        paragraphs,
        glossed: (j.vocabulary ?? []).map((v) => v.word.trim().toLowerCase()).filter(Boolean),
    };
}

/**
 * Loads every lesson in a folder, sorted by file name: `*_workbook.json` files and draft `.md`
 * files that start with front matter. Other Markdown files (README.md, teacher documents) are skipped.
 * @param dir Folder path.
 * @returns The lessons in file-name order.
 */
export function loadLessonFolder(dir: string): LessonText[] {
    const lessons: LessonText[] = [];
    for (const f of fs.readdirSync(dir).sort()) {
        const file = path.join(dir, f);
        if (f.endsWith('_workbook.json')) {
            lessons.push(parseLessonJson(JSON.parse(fs.readFileSync(file, 'utf-8')), file));
        } else if (/\.md$/i.test(f) && f.toLowerCase() !== 'readme.md') {
            const content = fs.readFileSync(file, 'utf-8');
            if (/^---\r?\n/.test(content)) lessons.push(parseDraft(content, file));
        }
    }
    return lessons;
}
