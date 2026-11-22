import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { BUBBLE_BOX } from "./layout";
import { bubbleAt } from "./timeline";
import type { Spec } from "./types";

/**
 * The speech Bubble card of one song. It reads the active bubble from bubbles[].text of the line spec:
 * plain text from the sound words, never a picture with letters inside a render.
 * @param props.spec The line spec.
 * @param props.portrait True for the phone cut (the card sits in the top scene band).
 */
export const SoundCard: React.FC<{ spec: Spec; portrait?: boolean }> = ({
  spec,
  portrait = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bubble = bubbleAt(spec, frame / fps);
  if (!bubble) return null;
  const box = portrait ? BUBBLE_BOX.portrait : BUBBLE_BOX.landscape;
  return (
    <div
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 18px",
        borderRadius: 40,
        background: "#FFFBEF",
        border: "8px solid #6CBF4F",
        boxShadow: "0 10px 0 rgba(43,43,72,0.18)",
        color: "#2B2B48",
        fontSize: portrait ? 48 : 60,
        fontWeight: 700,
        textAlign: "center",
      }}
    >
      {bubble.text}
    </div>
  );
};
