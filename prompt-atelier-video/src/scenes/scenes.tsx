import React from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';
import {T} from '../theme';
import {Glass, GoldText, Kicker, StageTitle, StepCard, ToolChip, Wordmark, useEnter} from '../components';

/* ═══════ Scene 1 — "The Prompt" ═══════
   A prompt types itself → gold Enter pulse → the brand "generates" as the
   output (wordmark + title). Sofia springs in via SofiaLayer (~f295).
   On "let me break it down" (~f415) the four step cards fan out. */

const PROMPT_TEXT =
  'create a video channel hosted by an AI — script, voice, face… everything generated';

const TYPE_START = 28;
const TYPE_END = 195;
const PULSE_AT = 205;
const BOX_EXIT = 238;
const OUTPUT_AT = 268;
const DECK_AT = 420;

const PromptBox: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = Math.max(
    0,
    Math.floor(
      interpolate(frame, [TYPE_START, TYPE_END], [0, PROMPT_TEXT.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    )
  );
  const cursorOn = Math.floor(frame / 13) % 2 === 0;
  const enter = useEnter(8);
  // gold pulse on "Enter"
  const pulse = interpolate(frame, [PULSE_AT, PULSE_AT + 10, PULSE_AT + 26], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // exit: fade + rise + blur
  const exit = interpolate(frame, [BOX_EXIT, BOX_EXIT + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 260,
        top: 380,
        width: 1400,
        opacity: (1 - exit) * (enter.opacity as number),
        transform: `translateY(${-30 * exit}px)`,
        filter: `blur(${8 * exit}px)`,
      }}
    >
      <Glass
        style={{
          padding: '40px 48px',
          borderRadius: 26,
          border: `1px solid rgba(${pulse > 0 ? '220,188,105' : '255,255,255'},${
            0.26 + pulse * 0.5
          })`,
          boxShadow: `${T.glassShadow}${pulse > 0 ? `, 0 0 ${60 * pulse}px rgba(193,154,61,${0.35 * pulse})` : ''}`,
        }}
      >
        <div
          style={{
            fontFamily: T.sans,
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: T.textFog,
            marginBottom: 18,
          }}
        >
          Prompt
        </div>
        <div
          style={{
            fontFamily: 'ui-monospace, Consolas, monospace',
            fontSize: 33,
            lineHeight: 1.5,
            color: T.textCream,
            minHeight: 100,
          }}
        >
          {PROMPT_TEXT.slice(0, chars)}
          <span
            style={{
              display: 'inline-block',
              width: 16,
              height: 38,
              marginLeft: 4,
              verticalAlign: 'middle',
              background: T.goldBright,
              opacity: cursorOn ? 1 : 0,
            }}
          />
        </div>
      </Glass>
    </div>
  );
};

const MiniCard: React.FC<{label: string; index: number}> = ({label, index}) => {
  const enter = useEnter(DECK_AT + index * 9);
  return (
    <Glass
      style={{
        padding: '22px 30px',
        fontFamily: T.serif,
        fontWeight: 500,
        fontSize: 26,
        transform: `${(enter.transform as string) ?? ''} rotate(${(index - 1.5) * 2.4}deg)`,
        opacity: enter.opacity,
        filter: enter.filter,
      }}
    >
      <span style={{color: T.goldBright, fontStyle: 'italic', marginRight: 10}}>
        {label.slice(0, 2)}
      </span>
      {label.slice(4)}
    </Glass>
  );
};

const MiniDeck: React.FC = () => {
  const cards = ['01 · The Image', '02 · The Voice', '03 · The Animation', '04 · The Assembly'];
  return (
    <div
      style={{
        position: 'absolute',
        left: 115,
        top: 760,
        display: 'flex',
        gap: 26,
        alignItems: 'flex-end',
      }}
    >
      {cards.map((c, i) => (
        <MiniCard key={c} label={c} index={i} />
      ))}
    </div>
  );
};

export const SceneIntro: React.FC = () => {
  const enterWm = useEnter(OUTPUT_AT);
  const enterTitle = useEnter(OUTPUT_AT + 10);
  return (
    <AbsoluteFill>
      <PromptBox />
      <div style={{position: 'absolute', left: 115, top: 84, ...enterWm}}>
        <Wordmark size={46} />
      </div>
      <div style={{position: 'absolute', left: 115, top: 300, maxWidth: 1050, ...enterTitle}}>
        <Kicker>Episode 01</Kicker>
        <div
          style={{
            fontFamily: T.serif,
            fontWeight: 400,
            fontSize: 92,
            lineHeight: 1.1,
            color: T.textCream,
            marginTop: 20,
          }}
        >
          This video was made entirely with{' '}
          <span style={{fontStyle: 'italic', color: T.goldBright}}>free AI</span>
        </div>
      </div>
      <MiniDeck />
    </AbsoluteFill>
  );
};

/* ═══════ Scene 2 — Step 01 · The Image ═══════ */
export const SceneImage: React.FC = () => {
  const enterPortrait = useEnter(14);
  return (
    <AbsoluteFill>
      <StageTitle kicker="Step 01 — The Image" title="One prompt, **one person**" />
      <StepCard
        num="01"
        title="The Avatar"
        body="A single text prompt describing hair, glasses, wardrobe — generated in seconds."
        tool="Image Model · Free"
        delay={8}
        style={{position: 'absolute', left: 115, top: 330, maxWidth: 560}}
      />
      <div
        style={{
          position: 'absolute',
          left: 780,
          top: 330,
          width: 420,
          height: 420,
          borderRadius: 36,
          overflow: 'hidden',
          border: '1.5px solid rgba(255,255,255,0.4)',
          boxShadow: T.glassShadow,
          ...enterPortrait,
        }}
      >
        <Img
          src={staticFile('sofia_frame.jpg')}
          style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 12%'}}
        />
      </div>
      <Glass
        style={{
          position: 'absolute',
          left: 780,
          top: 775,
          maxWidth: 430,
          padding: '16px 24px',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 17,
          lineHeight: 1.5,
          color: T.textFog,
          ...useEnter(24),
        }}
      >
        “3D animated portrait… Brazilian woman, gold-rimmed glasses, black turtleneck,
        soft cinematic lighting…”
      </Glass>
    </AbsoluteFill>
  );
};

/* ═══════ Scene 3 — Step 02 · The Voice ═══════ */
const Waveform: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = 42;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 9, height: 130}}>
      {Array.from({length: bars}).map((_, i) => {
        const wob =
          Math.sin(i * 0.9 + frame / 5) * 0.35 + Math.sin(i * 2.3 + frame / 9) * 0.25 + 0.55;
        const h = 18 + Math.abs(wob) * 100;
        const golden = i % 7 === 3;
        return (
          <div
            key={i}
            style={{
              width: 10,
              height: h,
              borderRadius: 6,
              background: golden ? T.goldBright : 'rgba(246,240,228,0.55)',
            }}
          />
        );
      })}
    </div>
  );
};

