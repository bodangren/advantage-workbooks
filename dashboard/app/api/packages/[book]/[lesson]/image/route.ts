import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkContextFor } from '@/lib/lesson-package/context';
import { chooseImage } from '@/lib/lesson-package/store';
import { contentRoot, errorResponse } from '@/lib/review/server';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({ position: z.string().min(1), candidate: z.string().min(1) });

/** POST /api/packages/:book/:lesson/image { position, candidate }: make a candidate the picture. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ book: string; lesson: string }> }) {
  try {
    const { book, lesson } = await params;
    const body = BodySchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: 'position and candidate are required' }, { status: 400 });
    const result = await chooseImage(contentRoot(), book, lesson, body.data.position, body.data.candidate, checkContextFor);
    return NextResponse.json({ package: result.pkg, report: result.report });
  } catch (e) {
    return errorResponse(e);
  }
}
