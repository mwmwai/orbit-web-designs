"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useMemo, Suspense } from "react";

export type ShapeKind = "knot" | "ico" | "torus" | "octa";

function MorphShape({ kind }: { kind: ShapeKind }) {
  const solid = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  const geo = useMemo(() => {
    switch (kind) {
      case "ico":
        return new THREE.IcosahedronGeometry(1.25, 1);
      case "torus":
        return new THREE.TorusGeometry(1.05, 0.38, 24, 72);
      case "octa":
        return new THREE.OctahedronGeometry(1.35, 0);
      default:
        return new THREE.TorusKnotGeometry(0.8, 0.26, 160, 24);
    }
  }, [kind]);

  useFrame((state, dt) => {
    t.current += dt;
    for (const m of [solid.current, wire.current]) {
      if (!m) continue;
      m.rotation.x = t.current * 0.3;
      m.rotation.y = t.current * 0.42;
      m.position.y = Math.sin(t.current * 1.2) * 0.12;
      m.position.x += ((state.pointer.x * 0.35 - m.position.x) * 0.05);
    }
  });

  return (
    <group>
      <mesh ref={solid} geometry={geo}>
        <meshStandardMaterial color="#0b1e33" roughness={0.25} metalness={0.9} />
      </mesh>
      <mesh ref={wire} geometry={geo} scale={1.002}>
        <meshBasicMaterial color="#00c8ff" wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function SpinParticles() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 350;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 2.4 + Math.random() * 3;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.08;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#7fe7ff" size={0.03} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function CapabilityStage3D({
  kind,
}: {
  kind: ShapeKind;
}) {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 5.2], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[4, 6, 5]} intensity={1.8} />
          <pointLight position={[0, 0, 3]} intensity={20} color="#00c8ff" distance={15} />
          <pointLight position={[-3, -2, -2]} intensity={12} color="#2f7bff" distance={15} />
          <MorphShape kind={kind} />
          <SpinParticles />
        </Suspense>
      </Canvas>
    </div>
  );
}
