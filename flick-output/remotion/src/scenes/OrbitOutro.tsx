import {AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame, interpolate} from 'remotion';

const BG = '#0B1026';
const AMBER = '#F59E0B';
const WHITE = '#F8FAFC';
const URL = 'orbitwebdesigns.co.ke';

const STARS = Array.from({length: 70}, (_, i) => ({
  x: (i * 137.5) % 1080,
  y: (i * 311.7) % 1920,
  r: ((i * 7) % 10) / 6 + 0.8,
}));

export const OrbitOutro: React.FC = () => {
  const frame = useCurrentFrame();

  // tiles orbit and spiral inward from frame 0 to 72
  const merge = interpolate(frame, [0, 66], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const radius = interpolate(frame, [0, 66], [430, 40], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const tileScale = interpolate(frame, [56, 70], [1, 0.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const wordmarkOpacity = interpolate(frame, [58, 74], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wordmarkScale = interpolate(frame, [58, 80], [0.8, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

  // ring draws around wordmark, completes at 72
  const ringProgress = interpolate(frame, [50, 72], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const ringFlash = interpolate(frame, [70, 76, 88], [0, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const taglineOpacity = interpolate(frame, [78, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const urlChars = Math.floor(interpolate(frame, [84, 128], [0, URL.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <Sequence from={0}><Audio src={staticFile('sounds/riser.mp3')} volume={0.85} /></Sequence>
      <Sequence from={72}><Audio src={staticFile('sounds/Impact.mp3')} volume={0.95} /></Sequence>
      <Sequence from={84}><Audio src={staticFile('sounds/Typing.mp3')} volume={0.8} /></Sequence>

      {/* starfield */}
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: '50%',
            backgroundColor: WHITE,
            opacity: 0.25 + 0.4 * Math.abs(Math.sin(i + frame / 40)),
          }}
        />
      ))}

      {/* orbiting tiles */}
      {[0, 120, 240].map((offsetDeg, i) => {
        const angle = ((frame - offsetDeg * 0.12) * 3 + offsetDeg) * (Math.PI / 180);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 540 + Math.cos(angle) * radius - 130,
              top: 800 + Math.sin(angle) * radius * 0.55 - 44,
              width: 260,
              height: 88,
              borderRadius: 16,
              backgroundColor: '#17203B',
              border: `2px solid rgba(245,158,11,${0.35 + merge * 0.45})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: AMBER,
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: 4,
              opacity: merge,
              transform: `scale(${tileScale})`,
              boxShadow: '0 14px 40px rgba(0,0,0,0.5)',
            }}
          >
            {['DESIGN', 'SPEED', 'SEO'][i]}
          </div>
        );
      })}

      {/* central glow */}
      <div
        style={{
          position: 'absolute',
          left: 440,
          top: 700,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(251,191,36,${0.55 * (1 - wordmarkOpacity * 0.7)}) 0%, transparent 70%)`,
          transform: `scale(${interpolate(frame, [0, 60], [0.7, 1.6])})`,
        }}
      />

      {/* wordmark + ring */}
      <div style={{position: 'absolute', top: 720, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <svg width={900} height={340} viewBox="0 0 900 340" style={{position: 'absolute', overflow: 'visible'}}>
          <ellipse
            cx="450"
            cy="150"
            rx="420"
            ry="140"
            fill="none"
            stroke={AMBER}
            strokeWidth="6"
            strokeDasharray="1700"
            strokeDashoffset={1700 * (1 - ringProgress)}
            transform="rotate(-14 450 150)"
            opacity={0.9}
          />
          {ringFlash > 0 && (
            <ellipse cx="450" cy="150" rx="420" ry="140" fill="none" stroke={WHITE} strokeWidth={14 * ringFlash} transform="rotate(-14 450 150)" opacity={ringFlash} />
          )}
        </svg>
        <div
          style={{
            color: WHITE,
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: 14,
            opacity: wordmarkOpacity,
            transform: `scale(${wordmarkScale})`,
            textShadow: '0 0 60px rgba(245,158,11,0.4)',
          }}
        >
          ORBIT
        </div>
        <div style={{color: '#9FB2D8', fontSize: 34, fontWeight: 700, letterSpacing: 8, marginTop: 18, opacity: wordmarkOpacity}}>WEB DESIGNS</div>
      </div>

      {/* tagline */}
      <div style={{position: 'absolute', top: 1150, left: 0, right: 0, textAlign: 'center', color: WHITE, fontSize: 52, fontWeight: 600, fontStyle: 'italic', opacity: taglineOpacity}}>
        Your brand, in motion.
      </div>

      {/* typed URL */}
      <div style={{position: 'absolute', top: 1330, left: 0, right: 0, textAlign: 'center'}}>
        <span style={{color: AMBER, fontSize: 58, fontWeight: 800, letterSpacing: 1}}>{URL.slice(0, urlChars)}</span>
        <span style={{color: AMBER, fontSize: 58, fontWeight: 800, opacity: urlChars < URL.length ? (Math.sin(frame / 4) > 0 ? 1 : 0) : 0}}>|</span>
      </div>
    </AbsoluteFill>
  );
};
