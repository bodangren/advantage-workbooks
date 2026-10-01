import { NextRequest, NextResponse } from 'next/server';
import { LessonPackageSchema } from '@/lib/lesson-package/schema';
import { checkPackage, schemaFailure } from '@/lib/lesson-package/checks';
import { checkContextFor } from '@/lib/lesson-package/context';
import { readPackageFile, savePackage } from '@/lib/lesson-package/store';
import { contentRoot, errorResponse } from '@/lib/review/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ book: string; lesson: string }> };

/** GET /api/packages/:book/:lesson: the package as stored, with its check report. */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { book, lesson } = await params;
    const raw = readPackageFile(contentRoot(), book, lesson);
    const parsed = LessonPackageSchema.safeParse(raw);
    const report = parsed.success
      ? checkPackage(parsed.data, checkContextFor(parsed.data))
      : schemaFailure(parsed.error.issues);
    return NextResponse.json({ package: parsed.success ? parsed.data : raw, report });
  } catch (e) {
    return errorResponse(e);
  }
}

/** PUT /api/packages/:book/:lesson: save an edit. 400 with the report when the package does not parse. */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { book, lesson } = await params;
    const result = savePackage(contentRoot(), book, lesson, await req.json(), checkContextFor);
    return NextResponse.json(
      { saved: result.saved, package: result.pkg, report: result.report },
      { status: result.saved ? 200 : 400 },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
