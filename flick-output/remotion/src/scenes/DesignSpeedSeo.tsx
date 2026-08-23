import {AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';

const BG = '#0B1026';
const AMBER = '#F59E0B';
const WHITE = '#F8FAFC';

const Tile: React.FC<{at: number; label: string; children: React.ReactNode}> = ({at, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 15, stiffness: 160}});
  return (
    <div
      style={{
        width: 880,
        height: 330,
        borderRadius: 26,
        background: 'linear-gradient(160deg, #17203B, #101730)',
        border: `2px solid rgba(245,158,11,0.45)`,
        boxShadow: '0 22px 60px rgba(0,0,0,0.5)',
        padding: '34px 40px',
        transform: `translateY(${interpolate(s, [0, 1], [420, 0])}px)`,
        opacity: interpolate(s, [0, 1], [0, 1]),
      }}
    >
      <div style={{color: AMBER, fontSize: 44, fontWeight: 900, letterSpacing: 6, marginBottom: 20}}>{label}</div>
      {children}
    </div>
  );
};

export const DesignSpeedSeo: React.FC = () => {
  const frame = useCurrentFrame();

  // DESIGN: type specimens fan out
  const fan = interpolate(frame, [16, 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  // SPEED: gauge needle sweeps high
  const needle = interpolate(frame, [46, 66], [-110, 65], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
  // SEO: rank chip climbs from 8 to 1
  const rankProgress = interpolate(frame, [76, 94], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const currentRank = Math.round(interpolate(rankProgress, [0, 1], [8, 1]));
  const globePulse = interpolate(frame, [95, 125], [0, 1080], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const pulseOpacity = interpolate(frame, [95, 105, 125], [0, 0.55, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <Sequence from={10}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.85} /></Sequence>
      <Sequence from={40}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.85} /></Sequence>
      <Sequence from={70}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.85} /></Sequence>
      <Sequence from={95}><Audio src={staticFile('sounds/energy.MP3')} volume={0.9} /></Sequence>

      {/* globe pulse rings */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        {[0, 0.35, 0.7].map((delay) => {
          const r = Math.max(0, globePulse - delay * 260);
          return <circle key={delay} cx={540} cy={1660} r={r} fill="none" stroke={AMBER} strokeWidth={4} opacity={pulseOpacity * (1 - delay * 0.5)} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: 500, top: 1624, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, #3B82F6, #1E3A8A)`, boxShadow: '0 0 50px rgba(59,130,246,0.6)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1730, textAlign: 'center', color: '#9FB2D8', fontSize: 32, fontWeight: 700, letterSpacing: 4}}>NAIROBI</div>

      <div style={{position: 'absolute', top: 250, left: 100, display: 'flex', flexDirection: 'column', gap: 36}}>
        <Tile at={10} label="DESIGN">
          {['Aa', 'Rg', '&'].map((glyph, i) => (
            <div
              key={glyph}
              style={{
                position: 'absolute',
                top: 90 + i * -14,
                left: 60 + i * 150,
                color: WHITE,
                fontSize: i === 2 ? 96 : 120,
                fontWeight: 800,
                transform: `rotate(${(i - 1) * (12 + fan * -10)}deg) translateY(${fan * -18}px)`,
                opacity: fan,
              }}
            >
              {glyph}
            </div>
          ))}
        </Tile>

        <Tile at={40} label="SPEED">
          <svg width={360} height={200} viewBox="0 0 200 110" style={{overflow: 'visible'}}>
            <path d="M15 100 A 85 85 0 0 1 185 100" fill="none" stroke="#24406E" strokeWidth="18" strokeLinecap="round" />
            <path d="M15 100 A 85 85 0 0 1 185 100" fill="none" stroke={AMBER} strokeWidth="18" strokeLinecap="round" strokeDasharray="267" strokeDashoffset={interpolate(frame, [46, 66], [267, 60], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
            <line x1="100" y1="100" x2={100 + 78 * Math.sin((needle * Math.PI) / 180)} y2={100 - 78 * Math.cos((needle * Math.PI) / 180)} stroke={WHITE} strokeWidth="6" strokeLinecap="round" />
            <circle cx="100" cy="100" r="10" fill={WHITE} />
          </svg>
          <div style={{color: WHITE, fontSize: 56, fontWeight: 900}}>{Math.round(interpolate(frame, [46, 66], [0, 98], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}</div>
        </Tile>

        <Tile at={70} label="SEO">
          <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
            <div style={{width: 140, height: 140, borderRadius: 20, backgroundColor: '#24406E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9FB2D8', fontSize: 64, fontWeight: 900}}>#{'8'}</div>
            <div style={{color: AMBER, fontSize: 54}}>&#8594;</div>
            <div style={{width: 180, height: 180, borderRadius: 24, backgroundColor: AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B1026', fontSize: 84, fontWeight: 900, transform: `scale(${interpolate(rankProgress, [0, 0.9, 1], [0.7, 1.15, 1])})`}}>
              #{currentRank}
            </div>
          </div>
        </Tile>
      </div>
    </AbsoluteFill>
  );
};
