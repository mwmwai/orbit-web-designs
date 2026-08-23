import {AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';

const BG = '#070B1C';
const AMBER = '#F59E0B';
const WHITE = '#F8FAFC';

const CONFETTI = Array.from({length: 26}, (_, i) => ({
  x: (i * 97.7) % 1080,
  angle: (i * 47) % 360,
  color: ['#F59E0B', '#FBBF24', '#34D399', '#60A5FA'][i % 4],
  dist: 220 + ((i * 53) % 260),
}));

const Snap: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 200}});
  return (
    <div
      style={{
        transform: `scale(${interpolate(s, [0, 1], [0.6, 1])}) translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
        opacity: interpolate(s, [0, 1], [0, 1]),
      }}
    >
      {children}
    </div>
  );
};

export const OrbitBuildsBetter: React.FC<{brand?: string; hero?: string; cta?: string}> = ({brand = 'ORBIT', hero = '{hero}', cta = 'Get started'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const cursorX = interpolate(frame, [86, 103], [140, 620], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const cursorY = interpolate(frame, [86, 103], [1560, 1215], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const clickPulse = interpolate(frame, [105, 112, 119], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const conv = spring({frame: frame - 117, fps, config: {damping: 14, stiffness: 170}});

  const badgeScale = interpolate(frame, [78, 84, 90], [2.2, 1, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const badgeOpacity = interpolate(frame, [78, 82], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const badgeRot = interpolate(frame, [78, 88], [-30, -12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const exitX = interpolate(frame, [146, 150], [0, -70], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const confettiT = interpolate(frame, [117, 145], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shineX = interpolate(frame, [0, 150], ['-30%', '130%']);

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <Sequence from={12}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.8} /></Sequence>
      <Sequence from={27}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.8} /></Sequence>
      <Sequence from={45}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.8} /></Sequence>
      <Sequence from={60}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.8} /></Sequence>
      <Sequence from={78}><Audio src={staticFile('sounds/Zoomin-OR-out.mp3')} volume={0.85} /></Sequence>
      <Sequence from={105}><Audio src={staticFile('sounds/Click.mp3')} volume={0.9} /></Sequence>
      <Sequence from={117}><Audio src={staticFile('sounds/Correct.mp3')} volume={0.9} /></Sequence>

      {/* warm hopeful backdrop */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 900px 650px at 50% 10%, rgba(245,158,11,0.16), transparent 55%), radial-gradient(ellipse 800px 600px at 15% 90%, rgba(59,130,246,0.14), transparent 60%), radial-gradient(circle at 50% 50%, #0C1330 0%, #070B1C 78%)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)'}} />

      <AbsoluteFill style={{transform: `translateX(${exitX}px)`}}>
        <div style={{position: 'absolute', top: 300, left: 70, right: 70, height: 1100, borderRadius: 30, overflow: 'hidden', backgroundColor: '#F5F7FC', boxShadow: '0 40px 110px rgba(0,0,0,0.65), 0 0 80px rgba(245,158,11,0.08)'}}>
          <Snap at={12}>
            <div style={{height: 76, backgroundColor: WHITE, borderBottom: '1px solid #E3E8F2', display: 'flex', alignItems: 'center', padding: '0 30px'}}>
              <div style={{color: '#0B1026', fontWeight: 900, fontSize: 30, letterSpacing: 2}}>{brand}</div>
              <div style={{marginLeft: 'auto', display: 'flex', gap: 26, fontSize: 22, color: '#5A6478'}}>
                <span>Work</span>
                <span>Services</span>
                <span>Contact</span>
              </div>
            </div>
          </Snap>
          <Snap at={27}>
            <div style={{padding: '54px 44px 10px'}}>
              <div
                style={{
                  fontSize: 76,
                  fontWeight: 900,
                  lineHeight: 1.05,
                  letterSpacing: -1.5,
                  background: 'linear-gradient(120deg, #0B1026 40%, #B45309)',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {hero}
              </div>
              <div style={{marginTop: 18, height: 24, width: '62%', backgroundColor: '#CBD4E6', borderRadius: 8}} />
              <div style={{marginTop: 14, height: 24, width: '44%', backgroundColor: '#DDE3F0', borderRadius: 8}} />
            </div>
          </Snap>
          <div style={{display: 'flex', gap: 22, padding: '36px 44px 0'}}>
            {[
              {at: 45, icon: 'M4 17 L9 11 L13 14 L20 6'},
              {at: 60, icon: 'M12 3 L21 8 L12 13 L3 8 Z M3 13 L12 18 L21 13'},
            ].map(({at, icon}) => (
              <Snap key={at} at={at}>
                <div
                  style={{
                    width: 380,
                    height: 240,
                    borderRadius: 20,
                    backgroundColor: WHITE,
                    border: '1px solid #E3E8F2',
                    boxShadow: '0 14px 36px rgba(11,16,38,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width={84} height={84} viewBox="0 0 24 24">
                    <path d={icon} fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </Snap>
            ))}
          </div>
          <Snap at={72}>
            <div style={{padding: '40px 44px 0'}}>
              <div
                style={{
                  width: 400,
                  height: 104,
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #F59E0B, #FBCE3A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0B1026',
                  fontSize: 34,
                  fontWeight: 800,
                  transform: `scale(${1 + clickPulse * 0.06})`,
                  boxShadow: clickPulse > 0 ? `0 0 ${clickPulse * 70}px rgba(245,158,11,0.8)` : '0 14px 40px rgba(245,158,11,0.35)',
                }}
              >
                {cta}
              </div>
            </div>
          </Snap>
        </div>

        {/* speed badge */}
        <div
          style={{
            position: 'absolute',
            top: 255,
            right: 75,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #FBBF24, #EA8A04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0B1026',
            transform: `rotate(${badgeRot}deg) scale(${badgeScale})`,
            opacity: badgeOpacity,
            boxShadow: '0 22px 60px rgba(245,158,11,0.55), inset 0 -6px 14px rgba(120,60,0,0.25)',
          }}
        >
          <div style={{fontSize: 76, fontWeight: 900, lineHeight: 1}}>98</div>
          <div style={{fontSize: 22, fontWeight: 700, letterSpacing: 4}}>SPEED</div>
        </div>

        {/* conversion card */}
        <div
          style={{
            position: 'absolute',
            bottom: 210,
            left: 90,
            right: 90,
            borderRadius: 26,
            backgroundColor: 'rgba(18,32,62,0.92)',
            border: '1px solid rgba(96,165,250,0.35)',
            padding: '36px 40px',
            display: 'flex',
            alignItems: 'center',
            gap: 26,
            opacity: interpolate(conv, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(conv, [0, 1], [120, 0])}px)`,
            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(52,211,153,0.12)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{width: 92, height: 92, borderRadius: '50%', background: 'linear-gradient(145deg, #34D399, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 40px rgba(52,211,153,0.45)'}}>
            <svg width={50} height={50} viewBox="0 0 24 24">
              <path d="M4 12.5 L9.5 18 L20 6.5" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{color: WHITE}}>
            <div style={{fontSize: 38, fontWeight: 800}}>Visitor becomes customer</div>
            <div style={{fontSize: 27, color: '#9FB2D8', marginTop: 6}}>One click. One conversion.</div>
          </div>
        </div>

        {/* confetti burst on conversion */}
        {confettiT > 0 &&
          confettiT < 1 &&
          CONFETTI.map((c, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 620 + Math.cos((c.angle * Math.PI) / 180) * c.dist * confettiT - 8,
                top: 1180 + Math.sin((c.angle * Math.PI) / 180) * c.dist * confettiT + confettiT * confettiT * 300 - 8,
                width: 16,
                height: 16,
                borderRadius: i % 2 ? 8 : 3,
                backgroundColor: c.color,
                opacity: 1 - confettiT,
                transform: `rotate(${confettiT * c.angle}deg)`,
              }}
            />
          ))}

        {/* cursor */}
        <svg width={56} height={56} viewBox="0 0 24 24" style={{position: 'absolute', left: cursorX, top: cursorY, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))'}}>
          <path d="M4 2 L4 19 L9 14.5 L12.5 21 L15.5 19.5 L12 13 L19 13 Z" fill={WHITE} stroke="#0B1026" strokeWidth="1" />
        </svg>

        {/* shine sweep */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(105deg, transparent ${shineX}, rgba(255,255,255,0.07) ${parseFloat(shineX) + 8}%, transparent ${parseFloat(shineX) + 16}%)`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

