/** One sung word and its time in seconds. */
export type Word = { text: string; start: number; end: number };
/** One singing of a line: the line, or a repeat that the package writes in parentheses. */
export type Segment = { start: number; end: number; words: Word[] };
/** An animal sound in a speech bubble. */
export type Bubble = { text: string; start: number; end: number };

/** One sung line, from scripts/prepare.mjs. */
export type Line = {
  text: string;
  gesture: string;
  start: number;
  end: number;
  /** The 0-based line whose picture the line shows (its own index, or its imageOf). */
  picture: number;
  scene: string;
  actors: string[];
  bubbles: Bubble[];
  segments: Segment[];
};

/** The Forge render set of a week (scripts/forge.mjs); paths are under public/. */
export type ForgeArt = {
  /** Screen pixels for one canvas pixel of the cut-outs (one scale for the cast and the gesture frames). */
  scale: number;
  /** The canvas of the cut-outs, [width, height]. */
  canvas: [number, number];
  /** The point of the canvas that stands on the ground. */
  foot: { col: number; row: number };
  /** A cast name of the package ("Nan") to its front cut-out. */
  cast: Record<string, string>;
  /** A gesture of the package ("point to self") to its frames (two for a moving gesture). */
  gestures: Record<string, string[]>;
  /** The Adventurer standing still. */
  idle: string[];
  /** The canvas box that holds every gesture frame (the inset shows this box). */
  gestureBox: { x: number; y: number; w: number; h: number };
  /** A scene id to its 1920 x 1080 render. */
  scenes: Record<string, string>;
};

/** The line spec of one song video (public/<level>/<week>/spec.json). */
export type Spec = {
  key: string;
  level: number;
  week: number;
  /** The theme of the week (focus.family.name.en), for the start screen. */
  theme: string;
  title: string;
  bpm: number;
  /** The length of the song audio in seconds. */
  duration: number;
  /** The audio path under public/. */
  audio: string;
  art: "placeholder" | "forge";
  /** The Forge art, when the week has a Forge set (else the placeholder art). */
  forge?: ForgeArt;
  lines: Line[];
};
