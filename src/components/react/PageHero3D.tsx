"use client";

import { Canvas, useFrame, extend } from "@react-three/fiber";
import { Float, Html, OrbitControls, Stars, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useMemo } from "react";
import { Suspense } from "react";

extend({ Float, Html, OrbitControls, Stars });

interface PageHero3DProps {
  variant?: "services" | "packages" | "portfolio" | "contact" | "default";
  className?: string;
}

function OrbitRings({ variant }: { variant: PageHero3DProps["variant"] }) {
  const ref = useRef<THREE.Group>(null);
  const time = useRef(0);

  const configs = useMemo(() => {
    switch (variant) {
      case "services":
        return {
          rings: 4,
          baseRadius: 2.8,
          colors: [0x00c8ff, 0x2f7bff, 0x5fe6ff, 0x00c8ff],
          speeds: [0.05, 0.07, 0.03, 0.09],
        };
      case "packages":
        return {
          rings: 3,
          baseRadius: 2.5,
          colors: [0x2f7bff, 0x00c8ff, 0x5fe6ff],
          speeds: [0.04, 0.06, 0.02],
        };
      case "portfolio":
        return {
          rings: 5,
          baseRadius: 3,
          colors: [0x5fe6ff, 0x00c8ff, 0x2f7bff, 0x5fe6ff, 0x00c8ff],
          speeds: [0.06, 0.08, 0.04, 0.1, 0.05],
        };
      case "contact":
        return {
          rings: 2,
          baseRadius: 2.2,
          colors: [0x00c8ff, 0x5fe6ff],
          speeds: [0.03, 0.05],
        };
      default:
        return {
          rings: 4,
          baseRadius: 2.8,
          colors: [0x00c8ff, 0x2f7bff, 0x5fe6ff, 0x00c8ff],
          speeds: [0.05, 0.07, 0.03, 0.09],
        };
    }
  }, [variant]);

  useFrame((_, dt) => {
    time.current += dt;
    if (ref.current) {
      ref.current.rotation.y = time.current * 0.04;
      ref.current.rotation.x = Math.sin(time.current * 0.1) * 0.12;
    }
  });

  return (
    <group ref={ref} rotationX={-Math.PI / 3.5}>
      {Array.from({ length: configs.rings }).map((_, i) => {
        const radius = configs.baseRadius + i * 0.5 - (configs.rings - 1) * 0.25;
        const opacity = 0.15 - i * 0.02;
        const wireframe = i % 2 === 0;
        return (
          <mesh
            key={i}
            geometry={new THREE.TorusGeometry(radius, 0.018, 16, 100)}
            material={
              new THREE.MeshPhysicalMaterial({
                color: configs.colors[i % configs.colors.length],
                transparent: true,
                opacity,
                side: THREE.DoubleSide,
                wireframe,
                roughness: 0,
                metalness: 1,
                clearcoat: wireframe ? 1 : 0,
                clearcoatRoughness: 0,
              })
            }
            rotationZ={i * 0.4}
          />
        );
      })}
    </group>
  );
}

