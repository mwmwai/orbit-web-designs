import {AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';

const BG = '#070B1C';
const AMBER = '#F59E0B';
const WHITE = '#F8FAFC';

const PARTICLES = Array.from({length: 40}, (_, i) => ({
  x: (i * 173.3) % 1080,
  y: (i * 277.9) % 1920,
  r: ((i * 13) % 10) / 4 + 0.8,
  speed: ((i * 29) % 12) / 8 + 0.6,
}));

export const WastedFirstImpression: React.FC<{title?: string}> = ({title = 'Your first impression'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const chromeY = spring({frame, fps, config: {damping: 200}});
  const loadProgress = interpolate(frame, [14, 58], [0.08, 1], {easing: Easing.bezier(0.4, 0, 0.6, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pageOpacity = interpolate(frame, [58, 64], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const spinnerOpacity = interpolate(frame, [58, 62], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // impact shake
  const shake = interpolate(frame, [96, 100, 104, 108], [14, -10, 6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const cursorX = interpolate(frame, [68, 82, 92, 100], [180, 540, 540, 1150], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cursorY = interpolate(frame, [68, 82, 92, 100], [1750, 1250, 1250, -80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.5, 0, 0.5, 1),
  });
  const cursorOpacity = interpolate(frame, [66, 70, 96, 101], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const dim = interpolate(frame, [98, 118], [0, 0.95], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titleOpacity = interpolate(frame, [24, 36, 96, 108], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titleRise = interpolate(titleOpacity, [0, 1], [30, 0]);

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <Audio src={staticFile('sounds/Click.mp3')} volume={0.9} />
      <Sequence from={96}>
        <Audio src={staticFile('sounds/Impact.mp3')} volume={0.95} />
      </Sequence>

      {/* nebula backdrop */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 900px 700px at 25% 15%, rgba(59,60,130,0.35), transparent 60%), radial-gradient(ellipse 800px 600px at 80% 85%, rgba(180,80,40,0.18), transparent 60%), radial-gradient(circle at 50% 50%, #0D1330 0%, #070B1C 75%)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />

      {/* drifting dust */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: (p.y - frame * p.speed) % 1920,
            width: p.r * 2,
            height: p.r * 2,
            borderRadius: '50%',
            backgroundColor: '#8892C8',
            opacity: 0.18,
          }}
        />
      ))}

      <div style={{transform: `translate(${shake}px, ${shake * 0.4}px)`}}>
        {/* browser window */}
        <div
          style={{
            position: 'absolute',
            top: 280,
            left: 60,
            right: 60,
            height: 1160,
            borderRadius: 30,
            overflow: 'hidden',
            backgroundColor: '#161C31',
            boxShadow: '0 40px 110px rgba(0,0,0,0.75), 0 0 0 1px rgba(136,146,176,0.15)',
            transform: `translateY(${interpolate(chromeY, [0, 1], [90, 0])}px)`,
          }}
        >
          <div style={{height: 84, backgroundColor: '#1E2540', display: 'flex', alignItems: 'center', paddingLeft: 26, gap: 14}}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <div key={c} style={{width: 22, height: 22, borderRadius: 11, backgroundColor: c}} />
            ))}
            <div style={{marginLeft: 18, flex: 1, height: 42, borderRadius: 11, backgroundColor: '#11162A', display: 'flex', alignItems: 'center', paddingLeft: 16, color: '#6B7594', fontSize: 22}}>
              old-business-site.com
            </div>
          </div>
          <div style={{height: 10, backgroundColor: '#0E1326'}}>
            <div style={{height: '100%', width: `${loadProgress * 100}%`, background: 'linear-gradient(90deg, #55607F, #8892B0)', borderRadius: 5}} />
          </div>

          <div style={{position: 'absolute', inset: 94, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: spinnerOpacity, flexDirection: 'column', gap: 26}}>
            <div
              style={{
                width: 96,
                height: 96,
                border: '8px solid #232C48',
                borderTopColor: '#8892B0',
                borderRadius: '50%',
                transform: `rotate(${frame * 7}deg)`,
              }}
            />
            <div style={{color: '#55607F', fontSize: 28, letterSpacing: 6, fontWeight: 600}}>LOADING...</div>
          </div>

          <div style={{position: 'absolute', inset: 94, opacity: pageOpacity, backgroundColor: '#C4C9D1'}}>
            <div style={{height: 300, background: 'linear-gradient(120deg, #8E95A1, #A6ADB8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EDEFF3', fontSize: 52, fontWeight: 800, letterSpacing: 3, textShadow: '0 2px 10px rgba(0,0,0,0.25)'}}>
              WELCOME TO OUR SITE
            </div>
            <div style={{padding: '34px 40px'}}>
              <div style={{height: 26, width: '72%', backgroundColor: '#A8AEB9', marginBottom: 18}} />
              <div style={{height: 26, width: '58%', backgroundColor: '#A8AEB9', marginBottom: 18}} />
              <div style={{height: 26, width: '66%', backgroundColor: '#A8AEB9'}} />
            </div>
            <div style={{display: 'flex', gap: 24, padding: '0 40px'}}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{flex: 1, height: 220, backgroundColor: '#B2B8C2'}} />
              ))}
            </div>
          </div>
        </div>

        {/* visitor cursor */}
        <svg width={56} height={56} viewBox="0 0 24 24" style={{position: 'absolute', left: cursorX, top: cursorY, opacity: cursorOpacity, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))'}}>
          <path d="M4 2 L4 19 L9 14.5 L12.5 21 L15.5 19.5 L12 13 L19 13 Z" fill={WHITE} stroke="#0B1026" strokeWidth="1" />
        </svg>
      </div>

      {/* overlay title */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 60,
          right: 60,
          textAlign: 'center',
          fontSize: 78,
          fontWeight: 800,
          letterSpacing: -1,
          opacity: titleOpacity,
          transform: `translateY(${titleRise}px)`,
          background: 'linear-gradient(180deg, #FFFFFF, #AEB8DA)',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {title}
      </div>

      <AbsoluteFill style={{backgroundColor: '#000', opacity: dim}} />
    </AbsoluteFill>
  );
};
