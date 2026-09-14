"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useMemo, useState, useEffect, Suspense } from "react";

/* ---------- control: drag to rotate + scroll dolly + pointer parallax ---------- */
function CameraRig({ group }: { group: React.RefObject<THREE.Group | null> }) {
  const { camera, gl } = useThree();
  const drag = useRef({ x: 0, y: 0, tx: 0, ty: 0, down: false, lx: 0, ly: 0 });
  const scroll = useRef(0);

  useEffect(() => {
    const el = gl.domElement;
    el.style.pointerEvents = "auto";
    el.style.touchAction = "pan-y";
    const onDown = (e: PointerEvent) => {
      drag.current.down = true;
      drag.current.lx = e.clientX;
      drag.current.ly = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!drag.current.down) return;
      drag.current.tx += (e.clientX - drag.current.lx) * 0.005;
      drag.current.ty += (e.clientY - drag.current.ly) * 0.003;
      drag.current.ty = Math.max(-0.6, Math.min(0.6, drag.current.ty));
      drag.current.lx = e.clientX;
      drag.current.ly = e.clientY;
    };
    const onUp = () => (drag.current.down = false);
    const onScroll = () => {
      scroll.current = Math.min(1, window.scrollY / (window.innerHeight * 1.4));
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
    };
  }, [gl]);

  useFrame((state, dt) => {
    const d = drag.current;
    if (!d.down) {
      d.tx += dt * 0.08; // idle auto-orbit
      d.ty += ((0 - d.ty) * dt * 0.6);
    }
    d.x += (d.tx - d.x) * Math.min(1, dt * 6);
    d.y += (d.ty - d.y) * Math.min(1, dt * 6);
    if (group.current) {
      group.current.rotation.y = d.x + state.pointer.x * 0.15;
      group.current.rotation.x = d.y + state.pointer.y * 0.1;
    }
    // scroll dolly: push in + tilt down as you leave hero
    const s = scroll.current;
    const baseZ = (camera as THREE.PerspectiveCamera).userData.baseZ ?? 8;
    camera.position.z += ((baseZ - s * 2.4 - camera.position.z) * Math.min(1, dt * 3));
    camera.position.y += ((s * 1.1 - camera.position.y) * Math.min(1, dt * 3));
    camera.lookAt(0, s * 0.6, 0);
  });
  return null;
}

/* ---------- triple orbit rings ---------- */
function Rings() {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  const mats = useMemo(
    () => [
      new THREE.MeshBasicMaterial({ color: 0x00c8ff, transparent: true, opacity: 0.34, wireframe: true }),
      new THREE.MeshBasicMaterial({ color: 0x2f7bff, transparent: true, opacity: 0.26, wireframe: true }),
      new THREE.MeshBasicMaterial({ color: 0x5fe6ff, transparent: true, opacity: 0.2, wireframe: true }),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, wireframe: true }),
    ],
    []
  );
  const geos = useMemo(
    () => [
      new THREE.TorusGeometry(2.9, 0.018, 10, 110),
      new THREE.TorusGeometry(2.25, 0.014, 10, 100),
      new THREE.TorusGeometry(3.55, 0.02, 10, 110),
      new THREE.TorusGeometry(1.7, 0.01, 10, 90),
    ],
    []
  );
  useFrame((_, dt) => {
    t.current += dt;
    if (!ref.current) return;
    ref.current.rotation.z = t.current * 0.05;
    ref.current.children.forEach((c, i) => {
      c.rotation.z += dt * (i % 2 === 0 ? 0.06 : -0.045);
    });
  });
  return (
    <group ref={ref} rotation={[-Math.PI / 3, 0, 0]}>
      <mesh geometry={geos[0]} material={mats[0]} />
      <mesh geometry={geos[1]} material={mats[1]} rotation={[0, 0, 0.5]} />
      <mesh geometry={geos[2]} material={mats[2]} rotation={[0, 0, -0.4]} />
      <mesh geometry={geos[3]} material={mats[3]} rotation={[0, 0, 0.9]} />
    </group>
  );
}