function OrbitParticles({ variant }: { variant: PageHero3DProps["variant"] }) {
  const count = 600;
  const positions = useMemo(() => new Float32Array(count * 3), []);
  const sizes = useMemo(() => new Float32Array(count), []);
  const alphas = useMemo(() => new Float32Array(count), []);
  const speeds = useMemo(() => new Float32Array(count), []);
  const radii = useMemo(() => new Float32Array(count), []);
  const angles = useMemo(() => new Float32Array(count), []);
  const phis = useMemo(() => new Float32Array(count), []);

  useMemo(() => {
    for (let i = 0; i < count; i++) {
      const r = 1 + Math.random() * 3;
      const a = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.5;
      positions[i * 3] = r * Math.cos(a) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.sin(a) * Math.cos(phi);
      sizes[i] = 0.4 + Math.random() * 1.2;
      alphas[i] = 0.08 + Math.random() * 0.35;
      speeds[i] = 0.015 + Math.random() * 0.06;
      radii[i] = r;
      angles[i] = a;
      phis[i] = phi;
    }
  }, [positions, sizes, alphas, speeds, radii, angles, phis]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    g.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    g.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    g.setAttribute("aPhi", new THREE.BufferAttribute(phis, 1));
    return g;
  }, [positions, sizes, alphas, speeds, radii, angles, phis]);

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
            gl_FragColor = vec4(0.0, 200.0/255.0, 1.0, alpha * vAlpha);
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
      ref.current.rotation.y = time.current * 0.015;
      const pos = ref.current.geometry.attributes.position.array as Float32Array;
      const speed = ref.current.geometry.attributes.aSpeed.array as Float32Array;
      const radius = ref.current.geometry.attributes.aRadius.array as Float32Array;
      const angle = ref.current.geometry.attributes.aAngle.array as Float32Array;
      const phi = ref.current.geometry.attributes.aPhi.array as Float32Array;
      for (let i = 0; i < count; i++) {
        angle[i] += speed[i] * dt * 60;
        const phiOffset = Math.sin(time.current * speed[i] * 8 + i) * 0.25;
        pos[i * 3] = radius[i] * Math.cos(angle[i]) * Math.cos(phi[i] + phiOffset);
        pos[i * 3 + 1] = radius[i] * Math.sin(phi[i] + phiOffset);
        pos[i * 3 + 2] = radius[i] * Math.sin(angle[i]) * Math.cos(phi[i] + phiOffset);
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

function AmbientOrbs({ variant }: { variant: PageHero3DProps["variant"] }) {
  const time = useRef(0);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const orbConfigs = useMemo(() => {
    switch (variant) {
      case "services":
        return [
          { pos: [-3.5, 1.5, -2], size: 0.7, color: 0x00c8ff, opacity: 0.12 },
          { pos: [3, -1, -3], size: 0.5, color: 0x2f7bff, opacity: 0.1 },
          { pos: [-2, -2, 2.5], size: 0.6, color: 0x5fe6ff, opacity: 0.08 },
          { pos: [2.5, 2, 2], size: 0.4, color: 0x00c8ff, opacity: 0.06 },
        ];
      case "packages":
        return [
          { pos: [-3, 1.8, -2.5], size: 0.8, color: 0x2f7bff, opacity: 0.1 },
          { pos: [3.5, -1.2, -2], size: 0.45, color: 0x00c8ff, opacity: 0.08 },
          { pos: [-1.5, -2.2, 3], size: 0.55, color: 0x5fe6ff, opacity: 0.07 },
        ];
      case "portfolio":
        return [
          { pos: [-4, 2, -3], size: 0.9, color: 0x5fe6ff, opacity: 0.12 },
          { pos: [4, -1.5, -2.5], size: 0.5, color: 0x00c8ff, opacity: 0.09 },
          { pos: [-2.5, -2.5, 3.5], size: 0.7, color: 0x2f7bff, opacity: 0.08 },
          { pos: [3, 2.5, 2.5], size: 0.4, color: 0x5fe6ff, opacity: 0.06 },
        ];
      case "contact":
        return [
          { pos: [-3, 1.2, -2], size: 0.6, color: 0x00c8ff, opacity: 0.1 },
          { pos: [2.8, -1, -2.5], size: 0.4, color: 0x5fe6ff, opacity: 0.08 },
        ];
      default:
        return [
          { pos: [-3.5, 1.5, -2], size: 0.7, color: 0x00c8ff, opacity: 0.12 },
          { pos: [3, -1, -3], size: 0.5, color: 0x2f7bff, opacity: 0.1 },
          { pos: [-2, -2, 2.5], size: 0.6, color: 0x5fe6ff, opacity: 0.08 },
        ];
    }
  }, [variant]);

  useFrame((_, dt) => {
    time.current += dt;
    refs.current.forEach((mesh, i) => {
      if (mesh) {
        const cfg = orbConfigs[i];
        mesh.position.y = cfg.pos[1] + Math.sin(time.current * 0.25 + i) * 0.25;
        mesh.position.x = cfg.pos[0] + Math.cos(time.current * 0.18 + i * 2) * 0.18;
        mesh.rotation.y = time.current * 0.08;
      }
    });
  });

  return (
    <>
      {orbConfigs.map((cfg, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={cfg.pos}>
          <sphereGeometry args={[cfg.size, 32, 32]} />
          <meshPhysicalMaterial
            color={cfg.color}
            transparent
            opacity={cfg.opacity}
            roughness={0}
            metalness={1}
            clearcoat={1}
            clearcoatRoughness={0}
          />
        </mesh>
      ))}
    </>
  );
}

function HeroScene({ variant }: { variant: PageHero3DProps["variant"] }) {
  return (
    <>
      <ambientLight intensity={0.35} color="#5fe6ff" />
      <directionalLight position={[5, 10, 7]} intensity={1} color="#ffffff" />
      <directionalLight position={[-5, 5, -7]} intensity={0.5} color="#00c8ff" />
      <OrbitRings variant={variant} />
      <OrbitParticles variant={variant} />
      <AmbientOrbs variant={variant} />
      <Stars radius={50} opacity={0.25} color="#00c8ff" />
    </>
  );
}

export default function PageHero3D({ variant = "default", className = "" }: PageHero3DProps) {
  return (
    <div className={`absolute inset-0 -z-10 ${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        style={{ touchAction: "none" }}
      >
        <Suspense fallback={null}>
          <HeroScene variant={variant} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          autoRotate={true}
          autoRotateSpeed={0.25}
        />
      </Canvas>
    </div>
  );
}