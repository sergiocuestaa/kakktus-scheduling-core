// src/detectLang.js
//
// Conversation language, decided on the server so the AI doesn't drift:
// messages like "10", "ok" or "👍" have no language, so we use the latest
// client message that does. The result is passed to the AI as an explicit
// instruction ("reply only in French").
// Supports Spanish, English, French, Portuguese, Italian, German, Estonian,
// Latvian, Lithuanian (+ Russian by script).

const WORDS = {
  es: "el la los las de del que y en un una por para con no es mi me te se lo le su al como pero quiero puedo tienen tiene hay hola gracias buenas buenos dias tardes noches cita cuanto cuánto cuesta precio mañana hoy hora horario favor por favor quisiera necesito sí si está esta este eso qué cuándo dónde agendar reservar".split(" "),
  en: "the a an and is are to for of in on at with my me you your i i'm im it this that do does can could would like want need have has hi hello hey thanks thank please appointment book booking tomorrow today time what when where how much price available availability yes no".split(" "),
  fr: "le la les un une des de du et est je tu vous nous il elle pour avec dans sur pas que qui quoi quand où combien bonjour bonsoir salut merci rendez-vous demain aujourd'hui heure prix voudrais veux peux pouvez oui non s'il plaît c'est j'ai".split(" "),
  pt: "o a os as um uma de do da dos das e é em no na para com não que eu você vocês meu minha obrigado obrigada olá oi bom dia boa tarde noite quero posso tem amanhã hoje hora preço quanto custa marcar agendar sim".split(" "),
  it: "il lo la gli le un una di del della e è in per con non che io tu voi mio mia grazie ciao buongiorno buonasera vorrei voglio posso avete domani oggi ora prezzo quanto costa prenotare appuntamento sì".split(" "),
  de: "der die das ein eine und ist ich du sie wir mit für nicht zu auf von wie was wann wo hallo danke bitte guten tag morgen heute uhr termin preis möchte kann haben ja nein".split(" "),
  et: "ja on ei see et ma mina sa sina te teie me meie kas mis millal kus tere aitäh palun homme täna aeg hind broneerida tahan saan jah".split(" "),
  lv: "un ir es tu jūs mēs ar uz no par kā kas kad kur sveiki labdien paldies lūdzu rīt šodien laiks cena vēlos varu jā nē".split(" "),
  lt: "ir yra aš tu jūs mes su į iš apie kaip kas kada kur labas sveiki ačiū prašau rytoj šiandien laikas kaina noriu galiu taip ne".split(" "),
};

const NAMES = {
  es: { es: "español", en: "Spanish" },
  en: { es: "inglés", en: "English" },
  fr: { es: "francés", en: "French" },
  pt: { es: "portugués", en: "Portuguese" },
  it: { es: "italiano", en: "Italian" },
  de: { es: "alemán", en: "German" },
  et: { es: "estonio", en: "Estonian" },
  lv: { es: "letón", en: "Latvian" },
  lt: { es: "lituano", en: "Lithuanian" },
  ru: { es: "ruso", en: "Russian" },
};

const SETS = Object.fromEntries(Object.entries(WORDS).map(([k, v]) => [k, new Set(v)]));

// Letters specific to a language add extra points.
const MARKS = [
  [/[ñ¿¡]/i, "es", 3],
  [/[çœ]|[àèù]/i, "fr", 2],
  [/[ãõ]/i, "pt", 2],
  [/ß/i, "de", 3],
  [/[äöü]/i, "de", 1],
  [/[õäöü]/i, "et", 1],
  [/[āēīūģķļņ]/i, "lv", 3],
  [/[ąęėįųū]/i, "lt", 3],
];

// Language of a single message, or null when it can't be told with confidence.
export function detectMessageLang(text) {
  // Strip system tags like "[Voice note]" or "[Photo]" (not written by the client).
  const s = String(text || "").replace(/\[[^\]]{1,40}\]/g, " ").toLowerCase();
  if (/[а-яё]/i.test(s)) return "ru";
  const words = s.match(/[a-zà-ÿāēīūģķļņšžąęėįųœß']+/gi) || [];
  if (!words.length) return null;
  const score = Object.fromEntries(Object.keys(SETS).map((k) => [k, 0]));
  for (const w of words) for (const k in SETS) if (SETS[k].has(w)) score[k] += 1;
  for (const [re, k, pts] of MARKS) if (re.test(s)) score[k] += pts;
  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const [best, second] = ranked;
  if (best[1] === 0) return null;
  // A one-word message that exists in several languages ("no", "si") decides nothing.
  if (best[1] === second[1]) return null;
  return best[0];
}

// Conversation language: that of the latest client message with a clear language.
// messages: [{ role: "user" | "assistant", content }] in chronological order.
export function detectConversationLang(messages, fallback = null) {
  const list = Array.isArray(messages) ? messages : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    if (m?.role !== "user" || typeof m.content !== "string") continue;
    const l = detectMessageLang(m.content);
    if (l) return l;
  }
  return fallback;
}

export function langName(code, inLang = "es") {
  return NAMES[code]?.[inLang] || NAMES[code]?.en || code;
}
