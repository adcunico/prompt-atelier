import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';
import {T, stageBackground} from '../theme';
import {Glass, GoldText, Kicker, Wordmark, useEnter} from '../components';
import {CUES02} from './captions02';

export const FPS = 30;
export const PART_A_END = 109 * FPS; // 3270 — VO "Enjoy!" ends
export const EPISODE_FRAMES = Math.ceil(126.5 * FPS); // 3795
export const PART_C_START = PART_A_END + EPISODE_FRAMES; // 7065
export const TOTAL_FRAMES = PART_C_START + Math.ceil(15.5 * FPS); // 7530

/* ───────── captions (same glass style as ep01) ───────── */
const Captions02: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cue = CUES02.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  const opacity = interpolate((t - cue.start) * 1000, [0, 220], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', bottom: 56, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <Glass
        style={{
          padding: '17px 40px',
          borderRadius: 16,
          fontFamily: T.sans,
          fontSize: 32,
          fontWeight: 500,
          opacity,
          maxWidth: 1360,
          textAlign: 'center',
          textShadow: '0 1px 10px rgba(0,0,0,0.35)',
        }}
      >
        <GoldText text={cue.text} />
      </Glass>
    </div>
  );
};

/* ───────── step header (top-left) ───────── */
const StepHeader: React.FC<{kicker: string; title: string}> = ({kicker, title}) => {
  const enter = useEnter(2);
  const enterLate = useEnter(8);
  return (
    <div style={{position: 'absolute', left: 100, top: 72}}>
      <div style={enter}>
        <Kicker>{kicker}</Kicker>
      </div>
      <div
        style={{
          ...enterLate,
          fontFamily: T.serif,
          fontWeight: 400,
          fontSize: 56,
          color: T.textCream,
          marginTop: 10,
        }}
      >
        <GoldText text={title} />
      </div>
    </div>
  );
};

/* ───────── UI screenshot as a floating, tilted screen ─────────
   Perspective tilt (direction alternates per step), gentle frame-driven
   float, gold glow behind, and a giant ghosted step numeral. */
const UIPanel: React.FC<{
  src: string;
  sceneDur: number;
  num?: string;
  tilt?: 'left' | 'right';
  width?: number;
  top?: number;
}> = ({src, sceneDur, num, tilt = 'right', width = 1440, top = 200}) => {
  const frame = useCurrentFrame();
  const enter = useEnter(6);
  const dir = tilt === 'right' ? 1 : -1;
  const bob = Math.sin(frame / 26) * 7;
  const sway = Math.sin(frame / 40) * 1.2;
  const zoom = interpolate(frame, [0, sceneDur], [1, 1.04], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <>
      {/* ghosted step numeral behind the screen */}
      {num ? (
        <div
          style={{
            position: 'absolute',
            [tilt === 'right' ? 'left' : 'right']: 40,
            bottom: -60,
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 560,
            lineHeight: 1,
            color: 'rgba(220,188,105,0.09)',
            ...enter,
          }}
        >
          {num}
        </div>
      ) : null}
      {/* gold glow */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: top + 120,
          width: width * 0.85,
          height: 420,
          transform: 'translateX(-50%)',
          background: 'radial-gradient(50% 50% at 50% 50%, rgba(193,154,61,0.22), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
      {/* the tilted screen */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top,
          width,
          marginLeft: -width / 2,
          transform: `perspective(2200px) rotateY(${dir * -9 + sway}deg) rotateX(3.5deg) translateY(${bob}px) scale(${zoom})`,
          transformStyle: 'preserve-3d',
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: `${dir * 40}px 60px 110px rgba(5,4,2,.65)`,
          border: '1.5px solid rgba(255,255,255,.28)',
          outline: '1px solid rgba(193,154,61,.4)',
          outlineOffset: 5,
          ...enter,
        }}
      >
        <Img src={staticFile(src)} style={{width: '100%', display: 'block'}} />
        {/* screen sheen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${dir > 0 ? 115 : 245}deg, rgba(255,255,255,0.10) 0%, transparent 30%)`,
          }}
        />
      </div>
    </>
  );
};

/* ───────── Scene: intro — episode in a framed screening panel ───────── */
const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(8);
  const enterPanel = useEnter(14);
  const enterChip = useEnter(30);
  const bob = Math.sin(frame / 30) * 5;
  // slow-drifting light orbs (frame-driven so they render correctly)
  const drift = Math.sin(frame / 90) * 50;
  return (
    <AbsoluteFill style={{background: stageBackground}}>
      <div
        style={{
          position: 'absolute',
          top: -220 + drift,
          right: -160,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(193,154,61,0.30), transparent 68%)',
          filter: 'blur(70px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -260 - drift,
          left: -180,
          width: 640,
          height: 640,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(51,98,92,0.4), transparent 68%)',
          filter: 'blur(70px)',
        }}
      />
      <div style={{position: 'absolute', left: 100, top: 64, ...enter}}>
        <Wordmark size={44} />
        <div
          style={{
            marginTop: 12,
            fontFamily: T.sans,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: T.goldBright,
          }}
        >
          Case Study · Episode 02
        </div>
      </div>
      {/* the screening panel — same edge treatment as the brand's media frames */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 218,
          width: 1310,
          marginLeft: -655,
          transform: `translateY(${bob}px)`,
          borderRadius: 26,
          overflow: 'hidden',
          border: '1.5px solid rgba(255,255,255,0.55)',
          outline: '1px solid rgba(193,154,61,0.55)',
          outlineOffset: 5,
          boxShadow: '0 40px 110px rgba(5,4,2,0.65)',
          ...enterPanel,
        }}
      >
        <Video muted src={staticFile('ep02/episode.mp4')} style={{width: '100%', display: 'block'}} />
      </div>
      {/* episode chip under the panel */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 962,
          ...enterChip,
        }}
      >
        <Glass
          style={{
            padding: '13px 30px',
            borderRadius: 999,
            fontFamily: T.sans,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          Chubletz Tales · <span style={{color: T.goldBright}}>The Story of Numbers</span>
        </Glass>
      </div>
    </AbsoluteFill>
  );
};