/* ---------- hero knot: physical core + glow wire + inner crystal ---------- */
function CoreKnot() {
  const solid = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const t = useRef(1.7);
  const geo = useMemo(() => new THREE.TorusKnotGeometry(0.82, 0.24, 200, 28), []);
  const coreGeo = useMemo(() => new THREE.OctahedronGeometry(0.34, 0), []);
  useFrame((_, dt) => {
    t.current += dt;
    const s = 1 + Math.sin(t.current * 1.3) * 0.055;
    for (const m of [solid.current, glow.current]) {
      if (!m) continue;
      m.rotation.x = t.current * 0.28;
      m.rotation.y = t.current * 0.36;
      m.scale.setScalar(s);
    }
    if (core.current) {
      core.current.rotation.y = -t.current * 0.9;
      core.current.rotation.x = t.current * 0.5;
      core.current.scale.setScalar(1 + Math.sin(t.current * 2.2) * 0.12);
    }
  });
  return (
    <group>
      <mesh ref={solid} geometry={geo}>
        <meshPhysicalMaterial color="#06182e" roughness={0.15} metalness={1} clearcoat={1} clearcoatRoughness={0.1} emissive="#00c8ff" emissiveIntensity={0.12} />
      </mesh>
      <mesh ref={glow} geometry={geo} scale={1.004}>
        <meshBasicMaterial color="#00c8ff" wireframe transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={core} geometry={coreGeo}>
        <meshBasicMaterial color="#aef4ff" wireframe transparent opacity={0.9} />
      </mesh>
      <pointLight position={[0, 0, 0.5]} intensity={8} color="#66e9ff" distance={6} decay={2} />
    </group>
  );
}

