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
  ShadingType,
  type IImageOptions,
} from "docx";
import { calculateStartingPrice } from "./calculation";
import { formatInteger, formatHectare, formatDecimal, formatDate } from "@/lib/format";
import { getImageSize } from "@/lib/image-size";
import { latinToCyrillic } from "@/lib/translit";

const FONT = "Times New Roman";
const BODY_SIZE = 28; // 14pt
const MALUMOT_SIZE = 32; // 16pt
const ACCENT = "1E40AF";
const ACCENT_LIGHT = "DBEAFE";
const GREEN = "047857";
const GREEN_LIGHT = "ECFDF5";

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
  scriptMode?: string;
  documentNumber?: string;
}

export interface MapImage {
  buffer: Buffer;
  mime: string;
}

type Tr = (s: string) => string;

function titleLine(text: string, size: number, color = "0F172A") {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text, bold: true, font: FONT, size, color })],
  });
}

function bodyPara(text: string) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 160, line: 276 },
    indent: { firstLine: 567 },
    children: [new TextRun({ text, font: FONT, size: BODY_SIZE })],
  });
}

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "BFDBFE" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "BFDBFE" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "BFDBFE" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "BFDBFE" },
};

function headerCell(text: string) {
  return new TableCell({
    borders: cellBorders,
    verticalAlign: VerticalAlign.CENTER,
    shading: { type: ShadingType.CLEAR, color: "auto", fill: ACCENT },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: "FFFFFF" })],
      }),
    ],
  });
}

function bodyCell(text: string, opts: { center?: boolean; bold?: boolean; accent?: boolean; zebra?: boolean } = {}) {
  return new TableCell({
    borders: cellBorders,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.zebra ? { type: ShadingType.CLEAR, color: "auto", fill: "F8FAFC" } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text, font: FONT, size: 26, bold: opts.bold, color: opts.accent ? ACCENT : "000000" })],
      }),
    ],
  });
}

function buildTable(d: DocxData, tr: Tr): Table {
  const rows: Array<[string, string, string]> = [
    ["S", tr("Yer uchastkasining maydoni"), `${formatInteger(d.s)} ${tr("kv. metr")}`],
    ["T", tr(`Hudud toifasi (${d.tDescription})`), `${formatInteger(d.t)}`],
    ["B", tr("1 kv.metr uchun yuridik shaxslardan olinadigan yer solig'i stavkasi"), `${formatInteger(d.b)} ${tr("so'm")}`],
    ["G", tr("Muhandislik-kommunikatsiya tarmoqlari koeffitsiyenti"), formatDecimal(d.g)],
    ["F", tr(d.fDescription), formatDecimal(d.f)],
    ["M", tr("Yer maydoni bo'yicha kamaytiruvchi koeffitsiyent"), formatDecimal(d.m)],
    ["E", tr("Yer uchastkasiga oid qo'shimcha xarajatlar"), `${formatInteger(d.e)} ${tr("so'm")}`],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PCT },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [headerCell(tr("Belgi")), headerCell(tr("Ko'rsatkich")), headerCell(tr("Qiymat"))],
      }),
      ...rows.map((r, i) =>
        new TableRow({
          children: [
            bodyCell(r[0], { center: true, bold: true, accent: true, zebra: i % 2 === 1 }),
            bodyCell(r[1], { zebra: i % 2 === 1 }),
            bodyCell(r[2], { center: true, zebra: i % 2 === 1 }),
          ],
        })
      ),
    ],
  });
}

function buildTextContent(d: DocxData, tr: Tr): (Paragraph | Table)[] {
  const calc = calculateStartingPrice({ s: d.s, t: d.t, b: d.b, g: d.g, f: d.f, m: d.m, e: d.e });

  return [
    titleLine(tr(`${d.regionName} ${d.districtName}`.toUpperCase()), BODY_SIZE),
    titleLine(tr(`${d.mfy.toUpperCase()} HUDUDIDA JOYLASHGAN YER UCHASTKASINI`), BODY_SIZE),
    titleLine(tr("ELEKTRON ONLAYN-AUKSIONGA CHIQARISH TO'G'RISIDA"), BODY_SIZE),
    titleLine(tr("MA'LUMOT"), MALUMOT_SIZE, ACCENT),
    new Paragraph({ children: [new TextRun({ text: "", size: 8 })] }),

    bodyPara(
      tr(
        `${d.districtName} hududida ${d.projectPurpose} maqsadida "${d.organization}" davlat muassasasi nomiga belgilangan tartibda davlat ro'yxatidan o'tkazilgan jami ${formatHectare(d.totalAreaHa)} gektar yer maydonidan "${d.projectName}" dam olish maskanini tashkil etish uchun alohida lot sifatida ajratilgan ${formatHectare(d.lotAreaHa)} gektar (${formatInteger(d.lotAreaM2)} kv.metr) yer uchastkasini ijara huquqi asosida elektron onlayn-auksion savdolariga chiqarish yuzasidan boshlang'ich narxning dastlabki hisob-kitoblari amalga oshirildi.`
      )
    ),
    bodyPara(tr(d.legalReference)),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 160 },
      children: [new TextRun({ text: calc.formulaTemplate, bold: true, font: FONT, size: BODY_SIZE, color: ACCENT })],
    }),

    bodyPara(tr("Mazkur formula bo'yicha hisob-kitob uchun quyidagi ko'rsatkichlar qabul qilindi:")),

    buildTable(d, tr),
    new Paragraph({ children: [new TextRun({ text: "", size: 8 })] }),

    bodyPara(tr("Yuqoridagi ko'rsatkichlardan kelib chiqib, yer uchastkasining elektron onlayn-auksion savdolaridagi boshlang'ich narxi quyidagicha hisoblanadi:")),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: calc.formula, bold: true, font: FONT, size: BODY_SIZE })],
    }),

    // Narx — ajratilgan (yashil) blok
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 120 },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: GREEN_LIGHT },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: GREEN },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN },
        left: { style: BorderStyle.SINGLE, size: 6, color: GREEN },
        right: { style: BorderStyle.SINGLE, size: 6, color: GREEN },
      },
      children: [
        new TextRun({
          text: tr(`Boshlang'ich narxi ${formatInteger(d.startingPrice)} so'mni tashkil etadi.`),
          bold: true,
          font: FONT,
          size: 30,
          color: GREEN,
        }),
      ],
    }),
  ];
}

