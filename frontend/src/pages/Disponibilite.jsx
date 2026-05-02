import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  DAYS,
  DAY_KEYS,
  TIME_SLOTS,
  AVAILABILITY_STATES,
  AVAILABILITY_BY_KEY,
  getWeekId,
} from "../lib/scheduleConstants";
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles } from "lucide-react";

/* ----------------------------- Utils (inchangés) ---------------------------- */

function getWeekDates(weekOffset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a, b) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function formatRange(dates) {
  const first = dates[0];
  const last = dates[dates.length - 1];
  const dd = (d) => String(d.getDate()).padStart(2, "0");
  const mm = (d) => String(d.getMonth() + 1).padStart(2, "0");
  return `${dd(first)}/${mm(first)} → ${dd(last)}/${mm(last)}`;
}

function formatDayLabel(date, dayName, isToday) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return (
    <div
      className={`flex flex-col items-center justify-center py-2 rounded-md transition ${
        isToday
          ? "bg-pink-500/10 ring-1 ring-pink-400/50"
          : "ring-1 ring-transparent"
      }`}
    >
      <span
        className={`font-display text-xs tracking-[0.2em] uppercase ${
          isToday ? "text-pink-200" : "text-pink-200/70"
        }`}
      >
        {dayName}
      </span>
      <span
        className={`font-body text-[11px] mt-0.5 ${
          isToday ? "text-pink-100" : "text-pink-200/40"
        }`}
      >
        {dd}/{mm}
      </span>
    </div>
  );
}

function getInitials(u) {
  const src = u?.pseudo || u?.email || "?";
  return src
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "?";
}

/* --------------------------------- Component -------------------------------- */

