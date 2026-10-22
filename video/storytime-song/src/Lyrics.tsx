import { loadFont } from '@remotion/google-fonts/Andika';
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { INSET } from './GestureInset';
import { lyricAt } from './timeline';
import type { Spec } from './types';

/** Andika: a font for early readers (single-storey "a" and "g", the letter shapes that the children write). */
const { fontFamily } = loadFont('normal', { weights: ['700'], subsets: ['latin'] });

const SUNG = '#FFD23F';
const AHEAD = '#FFFFFF';
const OUTLINE = '#2B2B48';

/**
 * The line text at the bottom (English only), each word lit at its sung time. A repeat in parentheses shows
 * as its own singing, so the class reads the words that the singer sings now.
 * @param props.spec The line spec.
 */
export const Lyrics: React.FC<{ spec: Spec }> = ({ spec }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const t = frame / fps;
    const { line, segment } = lyricAt(spec, t);
    const words = spec.lines[line].segments[segment].words;
    const chars = words.reduce((n, w) => n + w.text.length + 1, 0);
    const size = chars > 34 ? 70 : 84;
    return (
        <div
            style={{
                position: 'absolute',
                left: 80,
                right: INSET.right + INSET.width + 40,
                bottom: INSET.bottom,
                minHeight: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '18px 36px',
                borderRadius: 40,
                background: 'rgba(43,43,72,0.55)',
            }}
        >
            <div style={{ fontFamily, fontWeight: 700, fontSize: size, lineHeight: 1.25, textAlign: 'center' }}>
                {words.map((w, k) => {
                    const lit = t >= w.start;
                    const now = lit && t < w.end;
                    return (
                        <span
                            key={k}
                            style={{
                                display: 'inline-block',
                                margin: '0 0.18em',
                                color: lit ? SUNG : AHEAD,
                                WebkitTextStroke: `10px ${OUTLINE}`,
                                paintOrder: 'stroke fill',
                                scale: now ? '1.12' : '1',
                                translate: now ? '0px -6px' : '0px 0px',
                            }}
                        >
                            {w.text}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
