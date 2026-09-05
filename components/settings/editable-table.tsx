"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "checkbox" | "select";
  options?: { value: string | number; label: string }[];
  step?: string;
  hint?: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (row: any) => React.ReactNode;
}

interface EditableTableProps {
  title: string;
  entity: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  makeEmpty: () => Record<string, any>;
}

export function EditableTable({ title, entity, fields, columns, makeEmpty }: EditableTableProps) {
  const { success, error } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = React.useState<Record<string, any> | null>(null);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [toDelete, setToDelete] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<{ items: unknown[] }>(`/api/settings/${entity}`);
      setItems(d.items as never[]);
    } catch (err) {
      error(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setLoading(false);
    }
  }, [entity, error]);

  React.useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm(makeEmpty());
    setEditingId(null);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function openEdit(row: any) {
    const f = makeEmpty();
    for (const key of Object.keys(f)) f[key] = row[key] ?? f[key];
    setForm(f);
    setEditingId(row.id);
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/api/settings/${entity}/${editingId}`, { method: "PUT", body: JSON.stringify(form) });
        success("Yangilandi");
      } else {
        await apiFetch(`/api/settings/${entity}`, { method: "POST", body: JSON.stringify(form) });
        success("Qo'shildi");
      }
      setForm(null);
      load();
    } catch (err) {
      error(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/settings/${entity}/${toDelete.id}`, { method: "DELETE" });
      success("O'chirildi");
      setToDelete(null);
      load();
    } catch (err) {
      error(err instanceof Error ? err.message : "O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button size="sm" variant="outline" onClick={openNew}>
          <Plus className="h-4 w-4" /> Qo&apos;shish
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-10 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
                <TableHead className="text-right">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? "")}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button title="Tahrirlash" onClick={() => openEdit(row)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button title="O'chirish" onClick={() => setToDelete(row)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={columns.length + 1} className="text-center text-slate-400">Ma&apos;lumot yo&apos;q</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Modal forma */}
      {form && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {editingId ? "Tahrirlash" : "Yangi yozuv"} — {title}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                  <Label>{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} rows={4} />
                  ) : f.type === "select" ? (
                    <Select value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                      <option value="">— tanlang —</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  ) : f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} />
                      Ha
                    </label>
                  ) : (
                    <Input
                      type={f.type}
                      step={f.step}
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? e.target.value : e.target.value })}
                    />
                  )}
                  {f.hint && <p className="text-xs text-slate-400">{f.hint}</p>}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setForm(null)} disabled={saving}>Bekor qilish</Button>
              <Button onClick={save} loading={saving}>Saqlash</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="O'chirish"
        description="Ushbu yozuv o'chiriladi. Davom etilsinmi?"
        destructive
        loading={deleting}
        confirmText="O'chirish"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Card>
  );
}
