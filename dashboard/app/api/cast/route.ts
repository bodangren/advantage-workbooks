import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CastSchema } from '@/lib/media/cast';
import { errorResponse, sheetsDir, today } from '@/lib/review/server';

export const dynamic = 'force-dynamic';

const castFile = () => path.join(sheetsDir(), 'cast.json');
const readCast = () => CastSchema.parse(JSON.parse(fs.readFileSync(castFile(), 'utf8')));
const BodySchema = z.object({ name: z.string(), candidate: z.string() });

/** GET /api/cast: the cast with each character's candidates and chosen sheet. */
export async function GET() {
  try {
    return NextResponse.json(readCast());
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/cast { name, candidate }: copy the candidate to `<name>.<ext>` and record it as the sheet. */
export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: 'name and candidate are required' }, { status: 400 });
    const cast = readCast();
    const character = cast.characters.find((c) => c.name === body.data.name);
    if (!character) return NextResponse.json({ error: `No character ${body.data.name}` }, { status: 404 });
    if (!character.candidates.includes(body.data.candidate)) {
      return NextResponse.json(
        { error: `${body.data.candidate} is not a candidate for ${character.name}` },
        { status: 400 },
      );
    }
    const sheet = `${character.name}${path.extname(body.data.candidate).toLowerCase()}`;
    fs.copyFileSync(path.join(sheetsDir(), body.data.candidate), path.join(sheetsDir(), sheet));
    character.chosen = sheet;
    character.chosenFrom = body.data.candidate;
    character.approved = today();
    fs.writeFileSync(castFile(), `${JSON.stringify(cast, null, 2)}\n`);
    return NextResponse.json(cast);
  } catch (e) {
    return errorResponse(e);
  }
}
