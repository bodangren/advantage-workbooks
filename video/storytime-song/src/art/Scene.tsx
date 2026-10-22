import React from "react";
import { AbsoluteFill } from "remotion";

/** The ground line of the actors (their feet), in the 1920 x 1080 frame. */
export const GROUND = 800;

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      {children}
    </svg>
  </AbsoluteFill>
);

const Cloud: React.FC<{ x: number; y: number; s?: number }> = ({
  x,
  y,
  s = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#FFFFFF">
    <ellipse cx={0} cy={0} rx={90} ry={44} />
    <ellipse cx={70} cy={-20} rx={70} ry={50} />
    <ellipse cx={140} cy={4} rx={80} ry={40} />
  </g>
);

const Window: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={300}
      height={220}
      rx={14}
      fill="#BFE6FF"
      stroke="#8C6A4F"
      strokeWidth={12}
    />
    <line
      x1={x + 150}
      y1={y}
      x2={x + 150}
      y2={y + 220}
      stroke="#8C6A4F"
      strokeWidth={10}
    />
    <line
      x1={x}
      y1={y + 110}
      x2={x + 300}
      y2={y + 110}
      stroke="#8C6A4F"
      strokeWidth={10}
    />
  </g>
);

/**
 * A flat placeholder background for a scene id (not for release; Forge delivers one render per scene).
 * @param props.scene The scene id from the line spec.
 */
export const SceneBackground: React.FC<{ scene: string }> = ({ scene }) => {
  switch (scene) {
    case "sky":
      return (
        <Svg>
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7CC8F2" />
              <stop offset="1" stopColor="#D8F0FF" />
            </linearGradient>
          </defs>
          <rect width={1920} height={1080} fill="url(#sky)" />
          <Cloud x={220} y={220} />
          <Cloud x={1300} y={160} s={1.2} />
          <Cloud x={820} y={420} s={0.8} />
          <rect y={930} width={1920} height={150} fill="#8FD07A" />
        </Svg>
      );
    case "park":
    case "meadow":
      return (
        <Svg>
          <rect width={1920} height={1080} fill="#C9ECFF" />
          <Cloud x={260} y={150} s={0.9} />
          <Cloud x={1380} y={120} />
          <rect
            y={560}
            width={1920}
            height={520}
            fill={scene === "park" ? "#8FD07A" : "#A6DB82"}
          />
          <rect x={1500} y={330} width={44} height={250} fill="#8B5A2B" />
          <circle cx={1522} cy={300} r={130} fill="#5DB35A" />
          {scene === "meadow" ? (
            <g>
              <ellipse cx={420} cy={700} rx={260} ry={60} fill="#7CC6E8" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect
                  key={i}
                  x={980 + i * 90}
                  y={500}
                  width={16}
                  height={90}
                  fill="#C99A63"
                />
              ))}
              <rect x={970} y={520} width={480} height={14} fill="#C99A63" />
              <rect x={970} y={556} width={480} height={14} fill="#C99A63" />
            </g>
          ) : (
            <ellipse cx={400} cy={690} rx={240} ry={56} fill="#7CC6E8" />
          )}
        </Svg>
      );
    case "living-room":
      return (
        <Svg>
          <rect width={1920} height={1080} fill="#FDE9D9" />
          <rect y={640} width={1920} height={440} fill="#D9A97A" />
          <Window x={1460} y={170} />
          <rect
            x={160}
            y={470}
            width={560}
            height={200}
            rx={40}
            fill="#5FAE6E"
          />
          <rect
            x={130}
            y={430}
            width={80}
            height={240}
            rx={30}
            fill="#4E9A5D"
          />
          <rect
            x={670}
            y={430}
            width={80}
            height={240}
            rx={30}
            fill="#4E9A5D"
          />
          <ellipse cx={1000} cy={860} rx={420} ry={70} fill="#B5774D" />
        </Svg>
      );
    case "playroom":
      return (
        <Svg>
          <rect width={1920} height={1080} fill="#E6F2FF" />
          <rect y={640} width={1920} height={440} fill="#DDB27F" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <line
              key={i}
              x1={0}
              y1={680 + i * 55}
              x2={1920}
              y2={680 + i * 55}
              stroke="#C99B66"
              strokeWidth={4}
            />
          ))}
          <Window x={180} y={160} />
          <rect
            x={1460}
            y={500}
            width={300}
            height={190}
            rx={16}
            fill="#C0392B"
            stroke="#7A2318"
            strokeWidth={8}
          />
          <rect
            x={1440}
            y={480}
            width={340}
            height={44}
            rx={12}
            fill="#E74C3C"
            stroke="#7A2318"
            strokeWidth={8}
          />
        </Svg>
      );
    case "classroom":
    default:
      return (
        <Svg>
          <rect width={1920} height={1080} fill="#FFF4D6" />
          <rect y={640} width={1920} height={440} fill="#E8C39E" />
          <Window x={160} y={150} />
          <rect
            x={1180}
            y={150}
            width={560}
            height={300}
            rx={18}
            fill="#4F8A6B"
            stroke="#8C6A4F"
            strokeWidth={14}
          />
          <ellipse cx={860} cy={790} rx={700} ry={110} fill="#F28B82" />
          <ellipse
            cx={860}
            cy={790}
            rx={600}
            ry={86}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={8}
            strokeDasharray="30 22"
          />
        </Svg>
      );
  }
};
