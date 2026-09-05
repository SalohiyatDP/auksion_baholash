// Gektar yozuvi uchun "leader" (chizma-ko'rsatkich): uchi -> o'rtasi -> tepasi.
// Tepasida gorizontal chiziq (tag chiziq) va uning ustida gektar matni.

export type Pt = [number, number]; // [lat, lng]

export interface Leader {
  tip: Pt; // uchi (obyekt ustida)
  bend: Pt; // o'rtasi (siniq nuqta)
  top: Pt; // tepasi (matn/tag chiziq markazi)
}

export interface LabelStyle {
  lineColor: string;
  lineWidth: number; // px
  textColor: string;
  textSize: number; // px
}

export const DEFAULT_LABEL_STYLE: LabelStyle = {
  lineColor: "#1E40AF",
  lineWidth: 2,
  textColor: "#1E40AF",
  textSize: 16,
};

/** Markaz va bbox o'lchamiga qarab boshlang'ich leader joylashuvi */
export function defaultLeader(centroid: Pt, bboxH: number, bboxW: number): Leader {
  const h = Math.max(bboxH, 0.0006);
  const w = Math.max(bboxW, 0.0006);
  const tip: Pt = [centroid[0], centroid[1]];
  const top: Pt = [centroid[0] + h * 0.5, centroid[1]];
  const bend: Pt = [centroid[0] + h * 0.22, centroid[1] + w * 0.1];
  return { tip, bend, top };
}

/** JSON matnidan leader'larni xavfsiz o'qiydi (eski formatni e'tiborsiz qoldiradi) */
export function parseLeaders(str?: string | null): Record<string, Leader> {
  if (!str) return {};
  try {
    const obj = JSON.parse(str);
    const out: Record<string, Leader> = {};
    for (const k of Object.keys(obj || {})) {
      const v = obj[k];
      if (v && Array.isArray(v.tip) && Array.isArray(v.bend) && Array.isArray(v.top)) {
        out[k] = { tip: v.tip, bend: v.bend, top: v.top };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function parseStyle(str?: string | null): LabelStyle {
  if (!str) return { ...DEFAULT_LABEL_STYLE };
  try {
    const o = JSON.parse(str);
    return {
      lineColor: typeof o.lineColor === "string" ? o.lineColor : DEFAULT_LABEL_STYLE.lineColor,
      lineWidth: Number(o.lineWidth) || DEFAULT_LABEL_STYLE.lineWidth,
      textColor: typeof o.textColor === "string" ? o.textColor : DEFAULT_LABEL_STYLE.textColor,
      textSize: Number(o.textSize) || DEFAULT_LABEL_STYLE.textSize,
    };
  } catch {
    return { ...DEFAULT_LABEL_STYLE };
  }
}
