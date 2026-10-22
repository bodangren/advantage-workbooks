import React from 'react';

/** A point in the 200 x 300 box of a figure. */
type P = [number, number];

/** The body of a placeholder figure: hands, feet, and the head offset (dx, dy, tilt in degrees). */
export type Pose = { lh: P; rh: P; lf: P; rf: P; head: [number, number, number]; squat?: number };

export const NEUTRAL: Pose = { lh: [56, 205], rh: [144, 205], lf: [84, 288], rf: [116, 288], head: [0, 0, 0] };
const pose = (p: Partial<Pose>): Pose => ({ ...NEUTRAL, ...p });

/** How a gesture moves: two key frames on the beat, one held key frame, or the compositor moves the body. */
export type Motion = 'moving' | 'hold' | 'whole';

/**
 * The 24 gestures of the Storytime list (forge-brief section 3) with the types of Storytime's inventory.
 * A "moving" gesture has key frames A and B; the others use A only.
 */
export const GESTURES: Record<string, { motion: Motion; a: Pose; b?: Pose }> = {
    clap: { motion: 'moving', a: pose({ lh: [34, 150], rh: [166, 150] }), b: pose({ lh: [93, 156], rh: [107, 156] }) },
    stamp: { motion: 'moving', a: pose({ rf: [122, 252] }), b: pose({ rf: [122, 290] }) },
    'point up': { motion: 'hold', a: pose({ rh: [146, 28] }) },
    'point to self': { motion: 'hold', a: pose({ rh: [104, 152] }) },
    wave: { motion: 'moving', a: pose({ rh: [150, 52] }), b: pose({ rh: [184, 72] }) },
    reach: { motion: 'hold', a: pose({ lh: [64, 132], rh: [136, 132] }) },
    hop: { motion: 'whole', a: pose({ lh: [46, 175], rh: [154, 175] }) },
    turn: { motion: 'whole', a: pose({ lh: [30, 160], rh: [170, 160] }) },
    sway: { motion: 'whole', a: pose({ lh: [28, 110], rh: [172, 110] }) },
    'hands on head': { motion: 'hold', a: pose({ lh: [76, 40], rh: [124, 40] }) },
    'stretch up': { motion: 'hold', a: pose({ lh: [66, 6], rh: [134, 6], head: [0, -6, 0] }) },
    crouch: { motion: 'hold', a: pose({ lh: [80, 232], rh: [120, 232], squat: 40 }) },
    nod: { motion: 'moving', a: pose({ head: [0, -4, 0] }), b: pose({ head: [0, 10, 0] }) },
    'shake head': { motion: 'moving', a: pose({ head: [-6, 0, -14] }), b: pose({ head: [6, 0, 14] }) },
    'count fingers': { motion: 'moving', a: pose({ lh: [82, 160], rh: [116, 146] }), b: pose({ lh: [82, 160], rh: [104, 162] }) },
    'point forward': { motion: 'hold', a: pose({ rh: [176, 132] }) },
    'hands out': { motion: 'hold', a: pose({ lh: [24, 168], rh: [176, 168] }) },
    'hug self': { motion: 'hold', a: pose({ lh: [126, 150], rh: [74, 150] }) },
    march: { motion: 'moving', a: pose({ lf: [84, 250], rh: [150, 180] }), b: pose({ rf: [116, 250], lh: [50, 180] }) },
    sleep: { motion: 'hold', a: pose({ lh: [140, 70], rh: [148, 92], head: [8, 4, 22] }) },
    eat: { motion: 'moving', a: pose({ rh: [110, 96] }), b: pose({ rh: [140, 170] }) },
    look: { motion: 'hold', a: pose({ rh: [112, 54] }) },
    listen: { motion: 'hold', a: pose({ rh: [146, 74], head: [-2, 0, -8] }) },
    bow: { motion: 'hold', a: pose({ rh: [104, 152], head: [0, 14, 0], squat: 10 }) },
};

/** The colors of a placeholder figure. */
export type Look = { shirt: string; legs: string; hair: string; skin: string; scale?: number; gray?: boolean; sprout?: boolean; bunches?: boolean };

const SKIN = '#E7B88F';
/** One flat look per cast name (placeholder only; Forge holds the real designs). */
export const LOOKS: Record<string, Look> = {
    Nan: { shirt: '#F28C28', legs: '#D83A3A', hair: '#1E1E1E', skin: SKIN, bunches: true },
    Pat: { shirt: '#4A90D9', legs: '#2F4A6D', hair: '#3B2A20', skin: SKIN },
    May: { shirt: '#E85D9A', legs: '#6D3B8C', hair: '#2A1B12', skin: SKIN, bunches: true },
    Sam: { shirt: '#3CB371', legs: '#355E3B', hair: '#4A3020', skin: SKIN },
    Mia: { shirt: '#9B59B6', legs: '#4B2C5E', hair: '#1E1E1E', skin: SKIN, bunches: true },
    Ben: { shirt: '#F2C230', legs: '#3E4C8A', hair: '#5A3A22', skin: SKIN },
    Lily: { shirt: '#FF7F7F', legs: '#8C3B3B', hair: '#3A2418', skin: SKIN, bunches: true },
    Tom: { shirt: '#2E86AB', legs: '#2B3A4A', hair: '#2A1B12', skin: SKIN, scale: 1.15 },
    Mom: { shirt: '#C0392B', legs: '#5D2A24', hair: '#2A1B12', skin: SKIN, scale: 1.35 },
    Dad: { shirt: '#34607F', legs: '#2C3E50', hair: '#1E1E1E', skin: SKIN, scale: 1.4 },
    Grandma: { shirt: '#8E44AD', legs: '#4B2C5E', hair: '#C9C9C9', skin: SKIN, scale: 1.3, gray: true },
    Grandpa: { shirt: '#7F8C8D', legs: '#3D4848', hair: '#D5D5D5', skin: SKIN, scale: 1.35, gray: true },
    'Teacher Kim': { shirt: '#16A085', legs: '#2C3E50', hair: '#1E1E1E', skin: SKIN, scale: 1.35 },
    Sprout: { shirt: '#6CBF4F', legs: '#3D7A2E', hair: '#3B2A20', skin: SKIN, sprout: true },
};

