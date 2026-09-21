"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import { Suspense } from "react";

function OrbitRings({ mobile }: { mobile: boolean }) {
  const outer = useRef<THREE.Group>(null);
  const mid = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const dotA = useRef<THREE.Mesh>(null);
  const dotB = useRef<THREE.Mesh>(null);
  const time = useRef(0);

  useFrame((_, dt) => {
    time.current += dt;
    const t = time.current;
    if (outer.current) {
      outer.current.rotation.y = t * 0.14;
      outer.current.rotation.x = Math.sin(t * 0.1) * 0.15;
    }
    if (mid.current) {
      mid.current.rotation.y = -t * 0.2;
      mid.current.rotation.z = Math.sin(t * 0.12) * 0.1;
    }
    if (inner.current) {
      inner.current.rotation.y = t * 0.3;
      inner.current.rotation.x = Math.cos(t * 0.09) * 0.12;
    }
    // Traveling glow dots ride the two main rings
    if (dotA.current) {
      const a = t * 0.9;
      dotA.current.position.set(Math.cos(a) * 2.8, 0, Math.sin(a) * 2.8);
    }
    if (dotB.current) {
      const b = -t * 1.2 + Math.PI;
      dotB.current.position.set(Math.cos(b) * 2.2, Math.sin(t * 0.7) * 0.3, Math.sin(b) * 2.2);
    }
  });

  const dim = (o: number) => (mobile ? o * 0.6 : o);

  const ringMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x00c8ff,
        emissive: 0x00c8ff,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: dim(0.3),
        side: THREE.DoubleSide,
        wireframe: true,
        roughness: 0,
        metalness: 1,
        clearcoat: 1,
        clearcoatRoughness: 0,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mobile]
  );

  const innerMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x8b5cf6,
        emissive: 0x7c3aed,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: dim(0.24),
        side: THREE.DoubleSide,
        wireframe: true,
        roughness: 0,
        metalness: 1,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mobile]
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x5fe6ff,
        emissive: 0x5fe6ff,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: dim(0.26),
        side: THREE.DoubleSide,
        wireframe: true,
        roughness: 0,
        metalness: 0.8,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mobile]
  );

  const faintMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x2f7bff,
        transparent: true,
        opacity: dim(0.1),
        side: THREE.DoubleSide,
        wireframe: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mobile]
  );

  const dotMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xbdf3ff,
        transparent: true,
        opacity: mobile ? 0.75 : 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [mobile]
  );

  return (
    <group rotationX={-Math.PI / 3} scale={mobile ? 0.7 : 1.2} position={mobile ? [0.4, -1.2, 0] : [0, 0, 0]}>
      <group ref={outer}>
        <mesh geometry={new THREE.TorusGeometry(2.8, 0.02, 8, 64)} material={ringMaterial} />
        <mesh geometry={new THREE.TorusGeometry(4.1, 0.012, 8, 64)} material={faintMaterial} rotationZ={0.3} />
        <mesh ref={dotA} geometry={new THREE.SphereGeometry(0.09, 12, 12)} material={dotMaterial} />
      </group>
      <group ref={mid}>
        <mesh geometry={new THREE.TorusGeometry(2.2, 0.015, 8, 64)} material={innerMaterial} rotationZ={0.5} />
        <mesh geometry={new THREE.TorusGeometry(3.4, 0.025, 8, 64)} material={accentMaterial} rotationZ={-0.4} />
        <mesh ref={dotB} geometry={new THREE.SphereGeometry(0.07, 12, 12)} material={dotMaterial} />
      </group>
      <group ref={inner}>
        <mesh geometry={new THREE.TorusGeometry(1.6, 0.01, 8, 48)} material={ringMaterial} rotationZ={0.8} />
        <mesh geometry={new THREE.TorusGeometry(1.1, 0.008, 8, 48)} material={accentMaterial} rotationZ={-0.6} />
      </group>
    </group>
  );
}

