import { useNavigate } from "react-router-dom";

export const MAPS = [
  "Artefact",
  "Atlantis",
  "Ceres",
  "Engine",
  "Helios Station",
  "Horizon",
  "Lunar Outpost",
  "Outlaw",
  "Polaris",
  "Silva",
  "The Cliff",
];

export const slugifyMap = (name) => name.toLowerCase().replace(/\s+/g, "_");

export default function Strategie() {
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl mx-auto" data-testid="strategie-page">
      <div className="mb-8">
        <div className="label-3d mb-1">— Tactiques de map —</div>
        <h1 className="page-title text-4xl md:text-5xl">Stratégie</h1>
        <p className="text-pink-200/60 mt-2 max-w-2xl font-body">
          Choisis une map pour accéder à son tableau stratégique et son salon de discussion dédié.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {MAPS.map((m, i) => {
          const slug = slugifyMap(m);
          return (
            <button
              key={m}
              data-testid={`map-card-${slug}`}
              onClick={() => navigate(`/app/strategie/${slug}`)}
              className="group relative aspect-[3/4] rounded-md overflow-hidden border border-pink-800/40 hover:border-pink-500 transition-all duration-300 hover:-translate-y-1 fade-up"
              style={{
                animationDelay: `${i * 60}ms`,
                background: `linear-gradient(180deg, rgba(40,4,22,0.4), rgba(10,1,6,0.85)), url(/maps/${slug}.png) center/cover no-repeat`,
                boxShadow: "0 10px 40px -10px rgba(255,45,117,0.4)",
              }}
            >
              {/* Decorative corner cuts */}
              <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-pink-500/70" />
              <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-pink-500/70" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-pink-500/70" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-pink-500/70" />

              {/* Hover glow */}
              <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/15 transition" />

              {/* Map name centered at bottom */}
              <div className="absolute inset-x-0 bottom-6 flex justify-center">
                <div className="px-4 py-2 bg-black/70 border border-pink-500/50 backdrop-blur-sm">
                  <div className="font-display text-base md:text-lg tracking-[0.25em] uppercase text-white whitespace-nowrap">
                    {m}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
