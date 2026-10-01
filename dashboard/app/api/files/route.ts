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
  const body = fs.readFileSync(file);
  const headers = { 'content-type': type, 'cache-control': 'no-store', 'accept-ranges': 'bytes' };
  // The audio player seeks with byte ranges; without a 206 answer Chrome starts again at 0.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '');
  if (!range) return new NextResponse(body, { headers });
  const size = body.length;
  const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
  const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
  if (start >= size || start > end) {
    return new NextResponse(null, { status: 416, headers: { ...headers, 'content-range': `bytes */${size}` } });
  }
  return new NextResponse(body.subarray(start, end + 1), {
    status: 206,
    headers: { ...headers, 'content-range': `bytes ${start}-${end}/${size}` },
  });
}
