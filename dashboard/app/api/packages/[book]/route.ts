import path from 'path';
import { NextResponse } from 'next/server';
import { loadPackageFolder } from '@/lib/lesson-package/files';
import { contentRoot, errorResponse } from '@/lib/review/server';

export const dynamic = 'force-dynamic';

/** GET /api/packages/:book: the pictures of every lesson in a book, for the picture sheet. */
export async function GET(_req: Request, { params }: { params: Promise<{ book: string }> }) {
  try {
    const { book } = await params;
    if (!/^[a-z0-9][a-z0-9.-]*$/.test(book)) return NextResponse.json({ error: `Bad book name: ${book}` }, { status: 400 });
    const lessons = loadPackageFolder(path.join(contentRoot(), book)).flatMap((f) =>
      f.pkg
        ? [{
            lesson: path.basename(f.file, '.json'),
            title: f.pkg.meta.title,
            imagesApproved: f.pkg.approval.images.status === 'approved',
            images: f.pkg.images.map((i) => ({ position: i.position, caption: i.caption, file: i.file, prompt: i.prompt })),
          }]
        : [],
    );
    return NextResponse.json({ book, lessons });
  } catch (e) {
    return errorResponse(e);
  }
}
