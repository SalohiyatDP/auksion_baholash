// O'zbekcha lotin -> kirill transliteratsiyasi.
// Mukammal emas, ammo rasmiy hujjat matnlari uchun yetarli darajada aniq.

export type ScriptMode = "LATIN" | "CYRILLIC" | "BOTH";

// Ko'p harfli birikmalar (uzun -> qisqa tartibida)
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
  ["ng", "нг"],
];

const SINGLES: Record<string, string> = {
  a: "а", b: "б", d: "д", e: "е", f: "ф", g: "г", h: "ҳ", i: "и",
  j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ",
  r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з",
  c: "с",
};

function applyCase(cyr: string, latinMatch: string): string {
  const letters = latinMatch.replace(/[^a-zA-Z]/g, "");
  if (letters.length === 0) return cyr;
  const isAllUpper = letters === letters.toUpperCase() && letters.length > 1
    ? true
    : false;
  const firstUpper = letters[0] === letters[0].toUpperCase();
  if (isAllUpper) return cyr.toUpperCase();
  if (firstUpper) return cyr.charAt(0).toUpperCase() + cyr.slice(1);
  return cyr;
}

/** Lotin (o'zbek) matnini kirillga o'giradi */
export function latinToCyrillic(input: string): string {
  if (!input) return input;
  // Apostrof variantlarini bittaga keltiramiz
  let text = input.replace(/[’‘`ʼ]/g, "'");

  let out = "";
  let i = 0;
  while (i < text.length) {
    let matched = false;

    // Digraflar (masalan o', g', sh, ch)
    for (const [lat, cyr] of DIGRAPHS) {
      const slice = text.substr(i, lat.length);
      if (slice.toLowerCase() === lat) {
        out += applyCase(cyr, slice);
        i += lat.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = text[i];
    const lower = ch.toLowerCase();

    // Tutuq belgisi ' -> ъ (masalan ma'lumot -> маълумот)
    if (ch === "'") {
      out += "ъ";
      i += 1;
      continue;
    }

    if (SINGLES[lower]) {
      out += applyCase(SINGLES[lower], ch);
      i += 1;
      continue;
    }

    // Boshqa belgilar (raqam, tinish, ×, bo'shliq) o'zgarmaydi
    out += ch;
    i += 1;
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
  // BOTH
  return `${latin} / ${latinToCyrillic(latin)}`;
}

export const SCRIPT_LABELS: Record<ScriptMode, string> = {
  LATIN: "Lotin",
  CYRILLIC: "Kirill",
  BOTH: "Lotin + Kirill",
};