// Glowing core that anchors the whole composition
function CoreGlow({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const time = useRef(0);
  useFrame((_, dt) => {
    time.current += dt;
    if (ref.current) {
      const s = 1 + Math.sin(time.current * 1.4) * 0.08;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.42, 24, 24]} />
      <meshBasicMaterial
        color={new THREE.Color(0x9beeff)}
        transparent
        opacity={mobile ? 0.65 : 1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function OrbitParticles({ mobile }: { mobile: boolean }) {
  const count = mobile ? 120 : 280;
  // All motion computed on the GPU (same math as before) — zero per-frame JS loop.
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const speeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    const seeds = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    // Palette: cyan → ice white → violet, weighted toward cyan
    const palette = [
      [0.0, 0.82, 1.0],
      [0.0, 0.82, 1.0],
      [0.75, 0.94, 1.0],
      [0.55, 0.36, 0.96],
    ];
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = 1.2 + Math.random() * 2.8;
      const a = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.6;
      positions[i * 3] = r * Math.cos(a) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.sin(a) * Math.cos(phi);
      sizes[i] = 0.8 + Math.random() * 2.0;
      alphas[i] = 0.35 + Math.random() * 0.6;
      speeds[i] = 0.02 + Math.random() * 0.08;
      radii[i] = r;
      angles[i] = a;
      seeds[i] = Math.random() * Math.PI * 2;
      const c = palette[(Math.random() * palette.length) | 0];
      tmp.setRGB(c[0], c[1], c[2]);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    g.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    g.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
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
          attribute vec3 aColor;
          uniform float uTime;
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            // Twinkle: each particle breathes at its own phase
            float tw = 0.55 + 0.45 * sin(uTime * (0.8 + aSpeed * 22.0) + aSeed * 6.2831);
            vAlpha = aAlpha * tw;
            vColor = aColor;
            float angle = aAngle + uTime * aSpeed * 110.0;
            float phi = sin(uTime * aSpeed * 10.0 + aSeed) * 0.3;
            vec3 pos = vec3(
              aRadius * cos(angle) * cos(phi),
              aRadius * sin(phi),
              aRadius * sin(angle) * cos(phi)
            );
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = min(aSize * (300.0 / -mvPosition.z), 30.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            // Soft gaussian-ish falloff: bright core, gentle halo
            float core = 1.0 - smoothstep(0.0, 0.18, dist);
            float halo = 1.0 - smoothstep(0.0, 0.5, dist);
            float alpha = (core * 0.9 + halo * 0.35) * vAlpha * 2.45;
            gl_FragColor = vec4(vColor, alpha);
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
        <sphereGeometry args={[0.6, 16, 16]} />
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
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshPhysicalMaterial
          color={0x2f7bff}
          transparent
          opacity={0.23}
          roughness={0}
          metalness={1}
        />
      </mesh>
      <mesh ref={(el) => (refs.current[2] = el)} position={[-2, -2, 2.5]}>
        <sphereGeometry args={[0.5, 16, 16]} />
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

function StarField({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    const count = mobile ? 100 : 250;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const tint = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 38 + Math.random() * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      seed[i] = Math.random() * Math.PI * 2;
      tint[i] = Math.random(); // 0 = ice blue, 1 = warm white
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aTint", new THREE.BufferAttribute(tint, 1));
    return g;
  }, [mobile]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: mobile ? 0.7 : 0.95 } },
        vertexShader: `
          attribute float aSeed;
          attribute float aTint;
          uniform float uTime;
          varying float vTw;
          varying float vTint;
          void main() {
            vTw = 0.5 + 0.5 * sin(uTime * 1.6 + aSeed * 6.2831);
            vTint = aTint;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 2.6 * (140.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying float vTw;
          varying float vTint;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float a = (1.0 - smoothstep(0.0, 0.5, dist)) * (0.35 + 0.65 * vTw) * uOpacity;
            vec3 blue = vec3(0.62, 0.85, 1.0);
            vec3 warm = vec3(1.0, 0.97, 0.9);
            gl_FragColor = vec4(mix(blue, warm, step(0.82, vTint)), a);
          }
        `,
      }),
    [mobile]
  );

  const time = useRef(0);
  useFrame((_, dt) => {
    time.current += dt;
    if (ref.current) {
      ref.current.rotation.y += dt * 0.006;
      (ref.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time.current;
    }
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
      <ambientLight intensity={0.7} color="#5fe6ff" />
      <directionalLight position={[5, 10, 7]} intensity={1.7} color="#ffffff" />
      <directionalLight position={[-5, 5, -7]} intensity={1.0} color="#00c8ff" />
      {/* Violet rim light from behind-left: gives rings depth instead of flat cyan */}
      <directionalLight position={[-7, -3, -6]} intensity={0.9} color="#8b5cf6" />
      <pointLight position={[0, 0, 4]} intensity={1.5} color="#00c8ff" distance={20} decay={1.6} />
      {/* Warm core light so the center glows against the cool rings */}
      <pointLight position={[0, 0.4, 1.2]} intensity={mobile ? 0.85 : 1.5} color="#bdf3ff" distance={9} decay={2} />
      <CoreGlow mobile={mobile} />
      <OrbitRings mobile={mobile} />
      <OrbitParticles mobile={mobile} />
      {!mobile && <AmbientOrbs />}
      <StarField mobile={mobile} />
    </>
  );
}

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
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
        idleId = window.requestIdleCallback(mount, { timeout: 1200 });
      } else {
        timer = window.setTimeout(mount, 900);
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
      {mobile && (
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/4 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-electric/15 blur-[110px]" />
          <div className="absolute right-[-80px] top-2/3 h-[220px] w-[220px] rounded-full bg-neon/10 blur-[100px]" />
        </div>
      )}
      {mounted && !mobile && (
      <Canvas
        camera={{ position: [0, 0, mobile ? 10.5 : 8], fov: mobile ? 58 : 45 }}
        dpr={mobile ? [1, 1] : [1, 1.25]}
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