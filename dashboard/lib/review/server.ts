import path from 'path';
import { NextResponse } from 'next/server';
import { CONTENT_ROOT, REPO_ROOT } from '../lesson-package/files';
import { StoreError } from '../lesson-package/store';

/** Shared parts of the review API routes (track review_page_20261001). Server only. */

/** The lesson-package folder. LESSON_CONTENT_ROOT points the tests at a temporary folder. */
export const contentRoot = () => process.env.LESSON_CONTENT_ROOT || CONTENT_ROOT;

/** The character-sheets folder. CHARACTER_SHEETS_DIR points the tests at a temporary folder. */
export const sheetsDir = () => process.env.CHARACTER_SHEETS_DIR || path.join(REPO_ROOT, 'docs/content-plans/character-sheets');

/** Today as YYYY-MM-DD in local time. */
export const today = () => new Date().toLocaleDateString('sv-SE');

/**
 * A JSON error response: the StoreError status, or 500.
 * @param e The thrown value.
 * @returns The response.
 */
export function errorResponse(e: unknown): NextResponse {
    if (e instanceof StoreError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
}
