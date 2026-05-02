import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { DAYS, DAY_KEYS, TIME_SLOTS, EVENT_TYPES, EVENT_BY_KEY, getWeekId } from "../lib/scheduleConstants";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function Planning() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState({}); // { "mon-00:00": "mixte", ... }
  const [picker, setPicker] = useState(null); // { day, slot }

  // compute week date
  const weekDate = new Date();
  weekDate.setDate(weekDate.getDate() + weekOffset * 7);
  const weekId = getWeekId(weekDate);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "planning", weekId);
    const unsub = onSnapshot(ref, (snap) => {
      setEvents(snap.exists() ? snap.data().events || {} : {});
    });
    return () => unsub();
  }, [user, weekId]);

  const setSlot = async (day, slot, eventKey) => {
    const ref = doc(db, "planning", weekId);
    const key = `events.${day}-${slot}`;
    if (eventKey === null) {
      await setDoc(ref, { events: {} }, { merge: true });
      await setDoc(ref, { [`events`]: { [`${day}-${slot}`]: deleteField() } }, { merge: true });
    } else {
      await setDoc(
        ref,
        {
          weekId,
          events: { [`${day}-${slot}`]: { type: eventKey, by: user.uid, at: Date.now() } },
        },
        { merge: true }
      );
    }
    setPicker(null);
  };

  return (
    <div className="max-w-7xl mx-auto" data-testid="planning-page">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="label-3d mb-1">— Calendrier de la team —</div>
          <h1 className="page-title text-4xl md:text-5xl">Planning</h1>
        </div>
        <div className="flex items-center gap-3">
          <button data-testid="planning-prev-week" onClick={() => setWeekOffset((w) => w - 1)} className="btn-ghost">
            <ChevronLeft size={16} /> Sem.
          </button>
          <div data-testid="planning-week-id" className="font-display tracking-widest text-pink-200">{weekId}</div>
          <button data-testid="planning-next-week" onClick={() => setWeekOffset((w) => w + 1)} className="btn-ghost">
            Sem. <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {EVENT_TYPES.map((e) => (
          <span
            key={e.key}
            className="flex items-center gap-2 px-3 py-1 text-xs font-display tracking-wider uppercase border rounded-full"
            style={{ borderColor: e.color + "80", color: e.color, background: e.color + "15" }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: e.color, boxShadow: `0 0 8px ${e.glow}` }} />
            {e.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="glass rounded-md p-4 overflow-x-auto" data-testid="planning-grid">
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
                const ev = events[cellKey];
                const evType = ev ? EVENT_BY_KEY[ev.type] : null;
                return (
                  <button
                    key={cellKey}
                    data-testid={`planning-cell-${cellKey}`}
                    onClick={() => setPicker({ day, slot })}
                    className="m-0.5 h-9 rounded-sm border border-pink-900/40 hover:border-pink-500/70 transition relative text-[10px] font-display tracking-wider uppercase"
                    style={
                      evType
                        ? {
                            background: `linear-gradient(135deg, ${evType.color}55, ${evType.color}25)`,
                            borderColor: evType.color,
                            color: "#fff",
                            boxShadow: `0 0 12px ${evType.glow} inset`,
                          }
                        : { background: "rgba(255,45,117,0.04)" }
                    }
                  >
                    {evType ? evType.label.split(" ").slice(-1)[0] : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Picker Modal */}
      {picker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPicker(null)}
          data-testid="planning-picker"
        >
          <div className="glass-deep p-6 rounded-md max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="label-3d">Créneau</div>
                <div className="font-display text-xl text-white">
                  {DAYS[DAY_KEYS.indexOf(picker.day)]} — {picker.slot}
                </div>
              </div>
              <button onClick={() => setPicker(null)} className="text-pink-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map((e) => (
                <button
                  key={e.key}
                  data-testid={`planning-event-${e.key}`}
                  onClick={() => setSlot(picker.day, picker.slot, e.key)}
                  className="p-3 text-left text-sm font-display tracking-wider uppercase border rounded transition hover:scale-[1.02]"
                  style={{
                    borderColor: e.color + "70",
                    background: e.color + "20",
                    color: "#fff",
                  }}
                >
                  <span className="block w-2 h-2 rounded-full mb-1.5" style={{ background: e.color, boxShadow: `0 0 8px ${e.color}` }} />
                  {e.label}
                </button>
              ))}
              <button
                data-testid="planning-event-clear"
                onClick={() => setSlot(picker.day, picker.slot, null)}
                className="p-3 text-sm font-display tracking-wider uppercase border border-pink-900/40 text-pink-200/70 rounded hover:bg-pink-900/20"
              >
                Effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
