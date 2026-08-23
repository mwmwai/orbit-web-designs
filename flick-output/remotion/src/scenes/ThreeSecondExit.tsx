import {AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';

const BG = '#0B1026';
const WHITE = '#F8FAFC';

export const ThreeSecondExit: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // countdown digit windows synced to breakage triggers
  let digit = '3';
  if (frame >= 108) digit = '0';
  else if (frame >= 84) digit = '1';
  else if (frame >= 54) digit = '2';
  const digitPop = interpolate(frame % 30, [0, 8], [1.18, 1], {extrapolateRight: 'clamp'});

  const enterY = interpolate(frame, [0, 14], [60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const enterOpacity = interpolate(frame, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // breakage one: heading shifts
  const shift1 = interpolate(frame, [24, 34], [0, -70], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(3))});
  // breakage two: image overlaps heading
  const overlap = interpolate(frame, [54, 64], [0, -160], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2.5))});
  // breakage three: button misplaces
  const buttonShift = interpolate(frame, [84, 94], [0, 130], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(3))});
  const buttonTilt = interpolate(frame, [84, 94], [0, -9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // mass slide-off at zero
  const exitX = interpolate(frame, [110, 120], [0, -1250], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const zoomOut = interpolate(frame, [104, 120], [1, 0.82], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <Sequence from={24}>
        <Audio src={staticFile('sounds/Popups.mp3')} volume={0.85} />
      </Sequence>
      <Sequence from={54}>
        <Audio src={staticFile('sounds/Popups.mp3')} volume={0.85} />
      </Sequence>
      <Sequence from={84}>
        <Audio src={staticFile('sounds/Popups.mp3')} volume={0.85} />
      </Sequence>
      <Sequence from={108}>
        <Audio src={staticFile('sounds/Notification.mp3')} volume={0.95} />
      </Sequence>

      <AbsoluteFill style={{transform: `scale(${zoomOut})`}}>
        {/* broken site */}
        <div style={{position: 'absolute', top: 420, left: 80, right: 80, transform: `translate(${exitX}px, ${enterY}px)`, opacity: enterOpacity}}>
          <div style={{transform: `translateX(${shift1}px)`}}>
            <div style={{height: 34, width: '78%', backgroundColor: '#8892B0', borderRadius: 8, marginBottom: 22}} />
            <div style={{height: 26, width: '58%', backgroundColor: '#4A5578', borderRadius: 8}} />
          </div>
          <div
            style={{
              marginTop: 40,
              height: 380,
              borderRadius: 16,
              backgroundColor: '#232A44',
              border: '2px dashed #3A4568',
              transform: `translateY(${overlap}px)`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          />
          <div style={{marginTop: 46, display: 'flex'}}>
            <div
              style={{
                width: 320,
                height: 96,
                borderRadius: 14,
                backgroundColor: '#8892B0',
                transform: `translate(${buttonShift}px, 0) rotate(${buttonTilt}deg)`,
              }}
            />
          </div>
        </div>

        {/* countdown */}
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center'}}>
          <div style={{color: '#6B7594', fontSize: 44, fontWeight: 600, letterSpacing: 8, marginBottom: 10}}>3 SECONDS</div>
          <div style={{color: WHITE, fontSize: 300, fontWeight: 900, lineHeight: 1, transform: `scale(${digitPop})`, textShadow: '0 10px 50px rgba(136,146,176,0.35)'}}>{digit}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
