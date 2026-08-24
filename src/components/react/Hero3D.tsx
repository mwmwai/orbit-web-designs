"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import { Suspense } from "react";

function OrbitRings({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_, dt) => {
    time.current += dt;
    if (ref.current) {
      ref.current.rotation.y = time.current * 0.14;
      ref.current.rotation.x = Math.sin(time.current * 0.1) * 0.15;
    }
  });

  const ringMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x00c8ff,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        wireframe: true,
        roughness: 0,
        metalness: 1,
        clearcoat: 1,
        clearcoatRoughness: 0,
      }),
    []
  );

  const innerMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x2f7bff,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        wireframe: true,
        roughness: 0,
        metalness: 1,
      }),
    []
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x5fe6ff,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        wireframe: true,
        roughness: 0,
        metalness: 0.8,
      }),
    []
  );

  return (
    <group ref={ref} rotationX={-Math.PI / 3} scale={mobile ? 1 : 1.2}>
      <mesh geometry={new THREE.TorusGeometry(2.8, 0.02, 16, 100)} material={ringMaterial} />
      <mesh geometry={new THREE.TorusGeometry(2.2, 0.015, 16, 100)} material={innerMaterial} rotationZ={0.5} />
      <mesh geometry={new THREE.TorusGeometry(3.4, 0.025, 16, 100)} material={accentMaterial} rotationZ={-0.4} />
      <mesh geometry={new THREE.TorusGeometry(1.6, 0.01, 16, 100)} material={ringMaterial} rotationZ={0.8} />
    </group>
  );
}

function OrbitParticles() {
  const count = 550;
  const positions = useMemo(() => new Float32Array(count * 3), []);
  const sizes = useMemo(() => new Float32Array(count), []);
  const alphas = useMemo(() => new Float32Array(count), []);
  const speeds = useMemo(() => new Float32Array(count), []);
  const radii = useMemo(() => new Float32Array(count), []);
  const angles = useMemo(() => new Float32Array(count), []);

  useMemo(() => {
    for (let i = 0; i < count; i++) {
      const r = 1.2 + Math.random() * 2.8;
      const a = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.6;
      positions[i * 3] = r * Math.cos(a) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.sin(a) * Math.cos(phi);
      sizes[i] = 0.5 + Math.random() * 1.5;
      alphas[i] = 0.1 + Math.random() * 0.4;
      speeds[i] = 0.02 + Math.random() * 0.08;
      radii[i] = r;
      angles[i] = a;
    }
  }, [positions, sizes, alphas, speeds, radii, angles]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    g.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    g.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    return g;
  }, [positions, sizes, alphas, speeds, radii, angles]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          varying float vAlpha;
          void main() {
            vAlpha = aAlpha;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(0.0, 200.0/255.0, 1.0, alpha * vAlpha * 1.5);
          }
        `,
      }),
    []
  );

  const ref = useRef<THREE.Points>(null);
  const time = useRef(0);

  useFrame((_, dt) => {
    time.current += dt;
    if (ref.current) {
      ref.current.rotation.y = time.current * 0.05;
      const pos = ref.current.geometry.attributes.position.array as Float32Array;
      const speed = ref.current.geometry.attributes.aSpeed.array as Float32Array;
      const radius = ref.current.geometry.attributes.aRadius.array as Float32Array;
      const angle = ref.current.geometry.attributes.aAngle.array as Float32Array;
      for (let i = 0; i < count; i++) {
        angle[i] += speed[i] * dt * 110;
        const phi = Math.sin(time.current * speed[i] * 10 + i) * 0.3;
        pos[i * 3] = radius[i] * Math.cos(angle[i]) * Math.cos(phi);
        pos[i * 3 + 1] = radius[i] * Math.sin(phi);
        pos[i * 3 + 2] = radius[i] * Math.sin(angle[i]) * Math.cos(phi);
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

function AmbientOrbs() {
  const time = useRef(0);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, dt) => {
    time.current += dt;
    refs.current.forEach((mesh, i) => {
      if (mesh) {
        mesh.position.y = Math.sin(time.current * 0.3 + i) * 0.3;
        mesh.position.x = Math.cos(time.current * 0.2 + i * 2) * 0.2;
        mesh.rotation.y = time.current * 0.1;
      }
    });
  });

  return (
    <>
      <mesh ref={(el) => (refs.current[0] = el)} position={[-3.5, 1.5, -2]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshPhysicalMaterial
          color={0x00c8ff}
          transparent
          opacity={0.22}
          roughness={0}
          metalness={1}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>
      <mesh ref={(el) => (refs.current[1] = el)} position={[3, -1, -3]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshPhysicalMaterial
          color={0x2f7bff}
          transparent
          opacity={0.17}
          roughness={0}
          metalness={1}
        />
      </mesh>
      <mesh ref={(el) => (refs.current[2] = el)} position={[-2, -2, 2.5]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial
          color={0x5fe6ff}
          transparent
          opacity={0.14}
          roughness={0}
          metalness={0.8}
        />
      </mesh>
    </>
  );
}

function StarField() {
  const ref = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    const count = 900;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 38 + Math.random() * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: 0x9fd8ff,
        size: 0.09,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: true,
        depthWrite: false,
      }),
    []
  );

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.006;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

function ScrollFade({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  useFrame(() => {
    if (!containerRef.current) return;
    const fade = Math.max(0.25, 1 - (window.scrollY || 0) / (window.innerHeight * 1.5));
    containerRef.current.style.opacity = fade.toFixed(3);
  });
  return null;
}

function HeroScene({ mobile }: { mobile: boolean }) {
  return (
    <>
      <ambientLight intensity={0.6} color="#5fe6ff" />
      <directionalLight position={[5, 10, 7]} intensity={1.7} color="#ffffff" />
      <directionalLight position={[-5, 5, -7]} intensity={1.0} color="#00c8ff" />
      <pointLight position={[0, 0, 4]} intensity={1.5} color="#00c8ff" distance={20} decay={1.6} />
      <OrbitRings mobile={mobile} />
      <OrbitParticles />
      <AmbientOrbs />
      <StarField />
    </>
  );
}

export default function Hero3D() {
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
    <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, mobile ? 10.5 : 8], fov: mobile ? 58 : 45 }}
        dpr={mobile ? [1, 1.25] : [1, 1.5]}
        gl={{ antialias: !mobile, alpha: true, preserveDrawingBuffer: false, powerPreference: "high-performance" }}
        style={{ touchAction: "none" }}
      >
        <Suspense fallback={null}>
          <HeroScene mobile={mobile} />
          <ScrollFade containerRef={containerRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}