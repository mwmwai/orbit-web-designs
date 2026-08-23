import {AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame, interpolate} from 'remotion';

const BG = '#070B1C';
const AMBER = '#F59E0B';
const WHITE = '#F8FAFC';


const STARS = Array.from({length: 90}, (_, i) => ({
  x: (i * 137.5) % 1080,
  y: (i * 311.7) % 1920,
  r: ((i * 7) % 10) / 6 + 0.8,
}));

export const OrbitOutro: React.FC<{wordmark?: string; wordSub?: string; tagline?: string; url?: string}> = ({wordmark = 'ORBIT', wordSub = 'WEB DESIGNS', tagline = 'Your brand, in motion.', url = 'orbitwebdesigns.co.ke'}) => {
  const frame = useCurrentFrame();

  const merge = interpolate(frame, [0, 66], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const radius = interpolate(frame, [0, 66], [440, 40], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const tileScale = interpolate(frame, [56, 70], [1, 0.15], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const wordmarkOpacity = interpolate(frame, [58, 74], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wordmarkScale = interpolate(frame, [58, 82], [0.75, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

  const ringProgress = interpolate(frame, [50, 72], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const ringFlash = interpolate(frame, [70, 76, 92], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // shine sweep across wordmark after ring completes
  const shineX = interpolate(frame, [76, 108], [-200, 1100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const taglineOpacity = interpolate(frame, [78, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const taglineRise = interpolate(taglineOpacity, [0, 1], [24, 0]);
  const urlChars = Math.floor(interpolate(frame, [84, 126], [0, url.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const ctaPulse = interpolate(frame % 45, [0, 22, 45], [1, 1.04, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const urlRevealed = urlChars >= url.length;

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <Sequence from={0}><Audio src={staticFile('sounds/riser.mp3')} volume={0.85} /></Sequence>
      <Sequence from={72}><Audio src={staticFile('sounds/Impact.mp3')} volume={0.95} /></Sequence>
      <Sequence from={84}><Audio src={staticFile('sounds/Typing.mp3')} volume={0.8} /></Sequence>

      {/* nebula backdrop */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 1000px 800px at 50% 42%, rgba(245,158,11,0.12), transparent 55%), radial-gradient(ellipse 900px 700px at 20% 85%, rgba(59,130,246,0.14), transparent 60%), radial-gradient(circle at 50% 50%, #0C1330 0%, #070B1C 78%)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 44%, transparent 52%, rgba(0,0,0,0.6) 100%)'}} />

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
            opacity: 0.2 + 0.45 * Math.abs(Math.sin(i + frame / 38)),
          }}
        />
      ))}

      {/* orbiting tiles with comet trails */}
      {[0, 120, 240].map((offsetDeg, i) => {
        const angle = ((frame - offsetDeg * 0.12) * 3 + offsetDeg) * (Math.PI / 180);
        return (
          <div key={i}>
            <div
              style={{
                position: 'absolute',
                left: 540 + Math.cos(angle - 0.25) * radius - 60,
                top: 800 + Math.sin(angle - 0.25) * radius * 0.55 - 20,
                width: 120,
                height: 8,
                borderRadius: 4,
                background: `linear-gradient(90deg, transparent, rgba(245,158,11,${merge * 0.5}))`,
                transform: `rotate(${Math.sin(angle) * 30}deg)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 540 + Math.cos(angle) * radius - 130,
                top: 800 + Math.sin(angle) * radius * 0.55 - 44,
                width: 260,
                height: 88,
                borderRadius: 18,
                backgroundColor: '#17203B',
                border: `2px solid rgba(245,158,11,${0.35 + merge * 0.5})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: AMBER,
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: 5,
                opacity: merge,
                transform: `scale(${tileScale})`,
                boxShadow: `0 16px 46px rgba(0,0,0,0.55), 0 0 ${30 * merge}px rgba(245,158,11,${merge * 0.35})`,
              }}
            >
              {['DESIGN', 'SPEED', 'SEO'][i]}
            </div>
          </div>
        );
      })}

      {/* central glow */}
      <div
        style={{
          position: 'absolute',
          left: 420,
          top: 680,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(251,191,36,${0.5 * (1 - wordmarkOpacity * 0.6)}) 0%, transparent 70%)`,
          transform: `scale(${interpolate(frame, [0, 66], [0.7, 2])})`,
          opacity: interpolate(frame, [62, 74], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}
      />

      {/* wordmark + ring */}
      <div style={{position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <svg width={940} height={360} viewBox="0 0 900 340" style={{position: 'absolute', overflow: 'visible'}}>
          <ellipse
            cx="450"
            cy="150"
            rx="430"
            ry="145"
            fill="none"
            stroke={AMBER}
            strokeWidth="7"
            strokeDasharray="1750"
            strokeDashoffset={1750 * (1 - ringProgress)}
            transform="rotate(-14 450 150)"
            opacity={0.95}
            style={{filter: 'drop-shadow(0 0 12px rgba(245,158,11,0.7))'}}
          />
          {ringFlash > 0 && (
            <ellipse cx="450" cy="150" rx="430" ry="145" fill="none" stroke={WHITE} strokeWidth={16 * ringFlash} transform="rotate(-14 450 150)" opacity={ringFlash * 0.9} />
          )}
        </svg>
        <div style={{position: 'relative'}}>
          <div
            style={{
              fontSize: 104,
              fontWeight: 900,
              letterSpacing: 16,
              opacity: wordmarkOpacity,
              transform: `scale(${wordmarkScale})`,
              background: 'linear-gradient(180deg, #FFFFFF 30%, #C8B27A)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(245,158,11,0.45))',
            }}
          >
            ORBIT
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: shineX,
              width: 140,
              height: '100%',
              background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.85), transparent)',
              mixBlendMode: 'overlay',
              opacity: frame >= 76 && frame <= 112 ? 1 : 0,
              transform: 'skewX(-18deg)',
            }}
          />
        </div>
        <div style={{color: '#9FB2D8', fontSize: 36, fontWeight: 700, letterSpacing: 10, marginTop: 16, opacity: wordmarkOpacity}}>{wordSub}</div>
      </div>

      {/* tagline */}
      <div style={{position: 'absolute', top: 1160, left: 0, right: 0, textAlign: 'center', opacity: taglineOpacity, transform: `translateY(${taglineRise}px)`}}>
        <span style={{color: WHITE, fontSize: 54, fontWeight: 600, fontStyle: 'italic', textShadow: '0 4px 30px rgba(245,158,11,0.25)'}}>{tagline}</span>
      </div>

      {/* typed URL in pill */}
      <div style={{position: 'absolute', top: 1330, left: 0, right: 0, textAlign: 'center'}}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '26px 54px',
            borderRadius: 60,
            backgroundColor: urlRevealed ? AMBER : 'rgba(23,32,59,0.9)',
            border: `2px solid ${AMBER}`,
            boxShadow: urlRevealed ? `0 0 ${50 * ctaPulse}px rgba(245,158,11,0.55)` : 'none',
            transform: `scale(${urlRevealed ? ctaPulse : 1})`,
          }}
        >
          <span style={{color: urlRevealed ? '#0B1026' : AMBER, fontSize: 56, fontWeight: 800, letterSpacing: 1}}>
            {url.slice(0, urlChars)}
          </span>
          {!urlRevealed && (
            <span style={{color: AMBER, fontSize: 56, fontWeight: 800, opacity: Math.sin(frame / 4) > 0 ? 1 : 0}}>|</span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

