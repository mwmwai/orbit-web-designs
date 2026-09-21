import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig, Img, staticFile } from "remotion";

export const DemoOrbit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // 15s = 450 frames at 30fps
  const beat = (s:number)=> s*fps;

  const s1 = interpolate(frame, [beat(0), beat(2)], [0,1], { extrapolateLeft:"clamp", extrapolateRight:"clamp"});
  const s2 = interpolate(frame, [beat(3), beat(6)], [0,1], { extrapolateLeft:"clamp", extrapolateRight:"clamp"});
  const s3 = interpolate(frame, [beat(6.5), beat(10)], [0,1], { extrapolateLeft:"clamp", extrapolateRight:"clamp"});
  const s4 = interpolate(frame, [beat(11), beat(14)], [0,1], { extrapolateLeft:"clamp", extrapolateRight:"clamp"});

  const ringRot = frame * 0.6;
  const logoScale = spring({ frame: frame - beat(11), fps, config: { damping: 120, stiffness: 180 }});

  return (
    <AbsoluteFill style={{ background: "#0a0a0f", fontFamily: "Inter, system-ui, sans-serif", overflow:"hidden", justifyContent:"center", alignItems:"center" }}>
      {/* subtle glow */}
      <div style={{ position:"absolute", width: 800, height:800, borderRadius:9999, background:"radial-gradient(circle, rgba(0,200,255,0.18), transparent 70%)", top: -100, left: 140, filter:"blur(40px)"}} />
      <div style={{ position:"absolute", width: 600, height:600, borderRadius:9999, background:"radial-gradient(circle, rgba(47,123,255,0.12), transparent 70%)", bottom: 200, right: -100, filter:"blur(30px)"}} />

      {/* Scene 1: loses customers */}
      <div style={{ opacity: interpolate(s1, [0,0.3,0.7,1], [0,1,1,0]), transform:`translateY(${interpolate(s1,[0,1], [20,0])}px)`, position:"absolute", textAlign:"center", width: "80%"}}>
        <p style={{ color:"#00c8ff", fontSize:14, letterSpacing:"0.35em", fontWeight:700}}>YOUR WEBSITE</p>
        <p style={{ color:"white", fontSize:38, fontWeight:900, lineHeight:1.05, marginTop:12}}>Loses customers<br/><span style={{ color:"#5fe6ff"}}>before they read.</span></p>
        <p style={{ color:"#a0aec0", fontSize:16, marginTop:12}}>Slow. Outdated. Gone in 3 seconds.</p>
      </div>

      {/* Scene 2: 3 second countdown */}
      <div style={{ opacity: interpolate(s2, [0,0.2,0.8,1], [0,1,1,0]), position:"absolute", textAlign:"center"}}>
        <p style={{ fontSize:120, fontWeight:900, color:"white", lineHeight:1, textShadow:"0 0 40px rgba(0,200,255,0.6)"}}>{frame < beat(4.2) ? "3" : frame < beat(5) ? "2" : "1"}</p>
        <p style={{ color:"#00c8ff", fontSize:18, letterSpacing:"0.2em", fontWeight:700, marginTop:8}}>SECONDS TO DECIDE</p>
      </div>

      {/* Scene 3: Orbit builds fast */}
      <div style={{ opacity: interpolate(s3, [0,0.25,0.85,1], [0,1,1,0]), position:"absolute", textAlign:"center", width:"84%"}}>
        <div style={{ position:"relative", width:280, height:280, margin:"0 auto"}}>
          <div style={{ position:"absolute", inset:0, border:"1px solid rgba(0,200,255,0.25)", borderRadius:"50%", transform:`rotate(${ringRot}deg)`}} />
          <div style={{ position:"absolute", inset:18, border:"1px solid rgba(95,230,255,0.18)", borderRadius:"50%", transform:`rotate(${-ringRot*0.7}deg)`}} />
          <Img src={staticFile("logo-mark.png")} style={{ position:"absolute", width:90, height:90, left:"50%", top:"50%", transform:"translate(-50%,-50%)", filter:"drop-shadow(0 0 20px rgba(0,200,255,0.6))"}} />
        </div>
        <p style={{ color:"white", fontSize:32, fontWeight:900, marginTop:18, lineHeight:1.1}}>We build fast,<br/><span style={{ background:"linear-gradient(90deg,#00c8ff,#2f7bff)", WebkitBackgroundClip:"text", color:"transparent"}}>modern sites</span></p>
        <p style={{ color:"#7fe9ff", fontSize:14, marginTop:8, background:"rgba(0,200,255,0.08)", display:"inline-block", padding:"6px 14px", borderRadius:999, border:"1px solid rgba(0,200,255,0.2)"}}>M-Pesa · 95 Speed · Turns visits → KES</p>
      </div>

      {/* Scene 4: CTA */}
      <div style={{ opacity: s4, transform:`scale(${interpolate(logoScale,[0,1],[0.92,1])})`, position:"absolute", textAlign:"center", width:"86%"}}>
        <Img src={staticFile("logo-mark.png")} style={{ width:72, height:72, margin:"0 auto", display:"block"}} />
        <p style={{ color:"white", fontSize:26, fontWeight:900, letterSpacing:"0.28em", marginTop:14}}>ORBIT</p>
        <p style={{ color:"#6b7280", fontSize:10, letterSpacing:"0.28em", fontWeight:700, marginTop:4}}>WEB DESIGNS <span style={{color:"#00c8ff"}}>&</span> MARKETING</p>
        <p style={{ color:"white", fontSize:18, fontWeight:700, marginTop:20, background:"linear-gradient(90deg,#00c8ff,#2f7bff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" as any}}>orbitwebdesigns.co.ke</p>
        <p style={{ color:"#a0aec0", fontSize:12, marginTop:8}}>Live in days · M-Pesa ready · WhatsApp in minutes</p>
      </div>

      {/* bottom safe area */}
      <div style={{ position:"absolute", bottom:40, left:0, right:0, textAlign:"center"}}>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:10, letterSpacing:"0.18em"}}>9:16 · 15s DEMO · NOT FINAL</p>
      </div>
    </AbsoluteFill>
  );
};
