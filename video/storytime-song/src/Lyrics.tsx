import { loadFont } from "@remotion/google-fonts/Andika";
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { INSET } from "./GestureInset";
import { lyricSize, PORTRAIT_BOXES } from "./layout";
import { lyricAt } from "./timeline";
import type { Spec } from "./types";

/** Andika: a font for early readers (single-storey "a" and "g", the letter shapes that the children write). */
const { fontFamily } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

const SUNG = "#FFD23F";
const AHEAD = "#FFFFFF";
const OUTLINE = "#2B2B48";

/** The text box of the classroom cut: at the bottom, left of the gesture inset. */
const LANDSCAPE_BOX: React.CSSProperties = {
  left: 80,
  right: INSET.right + INSET.width + 40,
  bottom: INSET.bottom,
  minHeight: 160,
};

/**
 * The line text (English only), each word lit at its sung time. A repeat in parentheses shows as its own
 * singing, so the class reads the words that the singer sings now.
 * @param props.spec The line spec.
 * @param props.portrait True for the phone cut: the text box is the middle band of the portrait frame.
 */
export const Lyrics: React.FC<{ spec: Spec; portrait?: boolean }> = ({
  spec,
  portrait = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { line, segment } = lyricAt(spec, t);
  const words = spec.lines[line].segments[segment].words;
  const chars = words.reduce((n, w) => n + w.text.length + 1, 0);
  const size = lyricSize(chars, portrait);
  return (
    <div
      style={{
        position: "absolute",
        ...(portrait
          ? { ...PORTRAIT_BOXES.lyrics, boxSizing: "border-box" }
          : LANDSCAPE_BOX),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: portrait ? "16px 24px" : "18px 36px",
        borderRadius: 40,
        // On the plain page of the phone cut, a darker box keeps the contrast that the scene gives the classroom cut.
        background: portrait ? "rgba(43,43,72,0.88)" : "rgba(43,43,72,0.55)",
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: size,
          lineHeight: portrait ? 1.2 : 1.25,
          textAlign: "center",
        }}
      >
        {words.map((w, k) => {
          const lit = t >= w.start;
          const now = lit && t < w.end;
          return (
            <span
              key={k}
              style={{
                display: "inline-block",
                margin: "0 0.18em",
                color: lit ? SUNG : AHEAD,
                WebkitTextStroke: `10px ${OUTLINE}`,
                paintOrder: "stroke fill",
                scale: now ? "1.12" : "1",
                translate: now ? "0px -6px" : "0px 0px",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
