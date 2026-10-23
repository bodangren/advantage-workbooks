import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { GesturePanel } from "./GestureInset";
import { PORTRAIT_BOXES, PORTRAIT_SCENE_SCALE, SCENE } from "./layout";
import { Lyrics } from "./Lyrics";
import { END_SECONDS, EndScreen, START_SECONDS, StartScreen } from "./Screens";
import { SceneLayer, type SongProps } from "./Song";

/** The background of the portrait frame under the scene band (amber 100, beside the amber of the screens). */
const PAGE = "#FEF3C7";

/**
 * The phone cut of the song video (portrait, for the QR page): the same start screen, song, and end screen as
 * the classroom cut. From the top: the classroom scene with the actors at full width, the line text lit word by
 * word, and the large Sprout that does the gesture of the line.
 * @param props.spec The line spec (loaded by calculateMetadata from public/<week>/spec.json).
 */
export const SongPortrait: React.FC<SongProps> = ({ spec }) => {
  const { fps } = useVideoConfig();
  if (!spec) return null;
  const f = (s: number) => Math.round(s * fps);
  const songFrames = f(spec.duration);
  const band = PORTRAIT_BOXES.scene;
  return (
    <AbsoluteFill style={{ backgroundColor: PAGE }}>
      <Sequence durationInFrames={f(START_SECONDS)}>
        <StartScreen spec={spec} />
      </Sequence>
      <Sequence
        from={f(START_SECONDS) + songFrames}
        durationInFrames={f(END_SECONDS)}
      >
        <EndScreen />
      </Sequence>
      <Sequence from={f(START_SECONDS)} durationInFrames={songFrames}>
        <div
          style={{
            position: "absolute",
            left: band.left,
            top: band.top,
            width: SCENE.width,
            height: SCENE.height,
            scale: `${PORTRAIT_SCENE_SCALE}`,
            transformOrigin: "0 0",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
          }}
        >
          <SceneLayer spec={spec} portrait />
        </div>
        <Lyrics spec={spec} portrait />
        <GesturePanel spec={spec} />
        <Audio src={staticFile(spec.audio)} />
      </Sequence>
    </AbsoluteFill>
  );
};
