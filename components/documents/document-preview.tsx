"use client";

import * as React from "react";
import { formatInteger, formatSom, formatHectare, formatDecimal } from "@/lib/format";

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
}

export function DocumentPreview({ data }: { data: PreviewData }) {
  const dash = "\u2014";
  return (
    <div className="a4-preview">
      {/* Sarlavha */}
      <div style={{ textAlign: "center", fontWeight: "bold" }}>
        <div>
          {data.regionName.toUpperCase()} {data.districtName.toUpperCase()}
        </div>
        <div>{data.mfy.toUpperCase()} HUDUDIDA JOYLASHGAN YER UCHASTKASINI</div>
        <div>ELEKTRON ONLAYN-AUKSIONGA CHIQARISH TO&apos;G&apos;RISIDA</div>
        <div style={{ fontSize: 17, marginTop: 6 }}>MA&apos;LUMOT</div>
      </div>

      {/* Kirish */}
      <p style={{ textAlign: "justify", textIndent: 28, marginTop: 18 }}>
        {data.districtName} hududida {data.projectPurpose} maqsadida &ldquo;{data.organization}
        &rdquo; davlat muassasasi nomiga belgilangan tartibda davlat ro&apos;yxatidan o&apos;tkazilgan jami{" "}
        {formatHectare(data.totalAreaHa)} gektar yer maydonidan &ldquo;{data.projectName}&rdquo; dam
        olish maskanini tashkil etish uchun alohida lot sifatida ajratilgan{" "}
        {formatHectare(data.lotAreaHa)} gektar ({formatInteger(data.lotAreaM2)} kv.metr) yer
        uchastkasini ijara huquqi asosida elektron onlayn-auksion savdolariga chiqarish yuzasidan
        boshlang&apos;ich narxning dastlabki hisob-kitoblari amalga oshirildi.
      </p>

      {/* Huquqiy asos */}
      <p style={{ textAlign: "justify", textIndent: 28 }}>{data.legalReference}</p>

      {/* Formula shabloni */}
      <p style={{ textAlign: "center", fontWeight: "bold", margin: "12px 0" }}>
        C = S × T × B × G × F × M + E
      </p>

      <p style={{ textAlign: "justify", textIndent: 28 }}>
        Mazkur formula bo&apos;yicha hisob-kitob uchun quyidagi ko&apos;rsatkichlar qabul qilindi:
      </p>

      {/* Koeffitsiyentlar jadvali */}
      <table style={{ marginTop: 8 }}>
        <thead>
          <tr style={{ fontWeight: "bold", textAlign: "center" }}>
            <th style={{ width: "12%" }}>Belgi</th>
            <th style={{ width: "63%" }}>Ko&apos;rsatkich</th>
            <th style={{ width: "25%" }}>Qiymat</th>
          </tr>
        </thead>
        <tbody>
          <Row belgi="S" korsatkich="Yer uchastkasining maydoni" qiymat={`${formatInteger(data.s)} kv. metr`} />
          <Row belgi="T" korsatkich={`Hudud toifasi (${data.tDescription})`} qiymat={formatInteger(data.t)} />
          <Row belgi="B" korsatkich="1 kv.metr uchun yuridik shaxslardan olinadigan yer solig'i stavkasi" qiymat={`${formatInteger(data.b)} so'm`} />
          <Row belgi="G" korsatkich="Muhandislik-kommunikatsiya tarmoqlari koeffitsiyenti" qiymat={formatDecimal(data.g)} />
          <Row belgi="F" korsatkich={data.fDescription} qiymat={formatDecimal(data.f)} />
          <Row belgi="M" korsatkich="Yer maydoni bo'yicha kamaytiruvchi koeffitsiyent" qiymat={formatDecimal(data.m)} />
          <Row belgi="E" korsatkich="Yer uchastkasiga oid qo'shimcha xarajatlar" qiymat={`${formatInteger(data.e)} so'm`} />
        </tbody>
      </table>

      <p style={{ textAlign: "justify", textIndent: 28, marginTop: 12 }}>
        Yuqoridagi ko&apos;rsatkichlardan kelib chiqib, yer uchastkasining elektron onlayn-auksion
        savdolaridagi boshlang&apos;ich narxi quyidagicha hisoblanadi:
      </p>

      <p style={{ textAlign: "center", fontWeight: "bold", margin: "10px 0" }}>{data.formula}</p>
      <p style={{ textAlign: "center", fontWeight: "bold" }}>
        Boshlang&apos;ich narxi {formatInteger(data.startingPrice)} so&apos;mni tashkil etadi.
      </p>

      {/* 2-sahifa: xarita */}
      <div style={{ borderTop: "1px dashed #ccc", marginTop: 28, paddingTop: 20 }}>
        <p style={{ textAlign: "center", fontWeight: "bold" }}>
          &ldquo;{data.projectName}&rdquo; dam olish maskanini tashkil etish uchun alohida lot
          sifatida ajratilgan {formatHectare(data.lotAreaHa)} gektar ({formatInteger(data.lotAreaM2)}{" "}
          kv.metr) yer uchastkasi xaritasidan KO&apos;CHIRMASI
        </p>

        <div style={{ textAlign: "center", margin: "14px 0" }}>
          {data.mapUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.mapUrl} alt="Xarita" style={{ maxWidth: "100%", maxHeight: 420, border: "1px solid #ddd" }} />
          ) : (
            <div style={{ padding: 40, background: "#f8fafc", color: "#94a3b8", border: "1px dashed #cbd5e1" }}>
              [ Xarita rasmi yuklanmagan ]
            </div>
          )}
        </div>

        <p style={{ marginBottom: 6 }}>
          <span style={{ color: "#dc2626", fontWeight: "bold" }}>{dash} </span>
          qizil chiziq bilan &ldquo;{data.organization}&rdquo;ga davlat ro&apos;yxatidan o&apos;tkazilgan
          jami {formatHectare(data.totalAreaHa)} gektar yer maydoni ko&apos;rsatilgan.
        </p>
        <p>
          <span style={{ color: "#2563eb", fontWeight: "bold" }}>{dash} </span>
          ko&apos;k chiziq bilan &ldquo;{data.projectName}&rdquo; dam olish maskanini tashkil etish
          uchun alohida lot sifatida ajratilgan {formatHectare(data.lotAreaHa)} gektar yer maydoni
          ko&apos;rsatilgan.
        </p>
      </div>
    </div>
  );
}

function Row({ belgi, korsatkich, qiymat }: { belgi: string; korsatkich: string; qiymat: string }) {
  return (
    <tr>
      <td style={{ textAlign: "center", fontWeight: "bold" }}>{belgi}</td>
      <td>{korsatkich}</td>
      <td style={{ textAlign: "center" }}>{qiymat}</td>
    </tr>
  );
}
