import { Canvas } from "@react-three/fiber";
import SceneBackground from "./SceneBackground";

// Fixed full-screen 3D background present on every page
export default function GlobalBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <SceneBackground />
      </Canvas>
    </div>
  );
}
