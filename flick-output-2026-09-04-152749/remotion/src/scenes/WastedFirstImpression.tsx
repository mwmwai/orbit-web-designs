import {useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';

export const WastedFirstImpression: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  const cursorX = interpolate(frame, [0, 30], [200, 800], {extrapolateRight: 'clamp'});
  const cursorY = interpolate(frame, [0, 30], [400, 400], {extrapolateRight: 'clamp'});
  const cursorOpacity = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  
  const websiteOpacity = interpolate(frame, [30, 45], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const websiteScale = interpolate(frame, [30, 45], [1, 0.8], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  
  const shockwave = spring({frame: frame - 45, fps, config: {damping: 10, stiffness: 100}});
  const shockwaveScale = interpolate(shockwave, [0, 1], [0, 3]);
  const shockwaveOpacity = interpolate(shockwave, [0, 1], [0.8, 0]);
  
  const titleOpacity = interpolate(frame, [60, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titleY = interpolate(frame, [60, 80], [50, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  
  return (
    <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden'}}>
      {/* Nebula background */}
      <div style={{position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,191,0,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)'}} />
      <div style={{position: 'absolute', bottom: '20%', right: '10%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,107,107,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)'}} />
      
      {/* Website mockup */}
      <div style={{opacity: websiteOpacity, transform: `scale(${websiteScale})`, width: '80%', height: '400px', background: 'linear-gradient(180deg, #1e1e2e 0%, #2d2d3d 100%)', borderRadius: '20px', border: '2px solid rgba(255,191,0,0.3)', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
        <div style={{position: 'absolute', top: '20px', left: '20px', right: '20px', height: '8px', background: 'rgba(255,191,0,0.3)', borderRadius: '4px'}} />
        <div style={{position: 'absolute', top: '40px', left: '20px', width: '60%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px'}} />
        <div style={{position: 'absolute', top: '60px', left: '20px', width: '40%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px'}} />
      </div>
      
      {/* Cursor */}
      <div style={{position: 'absolute', left: cursorX, top: cursorY, opacity: cursorOpacity, fontSize: '40px', filter: 'drop-shadow(0 0 10px rgba(255,191,0,0.5))'}}>
        ▶
      </div>
      
      {/* Shockwave */}
      {frame > 45 && (
        <div style={{position: 'absolute', width: '200px', height: '200px', border: '3px solid rgba(255,191,0,0.6)', borderRadius: '50%', transform: `scale(${shockwaveScale})`, opacity: shockwaveOpacity}} />
      )}
      
      {/* Title */}
      <div style={{opacity: titleOpacity, transform: `translateY(${titleY}px)`, marginTop: '60px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', fontWeight: '800', color: '#fff', textShadow: '0 0 30px rgba(255,191,0,0.5)', letterSpacing: '-1px'}}>
          Your first impression
        </div>
        <div style={{fontSize: '28px', color: 'rgba(255,255,255,0.6)', marginTop: '10px'}}>
          is everything
        </div>
      </div>
    </div>
  );
};
