import React from 'react';
import {
  AbsoluteFill,
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Sequence,
} from 'remotion';
import {TransitionSeries, linearTiming, springTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {flip} from '@remotion/transitions/flip';
import {clockWipe} from '@remotion/transitions/clock-wipe';
import {iris} from '@remotion/transitions/iris';
import {T} from '../theme';
import {Glass, Wordmark, useEnter} from '../components';

/* ═══════════════════════════════════════════════════════════════════
   EPISODE 05 — LUMEN · a 60-second montage of twelve generative studies
   Frame-based in Remotion. Clips are deterministic headless captures of
   the live Canvas-2D pieces, composited with Prompt Atelier branding,
   glass call-outs pulled from the case study, and layered transitions.
   ═══════════════════════════════════════════════════════════════════ */

const W = 1920;
const H = 1080;

// Lumen episode palette (prism)
const PRISM = ['#F4A259', '#E27BB1', '#8B7BFF', '#5AA9E6'];
const PRISM_GRAD = `linear-gradient(90deg, ${PRISM.join(', ')})`;
const LM_BG = '#0D0B12';

/* ─────────── shared: prism gradient text ─────────── */
const Prism: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({
  children,
  style,
}) => (
  <span
    style={{
      background: PRISM_GRAD,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      ...style,
    }}
  >
    {children}
  </span>
);

/* ─────────── a thin animated prism rule that draws itself in ─────────── */
const PrismRule: React.FC<{delay?: number; width?: number}> = ({delay = 0, width = 200}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        width: width * p,
        height: 3,
        borderRadius: 2,
        background: PRISM_GRAD,
        boxShadow: '0 0 18px rgba(226,123,177,0.5)',
      }}
    />
  );
};

