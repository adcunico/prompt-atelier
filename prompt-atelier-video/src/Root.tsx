import React from 'react';
import {AbsoluteFill, Composition, Sequence} from 'remotion';
import {CaseStudy02, TOTAL_FRAMES as CS02_FRAMES} from './ep02/CaseStudy02';
import {stageBackground} from './theme';
import {SofiaLayer} from './SofiaLayer';
import {Captions} from './components';
import {
  SceneIntro,
  SceneImage,
  SceneVoice,
  SceneAnimation,
  SceneAssembly,
  SceneEnd,
} from './scenes/scenes';

const FPS = 30;
const DURATION = Math.round(70.16 * FPS); // 2105 — matches the voiceover video

// Scene boundaries (frames) — aligned with captions.ts estimates
const S = {
  intro: [0, 525],
  image: [525, 915],
  voice: [915, 1320],
  animation: [1320, 1740],
  assembly: [1740, 1950],
  end: [1950, DURATION],
} as const;

const Main: React.FC = () => (
  <AbsoluteFill style={{background: stageBackground}}>
    <Sequence from={S.intro[0]} durationInFrames={S.intro[1] - S.intro[0]}>
      <SceneIntro />
    </Sequence>
    <Sequence from={S.image[0]} durationInFrames={S.image[1] - S.image[0]}>
      <SceneImage />
    </Sequence>
    <Sequence from={S.voice[0]} durationInFrames={S.voice[1] - S.voice[0]}>
      <SceneVoice />
    </Sequence>
    <Sequence from={S.animation[0]} durationInFrames={S.animation[1] - S.animation[0]}>
      <SceneAnimation />
    </Sequence>
    <Sequence from={S.assembly[0]} durationInFrames={S.assembly[1] - S.assembly[0]}>
      <SceneAssembly />
    </Sequence>
    <Sequence from={S.end[0]} durationInFrames={S.end[1] - S.end[0]}>
      <SceneEnd />
    </Sequence>

    {/* Sofia rides above the scenes for the entire video (carries the audio) */}
    <SofiaLayer />
    <Captions />
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <>
    <Composition
      id="Main"
      component={Main}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="CaseStudy02"
      component={CaseStudy02}
      durationInFrames={CS02_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