function buildMapSection(d: DocxData, tr: Tr, map?: MapImage): Paragraph[] {
  const paras: Paragraph[] = [];

  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: tr(`"${d.projectName}" dam olish maskanini tashkil etish uchun alohida lot sifatida ajratilgan ${formatHectare(d.lotAreaHa)} gektar (${formatInteger(d.lotAreaM2)} kv.metr) yer uchastkasi xaritasidan KO'CHIRMASI`),
          bold: true,
          font: FONT,
          size: BODY_SIZE,
        }),
      ],
    })
  );

  if (map && map.buffer && map.buffer.length > 0) {
    const size = getImageSize(map.buffer) ?? { width: 600, height: 600 };
    const maxW = 600;
    const scale = size.width > maxW ? maxW / size.width : 1;
    const imageOptions = {
      type: map.mime.includes("png") ? "png" : "jpg",
      data: map.buffer,
      transformation: { width: Math.round(size.width * scale), height: Math.round(size.height * scale) },
    } as unknown as IImageOptions;
    paras.push(
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new ImageRun(imageOptions)] })
    );
  } else {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({ text: tr("[ Xarita rasmi mavjud emas ]"), italics: true, color: "888888", font: FONT, size: BODY_SIZE })],
      })
    );
  }

  paras.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "— ", bold: true, color: "D32F2F", font: FONT, size: BODY_SIZE }),
        new TextRun({ text: tr(`qizil chiziq bilan "${d.organization}"ga davlat ro'yxatidan o'tkazilgan jami ${formatHectare(d.totalAreaHa)} gektar yer maydoni ko'rsatilgan.`), font: FONT, size: BODY_SIZE }),
      ],
    })
  );
  paras.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "— ", bold: true, color: "1E40AF", font: FONT, size: BODY_SIZE }),
        new TextRun({ text: tr(`ko'k chiziq bilan "${d.projectName}" dam olish maskanini tashkil etish uchun alohida lot sifatida ajratilgan ${formatHectare(d.lotAreaHa)} gektar yer maydoni ko'rsatilgan.`), font: FONT, size: BODY_SIZE }),
      ],
    })
  );

  return paras;
}

function headerBand(d: DocxData): Paragraph {
  const parts: string[] = [];
  if (d.documentNumber) parts.push(d.documentNumber);
  parts.push(formatDate(new Date()));
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 120 },
    children: [new TextRun({ text: parts.join("  •  "), font: FONT, size: 20, color: ACCENT })],
  });
}

export async function generateDocx(d: DocxData, map?: MapImage): Promise<Buffer> {
  const mode = (d.scriptMode as string) || "LATIN";
  const identity: Tr = (s) => s;
  const toCyr: Tr = (s) => latinToCyrillic(s);

  const scripts: Tr[] = mode === "CYRILLIC" ? [toCyr] : mode === "BOTH" ? [identity, toCyr] : [identity];

  const children: (Paragraph | Table)[] = [headerBand(d)];

  scripts.forEach((tr, idx) => {
    if (idx > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(...buildTextContent(d, tr));
  });

  // Xarita — bir marta, oxirgi skript tilida
  const lastTr = scripts[scripts.length - 1];
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(...buildMapSection(d, lastTr, map));

  const doc = new Document({
    creator: "YerAuksion",
    title: `${d.projectName} — ma'lumotnoma`,
    styles: { default: { document: { run: { font: FONT, size: BODY_SIZE } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1020, bottom: 1020, left: 1417, right: 850 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