/* ═══════════════ INTRO TITLE CARD ═══════════════ */
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const k = useEnter(6);
  const t1 = useEnter(14);
  const t2 = useEnter(24);
  const sf = useEnter(40);
  // slow prism aurora drift in the backdrop
  const drift = Math.sin(frame / 40) * 40;
  const exit = interpolate(frame, [120, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  return (
    <AbsoluteFill
      style={{
        background: LM_BG,
        opacity: 1 - exit,
      }}
    >
      {/* aurora blobs */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(48% 55% at ${60 + drift / 20}% 22%, rgba(139,123,255,0.28), transparent 60%),
            radial-gradient(45% 55% at 12% 88%, rgba(244,162,89,0.16), transparent 60%),
            radial-gradient(40% 50% at 88% 92%, rgba(90,169,230,0.14), transparent 60%)`,
          filter: 'blur(4px)',
          transform: `translateX(${drift}px)`,
        }}
      />
      <div style={{position: 'absolute', left: 130, top: 150, ...k}}>
        <Wordmark size={34} />
      </div>
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 130}}>
        <div style={{...k, marginBottom: 26}}>
          <div
            style={{
              fontFamily: T.sans,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
            }}
          >
            <Prism>Episode 05 · Creative Coding</Prism>
          </div>
        </div>
        <div
          style={{
            ...t1,
            fontFamily: T.serif,
            fontWeight: 400,
            fontSize: 168,
            lineHeight: 0.98,
            color: T.textCream,
            letterSpacing: '-0.01em',
          }}
        >
          <Prism style={{fontStyle: 'italic'}}>Lumen</Prism>
        </div>
        <div
          style={{
            ...t2,
            fontFamily: T.serif,
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 52,
            color: T.textCream,
            marginTop: 8,
            opacity: 0.92,
          }}
        >
          twelve studies in light, motion &amp; sound
        </div>
        <div style={{...sf, marginTop: 40, display: 'flex', alignItems: 'center', gap: 26}}>
          <PrismRule delay={44} width={120} />
          <div
            style={{
              fontFamily: T.sans,
              fontSize: 27,
              color: T.textFog,
              maxWidth: 720,
              lineHeight: 1.5,
            }}
          >
            Vanilla JavaScript. Raw Canvas 2D. No frameworks — built with Claude Code.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ═══════════════ PIECE CLIP ═══════════════ */
type Piece = {
  file: string;
  name: string;
  tech: string;
  line: string;
  index: number;
  accent: string;
};

const PieceClip: React.FC<{piece: Piece; dur: number}> = ({piece, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // gentle ken-burns life on the footage
  const scale = interpolate(frame, [0, dur], [1.06, 1.0], {extrapolateRight: 'clamp'});
  // callout entrance / exit
  const enter = useEnter(10);
  const exitAt = dur - 18;
  const exit = interpolate(frame, [exitAt, dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const calloutStyle: React.CSSProperties = {
    opacity: (enter.opacity as number) * (1 - exit),
    transform: `${enter.transform} translateY(${exit * 22}px)`,
    filter: enter.filter as string,
  };

  return (
    <AbsoluteFill style={{background: LM_BG}}>
      <AbsoluteFill style={{transform: `scale(${scale})`}}>
        <Video
          src={staticFile(`ep05/${piece.file}.mp4`)}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>

      {/* legibility scrims — vertical wash + local dark pools behind the text,
          so cream copy reads over light pieces (Weave) and dark ones alike */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(13,11,18,0.5) 0%, transparent 20%, transparent 52%, rgba(13,11,18,0.72) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(70% 60% at 0% 100%, rgba(13,11,18,0.78), transparent 62%),' +
            'radial-gradient(34% 40% at 100% 0%, rgba(13,11,18,0.6), transparent 60%)',
        }}
      />

      {/* index — top right */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          right: 96,
          textAlign: 'right',
          ...calloutStyle,
        }}
      >
        <div
          style={{
            fontFamily: T.serif,
            fontSize: 40,
            fontWeight: 400,
            color: T.textCream,
            lineHeight: 1,
          }}
        >
          <Prism>{String(piece.index).padStart(2, '0')}</Prism>
          <span style={{color: T.textFog, fontSize: 26}}> / 12</span>
        </div>
      </div>

      {/* watermark — top left */}
      <div style={{position: 'absolute', top: 74, left: 96, opacity: 0.72, ...calloutStyle}}>
        <Wordmark size={26} />
      </div>

      {/* the call-out — bottom left glass card */}
      <div style={{position: 'absolute', left: 96, bottom: 92, ...calloutStyle}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16}}>
          <PrismRule delay={12} width={64} />
          <div
            style={{
              fontFamily: T.sans,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            <Prism>{piece.tech}</Prism>
          </div>
        </div>
        <div
          style={{
            fontFamily: T.serif,
            fontWeight: 400,
            fontSize: 92,
            lineHeight: 1,
            color: T.textCream,
            textShadow: '0 6px 40px rgba(0,0,0,0.5)',
          }}
        >
          {piece.name}
        </div>
        <Glass
          style={{
            marginTop: 22,
            padding: '18px 30px',
            borderRadius: 16,
            maxWidth: 720,
            fontFamily: T.sans,
            fontSize: 27,
            fontWeight: 500,
            lineHeight: 1.45,
          }}
        >
          {piece.line}
        </Glass>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════ STAT INTERSTITIAL ═══════════════ */
const StatCard: React.FC<{stat: string; label: string; delay: number}> = ({stat, label, delay}) => {
  const enter = useEnter(delay);
  return (
    <div style={{textAlign: 'center', ...enter}}>
      <div style={{fontFamily: T.serif, fontWeight: 400, fontSize: 128, lineHeight: 1, color: T.textCream}}>
        <Prism>{stat}</Prism>
      </div>
      <div
        style={{
          fontFamily: T.sans,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: T.textFog,
          marginTop: 16,
        }}
      >
        {label}
      </div>
    </div>
  );
};

const Interstitial: React.FC = () => {
  const frame = useCurrentFrame();
  const k = useEnter(6);
  const drift = Math.sin(frame / 34) * 30;
  return (
    <AbsoluteFill style={{background: LM_BG, justifyContent: 'center', alignItems: 'center'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(45% 55% at ${50 + drift / 18}% 30%, rgba(226,123,177,0.18), transparent 60%),
            radial-gradient(45% 55% at 50% 100%, rgba(139,123,255,0.16), transparent 60%)`,
        }}
      />
      <div style={{...k, textAlign: 'center', marginBottom: 54}}>
        <div style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 300, fontSize: 66, color: T.textCream}}>
          No frameworks. <Prism style={{fontStyle: 'italic'}}>On purpose.</Prism>
        </div>
      </div>
      <div style={{display: 'flex', gap: 130, alignItems: 'flex-start'}}>
        <StatCard stat="12" label="Pieces, one toolkit" delay={16} />
        <StatCard stat="0" label="Frameworks or libraries" delay={26} />
        <StatCard stat="2D" label="Raw Canvas — even the 3D" delay={36} />
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════ OUTRO ═══════════════ */
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const w = useEnter(10);
  const tag = useEnter(28);
  const soc = useEnter(44);
  const drift = Math.sin(frame / 44) * 34;
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        background: `radial-gradient(55% 70% at 50% 8%, rgba(193,154,61,0.22), transparent 62%),
          radial-gradient(50% 60% at ${50 + drift / 12}% 100%, rgba(139,123,255,0.16), transparent 60%),
          linear-gradient(165deg, #17140F, #241D14)`,
      }}
    >
      <div style={{...w, textAlign: 'center'}}>
        <Wordmark size={110} />
      </div>
      <div style={{...tag, marginTop: 30, display: 'flex', alignItems: 'center', gap: 22}}>
        <PrismRule delay={30} width={90} />
        <div
          style={{
            fontFamily: T.sans,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: T.textFog,
          }}
        >
          Crafted with prompts, finished with taste
        </div>
        <PrismRule delay={30} width={90} />
      </div>
      <div
        style={{
          ...soc,
          marginTop: 46,
          fontFamily: T.sans,
          fontSize: 26,
          fontWeight: 600,
          color: T.goldBright,
          letterSpacing: '0.06em',
        }}
      >
        Case Study 05 · @thePromptAtelier
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════ THE PIECES ═══════════════ */
const PIECES: Piece[] = [
  {file: 'murmuration', name: 'Murmuration', tech: 'Flocking', index: 5, accent: PRISM[0],
    line: 'Hundreds of boids on a spatial hash — click to flip your pointer from predator to lure.'},
  {file: 'weave', name: 'Weave', tech: 'Noise Lattice', index: 11, accent: PRISM[1],
    line: 'A grid of strokes turned by simplex noise — and combable: the pointer parts it like fur.'},
  {file: 'meridian', name: 'Meridian', tech: 'Hand-rolled 3D', index: 8, accent: PRISM[2],
    line: 'A fibonacci sphere, projected by hand through rotation matrices. 3D as math, not a library.'},
  {file: 'halo', name: 'Halo', tech: 'Radial Symmetry', index: 9, accent: PRISM[1],
    line: 'A seeded mandala with a symmetry dial — 1.0 is a kaleidoscope, 0 lets every slice go feral.'},
  {file: 'bloom', name: 'Bloom', tech: 'Recursive Growth', index: 7, accent: PRISM[0],
    line: 'Click to plant; branches grow through noise and end in glowing blossoms — replayable from a seed.'},
  {file: 'tether', name: 'Tether', tech: 'Agent Constellation', index: 10, accent: PRISM[3],
    line: "Bouncing stars strung with proximity threads; your pointer's gravity gathers or scatters them."},
  {file: 'tessellate', name: 'Tessellate', tech: 'Seeded Geometry', index: 1, accent: PRISM[3],
    line: 'Curated palettes, simplex drift and glow lighting — the same seed always paints the same picture.'},
  {file: 'undertow', name: 'Undertow', tech: 'Flow Field', index: 6, accent: PRISM[2],
    line: 'Ink particles etching permanent trails — leave it running and a photograph slowly develops.'},
];

