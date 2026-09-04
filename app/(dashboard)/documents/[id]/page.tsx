import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { DocumentPreview, type PreviewData } from "@/components/documents/document-preview";
import { DocumentActions } from "@/components/documents/document-actions";
import { calculateStartingPrice } from "@/services/calculation";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DocumentViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");

  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      region: true,
      district: true,
      calculation: true,
      files: true,
      createdBy: { select: { fullName: true } },
    },
  });
  if (!doc) notFound();
  if (user.role !== "ADMIN" && doc.createdById !== user.id) redirect("/documents");

  const hasMap = doc.files.some((f) => f.type === "MAP_IMAGE");
  const formula =
    doc.calculation?.formulaString ??
    calculateStartingPrice({ s: doc.s, t: doc.t, b: doc.b, g: doc.g, f: doc.f, m: doc.m, e: doc.e }).formula;

  const previewData: PreviewData = {
    regionName: doc.region.name,
    districtName: doc.district.name,
    mfy: doc.mfy,
    projectName: doc.projectName,
    organization: doc.organization,
    projectPurpose: doc.projectPurpose,
    totalAreaHa: doc.totalAreaHa,
    lotAreaM2: doc.lotAreaM2,
    lotAreaHa: doc.lotAreaHa,
    s: doc.s, t: doc.t, b: doc.b, g: doc.g, f: doc.f, m: doc.m, e: doc.e,
    startingPrice: doc.startingPrice,
    tDescription: doc.tDescription,
    fDescription: doc.fDescription,
    legalReference: doc.legalReference,
    formula,
    mapUrl: hasMap ? `/api/documents/${doc.id}/map` : null,
    scriptMode: doc.scriptMode as "LATIN" | "CYRILLIC" | "BOTH",
    fontFamily: doc.fontFamily,
    mapTileType: doc.mapTileType,
    mapCenterLat: doc.mapCenterLat,
    mapCenterLng: doc.mapCenterLng,
    mapZoom: doc.mapZoom,
    mapLineWidth: doc.mapLineWidth,
    labelPositions: (() => { try { return doc.labelPositions ? JSON.parse(doc.labelPositions) : {}; } catch { return {}; } })(),
    totalGeoJson: doc.totalGeoJson,
    lotGeoJson: doc.lotGeoJson,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <DocumentActions id={doc.id} />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{doc.projectName}</h1>
              <StatusBadge status={doc.status} />
            </div>
            <p className="mt-1 font-mono text-xs text-slate-400">{doc.documentNumber}</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>{doc.district.name}, {doc.mfy}</p>
            <p className="text-xs">
              {doc.createdBy?.fullName} • {formatDate(doc.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-100 p-4 rounded-xl">
        <DocumentPreview data={previewData} />
      </div>
    </div>
  );
}
