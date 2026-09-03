import { DocumentForm } from "@/components/documents/document-form";

export const dynamic = "force-dynamic";

export default function NewDocumentPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Yangi ma&apos;lumotnoma</h1>
        <p className="text-sm text-slate-500">
          Yer uchastkasi ma&apos;lumotlarini kiriting — boshlang&apos;ich narx avtomatik hisoblanadi.
        </p>
      </div>
      <DocumentForm />
    </div>
  );
}
