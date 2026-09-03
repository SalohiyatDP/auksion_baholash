import { describe, it, expect } from "vitest";
import { calculateStartingPrice } from "../calculation";
import { pickAreaCoefficient, type AreaRow } from "../coefficient";
import { formatInteger, formatSom, formatDecimal } from "@/lib/format";

const AREA_ROWS: AreaRow[] = [
  { minArea: 0, maxArea: 1000, coefficientM: 1.0, description: "<1000" },
  { minArea: 1000, maxArea: 10000, coefficientM: 0.9, description: "1000-10000" },
  { minArea: 10000, maxArea: 50000, coefficientM: 0.8, description: "10000-50000" },
  { minArea: 50000, maxArea: null, coefficientM: 0.7, description: ">50000" },
];

describe("calculateStartingPrice", () => {
  it("Sharshara-1 namunasi (Excel B6 = 651 537 810)", () => {
    const r = calculateStartingPrice({
      s: 7700, t: 15, b: 5698, g: 1.0, f: 1.1, m: 0.9, e: 0,
    });
    expect(r.startingPrice).toBe(651537810);
    expect(r.formula).toContain("651");
  });

  it("E qo'shimcha xarajat qo'shiladi", () => {
    const r = calculateStartingPrice({
      s: 1000, t: 10, b: 5000, g: 1, f: 1, m: 1, e: 1_000_000,
    });
    expect(r.startingPrice).toBe(1000 * 10 * 5000 + 1_000_000);
  });
});

describe("pickAreaCoefficient — Excel IF mantig'iga moslik", () => {
  const cases: Array<[number, number]> = [
    [999, 1.0],
    [1000, 0.9],
    [7700, 0.9],
    [9999, 0.9],
    [10000, 0.8],
    [50000, 0.8], // <=50000 => 0.8
    [50001, 0.7],
    [200000, 0.7],
  ];
  for (const [area, expected] of cases) {
    it(`${area} kv.m => M=${expected}`, () => {
      expect(pickAreaCoefficient(area, AREA_ROWS)?.coefficientM).toBe(expected);
    });
  }
});

describe("format", () => {
  it("formatInteger", () => {
    expect(formatInteger(651537810)).toBe("651\u00A0537\u00A0810");
  });
  it("formatSom", () => {
    expect(formatSom(651537810)).toBe("651\u00A0537\u00A0810\u00A0so'm");
  });
  it("formatDecimal", () => {
    expect(formatDecimal(1)).toBe("1,0");
    expect(formatDecimal(1.1)).toBe("1,1");
    expect(formatDecimal(0.9)).toBe("0,9");
  });
});
