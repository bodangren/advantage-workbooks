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
  lines: Line[];
};
