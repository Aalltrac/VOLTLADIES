import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 3D Shield logo built from extruded shape, matching the Ladies V crest
export default function Logo3D({ scale = 1, rotateSpeed = 0.3, position = [0, 0, 0] }) {
  const groupRef = useRef();
  const innerRef = useRef();

  // Shield shape based on the crest geometry
  const shieldShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 1.6);
    s.lineTo(1.3, 1.2);
    s.lineTo(1.45, 0.4);
    s.lineTo(1.2, -0.4);
    s.lineTo(0, -1.6);
    s.lineTo(-1.2, -0.4);
    s.lineTo(-1.45, 0.4);
    s.lineTo(-1.3, 1.2);
    s.closePath();
    return s;
  }, []);

  const innerShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 1.1);
    s.lineTo(0.9, 0.85);
    s.lineTo(1.0, 0.25);
    s.lineTo(0.85, -0.25);
    s.lineTo(0, -1.1);
    s.lineTo(-0.85, -0.25);
    s.lineTo(-1.0, 0.25);
    s.lineTo(-0.9, 0.85);
    s.closePath();
    return s;
  }, []);

  const extrudeSettings = useMemo(
    () => ({ depth: 0.25, bevelEnabled: true, bevelSegments: 4, steps: 2, bevelSize: 0.06, bevelThickness: 0.06 }),
    []
  );
  const innerExtrude = useMemo(
    () => ({ depth: 0.18, bevelEnabled: true, bevelSegments: 3, steps: 2, bevelSize: 0.04, bevelThickness: 0.04 }),
    []
  );

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotateSpeed;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * (rotateSpeed * 0.4);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Outer shield */}
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={[shieldShape, extrudeSettings]} />
        <meshStandardMaterial
          color="#ff2d75"
          metalness={0.85}
          roughness={0.18}
          emissive="#ff1f6c"
          emissiveIntensity={0.45}
        />
      </mesh>

      {/* Inner shield */}
      <mesh ref={innerRef} position={[0, 0, 0.13]}>
        <extrudeGeometry args={[innerShape, innerExtrude]} />
        <meshStandardMaterial
          color="#ff5fa0"
          metalness={0.95}
          roughness={0.1}
          emissive="#ff2d75"
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* V crystal in center */}
      <mesh position={[0, -0.1, 0.45]}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color="#ff85b8"
          metalness={1}
          roughness={0.05}
          emissive="#ff2d75"
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* Glow halo */}
      <mesh position={[0, 0, -0.2]}>
        <ringGeometry args={[1.7, 2.0, 64]} />
        <meshBasicMaterial color="#ff2d75" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
