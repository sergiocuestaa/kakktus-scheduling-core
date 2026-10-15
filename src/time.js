// src/time.js
//
// Turns "2026-10-07" + "15:30" in the local time of `timeZone` into a real UTC instant.
// Used to schedule WhatsApp reminders correctly for businesses in any time zone.
export function zonedToUtc(dateStr, timeStr, timeZone) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm || 0, 0);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const offsetAt = (ts) => {
    const parts = Object.fromEntries(fmt.formatToParts(new Date(ts)).map((p) => [p.type, p.value]));
    const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    return asUtc - ts;
  };
  let ts = guess - offsetAt(guess);
  ts = guess - offsetAt(ts); // second pass in case we're near a DST change
  return new Date(ts);
}
