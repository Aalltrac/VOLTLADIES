// Time slot helpers — slots from 00:00 to 23:20, every 40 minutes
export const DAYS = [\"Lundi\", \"Mardi\", \"Mercredi\", \"Jeudi\", \"Vendredi\", \"Samedi\", \"Dimanche\"];
export const DAY_KEYS = [\"mon\", \"tue\", \"wed\", \"thu\", \"fri\", \"sat\", \"sun\"];

export const TIME_SLOTS = (() => {
  const slots = [];
  // 24h * 60min = 1440min ; step 40 → 36 slots, last one 23:20
  for (let m = 0; m < 24 * 60; m += 40) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    slots.push(`${String(h).padStart(2, \"0\")}:${String(mm).padStart(2, \"0\")}`);
  }
  return slots;
})();

export const EVENT_TYPES = [
  { key: \"mixte\", label: \"Session Mixte\", color: \"#ec4899\", glow: \"rgba(236, 72, 153, 0.5)\" },
  { key: \"scrim\", label: \"Session Scrim\", color: \"#f43f5e\", glow: \"rgba(244, 63, 94, 0.5)\" },
  { key: \"is\", label: \"Session IS\", color: \"#a855f7\", glow: \"rgba(168, 85, 247, 0.5)\" },
  { key: \"ligue\", label: \"Ligue Locale\", color: \"#3b82f6\", glow: \"rgba(59, 130, 246, 0.5)\" },
  { key: \"coaching\", label: \"Coaching\", color: \"#10b981\", glow: \"rgba(16, 185, 129, 0.5)\" },
  { key: \"tournoi\", label: \"Tournois\", color: \"#f59e0b\", glow: \"rgba(245, 158, 11, 0.5)\" },
  { key: \"evenement\", label: \"Évènement\", color: \"#06b6d4\", glow: \"rgba(6, 182, 212, 0.5)\" },
];

export const EVENT_BY_KEY = Object.fromEntries(EVENT_TYPES.map((e) => [e.key, e]));

export const AVAILABILITY_STATES = [
  { key: \"available\", label: \"Disponible\", color: \"#10b981\" },
  { key: \"unavailable\", label: \"Indisponible\", color: \"#ef4444\" },
  { key: \"uncertain\", label: \"Incertain\", color: \"#f59e0b\" },
];

export const AVAILABILITY_BY_KEY = Object.fromEntries(AVAILABILITY_STATES.map((a) => [a.key, a]));

// Get current ISO week id
export function getWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, \"0\")}`;
}
