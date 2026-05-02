import { useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  DAYS,
  DAY_KEYS,
  TIME_SLOTS,
  AVAILABILITY_STATES,
  AVAILABILITY_BY_KEY,
  getWeekId,
} from "../lib/scheduleConstants";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  Text3D,
  Environment,
  ContactShadows,
  MeshReflectorMaterial,
  Float,
  Center,
  RoundedBox,
  OrbitControls,
  Stars,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";

/* ────────────────────────────────────────────────────────────────────────────
 *  Helpers (identiques à l'original)
 * ────────────────────────────────────────────────────────────────────────── */

function getWeekDates(weekOffset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const FONT_URL =
  "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json";
const FONT_URL_REG =
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json";

// Palette de référence, extraite des classes pink-* du fichier initial
const PALETTE = {
  bg: "#0a0310",
  deep: "#1a0620",
  chrome: "#ffe4f1",
  pink100: "#ffd1e3",
  pink300: "#ff8cb8",
  pink500: "#ff2d75",
  pink600: "#e01e60",
  pink900: "#4a0820",
  magenta: "#ff4d94",
  glass: "#3a0a25",
};

/* ────────────────────────────────────────────────────────────────────────────
 *  Matériaux partagés
 * ────────────────────────────────────────────────────────────────────────── */

const ChromeMaterial = ({ color = PALETTE.pink500, emissive = "#40001a", ...p }) => (
  <meshPhysicalMaterial
    color={color}
    metalness={0.95}
    roughness={0.18}
    clearcoat={1}
    clearcoatRoughness={0.08}
    reflectivity={1}
    envMapIntensity={1.4}
    emissive={emissive}
    emissiveIntensity={0.35}
    {...p}
  />
);

const GlassCrystalMaterial = ({ color, emissiveIntensity = 0.6, opacity = 1 }) => (
  <meshPhysicalMaterial
    color={color}
    metalness={0.1}
    roughness={0.08}
    transmission={0.6}
    thickness={0.9}
    ior={1.45}
    attenuationColor={color}
    attenuationDistance={1.6}
    clearcoat={1}
    clearcoatRoughness={0.05}
    emissive={color}
    emissiveIntensity={emissiveIntensity}
    transparent
    opacity={opacity}
    envMapIntensity={1.2}
  />
);

/* ────────────────────────────────────────────────────────────────────────────
 *  Décor : sol réfléchissant, backdrop, particules, étoiles
 * ────────────────────────────────────────────────────────────────────────── */

function Floor() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <MeshReflectorMaterial
        blur={[400, 120]}
        resolution={1024}
        mixBlur={1}
        mixStrength={0.9}
        roughness={0.55}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color={PALETTE.deep}
        metalness={0.7}
        mirror={0.65}
      />
    </mesh>
  );
}

