import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Coins, Calendar, Pencil, X, Check, Sparkles, Users, Wallet, Clock } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers d'affichage (purement visuels, aucune logique métier)      */
/* ------------------------------------------------------------------ */

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const daysUntil = (iso) => {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const ms = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

const relativeLabel = (iso) => {
  const d = daysUntil(iso);
  if (d === null) return null;
  if (d === 0) return "aujourd'hui";
  if (d === 1) return "demain";
  if (d > 1) return `dans ${d} j`;
  if (d === -1) return "hier";
  return `il y a ${Math.abs(d)} j`;
};

/* ------------------------------------------------------------------ */
/*  EditCard — formulaire d'édition (logique inchangée)                */
/* ------------------------------------------------------------------ */

function EditCard({ m, pass, onSave, onCancel }) {
  const [tokens, setTokens] = useState(String(pass?.tokens ?? ""));
  const [resetDate, setResetDate] = useState(pass?.resetDate ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(m.uid, tokens, resetDate);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-1" data-testid={`eva-pass-edit-${m.uid}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label-3d block mb-1.5 flex items-center gap-1.5">
            <Coins size={11} className="text-pink-300/80" />
            Tokens restants
          </label>
          <input
            type="number"
            min="0"
            value={tokens}
            onChange={(e) => setTokens(e.target.value)}
            className="input-field"
            placeholder="0"
            data-testid={`eva-pass-input-tokens-${m.uid}`}
          />
        </div>
        <div>
          <label className="label-3d block mb-1.5 flex items-center gap-1.5">
            <Calendar size={11} className="text-pink-300/80" />
            Date de reset
          </label>
          <input
            type="date"
            value={resetDate}
            onChange={(e) => setResetDate(e.target.value)}
            className="input-field"
            data-testid={`eva-pass-input-date-${m.uid}`}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-neon flex-1 disabled:opacity-50 !py-2 text-sm"
          data-testid={`eva-pass-save-${m.uid}`}
        >
          <Check size={14} /> {saving ? "Sauvegarde…" : "Valider"}
        </button>
        <button
          onClick={onCancel}
          className="btn-ghost !py-2 !px-3"
          data-testid={`eva-pass-cancel-${m.uid}`}
          aria-label="Annuler"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page principale                                                    */
/* ------------------------------------------------------------------ */

export default function EvaPass() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [passes, setPasses] = useState({});
  const [editingUid, setEditingUid] = useState(null);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "users"), (snap) => {
      setMembers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
    const u2 = onSnapshot(collection(db, "evaPass"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.id] = d.data();
      });
      setPasses(map);
    });
    return () => {
      u1();
      u2();
    };
  }, []);

  const handleSave = async (uid, tokens, resetDate) => {
    await setDoc(
      doc(db, "evaPass", uid),
      {
        uid,
        tokens: Number(tokens) || 0,
        resetDate: resetDate || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setEditingUid(null);
  };

  /* Stats dérivées (affichage uniquement) */
  const stats = useMemo(() => {
    const list = members.map((m) => passes[m.uid] || {});
    const totalTokens = list.reduce((sum, p) => sum + (Number(p.tokens) || 0), 0);
    const active = list.filter((p) => (Number(p.tokens) || 0) > 0).length;
    return { count: members.length, totalTokens, active };
  }, [members, passes]);

  return (
    <div className="max-w-6xl mx-auto relative" data-testid="eva-pass-page">
      {/* Halos d'ambiance */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-pink-500/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -right-24 w-[26rem] h-[26rem] rounded-full bg-fuchsia-700/10 blur-[120px]"
      />

      {/* Hero */}
      <header className="mb-10 relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-pink-400/70" />
          <span className="label-3d flex items-center gap-1.5">
            <Sparkles size={11} className="text-pink-300" />
            Suivi des tokens
          </span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-pink-400/70" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1
              className="page-title text-4xl sm:text-5xl lg:text-6xl leading-[0.95]"
              data-testid="eva-pass-title"
            >
              Eva Pass
            </h1>
            <p className="mt-3 text-sm text-pink-200/60 max-w-md">
              Gestion en temps réel des tokens des membres et de leur date de
              réinitialisation.
            </p>
          </div>

          {/* Mini-stats */}
          <div
            className="grid grid-cols-3 gap-2 lg:gap-3 lg:min-w-[420px]"
            data-testid="eva-pass-stats"
          >
            <StatPill icon={Users} label="Membres" value={stats.count} />
            <StatPill
              icon={Wallet}
              label="Tokens"
              value={stats.totalTokens.toLocaleString("fr-FR")}
              accent
            />
            <StatPill icon={Clock} label="Actifs" value={stats.active} />
          </div>
        </div>
      </header>

      {/* Empty state */}
      {members.length === 0 && (
        <div
          className="glass rounded-md p-10 text-center fade-up"
          data-testid="eva-pass-empty"
        >
          <div className="mx-auto w-12 h-12 rounded-full border border-pink-500/40 flex items-center justify-center mb-3">
            <Users size={18} className="text-pink-300" />
          </div>
          <div className="font-display text-white text-lg">Aucun membre</div>
          <div className="text-sm text-pink-300/60 mt-1">
            Les profils apparaîtront ici dès qu'ils seront ajoutés.
          </div>
        </div>
      )}

      {/* Grille des cartes */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 relative">
        {members.map((m, idx) => {
          const p = passes[m.uid] || {};
          const isEditing = editingUid === m.uid;
          const isMe = m.uid === user?.uid;
          const tokens = Number(p.tokens) || 0;
          const hasTokens = tokens > 0;
          const rel = relativeLabel(p.resetDate);
          const days = daysUntil(p.resetDate);
          const soon = days !== null && days >= 0 && days <= 3;

          return (
            <article
              key={m.uid}
              data-testid={`eva-pass-card-${m.uid}`}
              className={[
                "group relative glass rounded-md p-5 fade-up",
                "transition-transform duration-300 ease-out",
                "hover:-translate-y-0.5",
                isMe ? "ring-1 ring-pink-400/40" : "",
              ].join(" ")}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Glow décoratif */}
              <div
                aria-hidden
                className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-pink-500/15 blur-2xl pointer-events-none transition-opacity duration-500 group-hover:opacity-80 opacity-60"
              />
              <div
                aria-hidden
                className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/40 to-transparent pointer-events-none"
              />

              {/* Header carte */}
              <div className="flex items-start justify-between mb-5 relative">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-pink-500/20 blur-md"
                    />
                    {m.photoURL ? (
                      <img
                        src={m.photoURL}
                        alt=""
                        className="relative w-12 h-12 rounded-full border border-pink-400/60 object-cover ring-2 ring-pink-500/10"
                      />
                    ) : (
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-pink-900/60 to-fuchsia-900/40 border border-pink-500/40 flex items-center justify-center ring-2 ring-pink-500/10">
                        <span className="font-display text-pink-200 text-sm">
                          {(m.pseudo || m.email || "?").slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-display text-white tracking-wide truncate">
                        {m.pseudo || "—"}
                      </span>
                      {isMe && (
                        <span className="text-[9px] uppercase tracking-widest font-display px-1.5 py-0.5 rounded-sm border border-pink-400/40 text-pink-200 bg-pink-500/10">
                          moi
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-pink-300/60 truncate">
                      {m.email}
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setEditingUid(m.uid)}
                    className="shrink-0 p-1.5 rounded border border-pink-700/40 text-pink-300 hover:text-white hover:bg-pink-700/20 hover:border-pink-400/60 transition"
                    title="Modifier"
                    data-testid={`eva-pass-edit-btn-${m.uid}`}
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>

              {/* Vue */}
              {!isEditing && (
                <div className="space-y-3 relative">
                  {/* Tokens — bloc principal */}
                  <div
                    className={[
                      "relative overflow-hidden p-4 rounded border",
                      "bg-gradient-to-br from-pink-900/30 via-pink-900/10 to-transparent",
                      hasTokens
                        ? "border-pink-500/40"
                        : "border-pink-700/25",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-pink-300/70 font-display flex items-center gap-1.5">
                          <Coins size={11} />
                          Tokens restants
                        </div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span
                            className={[
                              "font-display leading-none tabular-nums",
                              hasTokens
                                ? "text-white text-4xl"
                                : "text-pink-300/50 text-3xl",
                            ].join(" ")}
                            data-testid={`eva-pass-tokens-${m.uid}`}
                          >
                            {p.tokens ?? "—"}
                          </span>
                          {hasTokens && (
                            <span className="text-xs text-pink-300/60 font-body">
                              tk
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pictogramme jeton */}
                      <div className="relative">
                        <div
                          aria-hidden
                          className="absolute inset-0 rounded-full bg-pink-500/20 blur-lg"
                        />
                        <div className="relative w-10 h-10 rounded-full border border-pink-400/40 bg-pink-950/40 flex items-center justify-center">
                          <Coins size={16} className="text-pink-200" />
                        </div>
                      </div>
                    </div>

                    {/* Liseré animé */}
                    <div
                      aria-hidden
                      className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-pink-400/60 to-transparent"
                    />
                  </div>

                  {/* Reset date */}
                  <div
                    className={[
                      "p-3 rounded border flex items-center justify-between",
                      "bg-pink-900/15",
                      soon ? "border-pink-400/50" : "border-pink-700/25",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded border border-pink-500/30 bg-pink-950/40 flex items-center justify-center shrink-0">
                        <Calendar size={12} className="text-pink-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-pink-300/70 font-display">
                          Reset
                        </div>
                        <div
                          className="text-sm font-body text-pink-100 truncate"
                          data-testid={`eva-pass-reset-${m.uid}`}
                        >
                          {formatDate(p.resetDate)}
                        </div>
                      </div>
                    </div>

                    {rel && (
                      <span
                        className={[
                          "text-[10px] uppercase tracking-widest font-display px-2 py-1 rounded-sm border whitespace-nowrap",
                          soon
                            ? "border-pink-400/50 text-pink-100 bg-pink-500/15"
                            : "border-pink-700/40 text-pink-300/80 bg-pink-900/20",
                        ].join(" ")}
                      >
                        {rel}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Édition */}
              {isEditing && (
                <EditCard
                  m={m}
                  pass={p}
                  onSave={handleSave}
                  onCancel={() => setEditingUid(null)}
                />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StatPill — petite tuile statistique du hero                        */
/* ------------------------------------------------------------------ */

function StatPill({ icon: Icon, label, value, accent = false }) {
  return (
    <div
      className={[
        "glass rounded-md px-3 py-2.5 flex items-center gap-2.5 relative overflow-hidden",
        accent ? "ring-1 ring-pink-400/30" : "",
      ].join(" ")}
      data-testid={`eva-pass-stat-${label.toLowerCase()}`}
    >
      <div
        className={[
          "w-8 h-8 rounded border flex items-center justify-center shrink-0",
          accent
            ? "border-pink-400/50 bg-pink-500/15"
            : "border-pink-700/40 bg-pink-900/30",
        ].join(" ")}
      >
        <Icon size={14} className="text-pink-200" />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-[0.18em] text-pink-300/70 font-display">
          {label}
        </div>
        <div className="font-display text-white text-lg leading-tight tabular-nums truncate">
          {value}
        </div>
      </div>
      {accent && (
        <div
          aria-hidden
          className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-pink-500/20 blur-2xl pointer-events-none"
        />
      )}
    </div>
  );
}
