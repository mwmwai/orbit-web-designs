"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Rings() {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (ref.current) {
      ref.current.rotation.y = t.current * 0.14;
      ref.current.rotation.x = Math.sin(t.current * 0.1) * 0.15;
    }
  });
  const mat = new THREE.MeshBasicMaterial({ color: 0x00c8ff, transparent: true, opacity: 0.25, wireframe: true });
  return (
    <group ref={ref} rotation={[-Math.PI / 3, 0, 0]}>
      <mesh geometry={new THREE.TorusGeometry(2.8, 0.02, 12, 80)} material={mat} />
      <mesh geometry={new THREE.TorusGeometry(2.2, 0.015, 12, 80)} material={mat} rotation={[0, 0, 0.5]} />
      <mesh geometry={new THREE.TorusGeometry(3.4, 0.025, 12, 80)} material={mat} rotation={[0, 0, -0.4]} />
    </group>
  );
}

function Planet() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.2;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.7, 32, 32]} />
      <meshBasicMaterial color={0x00c8ff} transparent opacity={0.35} wireframe />
    </mesh>
  );
}

export default function Orbit3D() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.25]} gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}>
        <ambientLight intensity={0.8} />
        <Rings />
        <Planet />
      </Canvas>
    </div>
  );
}
