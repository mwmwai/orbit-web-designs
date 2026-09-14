"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useMemo, Suspense } from "react";

function Floater({
  color = "#00c8ff",
  speed = 0.3,
  scale = 1,
  offset = 0,
  wire = true,
}: {
  color?: string;
  speed?: number;
  scale?: number;
  offset?: number;
  wire?: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(offset);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(scale, 1), [scale]);
  useFrame((state, dt) => {
    t.current += dt * speed;
    if (!ref.current) return;
    ref.current.rotation.x = t.current * 0.4;
    ref.current.rotation.y = t.current * 0.55;
    ref.current.position.y = Math.sin(t.current * 1.1) * 0.35;
    ref.current.position.x += ((state.pointer.x * 0.5 - ref.current.position.x) * 0.03);
  });
  return (
    <mesh ref={ref} geometry={geo}>
      {wire ? (
        <meshBasicMaterial color={color} wireframe transparent opacity={0.35} />
      ) : (
        <meshStandardMaterial color="#0b1e33" emissive={color} emissiveIntensity={0.25} roughness={0.3} metalness={0.8} transparent opacity={0.9} />
      )}
    </mesh>
  );
}

function Dust({ count = 220 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.03;
      ref.current.rotation.x += dt * 0.012;
    }
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#7fe7ff" size={0.03} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function SectionField({
  color = "#00c8ff",
  density = 220,
  opacity = 1,
}: {
  color?: string;
  density?: number;
  opacity?: number;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ opacity }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.25]} gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 4, 5]} intensity={1.2} />
          <group position={[-2.6, 0.4, 0]}>
            <Floater color={color} speed={0.35} scale={0.9} offset={0} />
          </group>
          <group position={[2.7, -0.5, -1]}>
            <Floater color={color === "#00c8ff" ? "#2f7bff" : "#00c8ff"} speed={0.25} scale={0.65} offset={2} />
          </group>
          <group position={[0, 1.4, -2.5]}>
            <Floater color="#5fe6ff" speed={0.2} scale={0.5} offset={4} />
          </group>
          <Dust count={density} />
        </Suspense>
      </Canvas>
    </div>
  );
}
