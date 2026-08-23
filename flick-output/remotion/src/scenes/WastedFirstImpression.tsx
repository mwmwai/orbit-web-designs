import {AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';

const BG = '#0B1026';
const AMBER = '#F59E0B';
const WHITE = '#F8FAFC';

export const WastedFirstImpression: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const chromeY = spring({frame, fps, config: {damping: 200}});
  const loadProgress = interpolate(frame, [14, 58], [0.08, 1], {easing: Easing.bezier(0.4, 0, 0.6, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pageOpacity = interpolate(frame, [58, 64], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const spinnerOpacity = interpolate(frame, [58, 62], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // cursor: enters from bottom-left, hovers, exits top-right
  const cursorX = interpolate(frame, [68, 82, 92, 100], [180, 540, 540, 1150], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cursorY = interpolate(frame, [68, 82, 92, 100], [1750, 1250, 1250, -80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.5, 0, 0.5, 1),
  });
  const cursorOpacity = interpolate(frame, [66, 70, 96, 101], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const dim = interpolate(frame, [96, 116], [0, 0.94], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titleOpacity = interpolate(frame, [24, 36, 96, 108], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <Audio src={staticFile('sounds/Click.mp3')} volume={0.9} />
      <Sequence from={96}>
        <Audio src={staticFile('sounds/Impact.mp3')} volume={0.95} />
      </Sequence>

      {/* browser window */}
      <div
        style={{
          position: 'absolute',
          top: 260,
          left: 60,
          right: 60,
          height: 1180,
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: '#1A2036',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          transform: `translateY(${interpolate(chromeY, [0, 1], [80, 0])}px)`,
        }}
      >
        {/* chrome bar */}
        <div style={{height: 84, backgroundColor: '#232A44', display: 'flex', alignItems: 'center', paddingLeft: 26, gap: 14}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{width: 22, height: 22, borderRadius: 11, backgroundColor: c}} />
          ))}
          <div style={{marginLeft: 18, flex: 1, height: 40, borderRadius: 10, backgroundColor: '#141A2E', display: 'flex', alignItems: 'center', paddingLeft: 16, color: '#6B7594', fontSize: 22}}>
            old-business-site.com
          </div>
        </div>
        {/* loading bar */}
        <div style={{height: 8, backgroundColor: '#12172B'}}>
          <div style={{height: '100%', width: `${loadProgress * 100}%`, backgroundColor: '#8892B0'}} />
        </div>

        {/* stalled spinner */}
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: spinnerOpacity}}>
          <div
            style={{
              width: 90,
              height: 90,
              border: '8px solid #2A3352',
              borderTopColor: '#8892B0',
              borderRadius: '50%',
              transform: `rotate(${frame * 7}deg)`,
            }}
          />
        </div>

        {/* dull rendered page */}
        <div style={{position: 'absolute', inset: 92, opacity: pageOpacity, backgroundColor: '#C9CDD4'}}>
          <div style={{height: 300, backgroundColor: '#9AA1AC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E4E7EC', fontSize: 52, fontWeight: 700, letterSpacing: 2}}>
            WELCOME TO OUR SITE
          </div>
          <div style={{padding: '34px 40px'}}>
            <div style={{height: 26, width: '72%', backgroundColor: '#AFB5BF', marginBottom: 18}} />
            <div style={{height: 26, width: '60%', backgroundColor: '#AFB5BF', marginBottom: 18}} />
            <div style={{height: 26, width: '66%', backgroundColor: '#AFB5BF'}} />
          </div>
          <div style={{display: 'flex', gap: 24, padding: '0 40px'}}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{flex: 1, height: 220, backgroundColor: '#B7BDC7'}} />
            ))}
          </div>
        </div>
      </div>

      {/* visitor cursor */}
      <svg width={56} height={56} viewBox="0 0 24 24" style={{position: 'absolute', left: cursorX, top: cursorY, opacity: cursorOpacity, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))'}}>
        <path d="M4 2 L4 19 L9 14.5 L12.5 21 L15.5 19.5 L12 13 L19 13 Z" fill={WHITE} stroke="#0B1026" strokeWidth="1" />
      </svg>

      {/* overlay title */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: WHITE,
          fontSize: 76,
          fontWeight: 800,
          letterSpacing: -1,
          opacity: titleOpacity,
          textShadow: '0 4px 30px rgba(0,0,0,0.6)',
        }}
      >
        Your first impression
      </div>

      {/* dim to black */}
      <AbsoluteFill style={{backgroundColor: '#000', opacity: dim}} />
    </AbsoluteFill>
  );
};
