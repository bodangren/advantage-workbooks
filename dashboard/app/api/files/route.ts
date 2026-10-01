import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { contentRoot, sheetsDir } from '@/lib/review/server';

export const dynamic = 'force-dynamic';

const ROOTS: Record<string, () => string> = { content: contentRoot, sheets: sheetsDir };
const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
};

/** GET /api/files?root=content|sheets&path=<relative>: one media file for the review page. */
export async function GET(req: NextRequest) {
  const root = ROOTS[req.nextUrl.searchParams.get('root') ?? ''];
  const rel = req.nextUrl.searchParams.get('path') ?? '';
  const type = TYPES[path.extname(rel).toLowerCase()];
  if (!root || !type || rel.split(/[\\/]/).includes('..') || path.isAbsolute(rel)) {
    return NextResponse.json({ error: 'Invalid root or path' }, { status: 400 });
  }
  const base = path.resolve(root());
  const file = path.resolve(base, rel);
  if (!file.startsWith(base + path.sep)) return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  if (!fs.existsSync(file)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(fs.readFileSync(file), { headers: { 'content-type': type, 'cache-control': 'no-store' } });
}
