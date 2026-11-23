import type { Spec } from "./types";

/** A rectangle in frame pixels, with both the layout and geometry naming conventions. */
export type Box = {
  left: number;
  top: number;
  width: number;
  height: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** A drawn actor in frame pixels of one cut: its name, draw kind, and exact box. */
export type ActorBox = {
  name: string;
  kind: "cutout" | "figure" | "placeholder";
  box: Box;
};

/** The named people that draw as standing person figures; other labels are flat placeholders. */
const PERSON_FIGURES = new Set(["Dad", "Mom", "Grandma", "Grandpa", "Tom", "May"]);

/**
 * Equal, touching slots inside an interval, in frame pixels.
 * @param intervals The x ranges that keep actors off the rug and the inset card.
 * @param width The width of one actor box.
 * @returns The centre x of each slot.
 */
function slotCenters(intervals: readonly (readonly [number, number])[], width: number): number[] {
  const centers: number[] = [];
  for (const [start, end] of intervals) {
    for (let center = start + width / 2; center + width / 2 <= end; center += width) {
      centers.push(center);
    }
  }
  return centers;
}

/**
 * The boxes drawn for one line of a cut. Pure: no hooks, no files, no clock. The same function feeds the renderer
 * and the box tests, so the tested boxes are the drawn boxes. Boxes sit on the floor band, off the rug centre,
 * lyric box, and inset card, and they do not overlap each other.
 * @param spec The line spec of the week.
 * @param line The index of the line in the spec.
 * @param cut The cut: classroom (1920x1080) or portrait (1080x1920 composition frame).
 * @returns One box per actor of the line, in frame pixels.
 */
export function actorBoxes(spec: Spec, line: number, cut: "classroom" | "portrait"): ActorBox[] {
  const names = spec.lines[line]?.actors ?? [];
  if (!names.length) return [];
  const portrait = cut === "portrait";
  // Feet on the ground line: 800 in the scene frame, scaled into the portrait composition frame.
  const feet = portrait ? 800 * (1080 / 1920) : 800;
  const height = portrait ? 440 : 300;
  const width = portrait ? 100 : 150;
  const slots = portrait
    ? slotCenters([[0, 400], [680, 1080]], width)
    : slotCenters([[40, 740], [1180, 1580]], width);
  return names.map((name, i) => {
    const index = names.length === 1
      ? Math.floor(slots.length / 2)
      : Math.round((i * (slots.length - 1)) / (names.length - 1));
    const center = slots[Math.min(index, slots.length - 1)];
    const kind: ActorBox["kind"] =
      spec.forge && name in spec.forge.cast ? "cutout"
        : PERSON_FIGURES.has(name) ? "figure" : "placeholder";
    const left = center - width / 2;
    const top = feet - height;
    return {
      name,
      kind,
      box: { left, top, width, height, x: left, y: top, w: width, h: height },
    };
  });
}
