import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';
import {COLORS, FONT, FONT_BODY, Step} from './theme';

export const Backdrop: React.FC<{tint?: string}> = ({tint}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 45);
  const glow = tint ?? COLORS.accent2;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        backgroundImage: `radial-gradient(560px 560px at ${82 + drift * 3}% ${14}%, ${glow}59, transparent 68%),
          radial-gradient(640px 640px at ${12 - drift * 2}% ${96}%, ${COLORS.accent}2e, transparent 70%),
          linear-gradient(180deg, ${COLORS.dark} 0%, ${COLORS.bg} 100%)`
      }}
    />
  );
};

export const WordCascade: React.FC<{
  text: string;
  size: number;
  color?: string;
  start?: number;
  weight?: number;
}> = ({text, size, color = COLORS.text, start = 6, weight = 800}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = text.split(' ');
  return (
    <div style={{fontFamily: FONT_BODY, fontWeight: weight, fontSize: size, lineHeight: 1.25}}>
      {words.map((w, i) => {
        const s = spring({
          frame: frame - start - i * 2,
          fps,
          config: {damping: 18, stiffness: 160}
        });
        const opacity = interpolate(s, [0, 1], [0, 1]);
        return (
          <span
            key={`${w}-${i}`}
            style={{
              display: 'inline-block',
              marginRight: size * 0.28,
              transform: `translateY(${(1 - s) * 26}px)`,
              opacity,
              color
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Pill: React.FC<{label: string; delay?: number; color?: string}> = ({
  label,
  delay = 4,
  color = COLORS.accent
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 14}});
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        padding: '14px 36px',
        borderRadius: 999,
        border: `3px solid ${color}`,
        color,
        fontFamily: FONT,
        fontSize: 34,
        letterSpacing: 6,
        transform: `scale(${interpolate(s, [0, 1], [0.7, 1])})`,
        opacity: interpolate(s, [0, 1], [0, 1])
      }}
    >
      {label}
    </div>
  );
};

export const HookScene: React.FC<{stat: string; line: string}> = ({stat, line}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 12, stiffness: 120}, durationInFrames: 24});
  const shake = Math.sin(frame / 6) * (1 - s) * 8;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 90}}>
      <Backdrop />
      <Audio src={staticFile('sfx/Impact.mp3')} volume={0.7} />
      <div style={{textAlign: 'center'}}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: stat.length > 8 ? 130 : 190,
            color: COLORS.accent,
            transform: `scale(${interpolate(s, [0, 1], [0.4, 1])}) rotate(${shake}deg)`,
            textShadow: '0 20px 80px rgba(0,0,0,0.6)'
          }}
        >
          {stat.toUpperCase()}
        </div>
        <div style={{marginTop: 50, display: 'flex', justifyContent: 'center', textAlign: 'left'}}>
          <WordCascade text={line} size={62} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CredibilityScene: React.FC<{text: string}> = ({text}) => (
  <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 100}}>
    <Backdrop tint={COLORS.accent2} />
    <div style={{display: 'flex', flexDirection: 'column', gap: 40}}>
      <Pill label="WHY LISTEN TO ME" color={COLORS.accent2} />
      <WordCascade text={text} size={64} />
    </div>
  </AbsoluteFill>
);

export const FrameworkIntroScene: React.FC<{name: string}> = ({name}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Backdrop />
      <Audio src={staticFile('sfx/Popups.mp3')} volume={0.6} />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 46}}>
        <Pill label="THE FRAMEWORK" />
        <div style={{display: 'flex', gap: 26}}>
          {name.split('').map((ch, i) => {
            const s = spring({
              frame: frame - 12 - i * 7,
              fps,
              config: {damping: 11}
            });
            return (
              <div
                key={i}
                style={{
                  width: ch === '.' ? 40 : 170,
                  height: 170,
                  borderRadius: 34,
                  background: i % 2 === 0 ? COLORS.accent : COLORS.accent2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontFamily: FONT,
                  fontSize: ch === '.' ? 120 : 110,
                  color: COLORS.dark,
                  transform: `translateY(${(1 - s) * 220}px) rotate(${(1 - s) * 22}deg)`,
                  opacity: interpolate(s, [0, 1], [0, 1])
                }}
              >
                {ch === '.' ? '·' : ch.toUpperCase()}
              </div>
            );
          })}
        </div>
        <WordCascade text="Remember these four moves." size={52} start={30} color={COLORS.muted} />
      </div>
    </AbsoluteFill>
  );
};

export const StepScene: React.FC<{step: Step; index: number; total: number}> = ({
  step,
  index,
  total
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const badge = spring({frame: frame - 4, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{padding: 100}}>
      <Backdrop tint={index % 2 === 0 ? COLORS.accent : COLORS.accent2} />
      <div style={{display: 'flex', gap: 18, marginBottom: 70}}>
        {Array.from({length: total}).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 14,
              borderRadius: 7,
              background: i <= index ? COLORS.accent : 'rgba(255,255,255,0.15)'
            }}
          />
        ))}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 44}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
          <div
            style={{
              width: 190,
              height: 190,
              borderRadius: '50%',
              background: COLORS.accent,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontFamily: FONT,
              fontSize: 104,
              color: COLORS.dark,
              transform: `scale(${interpolate(badge, [0, 1], [0, 1])})`
            }}
          >
            {step.key.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 96,
              color: COLORS.text,
              opacity: interpolate(spring({frame: frame - 10, fps}), [0, 1], [0, 1])
            }}
          >
            {step.title.toUpperCase()}
          </div>
        </div>
        <WordCascade text={step.point} size={58} start={16} color={COLORS.text} />
      </div>
    </AbsoluteFill>
  );
};

export const ExampleScene: React.FC<{text: string}> = ({text}) => (
  <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 100}}>
    <Backdrop tint={COLORS.accent} />
    <Audio src={staticFile('sfx/Notification.mp3')} volume={0.5} />
    <div style={{display: 'flex', flexDirection: 'column', gap: 40}}>
      <Pill label="REAL EXAMPLE" />
      <WordCascade text={text} size={66} />
    </div>
  </AbsoluteFill>
);

export const CtaScene: React.FC<{question: string; offer: string; handle: string}> = ({
  question,
  offer,
  handle
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pulse = spring({frame: frame - 30, fps, config: {damping: 9}});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 100}}>
      <Backdrop tint={COLORS.accent2} />
      <Audio src={staticFile('sfx/energy.MP3')} volume={0.45} />
      <Audio src={staticFile('sfx/Zoomin-OR-out.mp3')} volume={0.5} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 56,
          textAlign: 'center'
        }}
      >
        <WordCascade text={question} size={74} />
        <div
          style={{
            padding: '30px 54px',
            borderRadius: 999,
            background: COLORS.accent,
            color: COLORS.dark,
            fontFamily: FONT,
            fontSize: 48,
            transform: `scale(${1 + pulse * 0.06})`,
            boxShadow: '0 24px 70px rgba(255,214,10,0.35)'
          }}
        >
          {offer}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 42,
            color: COLORS.muted,
            opacity: interpolate(frame, [50, 65], [0, 1], {extrapolateLeft: 'clamp'})
          }}
        >
          {handle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
