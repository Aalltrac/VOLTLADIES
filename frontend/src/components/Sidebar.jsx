import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { CalendarDays, CheckCircle2, Coins, MessageCircle, Map, LogOut, Home, Shield } from "lucide-react";

const links = [
  { to: "/app", label: "Accueil", icon: Home, end: true },
  { to: "/app/planning", label: "Planning", icon: CalendarDays },
  { to: "/app/disponibilite", label: "Disponibilité", icon: CheckCircle2 },
  { to: "/app/eva-pass", label: "Eva Pass", icon: Coins },
  { to: "/app/discussion", label: "Discussion", icon: MessageCircle },
  { to: "/app/strategie", label: "Stratégie", icon: Map },
];

export default function Sidebar() {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      data-testid="sidebar"
      className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 glass-deep border-r border-pink-900/40 z-20"
    >
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-pink-500 to-rose-700 flex items-center justify-center shadow-[0_0_20px_rgba(255,45,117,0.7)]">
          <Shield className="text-white" size={22} />
        </div>
        <div>
          <div className="font-display text-white text-lg leading-none tracking-widest">VOLT</div>
          <div className="font-display text-pink-400 text-sm tracking-[0.3em] -mt-0.5">LADIES</div>
        </div>
      </div>

      <nav className="flex-1 mt-4 px-3 space-y-1">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={`nav-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-display tracking-wider uppercase transition ${
                  isActive
                    ? "bg-pink-600/20 text-white border-l-2 border-pink-500 shadow-[inset_0_0_20px_rgba(255,45,117,0.15)]"
                    : "text-pink-200/70 hover:text-white hover:bg-pink-900/15"
                }`
              }
            >
              <Icon size={16} />
              <span>{l.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-pink-900/40">
        <div className="flex items-center gap-3 px-2 py-2">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-9 h-9 rounded-full border border-pink-500/60 object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-pink-900/40 border border-pink-500/40" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-white text-sm font-semibold truncate">{profile?.pseudo || "Membre"}</div>
            <div className="text-pink-300/60 text-xs truncate">{user?.email}</div>
          </div>
        </div>
        <button
          data-testid="logout-button"
          onClick={handleLogout}
          className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-display tracking-widest uppercase text-pink-200 border border-pink-700/50 hover:bg-pink-700/20 transition rounded"
        >
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}
