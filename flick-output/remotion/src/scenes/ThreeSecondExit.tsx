import {AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame, interpolate} from 'remotion';

const BG = '#070B1C';
const RED = '#EF4444';
const WHITE = '#F8FAFC';

export const ThreeSecondExit: React.FC<{label?: string}> = ({label = '3 SECONDS'}) => {
  const frame = useCurrentFrame();

  let digit = '3';
  if (frame >= 108) digit = '0';
  else if (frame >= 84) digit = '1';
  else if (frame >= 54) digit = '2';
  const digitPop = interpolate(frame % 30, [0, 8], [1.22, 1], {extrapolateRight: 'clamp'});
  const digitGlow = interpolate(frame % 30, [0, 20], [0.9, 0.25], {extrapolateRight: 'clamp'});

  const enterY = interpolate(frame, [0, 14], [60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const enterOpacity = interpolate(frame, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // shake on each breakage
  const s1 = frame >= 24 && frame < 34 ? Math.sin((frame - 24) * 2.2) * (10 - (frame - 24)) : 0;
  const s2 = frame >= 54 && frame < 64 ? Math.sin((frame - 54) * 2.2) * (12 - (frame - 54)) : 0;
  const s3 = frame >= 84 && frame < 94 ? Math.sin((frame - 84) * 2.2) * (14 - (frame - 84)) : 0;
  const shakeX = s1 + s3;
  const shakeY = s2;

  const shift1 = interpolate(frame, [24, 34], [0, -80], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(3))});
  const tilt1 = interpolate(frame, [24, 34], [0, -4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const overlap = interpolate(frame, [54, 64], [0, -170], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2.5))});
  const buttonShift = interpolate(frame, [84, 94], [0, 140], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(3))});
  const buttonTilt = interpolate(frame, [84, 94], [0, -11], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const exitX = interpolate(frame, [110, 120], [0, -1250], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const zoomOut = interpolate(frame, [104, 120], [1, 0.8], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const redFlash = interpolate(frame, [108, 112, 120], [0.35, 0.15, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <Sequence from={24}><Audio src={staticFile('sounds/Popups.mp3')} volume={0.85} /></Sequence>
      <Sequence from={54}><Audio src={staticFile('sounds/Popups.mp3')} volume={0.85} /></Sequence>
      <Sequence from={84}><Audio src={staticFile('sounds/Popups.mp3')} volume={0.85} /></Sequence>
      <Sequence from={108}><Audio src={staticFile('sounds/Notification.mp3')} volume={0.95} /></Sequence>

      {/* cold backdrop */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 900px 700px at 75% 20%, rgba(70,60,130,0.3), transparent 60%), radial-gradient(circle at 50% 50%, #0C1228 0%, #070B1C 78%)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, transparent 52%, rgba(0,0,0,0.6) 100%)'}} />

      <AbsoluteFill style={{transform: `scale(${zoomOut}) translate(${shakeX}px, ${shakeY}px)`}}>
        <div style={{position: 'absolute', top: 430, left: 80, right: 80, transform: `translate(${exitX}px, ${enterY}px)`, opacity: enterOpacity}}>
          <div style={{transform: `translate(${shift1}px, 0) rotate(${tilt1}deg)`}}>
            <div style={{height: 36, width: '78%', backgroundColor: '#8892B0', borderRadius: 8, marginBottom: 22}} />
            <div style={{height: 26, width: '58%', backgroundColor: '#4A5578', borderRadius: 8}} />
          </div>
          <div
            style={{
              marginTop: 40,
              height: 380,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #232A44, #171E36)',
              border: '2px dashed #3A4568',
              transform: `translateY(${overlap}px)`,
              boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
            }}
          />
          <div style={{marginTop: 46, display: 'flex'}}>
            <div
              style={{
                width: 320,
                height: 96,
                borderRadius: 16,
                background: 'linear-gradient(180deg, #98A1B5, #7A849B)',
                transform: `translate(${buttonShift}px, 0) rotate(${buttonTilt}deg)`,
                boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
              }}
            />
          </div>
        </div>

        {/* countdown */}
        <div style={{position: 'absolute', top: 160, left: 0, right: 0, textAlign: 'center'}}>
          <div style={{color: '#6B7594', fontSize: 44, fontWeight: 600, letterSpacing: 10, marginBottom: 12}}>{label}</div>
          <div
            style={{
              fontSize: 320,
              fontWeight: 900,
              lineHeight: 1,
              transform: `scale(${digitPop})`,
              color: digit === '0' ? RED : WHITE,
              textShadow:
                digit === '0'
                  ? `0 0 ${80 * digitGlow}px rgba(239,68,68,${digitGlow})`
                  : `0 0 ${90 * digitGlow}px rgba(255,255,255,${digitGlow * 0.5}), 0 10px 60px rgba(136,146,176,0.3)`,
            }}
          >
            {digit}
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{backgroundColor: RED, opacity: redFlash}} />
    </AbsoluteFill>
  );
};
