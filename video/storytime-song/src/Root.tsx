import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { END_SECONDS, START_SECONDS } from "./Screens";
import { Song, type SongProps } from "./Song";
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

export const RemotionRoot: React.FC = () => (
  <Composition
    id="StorytimeSong"
    component={Song}
    durationInFrames={FPS * 75}
    fps={FPS}
    width={1920}
    height={1080}
    defaultProps={{ week: "l2/w01", spec: null } satisfies SongProps}
    calculateMetadata={calculateMetadata}
  />
);
