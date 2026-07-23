import React from 'react';
import {
  AbsoluteFill,
  Img,
  Video,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  random,
} from 'remotion';
import {loadFont as loadNotoSerifJP} from '@remotion/google-fonts/NotoSerifJP';
import {noise2D} from '@remotion/noise';
import {T} from '../theme';

const jp = loadNotoSerifJP('normal', {weights: ['700'], ignoreTooManyRequestsWarning: true});

export const RONIN_TOTAL = 240; // 8s @ 30fps
const PLATE_FRAMES = 180; // 6s of Seedance motion, then freeze-hold on the last frame
const W = 1920;
const H = 1080;

/* ─────────── atmospheric haze — drifting gold fog (SVG turbulence) ─────────── */
const Haze: React.FC = () => {
  const frame = useCurrentFrame();
  const driftX = Math.sin(frame * 0.012) * 60 - 200;
  const driftY = Math.cos(frame * 0.009) * 40;
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: 0.22, pointerEvents: 'none'}}>
      <svg width={W} height={H}>
        <defs>
          <filter id="ronin-fog" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.010" numOctaves={2} seed={7} result="n" />
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 0.76  0 0 0 0 0.60  0 0 0 0 0.24  0 0 0 0.9 0"
            />
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <rect x={driftX} y={driftY} width={W + 400} height={H + 200} filter="url(#ronin-fog)" />
      </svg>
    </AbsoluteFill>
  );
};

/* ─────────── drifting gold petals / dust — deterministic (noise) ─────────── */
const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const N = 26;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {new Array(N).fill(0).map((_, i) => {
        const sx = random(`px${i}`);
        const sy = random(`py${i}`);
        const size = 2 + random(`sz${i}`) * 5;
        const drift = noise2D(`nx${i}`, frame * 0.004, i * 0.7) * 70;
        const fall = frame * (0.18 + sx * 0.35);
        const x = sx * W + drift;
        const y = (sy * (H + 60) + fall) % (H + 60);
        const op = 0.18 + random(`o${i}`) * 0.45;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: T.goldBright,
              opacity: op,
              filter: 'blur(0.4px)',
              boxShadow: `0 0 6px ${T.gold}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ─────────── big faint 侍 (samurai) watermark behind the title ─────────── */
const KanjiMark: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [80, 140], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: '60%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${0.9 + p * 0.1})`,
          fontFamily: jp.fontFamily,
          fontWeight: 700,
          fontSize: 780,
          lineHeight: 1,
          color: T.gold,
          opacity: p * 0.1,
          textShadow: `0 0 80px rgba(193,154,61,0.4)`,
        }}
      >
        侍
      </div>
    </AbsoluteFill>
  );
};

/* ─────────── a red seal / hanko stamp that presses in ─────────── */
const Seal: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 9, stiffness: 200, mass: 0.7}});
  const size = 92;
  return (
    <div
      style={{
        position: 'absolute',
        left: '60.5%',
        top: '69%',
        width: size,
        height: size,
        borderRadius: 12,
        background: '#B23A2E',
        border: '3px solid #9A2E24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F6EFE2',
        fontFamily: jp.fontFamily,
        fontWeight: 700,
        fontSize: 46,
        boxShadow: '0 8px 26px rgba(120,30,20,0.45)',
        opacity: Math.min(1, s),
        transform: `scale(${0.4 + s * 0.6}) rotate(${(1 - s) * -12 - 4}deg)`,
      }}
    >
      侍
    </div>
  );
};

/* ─────────── per-letter animated wordmark ─────────── */
const AnimatedWord: React.FC<{text: string; delay: number; size: number}> = ({text, delay, size}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex'}}>
      {text.split('').map((ch, i) => {
        const s = spring({
          frame: frame - delay - i * 3,
          fps,
          config: {damping: 12, stiffness: 190, mass: 0.6},
        });
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontFamily: T.serif,
              fontWeight: 600,
              fontSize: size,
              lineHeight: 1.02,
              letterSpacing: '0.01em',
              color: T.goldBright,
              opacity: Math.min(1, s),
              transform: `translateY(${(1 - s) * 46}px) scale(${0.55 + s * 0.45}) rotate(${(1 - s) * -7}deg)`,
              transformOrigin: '50% 100%',
              textShadow: '0 6px 34px rgba(193,154,61,0.35)',
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

const Title: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div
      style={{
        position: 'absolute',
        left: '52%',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AnimatedWord text="PROMPT" delay={150} size={150} />
      <AnimatedWord text="ATELIER" delay={168} size={150} />
    </div>
  </AbsoluteFill>
);

/* ═══════════════════════════ MAIN ═══════════════════════════ */
export const Ronin: React.FC = () => {
  const frame = useCurrentFrame();

  // Camera: slow zoom-in + slide left while the title animates in.
  const cam = interpolate(frame, [120, 235], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const scale = 1 + cam * 0.12;
  const tx = cam * -64;

  return (
    <AbsoluteFill style={{backgroundColor: T.ink, overflow: 'hidden'}}>
      {/* plate + freeze-hold, under one camera transform */}
      <AbsoluteFill style={{transform: `scale(${scale}) translateX(${tx}px)`, transformOrigin: '46% 48%'}}>
        <Img
          src={staticFile('ronin/ronin-last.jpg')}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
        <Sequence durationInFrames={PLATE_FRAMES}>
          <Video
            src={staticFile('ronin/ronin-plate.mp4')}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </Sequence>
      </AbsoluteFill>

      {/* atmosphere */}
      <Haze />
      <Particles />

      {/* readability veil on the right where the title sits */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(90% 80% at 72% 50%, rgba(12,9,5,0.42) 0%, transparent 62%)',
          pointerEvents: 'none',
        }}
      />

      {/* type stack */}
      <KanjiMark />
      <Title />
      <Seal delay={206} />
    </AbsoluteFill>
  );
};
