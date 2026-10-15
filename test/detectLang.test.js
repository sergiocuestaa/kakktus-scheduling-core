import { test } from "node:test";
import assert from "node:assert/strict";
import { detectMessageLang, detectConversationLang } from "../src/detectLang.js";

test("detects the language of a message", () => {
  assert.equal(detectMessageLang("Hola, ¿tienen cita mañana?"), "es");
  assert.equal(detectMessageLang("Hi! Do you have a spot tomorrow?"), "en");
  assert.equal(detectMessageLang("Bonjour, je voudrais un rendez-vous demain"), "fr");
  assert.equal(detectMessageLang("Tere, kas homme on aega?"), "et");
  assert.equal(detectMessageLang("Здравствуйте"), "ru");
});

test("messages without a clear language return null", () => {
  assert.equal(detectMessageLang("10"), null);
  assert.equal(detectMessageLang("👍"), null);
  assert.equal(detectMessageLang("no"), null);
});

test("conversation keeps the last clear language", () => {
  const messages = [
    { role: "user", content: "Hi, can I book for tomorrow?" },
    { role: "assistant", content: "Sure! 10:00 or 15:30?" },
    { role: "user", content: "10" },
  ];
  assert.equal(detectConversationLang(messages, "es"), "en");
  assert.equal(detectConversationLang([{ role: "user", content: "ok" }], "es"), "es");
});
