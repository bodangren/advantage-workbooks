import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Figure, GESTURES, LOOKS, NEUTRAL } from "./art/Figure";
import { PORTRAIT_BOXES } from "./layout";
import { gestureLineAt } from "./timeline";
import type { ForgeArt, Spec } from "./types";

/** The inset box: lower right, 30 percent of the frame height. */
export const INSET = { width: 270, height: 324, right: 48, bottom: 48 };

/**
 * The gesture inset of the classroom cut: lower right, beside the line text.
 * @param props.spec The line spec.
 */
export const GestureInset: React.FC<{ spec: Spec }> = ({ spec }) => (
  <GestureCard
    spec={spec}
    width={INSET.width}
    height={INSET.height}
    place={{ right: INSET.right, bottom: INSET.bottom }}
  />
);

/**
 * The gesture panel of the phone cut: the bottom part of the portrait frame, the largest part of the frame.
 * @param props.spec The line spec.
 */
export const GesturePanel: React.FC<{ spec: Spec }> = ({ spec }) => {
  const { left, top, width, height } = PORTRAIT_BOXES.gesture;
  return (
    <GestureCard spec={spec} width={width} height={height} place={{ left, top }} />
  );
};

/**
 * A Sprout that does the gesture of the line, mirrored (the class copies it like a mirror), held for the line.
 * A moving gesture swaps its two key frames on each beat; a whole-body gesture moves the sprite. With Forge art,
 * the Sprout is the Adventurer: the frames of the gesture, or the idle frame between lines.
 * @param props.spec The line spec.
 * @param props.width The outer width of the card, with its 8 px border.
 * @param props.height The outer height of the card.
 * @param props.place The position of the card in the frame.
 */
const GestureCard: React.FC<{
  spec: Spec;
  width: number;
  height: number;
  place: React.CSSProperties;
}> = ({ spec, width, height, place }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const i = gestureLineAt(spec, t);
  const line = i >= 0 ? spec.lines[i] : undefined;
  const g = line ? GESTURES[line.gesture] : undefined;
  const since = line ? t - line.start : 0;
  const beats = (since * spec.bpm) / 60;
  const phase = beats - Math.floor(beats);
  let pose = g ? g.a : NEUTRAL;
  if (g?.motion === "moving" && g.b && Math.floor(beats) % 2 === 1) pose = g.b;
  let lift = 0;
  let rotate = 0;
  let turn = 1;
  if (g?.motion === "whole") {
    if (line?.gesture === "hop") lift = Math.sin(Math.PI * phase) * 46;
    if (line?.gesture === "sway") rotate = Math.sin((Math.PI * beats) / 1) * 10;
    if (line?.gesture === "turn") turn = Math.cos((2 * Math.PI * beats) / 4);
  }
  const h = height - 60;
  const figure = spec.forge ? (
    <ForgeFigure
      forge={spec.forge}
      frames={(line && spec.forge.gestures[line.gesture]) || spec.forge.idle}
      beats={beats}
      inner={{ width: width - 16, height: height - 16 }}
    />
  ) : (
    <div
      style={{
        position: "absolute",
        left: (width - 16 - (h * 240) / 340) / 2,
        top: 30 - lift,
        scale: `${-1 * turn} 1`,
        rotate: `${rotate}deg`,
        transformOrigin: "50% 90%",
      }}
    >
      <Figure look={LOOKS.Sprout} pose={pose} height={h} />
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        ...place,
        width,
        height,
        borderRadius: 36,
        background: "#FFFBEF",
        border: "8px solid #6CBF4F",
        boxShadow: "0 10px 0 rgba(43,43,72,0.18)",
        overflow: "hidden",
      }}
    >
      {figure}
    </div>
  );
};

/**
 * One Forge frame of the Adventurer in the card, mirrored: the gesture box of the set fills the inner height, with
 * the feet near the bottom. A gesture with two frames swaps them on each beat.
 * @param props.forge The Forge art.
 * @param props.frames The frames of the gesture.
 * @param props.beats The beats since the line start.
 * @param props.inner The inner size of the card (inside the 8 px border).
 */
const ForgeFigure: React.FC<{
  forge: ForgeArt;
  frames: string[];
  beats: number;
  inner: { width: number; height: number };
}> = ({ forge, frames, beats, inner }) => {
  const box = forge.gestureBox;
  const s = Math.min((inner.width - 24) / box.w, (inner.height - 20) / box.h);
  const frame = frames[Math.floor(Math.max(0, beats)) % frames.length];
  return (
    <div
      style={{
        position: "absolute",
        width: inner.width,
        height: inner.height,
        scale: "-1 1",
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile(frame)}
        style={{
          position: "absolute",
          left: inner.width / 2 - (box.x + box.w / 2) * s,
          top: inner.height - 8 - (box.y + box.h) * s,
          width: forge.canvas[0] * s,
          height: forge.canvas[1] * s,
        }}
      />
    </div>
  );
};
