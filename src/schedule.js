// src/schedule.js
//
// Which days a business is open and when each staff member works.
// Every route that computes free slots (public booking page, WhatsApp AI,
// dashboard) goes through these helpers, so nobody gets booked on a closed
// day or with someone who is off at that hour.
// No Node-only APIs: runs in the browser and on the server.

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]; // 0 = Sunday

const toMin = (hhmm) => {
  const [h, m] = String(hhmm).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

export function weekdayOf(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// Not configured = open every day (keeps older businesses working).
export function openDays(business) {
  const d = business?.open_days;
  return Array.isArray(d) && d.length ? d.map(Number) : ALL_DAYS;
}

export function isOpenDay(business, dateStr) {
  return openDays(business).includes(weekdayOf(dateStr));
}

// Does this staff member work that day, for the whole [start, end) range in minutes?
export function staffWorks(st, dateStr, start, end) {
  if (Array.isArray(st?.work_days) && st.work_days.length && !st.work_days.map(Number).includes(weekdayOf(dateStr))) return false;
  if (st?.work_start && start < toMin(st.work_start)) return false;
  if (st?.work_end && end > toMin(st.work_end)) return false;
  return true;
}

const DAY_NAMES = {
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

// Human text the AI uses in replies: "Monday to Saturday", "Monday, Wednesday and Friday", "every day".
export function openDaysText(business, lang = "es") {
  const days = [...new Set(openDays(business))].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)); // week starts Monday
  const names = DAY_NAMES[lang] || DAY_NAMES.es;
  if (days.length === 7) return lang === "en" ? "every day" : "todos los días";
  const order = days.map((d) => (d + 6) % 7);
  const consecutive = order.every((v, i) => i === 0 || v === order[i - 1] + 1);
  if (consecutive && days.length >= 3) {
    const [first, last] = [names[days[0]], names[days[days.length - 1]]];
    return lang === "en" ? `${first} to ${last}` : `${first} a ${last}`;
  }
  const list = days.map((d) => names[d]);
  const and = lang === "en" ? " and " : " y ";
  return list.length > 1 ? `${list.slice(0, -1).join(", ")}${and}${list[list.length - 1]}` : list[0];
}
