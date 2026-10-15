// src/phone.js
// Phone numbers in WhatsApp format (digits only, with country code).
// Mexico: WhatsApp sometimes sends "521" + 10 digits and sometimes "52" + 10.
// To avoid duplicate clients, both forms are looked up.

// Normalizes whatever comes from an Excel/CSV import into WhatsApp format.
// Works for national numbers from any country: Mexico (10 digits), Estonia,
// Latvia and Lithuania (7–8), UK or Australia (leading 0), etc.
export function normalizePhone(raw, defaultCc = "52") {
  const s = String(raw ?? "").trim();
  let d = s.replace(/\D/g, "");
  const ok = (x) => (x.length >= 8 && x.length <= 15 ? x : "");
  if (!d) return "";
  if (s.startsWith("+")) return ok(d);
  if (d.startsWith("00")) return ok(d.slice(2));
  const cc = String(defaultCc || "").replace(/\D/g, "");
  if (!cc) return ok(d);
  // Already has the country code (in Mexico, 10 digits is always a national number).
  if (d.startsWith(cc) && d.length - cc.length >= 7 && !(cc === "52" && d.length === 10)) return ok(d);
  d = d.replace(/^0+/, ""); // national trunk prefix "0" (UK, Ireland, Australia, NZ…)
  if (cc === "370" && d.length === 9 && d.startsWith("8")) d = d.slice(1); // Lithuania: "8 6xx…"
  return ok(cc + d);
}

export function phoneVariants(p) {
  const d = String(p || "").replace(/\D/g, "");
  if (!d) return [];
  const out = new Set([d]);
  if (d.startsWith("521") && d.length === 13) out.add("52" + d.slice(3));
  if (d.startsWith("52") && d.length === 12) out.add("521" + d.slice(2));
  if (d.startsWith("549") && d.length === 13) out.add("54" + d.slice(3));
  if (d.startsWith("54") && d.length === 12) out.add("549" + d.slice(2));
  return [...out];
}
