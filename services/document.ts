import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  PageBreak,
  VerticalAlign,
  type IImageOptions,
} from "docx";
import { calculateStartingPrice } from "./calculation";
import { formatInteger, formatSom, formatHectare, formatDecimal } from "@/lib/format";
import { getImageSize } from "@/lib/image-size";

const FONT = "Times New Roman";
const BODY_SIZE = 28; // 14pt (half-points)
const TITLE_SIZE = 28; // 14pt
const MALUMOT_SIZE = 32; // 16pt

export interface DocxData {
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
}

export interface MapImage {
  buffer: Buffer;
  mime: string; // image/png | image/jpeg
}

function titleLine(text: string, size = TITLE_SIZE) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text, bold: true, font: FONT, size })],
  });
}

function bodyPara(text: string, opts: { justify?: boolean; bold?: boolean; center?: boolean; spacingAfter?: number } = {}) {
  return new Paragraph({
    alignment: opts.center
      ? AlignmentType.CENTER
      : opts.justify
      ? AlignmentType.JUSTIFIED
      : AlignmentType.LEFT,
    spacing: { after: opts.spacingAfter ?? 160, line: 276 },
    indent: opts.justify ? { firstLine: 567 } : undefined, // 1 sm xatboshi
    children: [new TextRun({ text, font: FONT, size: BODY_SIZE, bold: opts.bold })],
  });
}

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
};

function tCell(text: string, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; width?: number } = {}) {
  return new TableCell({
    borders: cellBorders,
    verticalAlign: VerticalAlign.CENTER,
    width: opts.width ? { size: opts.width, type: WidthType.PCT } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [new TextRun({ text, font: FONT, size: 26, bold: opts.bold })],
      }),
    ],
  });
}

function buildCoefficientTable(d: DocxData): Table {
  const header = new TableRow({
    tableHeader: true,
    children: [
      tCell("Belgi", { bold: true, align: AlignmentType.CENTER, width: 12 }),
      tCell("Ko'rsatkich", { bold: true, align: AlignmentType.CENTER, width: 63 }),
      tCell("Qiymat", { bold: true, align: AlignmentType.CENTER, width: 25 }),
    ],
  });

  const rows: Array<[string, string, string]> = [
    ["S", "Yer uchastkasining maydoni", `${formatInteger(d.s)} kv. metr`],
    ["T", `Hudud toifasi (${d.tDescription})`, `${formatInteger(d.t)}`],
    ["B", "1 kv.metr uchun yuridik shaxslardan olinadigan yer solig'i stavkasi", `${formatInteger(d.b)} so'm`],
    ["G", "Muhandislik-kommunikatsiya tarmoqlari koeffitsiyenti", formatDecimal(d.g)],
    ["F", d.fDescription, formatDecimal(d.f)],
    ["M", "Yer maydoni bo'yicha kamaytiruvchi koeffitsiyent", formatDecimal(d.m)],
    ["E", "Yer uchastkasiga oid qo'shimcha xarajatlar", `${formatInteger(d.e)} so'm`],
  ];

  const bodyRows = rows.map(
    ([belgi, korsatkich, qiymat]) =>
      new TableRow({
        children: [
          tCell(belgi, { bold: true, align: AlignmentType.CENTER }),
          tCell(korsatkich),
          tCell(qiymat, { align: AlignmentType.CENTER }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PCT },
    rows: [header, ...bodyRows],
  });
}

function buildMapParagraphs(d: DocxData, map?: MapImage): Paragraph[] {
  const paras: Paragraph[] = [];

  // Sarlavha
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `"${d.projectName}" dam olish maskanini tashkil etish uchun alohida lot sifatida ajratilgan ${formatHectare(d.lotAreaHa)} gektar (${formatInteger(d.lotAreaM2)} kv.metr) yer uchastkasi xaritasidan KO'CHIRMASI`,
          bold: true,
          font: FONT,
          size: BODY_SIZE,
        }),
      ],
    })
  );

  // Rasm
  if (map && map.buffer && map.buffer.length > 0) {
    const size = getImageSize(map.buffer) ?? { width: 600, height: 750 };
    const maxW = 600;
    const scale = size.width > maxW ? maxW / size.width : 1;
    const w = Math.round(size.width * scale);
    const h = Math.round(size.height * scale);
    const imgType = map.mime.includes("png") ? "png" : "jpg";
    const imageOptions = {
      type: imgType,
      data: map.buffer,
      transformation: { width: w, height: h },
    } as unknown as IImageOptions;
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new ImageRun(imageOptions)],
      })
    );
  } else {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: "[ Xarita rasmi yuklanmagan ]",
            italics: true,
            color: "888888",
            font: FONT,
            size: BODY_SIZE,
          }),
        ],
      })
    );
  }

  // Legenda — qizil
  paras.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "— ", bold: true, color: "FF0000", font: FONT, size: BODY_SIZE }),
        new TextRun({
          text: `qizil chiziq bilan "${d.organization}"ga davlat ro'yxatidan o'tkazilgan jami ${formatHectare(d.totalAreaHa)} gektar yer maydoni ko'rsatilgan.`,
          font: FONT,
          size: BODY_SIZE,
        }),
      ],
    })
  );
  // Legenda — ko'k
  paras.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "— ", bold: true, color: "0000FF", font: FONT, size: BODY_SIZE }),
        new TextRun({
          text: `ko'k chiziq bilan "${d.projectName}" dam olish maskanini tashkil etish uchun alohida lot sifatida ajratilgan ${formatHectare(d.lotAreaHa)} gektar yer maydoni ko'rsatilgan.`,
          font: FONT,
          size: BODY_SIZE,
        }),
      ],
    })
  );

  return paras;
}