/* ---------- orbit moons riding the rings ---------- */
function Moons() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const t = useRef(0);
  const items = useMemo(
    () => [
      { r: 2.9, s: 0.5, c: "#00c8ff" },
      { r: 2.25, s: -0.7, c: "#5fe6ff" },
      { r: 3.55, s: 0.35, c: "#2f7bff" },
    ],
    []
  );
  useFrame((_, dt) => {
    t.current += dt;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const a = t.current * items[i].s + i * 2.1;
      m.position.set(Math.cos(a) * items[i].r, Math.sin(a * 0.7) * 0.35, Math.sin(a) * items[i].r * 0.62 - 0.4);
    });
  });
  return (
    <group rotation={[-Math.PI / 3, 0, 0]}>
      {items.map((it, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
          <sphereGeometry args={[0.09, 20, 20]} />
          <meshBasicMaterial color={it.c} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- volumetric-feel particle shell ---------- */
function ParticleShell({ count = 900, warp }: { count?: number; warp: React.RefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color("#00c8ff");
    const c2 = new THREE.Color("#2f7bff");
    const c3 = new THREE.Color("#ffffff");
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.pow(Math.random(), 0.7) * 7;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      const pick = Math.random();
      const c = pick < 0.6 ? c1 : pick < 0.9 ? c2 : c3;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [count]);
  useFrame((_, dt) => {
    const w = warp.current ?? 0;
    if (ref.current) {
      ref.current.rotation.y += dt * (0.035 + w * 1.4);
      ref.current.rotation.x += dt * (0.008 + w * 0.25);
    }
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.035} vertexColors transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

/* ---------- distant star dome ---------- */
function StarDome({ warp }: { warp: React.RefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 800;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 30 + Math.random() * 22;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * (0.005 + (warp.current ?? 0) * 0.12);
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#9fd8ff" size={0.12} transparent opacity={0.7} depthWrite={false} sizeAttenuation />
    </points>
  );
}

/* ---------- nebula glow sprites (procedural, no assets) ---------- */
function Nebula() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(0,200,255,0.55)");
    g.addColorStop(0.4, "rgba(47,123,255,0.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });
  return (
    <group ref={ref}>
      {[
        { p: [-6, 2, -8] as const, s: 14 },
        { p: [7, -2, -9] as const, s: 17 },
        { p: [0, 4, -12] as const, s: 20 },
      ].map((n, i) => (
        <sprite key={i} position={[n.p[0], n.p[1], n.p[2]]} scale={[n.s, n.s, 1]}>
          <spriteMaterial map={tex} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  );
}

/* ---------- shooting stars ---------- */
function ShootingStars() {
  const group = useRef<THREE.Group>(null);
  const items = useRef(
    Array.from({ length: 4 }, () => ({
      x: (Math.random() - 0.5) * 14,
      y: 2 + Math.random() * 4,
      z: -4 - Math.random() * 4,
      v: 6 + Math.random() * 5,
      life: Math.random(),
    }))
  );
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const m = items.current[i];
      m.life -= dt * 0.35;
      m.x -= m.v * dt;
      m.y -= m.v * 0.35 * dt;
      if (m.life <= 0 || m.x < -9) {
        m.x = 5 + Math.random() * 5;
        m.y = 1.5 + Math.random() * 4;
        m.z = -4 - Math.random() * 4;
        m.v = 6 + Math.random() * 6;
        m.life = 0.6 + Math.random() * 1.4;
      }
      child.position.set(m.x, m.y, m.z);
      (child as THREE.Mesh).rotation.z = -0.35;
      const mat = ((child as THREE.Mesh).material as THREE.MeshBasicMaterial);
      mat.opacity = Math.max(0, Math.min(0.9, m.life));
    });
  });
  return (
    <group ref={group}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i}>
          <boxGeometry args={[0.9, 0.02, 0.02]} />
          <meshBasicMaterial color="#bff3ff" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- warp speed lines (click hero for warp) ---------- */
function SpeedLines({ warp }: { warp: React.RefObject<number> }) {
  const ref = useRef<THREE.LineSegments>(null);
  const geo = useMemo(() => {
    const n = 140;
    const pos = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 4;
      pos[i * 6] = Math.cos(th) * r;
      pos[i * 6 + 1] = Math.sin(th) * r * 0.6;
      pos[i * 6 + 2] = -2 - Math.random() * 4;
      pos[i * 6 + 3] = pos[i * 6] * 1.02;
      pos[i * 6 + 4] = pos[i * 6 + 1] * 1.02;
      pos[i * 6 + 5] = pos[i * 6 + 2] + 1.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const mat = useMemo(
    () => new THREE.LineBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    []
  );
  useFrame((_, dt) => {
    const w = warp.current ?? 0;
    mat.opacity += ((w > 0.25 ? 0.75 : 0) - mat.opacity) * Math.min(1, dt * 5);
    if (ref.current && w > 0.01) {
      ref.current.position.z = (ref.current.position.z + w * dt * 9) % 2;
    }
  });
  return <lineSegments ref={ref} geometry={geo} material={mat} />;
}

/* ---------- scroll fade for hero layer ---------- */
function Fade({ el }: { el: React.RefObject<HTMLDivElement | null> }) {
  useFrame(() => {
    if (!el.current) return;
    el.current.style.opacity = Math.max(0.15, 1 - window.scrollY / (window.innerHeight * 1.3)).toFixed(3);
  });
  return null;
}

export default function Orbit3DUniverse() {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<THREE.Group>(null);
  const warp = useRef(0);
  const [mobile, setMobile] = useState(false);
  const [ready, setReady] = useState(false);
  const [warping, setWarping] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    const t = window.setTimeout(() => setReady(true), 350);
    return () => {
      mq.removeEventListener?.("change", update);
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const decay = () => {
      warp.current += ((warping ? 1 : 0) - warp.current) * 0.06;
      if (worldRef.current) {
        const s = 1 + warp.current * 0.12;
        worldRef.current.scale.setScalar(s);
      }
      raf = requestAnimationFrame(decay);
    };
    raf = requestAnimationFrame(decay);
    return () => cancelAnimationFrame(raf);
  }, [warping]);

  return (
    <div
      id="o3d-warp-zone"
      ref={containerRef}
      className="absolute inset-0 cursor-pointer"
      aria-hidden="true"
      onClick={() => {
        setWarping(true);
        window.setTimeout(() => setWarping(false), 1400);
      }}
    >
      <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
        {ready && (
          <Canvas
            camera={{ position: [0, 0, mobile ? 10.5 : 8], fov: mobile ? 60 : 45 }}
            dpr={mobile ? [1, 1.25] : [1, 1.75]}
            gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
            onCreated={({ camera }) => {
              (camera as THREE.PerspectiveCamera).userData.baseZ = mobile ? 10.5 : 8;
            }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.55} color="#9fdcff" />
              <directionalLight position={[5, 8, 6]} intensity={2} color="#ffffff" />
              <directionalLight position={[-6, 3, -5]} intensity={1.1} color="#00c8ff" />
              <pointLight position={[0, 0, 4]} intensity={40} color="#00c8ff" distance={22} decay={1.8} />
              <pointLight position={[-4, -3, -2]} intensity={18} color="#2f7bff" distance={18} decay={1.8} />
              <group ref={worldRef}>
                <Rings />
                <CoreKnot />
                <Moons />
                <ParticleShell count={mobile ? 450 : 900} warp={warp} />
              </group>
              <Nebula />
              <ShootingStars />
              <SpeedLines warp={warp} />
              <StarDome warp={warp} />
              <CameraRig group={worldRef} />
              <Fade el={containerRef} />
            </Suspense>
          </Canvas>
        )}
      </div>
      {/* hint */}
      <div className="absolute bottom-6 left-0 right-0 z-10 text-center pointer-events-none">
        <p className={`font-mono text-[11px] uppercase tracking-[0.3em] transition-colors ${warping ? "text-white" : "text-cyan-100/50"}`}>
          {warping ? "⚡ warp engaged" : "drag to orbit · scroll to dive · click or press W for warp"}
        </p>
      </div>
    </div>
  );
}
