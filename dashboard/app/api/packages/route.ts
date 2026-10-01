import { NextResponse } from 'next/server';
import { checkContextFor } from '@/lib/lesson-package/context';
import { listBooks } from '@/lib/lesson-package/store';
import { contentRoot, errorResponse } from '@/lib/review/server';

export const dynamic = 'force-dynamic';

/** GET /api/packages: every book with its lessons, approval states, and FAIL and WARN counts. */
export async function GET() {
  try {
    return NextResponse.json(listBooks(contentRoot(), checkContextFor));
  } catch (e) {
    return errorResponse(e);
  }
}
