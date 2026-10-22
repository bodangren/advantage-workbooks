import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Figure, GESTURES, LOOKS, NEUTRAL } from "./art/Figure";
import { gestureLineAt } from "./timeline";
import type { Spec } from "./types";

/** The inset box: lower right, 30 percent of the frame height. */
export const INSET = { width: 270, height: 324, right: 48, bottom: 48 };

/**
 * A Sprout that does the gesture of the line, mirrored (the class copies it like a mirror), held for the line.
 * A moving gesture swaps its two key frames on each beat; a whole-body gesture moves the sprite.
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
    </div>
  );
};
