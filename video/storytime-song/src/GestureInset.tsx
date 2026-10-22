import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Figure, GESTURES, LOOKS, NEUTRAL } from "./art/Figure";
import { gestureLineAt } from "./timeline";
import type { ForgeArt, Spec } from "./types";

/** The inset box: lower right, 30 percent of the frame height. */
export const INSET = { width: 270, height: 324, right: 48, bottom: 48 };

/**
 * A Sprout that does the gesture of the line, mirrored (the class copies it like a mirror), held for the line.
 * A moving gesture swaps its two key frames on each beat; a whole-body gesture moves the sprite. With Forge art,
 * the Sprout is the Adventurer: the frames of the gesture, or the idle frame between lines.
 * @param props.spec The line spec.
 */
export const GestureInset: React.FC<{ spec: Spec }> = ({ spec }) => {
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
  const h = INSET.height - 60;
  const figure = spec.forge ? (
    <ForgeFigure
      forge={spec.forge}
      frames={(line && spec.forge.gestures[line.gesture]) || spec.forge.idle}
      beats={beats}
    />
  ) : (
    <div
      style={{
        position: "absolute",
        left: (INSET.width - 16 - (h * 240) / 340) / 2,
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
        right: INSET.right,
        bottom: INSET.bottom,
        width: INSET.width,
        height: INSET.height,
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

/** The inner size of the inset box (inside the 8 px border). */
const INNER = { width: INSET.width - 16, height: INSET.height - 16 };

/**
 * One Forge frame of the Adventurer in the inset, mirrored: the gesture box of the set fills the inner height, with
 * the feet near the bottom. A gesture with two frames swaps them on each beat.
 * @param props.forge The Forge art.
 * @param props.frames The frames of the gesture.
 * @param props.beats The beats since the line start.
 */
const ForgeFigure: React.FC<{ forge: ForgeArt; frames: string[]; beats: number }> = ({
  forge,
  frames,
  beats,
}) => {
  const box = forge.gestureBox;
  const s = Math.min((INNER.width - 24) / box.w, (INNER.height - 20) / box.h);
  const frame = frames[Math.floor(Math.max(0, beats)) % frames.length];
  return (
    <div
      style={{
        position: "absolute",
        width: INNER.width,
        height: INNER.height,
        scale: "-1 1",
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile(frame)}
        style={{
          position: "absolute",
          left: INNER.width / 2 - (box.x + box.w / 2) * s,
          top: INNER.height - 8 - (box.y + box.h) * s,
          width: forge.canvas[0] * s,
          height: forge.canvas[1] * s,
        }}
      />
    </div>
  );
};
