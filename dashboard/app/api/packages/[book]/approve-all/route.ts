import { NextResponse } from 'next/server';
import { checkContextFor } from '@/lib/lesson-package/context';
import { approveBook } from '@/lib/lesson-package/store';
import { contentRoot, errorResponse, today } from '@/lib/review/server';

export const dynamic = 'force-dynamic';

/** POST /api/packages/:book/approve-all: approve every lesson of the book that is ready (no FAIL, media made). */
export async function POST(_req: Request, { params }: { params: Promise<{ book: string }> }) {
  try {
    const { book } = await params;
    return NextResponse.json(approveBook(contentRoot(), book, checkContextFor, today()));
  } catch (e) {
    return errorResponse(e);
  }
}
