import {AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';

const BG = '#070B1C';
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
        borderRadius: 28,
        background: 'linear-gradient(160deg, rgba(28,38,68,0.95), rgba(14,20,42,0.95))',
        border: '2px solid rgba(245,158,11,0.5)',
        boxShadow: '0 26px 70px rgba(0,0,0,0.55), 0 0 50px rgba(245,158,11,0.12)',
        padding: '34px 40px',
        transform: `translateY(${interpolate(s, [0, 1], [420, 0])}px)`,
        opacity: interpolate(s, [0, 1], [0, 1]),
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16}}>
        <div style={{width: 14, height: 44, borderRadius: 7, background: `linear-gradient(180deg, #FBBF24, ${AMBER})`, boxShadow: '0 0 24px rgba(245,158,11,0.6)'}} />
        <div style={{color: AMBER, fontSize: 46, fontWeight: 900, letterSpacing: 8}}>{label}</div>
      </div>
      {children}
    </div>
  );
};

export const DesignSpeedSeo: React.FC<{location?: string}> = ({location = 'NAIROBI'}) => {
  const frame = useCurrentFrame();

  const fan = interpolate(frame, [16, 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const needle = interpolate(frame, [46, 66], [-110, 65], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
  const rankProgress = interpolate(frame, [76, 94], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const currentRank = Math.round(interpolate(rankProgress, [0, 1], [8, 1]));
  const globePulse = interpolate(frame, [95, 128], [0, 1400], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const pulseOpacity = interpolate(frame, [95, 108, 130], [0, 0.65, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const globeGlow = interpolate(frame, [95, 105], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <Sequence from={10}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.85} /></Sequence>
      <Sequence from={40}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.85} /></Sequence>
      <Sequence from={70}><Audio src={staticFile('sounds/Pop.mp3')} volume={0.85} /></Sequence>
      <Sequence from={95}><Audio src={staticFile('sounds/energy.MP3')} volume={0.9} /></Sequence>

      {/* backdrop */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 900px 700px at 80% 15%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(ellipse 900px 700px at 15% 80%, rgba(245,158,11,0.13), transparent 55%), radial-gradient(circle at 50% 50%, #0C1330 0%, #070B1C 78%)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, transparent 52%, rgba(0,0,0,0.58) 100%)'}} />

      {/* globe pulse rings */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        {[0, 0.35, 0.7].map((delay) => {
          const r = Math.max(0, globePulse - delay * 300);
          return <circle key={delay} cx={540} cy={1660} r={r} fill="none" stroke={AMBER} strokeWidth={5 - delay * 1.5} opacity={pulseOpacity * (1 - delay * 0.45)} />;
        })}
      </svg>

      {/* globe */}
      <div style={{position: 'absolute', left: 490, top: 1610, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #60A5FA, #1E3A8A)', boxShadow: `0 0 ${60 * globeGlow + 25}px rgba(96,165,250,${0.35 + globeGlow * 0.4})`, transform: `scale(${1 + globeGlow * 0.25})`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1735, textAlign: 'center', color: '#9FB2D8', fontSize: 34, fontWeight: 700, letterSpacing: 6}}>{location}</div>

      <div style={{position: 'absolute', top: 240, left: 100, display: 'flex', flexDirection: 'column', gap: 36}}>
        <Tile at={10} label="DESIGN">
          {['Aa', 'Rg', '&'].map((glyph, i) => (
            <div
              key={glyph}
              style={{
                position: 'absolute',
                top: 86 + i * -14,
                left: 60 + i * 160,
                fontSize: i === 2 ? 100 : 128,
                fontWeight: 800,
                background: `linear-gradient(160deg, #FFFFFF, #93A3CC)`,
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                transform: `rotate(${(i - 1) * (12 + fan * -10)}deg) translateY(${fan * -20}px)`,
                opacity: fan,
                textShadow: 'none',
              }}
            >
              {glyph}
            </div>
          ))}
        </Tile>

        <Tile at={40} label="SPEED">
          <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
            <svg width={340} height={190} viewBox="0 0 200 110" style={{overflow: 'visible'}}>
              <path d="M15 100 A 85 85 0 0 1 185 100" fill="none" stroke="#24406E" strokeWidth="18" strokeLinecap="round" />
              <path
                d="M15 100 A 85 85 0 0 1 185 100"
                fill="none"
                stroke={AMBER}
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray="267"
                strokeDashoffset={interpolate(frame, [46, 66], [267, 60], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
                style={{filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.6))'}}
              />
              <line x1="100" y1="100" x2={100 + 78 * Math.sin((needle * Math.PI) / 180)} y2={100 - 78 * Math.cos((needle * Math.PI) / 180)} stroke={WHITE} strokeWidth="6" strokeLinecap="round" />
              <circle cx="100" cy="100" r="10" fill={WHITE} />
            </svg>
            <div style={{color: WHITE, fontSize: 84, fontWeight: 900}}>{Math.round(interpolate(frame, [46, 66], [0, 98], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}</div>
          </div>
        </Tile>

        <Tile at={70} label="SEO">
          <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
            <div style={{width: 150, height: 150, borderRadius: 22, backgroundColor: '#1B2A4D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9FB2D8', fontSize: 68, fontWeight: 900, border: '1px solid #2C3F6E'}}>#8</div>
            <div style={{color: AMBER, fontSize: 58, textShadow: '0 0 20px rgba(245,158,11,0.5)'}}>&#8594;</div>
            <div
              style={{
                width: 190,
                height: 190,
                borderRadius: 26,
                background: 'linear-gradient(145deg, #FBBF24, #EA8A04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0B1026',
                fontSize: 88,
                fontWeight: 900,
                transform: `scale(${interpolate(rankProgress, [0, 0.9, 1], [0.7, 1.18, 1])})`,
                boxShadow: `0 0 ${50 * rankProgress}px rgba(245,158,11,${rankProgress * 0.6})`,
              }}
            >
              #{currentRank}
            </div>
          </div>
        </Tile>
      </div>
    </AbsoluteFill>
  );
};
