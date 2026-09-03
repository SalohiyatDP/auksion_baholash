"use client";

import * as React from "react";
import { formatInteger, formatHectare, formatDecimal } from "@/lib/format";
import { latinToCyrillic, type ScriptMode } from "@/lib/translit";
import { GeoMap } from "./geo-map";

export interface PreviewData {
  regionName: string;
  districtName: string;
  mfy: string;
  projectName: string;
  organization: string;
  projectPurpose: string;
  totalAreaHa: number;
  lotAreaM2: number;
  lotAreaHa: number;
  s: number;
  t: number;
  b: number;
  g: number;
  f: number;
  m: number;
  e: number;
  startingPrice: number;
  tDescription: string;
  fDescription: string;
  legalReference: string;
  formula: string;
  mapUrl?: string | null;
  scriptMode?: ScriptMode;
  totalGeoJson?: string | null;
  lotGeoJson?: string | null;
}

const ACCENT = "#1E40AF";

export function DocumentPreview({ data }: { data: PreviewData }) {
  const mode = data.scriptMode ?? "LATIN";
  const modes: ("LATIN" | "CYRILLIC")[] = mode === "BOTH" ? ["LATIN", "CYRILLIC"] : [mode];

  return (
    <div className="a4-preview">
      {/* Zamonaviy sarlavha lentasi */}
      <div style={{ margin: "-48px -56px 24px", padding: "22px 56px 16px", background: `linear-gradient(135deg, ${ACCENT}, #2563eb)`, color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, opacity: 0.9 }}>
          <span>YERAUKSION</span>
          <span>Elektron onlayn-auksion</span>
        </div>
      </div>

      {modes.map((sm, idx) => (
        <React.Fragment key={sm}>
          {idx > 0 && (
            <div style={{ borderTop: `2px dashed ${ACCENT}`, margin: "28px 0 20px", textAlign: "center", position: "relative" }}>
              <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "white", padding: "0 10px", fontSize: 11, color: ACCENT }}>
                КИРИЛЛ
              </span>
            </div>
          )}
          <TextBody data={data} mode={sm} />
        </React.Fragment>
      ))}

      {/* Xarita bo'limi (bir marta) */}
      <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 24, paddingTop: 18 }}>
        {data.totalGeoJson || data.lotGeoJson ? (
          <GeoMap totalGeoJson={data.totalGeoJson} lotGeoJson={data.lotGeoJson} height={340} />
        ) : data.mapUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.mapUrl} alt="Xarita" style={{ maxWidth: "100%", maxHeight: 420, display: "block", margin: "0 auto", borderRadius: 8, border: "1px solid #e2e8f0" }} />
        ) : (
          <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", color: "#94a3b8", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
            [ Xarita yuklanmagan — SHP/KMZ yoki rasm qo&apos;shing ]
          </div>
        )}
      </div>
    </div>
  );
}

