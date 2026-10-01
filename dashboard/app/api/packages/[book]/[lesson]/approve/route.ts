import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { APPROVAL_PARTS } from '@/lib/lesson-package/schema';
import { checkContextFor } from '@/lib/lesson-package/context';
import { approvePart } from '@/lib/lesson-package/store';
import { contentRoot, errorResponse, today } from '@/lib/review/server';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({ part: z.enum(APPROVAL_PARTS) });

/** POST /api/packages/:book/:lesson/approve { part }: approve one part, or the lesson. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ book: string; lesson: string }> }) {
  try {
    const { book, lesson } = await params;
    const body = BodySchema.safeParse(await req.json());
    if (!body.success)
      return NextResponse.json({ error: `part must be one of: ${APPROVAL_PARTS.join(', ')}` }, { status: 400 });
    const pkg = approvePart(contentRoot(), book, lesson, body.data.part, checkContextFor, today());
    return NextResponse.json({ package: pkg });
  } catch (e) {
    return errorResponse(e);
  }
}
