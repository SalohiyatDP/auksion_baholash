// O'zbekcha lotin -> kirill transliteratsiyasi.
// Mukammal emas, ammo rasmiy hujjat matnlari uchun yetarli darajada aniq.

export type ScriptMode = "LATIN" | "CYRILLIC" | "BOTH";

// Ko'p harfli birikmalar (uzun -> qisqa tartibida).
// DIQQAT: "ng" birikmasi YO'Q — chunki n->н va g->г allaqachon "нг" beradi,
// aks holda "g'" (ғ) noto'g'ri ishlaydi (masalan boshlang'ich).
const DIGRAPHS: Array<[string, string]> = [
  ["o'", "ў"],
  ["g'", "ғ"],
  ["sh", "ш"],
  ["ch", "ч"],
  ["yo", "ё"],
  ["yu", "ю"],
  ["ya", "я"],
  ["ye", "е"],
  ["ts", "ц"],
];

const SINGLES: Record<string, string> = {
  a: "а", b: "б", d: "д", f: "ф", g: "г", h: "ҳ", i: "и",
  j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ",
  r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з",
  c: "с",
};

function applyCase(cyr: string, latinMatch: string): string {
  const letters = latinMatch.replace(/[^a-zA-Z]/g, "");
  if (letters.length === 0) return cyr;
  const isAllUpper = letters.length > 1 && letters === letters.toUpperCase();
  const firstUpper = letters[0] === letters[0].toUpperCase();
  if (isAllUpper) return cyr.toUpperCase();
  if (firstUpper) return cyr.charAt(0).toUpperCase() + cyr.slice(1);
  return cyr;
}

/** Lotin (o'zbek) matnini kirillga o'giradi */
export function latinToCyrillic(input: string): string {
  if (!input) return input;
  const text = input.replace(/[’‘`ʼ]/g, "'");

  let out = "";
  let i = 0;
  let atWordStart = true;

  // out dagi oxirgi harf katta harfmi (tutuq belgisi ъ/Ъ ni tanlash uchun)
  const lastLetterUpper = (): boolean => {
    for (let k = out.length - 1; k >= 0; k--) {
      const c = out[k];
      if (/[A-Za-zА-Яа-яЁёЎўҒғҚқҲҳ]/.test(c)) {
        return c === c.toUpperCase() && c !== c.toLowerCase();
      }
      if (!/\s/.test(c)) break; // harf bo'lmagan (bo'shliqdan boshqa) belgiga yetdik
    }
    return false;
  };

  while (i < text.length) {
    let matched = false;

    for (const [lat, cyr] of DIGRAPHS) {
      const slice = text.substr(i, lat.length);
      if (slice.toLowerCase() !== lat) continue;
      // "yo'" -> y + o' (ў), ya'ni "yo" ni bu yerda o'tkazib yuboramiz
      if (lat === "yo" && text[i + 2] === "'") continue;
      out += applyCase(cyr, slice);
      i += lat.length;
      atWordStart = false;
      matched = true;
      break;
    }
    if (matched) continue;

    const ch = text[i];
    const lower = ch.toLowerCase();

    // Tutuq belgisi ' -> ъ (masalan ma'lumot -> маълумот, MA'LUMOT -> МАЪЛУМОТ)
    if (ch === "'") {
      out += lastLetterUpper() ? "Ъ" : "ъ";
      i += 1;
      continue;
    }

    // "e": so'z boshida -> э (elektron -> электрон), aks holda -> е
    if (lower === "e") {
      const base = atWordStart ? "э" : "е";
      out += applyCase(base, ch);
      i += 1;
      atWordStart = false;
      continue;
    }

    if (SINGLES[lower]) {
      out += applyCase(SINGLES[lower], ch);
      i += 1;
      atWordStart = false;
      continue;
    }

    // Harf bo'lmagan belgi (raqam, tinish, ×, bo'shliq) — o'zgarmaydi, so'z chegarasi
    out += ch;
    i += 1;
    atWordStart = true;
  }

  return out;
}

/**
 * scriptMode ga qarab matnni qaytaradi.
 * BOTH -> "Lotin (Kirill)" ko'rinishida ikkalasini beradi.
 */
export function renderScript(latin: string, mode: ScriptMode): string {
  if (mode === "LATIN") return latin;
  if (mode === "CYRILLIC") return latinToCyrillic(latin);
  return `${latin} / ${latinToCyrillic(latin)}`;
}

export const SCRIPT_LABELS: Record<ScriptMode, string> = {
  LATIN: "Lotin",
  CYRILLIC: "Kirill",
  BOTH: "Lotin + Kirill",
};
