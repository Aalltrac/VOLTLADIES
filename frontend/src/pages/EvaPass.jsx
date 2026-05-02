import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Coins, Calendar, Save } from "lucide-react";

export default function EvaPass() {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState([]); // users
  const [passes, setPasses] = useState({}); // uid -> {tokens, resetDate}
  const [myTokens, setMyTokens] = useState("");
  const [myReset, setMyReset] = useState("");
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (user && passes[user.uid]) {
      setMyTokens(String(passes[user.uid].tokens ?? ""));
      setMyReset(passes[user.uid].resetDate ?? "");
    }
  }, [user, passes]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "evaPass", user.uid),
        {
          uid: user.uid,
          tokens: Number(myTokens) || 0,
          resetDate: myReset || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } finally {
      setSaving(false);
    }
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

      {/* My pass editor */}
      <div className="glass rounded-md p-6 mb-8" data-testid="eva-pass-editor">
        <div className="flex items-center gap-2 text-pink-300 mb-4">
          <Coins size={16} />
          <span className="label-3d">Mon Eva Pass</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="label-3d block mb-2">Tokens restants</label>
            <input
              data-testid="eva-pass-tokens-input"
              type="number"
              min="0"
              value={myTokens}
              onChange={(e) => setMyTokens(e.target.value)}
              placeholder="0"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-3d block mb-2">Date de réinitialisation</label>
            <input
              data-testid="eva-pass-reset-input"
              type="date"
              value={myReset}
              onChange={(e) => setMyReset(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            data-testid="eva-pass-save-button"
            onClick={handleSave}
            disabled={saving}
            className="btn-neon disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* All members */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((m, idx) => {
          const p = passes[m.uid] || {};
          return (
            <div
              key={m.uid}
              data-testid={`eva-pass-card-${m.uid}`}
              className="glass rounded-md p-5 fade-up relative overflow-hidden"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-pink-500/15 blur-2xl" />
              <div className="flex items-center gap-3 mb-4">
                {m.photoURL ? (
                  <img src={m.photoURL} className="w-11 h-11 rounded-full border border-pink-500/60 object-cover" alt="" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-pink-900/40 border border-pink-500/30" />
                )}
                <div>
                  <div className="font-display text-white tracking-wide">{m.pseudo || "—"}</div>
                  <div className="text-xs text-pink-300/60">{m.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
