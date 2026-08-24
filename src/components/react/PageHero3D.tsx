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

/* ===========================================
   HOME / DEFAULT — SOLAR SYSTEM ORBIT
   Bright core, multiple orbital rings, particle field
   =========================================== */
function DefaultScene() {
  const time = useRef(0);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Core pulse
  useFrame((_, dt) => {
    time.current += dt;
    if (coreRef.current) {
      coreRef.current.scale.setScalar(1 + Math.sin(time.current * 1.5) * 0.15);
      coreRef.current.rotation.y = time.current * 0.12;
      coreRef.current.rotation.x = time.current * 0.07;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y = time.current * 0.035;
      ringsRef.current.rotation.x = Math.sin(time.current * 0.08) * 0.18;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time.current * 0.008;
      const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const speed = particlesRef.current.geometry.attributes.aSpeed.array as Float32Array;
      const radius = particlesRef.current.geometry.attributes.aRadius.array as Float32Array;
      const angle = particlesRef.current.geometry.attributes.aAngle.array as Float32Array;
      const phi = particlesRef.current.geometry.attributes.aPhi.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        angle[i] += speed[i] * dt * 60;
        const phiOffset = Math.sin(time.current * speed[i] * 5 + i) * 0.28;
        pos[i * 3] = radius[i] * Math.cos(angle[i]) * Math.cos(phi[i] + phiOffset);
        pos[i * 3 + 1] = radius[i] * Math.sin(phi[i] + phiOffset);
        pos[i * 3 + 2] = radius[i] * Math.sin(angle[i]) * Math.cos(phi[i] + phiOffset);
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Core glow layers
  const coreGlow = (
    <group>
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.55, 64, 64]} />
        <meshPhysicalMaterial
          color={0x00ffff}
          transparent
          opacity={0.4}
          roughness={0}
          metalness={1}
          clearcoat={1}
          clearcoatRoughness={0}
          emissive={0x00ffff}
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh position={[0, 0, 0]} scale={1.5}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshPhysicalMaterial
          color={0x00c8ff}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          roughness={0}
          metalness={1}
          emissive={0x00c8ff}
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0, 0, 0]} scale={2.5}>
        <sphereGeometry args={[1.1, 24, 24]} />
        <meshBasicMaterial
          color={0x00ffff}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );

  // Orbital rings
  const rings = useMemo(() => {
    const ringData = [
      { r: 2.2, tube: 0.022, color: 0x00ffff, opacity: 0.45, wireframe: true, rotZ: 0 },
      { r: 2.7, tube: 0.018, color: 0x00c8ff, opacity: 0.35, wireframe: true, rotZ: 0.35 },
      { r: 3.2, tube: 0.02, color: 0x5fe6ff, opacity: 0.3, wireframe: false, rotZ: -0.25 },
      { r: 3.8, tube: 0.015, color: 0x2f7bff, opacity: 0.25, wireframe: true, rotZ: 0.5 },
      { r: 4.4, tube: 0.012, color: 0x00ffff, opacity: 0.2, wireframe: false, rotZ: -0.4 },
    ];
    return ringData.map((d, i) => (
      <mesh
        key={i}
        geometry={new THREE.TorusGeometry(d.r, d.tube, 32, 160)}
        material={
          new THREE.MeshPhysicalMaterial({
            color: d.color,
            transparent: true,
            opacity: d.opacity,
            side: THREE.DoubleSide,
            wireframe: d.wireframe,
            roughness: 0,
            metalness: 1,
            clearcoat: d.wireframe ? 1 : 0.6,
            clearcoatRoughness: 0,
            emissive: d.color,
            emissiveIntensity: d.wireframe ? 0.2 : 0.1,
          })
        }
        rotationZ={d.rotZ}
      />
    ));
  }, []);

  // Particle field
  const count = 1000;
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
      const r = 1.2 + Math.random() * 4.5;
      const a = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * Math.PI * 0.7;
      positions[i * 3] = r * Math.cos(a) * Math.cos(ph);
      positions[i * 3 + 1] = r * Math.sin(ph);
      positions[i * 3 + 2] = r * Math.sin(a) * Math.cos(ph);
      sizes[i] = 1.0 + Math.random() * 2.5;
      alphas[i] = 0.3 + Math.random() * 0.6;
      speeds[i] = 0.015 + Math.random() * 0.07;
      radii[i] = r;
      angles[i] = a;
      phis[i] = ph;
      colorMix[i] = Math.random();
    }
  }, [positions, sizes, alphas, speeds, radii, angles, phis, colorMix]);

  const particles = useMemo(() => {
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

  const particlesMaterial = useMemo(
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
            gl_PointSize = aSize * (450.0 / -mvPosition.z);
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
            vec3 c1 = vec3(0.0, 1.0, 1.0);
            vec3 c2 = vec3(0.0, 0.78, 1.0);
            vec3 c3 = vec3(0.37, 0.9, 1.0);
            vec3 color = mix(c1, c2, vColorMix);
            color = mix(color, c3, sin(vColorMix * 3.14159));
            gl_FragColor = vec4(color, alpha * vAlpha * 2.0);
          }
        `,
      }),
    []
  );

  // Orbiting moons/orbs
  const moons = useMemo(() => [
    { pos: [-4.2, 2.2, -3], size: 1.1, color: 0x00ffff, opacity: 0.3, emissive: 0.5, speed: 0.28 },
    { pos: [4.5, -1.8, -3.5], size: 0.7, color: 0x00c8ff, opacity: 0.25, emissive: 0.4, speed: 0.22 },
    { pos: [-3.2, -3, 4], size: 0.95, color: 0x5fe6ff, opacity: 0.22, emissive: 0.35, speed: 0.35 },
    { pos: [3.8, 3, 3.2], size: 0.6, color: 0x00ffff, opacity: 0.18, emissive: 0.25, speed: 0.18 },
    { pos: [-2, 3.8, -1.5], size: 0.55, color: 0x2f7bff, opacity: 0.15, emissive: 0.2, speed: 0.4 },
    { pos: [2.5, -2.8, 2.5], size: 0.45, color: 0x5fe6ff, opacity: 0.12, emissive: 0.18, speed: 0.3 },
  ], []);

  return (
    <>
      <ambientLight intensity={0.7} color="#a8f0ff" />
      <directionalLight position={[10, 20, 12]} intensity={3} color="#ffffff" />
      <directionalLight position={[-10, 12, -12]} intensity={2} color="#00ffff" />
      <pointLight position={[0, 6, 6]} intensity={2} color="#00ffff" distance={25} decay={1.5} />
      <pointLight position={[0, -6, -6]} intensity={1.5} color="#5fe6ff" distance={25} decay={1.5} />

      {coreGlow}
      <group ref={ringsRef} rotationX={-Math.PI / 3}>{rings}</group>
      <points ref={particlesRef} geometry={particles} material={particlesMaterial} />

      {moons.map((m, i) => (
        <mesh
          key={i}
          position={m.pos}
          onBeforeRender={() => {
            // animated in useFrame via refs would be cleaner but this works
          }}
        >
          <sphereGeometry args={[m.size, 48, 48]} />
          <meshPhysicalMaterial
            color={m.color}
            transparent
            opacity={m.opacity}
            roughness={0}
            metalness={1}
            clearcoat={1}
            clearcoatRoughness={0}
            emissive={m.color}
            emissiveIntensity={m.emissive}
          />
        </mesh>
      ))}

      <Stars radius={70} opacity={0.5} color="#00ffff" />
    </>
  );
}

/* ===========================================
   SERVICES — GEOMETRIC / TECH LATTICE
   Hexagonal grid, data-flow lines, structured
   =========================================== */
function ServicesScene() {
  const time = useRef(0);
  const latticeRef = useRef<THREE.Group>(null);
  const flowRef = useRef<THREE.Points>(null);
  const nodesRef = useRef<THREE.Points>(null);

  useFrame((_, dt) => {
    time.current += dt;
    if (latticeRef.current) {
      latticeRef.current.rotation.y = time.current * 0.02;
      latticeRef.current.rotation.x = Math.sin(time.current * 0.06) * 0.1;
    }
    if (flowRef.current) {
      flowRef.current.rotation.y = time.current * 0.015;
      const pos = flowRef.current.geometry.attributes.position.array as Float32Array;
      const speed = flowRef.current.geometry.attributes.aSpeed.array as Float32Array;
      const targetY = flowRef.current.geometry.attributes.aTargetY.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += speed[i] * dt * 80;
        if (pos[i * 3 + 1] > targetY[i]) {
          pos[i * 3 + 1] = targetY[i] - 15;
        }
      }
      flowRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (nodesRef.current) {
      nodesRef.current.rotation.y = time.current * 0.01;
      const scale = nodesRef.current.geometry.attributes.aScale.array as Float32Array;
      for (let i = 0; i < scale.length; i++) {
        scale[i] = 0.7 + Math.sin(time.current * 3 + i) * 0.3;
      }
      nodesRef.current.geometry.attributes.aScale.needsUpdate = true;
    }
  });

  // Hexagonal lattice lines
  const lattice = useMemo(() => {
    const lines: THREE.Mesh[] = [];
    const gridSize = 8;
    const spacing = 1.2;
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    // Horizontal rows
    for (let z = -gridSize; z <= gridSize; z++) {
      for (let x = -gridSize; x <= gridSize; x += 2) {
        const geo = new THREE.BoxGeometry(spacing * 1.8, 0.015, 0.015);
        lines.push(
          <mesh key={`h-${x}-${z}`} geometry={geo} material={lineMat} position={[x * spacing, 0, z * spacing]} />
        );
      }
    }
    // Vertical columns
    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z += 2) {
        const geo = new THREE.BoxGeometry(0.015, 0.015, spacing * 1.8);
        lines.push(
          <mesh key={`v-${x}-${z}`} geometry={geo} material={lineMat} position={[x * spacing, 0, z * spacing]} />
        );
      }
    }
    // Diagonal connections
    for (let x = -gridSize; x <= gridSize; x += 3) {
      for (let z = -gridSize; z <= gridSize; z += 3) {
        const geo = new THREE.BoxGeometry(0.015, 0.015, spacing * 2.5);
        lines.push(
          <mesh key={`d1-${x}-${z}`} geometry={geo} material={lineMat} position={[x * spacing, 0, z * spacing]} rotation={[0, Math.PI / 4, 0]} />
        );
        lines.push(
          <mesh key={`d2-${x}-${z}`} geometry={geo} material={lineMat} position={[x * spacing, 0, z * spacing]} rotation={[0, -Math.PI / 4, 0]} />
        );
      }
    }
    return <group ref={latticeRef}>{lines}</group>;
  }, []);

  // Data flow particles (rising)
  const flowCount = 400;
  const flowPositions = useMemo(() => new Float32Array(flowCount * 3), []);
  const flowSpeeds = useMemo(() => new Float32Array(flowCount), []);
  const flowTargetY = useMemo(() => new Float32Array(flowCount), []);

  useMemo(() => {
    for (let i = 0; i < flowCount; i++) {
      flowPositions[i * 3] = (Math.random() - 0.5) * 18;
      flowPositions[i * 3 + 1] = -8 + Math.random() * 16;
      flowPositions[i * 3 + 2] = (Math.random() - 0.5) * 18;
      flowSpeeds[i] = 0.02 + Math.random() * 0.05;
      flowTargetY[i] = 8 + Math.random() * 4;
    }
  }, [flowPositions, flowSpeeds, flowTargetY]);

  const flowGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(flowPositions, 3));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(flowSpeeds, 1));
    g.setAttribute("aTargetY", new THREE.BufferAttribute(flowTargetY, 1));
    return g;
  }, [flowPositions, flowSpeeds, flowTargetY]);

  const flowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute float aSpeed;
          varying float vSpeed;
          void main() {
            vSpeed = aSpeed;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (2.5 + aSpeed * 80.0) * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vSpeed;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(0.0, 1.0, 1.0, alpha * vSpeed * 30.0);
          }
        `,
      }),
    []
  );

  // Intersection nodes
  const nodeCount = 256;
  const nodePositions = useMemo(() => new Float32Array(nodeCount * 3), []);
  const nodeScales = useMemo(() => new Float32Array(nodeCount), []);

  useMemo(() => {
    for (let i = 0; i < nodeCount; i++) {
      const gx = Math.floor((Math.random() - 0.5) * 16);
      const gz = Math.floor((Math.random() - 0.5) * 16);
      nodePositions[i * 3] = gx * 1.2;
      nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      nodePositions[i * 3 + 2] = gz * 1.2;
      nodeScales[i] = 0.7 + Math.random() * 0.5;
    }
  }, [nodePositions, nodeScales]);

  const nodeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(nodeScales, 1));
    return g;
  }, [nodePositions, nodeScales]);

  const nodeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute float aScale;
          varying float vScale;
          void main() {
            vScale = aScale;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aScale * 12.0 * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vScale;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(0.0, 1.0, 0.95, alpha * vScale * 1.5);
          }
        `,
      }),
    []
  );

  return (
    <>
      <ambientLight intensity={0.5} color="#8fe6ff" />
      <directionalLight position={[8, 15, 8]} intensity={2} color="#ffffff" />
      <directionalLight position={[-8, 10, -8]} intensity={1.2} color="#00c8ff" />

      {lattice}
      <points ref={flowRef} geometry={flowGeo} material={flowMat} />
      <points ref={nodesRef} geometry={nodeGeo} material={nodeMat} />

      <Stars radius={60} opacity={0.2} color="#00ffff" />
    </>
  );
}

/* ===========================================
   PACKAGES — TIERED CONCENTRIC SPHERES
   Three distinct tiers pulsing, clean separation
   =========================================== */
function PackagesScene() {
  const time = useRef(0);
  const tiersRef = useRef<THREE.Group[]>([]);
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((_, dt) => {
    time.current += dt;
    tiersRef.current.forEach((tier, i) => {
      if (tier) {
        tier.rotation.y = time.current * (0.02 + i * 0.015);
        tier.rotation.x = Math.sin(time.current * 0.08 + i) * 0.08;
        // Pulse each tier at different phase
        const pulse = 1 + Math.sin(time.current * 1.8 + i * 2) * 0.08;
        tier.scale.setScalar(pulse);
      }
    });
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time.current * 0.006;
    }
  });

  // Three tier spheres
  const tiers = useMemo(() => {
    const tierData = [
      { r: 1.6, color: 0x2f7bff, name: "starter", opacity: 0.3, wireframe: true, emissive: 0.4 },
      { r: 2.4, color: 0x00ffff, name: "business", opacity: 0.25, wireframe: false, emissive: 0.5 },
      { r: 3.3, color: 0x5fe6ff, name: "commerce", opacity: 0.2, wireframe: true, emissive: 0.35 },
    ];
    return tierData.map((t, i) => (
      <group key={i} ref={(el) => (tiersRef.current[i] = el)}>
        <mesh
          geometry={new THREE.SphereGeometry(t.r, 48, 48)}
          material={
            new THREE.MeshPhysicalMaterial({
              color: t.color,
              transparent: true,
              opacity: t.opacity,
              side: THREE.DoubleSide,
              wireframe: t.wireframe,
              roughness: 0,
              metalness: 1,
              clearcoat: 1,
              clearcoatRoughness: 0,
              emissive: t.color,
              emissiveIntensity: t.emissive,
            })
          }
        />
        {/* Inner glow shell */}
        <mesh
          geometry={new THREE.SphereGeometry(t.r * 1.05, 32, 32)}
          material={
            new THREE.MeshBasicMaterial({
              color: t.color,
              transparent: true,
              opacity: 0.04,
              side: THREE.BackSide,
              blending: THREE.AdditiveBlending,
            })
          }
        />
      </group>
    ));
  }, []);

  // Tier particles between spheres
  const count = 600;
  const positions = useMemo(() => new Float32Array(count * 3), []);
  const sizes = useMemo(() => new Float32Array(count), []);
  const alphas = useMemo(() => new Float32Array(count), []);
  const speeds = useMemo(() => new Float32Array(count), []);
  const tierIdx = useMemo(() => new Float32Array(count), []);

  useMemo(() => {
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      let r;
      if (t < 0.33) r = 1.6 + Math.random() * 0.8;
      else if (t < 0.66) r = 2.4 + Math.random() * 0.9;
      else r = 3.3 + Math.random() * 1.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = 0.8 + Math.random() * 1.5;
      alphas[i] = 0.25 + Math.random() * 0.5;
      speeds[i] = 0.01 + Math.random() * 0.04;
      tierIdx[i] = t < 0.33 ? 0 : t < 0.66 ? 1 : 2;
    }
  }, [positions, sizes, alphas, speeds, tierIdx]);

  const particles = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    g.setAttribute("aTier", new THREE.BufferAttribute(tierIdx, 1));
    return g;
  }, [positions, sizes, alphas, speeds, tierIdx]);

  const particlesMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          attribute float aTier;
          attribute float aSpeed;
          varying float vAlpha;
          varying float vTier;
          varying float vSpeed;
          void main() {
            vAlpha = aAlpha;
            vTier = aTier;
            vSpeed = aSpeed;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (350.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          varying float vTier;
          varying float vSpeed;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            vec3 color;
            if (vTier < 0.5) color = vec3(0.18, 0.48, 1.0);
            else if (vTier < 1.5) color = vec3(0.0, 1.0, 1.0);
            else color = vec3(0.37, 0.9, 1.0);
            gl_FragColor = vec4(color, alpha * vAlpha * 1.8);
          }
        `,
      }),
    []
  );

  return (
    <>
      <ambientLight intensity={0.55} color="#9ae6ff" />
      <directionalLight position={[6, 12, 8]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-6, 8, -8]} intensity={1.5} color="#2f7bff" />
      <pointLight position={[0, 0, 4]} intensity={1.5} color="#00ffff" distance={15} decay={1.5} />

      {tiers}
      <points ref={particlesRef} geometry={particles} material={particlesMaterial} />

      <Stars radius={55} opacity={0.25} color="#5fe6ff" />
    </>
  );
}

