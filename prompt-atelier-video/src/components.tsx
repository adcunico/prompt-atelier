import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {T} from './theme';
import {CUES} from './captions';

/* ─────────── Glass panel ─────────── */
export const Glass: React.FC<{
  tint?: 'dark' | 'light';
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({tint = 'dark', style, children}) => (
  <div
    style={{
      backdropFilter: `blur(${T.glassBlur}px) saturate(140%)`,
      WebkitBackdropFilter: `blur(${T.glassBlur}px) saturate(140%)`,
      background: tint === 'dark' ? T.glassDarkFill : T.glassLightFill,
      border: `1px solid ${tint === 'dark' ? T.glassDarkBorder : T.glassLightBorder}`,
      borderRadius: T.glassRadius,
      boxShadow: T.glassShadow,
      color: tint === 'dark' ? T.textCream : T.textInk,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ─────────── Entrance: fade + rise + blur-settle (420ms ease-out) ─────────── */
export const useEnter = (delayFrames = 0) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - delayFrames;
  const dur = Math.round(0.42 * fps);
  const p = interpolate(t, [0, dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * 16}px)`,
    filter: `blur(${(1 - p) * 6}px)`,
  } as React.CSSProperties;
};

/* ─────────── Gold-marked text: **word** → gold ─────────── */
export const GoldText: React.FC<{text: string; goldColor?: string}> = ({
  text,
  goldColor = T.goldBright,
}) => {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{color: goldColor}}>
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
};

/* ─────────── Kicker label ─────────── */
export const Kicker: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: T.sans,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '0.3em',
      textTransform: 'uppercase',
      color: T.goldBright,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ─────────── Stage title (top-left) ─────────── */
export const StageTitle: React.FC<{kicker: string; title: string; delay?: number}> = ({
  kicker,
  title,
  delay = 0,
}) => {
  const enter = useEnter(delay);
  const enterLate = useEnter(delay + 4);
  return (
    <div style={{position: 'absolute', left: 115, top: 92}}>
      <div style={{...enter}}>
        <Kicker>{kicker}</Kicker>
      </div>
      <div
        style={{
          ...enterLate,
          fontFamily: T.serif,
          fontWeight: 400,
          fontSize: 64,
          lineHeight: 1.12,
          color: T.textCream,
          marginTop: 14,
          maxWidth: 820,
        }}
      >
        <GoldText text={title} />
      </div>
    </div>
  );
};

/* ─────────── Step card ─────────── */
export const StepCard: React.FC<{
  num: string;
  title: string;
  body: string;
  tool: string;
  delay?: number;
  style?: React.CSSProperties;
}> = ({num, title, body, tool, delay = 0, style}) => {
  const enter = useEnter(delay);
  return (
    <Glass style={{padding: '44px 50px', maxWidth: 620, ...enter, ...style}}>
      <div
        style={{
          fontFamily: T.serif,
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 76,
          lineHeight: 1,
          color: T.goldBright,
        }}
      >
        {num}
      </div>
      <div style={{fontFamily: T.serif, fontWeight: 500, fontSize: 46, margin: '18px 0 10px'}}>
        {title}
      </div>
      <div style={{fontFamily: T.sans, fontSize: 25, opacity: 0.85, lineHeight: 1.5}}>{body}</div>
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: T.sans,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        <span
          style={{width: 11, height: 11, borderRadius: '50%', background: T.tealBright, display: 'inline-block'}}
        />
        {tool}
      </div>
    </Glass>
  );
};

/* ─────────── Tool chip ─────────── */
export const ToolChip: React.FC<{label: string; delay?: number}> = ({label, delay = 0}) => {
  const enter = useEnter(delay);
  return (
    <Glass
      style={{
        padding: '15px 32px',
        borderRadius: 999,
        fontFamily: T.sans,
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: '0.04em',
        display: 'inline-block',
        ...enter,
      }}
    >
      {label}
    </Glass>
  );
};

/* ─────────── Captions (global layer) ─────────── */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cue = CUES.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  const sinceStart = (t - cue.start) * 1000;
  const opacity = interpolate(sinceStart, [0, 220], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 62,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <Glass
        style={{
          padding: '18px 42px',
          borderRadius: 16,
          fontFamily: T.sans,
          fontSize: 34,
          fontWeight: 500,
          opacity,
          maxWidth: 1200,
          textAlign: 'center',
          textShadow: '0 1px 10px rgba(0,0,0,0.35)',
        }}
      >
        <GoldText text={cue.text} />
      </Glass>
    </div>
  );
};

/* ─────────── Wordmark ─────────── */
export const Wordmark: React.FC<{size?: number; style?: React.CSSProperties}> = ({
  size = 42,
  style,
}) => (
  <div style={{fontFamily: T.serif, fontWeight: 400, fontSize: size, color: T.textCream, ...style}}>
    Prompt{' '}
    <span style={{fontStyle: 'italic', color: T.goldBright}}>Atelier</span>
  </div>
);
