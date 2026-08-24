"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useMemo, useEffect, useState } from "react";
import { Suspense } from "react";

/* Persistent solar system behind the whole site.
   Mounted once in Layout with transition:persist — never remounts on navigation.
   Mobile-aware: fewer particles, wider camera, no mouse parallax on touch. */

const PALETTE = [0x00c8ff, 0x2f7bff, 0x5fe6ff, 0x00ffff, 0x4f7dff, 0x8fb8ff];

interface PlanetDef {
  radius: number;
  size: number;
  speed: number;
  phase: number;
  color: number;
  ringed?: boolean;
}

function Sun() {
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    if (core.current) core.current.scale.setScalar(1 + Math.sin(t.current * 1.4) * 0.06);
    if (halo.current) halo.current.scale.setScalar(1.6 + Math.sin(t.current * 1.4 + 1) * 0.12);
  });

  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[0.42, 48, 48]} />
        <meshBasicMaterial color={0xbfefff} />
      </mesh>
      <mesh ref={halo} scale={1.6}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color={0x00c8ff} transparent opacity={0.1} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh scale={2.6}>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshBasicMaterial color={0x00c8ff} transparent opacity={0.045} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Planet({ def }: { def: PlanetDef }) {
  const mesh = useRef<THREE.Mesh>(null);
  const a = useRef(def.phase);

  useFrame((_, dt) => {
    a.current += def.speed * dt;
    if (mesh.current) {
      mesh.current.position.set(Math.cos(a.current) * def.radius, 0, Math.sin(a.current) * def.radius);
      mesh.current.rotation.y += dt * 0.5;
    }
  });

  return (
    <mesh ref={mesh} position={[def.radius, 0, 0]}>
      <sphereGeometry args={[def.size, 20, 20]} />
      <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.35} roughness={0.4} metalness={0.6} />
    </mesh>
  );
}

function RingedPlanet({ def }: { def: PlanetDef }) {
  const group = useRef<THREE.Group>(null);
  const a = useRef(def.phase);

  useFrame((_, dt) => {
    a.current += def.speed * dt;
    if (group.current) {
      group.current.position.set(Math.cos(a.current) * def.radius, 0, Math.sin(a.current) * def.radius);
    }
  });

  return (
    <group ref={group} position={[def.radius, 0, 0]} rotation={[0.45, 0, 0.2]}>
      <mesh>
        <sphereGeometry args={[def.size, 20, 20]} />
        <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.3} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[def.size * 1.9, def.size * 0.12, 8, 40]} />
        <meshBasicMaterial color={0x8fd8ff} transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function AsteroidBelt({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.55 + Math.random() * 0.75;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: 0x6fb8d8,
        size: 0.02,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  );

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.02;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

function Comet({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt * 0.12;
    if (ref.current) {
      const a = t.current;
      const r = 6.2;
      ref.current.position.set(Math.cos(a) * r * 1.3, Math.sin(a * 0.7) * 1.4, Math.sin(a) * r);
      ref.current.rotation.y = -a;
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={0xdffaff} />
      </mesh>
      <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.045, mobile ? 0.9 : 1.4, 12]} />
        <meshBasicMaterial color={0x9fe8ff} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Scene({ containerRef, mobile }: { containerRef: React.RefObject<HTMLDivElement | null>; mobile: boolean }) {
  const parallax = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const eased = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (mobile) return;
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mobile]);

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 3);
    eased.current.x += (mouse.current.x - eased.current.x) * k;
    eased.current.y += (mouse.current.y - eased.current.y) * k;

    if (parallax.current) {
      parallax.current.rotation.y = eased.current.x * 0.07;
      parallax.current.rotation.x = -0.42 + eased.current.y * 0.05;
    }
    if (spinner.current) {
      spinner.current.rotation.y += dt * 0.012 + (window.scrollY || 0) * 0.00002;
    }
    if (containerRef.current) {
      const fade = Math.max(0.35, 1 - (window.scrollY || 0) / (innerHeight * 1.4));
      containerRef.current.style.opacity = fade.toFixed(3);
    }
  });

  const planets = useMemo<PlanetDef[]>(
    () => [
      { radius: 1.35, size: 0.07, speed: 0.5, phase: 0.4, color: PALETTE[0] },
      { radius: 1.95, size: 0.11, speed: 0.34, phase: 2.4, color: PALETTE[1] },
      { radius: 2.6, size: 0.14, speed: 0.24, phase: 4.4, color: PALETTE[2] },
      { radius: 3.2, size: 0.1, speed: 0.18, phase: 1.2, color: PALETTE[3] },
      { radius: 4.6, size: 0.16, speed: 0.11, phase: 3.3, color: PALETTE[4], ringed: true },
      { radius: 5.4, size: 0.12, speed: 0.08, phase: 5.5, color: PALETTE[5] },
    ],
    []
  );

  const orbitDefs = [
    { radius: 1.35, opacity: 0.14, tiltX: 0.05, tiltZ: 0.02 },
    { radius: 1.95, opacity: 0.12, tiltX: -0.08, tiltZ: 0.06 },
    { radius: 2.6, opacity: 0.11, tiltX: 0.1, tiltZ: -0.05 },
    { radius: 3.2, opacity: 0.09, tiltX: -0.05, tiltZ: 0.1 },
    { radius: 4.6, opacity: 0.08, tiltX: 0.07, tiltZ: -0.08 },
    { radius: 5.4, opacity: 0.07, tiltX: -0.1, tiltZ: 0.04 },
  ];

  return (
    <>
      <group ref={parallax} rotation={[-0.42, 0, 0]}>
        <group ref={spinner}>
          <Sun />
          {orbitDefs.map((o, i) => (
            <mesh key={i} rotation={[Math.PI / 2 + o.tiltX, 0, o.tiltZ]}>
              <torusGeometry args={[o.radius, 0.006, 8, 128]} />
              <meshBasicMaterial color={0x38b6ff} transparent opacity={o.opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          ))}
          {planets.map((p, i) =>
            p.ringed ? <RingedPlanet key={i} def={p} /> : <Planet key={i} def={p} />
          )}
          <AsteroidBelt count={mobile ? 220 : 420} />
        </group>
      </group>
      <Comet mobile={mobile} />
      <Stars radius={60} depth={40} count={mobile ? 700 : 1400} factor={3.2} saturation={0} fade speed={0.6} />
      <ambientLight intensity={0.5} color="#9fd8ff" />
      <pointLight position={[0, 0, 0]} intensity={2.2} color="#bfefff" distance={14} decay={1.6} />
      <directionalLight position={[6, 8, 6]} intensity={0.7} color="#ffffff" />
    </>
  );
}

export default function SolarSystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.6, mobile ? 11 : 9], fov: mobile ? 58 : 50 }}
        dpr={mobile ? [1, 1.25] : [1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ touchAction: "none" }}
      >
        <Suspense fallback={null}>
          <Scene containerRef={containerRef} mobile={mobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}