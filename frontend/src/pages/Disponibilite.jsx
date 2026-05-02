import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { DAYS, DAY_KEYS, TIME_SLOTS, AVAILABILITY_STATES, AVAILABILITY_BY_KEY, getWeekId } from "../lib/scheduleConstants";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Disponibilite() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [allUsers, setAllUsers] = useState([]); // [{uid, pseudo, photoURL}]
  const [availabilities, setAvailabilities] = useState({}); // { uid: { "mon-00:00": "available" } }
  const [selectedUid, setSelectedUid] = useState(null);
  const [activeState, setActiveState] = useState("available");

  const weekDate = new Date();
  weekDate.setDate(weekDate.getDate() + weekOffset * 7);
  const weekId = getWeekId(weekDate);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      setAllUsers(users);
      if (!selectedUid && user) setSelectedUid(user.uid);
    });
    return () => unsub();
  }, [user, selectedUid]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "availability", weekId, "users"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.id] = d.data().slots || {}; });
      setAvailabilities(map);
    });
    return () => unsub();
  }, [weekId]);

  const setSlot = async (day, slot, key) => {
    if (!user) return;
    const ref = doc(db, "availability", weekId, "users", user.uid);
    await setDoc(ref, { slots: { [`${day}-${slot}`]: key } }, { merge: true });
  };

  const myView = selectedUid === user?.uid;
  const slotsToShow = availabilities[selectedUid] || {};

  return (
    <div className="max-w-7xl mx-auto" data-testid="dispo-page">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="label-3d mb-1">— État de la team —</div>
          <h1 className="page-title text-4xl md:text-5xl">Disponibilité</h1>
        </div>
        <div className="flex items-center gap-3">
          <button data-testid="dispo-prev-week" onClick={() => setWeekOffset((w) => w - 1)} className="btn-ghost">
            <ChevronLeft size={16} /> Sem.
          </button>
          <div className="font-display tracking-widest text-pink-200">{weekId}</div>
          <button data-testid="dispo-next-week" onClick={() => setWeekOffset((w) => w + 1)} className="btn-ghost">
            Sem. <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Members selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {allUsers.map((u) => (
          <button
            key={u.uid}
            data-testid={`dispo-member-${u.uid}`}
            onClick={() => setSelectedUid(u.uid)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-body transition ${
              selectedUid === u.uid
                ? "border-pink-500 bg-pink-600/30 text-white"
                : "border-pink-900/40 text-pink-200/70 hover:bg-pink-900/20"
            }`}
          >
            {u.photoURL ? (
              <img src={u.photoURL} className="w-5 h-5 rounded-full object-cover" alt="" />
            ) : (
              <span className="w-5 h-5 rounded-full bg-pink-900/40" />
            )}
            {u.pseudo || u.email}
            {u.uid === user?.uid && <span className="text-xs text-pink-300/70">(moi)</span>}
          </button>
        ))}
      </div>

      {/* My state selector (only when viewing own) */}
      {myView && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="label-3d">Action :</span>
          {AVAILABILITY_STATES.map((s) => (
            <button
              key={s.key}
              data-testid={`dispo-state-${s.key}`}
              onClick={() => setActiveState(s.key)}
              className="px-3 py-1.5 text-xs font-display tracking-wider uppercase border rounded transition"
              style={{
                borderColor: s.color + (activeState === s.key ? "" : "60"),
                background: activeState === s.key ? s.color + "30" : "transparent",
                color: s.color,
              }}
            >
              {s.label}
            </button>
          ))}
          <span className="text-xs text-pink-300/60 ml-2 font-body">Clique sur une case pour appliquer</span>
        </div>
      )}

      {/* Grid */}
      <div className="glass rounded-md p-4 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-center font-display tracking-widest text-pink-300 text-sm uppercase pb-3">
                {d}
              </div>
            ))}
          </div>
          {TIME_SLOTS.map((slot) => (
            <div key={slot} className="grid border-t border-pink-900/30" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
              <div className="py-2 pr-2 text-right text-xs text-pink-300/60 font-mono">{slot}</div>
              {DAY_KEYS.map((day) => {
                const cellKey = `${day}-${slot}`;
                const state = slotsToShow[cellKey];
                const cfg = state ? AVAILABILITY_BY_KEY[state] : null;
                const interactive = myView;
                return (
                  <button
                    key={cellKey}
                    data-testid={`dispo-cell-${cellKey}`}
                    disabled={!interactive}
                    onClick={() => interactive && setSlot(day, slot, activeState)}
                    className={`m-0.5 h-9 rounded-sm border transition ${interactive ? "hover:border-pink-400 cursor-pointer" : "cursor-default"}`}
                    style={
                      cfg
                        ? {
                            background: cfg.color + "40",
                            borderColor: cfg.color,
                            boxShadow: `0 0 8px ${cfg.color}40 inset`,
                          }
                        : { background: "rgba(255,45,117,0.04)", borderColor: "rgba(180, 30, 80, 0.25)" }
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