export default function Disponibilite() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [availabilities, setAvailabilities] = useState({});
  const [selectedUid, setSelectedUid] = useState(null);
  const [activeState, setActiveState] = useState("available");

  const weekDate = new Date();
  weekDate.setDate(weekDate.getDate() + weekOffset * 7);
  const weekId = getWeekId(weekDate);
  const weekDates = getWeekDates(weekOffset);
  const today = new Date();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      setAllUsers(users);
      if (!selectedUid && user) setSelectedUid(user.uid);
    });
    return () => unsub();
  }, [user, selectedUid]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "availability", weekId, "users"),
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = d.data().slots || {};
        });
        setAvailabilities(map);
      }
    );
    return () => unsub();
  }, [weekId]);

  const setSlot = async (day, slot, key) => {
    if (!user) return;
    const ref = doc(db, "availability", weekId, "users", user.uid);
    await setDoc(ref, { slots: { [`${day}-${slot}`]: key } }, { merge: true });
  };

  const myView = selectedUid === user?.uid;
  const slotsToShow = availabilities[selectedUid] || {};
  const activeCfg = AVAILABILITY_BY_KEY[activeState];

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Subtle background flourishes (CSS only, no deps) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(600px 200px at 80% -10%, rgba(255,45,117,0.10), transparent 60%), radial-gradient(500px 180px at 0% 0%, rgba(255,45,117,0.06), transparent 60%)",
        }}
      />

      {/* ------------------------------- Header ------------------------------- */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-pink-300/70 font-display text-xs tracking-[0.3em] uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>— État de la team —</span>
        </div>

        <div className="mt-3 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-none tracking-tight">
              Disponibilité
            </h1>
            <p className="mt-2 font-body text-sm text-pink-200/60 max-w-xl">
              Sélectionne une action puis clique sur les créneaux pour mettre à
              jour ton agenda de la semaine.
            </p>
          </div>

          {/* Week navigator */}
          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="btn-ghost group flex items-center gap-1 px-3 py-2 rounded-md border border-pink-900/40 hover:border-pink-500/60 hover:bg-pink-500/10 transition"
              aria-label="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4 transition group-hover:-translate-x-0.5" />
              <span className="font-display text-xs tracking-widest uppercase">
                Sem.
              </span>
            </button>

            <div className="flex flex-col items-center px-4 py-2 rounded-md border border-pink-900/40 bg-pink-950/20 min-w-[170px]">
              <div className="flex items-center gap-1.5 text-pink-300/70">
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="font-display text-[10px] tracking-[0.25em] uppercase">
                  {weekId}
                </span>
              </div>
              <span className="mt-0.5 font-body text-sm text-pink-100">
                {formatRange(weekDates)}
              </span>
            </div>

            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="btn-ghost group flex items-center gap-1 px-3 py-2 rounded-md border border-pink-900/40 hover:border-pink-500/60 hover:bg-pink-500/10 transition"
              aria-label="Semaine suivante"
            >
              <span className="font-display text-xs tracking-widest uppercase">
                Sem.
              </span>
              <ChevronRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* --------------------------- Members selector ------------------------- */}
      <section className="mb-6">
        <div className="font-display text-[11px] tracking-[0.25em] uppercase text-pink-300/60 mb-2">
          Membres
        </div>
        <div className="flex flex-wrap gap-2">
          {allUsers.map((u) => {
            const active = selectedUid === u.uid;
            const isMe = u.uid === user?.uid;
            return (
              <button
                key={u.uid}
                onClick={() => setSelectedUid(u.uid)}
                className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-sm font-body transition duration-200 ${
                  active
                    ? "border-pink-400 bg-pink-600/25 text-white shadow-[0_0_0_3px_rgba(255,45,117,0.12)]"
                    : "border-pink-900/40 text-pink-200/70 hover:bg-pink-900/20 hover:border-pink-700/60"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[11px] font-display tracking-wider ${
                    active
                      ? "bg-pink-500/40 text-white"
                      : "bg-pink-900/30 text-pink-200/80"
                  }`}
                >
                  {u.photoURL ? (
                    <img
                      src={u.photoURL}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(u)
                  )}
                </span>
                <span className="leading-none">
                  {u.pseudo || u.email}
                  {isMe && (
                    <span className="ml-1 text-[10px] tracking-widest uppercase text-pink-300/70">
                      (moi)
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ------------------------- My state selector ------------------------- */}
      {myView && (
        <section className="mb-6 p-4 rounded-lg border border-pink-900/40 bg-pink-950/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-display text-[11px] tracking-[0.25em] uppercase text-pink-300/70">
                Action
              </span>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABILITY_STATES.map((s) => {
                  const isActive = activeState === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActiveState(s.key)}
                      className="px-3 py-1.5 text-[11px] font-display tracking-[0.18em] uppercase border rounded-md transition duration-200"
                      style={{
                        borderColor: s.color + (isActive ? "" : "55"),
                        background: isActive
                          ? s.color + "33"
                          : "transparent",
                        color: s.color,
                        boxShadow: isActive
                          ? `0 0 0 3px ${s.color}1A, 0 0 12px ${s.color}33 inset`
                          : "none",
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 text-pink-200/60 font-body text-xs">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: activeCfg?.color || "#ff2d75" }}
              />
              Clique sur une case pour appliquer
              {activeCfg && (
                <span
                  className="font-display tracking-widest uppercase text-[10px]"
                  style={{ color: activeCfg.color }}
                >
                  · {activeCfg.label}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------- Grid -------------------------------- */}
      <section className="rounded-lg border border-pink-900/40 bg-pink-950/10 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Header row */}
            <div
              className="grid border-b border-pink-900/40 bg-pink-950/30"
              style={{ gridTemplateColumns: "90px repeat(7, minmax(0, 1fr))" }}
            >
              <div className="px-3 py-2 font-display text-[10px] tracking-[0.25em] uppercase text-pink-300/60">
                Heure
              </div>
              {DAYS.map((d, i) => (
                <div key={d} className="px-1.5 py-1.5">
                  {formatDayLabel(weekDates[i], d, isSameDay(weekDates[i], today))}
                </div>
              ))}
            </div>

            {/* Body rows */}
            {TIME_SLOTS.map((slot, rowIdx) => (
              <div
                key={slot}
                className={`grid border-b border-pink-900/30 last:border-b-0 ${
                  rowIdx % 2 === 0 ? "bg-transparent" : "bg-pink-950/15"
                }`}
                style={{
                  gridTemplateColumns: "90px repeat(7, minmax(0, 1fr))",
                }}
              >
                <div className="px-3 py-2 flex items-center font-display text-xs tracking-widest text-pink-200/70">
                  {slot}
                </div>
                {DAY_KEYS.map((day, i) => {
                  const cellKey = `${day}-${slot}`;
                  const state = slotsToShow[cellKey];
                  const cfg = state ? AVAILABILITY_BY_KEY[state] : null;
                  const interactive = myView;
                  const isToday = isSameDay(weekDates[i], today);
                  return (
                    <button
                      key={cellKey}
                      type="button"
                      onClick={() =>
                        interactive && setSlot(day, slot, activeState)
                      }
                      className={`m-0.5 h-9 rounded-sm border transition duration-150 ${
                        interactive
                          ? "hover:border-pink-300 hover:scale-[1.02] cursor-pointer"
                          : "cursor-default"
                      } ${isToday ? "ring-1 ring-pink-500/15" : ""}`}
                      style={
                        cfg
                          ? {
                              background: cfg.color + "40",
                              borderColor: cfg.color,
                              boxShadow: `0 0 8px ${cfg.color}40 inset`,
                            }
                          : {
                              background: "rgba(255,45,117,0.04)",
                              borderColor: "rgba(180, 30, 80, 0.25)",
                            }
                      }
                      aria-label={`${day} ${slot}${
                        cfg ? ` — ${cfg.label}` : ""
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- Legend ------------------------------- */}
      <section className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="font-display text-[10px] tracking-[0.25em] uppercase text-pink-300/60">
          Légende
        </span>
        {AVAILABILITY_STATES.map((s) => (
          <div
            key={s.key}
            className="flex items-center gap-2 font-body text-xs text-pink-200/70"
          >
            <span
              className="inline-block w-3.5 h-3.5 rounded-sm border"
              style={{
                background: s.color + "40",
                borderColor: s.color,
                boxShadow: `0 0 6px ${s.color}40 inset`,
              }}
            />
            <span
              className="font-display tracking-[0.15em] uppercase text-[10px]"
              style={{ color: s.color }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
