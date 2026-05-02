import { useEffect, useRef, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Send } from "lucide-react";

export default function ChatRoom({ roomId, title, subtitle }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "chats", roomId, "messages"), orderBy("createdAt", "asc"), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    });
    return () => unsub();
  }, [roomId]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !user) return;
    setText("");
    await addDoc(collection(db, "chats", roomId, "messages"), {
      text: t,
      uid: user.uid,
      pseudo: profile?.pseudo || user.email,
      photoURL: profile?.photoURL || "",
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="glass rounded-md flex flex-col h-[70vh]" data-testid={`chat-room-${roomId}`}>
      <div className="px-5 py-3 border-b border-pink-800/40">
        <div className="font-display text-white tracking-wide text-lg">{title}</div>
        {subtitle && <div className="text-xs text-pink-300/60">{subtitle}</div>}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chat-messages">
        {messages.length === 0 && (
          <div className="text-center text-pink-300/40 text-sm font-body py-10">Aucun message — sois la première à écrire.</div>
        )}
        {messages.map((m) => {
          const mine = m.uid === user?.uid;
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              {m.photoURL ? (
                <img src={m.photoURL} className="w-8 h-8 rounded-full object-cover border border-pink-500/40" alt="" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-pink-900/40 border border-pink-500/30" />
              )}
              <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                <div className="text-[11px] text-pink-300/60 mb-0.5 font-display tracking-wider uppercase">{m.pseudo}</div>
                <div
                  className={`inline-block px-3 py-2 rounded-lg text-sm leading-relaxed font-body break-words ${
                    mine
                      ? "bg-gradient-to-br from-pink-600 to-rose-700 text-white"
                      : "bg-pink-950/70 border border-pink-800/50 text-pink-100"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="border-t border-pink-800/40 p-3 flex gap-2">
        <input
          data-testid="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-field flex-1"
          placeholder="Écris ton message..."
        />
        <button data-testid="chat-send" type="submit" className="btn-neon" disabled={!text.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
