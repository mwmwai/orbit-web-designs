import {useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';

export const ThreeSecondExit: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  const countdown = frame < 40 ? 3 : frame < 80 ? 2 : 1;
  const countdownOpacity = interpolate(frame % 40, [0, 10, 30, 40], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
  const countdownScale = interpolate(frame % 40, [0, 10], [0.5, 1], {extrapolateRight: 'clamp'});
  
  const shatterDelay = [40, 80, 120];
  const shards = Array.from({length: 12}, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const shardFrame = frame - shatterDelay[Math.floor(i / 4)];
    const shardProgress = spring({frame: Math.max(0, shardFrame), fps, config: {damping: 15, stiffness: 80}});
    const distance = interpolate(shardProgress, [0, 1], [0, 300]);
    const rotation = interpolate(shardProgress, [0, 1], [0, 360]);
    const opacity = interpolate(shardProgress, [0, 0.3, 1], [1, 1, 0]);
    return {x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, rotation, opacity};
  });
  
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
  
  return (
    <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden'}}>
      {/* Grid lines */}
      {Array.from({length: 8}, (_, i) => (
        <div key={`h${i}`} style={{position: 'absolute', top: `${(i + 1) * 12}%`, left: 0, right: 0, height: '1px', background: 'rgba(255,191,0,0.05)'}} />
      ))}
      {Array.from({length: 5}, (_, i) => (
        <div key={`v${i}`} style={{position: 'absolute', left: `${(i + 1) * 18}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,191,0,0.05)'}} />
      ))}
      
      {/* Countdown */}
      <div style={{fontSize: '200px', fontWeight: '900', color: '#ffb700', opacity: countdownOpacity, transform: `scale(${countdownScale})`, textShadow: '0 0 60px rgba(255,183,0,0.6)', position: 'absolute'}}>
        {countdown}
      </div>
      
      {/* Shattering website */}
      {shards.map((shard, i) => (
        <div key={i} style={{position: 'absolute', width: '80px', height: '60px', background: `linear-gradient(135deg, rgba(30,30,46,0.8) 0%, rgba(45,45,61,0.8) 100%)`, border: '1px solid rgba(255,191,0,0.2)', borderRadius: '8px', transform: `translate(${shard.x}px, ${shard.y}px) rotate(${shard.rotation}deg)`, opacity: shard.opacity, left: `${30 + (i % 4) * 10}%`, top: `${40 + Math.floor(i / 4) * 8}%`}} />
      ))}
      
      {/* Title */}
      <div style={{position: 'absolute', bottom: '15%', opacity: titleOpacity, textAlign: 'center'}}>
        <div style={{fontSize: '72px', fontWeight: '900', color: '#fff', textShadow: '0 0 40px rgba(255,191,0,0.4)', letterSpacing: '8px'}}>
          3 SECONDS
        </div>
        <div style={{fontSize: '24px', color: 'rgba(255,255,255,0.5)', marginTop: '10px'}}>
          is all you get
        </div>
      </div>
    </div>
  );
};
