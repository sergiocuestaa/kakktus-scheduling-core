import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSlots, freeStaffAt, nowInZone, addDays, toMin, toHHMM } from "../src/booking.js";

const business = { timezone: "America/Cancun", hours_open: "09:00", hours_close: "12:00", open_days: [1, 2, 3, 4, 5, 6] };
const staff = [{ id: "ana" }, { id: "luis" }];
// Monday 2026-10-19, 08:00 in Cancún (UTC-5)
const NOW = new Date("2026-10-19T13:00:00Z");

test("time helpers round-trip", () => {
  assert.equal(toMin("09:30"), 570);
  assert.equal(toHHMM(570), "09:30");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("nowInZone uses the business's time zone", () => {
  assert.deepEqual(nowInZone("America/Cancun", NOW), { date: "2026-10-19", minutes: 8 * 60 });
  assert.deepEqual(nowInZone("Europe/Tallinn", NOW), { date: "2026-10-19", minutes: 16 * 60 });
});

test("all slots free on an empty day", () => {
  const slots = computeSlots({ business, duration: 60, staffList: staff, dayAppts: [], date: "2026-10-20", now: NOW });
  assert.deepEqual(slots, ["09:00", "09:30", "10:00", "10:30", "11:00"]);
});

test("a slot disappears only when every staff member is busy", () => {
  const dayAppts = [
    { time: "10:00", duration_minutes: 60, staff_id: "ana", status: "confirmed" },
    { time: "10:00", duration_minutes: 60, staff_id: "luis", status: "confirmed" },
  ];
  const slots = computeSlots({ business, duration: 30, staffList: staff, dayAppts, date: "2026-10-20", now: NOW });
  assert.deepEqual(slots, ["09:00", "09:30", "11:00", "11:30"]);
});

test("cancelled and no-show appointments don't block", () => {
  const dayAppts = [{ time: "09:00", duration_minutes: 180, staff_id: null, status: "cancelled" }];
  const slots = computeSlots({ business, duration: 60, staffList: staff, dayAppts, date: "2026-10-20", now: NOW });
  assert.equal(slots.length, 5);
});

test("closed days return no slots", () => {
  const sunday = "2026-10-25";
  assert.deepEqual(computeSlots({ business, duration: 30, staffList: staff, dayAppts: [], date: sunday, now: NOW }), []);
});

test("no bookings in the past or with less than 30 minutes' notice", () => {
  const at0920 = new Date("2026-10-19T14:20:00Z"); // 09:20 in Cancún
  const slots = computeSlots({ business, duration: 30, staffList: staff, dayAppts: [], date: "2026-10-19", now: at0920 });
  assert.equal(slots[0], "10:00");
  assert.deepEqual(computeSlots({ business, duration: 30, staffList: staff, dayAppts: [], date: "2026-10-18", now: NOW }), []);
});

test("no bookings beyond 60 days ahead", () => {
  assert.deepEqual(computeSlots({ business, duration: 30, staffList: staff, dayAppts: [], date: "2027-01-01", now: NOW }), []);
});

test("staff work days and shifts are respected", () => {
  const list = [{ id: "ana", work_days: [2], work_start: "10:00" }];
  const tue = computeSlots({ business, duration: 60, staffList: list, dayAppts: [], date: "2026-10-20", now: NOW });
  assert.deepEqual(tue, ["10:00", "10:30", "11:00"]);
  const wed = computeSlots({ business, duration: 60, staffList: list, dayAppts: [], date: "2026-10-21", now: NOW });
  assert.deepEqual(wed, []);
});

test("free staff are sorted by least bookings to spread the load", () => {
  const dayAppts = [{ time: "11:00", duration_minutes: 30, staff_id: "ana", status: "confirmed" }];
  const free = freeStaffAt({ staffList: staff, dayAppts, start: toMin("09:00"), duration: 30 });
  assert.deepEqual(free.map((s) => s.id), ["luis", "ana"]);
});
