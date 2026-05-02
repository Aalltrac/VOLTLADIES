import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Coins, Calendar, Save, Pencil, X, Check } from "lucide-react";

function EditCard({ m, pass, onSave }) {
  const [tokens, setTokens] = useState(String(pass?.tokens ?? ""));
  const [resetDate, setResetDate] = useState(pass?.resetDate ?? "");
  const [saving, setSaving] = useState(false);

  // Sync if pass changes externally
  useEffect(() => {
    setTokens(String(pass?.tokens ?? ""));
    setResetDate(pass?.resetDate ?? "");
  }, [pass]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(m.uid, Number(tokens) || 0, resetDate);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="label-3d block mb-1">Tokens restants</label>
        <input
          type="number"
          min="0"
          value={tokens}
          onChange={(e) => setTokens(e.target.value)}
          className="input-field"
          placeholder="0"
        />
      </div>
      <div>
        <label className="label-3d block mb-1">Date de réinitialisation</label>
        <input
          type="date"
          value={resetDate}
          onChange={(e) => setResetDate(e.target.value)}
          className="input-field"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-neon w-full disabled:opacity-50 !py-2 text-sm"
      >
        <Check size={14} /> {saving ? "..." : "Valider"}
      </button>
    </div>
  );
}

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
      snap.docs.forEach((d) => { map[d.id] = d.data(); });
      setPasses(map);
    });
    return () => { u1(); u2(); };
  }, []);

  const handleSave = async (uid, tokens, resetDate) => {
    await setDoc(
      doc(db, "evaPass", uid),
      {
        uid,
        tokens,
        resetDate: resetDate || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setEditingUid(null);
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return iso; }
  };

  return (
    <div className="max-w-6xl mx-auto" data-testid="eva-pass-page">
      <div className="mb-8">
        <div className="label-3d mb-1">— Suivi des tokens —</div>
        <h1 className="page-title text-4xl md:text-5xl">Eva Pass</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((m, idx) => {
          const p = passes[m.uid] || {};
          const isEditing = editingUid === m.uid;
          const isMe = m.uid === user?.uid;

          return (
            <div
              key={m.uid}
              data-testid={`eva-pass-card-${m.uid}`}
              className="glass rounded-md p-5 fade-up relative overflow-hidden"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-pink-500/15 blur-2xl" />

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {m.photoURL ? (
                    <img src={m.photoURL} className="w-11 h-11 rounded-full border border-pink-500/60 object-cover" alt="" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-pink-900/40 border border-pink-500/30" />
                  )}
                  <div>
                    <div className="font-display text-white tracking-wide">
                      {m.pseudo || "—"}
                      {isMe && <span className="text-xs text-pink-300/60 ml-1">(moi)</span>}
                    </div>
                    <div className="text-xs text-pink-300/60">{m.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUid(isEditing ? null : m.uid)}
                  className="p-1.5 rounded border border-pink-700/40 text-pink-300 hover:text-white hover:bg-pink-700/20 transition"
                  title={isEditing ? "Annuler" : "Modifier"}
                >
                  {isEditing ? <X size={14} /> : <Pencil size={14} />}
                </button>
              </div>

              {/* View mode */}
              {!isEditing && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-pink-900/20 border border-pink-700/30 p-3 rounded">
                    <div className="text-[10px] uppercase tracking-widest text-pink-300/70 font-display flex items-center gap-1">
                      <Coins size={10} /> Tokens
                    </div>
                    <div className="text-2xl font-display text-white mt-1">{p.tokens ?? "—"}</div>
                  </div>
                  <div className="bg-pink-900/20 border border-pink-700/30 p-3 rounded">
                    <div className="text-[10px] uppercase tracking-widest text-pink-300/70 font-display flex items-center gap-1">
                      <Calendar size={10} /> Reset
                    </div>
                    <div className="text-base font-body text-pink-100 mt-1">{formatDate(p.resetDate)}</div>
                  </div>
                </div>
              )}

              {/* Edit mode */}
              {isEditing && (
                <EditCard m={m} pass={p} onSave={handleSave} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
