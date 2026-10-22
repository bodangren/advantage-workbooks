import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Figure, LOOKS, NEUTRAL, Puppy } from "./art/Figure";
import { GROUND } from "./art/Scene";
import type { Shot } from "./timeline";
import type { ForgeArt } from "./types";

const ENTER = 0.45;
/** The new actors start to slide in after the old ones have mostly left. */
const ENTER_DELAY = 0.15;
const EXIT = 0.3;
/** The seconds that the actors of a shot stay after its end to slide out. */
export const EXIT_SECONDS = EXIT;

const LEFT = 200;
const RIGHT = 1480;

/**
 * The actors of one shot on the ground line. Inside a Sequence that starts at the shot start: the actors slide
 * in from the right when `shot.enter`, and slide out to the left after the shot end when `shot.exit`.
 * @param props.shot The shot.
 * @param props.bpm The tempo of the song (the actors bob on the beat).
 * @param props.forge The Forge art: each actor is its front cut-out, at one scale, with the foot point on the ground.
 */
export const Actors: React.FC<{ shot: Shot; bpm: number; forge?: ForgeArt }> = ({
  shot,
  bpm,
  forge,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const length = shot.end - shot.start;
  const n = shot.actors.length;
  if (!n) return null;
  const kid = n <= 2 ? 520 : n <= 4 ? 470 : 400;
  const slideIn = shot.enter
    ? interpolate(t, [ENTER_DELAY, ENTER_DELAY + ENTER], [1500, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.back(1.1)),
      })
    : 0;
  const slideOut = shot.exit
    ? interpolate(t, [length, length + EXIT], [0, -1700], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.quad),
      })
    : 0;
  const beat = (t * bpm) / 60;
  return (
    <AbsoluteFill style={{ translate: `${slideIn + slideOut}px 0px` }}>
      {shot.actors.map((name, i) => {
        const x = LEFT + ((i + 0.5) * (RIGHT - LEFT)) / n;
        const bob = Math.abs(Math.sin(Math.PI * (beat + i * 0.25))) * 8;
        if (forge) {
          const s = forge.scale;
          return (
            <Img
              key={name}
              src={staticFile(forge.cast[name])}
              style={{
                position: "absolute",
                left: x - forge.foot.col * s,
                top: GROUND - forge.foot.row * s - bob,
                width: forge.canvas[0] * s,
                height: forge.canvas[1] * s,
              }}
            />
          );
        }
        const look = LOOKS[name];
        const h = name === "Pip" ? kid * 0.55 : kid * (look?.scale ?? 1);
        const w = name === "Pip" ? (h * 240) / 200 : (h * 240) / 340;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: x - w / 2,
              top: GROUND - h - bob,
            }}
          >
            {name === "Pip" ? (
              <Puppy height={h} />
            ) : (
              <Figure look={look ?? LOOKS.Pat} pose={NEUTRAL} height={h} />
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
