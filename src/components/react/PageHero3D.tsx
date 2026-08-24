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
          rings: 5,
          baseRadius: 2.6,
          colors: [0x00ffff, 0x00c8ff, 0x5fe6ff, 0x2f7bff, 0x00ffff],
          speeds: [0.06, 0.08, 0.04, 0.1, 0.05],
        };
      case "packages":
        return {
          rings: 4,
          baseRadius: 2.4,
          colors: [0x2f7bff, 0x00ffff, 0x5fe6ff, 0x00c8ff],
          speeds: [0.05, 0.07, 0.03, 0.09],
        };
      case "portfolio":
        return {
          rings: 6,
          baseRadius: 2.8,
          colors: [0x5fe6ff, 0x00ffff, 0x00c8ff, 0x2f7bff, 0x5fe6ff, 0x00ffff],
          speeds: [0.07, 0.09, 0.05, 0.11, 0.06, 0.08],
        };
      case "contact":
        return {
          rings: 3,
          baseRadius: 2.2,
          colors: [0x00ffff, 0x5fe6ff, 0x00c8ff],
          speeds: [0.04, 0.06, 0.03],
        };
      default:
        return {
          rings: 5,
          baseRadius: 2.6,
          colors: [0x00ffff, 0x00c8ff, 0x5fe6ff, 0x2f7bff, 0x00ffff],
          speeds: [0.06, 0.08, 0.04, 0.1, 0.05],
        };
    }
  }, [variant]);

  useFrame((_, dt) => {
    time.current += dt;
    if (ref.current) {
      ref.current.rotation.y = time.current * 0.05;
      ref.current.rotation.x = Math.sin(time.current * 0.1) * 0.15;
    }
  });

  return (
    <group ref={ref} rotationX={-Math.PI / 3.2}>
      {Array.from({ length: configs.rings }).map((_, i) => {
        const radius = configs.baseRadius + i * 0.45 - (configs.rings - 1) * 0.22;
        const opacity = 0.35 - i * 0.04;
        const wireframe = i % 2 === 0;
        const tube = wireframe ? 0.02 : 0.015;
        return (
          <mesh
            key={i}
            geometry={new THREE.TorusGeometry(radius, tube, 24, 120)}
            material={
              new THREE.MeshPhysicalMaterial({
                color: configs.colors[i % configs.colors.length],
                transparent: true,
                opacity,
                side: THREE.DoubleSide,
                wireframe,
                roughness: 0,
                metalness: 1,
                clearcoat: wireframe ? 1 : 0.5,
                clearcoatRoughness: 0,
                emissive: configs.colors[i % configs.colors.length],
                emissiveIntensity: wireframe ? 0.15 : 0.08,
              })
            }
            rotationZ={i * 0.35}
          />
        );
      })}
    </group>
  );
}