/* ───────── Scene: Step 01a — Nano Banana UI ───────── */
const SceneNano: React.FC = () => (
  <AbsoluteFill style={{background: stageBackground}}>
    <StepHeader kicker="Step 01 — The World" title="Every frame starts as an **image**" />
    <UIPanel src="ep02/ui-nano-banana.png" sceneDur={300} num="01" tilt="right" />
  </AbsoluteFill>
);

/* ───────── Scene: Step 01b — the camera-angle lesson ───────── */
const SceneAngles: React.FC = () => {
  const frame = useCurrentFrame(); // scene-local
  const SPLIT = 240; // 29s→37s flat beat, then the fix
  const flatOpacity = interpolate(frame, [SPLIT - 20, SPLIT + 10], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const gridOpacity = 1 - flatOpacity;
  const enterA = useEnter(4);
  return (
    <AbsoluteFill style={{background: stageBackground}}>
      <StepHeader kicker="Step 01 — The Lesson" title="Front-only looks **flat**" />
      {/* flat beat: single front image, slightly desaturated */}
      <div style={{position: 'absolute', left: '50%', top: 230, transform: 'translateX(-50%)', opacity: flatOpacity, ...enterA}}>
        <div
          style={{
            width: 1180,
            borderRadius: 22,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,.18)',
            boxShadow: '0 30px 90px rgba(5,4,2,.6)',
            filter: 'saturate(.55)',
          }}
        >
          <Img src={staticFile('ep02/einstein-front.jpg')} style={{width: '100%', display: 'block'}} />
        </div>
        <div
          style={{
            textAlign: 'center',
            marginTop: 18,
            fontFamily: T.sans,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: T.textFog,
          }}
        >
          take one — front camera only
        </div>
      </div>
      {/* the fix: three angles */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 250,
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 24,
          opacity: gridOpacity,
        }}
      >
        {[
          {src: 'ep02/einstein-front.jpg', label: 'Front'},
          {src: 'ep02/einstein-side.jpg', label: 'Side'},
          {src: 'ep02/studio.jpg', label: 'Full view'},
        ].map((a, i) => (
          <div key={a.label} style={{textAlign: 'center'}}>
            <div
              style={{
                width: 545,
                aspectRatio: '16/10',
                borderRadius: 20,
                overflow: 'hidden',
                border: i === 1 ? `1.5px solid ${T.goldBright}` : '1px solid rgba(255,255,255,.2)',
                boxShadow: '0 24px 70px rgba(5,4,2,.55)',
              }}
            >
              <Img src={staticFile(a.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
            <div
              style={{
                marginTop: 16,
                fontFamily: T.sans,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: i === 1 ? T.goldBright : T.textFog,
              }}
            >
              {a.label}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ───────── Scene: Step 02 — the shot list ───────── */
const SceneSheet: React.FC = () => (
  <AbsoluteFill style={{background: stageBackground}}>
    <StepHeader kicker="Step 02 — The Shot List" title="The studio is a **spreadsheet**" />
    <UIPanel src="ep02/ui-shot-list.png" sceneDur={480} num="02" tilt="left" />
  </AbsoluteFill>
);

/* ───────── Scene: Step 03 — motion & voice ───────── */
const SceneMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const SPLIT = 210; // 66→73s clips, 73→82s ElevenLabs
  const clipsOpacity = interpolate(frame, [SPLIT - 15, SPLIT + 10], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{background: stageBackground}}>
      <StepHeader kicker="Step 03 — Motion & Voice" title="Stills learn to **move and speak**" />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 300,
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 24,
          opacity: clipsOpacity,
        }}
      >
        {['ep02/clip-1.mp4', 'ep02/clip-2.mp4', 'ep02/clip-3.mp4'].map((c) => (
          <div
            key={c}
            style={{
              width: 545,
              aspectRatio: '16/9',
              borderRadius: 20,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,.2)',
              boxShadow: '0 24px 70px rgba(5,4,2,.55)',
            }}
          >
            <Video muted loop src={staticFile(c)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        ))}
      </div>
      <div style={{opacity: 1 - clipsOpacity, position: 'absolute', inset: 0}}>
        <UIPanel src="ep02/elevenlabs.png" sceneDur={270} top={220} width={1380} num="03" tilt="right" />
      </div>
    </AbsoluteFill>
  );
};

/* ───────── Scene: Step 04 — Claude Code ───────── */
const SceneAgent: React.FC = () => (
  <AbsoluteFill style={{background: stageBackground}}>
    <StepHeader kicker="Step 04 — The Orchestrator" title="**Claude Code** runs the floor" />
    <UIPanel src="ep02/ui-claude-code.png" sceneDur={600} top={180} num="04" tilt="left" />
  </AbsoluteFill>
);

/* ───────── Scene: episode title card ───────── */
const SceneTitleCard: React.FC = () => {
  const enter = useEnter(6);
  const enterLate = useEnter(16);
  return (
    <AbsoluteFill style={{background: stageBackground, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{textAlign: 'center'}}>
        <div style={{...enter, fontFamily: T.sans, fontSize: 20, fontWeight: 600, letterSpacing: '0.34em', textTransform: 'uppercase', color: T.goldBright}}>
          Now playing
        </div>
        <div style={{...enterLate, fontFamily: T.serif, fontWeight: 400, fontSize: 88, color: T.textCream, marginTop: 26, maxWidth: 1300, lineHeight: 1.15}}>
          Why Zero is the <span style={{fontStyle: 'italic', color: T.goldBright}}>Real Superhero</span>
        </div>
        <div style={{...enterLate, fontFamily: T.sans, fontSize: 21, color: T.textFog, marginTop: 24, letterSpacing: '0.14em'}}>
          CHUBLETZ TALES · HOSTED BY ALBERT EINSTEIN
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────── Scene: end card / CTA ───────── */
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const enterWm = useEnter(8);
  const enterSub = useEnter(20);
  const enterBtn = useEnter(32);
  // manifesto line lands when the VO says it (~10.2s into part C)
  const manifestoIn = useEnter(Math.round(10.2 * FPS));
  return (
    <AbsoluteFill style={{background: stageBackground, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{textAlign: 'center'}}>
        <div style={enterWm}>
          <Wordmark size={92} />
        </div>
        <div style={{...enterSub, marginTop: 26, fontFamily: T.sans, fontSize: 22, letterSpacing: '0.18em', color: T.textFog}}>
          FULL CASE STUDY &amp; TEMPLATE — LINK IN THE DESCRIPTION
        </div>
        <div
          style={{
            ...enterBtn,
            marginTop: 42,
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
          }}
        >
          Subscribe
        </div>
        <div
          style={{
            ...manifestoIn,
            marginTop: 54,
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontSize: 34,
            color: T.goldBright,
          }}
        >
          {/* Matches this episode's recorded VO — do not change without re-recording.
              From Ep 03 onward the sign-off is: “Crafted with prompts, finished with taste.” */}
          “The tools are free. The taste is the craft.”
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────── the composition ───────── */
export const CaseStudy02: React.FC = () => {
  const S = FPS;
  return (
    <AbsoluteFill style={{background: stageBackground}}>
      {/* ── Part A visuals ── */}
      <Sequence from={0} durationInFrames={19 * S}>
        <SceneIntro />
      </Sequence>
      <Sequence from={19 * S} durationInFrames={10 * S}>
        <SceneNano />
      </Sequence>
      <Sequence from={29 * S} durationInFrames={21 * S}>
        <SceneAngles />
      </Sequence>
      <Sequence from={50 * S} durationInFrames={16 * S}>
        <SceneSheet />
      </Sequence>
      <Sequence from={66 * S} durationInFrames={16 * S}>
        <SceneMotion />
      </Sequence>
      <Sequence from={82 * S} durationInFrames={20 * S}>
        <SceneAgent />
      </Sequence>
      <Sequence from={102 * S} durationInFrames={PART_A_END - 102 * S}>
        <SceneTitleCard />
      </Sequence>

      {/* ── Part B: the full episode, with its own audio ── */}
      <Sequence from={PART_A_END} durationInFrames={EPISODE_FRAMES}>
        <Video src={staticFile('ep02/episode.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </Sequence>

      {/* ── Part C: CTA ── */}
      <Sequence from={PART_C_START} durationInFrames={TOTAL_FRAMES - PART_C_START}>
        <SceneCTA />
      </Sequence>

      {/* ── Voiceover: part A, then resumes for the CTA ── */}
      <Sequence from={0} durationInFrames={PART_A_END}>
        <Audio src={staticFile('ep02/vo.mp3')} />
      </Sequence>
      <Sequence from={PART_C_START} durationInFrames={TOTAL_FRAMES - PART_C_START}>
        <Audio src={staticFile('ep02/vo.mp3')} startFrom={PART_A_END} />
      </Sequence>

      <Captions02 />
    </AbsoluteFill>
  );
};
