import {useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';

export const OrbitOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  const ringCount = 4;
  const rings = Array.from({length: ringCount}, (_, i) => {
    const ringProgress = spring({frame: frame - i * 8, fps, config: {damping: 12, stiffness: 80}});
    const scale = interpolate(ringProgress, [0, 1], [0, 1 + i * 0.3]);
    const opacity = interpolate(ringProgress, [0, 0.5, 1], [0, 0.6, 0.3]);
    const rotation = interpolate(frame, [0, 150], [0, 360 + i * 90]);
    return {scale, opacity, rotation};
  });
  
  const coreGlow = interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'});
  const corePulse = interpolate(frame % 20, [0, 10, 20], [1, 1.1, 1]);
  
  const logoOpacity = interpolate(frame, [40, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const logoScale = spring({frame: frame - 40, fps, config: {damping: 10, stiffness: 100}});
  
  const taglineOpacity = interpolate(frame, [70, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const urlOpacity = interpolate(frame, [100, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  
  return (
    <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1b2a 50%, #1a1a2e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden'}}>
      {/* Starfield */}
      {Array.from({length: 30}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${1 + Math.random() * 2}px`, height: `${1 + Math.random() * 2}px`, background: 'rgba(255,255,255,0.4)', borderRadius: '50%'}} />
      ))}
      
      {/* Nebula background */}
      <div style={{position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,191,0,0.15) 0%, rgba(139,0,0,0.1) 40%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)'}} />
      
      {/* Orbital rings */}
      {rings.map((ring, i) => (
        <div key={i} style={{position: 'absolute', width: `${200 + i * 80}px`, height: `${200 + i * 80}px`, border: `2px solid rgba(255,191,0,${ring.opacity})`, borderRadius: '50%', transform: `scale(${ring.scale}) rotate(${ring.rotation}deg)`, boxShadow: `0 0 20px rgba(255,191,0,${ring.opacity * 0.5})`}} />
      ))}
      
      {/* Core glow */}
      <div style={{position: 'absolute', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(255,191,0,0.8) 0%, rgba(255,140,0,0.4) 50%, transparent 70%)', borderRadius: '50%', opacity: coreGlow, transform: `scale(${corePulse})`, filter: 'blur(10px)'}} />
      
      {/* Logo */}
      <div style={{opacity: logoOpacity, transform: `scale(${logoScale})`, textAlign: 'center', zIndex: 10}}>
        <div style={{fontSize: '72px', fontWeight: '900', color: '#ffb700', textShadow: '0 0 40px rgba(255,191,0,0.6), 0 0 80px rgba(255,191,0,0.3)', letterSpacing: '8px'}}>
          ORBIT
        </div>
        <div style={{fontSize: '28px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: '12px', marginTop: '5px'}}>
          WEB DESIGNS
        </div>
      </div>
      
      {/* Tagline */}
      <div style={{opacity: taglineOpacity, marginTop: '40px', textAlign: 'center', zIndex: 10}}>
        <div style={{fontSize: '32px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic'}}>
          Your brand, in motion.
        </div>
      </div>
      
      {/* URL */}
      <div style={{opacity: urlOpacity, marginTop: '30px', zIndex: 10}}>
        <div style={{fontSize: '24px', fontWeight: '600', color: '#ffb700', background: 'rgba(255,191,0,0.1)', padding: '12px 30px', borderRadius: '30px', border: '1px solid rgba(255,191,0,0.3)'}}>
          orbitwebdesigns.co.ke
        </div>
      </div>
    </div>
  );
};
