import {useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';

export const DesignSpeedSeo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  const barCount = 8;
  const bars = Array.from({length: barCount}, (_, i) => {
    const barProgress = spring({frame: frame - i * 5, fps, config: {damping: 15, stiffness: 80}});
    const height = interpolate(barProgress, [0, 1], [0, 200 + Math.random() * 300]);
    return height;
  });
  
  const pinDrop = spring({frame: frame - 30, fps, config: {damping: 10, stiffness: 100}});
  const pinY = interpolate(pinDrop, [0, 1], [-200, 0]);
  const pinBounce = spring({frame: frame - 45, fps, config: {damping: 8, stiffness: 200}});
  const pinScale = interpolate(pinBounce, [0, 1], [1.3, 1]);
  
  const trailOpacity = interpolate(frame, [20, 40], [0, 0.6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  
  const titleOpacity = interpolate(frame, [60, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titleScale = spring({frame: frame - 60, fps, config: {damping: 12, stiffness: 100}});
  
  return (
    <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden'}}>
      {/* Speed light trails */}
      {Array.from({length: 5}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: `${15 + i * 18}%`, top: 0, bottom: 0, width: '2px', background: `linear-gradient(180deg, transparent 0%, rgba(255,191,0,${trailOpacity * (0.3 + i * 0.1)}) 50%, transparent 100%)`}} />
      ))}
      
      {/* Rising bars */}
      <div style={{position: 'absolute', bottom: '25%', left: '10%', right: '10%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '400px'}}>
        {bars.map((height, i) => (
          <div key={i} style={{width: '60px', height: `${height}px`, background: `linear-gradient(180deg, rgba(255,191,0,0.8) 0%, rgba(255,140,0,0.4) 100%)`, borderRadius: '8px 8px 0 0', boxShadow: '0 0 20px rgba(255,191,0,0.3)'}} />
        ))}
      </div>
      
      {/* Map pin */}
      <div style={{position: 'absolute', top: '20%', left: '50%', transform: `translate(-50%, ${pinY}px) scale(${pinScale})`}}>
        <div style={{fontSize: '80px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'}}>
          📍
        </div>
        <div style={{textAlign: 'center', fontSize: '24px', fontWeight: '700', color: '#ffb700', marginTop: '-10px', textShadow: '0 0 20px rgba(255,191,0,0.5)'}}>
          NAIROBI
        </div>
      </div>
      
      {/* Title */}
      <div style={{position: 'absolute', bottom: '8%', opacity: titleOpacity, transform: `scale(${titleScale})`, textAlign: 'center'}}>
        <div style={{fontSize: '36px', fontWeight: '700', color: '#fff', textShadow: '0 0 30px rgba(255,191,0,0.4)'}}>
          Trusted by businesses
        </div>
        <div style={{fontSize: '28px', color: 'rgba(255,255,255,0.6)', marginTop: '5px'}}>
          across Nairobi and beyond
        </div>
      </div>
    </div>
  );
};
