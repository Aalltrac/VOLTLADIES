import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

// 3D rotating shield button used for major navigation actions
export default function ShieldButton({
  label,
  position = [0, 0, 0],
  scale = 1,
  onClick,
  color = "#ff2d75",
}) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? scale * 0.94 : hovered ? scale * 1.08 : scale;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    groupRef.current.rotation.y += delta * (hovered ? 0.6 : 0.1);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      onPointerDown={() => setActive(true)}
      onPointerUp={() => setActive(false)}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
    >
      <mesh>
        <cylinderGeometry args={[0.9, 0.9, 0.25, 6]} />
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.18}
          emissive={color}
          emissiveIntensity={hovered ? 0.9 : 0.35}
        />
      </mesh>
      <mesh position={[0, 0, 0.14]}>
        <cylinderGeometry args={[0.7, 0.7, 0.08, 6]} />
        <meshStandardMaterial
          color="#1a0210"
          metalness={0.5}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={hovered ? 0.4 : 0.1}
        />
      </mesh>
      <Text
        position={[0, 0, 0.22]}
        fontSize={0.18}
        color="#fff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
        textAlign="center"
        outlineWidth={0.005}
        outlineColor="#ff2d75"
      >
        {label}
      </Text>
    </group>
  );
}
