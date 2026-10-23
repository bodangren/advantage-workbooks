// The two frames of the song video: the classroom cut (landscape, 1920 x 1080) and the phone cut (portrait,
// 1080 x 1920, for the QR page; Daniel, 2026-10-23).

/** A box in frame pixels. */
export type Box = { left: number; top: number; width: number; height: number };

/** The frame of the classroom scene; the scene, the actors, and the ground line are drawn in it. */
export const SCENE = { width: 1920, height: 1080 };

/** The portrait frame of the phone cut. */
export const PORTRAIT = { width: 1080, height: 1920 };

/** The scale of the classroom scene in the top band of the portrait frame: full width, no crop. */
export const PORTRAIT_SCENE_SCALE = PORTRAIT.width / SCENE.width;

/**
 * The parts of the portrait frame, from the top: the classroom scene at 16:9, the line text, and the Sprout that
 * does the gesture of the line (the child copies it, so it is the largest part).
 */
export const PORTRAIT_BOXES: { scene: Box; lyrics: Box; gesture: Box } = {
  scene: {
    left: 0,
    top: 0,
    width: PORTRAIT.width,
    height: SCENE.height * PORTRAIT_SCENE_SCALE,
  },
  lyrics: { left: 40, top: 628, width: 1000, height: 380 },
  gesture: { left: 120, top: 1032, width: 840, height: 856 },
};

/**
 * The font size of the line text, from the letters and spaces of the words on screen.
 * @param chars The letters of the words plus one for each word.
 * @param portrait True for the phone cut (the text wraps to three lines at most in its box).
 * @returns The font size in frame pixels.
 */
export function lyricSize(chars: number, portrait = false): number {
  if (!portrait) return chars > 34 ? 70 : 84;
  if (chars <= 16) return 120;
  if (chars <= 24) return 104;
  return chars <= 32 ? 96 : 84;
}

/**
 * The span of the actor row in the scene frame, [left, right]. The classroom cut keeps the right part free for
 * the gesture inset; the phone cut centres the row on the rug (its gesture panel is below the scene).
 */
export const ACTOR_SPAN = {
  landscape: [200, 1480] as const,
  portrait: [320, 1600] as const,
};
