/**
 * Residual reader for Task 3.6: the sound units of unit 2 weeks 9 to 16 that ask two or more
 * positions, and the sound-stage-plan row of each week. English output only.
 */
import { readFileSync } from 'node:fs';
import { soundUnits, checkSoundStagePlan } from '../../../dashboard/lib/storytime/sound-stages';

const root = new URL('../../../content/storytime/drafts/l2/', import.meta.url);
const out: unknown[] = [];
for (let w = 9; w <= 16; w += 1) {
  const name = `w${String(w).padStart(2, '0')}.json`;
  const week = JSON.parse(readFileSync(new URL(name, root), 'utf8')) as unknown;
  const units = soundUnits(week);
  const multi = units
    .filter((u) => u.positions.length > 1)
    .map((u) => ({ where: u.where, positions: u.positions, text: u.text.replace(/\s+/g, ' ').slice(0, 60) }));
  out.push({ week: w, unitCount: units.length, multi, plan: checkSoundStagePlan(week) });
}
process.stdout.write(`${JSON.stringify(out)}\n`);