export const SceneVoice: React.FC = () => (
  <AbsoluteFill>
    <StageTitle kicker="Step 02 — The Voice" title="Turn any script into **speech**" />
    <StepCard
      num="02"
      title="The Voice"
      body="Paste the script, pick a voice, download the MP3. Any voice, any language."
      tool="ElevenLabs · Free tier"
      delay={8}
      style={{position: 'absolute', left: 115, top: 330, maxWidth: 560}}
    />
    <Glass
      style={{
        position: 'absolute',
        left: 780,
        top: 380,
        padding: '46px 52px',
        ...{},
      }}
    >
      <Waveform />
      <div
        style={{
          marginTop: 26,
          fontFamily: T.serif,
          fontStyle: 'italic',
          fontSize: 27,
          color: T.textFog,
          maxWidth: 440,
          lineHeight: 1.45,
        }}
      >
        “Hi! My name is Sofia — welcome to my channel…”
      </div>
    </Glass>
    <div style={{position: 'absolute', left: 780, top: 800, display: 'flex', gap: 16}}>
      <ToolChip label="Claude Code" delay={20} />
      <ToolChip label="ElevenLabs" delay={26} />
    </div>
  </AbsoluteFill>
);

/* ═══════ Scene 4 — Step 03 · The Animation ═══════ */
export const SceneAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const enterA = useEnter(14);
  const enterB = useEnter(26);
  const arrow = useEnter(20);
  // subtle "alive" pulse on the after-frame
  const pulse = 1 + Math.sin(frame / 10) * 0.006;
  return (
    <AbsoluteFill>
      <StageTitle kicker="Step 03 — The Animation" title="A photo learns to **talk**" />
      <StepCard
        num="03"
        title="SadTalker"
        body="Open-source lip-sync: one photo + one voiceover, rendered on a free cloud GPU."
        tool="SadTalker · Google Colab"
        delay={8}
        style={{position: 'absolute', left: 115, top: 330, maxWidth: 560}}
      />
      {/* before / after */}
      <div style={{position: 'absolute', left: 790, top: 360, display: 'flex', alignItems: 'center', gap: 34}}>
        <div style={{textAlign: 'center', ...enterA}}>
          <div
            style={{
              width: 300,
              height: 300,
              borderRadius: 28,
              overflow: 'hidden',
              border: '1.5px solid rgba(255,255,255,0.35)',
              filter: 'grayscale(55%)',
            }}
          >
            <Img
              src={staticFile('sofia_frame.jpg')}
              style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 12%'}}
            />
          </div>
          <div style={{fontFamily: T.sans, fontSize: 18, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.textFog, marginTop: 16}}>
            Still photo
          </div>
        </div>
        <div style={{fontFamily: T.serif, fontSize: 54, color: T.goldBright, ...arrow}}>→</div>
        <div style={{textAlign: 'center', ...enterB}}>
          <div
            style={{
              width: 300,
              height: 300,
              borderRadius: 28,
              overflow: 'hidden',
              border: `1.5px solid rgba(220,188,105,0.65)`,
              transform: `scale(${pulse})`,
            }}
          >
            <Img
              src={staticFile('sofia_frame.jpg')}
              style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 12%'}}
            />
          </div>
          <div style={{fontFamily: T.sans, fontSize: 18, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.goldBright, marginTop: 16}}>
            Talking video
          </div>
        </div>
      </div>
      <Glass
        style={{
          position: 'absolute',
          left: 790,
          top: 790,
          padding: '15px 26px',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 18,
          color: T.tealBright,
          ...useEnter(34),
        }}
      >
        python inference.py --source_image avatar.png --driven_audio voice.mp3
      </Glass>
    </AbsoluteFill>
  );
};