/* ===========================================
   PORTFOLIO — ORGANIC FLOW / CREATIVE CURRENTS
   Flowing ribbons, organic particles, artistic
   =========================================== */
function PortfolioScene() {
  const time = useRef(0);
  const ribbonsRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((_, dt) => {
    time.current += dt;
    if (ribbonsRef.current) {
      ribbonsRef.current.rotation.y = time.current * 0.012;
      ribbonsRef.current.children.forEach((ribbon, i) => {
        const positions = (ribbon as THREE.Mesh).geometry.attributes.position.array as Float32Array;
        const base = (ribbon as THREE.Mesh).geometry.attributes.aBase.array as Float32Array;
        for (let j = 0; j < positions.length / 3; j++) {
          positions[j * 3 + 1] = base[j * 3 + 1] + Math.sin(time.current * 2 + j * 0.3 + i) * 0.4;
          positions[j * 3] = base[j * 3] + Math.cos(time.current * 1.5 + j * 0.25 + i) * 0.2;
        }
        (ribbon as THREE.Mesh).geometry.attributes.position.needsUpdate = true;
      });
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time.current * 0.005;
      particlesRef.current.rotation.x = Math.sin(time.current * 0.04) * 0.05;
    }
  });

  // Flowing ribbons
  const ribbons = useMemo(() => {
    const ribbonCount = 12;
    const pointsPerRibbon = 80;
    const ribbons: THREE.Mesh[] = [];

    for (let r = 0; r < ribbonCount; r++) {
      const positions = new Float32Array(pointsPerRibbon * 3);
      const basePositions = new Float32Array(pointsPerRibbon * 3);
      const colors = new Float32Array(pointsPerRibbon * 3);

      const hue = (r / ribbonCount) * 0.3 + 0.5; // cyan to blue range

      for (let p = 0; p < pointsPerRibbon; p++) {
        const t = p / (pointsPerRibbon - 1);
        const angle = t * Math.PI * 4 + r * 0.5;
        const radius = 1.5 + t * 3;
        const x = Math.cos(angle) * radius;
        const y = (t - 0.5) * 8;
        const z = Math.sin(angle) * radius;

        positions[p * 3] = x;
        positions[p * 3 + 1] = y;
        positions[p * 3 + 2] = z;
        basePositions[p * 3] = x;
        basePositions[p * 3 + 1] = y;
        basePositions[p * 3 + 2] = z;

        const c = new THREE.Color().setHSL(hue, 0.8, 0.6);
        colors[p * 3] = c.r;
        colors[p * 3 + 1] = c.g;
        colors[p * 3 + 2] = c.b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("aBase", new THREE.BufferAttribute(basePositions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        linewidth: 2,
      });

      ribbons.push(<line key={r} geometry={geo} material={mat} />);
    }

    return <group ref={ribbonsRef}>{ribbons}</group>;
  }, []);

  // Sparkle particles
  const count = 800;
  const positions = useMemo(() => new Float32Array(count * 3), []);
  const sizes = useMemo(() => new Float32Array(count), []);
  const alphas = useMemo(() => new Float32Array(count), []);
  const speeds = useMemo(() => new Float32Array(count), []);
  const radii = useMemo(() => new Float32Array(count), []);
  const angles = useMemo(() => new Float32Array(count), []);
  const phis = useMemo(() => new Float32Array(count), []);
  const hues = useMemo(() => new Float32Array(count), []);

  useMemo(() => {
    for (let i = 0; i < count; i++) {
      const r = 0.5 + Math.random() * 4.5;
      const a = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * Math.PI * 0.8;
      positions[i * 3] = r * Math.cos(a) * Math.cos(ph);
      positions[i * 3 + 1] = r * Math.sin(ph);
      positions[i * 3 + 2] = r * Math.sin(a) * Math.cos(ph);
      sizes[i] = 1.5 + Math.random() * 3;
      alphas[i] = 0.4 + Math.random() * 0.5;
      speeds[i] = 0.005 + Math.random() * 0.03;
      radii[i] = r;
      angles[i] = a;
      phis[i] = ph;
      hues[i] = 0.5 + Math.random() * 0.35;
    }
  }, [positions, sizes, alphas, speeds, radii, angles, phis, hues]);

  const particles = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    g.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    g.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    g.setAttribute("aPhi", new THREE.BufferAttribute(phis, 1));
    g.setAttribute("aHue", new THREE.BufferAttribute(hues, 1));
    return g;
  }, [positions, sizes, alphas, speeds, radii, angles, phis, hues]);

  const particlesMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          attribute float aHue;
          varying float vAlpha;
          varying float vHue;
          void main() {
            vAlpha = aAlpha;
            vHue = aHue;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (400.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          varying float vHue;
          vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
          }
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            vec3 color = hsv2rgb(vec3(vHue, 0.85, 1.0));
            gl_FragColor = vec4(color, alpha * vAlpha * 2.0);
          }
        `,
      }),
    []
  );

  return (
    <>
      <ambientLight intensity={0.6} color="#b8f0ff" />
      <directionalLight position={[10, 18, 8]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-10, 12, -8]} intensity={1.8} color="#5fe6ff" />
      <pointLight position={[4, 4, 4]} intensity={1.8} color="#00ffff" distance={20} decay={1.5} />
      <pointLight position={[-4, -4, -4]} intensity={1.2} color="#5fe6ff" distance={20} decay={1.5} />

      {ribbons}
      <points ref={particlesRef} geometry={particles} material={particlesMaterial} />

      <Stars radius={65} opacity={0.3} color="#00ffff" />
    </>
  );
}

/* ===========================================
   CONTACT — SIGNAL / TRANSMISSION WAVES
   Expanding rings, Morse-like pulses, focused
   =========================================== */
function ContactScene() {
  const time = useRef(0);
  const wavesRef = useRef<THREE.Group[]>([]);
  const coreRef = useRef<THREE.Mesh>(null);
  const signalRef = useRef<THREE.Points>(null);

  useFrame((_, dt) => {
    time.current += dt;
    if (coreRef.current) {
      coreRef.current.scale.setScalar(1 + Math.sin(time.current * 2.5) * 0.2);
      coreRef.current.rotation.y = time.current * 0.15;
    }
    // Expanding wave rings
    wavesRef.current.forEach((wave, i) => {
      if (wave) {
        const progress = (time.current * 0.4 + i * 0.8) % 2;
        wave.scale.setScalar(0.5 + progress * 2.5);
        const opacity = Math.max(0, 1 - progress * 0.5);
        (wave.material as THREE.MeshBasicMaterial).opacity = opacity * 0.15;
      }
    });
    if (signalRef.current) {
      signalRef.current.rotation.y = time.current * 0.01;
      const pos = signalRef.current.geometry.attributes.position.array as Float32Array;
      const speed = signalRef.current.geometry.attributes.aSpeed.array as Float32Array;
      const phase = signalRef.current.geometry.attributes.aPhase.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        phase[i] += speed[i] * dt * 10;
        pos[i * 3 + 1] = Math.sin(phase[i]) * 1.5;
      }
      signalRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Central core
  const core = (
    <mesh ref={coreRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.6, 48, 48]} />
      <meshPhysicalMaterial
        color={0x00ffff}
        transparent
        opacity={0.5}
        roughness={0}
        metalness={1}
        clearcoat={1}
        clearcoatRoughness={0}
        emissive={0x00ffff}
        emissiveIntensity={1.0}
      />
    </mesh>
  );

  // Expanding wave rings
  const waves = useMemo(() => {
    const waveMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.RingGeometry(0.8, 0.85, 64);
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00ffff : 0x5fe6ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      waveMeshes.push(
        <mesh
          key={i}
          ref={(el) => (wavesRef.current[i] = el)}
          geometry={geo}
          material={mat}
          rotationX={-Math.PI / 2}
        />
      );
    }
    return <group>{waveMeshes}</group>;
  }, []);

  // Signal particles (vertical oscillation)
  const count = 300;
  const positions = useMemo(() => new Float32Array(count * 3), []);
  const sizes = useMemo(() => new Float32Array(count), []);
  const alphas = useMemo(() => new Float32Array(count), []);
  const speeds = useMemo(() => new Float32Array(count), []);
  const phases = useMemo(() => new Float32Array(count), []);
  const radii = useMemo(() => new Float32Array(count), []);

  useMemo(() => {
    for (let i = 0; i < count; i++) {
      const r = 0.8 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = r * Math.sin(theta);
      sizes[i] = 1.2 + Math.random() * 2;
      alphas[i] = 0.3 + Math.random() * 0.5;
      speeds[i] = 0.5 + Math.random() * 1.5;
      phases[i] = Math.random() * Math.PI * 2;
      radii[i] = r;
    }
  }, [positions, sizes, alphas, speeds, phases, radii]);

  const signal = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    g.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    return g;
  }, [positions, sizes, alphas, speeds, phases, radii]);

  const signalMaterial = useMemo(
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
            gl_PointSize = aSize * (350.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(0.0, 1.0, 1.0, alpha * vAlpha * 2.5);
          }
        `,
      }),
    []
  );

  return (
    <>
      <ambientLight intensity={0.4} color="#8fe6ff" />
      <directionalLight position={[5, 12, 6]} intensity={2} color="#ffffff" />
      <directionalLight position={[-5, 8, -6]} intensity={1} color="#00c8ff" />
      <pointLight position={[0, 3, 4]} intensity={2.5} color="#00ffff" distance={18} decay={1.5} />

      {core}
      {waves}
      <points ref={signalRef} geometry={signal} material={signalMaterial} />

      <Stars radius={50} opacity={0.15} color="#00ffff" />
    </>
  );
}

/* ===========================================
   SCENE SELECTOR
   =========================================== */
function HeroScene({ variant }: { variant: PageHero3DProps["variant"] }) {
  switch (variant) {
    case "services":
      return <ServicesScene />;
    case "packages":
      return <PackagesScene />;
    case "portfolio":
      return <PortfolioScene />;
    case "contact":
      return <ContactScene />;
    default:
      return <DefaultScene />;
  }
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
          autoRotateSpeed={variant === "portfolio" ? 0.2 : variant === "contact" ? 0.15 : 0.3}
        />
      </Canvas>
    </div>
  );
}