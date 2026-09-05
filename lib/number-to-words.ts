// Sonni o'zbekcha so'z bilan yozadi (rasmiy hujjatlarda narxni matnda ko'rsatish uchun).

const UNITS = ["", "bir", "ikki", "uch", "to'rt", "besh", "olti", "yetti", "sakkiz", "to'qqiz"];
const TENS = ["", "o'n", "yigirma", "o'ttiz", "qirq", "ellik", "oltmish", "yetmish", "sakson", "to'qson"];
const SCALES = ["", "ming", "million", "milliard", "trillion"];

function threeDigitToWords(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const t = Math.floor(rem / 10);
  const u = rem % 10;

  if (h > 0) parts.push(h === 1 ? "yuz" : `${UNITS[h]} yuz`);
  if (t > 0) parts.push(TENS[t]);
  if (u > 0) parts.push(UNITS[u]);

  return parts.join(" ");
}

/** Butun sonni o'zbekcha so'z bilan qaytaradi. Masalan 651537810 -> "olti yuz ellik bir million ..." */
export function numberToWordsUz(value: number): string {
  const n = Math.round(Math.abs(value));
  if (n === 0) return "nol";

  const groups: number[] = [];
  let x = n;
  while (x > 0) {
    groups.push(x % 1000);
    x = Math.floor(x / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const scale = SCALES[i];
    let words = threeDigitToWords(g);
    if (scale === "ming" && g === 1) words = ""; // 1000 -> "ming"
    parts.push([words, scale].filter(Boolean).join(" "));
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}
