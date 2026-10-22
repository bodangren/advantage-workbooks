import React from 'react';
import { CalculateMetadataFunction, Composition, staticFile } from 'remotion';
import { Song, type SongProps } from './Song';
import type { Spec } from './types';

const FPS = 30;

/** Loads public/<week>/spec.json (written by scripts/prepare.mjs) and sets the length to the song audio. */
const calculateMetadata: CalculateMetadataFunction<SongProps> = async ({ props }) => {
    const spec: Spec = await (await fetch(staticFile(`${props.week}/spec.json`))).json();
    return { durationInFrames: Math.ceil(spec.duration * FPS), props: { ...props, spec } };
};

export const RemotionRoot: React.FC = () => (
    <Composition
        id="StorytimeSong"
        component={Song}
        durationInFrames={FPS * 75}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ week: 'l2/w01', spec: null } satisfies SongProps}
        calculateMetadata={calculateMetadata}
    />
);