export async function generateDocx(d: DocxData, map?: MapImage): Promise<Buffer> {
  const calc = calculateStartingPrice({
    s: d.s, t: d.t, b: d.b, g: d.g, f: d.f, m: d.m, e: d.e,
  });

  const regionUpper = d.regionName.toUpperCase();
  const districtUpper = d.districtName.toUpperCase();
  const mfyUpper = d.mfy.toUpperCase();

  const page1: (Paragraph | Table)[] = [
    // Sarlavha bloki
    titleLine(`${regionUpper} ${districtUpper}`),
    titleLine(`${mfyUpper} HUDUDIDA JOYLASHGAN YER UCHASTKASINI`),
    titleLine("ELEKTRON ONLAYN-AUKSIONGA CHIQARISH TO'G'RISIDA"),
    titleLine("MA'LUMOT", MALUMOT_SIZE),
    new Paragraph({ children: [new TextRun({ text: "", font: FONT, size: BODY_SIZE })] }),

    // Kirish
    bodyPara(
      `${d.districtName} hududida ${d.projectPurpose} maqsadida "${d.organization}" davlat muassasasi nomiga belgilangan tartibda davlat ro'yxatidan o'tkazilgan jami ${formatHectare(d.totalAreaHa)} gektar yer maydonidan "${d.projectName}" dam olish maskanini tashkil etish uchun alohida lot sifatida ajratilgan ${formatHectare(d.lotAreaHa)} gektar (${formatInteger(d.lotAreaM2)} kv.metr) yer uchastkasini ijara huquqi asosida elektron onlayn-auksion savdolariga chiqarish yuzasidan boshlang'ich narxning dastlabki hisob-kitoblari amalga oshirildi.`,
      { justify: true }
    ),

    // Huquqiy asos
    bodyPara(d.legalReference, { justify: true }),

    // Formula shabloni
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 160 },
      children: [new TextRun({ text: calc.formulaTemplate, bold: true, font: FONT, size: BODY_SIZE })],
    }),

    bodyPara("Mazkur formula bo'yicha hisob-kitob uchun quyidagi ko'rsatkichlar qabul qilindi:", { justify: true }),

    // Koeffitsiyentlar jadvali
    buildCoefficientTable(d),
    new Paragraph({ children: [new TextRun({ text: "", size: BODY_SIZE })] }),

    bodyPara(
      "Yuqoridagi ko'rsatkichlardan kelib chiqib, yer uchastkasining elektron onlayn-auksion savdolaridagi boshlang'ich narxi quyidagicha hisoblanadi:",
      { justify: true }
    ),

    // Yakuniy hisob
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: calc.formula, bold: true, font: FONT, size: BODY_SIZE })],
    }),

    // Yakuniy narx jumlasi
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: `Boshlang'ich narxi ${formatInteger(d.startingPrice)} so'mni tashkil etadi.`,
          bold: true,
          font: FONT,
          size: BODY_SIZE,
        }),
      ],
    }),

    // Sahifa uzilishi
    new Paragraph({ children: [new PageBreak()] }),

    // 2-sahifa: xarita
    ...buildMapParagraphs(d, map),
  ];

  const doc = new Document({
    creator: "YerAuksion",
    title: `${d.projectName} — ma'lumotnoma`,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BODY_SIZE },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1020, bottom: 1020, left: 1417, right: 850 },
          },
        },
        children: page1,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
