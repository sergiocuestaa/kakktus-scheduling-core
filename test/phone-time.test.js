import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, phoneVariants } from "../src/phone.js";
import { zonedToUtc } from "../src/time.js";

test("normalizes national numbers from several countries", () => {
  assert.equal(normalizePhone("998 123 4567", "52"), "529981234567");
  assert.equal(normalizePhone("+372 5388 0000"), "37253880000");
  assert.equal(normalizePhone("07700 900123", "44"), "447700900123");
  assert.equal(normalizePhone("8 612 34567", "370"), "37061234567");
  assert.equal(normalizePhone("123", "52"), "");
});

test("Mexican WhatsApp numbers match with and without the extra 1", () => {
  assert.deepEqual(phoneVariants("5219981234567").sort(), ["529981234567", "5219981234567"].sort());
});

test("local time converts to the right UTC instant, including DST", () => {
  assert.equal(zonedToUtc("2026-10-19", "10:00", "America/Cancun").toISOString(), "2026-10-19T15:00:00.000Z");
  assert.equal(zonedToUtc("2026-07-01", "10:00", "Europe/Tallinn").toISOString(), "2026-07-01T07:00:00.000Z");
  assert.equal(zonedToUtc("2026-12-01", "10:00", "Europe/Tallinn").toISOString(), "2026-12-01T08:00:00.000Z");
});
