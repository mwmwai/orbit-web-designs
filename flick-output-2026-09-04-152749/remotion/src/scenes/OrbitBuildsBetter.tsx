import {useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';

export const OrbitBuildsBetter: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  const codeLines = ['const website = {', '  design: "modern",', '  speed: "blazing",', '  seo: "optimized",', '  conversion: "maximized"', '};'];
  
  const codeProgress = interpolate(frame, [0, 90], [0, codeLines.length], {extrapolateRight: 'clamp'});
  
  const uiOpacity = interpolate(frame, [60, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const uiScale = spring({frame: frame - 60, fps, config: {damping: 12, stiffness: 100}});
  
  const buttonPulse = interpolate(frame % 30, [0, 15, 30], [1, 1.05, 1]);
  
  const titleOpacity = interpolate(frame, [100, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  
  return (
    <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden'}}>
      {/* Accent glow */}
      <div style={{position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,191,0,0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)'}} />
      
      {/* Code editor */}
      <div style={{width: '85%', background: 'rgba(0,0,0,0.6)', borderRadius: '16px', border: '1px solid rgba(255,191,0,0.2)', padding: '30px', marginBottom: '40px'}}>
        {codeLines.map((line, i) => {
          const lineOpacity = interpolate(codeProgress, [i, i + 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div key={i} style={{opacity: lineOpacity, fontSize: '28px', color: i === 0 || i === 5 ? '#ffb700' : 'rgba(255,255,255,0.8)', fontFamily: 'monospace', marginBottom: '8px', transform: `translateX(${interpolate(lineOpacity, [0, 1], [20, 0])}px)`}}>
              {line}
            </div>
          );
        })}
      </div>
      
      {/* Website UI mockup */}
      <div style={{opacity: uiOpacity, transform: `scale(${uiScale})`, width: '80%', background: 'linear-gradient(180deg, #1e1e2e 0%, #2d2d3d 100%)', borderRadius: '20px', border: '2px solid rgba(255,191,0,0.3)', padding: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
        <div style={{fontSize: '36px', fontWeight: '700', color: '#fff', marginBottom: '15px'}}>Websites that work.</div>
        <div style={{fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px'}}>Fast. Modern. Optimized.</div>
        <div style={{transform: `scale(${buttonPulse})`, display: 'inline-block', background: 'linear-gradient(135deg, #ffb700 0%, #ff8c00 100%)', padding: '15px 40px', borderRadius: '30px', fontSize: '20px', fontWeight: '600', color: '#000'}}>
          Get started
        </div>
      </div>
      
      {/* Title */}
      <div style={{position: 'absolute', bottom: '10%', opacity: titleOpacity, textAlign: 'center'}}>
        <div style={{fontSize: '64px', fontWeight: '900', color: '#ffb700', textShadow: '0 0 40px rgba(255,191,0,0.5)', letterSpacing: '12px'}}>
          ORBIT
        </div>
      </div>
    </div>
  );
};
