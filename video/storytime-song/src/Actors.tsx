import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ActorBox } from "./actorBoxes";
import { Figure, LOOKS, NEUTRAL, Puppy } from "./art/Figure";
import type { ForgeArt } from "./types";

const EXIT = 0.3;
/** The seconds that the actors of a shot stay after its end to slide out. */
export const EXIT_SECONDS = EXIT;

/**
 * A flat placeholder shape of an animal or a prop (no letters, not for release). It fills the box chosen by
 * actorBoxes, so the drawn box and the tested box are the same rectangle.
 * @param props.kind The placeholder label from the package prompt.
 * @param props.width The width of the shape in scene pixels.
 * @param props.height The height of the shape in scene pixels.
 */
const Placeholder: React.FC<{ kind: string; width: number; height: number }> = ({
  kind,
  width,
  height,
}) => {
  const hue = [...kind].reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  return (
    <svg width={width} height={height} viewBox="0 0 90 100" preserveAspectRatio="none">
      <rect
        x={5}
        y={15}
        width={80}
        height={80}
        rx={24}
        fill={`hsl(${hue} 60% 72%)`}
        stroke="#2B2B48"
        strokeWidth={5}
      />
      <circle cx={45} cy={47} r={13} fill="#FFFBEF" stroke="#2B2B48" strokeWidth={4} />
    </svg>
  );
};

/**
 * The actors of one shot, drawn at the boxes computed by actorBoxes. The boxes are frame pixels of the cut; in the
 * portrait cut the scene is scaled, so boxScale converts them back to scene pixels before drawing.
 * @param props.boxes The drawn boxes, one per actor of the line.
 * @param props.bpm The tempo: the whole row bobs on the beat.
 * @param props.forge The Forge art: a cut-out actor uses its manifest front.
 * @param props.boxScale The frame pixels per scene pixel (1 in classroom, the portrait scene scale in phone).
 */
export const Actors: React.FC<{
  boxes: ActorBox[];
  bpm: number;
  forge?: ForgeArt;
  boxScale?: number;
}> = ({ boxes, bpm, forge, boxScale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = (frame / fps / 60) * bpm;
  const bob = Math.abs(Math.sin(Math.PI * beat)) * 8;
  if (!boxes.length) return null;
  return (
    <AbsoluteFill style={{ translate: `0px ${-bob}px` }}>
      {boxes.map(({ name, kind, box }) => {
        const left = box.left / boxScale;
        const top = box.top / boxScale;
        const width = box.width / boxScale;
        const height = box.height / boxScale;
        if (kind === "cutout" && forge && name in forge.cast) {
          return (
            <Img
              key={name}
              src={staticFile(forge.cast[name])}
              style={{ position: "absolute", left, top, width, height }}
            />
          );
        }
        if (kind === "figure") {
          const look = LOOKS[name];
          return (
            <div key={name} style={{ position: "absolute", left, top, width, height }}>
              {name === "Pip" ? (
                <Puppy height={height} />
              ) : (
                <Figure look={look ?? LOOKS.Pat} pose={NEUTRAL} height={height} />
              )}
            </div>
          );
        }
        return (
          <div key={name} style={{ position: "absolute", left, top, width, height }}>
            <Placeholder kind={name} width={width} height={height} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
