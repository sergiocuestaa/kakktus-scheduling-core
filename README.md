# Kakktus — scheduling core

[![tests](https://github.com/sergiocuestaa/kakktus-scheduling-core/actions/workflows/test.yml/badge.svg)](https://github.com/sergiocuestaa/kakktus-scheduling-core/actions/workflows/test.yml)

The availability engine and language detection behind **[Kakktus](https://kakktus.com)**, a CRM for appointment-based businesses (barbershops, salons, clinics) with an AI assistant that answers clients on WhatsApp and books their appointments.

I designed and built Kakktus on my own. The full product is closed source; this repository is a cleaned-up extract of the parts with the most logic, shared so reviewers can read real production code and run its tests.

## What's in here

| Module | What it does |
| --- | --- |
| [`src/booking.js`](src/booking.js) | Computes free time slots for a service: opening hours, closed days, each staff member's work days and shift, overlapping appointments, minimum notice and a 60-day booking window. Picks the least-booked free staff member to spread the load. |
| [`src/schedule.js`](src/schedule.js) | Business open days and staff shifts, plus the human-readable text the AI uses ("Monday to Saturday"). |
| [`src/detectLang.js`](src/detectLang.js) | Detects the language of a WhatsApp conversation (9 languages + Russian) so the AI always replies in the client's language — even when the last message is just "ok", "10" or an emoji. |
| [`src/time.js`](src/time.js) | Converts a local date and time in any IANA time zone to UTC, handling daylight saving time. Used to schedule reminders. |
| [`src/phone.js`](src/phone.js) | Normalizes phone numbers from spreadsheets into WhatsApp format for several countries, and matches Mexico's two WhatsApp number formats to avoid duplicate clients. |

## Design decisions

- **The server is the source of truth.** Whether a slot comes from the public booking page or from the AI, the server recomputes availability with these functions before saving anything. The AI suggests; the code decides.
- **Pure functions, no I/O.** The modules take plain data (business, staff, appointments) and return plain data, so they run in the browser and on the server and are easy to test. Time is injectable (`now`) for deterministic tests.
- **Time zones are explicit.** Every business has its own time zone; "today" and "now" are always computed in that zone, never on the server's clock.

## How it fits in the product

```
WhatsApp client ──► WhatsApp Cloud API webhook ──► Next.js API route
                                                     │
                                  detectLang ◄───────┤
                                                     ▼
                                 OpenAI (tool calls: check availability, book)
                                                     │
                     booking / schedule ◄────────────┤  (server re-validates every slot)
                                                     ▼
                                        Supabase (PostgreSQL) ──► dashboard, reminders
```

Full stack: Next.js 15, React 19, Supabase (PostgreSQL, auth), OpenAI API, WhatsApp Cloud API, Stripe subscriptions, deployed on Vercel.

## Run the tests

Requires Node.js 20+. No dependencies to install.

```bash
npm test
```

## Author

Sergio Cuesta León · Tallinn, Estonia · [kakktus.com](https://kakktus.com)
