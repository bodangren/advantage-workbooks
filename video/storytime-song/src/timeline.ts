import type { Bubble, Spec } from "./types";

/** One picture on the screen: consecutive lines with the same picture make one shot. */
export type Shot = {
  start: number;
  end: number;
  picture: number;
  scene: string;
  actors: string[];
  bubbles: Bubble[];
  /** The actors slide in: the shot before has the same scene and other actors. */
  enter: boolean;
  /** The actors slide out: the shot after has the same scene and other actors. */
  exit: boolean;
};

const sameCast = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * The shots of a song: a new shot at the start of each line that shows another picture.
 * @param spec The line spec.
 * @returns The shots in time order; the first starts at 0 s and the last ends at the end of the audio.
 */
export function shots(spec: Spec): Shot[] {
  const out: Shot[] = [];
  for (const line of spec.lines) {
    const last = out[out.length - 1];
    if (last && last.picture === line.picture) {
      last.bubbles.push(...line.bubbles);
      continue;
    }
    out.push({
      start: out.length ? line.start : 0,
      end: 0,
      picture: line.picture,
      scene: line.scene,
      actors: line.actors,
      bubbles: [...line.bubbles],
      enter: false,
      exit: false,
    });
  }
  out.forEach((shot, k) => {
    const before = out[k - 1];
    const after = out[k + 1];
    shot.end = after ? after.start : spec.duration;
    shot.enter =
      !!before &&
      before.scene === shot.scene &&
      !sameCast(before.actors, shot.actors);
    shot.exit =
      !!after &&
      after.scene === shot.scene &&
      !sameCast(after.actors, shot.actors);
  });
  return out;
}

/**
 * The runs of one scene: a hard cut only where the background changes.
 * @param list The shots.
 * @returns Each run with its scene, start, and end.
 */
export function sceneRuns(
  list: Shot[],
): { scene: string; start: number; end: number }[] {
  const runs: { scene: string; start: number; end: number }[] = [];
  for (const shot of list) {
    const last = runs[runs.length - 1];
    if (last && last.scene === shot.scene) last.end = shot.end;
    else runs.push({ scene: shot.scene, start: shot.start, end: shot.end });
  }
  return runs;
}

/**
 * The time from which a line is on the screen: in a gap, the next line shows up to 1.2 s before it is sung.
 * @param spec The line spec.
 * @param i The 0-based line.
 * @returns The time in seconds.
 */
export function showFrom(spec: Spec, i: number): number {
  if (i === 0) return 0;
  const line = spec.lines[i];
  return Math.min(
    line.start,
    Math.max(spec.lines[i - 1].end + 0.25, line.start - 1.2),
  );
}

/**
 * The line and the singing on the screen at a time.
 * @param spec The line spec.
 * @param t The time in seconds.
 * @returns The 0-based line and segment.
 */
export function lyricAt(
  spec: Spec,
  t: number,
): { line: number; segment: number } {
  let line = 0;
  spec.lines.forEach((_, i) => {
    if (showFrom(spec, i) <= t) line = i;
  });
  const segs = spec.lines[line].segments;
  let segment = 0;
  segs.forEach((s, k) => {
    if (k > 0 && s.start - 0.15 <= t) segment = k;
  });
  return { line, segment };
}

/**
 * The gesture of the line at a time: the line from its start to 0.5 s after its end, else none (idle).
 * @param spec The line spec.
 * @param t The time in seconds.
 * @returns The 0-based line, or -1.
 */
export function gestureLineAt(spec: Spec, t: number): number {
  let found = -1;
  spec.lines.forEach((line, i) => {
    if (line.start <= t && t < line.end + 0.5) found = i;
  });
  return found;
}