function TextBody({ data, mode }: { data: PreviewData; mode: "LATIN" | "CYRILLIC" }) {
  const tr = (s: string) => (mode === "CYRILLIC" ? latinToCyrillic(s) : s);

  return (
    <div>
      {/* Sarlavha */}
      <div style={{ textAlign: "center", fontWeight: "bold", color: "#0f172a" }}>
        <div style={{ fontSize: 15 }}>{tr(`${data.regionName} ${data.districtName}`.toUpperCase())}</div>
        <div style={{ fontSize: 15 }}>{tr(`${data.mfy.toUpperCase()} HUDUDIDA JOYLASHGAN YER UCHASTKASINI`)}</div>
        <div style={{ fontSize: 15 }}>{tr("ELEKTRON ONLAYN-AUKSIONGA CHIQARISH TO'G'RISIDA")}</div>
        <div style={{ fontSize: 18, marginTop: 8, color: ACCENT }}>{tr("MA'LUMOT")}</div>
      </div>

      <p style={{ textAlign: "justify", textIndent: 28, marginTop: 18 }}>
        {tr(
          `${data.districtName} hududida ${data.projectPurpose} maqsadida "${data.organization}" davlat muassasasi nomiga belgilangan tartibda davlat ro'yxatidan o'tkazilgan jami ${formatHectare(data.totalAreaHa)} gektar yer maydonidan "${data.projectName}" dam olish maskanini tashkil etish uchun alohida lot sifatida ajratilgan ${formatHectare(data.lotAreaHa)} gektar (${formatInteger(data.lotAreaM2)} kv.metr) yer uchastkasini ijara huquqi asosida elektron onlayn-auksion savdolariga chiqarish yuzasidan boshlang'ich narxning dastlabki hisob-kitoblari amalga oshirildi.`
        )}
      </p>

      <p style={{ textAlign: "justify", textIndent: 28 }}>{tr(data.legalReference)}</p>

      <p style={{ textAlign: "center", fontWeight: "bold", margin: "12px 0", color: ACCENT }}>
        C = S × T × B × G × F × M + E
      </p>

      <p style={{ textAlign: "justify", textIndent: 28 }}>
        {tr("Mazkur formula bo'yicha hisob-kitob uchun quyidagi ko'rsatkichlar qabul qilindi:")}
      </p>

      <table style={{ marginTop: 8 }}>
        <thead>
          <tr style={{ background: ACCENT, color: "white", fontWeight: "bold", textAlign: "center" }}>
            <th style={{ width: "12%", border: "1px solid " + ACCENT }}>{tr("Belgi")}</th>
            <th style={{ width: "63%", border: "1px solid " + ACCENT }}>{tr("Ko'rsatkich")}</th>
            <th style={{ width: "25%", border: "1px solid " + ACCENT }}>{tr("Qiymat")}</th>
          </tr>
        </thead>
        <tbody>
          <Row belgi="S" k={tr("Yer uchastkasining maydoni")} v={`${formatInteger(data.s)} ${tr("kv. metr")}`} />
          <Row belgi="T" k={tr(`Hudud toifasi (${data.tDescription})`)} v={formatInteger(data.t)} />
          <Row belgi="B" k={tr("1 kv.metr uchun yuridik shaxslardan olinadigan yer solig'i stavkasi")} v={`${formatInteger(data.b)} ${tr("so'm")}`} />
          <Row belgi="G" k={tr("Muhandislik-kommunikatsiya tarmoqlari koeffitsiyenti")} v={formatDecimal(data.g)} />
          <Row belgi="F" k={tr(data.fDescription)} v={formatDecimal(data.f)} />
          <Row belgi="M" k={tr("Yer maydoni bo'yicha kamaytiruvchi koeffitsiyent")} v={formatDecimal(data.m)} />
          <Row belgi="E" k={tr("Yer uchastkasiga oid qo'shimcha xarajatlar")} v={`${formatInteger(data.e)} ${tr("so'm")}`} />
        </tbody>
      </table>

      <p style={{ textAlign: "justify", textIndent: 28, marginTop: 12 }}>
        {tr("Yuqoridagi ko'rsatkichlardan kelib chiqib, yer uchastkasining elektron onlayn-auksion savdolaridagi boshlang'ich narxi quyidagicha hisoblanadi:")}
      </p>

      <p style={{ textAlign: "center", fontWeight: "bold", margin: "10px 0" }}>{tr(data.formula)}</p>

      <div style={{ textAlign: "center", margin: "12px 0" }}>
        <span style={{ display: "inline-block", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", borderRadius: 8, padding: "8px 18px", fontWeight: "bold", fontSize: 16 }}>
          {tr("Boshlang'ich narx")}: {formatInteger(data.startingPrice)} {tr("so'm")}
        </span>
      </div>

      {/* Xarita sarlavhasi va legenda (matn) */}
      <p style={{ textAlign: "center", fontWeight: "bold", marginTop: 18 }}>
        {tr(`"${data.projectName}" dam olish maskanini tashkil etish uchun alohida lot sifatida ajratilgan ${formatHectare(data.lotAreaHa)} gektar (${formatInteger(data.lotAreaM2)} kv.metr) yer uchastkasi xaritasidan KO'CHIRMASI`)}
      </p>
      <p style={{ marginTop: 8 }}>
        <span style={{ color: "#dc2626", fontWeight: "bold" }}>— </span>
        {tr(`qizil chiziq bilan "${data.organization}"ga davlat ro'yxatidan o'tkazilgan jami ${formatHectare(data.totalAreaHa)} gektar yer maydoni ko'rsatilgan.`)}
      </p>
      <p>
        <span style={{ color: "#2563eb", fontWeight: "bold" }}>— </span>
        {tr(`ko'k chiziq bilan "${data.projectName}" dam olish maskanini tashkil etish uchun alohida lot sifatida ajratilgan ${formatHectare(data.lotAreaHa)} gektar yer maydoni ko'rsatilgan.`)}
      </p>
    </div>
  );
}

function Row({ belgi, k, v }: { belgi: string; k: string; v: string }) {
  return (
    <tr>
      <td style={{ textAlign: "center", fontWeight: "bold", color: ACCENT }}>{belgi}</td>
      <td>{k}</td>
      <td style={{ textAlign: "center" }}>{v}</td>
    </tr>
  );
}
