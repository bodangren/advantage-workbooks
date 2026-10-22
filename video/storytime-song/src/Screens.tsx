import { loadFont } from "@remotion/google-fonts/Andika";
import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { JINGLE_AT } from "./screens-config";
import type { Spec } from "./types";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

export { END_SECONDS, START_SECONDS } from "./screens-config";

/** Storytime Advantage colors (PR logos v2.0: tile amber 300, mark amber 800). */
const TILE = "#FCD34D";
const MARK = "#92400E";
const PAPER = "#FFFBEB";

/**
 * The start screen (silent): the product, the song title, and the level, week, and theme.
 * @param props.spec The line spec.
 */
export const StartScreen: React.FC<{ spec: Spec }> = ({ spec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, mass: 0.6 } });
  const fade = interpolate(frame, [0.25 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: PAPER,
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 640,
          height: 640,
          left: (1920 - 640) / 2,
          top: 540 - 320,
          borderRadius: "50%",
          background: TILE,
          opacity: 0.55,
          scale: `${0.8 + 0.2 * pop}`,
        }}
      />
      <Img
        src={staticFile("brand/storytime-advantage.svg")}
        style={{ position: "absolute", top: 70, height: 120 }}
      />
      <div
        style={{
          color: MARK,
          fontWeight: 700,
          fontSize: 132,
          textAlign: "center",
          padding: "0 160px",
          lineHeight: 1.1,
          scale: `${0.6 + 0.4 * pop}`,
        }}
      >
        {spec.title}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 150,
          color: MARK,
          fontSize: 60,
          opacity: fade,
        }}
      >
        {`Level ${spec.level}  ·  Week ${spec.week}${spec.theme ? `  ·  ${spec.theme}` : ""}`}
      </div>
    </AbsoluteFill>
  );
};

/**
 * The end screen: the Storytime Advantage logo pops in, with "Reading Advantage" sung from the company jingle,
 * and the Reading Advantage contact line.
 */
export const EndScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - 3,
    fps,
    config: { damping: 9, mass: 0.7 },
  });
  const line = interpolate(frame, [0.8 * fps, 1.3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: PAPER,
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <Img
        src={staticFile("brand/storytime-advantage.svg")}
        style={{ height: 300, scale: `${pop}` }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 170,
          color: MARK,
          fontSize: 56,
          fontWeight: 700,
          opacity: line,
          translate: `0px ${(1 - line) * 30}px`,
        }}
      >
        Reading Advantage · www.reading-advantage.com
      </div>
      <Sequence from={Math.round(JINGLE_AT * fps)} layout="none">
        <Audio src={staticFile("brand/jingle-reading-advantage.mp3")} />
      </Sequence>
    </AbsoluteFill>
  );
};
