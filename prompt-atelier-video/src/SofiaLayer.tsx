import React from 'react';
import {
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import {T} from './theme';

/**
 * Sofia lives in the bottom-right squircle for the WHOLE video (20% width —
 * small hides the 256px face render). She springs in on "including me, was
 * made with AI" (~9.8s) with a one-time gold shimmer sweep. The video element
 * is mounted from frame 0 so her audio plays from the very start.
 */
const ENTER = 8; // on screen from the start (tiny spring-in at the very top)
const SHIMMER = 325; // gold sweep still lands on "including me, was made with AI"
const PIP = 384; // 20% of 1920
const PIP_X = 1920 - 86 - PIP;
const PIP_Y = 1080 - 81 - PIP;

export const SofiaLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const pop = spring({
    frame: frame - ENTER,
    fps,
    config: {damping: 13, mass: 0.7, stiffness: 120},
  });
  const visible = frame >= ENTER ? 1 : 0;

  // one-time gold shimmer across the frame on "including me, was made with AI"
  const shimmerX = interpolate(frame, [SHIMMER, SHIMMER + 38], [-160, 160], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shimmerOn = frame > SHIMMER - 2 && frame < SHIMMER + 40 ? 1 : 0;

  // gentle fade in the final second
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames - 5], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: PIP_X,
          top: PIP_Y,
          width: PIP,
          height: PIP,
          borderRadius: PIP * 0.26,
          overflow: 'hidden',
          border: `1.5px solid rgba(255,255,255,${0.55 * visible})`,
          outline: `1px solid rgba(193,154,61,${0.55 * visible})`,
          outlineOffset: 3,
          boxShadow: `0 14px 40px rgba(10,8,4,${0.4 * visible})`,
          transform: `scale(${visible ? pop : 0})`,
          opacity: fadeOut,
        }}
      >
        <Video
          src={staticFile('sofia.mp4')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 14%',
          }}
        />
        {shimmerOn ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translateX(${shimmerX}%) rotate(12deg) scaleY(1.6)`,
              background:
                'linear-gradient(105deg, transparent 30%, rgba(220,188,105,0.45) 50%, transparent 70%)',
            }}
          />
        ) : null}
      </div>
      <div
        style={{
          position: 'absolute',
          left: PIP_X,
          top: PIP_Y + PIP + 14,
          width: PIP,
          textAlign: 'center',
          fontFamily: T.sans,
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: T.goldBright,
          opacity: visible * pop * fadeOut,
        }}
      >
        Sofia
      </div>
    </>
  );
};