/* ═══════ Scene 5 — Step 04 · The Assembly ═══════ */
const Node: React.FC<{label: string; delay: number; gold?: boolean}> = ({label, delay, gold}) => {
  const enter = useEnter(delay);
  return (
    <Glass
      style={{
        padding: '26px 40px',
        fontFamily: T.serif,
        fontWeight: 500,
        fontSize: 32,
        color: gold ? T.goldBright : T.textCream,
        border: gold ? '1px solid rgba(220,188,105,0.5)' : undefined,
        ...enter,
      }}
    >
      {label}
    </Glass>
  );
};

export const SceneAssembly: React.FC = () => {
  const line = useEnter(30);
  return (
    <AbsoluteFill>
      <StageTitle kicker="Step 04 — The Assembly" title="**Claude Code** puts it all together" />
      <div
        style={{
          position: 'absolute',
          left: 115,
          top: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
        }}
      >
        <Node label="The Image" delay={6} />
        <Node label="The Voice" delay={14} />
        <Node label="The Animation" delay={22} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 560,
          top: 555,
          width: 220,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${T.gold})`,
          ...line,
        }}
      />
      <div style={{position: 'absolute', left: 810, top: 500}}>
        <Node label="This Video" delay={34} gold />
      </div>
    </AbsoluteFill>
  );
};

/* ═══════ Scene 6 — End Card ═══════ */
export const SceneEnd: React.FC = () => {
  const enterWm = useEnter(6);
  const enterSub = useEnter(16);
  const enterBtn = useEnter(26);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{textAlign: 'center', marginRight: 320}}>
        <div style={enterWm}>
          <Wordmark size={88} />
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: T.sans,
            fontSize: 22,
            letterSpacing: '0.18em',
            color: T.textFog,
            ...enterSub,
          }}
        >
          NEW VIDEOS EVERY WEEK · FULL GUIDE IN THE DESCRIPTION
        </div>
        <div
          style={{
            marginTop: 44,
            display: 'inline-block',
            padding: '20px 58px',
            borderRadius: 999,
            background: `linear-gradient(145deg, ${T.gold}, ${T.goldDeep})`,
            color: '#fff',
            fontFamily: T.sans,
            fontWeight: 600,
            fontSize: 27,
            letterSpacing: '0.04em',
            boxShadow: '0 14px 40px rgba(193,154,61,0.35)',
            ...enterBtn,
          }}
        >
          Subscribe
        </div>
      </div>
    </AbsoluteFill>
  );
};