function OrbitParticles({ variant }: { variant: PageHero3DProps["variant"] }) {
  const count = variant === "portfolio" ? 1200 : 900;
  const positions = useMemo(() => new Float32Array(count * 3), []);
  const sizes = useMemo(() => new Float32Array(count), []);
  const alphas = useMemo(() => new Float32Array(count), []);
  const speeds = useMemo(() => new Float32Array(count), []);
  const radii = useMemo(() => new Float32Array(count), []);
  const angles = useMemo(() => new Float32Array(count), []);
  const phis = useMemo(() => new Float32Array(count), []);
  const colorMix = useMemo(() => new Float32Array(count), []);

  useMemo(() => {
    for (let i = 0; i < count; i++) {
      const r = 0.8 + Math.random() * 3.5;
      const a = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.6;
      positions[i * 3] = r * Math.cos(a) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.sin(a) * Math.cos(phi);
      sizes[i] = 0.8 + Math.random() * 2.0;
      alphas[i] = 0.25 + Math.random() * 0.5;
      speeds[i] = 0.02 + Math.random() * 0.08;
      radii[i] = r;
      angles[i] = a;
      phis[i] = phi;
      colorMix[i] = Math.random();
    }
  }, [positions, sizes, alphas, speeds, radii, angles, phis, colorMix]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    g.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    g.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    g.setAttribute("aPhi", new THREE.BufferAttribute(phis, 1));
    g.setAttribute("aColorMix", new THREE.BufferAttribute(colorMix, 1));
    return g;
  }, [positions, sizes, alphas, speeds, radii, angles, phis, colorMix]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          attribute float aColorMix;
          varying float vAlpha;
          varying float vColorMix;
          void main() {
            vAlpha = aAlpha;
            vColorMix = aColorMix;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (400.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          varying float vColorMix;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            vec3 color1 = vec3(0.0, 1.0, 1.0);
            vec3 color2 = vec3(0.18, 0.48, 1.0);
            vec3 color3 = vec3(0.37, 0.9, 1.0);
            vec3 color = mix(color1, color2, vColorMix);
            color = mix(color, color3, sin(vColorMix * 3.14159));
            gl_FragColor = vec4(color, alpha * vAlpha * 1.5);
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
      ref.current.rotation.y = time.current * 0.012;
      ref.current.rotation.x = Math.sin(time.current * 0.05) * 0.05;
      const pos = ref.current.geometry.attributes.position.array as Float32Array;
      const speed = ref.current.geometry.attributes.aSpeed.array as Float32Array;
      const radius = ref.current.geometry.attributes.aRadius.array as Float32Array;
      const angle = ref.current.geometry.attributes.aAngle.array as Float32Array;
      const phi = ref.current.geometry.attributes.aPhi.array as Float32Array;
      for (let i = 0; i < count; i++) {
        angle[i] += speed[i] * dt * 60;
        const phiOffset = Math.sin(time.current * speed[i] * 6 + i) * 0.3;
        pos[i * 3] = radius[i] * Math.cos(angle[i]) * Math.cos(phi[i] + phiOffset);
        pos[i * 3 + 1] = radius[i] * Math.sin(phi[i] + phiOffset);
        pos[i * 3 + 2] = radius[i] * Math.sin(angle[i]) * Math.cos(phi[i] + phiOffset);
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

function CoreGlow({ variant }: { variant: PageHero3DProps["variant"] }) {
  const time = useRef(0);
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    time.current += dt;
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(time.current * 1.2) * 0.12);
      ref.current.rotation.y = time.current * 0.08;
      ref.current.rotation.x = time.current * 0.05;
    }
  });

  const coreColors = useMemo(() => {
    switch (variant) {
      case "services": return [0x00ffff, 0x00c8ff];
      case "packages": return [0x2f7bff, 0x5fe6ff];
      case "portfolio": return [0x5fe6ff, 0x00ffff];
      case "contact": return [0x00c8ff, 0x5fe6ff];
      default: return [0x00ffff, 0x00c8ff];
    }
  }, [variant]);

  return (
    <group>
      <mesh ref={ref} position={[0, 0, 0]}>
        <sphereGeometry args={[0.6, 48, 48]} />
        <meshPhysicalMaterial
          color={coreColors[0]}
          transparent
          opacity={0.25}
          roughness={0}
          metalness={1}
          clearcoat={1}
          clearcoatRoughness={0}
          emissive={coreColors[0]}
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh
        position={[0, 0, 0]}
        scale={1.4}
      >
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshPhysicalMaterial
          color={coreColors[1]}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          roughness={0}
          metalness={1}
          emissive={coreColors[1]}
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh
        position={[0, 0, 0]}
        scale={2.2}
      >
        <sphereGeometry args={[1.0, 24, 24]} />
        <meshBasicMaterial
          color={coreColors[0]}
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function AmbientOrbs({ variant }: { variant: PageHero3DProps["variant"] }) {
  const time = useRef(0);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const orbConfigs = useMemo(() => {
    switch (variant) {
      case "services":
        return [
          { pos: [-4, 2, -2.5], size: 0.9, color: 0x00ffff, opacity: 0.2, emissive: 0.4 },
          { pos: [3.5, -1.5, -3], size: 0.6, color: 0x00c8ff, opacity: 0.18, emissive: 0.3 },
          { pos: [-2.5, -2.5, 3], size: 0.75, color: 0x5fe6ff, opacity: 0.15, emissive: 0.25 },
          { pos: [3, 2.5, 2.5], size: 0.5, color: 0x00ffff, opacity: 0.12, emissive: 0.2 },
          { pos: [-1.5, 3, -1], size: 0.45, color: 0x2f7bff, opacity: 0.1, emissive: 0.15 },
        ];
      case "packages":
        return [
          { pos: [-3.5, 2, -3], size: 1.0, color: 0x2f7bff, opacity: 0.18, emissive: 0.35 },
          { pos: [4, -1.5, -2.5], size: 0.55, color: 0x00ffff, opacity: 0.14, emissive: 0.25 },
          { pos: [-2, -2.8, 3.5], size: 0.7, color: 0x5fe6ff, opacity: 0.12, emissive: 0.2 },
          { pos: [2.5, 2.8, 2.8], size: 0.45, color: 0x00c8ff, opacity: 0.1, emissive: 0.15 },
        ];
      case "portfolio":
        return [
          { pos: [-4.5, 2.5, -3.5], size: 1.1, color: 0x5fe6ff, opacity: 0.22, emissive: 0.45 },
          { pos: [4.5, -2, -3], size: 0.6, color: 0x00ffff, opacity: 0.16, emissive: 0.3 },
          { pos: [-3, -3, 4], size: 0.85, color: 0x2f7bff, opacity: 0.14, emissive: 0.25 },
          { pos: [3.5, 3, 3], size: 0.5, color: 0x00ffff, opacity: 0.1, emissive: 0.2 },
          { pos: [-2, 3.5, -1.5], size: 0.5, color: 0x5fe6ff, opacity: 0.1, emissive: 0.18 },
          { pos: [3, -2.5, 2], size: 0.4, color: 0x00c8ff, opacity: 0.08, emissive: 0.12 },
        ];
      case "contact":
        return [
          { pos: [-3.5, 1.5, -2.5], size: 0.8, color: 0x00ffff, opacity: 0.18, emissive: 0.3 },
          { pos: [3.2, -1.2, -2.8], size: 0.5, color: 0x5fe6ff, opacity: 0.12, emissive: 0.2 },
        ];
      default:
        return [
          { pos: [-4, 2, -2.5], size: 0.9, color: 0x00ffff, opacity: 0.2, emissive: 0.4 },
          { pos: [3.5, -1.5, -3], size: 0.6, color: 0x00c8ff, opacity: 0.18, emissive: 0.3 },
          { pos: [-2.5, -2.5, 3], size: 0.75, color: 0x5fe6ff, opacity: 0.15, emissive: 0.25 },
          { pos: [3, 2.5, 2.5], size: 0.5, color: 0x00ffff, opacity: 0.12, emissive: 0.2 },
        ];
    }
  }, [variant]);

  useFrame((_, dt) => {
    time.current += dt;
    refs.current.forEach((mesh, i) => {
      if (mesh) {
        const cfg = orbConfigs[i];
        mesh.position.y = cfg.pos[1] + Math.sin(time.current * 0.3 + i) * 0.35;
        mesh.position.x = cfg.pos[0] + Math.cos(time.current * 0.22 + i * 2) * 0.25;
        mesh.position.z = cfg.pos[2] + Math.sin(time.current * 0.18 + i) * 0.2;
        mesh.rotation.y = time.current * 0.1;
        mesh.rotation.z = time.current * 0.06;
      }
    });
  });

  return (
    <>
      {orbConfigs.map((cfg, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={cfg.pos}>
          <sphereGeometry args={[cfg.size, 48, 48]} />
          <meshPhysicalMaterial
            color={cfg.color}
            transparent
            opacity={cfg.opacity}
            roughness={0}
            metalness={1}
            clearcoat={1}
            clearcoatRoughness={0}
            emissive={cfg.color}
            emissiveIntensity={cfg.emissive}
          />
        </mesh>
      ))}
    </>
  );
}

function HeroScene({ variant }: { variant: PageHero3DProps["variant"] }) {
  const coreColors = useMemo(() => {
    switch (variant) {
      case "services": return 0x00ffff;
      case "packages": return 0x2f7bff;
      case "portfolio": return 0x5fe6ff;
      case "contact": return 0x00c8ff;
      default: return 0x00ffff;
    }
  }, [variant]);

  return (
    <>
      <ambientLight intensity={0.6} color="#8fe6ff" />
      <directionalLight position={[8, 15, 10]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-8, 10, -10]} intensity={1.5} color={coreColors} />
      <pointLight position={[0, 5, 5]} intensity={1.2} color={coreColors} distance={20} decay={1.5} />
      <pointLight position={[0, -5, -5]} intensity={0.8} color="#5fe6ff" distance={20} decay={1.5} />
      <CoreGlow variant={variant} />
      <OrbitRings variant={variant} />
      <OrbitParticles variant={variant} />
      <AmbientOrbs variant={variant} />
      <Stars radius={60} opacity={0.4} color="#00ffff" />
    </>
  );
}

export default function PageHero3D({ variant = "default", className = "" }: PageHero3DProps) {
  return (
    <div className={`absolute inset-0 -z-10 ${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 50 }}
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
          autoRotateSpeed={0.35}
        />
      </Canvas>
    </div>
  );
}