// segment durations (frames @30fps)
const D = {
  intro: 150,
  piece: 178,
  inter: 130,
  outro: 250,
};
const TR = 18; // transition overlap

// order: intro, 4 pieces, interstitial, 4 pieces, outro
const timing = linearTiming({durationInFrames: TR});
const springy = springTiming({config: {damping: 200}, durationInFrames: TR + 6});

export const Lumen: React.FC = () => {
  return (
    <AbsoluteFill style={{background: LM_BG}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={D.intro}>
          <Intro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={D.piece}>
          <PieceClip piece={PIECES[0]} dur={D.piece} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={wipe({direction: 'from-left'})} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={D.piece}>
          <PieceClip piece={PIECES[1]} dur={D.piece} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={clockWipe({width: W, height: H})} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={D.piece}>
          <PieceClip piece={PIECES[2]} dur={D.piece} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={D.piece}>
          <PieceClip piece={PIECES[3]} dur={D.piece} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={iris({width: W, height: H})} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={D.inter}>
          <Interstitial />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={flip()} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={D.piece}>
          <PieceClip piece={PIECES[4]} dur={D.piece} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={wipe({direction: 'from-bottom'})} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={D.piece}>
          <PieceClip piece={PIECES[5]} dur={D.piece} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({direction: 'from-left'})} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={D.piece}>
          <PieceClip piece={PIECES[6]} dur={D.piece} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={clockWipe({width: W, height: H})} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={D.piece}>
          <PieceClip piece={PIECES[7]} dur={D.piece} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={springy} />
        <TransitionSeries.Sequence durationInFrames={D.outro}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// 11 segments, 10 transitions.
// springy (TR+6) is used 4× (fade in, iris, flip, fade out); timing (TR) 6×.
export const LUMEN_TOTAL =
  D.intro + D.piece * 8 + D.inter + D.outro - ((TR + 6) * 4 + TR * 6); // = 1750 (58.3s @30)
