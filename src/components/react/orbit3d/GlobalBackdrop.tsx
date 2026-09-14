"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useMemo, Suspense, useEffect, useState } from "react";

/* One fixed canvas behind the whole page. Scroll drives the journey:
   - rotation + vertical drift follow scroll progress
   - color grade lerps cyan -> blue -> violet -> cyan across sections */

const STOPS = ["#00c8ff", "#2f7bff", "#7c5cff", "#00c8ff"].map((c) => new THREE.Color(c));

function Galaxy() {
  const ref = useRef<THREE.Points>(null);
  const scroll = useRef(0);
  const tint = useRef(new THREE.Color("#00c8ff"));

  const geo = useMemo(() => {
    const n = 1400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // flattened disc galaxy tilted in space
      const arm = (i % 3) * ((Math.PI * 2) / 3);
      const r = 3 + Math.pow(Math.random(), 0.6) * 16;
      const spread = (Math.random() - 0.5) * (2.5 + r * 0.22);
      const a = arm + r * 0.32 + (Math.random() - 0.5) * 0.5;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = spread * 0.45;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#00c8ff",
        size: 0.05,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    []
  );

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      scroll.current = h > 0 ? Math.min(1, scrollY / h) : 0;
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  const tmp = useMemo(() => new THREE.Color(), []);
  useFrame((state, dt) => {
    const s = scroll.current;
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02 + s * Math.PI * 1.5;
      ref.current.position.y = s * 4;
      ref.current.rotation.x = 0.5 + Math.sin(s * Math.PI) * 0.25;
    }
    // grade journey across stops
    const seg = Math.min(STOPS.length - 2, Math.floor(s * (STOPS.length - 1)));
    const f = s * (STOPS.length - 1) - seg;
    tmp.copy(STOPS[seg]).lerp(STOPS[seg + 1], f);
    tint.current.lerp(tmp, Math.min(1, dt * 2));
    mat.color.copy(tint.current);
  });

  return (
    <group rotation={[0.5, 0, 0.15]}>
      <points ref={ref} geometry={geo} material={mat} />
    </group>
  );
}

function Veil() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(20,60,120,0.5)");
    g.addColorStop(0.5, "rgba(10,30,80,0.18)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = -state.clock.elapsedTime * 0.008;
  });
  return (
    <group ref={ref}>
      {[
        [-10, 3, -14, 26],
        [11, -4, -15, 30],
        [0, 8, -20, 34],
      ].map((v, i) => (
        <sprite key={i} position={[v[0], v[1], v[2]]} scale={[v[3], v[3], 1]}>
          <spriteMaterial map={tex} transparent opacity={0.55} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

export default function GlobalBackdrop() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    // mount after loader so first paint stays fast
    const t = window.setTimeout(() => setOn(true), 1100);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      {on && (
        <Canvas
          camera={{ position: [0, 1.5, 11], fov: 55 }}
          dpr={[1, 1]}
          gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        >
          <Suspense fallback={null}>
            <Galaxy />
            <Veil />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
