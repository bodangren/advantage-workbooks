import { Audio, Video } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Actors, EXIT_SECONDS } from "./Actors";
import { SceneBackground } from "./art/Scene";
import { GestureInset } from "./GestureInset";
import { ACTOR_SPAN, SCENE } from "./layout";
import { Lyrics } from "./Lyrics";
import { END_SECONDS, EndScreen, START_SECONDS, StartScreen } from "./Screens";
import { sceneRuns, shots } from "./timeline";
import type { Spec } from "./types";

export type SongProps = { week: string; spec: Spec | null };

/**
 * The song video of one Storytime week: a silent start screen, then the scene, the actors of each line picture,
 * the gesture inset, the line text lit word by word, and the song audio, then the end screen.
 * @param props.spec The line spec (loaded by calculateMetadata from public/<week>/spec.json).
 */
export const Song: React.FC<SongProps> = ({ spec }) => {
  const { fps } = useVideoConfig();
  if (!spec) return null;
  const f = (s: number) => Math.round(s * fps);
  const songFrames = f(spec.duration);
  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <Sequence durationInFrames={f(START_SECONDS)}>
        <StartScreen spec={spec} />
      </Sequence>
      <Sequence
        from={f(START_SECONDS) + songFrames}
        durationInFrames={f(END_SECONDS)}
      >
        <EndScreen />
      </Sequence>
      {/* The song: all package times are song-relative, so the song layers start after the start screen. */}
      <Sequence from={f(START_SECONDS)} durationInFrames={songFrames}>
        <SceneLayer spec={spec} />
        <Lyrics spec={spec} />
        <GestureInset spec={spec} />
        <Audio src={staticFile(spec.audio)} />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * The scene layer of the song in the 1920 x 1080 scene frame: the Forge scene video when the week has one (S27
 * option C), else the scene and the actors of each shot. Inside the Sequence of the song.
 * @param props.spec The line spec.
 * @param props.portrait True for the phone cut (only the actor row of the cut-out scene moves).
 */
export const SceneLayer: React.FC<{ spec: Spec; portrait?: boolean }> = ({
  spec,
  portrait = false,
}) =>
  spec.sceneVideo ? (
    <Video
      src={staticFile(spec.sceneVideo)}
      muted
      style={{ width: SCENE.width, height: SCENE.height }}
    />
  ) : (
    <SceneShots spec={spec} portrait={portrait} />
  );

/**
 * The scene of each run of lines and the actors of each shot, in the 1920 x 1080 scene frame. Inside the Sequence
 * of the song (the times are song-relative).
 * @param props.spec The line spec.
 * @param props.portrait True for the phone cut: the actor row is centred on the rug.
 */
export const SceneShots: React.FC<{ spec: Spec; portrait?: boolean }> = ({
  spec,
  portrait = false,
}) => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const list = shots(spec);
  return (
    <>
      {sceneRuns(list).map((run) => (
        <Sequence
          key={`scene-${run.start}`}
          from={f(run.start)}
          durationInFrames={Math.max(1, f(run.end) - f(run.start))}
          layout="none"
        >
          <SceneBackground
            scene={run.scene}
            render={spec.forge?.scenes[run.scene]}
          />
        </Sequence>
      ))}
      {list.map((shot) => (
        <Sequence
          key={`shot-${shot.start}`}
          from={f(shot.start)}
          durationInFrames={Math.max(
            1,
            f(shot.end) - f(shot.start) + (shot.exit ? f(EXIT_SECONDS) : 0),
          )}
        >
          <Actors
            shot={shot}
            bpm={spec.bpm}
            forge={spec.forge}
            span={portrait ? ACTOR_SPAN.portrait : ACTOR_SPAN.landscape}
          />
        </Sequence>
      ))}
    </>
  );
};
