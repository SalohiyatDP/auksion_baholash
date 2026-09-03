import type { CalculationInput, CalculationResult } from "@/types";
import { formatInteger, formatSom, formatDecimal } from "@/lib/format";

/**
 * Asosiy formula (Excel `хисоблаш` varag'i B6 yacheykasidan aynan olingan):
 *   C = S × T × B × G × F × M + E
 *
 * Bu funksiya SOF (pure) — ma'lumotlar bazasiga bog'liq emas va mustaqil testlanadi.
 */
export const FORMULA_TEMPLATE = "C = S × T × B × G × F × M + E";
const TIMES = "\u00D7"; // ×

export function calculateStartingPrice(
  input: CalculationInput
): CalculationResult {
  const { s, t, b, g, f, m, e } = input;

  const startingPrice = s * t * b * g * f * m + e;

  const formula =
    `C = ${formatInteger(s)} ${TIMES} ${formatInteger(t)} ${TIMES} ${formatInteger(b)} ` +
    `${TIMES} ${formatDecimal(g)} ${TIMES} ${formatDecimal(f)} ${TIMES} ${formatDecimal(m)} ` +
    `+ ${formatInteger(e)} = ${formatSom(startingPrice)}`;

  return {
    input,
    startingPrice,
    formattedPrice: formatSom(startingPrice),
    formula,
    formulaTemplate: FORMULA_TEMPLATE,
  };
}