/** A cut-out arm or leg: a dark outline under the color, so an arm in front of the body shows. */
const limb = (from: P, to: P, color: string, width: number) => (
    <g>
        <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="#2B2B48" strokeWidth={width + 7} strokeLinecap="round" />
        <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={color} strokeWidth={width} strokeLinecap="round" />
    </g>
);

/**
 * A flat placeholder child or adult (paper cut-out style); the box is 240 x 340 (feet at the bottom). No letters inside.
 * @param props.look The colors.
 * @param props.pose The hands, feet, and head.
 * @param props.height The height in pixels.
 */
export const Figure: React.FC<{ look: Look; pose: Pose; height: number }> = ({ look, pose: p, height }) => {
    const sq = p.squat ?? 0;
    const [hx, hy, tilt] = p.head;
    const shoulderY = 128 + sq;
    const hipY = 206 + sq * 0.6;
    const out = '#2B2B48';
    return (
        <svg width={(height * 240) / 340} height={height} viewBox="-20 -30 240 340" style={{ overflow: 'visible' }}>
            {limb([86, hipY], p.lf, look.legs, 20)}
            {limb([114, hipY], p.rf, look.legs, 20)}
            <ellipse cx={p.lf[0]} cy={p.lf[1] + 4} rx={14} ry={8} fill={out} />
            <ellipse cx={p.rf[0]} cy={p.rf[1] + 4} rx={14} ry={8} fill={out} />
            <rect x={66} y={shoulderY - 12} width={68} height={hipY - shoulderY + 22} rx={26} fill={look.shirt} stroke={out} strokeWidth={4} />
            {limb([72, shoulderY], p.lh, look.shirt, 17)}
            {limb([128, shoulderY], p.rh, look.shirt, 17)}
            <circle cx={p.lh[0]} cy={p.lh[1]} r={10} fill={look.skin} stroke={out} strokeWidth={3} />
            <circle cx={p.rh[0]} cy={p.rh[1]} r={10} fill={look.skin} stroke={out} strokeWidth={3} />
            <g transform={`translate(${100 + hx} ${70 + hy + sq}) rotate(${tilt})`}>
                {look.bunches && <circle cx={-44} cy={-22} r={14} fill={look.hair} />}
                {look.bunches && <circle cx={44} cy={-22} r={14} fill={look.hair} />}
                <circle r={46} fill={look.skin} stroke={out} strokeWidth={4} />
                <path d="M -46 -6 A 46 46 0 0 1 46 -6 Q 20 -26 0 -18 Q -22 -28 -46 -6 Z" fill={look.hair} />
                <circle cx={-16} cy={6} r={6} fill={out} />
                <circle cx={16} cy={6} r={6} fill={out} />
                <path d="M -14 22 Q 0 34 14 22" stroke={out} strokeWidth={4} fill="none" strokeLinecap="round" />
                {look.sprout && <path d="M 0 -44 C -4 -60 -24 -70 -34 -62 C -26 -50 -10 -48 0 -44 Z M 0 -44 C 4 -62 24 -72 34 -64 C 26 -52 10 -48 0 -44 Z" fill="#59B442" stroke={out} strokeWidth={3} />}
            </g>
        </svg>
    );
};

/**
 * A flat placeholder of Pip the puppy (golden-brown, cream muzzle, red collar), in a 240 x 200 box.
 * @param props.height The height in pixels.
 */
export const Puppy: React.FC<{ height: number }> = ({ height }) => {
    const out = '#2B2B48';
    return (
        <svg width={(height * 240) / 200} height={height} viewBox="0 0 240 200">
            <path d="M 196 110 Q 232 80 222 54" stroke="#C98B3C" strokeWidth={16} fill="none" strokeLinecap="round" />
            <ellipse cx={140} cy={128} rx={66} ry={44} fill="#C98B3C" stroke={out} strokeWidth={4} />
            <ellipse cx={138} cy={142} rx={36} ry={24} fill="#F3E2C3" />
            <rect x={92} y={150} width={20} height={42} rx={9} fill="#C98B3C" stroke={out} strokeWidth={3} />
            <rect x={160} y={150} width={20} height={42} rx={9} fill="#C98B3C" stroke={out} strokeWidth={3} />
            <circle cx={78} cy={80} r={52} fill="#C98B3C" stroke={out} strokeWidth={4} />
            <ellipse cx={34} cy={84} rx={16} ry={34} fill="#8C5A22" stroke={out} strokeWidth={3} />
            <ellipse cx={122} cy={84} rx={16} ry={34} fill="#8C5A22" stroke={out} strokeWidth={3} />
            <ellipse cx={78} cy={104} rx={26} ry={20} fill="#F3E2C3" />
            <circle cx={78} cy={96} r={8} fill={out} />
            <circle cx={60} cy={72} r={7} fill={out} />
            <circle cx={96} cy={72} r={7} fill={out} />
            <rect x={70} y={44} width={16} height={22} rx={8} fill="#F3E2C3" />
            <path d="M 40 128 Q 78 146 116 128" stroke="#D83A3A" strokeWidth={10} fill="none" strokeLinecap="round" />
            <circle cx={78} cy={142} r={7} fill="#E8B830" stroke={out} strokeWidth={2} />
        </svg>
    );
};
