import {AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';

const BG = '#0B1026';
const AMBER = '#F59E0B';
const WHITE = '#F8FAFC';

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

export const OrbitBuildsBetter: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const cursorX = interpolate(frame, [86, 103], [140, 620], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const cursorY = interpolate(frame, [86, 103], [1560, 1215], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const clickPulse = interpolate(frame, [105, 112, 119], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const conv = spring({frame: frame - 117, fps, config: {damping: 14, stiffness: 170}});

  const badgeScale = interpolate(frame, [78, 84, 90], [2.2, 1, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const badgeOpacity = interpolate(frame, [78, 82], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const exitX = interpolate(frame, [146, 150], [0, -60], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <Sequence from={12}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.8} /></Sequence>
      <Sequence from={27}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.8} /></Sequence>
      <Sequence from={45}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.8} /></Sequence>
      <Sequence from={60}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.8} /></Sequence>
      <Sequence from={78}><Audio src={staticFile('sounds/Zoomin-OR-out.mp3')} volume={0.85} /></Sequence>
      <Sequence from={105}><Audio src={staticFile('sounds/Click.mp3')} volume={0.9} /></Sequence>
      <Sequence from={117}><Audio src={staticFile('sounds/Correct.mp3')} volume={0.9} /></Sequence>

      <AbsoluteFill style={{transform: `translateX(${exitX}px)`}}>
        <div style={{position: 'absolute', top: 300, left: 70, right: 70, height: 1100, borderRadius: 28, overflow: 'hidden', backgroundColor: '#F4F6FB', boxShadow: '0 30px 80px rgba(0,0,0,0.55)'}}>
          <Snap at={12}>
            <div style={{height: 76, backgroundColor: WHITE, borderBottom: '1px solid #E3E8F2', display: 'flex', alignItems: 'center', padding: '0 30px'}}>
              <div style={{color: '#0B1026', fontWeight: 900, fontSize: 30, letterSpacing: 2}}>ORBIT</div>
              <div style={{marginLeft: 'auto', display: 'flex', gap: 26, fontSize: 22, color: '#5A6478'}}>
                <span>Work</span>
                <span>Services</span>
                <span>Contact</span>
              </div>
            </div>
          </Snap>
          <Snap at={27}>
            <div style={{padding: '54px 44px 10px'}}>
              <div style={{color: '#0B1026', fontSize: 74, fontWeight: 900, lineHeight: 1.05, letterSpacing: -1.5}}>Websites that work.</div>
              <div style={{marginTop: 18, height: 24, width: '62%', backgroundColor: '#C9D2E4', borderRadius: 8}} />
            </div>
          </Snap>
          <div style={{display: 'flex', gap: 22, padding: '36px 44px 0'}}>
            <Snap at={45}>
              <div style={{width: 380, height: 240, borderRadius: 18, backgroundColor: WHITE, border: '1px solid #E3E8F2', boxShadow: '0 12px 30px rgba(11,16,38,0.08)'}} />
            </Snap>
            <Snap at={60}>
              <div style={{width: 380, height: 240, borderRadius: 18, backgroundColor: WHITE, border: '1px solid #E3E8F2', boxShadow: '0 12px 30px rgba(11,16,38,0.08)'}} />
            </Snap>
          </div>
          <Snap at={72}>
            <div style={{padding: '40px 44px 0'}}>
              <div
                style={{
                  width: 400,
                  height: 104,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${AMBER}, #FBBF24)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0B1026',
                  fontSize: 34,
                  fontWeight: 800,
                  transform: `scale(${1 + clickPulse * 0.06})`,
                  boxShadow: clickPulse > 0 ? `0 0 ${clickPulse * 60}px rgba(245,158,11,0.7)` : 'none',
                }}
              >
                Get started
              </div>
            </div>
          </Snap>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 260,
            right: 80,
            width: 190,
            height: 190,
            borderRadius: '50%',
            backgroundColor: AMBER,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0B1026',
            transform: `rotate(-12deg) scale(${badgeScale})`,
            opacity: badgeOpacity,
            boxShadow: '0 18px 50px rgba(245,158,11,0.45)',
          }}
        >
          <div style={{fontSize: 72, fontWeight: 900, lineHeight: 1}}>98</div>
          <div style={{fontSize: 22, fontWeight: 700, letterSpacing: 3}}>SPEED</div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 210,
            left: 90,
            right: 90,
            borderRadius: 24,
            backgroundColor: '#12203E',
            border: '1px solid #24406E',
            padding: '36px 40px',
            display: 'flex',
            alignItems: 'center',
            gap: 26,
            opacity: interpolate(conv, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(conv, [0, 1], [120, 0])}px)`,
            boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
          }}
        >
          <div style={{width: 88, height: 88, borderRadius: '50%', backgroundColor: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <svg width={48} height={48} viewBox="0 0 24 24">
              <path d="M4 12.5 L9.5 18 L20 6.5" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{color: WHITE}}>
            <div style={{fontSize: 36, fontWeight: 800}}>Visitor becomes customer</div>
            <div style={{fontSize: 26, color: '#9FB2D8', marginTop: 6}}>One click. One conversion.</div>
          </div>
        </div>

        <svg width={56} height={56} viewBox="0 0 24 24" style={{position: 'absolute', left: cursorX, top: cursorY, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))'}}>
          <path d="M4 2 L4 19 L9 14.5 L12.5 21 L15.5 19.5 L12 13 L19 13 Z" fill={WHITE} stroke="#0B1026" strokeWidth="1" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
