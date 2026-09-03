"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";

export function DocumentActions({ id }: { id: string }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [generating, setGenerating] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function generate() {
    setGenerating(true);
    try {
      await apiFetch(`/api/documents/${id}/generate-word`, { method: "POST" });
      success("Word fayli yaratildi");
      router.refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setGenerating(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await apiFetch(`/api/documents/${id}`, { method: "DELETE" });
      success("Hujjat o'chirildi");
      router.push("/documents");
      router.refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => router.push("/documents")}>
        <ArrowLeft className="h-4 w-4" /> Orqaga
      </Button>
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={() => router.push(`/documents/${id}/edit`)}>
        <Pencil className="h-4 w-4" /> Tahrirlash
      </Button>
      <Button variant="outline" size="sm" onClick={generate} loading={generating}>
        <FileText className="h-4 w-4" /> Word yaratish
      </Button>
      <Button size="sm" onClick={() => window.open(`/api/documents/${id}/download`, "_blank")}>
        <Download className="h-4 w-4" /> Yuklab olish
      </Button>
      <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}>
        <Trash2 className="h-4 w-4" /> O&apos;chirish
      </Button>

      <ConfirmDialog
        open={confirm}
        title="Hujjatni o'chirish"
        description="Ushbu hujjat butunlay o'chiriladi. Davom etilsinmi?"
        destructive
        loading={deleting}
        confirmText="O'chirish"
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
