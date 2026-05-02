import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { MAPS, slugifyMap } from "./Strategie";
import { ArrowLeft, FileText, MessageCircle, Eye, Pencil } from "lucide-react";
import StrategyEditor from "../components/StrategyEditor";
import ChatRoom from "../components/ChatRoom";

function StrategyViewer({ content }) {
  if (!content) {
    return (
      <div className="glass rounded-md p-8 text-center text-pink-300/50 font-body">
        Aucune stratégie enregistrée pour cette map. Passe en mode Modification pour commencer.
      </div>
    );
  }
  return (
    <div
      className="glass rounded-md tiptap p-6"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default function MapPage() {
  const { mapSlug } = useParams();
  const navigate = useNavigate();
  const mapName = MAPS.find((m) => slugifyMap(m) === mapSlug);
  const [tab, setTab] = useState("strategy");
  const [strategyMode, setStrategyMode] = useState("view");
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
      setStrategyMode("view");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto" data-testid={`map-page-${mapSlug}`}>
      {/* Hero */}
      <div
        className="relative rounded-md border border-pink-800/40 mb-6 h-48 md:h-64"
        style={{
          background: `linear-gradient(180deg, rgba(40,4,22,0.45), rgba(10,1,6,0.85)), url(/maps/${mapSlug}.png) center/cover no-repeat`,
          overflow: "hidden",
        }}
      >
        {/* Bouton retour — z-10 pour passer au-dessus du fond */}
        <button
          onClick={() => navigate("/app/strategie")}
          className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-black/70 border border-pink-500/50 text-pink-100 hover:text-white text-xs font-display tracking-widest uppercase rounded flex items-center gap-2 transition"
        >
          <ArrowLeft size={14} /> Maps
        </button>
        <div className="absolute inset-0 flex items-end p-6 pointer-events-none">
          <div>
            <div className="label-3d">— Map tactique —</div>
            <h1 className="page-title text-4xl md:text-6xl">{mapName}</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
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

        {/* Toggle vue / édition */}
        {tab === "strategy" && (
          <div className="ml-auto flex items-center gap-1 border border-pink-800/40 rounded overflow-hidden">
            <button
              data-testid="strategy-mode-view"
              onClick={() => setStrategyMode("view")}
              className={`px-3 py-2 text-xs font-display tracking-widest uppercase flex items-center gap-1.5 transition ${
                strategyMode === "view"
                  ? "bg-pink-600/30 text-white"
                  : "text-pink-300/60 hover:text-white hover:bg-pink-900/20"
              }`}
            >
              <Eye size={13} /> Regarder
            </button>
            <button
              data-testid="strategy-mode-edit"
              onClick={() => setStrategyMode("edit")}
              className={`px-3 py-2 text-xs font-display tracking-widest uppercase flex items-center gap-1.5 transition ${
                strategyMode === "edit"
                  ? "bg-pink-600/30 text-white"
                  : "text-pink-300/60 hover:text-white hover:bg-pink-900/20"
              }`}
            >
              <Pencil size={13} /> Modifier
            </button>
          </div>
        )}
      </div>

      {/* Contenu */}
      {tab === "strategy" ? (
        strategyMode === "view" ? (
          <StrategyViewer content={savedContent} />
        ) : (
          <StrategyEditor
            value={savedContent}
            onChange={setContent}
            onSave={handleSave}
            saving={saving}
          />
        )
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
