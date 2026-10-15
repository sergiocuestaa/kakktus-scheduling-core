// src/booking.js
//
// Availability engine behind Kakktus bookings (public booking page and the
// WhatsApp AI assistant). The server recomputes everything here and never
// trusts slots sent by the browser or chosen by the AI.

import { isOpenDay, staffWorks } from "./schedule.js";

export const SLOT_STEP_MIN = 30;
export const MAX_DAYS_AHEAD = 60;
export const MIN_LEAD_MIN = 30; // no bookings with less than 30 minutes' notice
const NON_BLOCKING_STATUSES = ["no_show", "cancelled"];

export function toMin(hhmm) {
  const [h, m] = String(hhmm).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(mins) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

// Today's date (YYYY-MM-DD) and minutes since midnight in the business's time zone.
// `now` is injectable so the logic can be tested deterministically.
export function nowInZone(timeZone, now = new Date()) {
  const opts = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-CA", { ...opts, timeZone: timeZone || "America/Mexico_City" }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat("en-CA", { ...opts, timeZone: "UTC" }).formatToParts(now); // invalid zone in data
  }
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function bookableRange(business, now) {
  const z = nowInZone(business.timezone, now);
  return { today: z.date, nowMinutes: z.minutes, last: addDays(z.date, MAX_DAYS_AHEAD) };
}

// Staff free during [start, start + duration) that day, least-booked first (spreads the load).
// With `date`, only counts people whose work days and hours cover the slot.
export function freeStaffAt({ staffList, dayAppts, start, duration, date }) {
  const end = start + duration;
  if (date) staffList = staffList.filter((st) => staffWorks(st, date, start, end));
  const active = dayAppts.filter((a) => !NON_BLOCKING_STATUSES.includes(a.status));
  const overlaps = (a) => {
    const aStart = toMin(a.time);
    return start < aStart + (a.duration_minutes || 30) && end > aStart;
  };
  // A legacy appointment with no staff assigned blocks everyone.
  if (active.some((a) => !a.staff_id && overlaps(a))) return [];
  const load = (id) => active.filter((a) => a.staff_id === id).length;
  return staffList
    .filter((st) => !active.some((a) => a.staff_id === st.id && overlaps(a)))
    .sort((x, y) => load(x.id) - load(y.id));
}

// Free start times for a service of `duration` minutes on `date`.
export function computeSlots({ business, duration, staffList, dayAppts, date, now }) {
  const { today, nowMinutes, last } = bookableRange(business, now);
  if (date < today || date > last) return [];
  if (!isOpenDay(business, date)) return [];
  const open = toMin(business.hours_open || "09:00");
  const close = toMin(business.hours_close || "19:00");
  const slots = [];
  for (let t = open; t + duration <= close; t += SLOT_STEP_MIN) {
    if (date === today && t < nowMinutes + MIN_LEAD_MIN) continue;
    if (freeStaffAt({ staffList, dayAppts, start: t, duration, date }).length > 0) slots.push(toHHMM(t));
  }
  return slots;
}