function Backdrop() {
  // Colonnes de cristal en arrière-plan pour profondeur/parallaxe
  const columns = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 18; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 60,
        z: -18 - Math.random() * 22,
        h: 4 + Math.random() * 9,
        s: 0.25 + Math.random() * 0.55,
        r: Math.random() * Math.PI,
      });
    }
    return arr;
  }, []);
  return (
    <group>
      {columns.map((c, i) => (
        <mesh
          key={i}
          position={[c.x, c.h / 2, c.z]}
          rotation-y={c.r}
          castShadow={false}
          receiveShadow
        >
          <boxGeometry args={[c.s, c.h, c.s]} />
          <meshPhysicalMaterial
            color={PALETTE.glass}
            metalness={0.4}
            roughness={0.35}
            transmission={0.2}
            emissive={PALETTE.pink900}
            emissiveIntensity={0.35}
            clearcoat={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

function DustParticles({ count = 180 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = Math.random() * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
    }
    return arr;
  }, [count]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.02;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={PALETTE.pink300}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 *  Éclairage de studio rose photoréaliste
 * ────────────────────────────────────────────────────────────────────────── */

function Lights() {
  return (
    <>
      <ambientLight intensity={0.18} color={"#ffd1e8"} />
      {/* key light chrome rose, top-right */}
      <directionalLight
        position={[10, 14, 8]}
        intensity={2.1}
        color={"#fff0f7"}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0005}
      />
      {/* rim light magenta derrière */}
      <directionalLight
        position={[-6, 8, -10]}
        intensity={1.6}
        color={PALETTE.pink500}
      />
      {/* fill light violet doux */}
      <pointLight position={[-8, 4, 6]} intensity={1.2} color={"#b36bff"} distance={25} decay={2} />
      {/* glow central */}
      <pointLight position={[0, 1.5, 0]} intensity={1.4} color={PALETTE.magenta} distance={14} decay={2} />
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 *  Primitive : plaque PBR arrondie avec label 3D extrudé
 * ────────────────────────────────────────────────────────────────────────── */

function Label3D({
  text,
  size = 0.22,
  height = 0.05,
  color = PALETTE.pink100,
  emissive = PALETTE.pink500,
  emissiveIntensity = 0.6,
  font = FONT_URL,
  letterSpacing = 0,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  anchor = "center", // "center" | "left"
}) {
  const ref = useRef();
  const [w, setW] = useState(0);
  useEffect(() => {
    if (ref.current) {
      ref.current.geometry?.computeBoundingBox();
      const bb = ref.current.geometry?.boundingBox;
      if (bb) setW(bb.max.x - bb.min.x);
    }
  }, [text, size]);
  const offsetX = anchor === "center" ? -w / 2 : 0;
  return (
    <group position={position} rotation={rotation}>
      <Text3D
        ref={ref}
        font={font}
        size={size}
        height={height}
        bevelEnabled
        bevelSize={size * 0.04}
        bevelThickness={size * 0.04}
        bevelSegments={3}
        curveSegments={6}
        letterSpacing={letterSpacing}
        position={[offsetX, 0, 0]}
        castShadow
        receiveShadow
      >
        {text}
        <meshPhysicalMaterial
          color={color}
          metalness={0.85}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.08}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          envMapIntensity={1.3}
        />
      </Text3D>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 *  En-tête : titre extrudé + navigation de semaine (flèches 3D)
 * ────────────────────────────────────────────────────────────────────────── */

function ArrowButton({ direction = "left", position, onClick, testid }) {
  const ref = useRef();
  const [hover, setHover] = useState(false);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = hover ? 1.12 : 1;
    ref.current.scale.x += (target - ref.current.scale.x) * Math.min(1, dt * 10);
    ref.current.scale.y += (target - ref.current.scale.y) * Math.min(1, dt * 10);
    ref.current.scale.z += (target - ref.current.scale.z) * Math.min(1, dt * 10);
  });

  // Forme de flèche extrudée
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.45, 0);
    s.lineTo(0.05, 0.35);
    s.lineTo(0.05, 0.12);
    s.lineTo(0.45, 0.12);
    s.lineTo(0.45, -0.12);
    s.lineTo(0.05, -0.12);
    s.lineTo(0.05, -0.35);
    s.closePath();
    return s;
  }, []);

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
      userData={{ testid }}
    >
      {/* Socle */}
      <RoundedBox args={[1.7, 0.7, 0.5]} radius={0.12} smoothness={6} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={PALETTE.glass}
          metalness={0.8}
          roughness={0.25}
          clearcoat={1}
          emissive={hover ? PALETTE.pink500 : PALETTE.pink900}
          emissiveIntensity={hover ? 0.9 : 0.35}
        />
      </RoundedBox>
      {/* Flèche */}
      <group ref={ref} position={[0, 0, 0.28]} rotation-y={direction === "left" ? 0 : Math.PI}>
        <mesh castShadow>
          <extrudeGeometry
            args={[
              shape,
              { depth: 0.08, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 },
            ]}
          />
          <ChromeMaterial color={PALETTE.pink300} emissive={PALETTE.pink500} />
        </mesh>
      </group>
      {/* label SEM. */}
      <group position={[direction === "left" ? 0.2 : -0.2, -0.55, 0.26]}>
        <Label3D text="SEM." size={0.12} height={0.025} color={PALETTE.pink100} emissive={PALETTE.pink500} />
      </group>
    </group>
  );
}

function Header({ weekId, onPrev, onNext }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Sur-titre */}
      <group position={[-7.8, 3.5, 0]}>
        <Label3D
          text="— ETAT DE LA TEAM —"
          size={0.18}
          height={0.035}
          color={PALETTE.pink300}
          emissive={PALETTE.pink500}
          emissiveIntensity={0.5}
          anchor="left"
        />
      </group>
      {/* Titre principal extrudé */}
      <group position={[-7.8, 2.55, 0]}>
        <Label3D
          text="DISPONIBILITE"
          size={0.95}
          height={0.32}
          color={PALETTE.chrome}
          emissive={PALETTE.pink500}
          emissiveIntensity={0.55}
          anchor="left"
        />
      </group>
      {/* Bloc navigation semaine */}
      <group position={[6.8, 3, 0]}>
        <ArrowButton
          direction="left"
          position={[-2.3, 0, 0]}
          onClick={onPrev}
          testid="dispo-prev-week"
        />
        <Float speed={1.4} rotationIntensity={0.1} floatIntensity={0.25}>
          <group position={[0, 0, 0]}>
            <RoundedBox args={[2.4, 0.9, 0.45]} radius={0.18} smoothness={6} castShadow receiveShadow>
              <meshPhysicalMaterial
                color={PALETTE.deep}
                metalness={0.7}
                roughness={0.2}
                clearcoat={1}
                emissive={PALETTE.pink600}
                emissiveIntensity={0.25}
              />
            </RoundedBox>
            <Center position={[0, 0, 0.25]}>
              <Text3D
                font={FONT_URL}
                size={0.26}
                height={0.06}
                bevelEnabled
                bevelSize={0.008}
                bevelThickness={0.008}
                curveSegments={6}
                castShadow
              >
                {String(weekId)}
                <meshPhysicalMaterial
                  color={PALETTE.pink100}
                  metalness={0.9}
                  roughness={0.2}
                  clearcoat={1}
                  emissive={PALETTE.pink500}
                  emissiveIntensity={0.6}
                />
              </Text3D>
            </Center>
          </group>
        </Float>
        <ArrowButton
          direction="right"
          position={[2.3, 0, 0]}
          onClick={onNext}
          testid="dispo-next-week"
        />
      </group>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 *  Avatar 3D : sphère texturée (ou socle émissif si pas de photo)
 * ────────────────────────────────────────────────────────────────────────── */

function AvatarTextured({ photoURL, selected }) {
  const tex = useLoader(THREE.TextureLoader, photoURL);
  useEffect(() => {
    if (tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
    }
  }, [tex]);
  return (
    <mesh castShadow>
          <sphereGeometry args={[0.22, 48, 48]} />
          <meshPhysicalMaterial
            map={tex}
            metalness={0.15}
            roughness={0.35}
            clearcoat={1}
            clearcoatRoughness={0.12}
            emissive={selected ? PALETTE.pink500 : "#000000"}
            emissiveIntensity={selected ? 0.25 : 0}
          />
    </mesh>
  );
}

function AvatarFallback({ selected }) {
  return (
    <mesh castShadow>
      <sphereGeometry args={[0.22, 48, 48]} />
          <meshPhysicalMaterial
            color={PALETTE.pink900}
            metalness={0.2}
            roughness={0.4}
            clearcoat={1}
            emissive={PALETTE.pink500}
            emissiveIntensity={selected ? 0.7 : 0.45}
          />
      </mesh>
  );
}

function AvatarOrb({ photoURL, selected }) {
  return (
    <group>
      {photoURL ? (
        <AvatarTextured photoURL={photoURL} selected={selected} />
      ) : (
        <AvatarFallback selected={selected} />
      )}
      {/* anneau chromé */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0]}>
        <torusGeometry args={[0.25, 0.018, 24, 64]} />
        <ChromeMaterial
          color={selected ? PALETTE.pink300 : PALETTE.pink600}
          emissive={selected ? PALETTE.pink500 : PALETTE.pink900}
          emissiveIntensity={selected ? 1 : 0.3}
        />
      </mesh>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 *  Pilule membre 3D
 * ────────────────────────────────────────────────────────────────────────── */

function MemberPill({ u, isSelected, isMe, position, onSelect }) {
  const [hover, setHover] = useState(false);
  const groupRef = useRef();
  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const targetY = isSelected ? 0.08 : hover ? 0.04 : 0;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * Math.min(1, dt * 10);
  });
  const label = (u.pseudo || u.email || "?").slice(0, 14);
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(u.uid);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
      userData={{ testid: `dispo-member-${u.uid}` }}
    >
      <group ref={groupRef}>
        <RoundedBox args={[2.6, 0.55, 0.38]} radius={0.27} smoothness={6} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={isSelected ? PALETTE.pink600 : PALETTE.deep}
            metalness={0.7}
            roughness={isSelected ? 0.18 : 0.28}
            clearcoat={1}
            clearcoatRoughness={0.08}
            emissive={isSelected ? PALETTE.pink500 : PALETTE.pink900}
            emissiveIntensity={isSelected ? 0.75 : hover ? 0.45 : 0.18}
          />
        </RoundedBox>
        {/* avatar à gauche */}
        <group position={[-1.05, 0, 0.2]}>
          <AvatarOrb photoURL={u.photoURL} selected={isSelected} />
        </group>
        {/* pseudo au centre-droit */}
        <group position={[-0.7, -0.08, 0.22]}>
          <Label3D
            text={label}
            size={0.16}
            height={0.035}
            color={isSelected ? "#ffffff" : PALETTE.pink100}
            emissive={PALETTE.pink500}
            emissiveIntensity={isSelected ? 0.7 : 0.35}
            anchor="left"
            font={FONT_URL_REG}
          />
        </group>
        {isMe && (
          <group position={[1.05, -0.12, 0.22]}>
            <Label3D
              text="(moi)"
              size={0.11}
              height={0.022}
              color={PALETTE.pink300}
              emissive={PALETTE.pink500}
              emissiveIntensity={0.5}
              font={FONT_URL_REG}
            />
          </group>
        )}
      </group>
    </group>
  );
}

