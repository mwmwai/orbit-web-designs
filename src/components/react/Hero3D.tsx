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
        opacity: 0.27,
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
        opacity: 0.2,
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
        opacity: 0.22,
        side: THREE.DoubleSide,
        wireframe: true,
        roughness: 0,
        metalness: 0.8,
      }),
    []
  );

  return (
    <group ref={ref} rotationX={-Math.PI / 3} scale={mobile ? 1 : 1.2}>
      <mesh geometry={new THREE.TorusGeometry(2.8, 0.02, 12, 72)} material={ringMaterial} />
      <mesh geometry={new THREE.TorusGeometry(2.2, 0.015, 12, 72)} material={innerMaterial} rotationZ={0.5} />
      <mesh geometry={new THREE.TorusGeometry(3.4, 0.025, 12, 72)} material={accentMaterial} rotationZ={-0.4} />
      <mesh geometry={new THREE.TorusGeometry(1.6, 0.01, 12, 72)} material={ringMaterial} rotationZ={0.8} />
    </group>
  );
}

function OrbitParticles({ mobile }: { mobile: boolean }) {
  const count = mobile ? 350 : 550;
  // All motion computed on the GPU (same math as before) — zero per-frame JS loop.
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const speeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 1.2 + Math.random() * 2.8;
      const a = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.6;
      positions[i * 3] = r * Math.cos(a) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.sin(a) * Math.cos(phi);
      sizes[i] = 0.8 + Math.random() * 2.0;
      alphas[i] = 0.15 + Math.random() * 0.5;
      speeds[i] = 0.02 + Math.random() * 0.08;
      radii[i] = r;
      angles[i] = a;
      seeds[i] = i;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    g.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    g.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return g;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          attribute float aSpeed;
          attribute float aRadius;
          attribute float aAngle;
          attribute float aSeed;
          uniform float uTime;
          varying float vAlpha;
          void main() {
            vAlpha = aAlpha;
            float angle = aAngle + uTime * aSpeed * 110.0;
            float phi = sin(uTime * aSpeed * 10.0 + aSeed) * 0.3;
            vec3 pos = vec3(
              aRadius * cos(angle) * cos(phi),
              aRadius * sin(phi),
              aRadius * sin(angle) * cos(phi)
            );
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = min(aSize * (300.0 / -mvPosition.z), 22.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(0.0, 200.0/255.0, 1.0, alpha * vAlpha * 2.3);
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
      (ref.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time.current;
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
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshPhysicalMaterial
          color={0x00c8ff}
          transparent
          opacity={0.28}
          roughness={0}
          metalness={1}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>
      <mesh ref={(el) => (refs.current[1] = el)} position={[3, -1, -3]}>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshPhysicalMaterial
          color={0x2f7bff}
          transparent
          opacity={0.23}
          roughness={0}
          metalness={1}
        />
      </mesh>
      <mesh ref={(el) => (refs.current[2] = el)} position={[-2, -2, 2.5]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshPhysicalMaterial
          color={0x5fe6ff}
          transparent
          opacity={0.19}
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
    const count = 700;
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
      <OrbitParticles mobile={mobile} />
      <AmbientOrbs />
      <StarField />
    </>
  );
}

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    // Mount 3D only after full page load + idle: text/menu/paint first, orbit fades in after.
    let idleId = 0;
    let timer = 0;
    const mount = () => setMounted(true);
    const schedule = () => {
      if ("requestIdleCallback" in window) {
        // @ts-ignore
        idleId = window.requestIdleCallback(mount, { timeout: 2000 });
      } else {
        timer = window.setTimeout(mount, 1500);
      }
    };
    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }
    return () => {
      mq.removeEventListener?.("change", update);
      // @ts-ignore
      window.cancelIdleCallback?.(idleId);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      {mounted && (
      <Canvas
        camera={{ position: [0, 0, mobile ? 10.5 : 8], fov: mobile ? 58 : 45 }}
        dpr={mobile ? [1, 1] : [1, 1.5]}
        gl={{ antialias: !mobile, alpha: true, preserveDrawingBuffer: false, powerPreference: "high-performance" }}
        style={{ touchAction: "none" }}
      >
        <Suspense fallback={null}>
          <HeroScene mobile={mobile} />
          <ScrollFade containerRef={containerRef} />
        </Suspense>
      </Canvas>
      )}
    </div>
  );
}