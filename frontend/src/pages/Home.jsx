import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import Logo3D from "../components/three/Logo3D";
import { useAuth } from "../contexts/AuthContext";
import {
  CalendarDays,
  CheckCircle2,
  Coins,
  MessageCircle,
  Map,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

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
    <div className="max-w-6xl mx-auto relative" data-testid="home-page">
      {/* Halos décoratifs d'ambiance */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -right-32 w-96 h-96 rounded-full bg-rose-600/10 blur-3xl"
      />

      {/* HERO */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-14 relative">
        <div className="fade-up relative">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_12px_rgba(255,45,117,0.9)] animate-pulse" />
            <div className="label-3d">— Hub Volt Ladies —</div>
          </div>

          <h1 className="page-title text-4xl md:text-6xl leading-[0.95]">
            Bonjour,
            <br />
            <span className="text-white relative inline-block">
              {profile?.pseudo || "Lady"}
              <span className="absolute -bottom-2 left-0 h-[3px] w-2/3 bg-gradient-to-r from-pink-500 via-rose-400 to-transparent rounded-full" />
            </span>
          </h1>

          <p className="mt-6 text-pink-100/70 max-w-md font-body">
            Plonge dans le centre opérationnel de la team. Toutes les sections clés t'attendent ci-dessous.
          </p>

          <div className="mt-7 flex items-center gap-4 text-xs uppercase tracking-[0.25em] text-pink-200/50 font-body">
            <span className="flex items-center gap-2">
              <Sparkles size={12} className="text-pink-300" />
              {tiles.length} modules actifs
            </span>
            <span className="w-px h-4 bg-pink-300/20" />
            <span>live · ops</span>
          </div>
        </div>

        {/* Canvas 3D avec coins gaming */}
        <div className="relative h-72 md:h-96">
          <span aria-hidden className="pointer-events-none absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-pink-400/60" />
          <span aria-hidden className="pointer-events-none absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-pink-400/60" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-pink-400/60" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-pink-400/60" />
          <div aria-hidden className="pointer-events-none absolute inset-8 rounded-full bg-pink-500/10 blur-3xl" />
          <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} dpr={[1, 1.5]}>
            <ambientLight intensity={0.5} />
            <pointLight position={[3, 2, 4]} intensity={2} color="#ff2d75" />
            <pointLight position={[-3, -2, 3]} intensity={1.4} color="#ff85b8" />
            <Logo3D scale={1.5} rotateSpeed={0.5} />
          </Canvas>
        </div>
      </div>

      {/* Séparateur de section */}
      <div className="flex items-center gap-4 mb-6 fade-up" style={{ animationDelay: "200ms" }}>
        <div className="label-3d">— Modules —</div>
        <div className="flex-1 h-px bg-gradient-to-r from-pink-400/40 via-pink-400/10 to-transparent" />
        <div className="text-xs uppercase tracking-[0.3em] text-pink-200/50 font-body">
          {String(tiles.length).padStart(2, "0")} sections
        </div>
      </div>

      {/* TUILES */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tiles.map((t, idx) => {
          const Icon = t.icon;
          const num = String(idx + 1).padStart(2, "0");
          return (
            <button
              key={t.to}
              data-testid={`home-tile-${t.label.toLowerCase()}`}
              onClick={() => navigate(t.to)}
              className="group glass relative p-6 text-left rounded-md hover:-translate-y-1 transition-transform fade-up overflow-hidden"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Sweep de lumière au hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />

              {/* Halo coin haut-droit */}
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-pink-500/15 blur-2xl group-hover:bg-pink-500/30 transition" />

              {/* Numérotation tuile */}
              <div className="absolute top-4 right-5 font-display text-xs tracking-[0.3em] text-pink-300/50 group-hover:text-pink-200 transition-colors">
                {num}
              </div>

              {/* Icône */}
              <div className="relative w-12 h-12 rounded bg-gradient-to-br from-pink-500 to-rose-700 flex items-center justify-center shadow-[0_0_20px_rgba(255,45,117,0.5)] mb-4 group-hover:shadow-[0_0_28px_rgba(255,45,117,0.85)] transition-shadow">
                <span aria-hidden className="absolute inset-0 rounded ring-1 ring-pink-200/30 group-hover:ring-pink-200/60 transition" />
                <Icon className="text-white relative" size={22} />
              </div>

              {/* Titre + flèche */}
              <div className="flex items-end justify-between gap-2">
                <div className="font-display text-2xl tracking-wide text-white">
                  {t.label}
                </div>
                <ArrowUpRight
                  size={18}
                  className="text-pink-200/50 -translate-x-1 translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition duration-300"
                />
              </div>

              <div className="text-sm text-pink-200/60 mt-1 font-body">
                {t.desc}
              </div>

              {/* Barre d'accent bas */}
              <div className="absolute left-0 bottom-0 h-[2px] w-0 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-300 group-hover:w-full transition-all duration-500 ease-out" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
