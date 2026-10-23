import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { PORTRAIT, SCENE } from "./layout";
import { END_SECONDS, START_SECONDS } from "./Screens";
import { Song, type SongProps } from "./Song";
import { SongPortrait } from "./SongPortrait";
import type { Spec } from "./types";

const FPS = 30;

/** Loads public/<week>/spec.json (written by scripts/prepare.mjs); the length is the start screen, the song audio, and the end screen. */
const calculateMetadata: CalculateMetadataFunction<SongProps> = async ({
  props,
}) => {
  const spec: Spec = await (
    await fetch(staticFile(`${props.week}/spec.json`))
  ).json();
  return {
    durationInFrames:
      Math.round(START_SECONDS * FPS) +
      Math.round(spec.duration * FPS) +
      Math.round(END_SECONDS * FPS),
    props: { ...props, spec },
  };
};

/** The classroom cut (landscape) and the phone cut for the QR page (portrait), from the same line spec. */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="StorytimeSong"
      component={Song}
      durationInFrames={FPS * 75}
      fps={FPS}
      width={SCENE.width}
      height={SCENE.height}
      defaultProps={{ week: "l2/w01", spec: null } satisfies SongProps}
      calculateMetadata={calculateMetadata}
    />
    <Composition
      id="StorytimeSongPortrait"
      component={SongPortrait}
      durationInFrames={FPS * 75}
      fps={FPS}
      width={PORTRAIT.width}
      height={PORTRAIT.height}
      defaultProps={{ week: "l2/w01", spec: null } satisfies SongProps}
      calculateMetadata={calculateMetadata}
    />
  </>
);
