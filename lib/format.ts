// O'zbekcha raqam formatlash yordamchilari.
// Mingliklar ajratgichi: bo'linmaydigan bo'sh joy (NBSP, U+00A0)
// O'nlik ajratgichi: vergul (,)

const NBSP = "\u00A0";

/** Butun sonni mingliklar bilan formatlaydi: 651537810 -> "651 537 810" */
export function formatInteger(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();
  const parts: string[] = [];
  for (let i = digits.length; i > 0; i -= 3) {
    parts.unshift(digits.slice(Math.max(0, i - 3), i));
  }
  return sign + parts.join(NBSP);
}

/** Narxni "so'm" bilan: 651537810 -> "651 537 810 so'm" */
export function formatSom(value: number): string {
  return `${formatInteger(value)}${NBSP}so'm`;
}

/**
 * Koeffitsiyent/o'nlik son: verguldan foydalanadi.
 * minDecimals >= 1 bo'lsa, kamida shuncha o'nlik ko'rsatiladi (masalan 1 -> "1,0").
 */
export function formatDecimal(value: number, minDecimals = 1, maxDecimals = 4): string {
  const fixed = value.toFixed(maxDecimals);
  // ortiqcha nollarni olib tashlaymiz, lekin minDecimals ni saqlaymiz
  let [intPart, decPart = ""] = fixed.split(".");
  decPart = decPart.replace(/0+$/, "");
  while (decPart.length < minDecimals) decPart += "0";
  const intFormatted = formatInteger(Number(intPart));
  return decPart.length > 0 ? `${intFormatted},${decPart}` : intFormatted;
}

/** Maydonni gektarda: 0.77 -> "0,77" (2 o'nlik) */
export function formatHectare(value: number): string {
  return formatDecimal(value, 2, 4);
}

/** Sana: 03.09.2026 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/** NBSP larni oddiy bo'sh joyga aylantirish (kerak bo'lganda) */
export function normalizeSpaces(s: string): string {
  return s.replace(/\u00A0/g, " ");
}