function MembersRow({ users, selectedUid, meUid, onSelect }) {
  // ligne courbée légère : x réparti, z en petit arc
  const spacing = 2.9;
  const startX = -((users.length - 1) * spacing) / 2;
  return (
    <group position={[0, 1.9, 0]}>
      {users.map((u, i) => {
        const x = startX + i * spacing;
        const arcZ = -Math.pow((x / (users.length * spacing)) * 1.6, 2) * 0.25;
        return (
          <MemberPill
            key={u.uid}
            u={u}
            isSelected={selectedUid === u.uid}
            isMe={meUid === u.uid}
            position={[x, 0, arcZ]}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 *  Sélecteur d'états (action)
 * ────────────────────────────────────────────────────────────────────────── */

function StateButton({ state, active, onClick, position }) {
  const [hover, setHover] = useState(false);
  const ref = useRef();
  useFrame((_, dt) => {
    if (!ref.current) return;
    const targetY = active ? 0.1 : hover ? 0.05 : 0;
    ref.current.position.y += (targetY - ref.current.position.y) * Math.min(1, dt * 10);
    const ei = active ? 1.3 : hover ? 0.9 : 0.35;
    if (ref.current.children[0]?.material) {
      ref.current.children[0].material.emissiveIntensity +=
        (ei - ref.current.children[0].material.emissiveIntensity) * Math.min(1, dt * 8);
    }
  });
  const col = state.color;
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
      userData={{ testid: `dispo-state-${state.key}` }}
    >
      <group ref={ref}>
        <RoundedBox args={[2, 0.55, 0.4]} radius={0.1} smoothness={6} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={col}
            metalness={0.55}
            roughness={0.22}
            clearcoat={1}
            clearcoatRoughness={0.08}
            emissive={col}
            emissiveIntensity={0.35}
          />
        </RoundedBox>
        <group position={[0, -0.06, 0.22]}>
          <Label3D
            text={(state.label || "").toUpperCase()}
            size={0.14}
            height={0.03}
            color={"#ffffff"}
            emissive={col}
            emissiveIntensity={0.8}
          />
        </group>
      </group>
    </group>
  );
}

function StateSelector({ states, active, setActive }) {
  const spacing = 2.25;
  const startX = -((states.length - 1) * spacing) / 2;
  return (
    <group position={[0, 0.95, 0]}>
      <group position={[startX - 2.2, 0, 0]}>
        <Label3D
          text="ACTION :"
          size={0.18}
          height={0.04}
          color={PALETTE.pink300}
          emissive={PALETTE.pink500}
          emissiveIntensity={0.6}
        />
      </group>
      {states.map((s, i) => (
        <StateButton
          key={s.key}
          state={s}
          active={active === s.key}
          onClick={() => setActive(s.key)}
          position={[startX + i * spacing, 0, 0]}
        />
      ))}
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 *  Grille 3D : jours en colonnes, créneaux en lignes, cellules cristallines
 * ────────────────────────────────────────────────────────────────────────── */

const CELL_W = 1.35;
const CELL_D = 0.58;
const CELL_GAP = 0.08;

function Cell({ cellKey, cfg, interactive, onClick, position }) {
  const [hover, setHover] = useState(false);
  const ref = useRef();
  const matRef = useRef();

  useFrame((state, dt) => {
    if (!ref.current) return;
    const targetY = cfg ? 0.35 : 0.04;
    const liftedY = hover && interactive ? targetY + 0.15 : targetY;
    ref.current.scale.y += (Math.max(0.25, liftedY * 2.4) - ref.current.scale.y) * Math.min(1, dt * 9);
    ref.current.position.y +=
      (liftedY - ref.current.position.y) * Math.min(1, dt * 9);

    if (matRef.current && cfg) {
      const base = 0.55;
      const pulse = 0.25 + Math.sin(state.clock.elapsedTime * 2.2 + position[0]) * 0.15;
      const target = hover && interactive ? base + 0.6 : base + pulse;
      matRef.current.emissiveIntensity +=
        (target - matRef.current.emissiveIntensity) * Math.min(1, dt * 6);
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (interactive) onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        if (interactive) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
      userData={{ testid: `dispo-cell-${cellKey}` }}
    >
      {/* Socle plat discret toujours présent */}
      <mesh position={[0, 0.01, 0]} receiveShadow rotation-x={-Math.PI / 2}>
        <planeGeometry args={[CELL_W - CELL_GAP, CELL_D - CELL_GAP]} />
        <meshPhysicalMaterial
          color={PALETTE.deep}
          metalness={0.4}
          roughness={0.6}
          emissive={PALETTE.pink900}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Prisme cristallin */}
      <mesh ref={ref} position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry
          args={[CELL_W - CELL_GAP - 0.06, 0.25, CELL_D - CELL_GAP - 0.06]}
        />
        {cfg ? (
          <meshPhysicalMaterial
            ref={matRef}
            color={cfg.color}
            metalness={0.15}
            roughness={0.1}
            transmission={0.55}
            thickness={0.8}
            ior={1.42}
            attenuationColor={cfg.color}
            attenuationDistance={1.4}
            clearcoat={1}
            clearcoatRoughness={0.05}
            emissive={cfg.color}
            emissiveIntensity={0.55}
            envMapIntensity={1.3}
            transparent
          />
        ) : (
          <meshPhysicalMaterial
            ref={matRef}
            color={PALETTE.glass}
            metalness={0.25}
            roughness={0.4}
            transmission={0.25}
            thickness={0.4}
            ior={1.35}
            clearcoat={0.8}
            clearcoatRoughness={0.1}
            emissive={"#2a0612"}
            emissiveIntensity={hover && interactive ? 0.7 : 0.12}
            transparent
            opacity={0.75}
          />
        )}
      </mesh>

      {/* Liseré lumineux au sol */}
      <mesh position={[0, 0.005, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry
          args={[
            0.48,
            0.5,
            32,
            1,
          ]}
        />
        <meshBasicMaterial
          color={cfg ? cfg.color : PALETTE.pink900}
          transparent
          opacity={cfg ? 0.8 : hover && interactive ? 0.55 : 0.2}
        />
      </mesh>
    </group>
  );
}

function DayHeader({ dayName, date, position }) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return (
    <group position={position}>
      <RoundedBox args={[CELL_W - 0.05, 0.55, 0.4]} radius={0.08} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={PALETTE.deep}
          metalness={0.7}
          roughness={0.22}
          clearcoat={1}
          emissive={PALETTE.pink600}
          emissiveIntensity={0.22}
        />
      </RoundedBox>
      <group position={[0, 0.08, 0.22]}>
        <Label3D
          text={String(dayName).toUpperCase().slice(0, 3)}
          size={0.18}
          height={0.035}
          color={PALETTE.chrome}
          emissive={PALETTE.pink500}
          emissiveIntensity={0.7}
        />
      </group>
      <group position={[0, -0.14, 0.22]}>
        <Label3D
          text={`${dd}/${mm}`}
          size={0.1}
          height={0.02}
          color={PALETTE.pink300}
          emissive={PALETTE.pink500}
          emissiveIntensity={0.4}
          font={FONT_URL_REG}
        />
      </group>
    </group>
  );
}

function SlotLabel({ slot, position }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.4, 0.4, 0.28]} radius={0.08} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={PALETTE.glass}
          metalness={0.6}
          roughness={0.3}
          clearcoat={1}
          emissive={PALETTE.pink900}
          emissiveIntensity={0.25}
        />
      </RoundedBox>
      <group position={[0, -0.04, 0.16]}>
        <Label3D
          text={String(slot)}
          size={0.14}
          height={0.025}
          color={PALETTE.pink100}
          emissive={PALETTE.pink500}
          emissiveIntensity={0.55}
          font={FONT_URL_REG}
        />
      </group>
    </group>
  );
}

function Grid({ weekDates, slotsToShow, interactive, onCellClick }) {
  const cols = DAY_KEYS.length; // 7
  const rows = TIME_SLOTS.length;

  // Centrage
  const gridWidth = cols * CELL_W;
  const gridDepth = rows * CELL_D;
  const startX = -gridWidth / 2 + CELL_W / 2;
  const startZ = -gridDepth / 2 + CELL_D / 2 + 2.0; // un peu devant le centre
  const tableY = -0.05;

  return (
    <group position={[0, 0, 2]}>
      {/* Plateau de la table holographique */}
      <mesh position={[0, tableY - 0.05, startZ + gridDepth / 2 - CELL_D / 2]} receiveShadow castShadow>
        <boxGeometry args={[gridWidth + 2.6, 0.12, gridDepth + 1.6]} />
        <meshPhysicalMaterial
          color={"#14031d"}
          metalness={0.85}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive={PALETTE.pink900}
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* En-têtes jours */}
      {DAYS.map((d, i) => (
        <DayHeader
          key={d}
          dayName={d}
          date={weekDates[i]}
          position={[startX + i * CELL_W, 0.2, startZ - CELL_D - 0.2]}
        />
      ))}

      {/* Colonne gauche : labels créneaux */}
      {TIME_SLOTS.map((slot, r) => (
        <SlotLabel key={slot} slot={slot} position={[startX - CELL_W - 0.1, 0.15, startZ + r * CELL_D]} />
      ))}

      {/* Cellules */}
      {TIME_SLOTS.map((slot, r) =>
        DAY_KEYS.map((day, c) => {
          const key = `${day}-${slot}`;
          const state = slotsToShow[key];
          const cfg = state ? AVAILABILITY_BY_KEY[state] : null;
          return (
            <Cell
              key={key}
              cellKey={key}
              cfg={cfg}
              interactive={interactive}
              position={[startX + c * CELL_W, tableY, startZ + r * CELL_D]}
              onClick={() => onCellClick?.(day, slot)}
            />
          );
        })
      )}
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 *  Scene racine
 * ────────────────────────────────────────────────────────────────────────── */

function Scene({
  weekId,
  weekDates,
  users,
  selectedUid,
  meUid,
  onSelectUser,
  onPrevWeek,
  onNextWeek,
  showStates,
  states,
  activeState,
  setActiveState,
  slotsToShow,
  interactive,
  onCellClick,
}) {
  return (
    <>
      <color attach="background" args={[PALETTE.bg]} />
      <fog attach="fog" args={[PALETTE.bg, 18, 55]} />

      <Lights />
      <Environment preset="night" />
      <Stars radius={80} depth={40} count={1500} factor={3} saturation={0} fade speed={0.4} />

      <Floor />
      <Backdrop />
      <DustParticles count={200} />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.55}
        blur={2.6}
        far={20}
        resolution={1024}
        color={"#1a0015"}
      />

      <Header weekId={weekId} onPrev={onPrevWeek} onNext={onNextWeek} />
      <MembersRow users={users} selectedUid={selectedUid} meUid={meUid} onSelect={onSelectUser} />

      {showStates && (
        <StateSelector states={states} active={activeState} setActive={setActiveState} />
      )}

      <Grid
        weekDates={weekDates}
        slotsToShow={slotsToShow}
        interactive={interactive}
        onCellClick={onCellClick}
      />

      <EffectComposer multisampling={4}>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.22}
          luminanceSmoothing={0.25}
          mipmapBlur
        />
        <ChromaticAberration offset={[0.0006, 0.0012]} />
        <Vignette eskil={false} offset={0.25} darkness={0.8} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 *  Composant exporté — logique Firebase/Auth STRICTEMENT identique à l'origine
 * ────────────────────────────────────────────────────────────────────────── */

export default function Disponibilite() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [availabilities, setAvailabilities] = useState({});
  const [selectedUid, setSelectedUid] = useState(null);
  const [activeState, setActiveState] = useState("available");

  const weekDate = new Date();
  weekDate.setDate(weekDate.getDate() + weekOffset * 7);
  const weekId = getWeekId(weekDate);
  const weekDates = getWeekDates(weekOffset);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      setAllUsers(users);
      if (!selectedUid && user) setSelectedUid(user.uid);
    });
    return () => unsub();
  }, [user, selectedUid]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "availability", weekId, "users"),
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = d.data().slots || {};
        });
        setAvailabilities(map);
      }
    );
    return () => unsub();
  }, [weekId]);

  const setSlot = async (day, slot, key) => {
    if (!user) return;
    const ref = doc(db, "availability", weekId, "users", user.uid);
    await setDoc(ref, { slots: { [`${day}-${slot}`]: key } }, { merge: true });
  };

  const myView = selectedUid === user?.uid;
  const slotsToShow = availabilities[selectedUid] || {};

  return (
    <div
      className="max-w-7xl mx-auto"
      data-testid="dispo-page"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: 720,
        background: `radial-gradient(ellipse at 50% 0%, ${PALETTE.deep} 0%, ${PALETTE.bg} 60%, #04000a 100%)`,
        overflow: "hidden",
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [0, 6.5, 13.5], fov: 42, near: 0.1, far: 200 }}
      >
        <Scene
          weekId={weekId}
          weekDates={weekDates}
          users={allUsers}
          selectedUid={selectedUid}
          meUid={user?.uid}
          onSelectUser={(uid) => setSelectedUid(uid)}
          onPrevWeek={() => setWeekOffset((w) => w - 1)}
          onNextWeek={() => setWeekOffset((w) => w + 1)}
          showStates={myView}
          states={AVAILABILITY_STATES}
          activeState={activeState}
          setActiveState={setActiveState}
          slotsToShow={slotsToShow}
          interactive={myView}
          onCellClick={(day, slot) => myView && setSlot(day, slot, activeState)}
        />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={9}
          maxDistance={22}
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 1.2, 1.5]}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
