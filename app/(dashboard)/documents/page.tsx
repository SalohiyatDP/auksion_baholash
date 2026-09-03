"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Eye, Pencil, FileText, Download, Trash2,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { formatSom, formatDate, formatHectare } from "@/lib/format";

interface DocRow {
  id: string;
  documentNumber: string;
  projectName: string;
  mfy: string;
  lotAreaHa: number;
  startingPrice: number;
  status: string;
  createdAt: string;
  district: { name: string };
  createdBy?: { fullName: string };
}

export default function DocumentsListPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [rows, setRows] = React.useState<DocRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<DocRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      if (status) sp.set("status", status);
      sp.set("page", String(page));
      sp.set("pageSize", "10");
      const data = await apiFetch<{ documents: DocRow[]; totalPages: number; total: number }>(
        `/api/documents?${sp.toString()}`
      );
      setRows(data.documents);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total);
    } catch (err) {
      error(err instanceof Error ? err.message : "Yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [q, status, page, error]);

  React.useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function generate(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/documents/${id}/generate-word`, { method: "POST" });
      success("Word fayli yaratildi");
      load();
    } catch (err) {
      error(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/documents/${toDelete.id}`, { method: "DELETE" });
      success("Hujjat o'chirildi");
      setToDelete(null);
      load();
    } catch (err) {
      error(err instanceof Error ? err.message : "O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ma&apos;lumotnomalar</h1>
          <p className="text-sm text-slate-500">Jami {total} ta hujjat</p>
        </div>
        <Link href="/documents/new">
          <Button><Plus className="h-4 w-4" /> Yangi</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Loyiha, hujjat raqami yoki MFY bo'yicha qidirish..."
                value={q}
                onChange={(e) => { setPage(1); setQ(e.target.value); }}
              />
            </div>
            <Select className="sm:w-56" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
              <option value="">Barcha holatlar</option>
              <option value="DRAFT">Qoralama</option>
              <option value="GENERATED">Yaratilgan</option>
              <option value="ARCHIVED">Arxivlangan</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">Hujjatlar topilmadi</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№ / Raqam</TableHead>
                  <TableHead>Loyiha</TableHead>
                  <TableHead>Tuman / MFY</TableHead>
                  <TableHead>Maydon</TableHead>
                  <TableHead>Narx</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d, i) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="text-xs text-slate-400">{(page - 1) * 10 + i + 1}</div>
                      <Link href={`/documents/${d.id}`} className="font-mono text-xs text-primary hover:underline">
                        {d.documentNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{d.projectName}</TableCell>
                    <TableCell className="text-slate-500">
                      <div>{d.district?.name}</div>
                      <div className="text-xs text-slate-400">{d.mfy}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatHectare(d.lotAreaHa)} ga</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{formatSom(d.startingPrice)}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500">{formatDate(d.createdAt)}</TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="Ko'rish" onClick={() => router.push(`/documents/${d.id}`)}><Eye className="h-4 w-4" /></IconBtn>
                        <IconBtn title="Tahrirlash" onClick={() => router.push(`/documents/${d.id}/edit`)}><Pencil className="h-4 w-4" /></IconBtn>
                        <IconBtn title="Word yaratish" onClick={() => generate(d.id)}>
                          {busyId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        </IconBtn>
                        <IconBtn title="Yuklab olish" onClick={() => window.open(`/api/documents/${d.id}/download`, "_blank")}><Download className="h-4 w-4" /></IconBtn>
                        <IconBtn title="O'chirish" danger onClick={() => setToDelete(d)}><Trash2 className="h-4 w-4" /></IconBtn>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Hujjatni o'chirish"
        description={`"${toDelete?.projectName}" hujjati butunlay o'chiriladi. Davom etilsinmi?`}
        destructive
        loading={deleting}
        confirmText="O'chirish"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 ${danger ? "hover:bg-red-50 hover:text-red-600" : "hover:text-primary"}`}
    >
      {children}
    </button>
  );
}
