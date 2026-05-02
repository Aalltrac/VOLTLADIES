import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { MAPS, slugifyMap } from "./Strategie";
import { ArrowLeft, FileText, MessageCircle } from "lucide-react";
import StrategyEditor from "../components/StrategyEditor";
import ChatRoom from "../components/ChatRoom";

export default function MapPage() {
  const { mapSlug } = useParams();
  const navigate = useNavigate();
  const mapName = MAPS.find((m) => slugifyMap(m) === mapSlug);
  const [tab, setTab] = useState("strategy");
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!mapSlug) return;
    const ref = doc(db, "strategies", mapSlug);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const html = snap.data().content || "";
        setSavedContent(html);
        setContent(html);
      }
    });
    return () => unsub();
  }, [mapSlug]);

  if (!mapName) {
    return (
      <div className="text-center py-20">
        <div className="font-display text-pink-200">Map inconnue</div>
        <button onClick={() => navigate("/app/strategie")} className="btn-ghost mt-4">Retour</button>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "strategies", mapSlug), {
        content,
        mapName,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSavedContent(content);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto" data-testid={`map-page-${mapSlug}`}>
      {/* Hero with map image */}
      <div
        className="relative rounded-md overflow-hidden border border-pink-800/40 mb-6 h-48 md:h-64"
        style={{
          background: `linear-gradient(180deg, rgba(40,4,22,0.45), rgba(10,1,6,0.85)), url(/maps/${mapSlug}.png) center/cover no-repeat`,
        }}
      >
        <Link
          to="/app/strategie"
          className="absolute top-3 left-3 px-3 py-1.5 bg-black/70 border border-pink-500/50 text-pink-100 hover:text-white text-xs font-display tracking-widest uppercase rounded flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Maps
        </Link>
        <div className="absolute inset-0 flex items-end p-6">
          <div>
            <div className="label-3d">— Map tactique —</div>
            <h1 className="page-title text-4xl md:text-6xl">{mapName}</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          data-testid="tab-strategy"
          onClick={() => setTab("strategy")}
          className={`px-4 py-2 text-xs font-display tracking-widest uppercase border rounded transition flex items-center gap-2 ${
            tab === "strategy"
              ? "bg-pink-600/30 border-pink-500 text-white"
              : "border-pink-800/40 text-pink-200/70 hover:bg-pink-900/20"
          }`}
        >
          <FileText size={14} /> Stratégie
        </button>
        <button
          data-testid="tab-discussion"
          onClick={() => setTab("discussion")}
          className={`px-4 py-2 text-xs font-display tracking-widest uppercase border rounded transition flex items-center gap-2 ${
            tab === "discussion"
              ? "bg-pink-600/30 border-pink-500 text-white"
              : "border-pink-800/40 text-pink-200/70 hover:bg-pink-900/20"
          }`}
        >
          <MessageCircle size={14} /> Discussion
        </button>
      </div>

      {tab === "strategy" ? (
        <StrategyEditor
          value={savedContent}
          onChange={setContent}
          onSave={handleSave}
          saving={saving}
        />
      ) : (
        <ChatRoom
          roomId={`map-${mapSlug}`}
          title={`# ${mapName}`}
          subtitle="Salon de discussion dédié à la map"
        />
      )}
    </div>
  );
}
