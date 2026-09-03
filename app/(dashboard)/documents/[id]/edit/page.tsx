import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentForm } from "@/components/documents/document-form";

export const dynamic = "force-dynamic";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { files: true },
  });
  if (!doc) notFound();
  if (user.role !== "ADMIN" && doc.createdById !== user.id) {
    redirect("/documents");
  }

  const hasMap = doc.files.some((f) => f.type === "MAP_IMAGE");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ma&apos;lumotnomani tahrirlash</h1>
        <p className="text-sm text-slate-500">
          {doc.documentNumber} — {doc.projectName}
        </p>
      </div>
      <DocumentForm
        initial={{
          id: doc.id,
          regionId: doc.regionId,
          districtId: doc.districtId,
          mfy: doc.mfy,
          projectName: doc.projectName,
          organization: doc.organization,
          projectPurpose: doc.projectPurpose,
          totalAreaHa: doc.totalAreaHa,
          lotAreaM2: doc.lotAreaM2,
          landUsageCode: doc.landUsageCode ?? "",
          g: doc.g,
          e: doc.e,
          hasMap,
        }}
      />
    </div>
  );
}
