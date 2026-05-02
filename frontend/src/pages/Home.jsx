import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import Logo3D from "../components/three/Logo3D";
import { useAuth } from "../contexts/AuthContext";
import { CalendarDays, CheckCircle2, Coins, MessageCircle, Map } from "lucide-react";

const tiles = [
  { to: "/app/planning", label: "Planning", desc: "Sessions, scrims, tournois", icon: CalendarDays },
  { to: "/app/disponibilite", label: "Disponibilité", desc: "État de chaque membre", icon: CheckCircle2 },
  { to: "/app/eva-pass", label: "Eva Pass", desc: "Tokens & reset", icon: Coins },
  { to: "/app/discussion", label: "Discussion", desc: "Chat de la team", icon: MessageCircle },
  { to: "/app/strategie", label: "Stratégie", desc: "11 maps tactiques", icon: Map },
];

export default function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto" data-testid="home-page">
      <div className="grid md:grid-cols-2 gap-8 items-center mb-10">
        <div className="fade-up">
          <div className="label-3d mb-2">— Hub Volt Ladies —</div>
          <h1 className="page-title text-4xl md:text-6xl leading-[0.95]">
            Bonjour,<br /><span className="text-white">{profile?.pseudo || "Lady"}</span>
          </h1>
          <p className="mt-4 text-pink-100/70 max-w-md font-body">
            Plonge dans le centre opérationnel de la team. Toutes les sections clés t'attendent ci-dessous.
          </p>
        </div>
        <div className="h-72 md:h-96">
          <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} dpr={[1, 1.5]}>
            <ambientLight intensity={0.5} />
            <pointLight position={[3, 2, 4]} intensity={2} color="#ff2d75" />
            <pointLight position={[-3, -2, 3]} intensity={1.4} color="#ff85b8" />
            <Logo3D scale={1.5} rotateSpeed={0.5} />
          </Canvas>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tiles.map((t, idx) => {
          const Icon = t.icon;
          return (
            <button
              key={t.to}
              data-testid={`home-tile-${t.label.toLowerCase()}`}
              onClick={() => navigate(t.to)}
              className="group glass relative p-6 text-left rounded-md hover:-translate-y-1 transition-transform fade-up overflow-hidden"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-pink-500/15 blur-2xl group-hover:bg-pink-500/30 transition" />
              <div className="w-12 h-12 rounded bg-gradient-to-br from-pink-500 to-rose-700 flex items-center justify-center shadow-[0_0_20px_rgba(255,45,117,0.5)] mb-4">
                <Icon className="text-white" size={22} />
              </div>
              <div className="font-display text-2xl tracking-wide text-white">{t.label}</div>
              <div className="text-sm text-pink-200/60 mt-1 font-body">{t.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
