import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

// Floating crystals around the scene
function Crystals({ count = 18 }) {
  const meshRef = useRef();
  const positions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        pos: [
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12 - 4,
        ],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
        scale: 0.15 + Math.random() * 0.4,
        speed: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [count]);

  return (
    <group ref={meshRef}>
      {positions.map((p, i) => (
        <FloatingCrystal key={i} {...p} />
      ))}
    </group>
  );
}

function FloatingCrystal({ pos, rot, scale, speed, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = pos[1] + Math.sin(t * speed + phase) * 0.6;
    ref.current.rotation.x += 0.003;
    ref.current.rotation.y += 0.005;
  });
  return (
    <mesh ref={ref} position={pos} rotation={rot} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#ff2d75"
        metalness={1}
        roughness={0.1}
        emissive="#ff2d75"
        emissiveIntensity={0.6}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// Pulsing pink fog plane
function NebulaPlane() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.opacity = 0.15 + Math.sin(clock.getElapsedTime() * 0.5) * 0.05;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, -10]}>
      <planeGeometry args={[60, 40]} />
      <meshBasicMaterial color="#7a0c3c" transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function SceneBackground({ intensity = 1 }) {
  return (
    <>
      <color attach="background" args={["#050008"]} />
      <fog attach="fog" args={["#0a0210", 8, 28]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 4, 6]} intensity={1.4 * intensity} color="#ff2d75" />
      <pointLight position={[-6, -3, 4]} intensity={1.0 * intensity} color="#ff85b8" />
      <directionalLight position={[0, 8, 5]} intensity={0.5} color="#ffffff" />

      <Stars radius={50} depth={30} count={2500} factor={3} saturation={0.6} fade speed={0.6} />
      <NebulaPlane />
      <Crystals count={20} />
    </>
  );
}
