"use client";

import * as React from "react";
import { UserPlus, Trash2, Loader2, ShieldCheck, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { formatDate } from "@/lib/format";

interface UserRow {
  id: string; fullName: string; email: string; username: string;
  role: string; isActive: boolean; createdAt: string;
  _count?: { documents: number };
}

export default function UsersPage() {
  const { success, error } = useToast();
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<UserRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [form, setForm] = React.useState({ fullName: "", email: "", username: "", password: "", role: "OPERATOR" });

  async function load() {
    setLoading(true);
    try {
      const d = await apiFetch<{ users: UserRow[] }>("/api/users");
      setUsers(d.users);
    } catch (err) {
      error(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch("/api/users", { method: "POST", body: JSON.stringify(form) });
      success("Foydalanuvchi qo'shildi");
      setForm({ fullName: "", email: "", username: "", password: "", role: "OPERATOR" });
      load();
    } catch (err) {
      error(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/users/${toDelete.id}`, { method: "DELETE" });
      success("Foydalanuvchi o'chirildi");
      setToDelete(null);
      load();
    } catch (err) {
      error(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Foydalanuvchilar</h1>
        <p className="text-sm text-slate-500">Tizim foydalanuvchilarini boshqarish</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4 text-primary" /> Yangi foydalanuvchi</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5"><Label>F.I.O</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label>Login</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label>Parol</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label>Rol</Label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="OPERATOR">Operator</option>
                <option value="ADMIN">Administrator</option>
              </Select>
            </div>
            <div className="flex items-end"><Button type="submit" loading={creating} className="w-full"><UserPlus className="h-4 w-4" /> Qo&apos;shish</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>F.I.O</TableHead><TableHead>Email / Login</TableHead><TableHead>Rol</TableHead>
                <TableHead>Hujjatlar</TableHead><TableHead>Sana</TableHead><TableHead className="text-right">Amal</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell className="text-slate-500"><div>{u.email}</div><div className="text-xs text-slate-400">{u.username}</div></TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "generated" : "default"}>
                        {u.role === "ADMIN" ? <><ShieldCheck className="mr-1 h-3 w-3" /> Admin</> : <><UserIcon className="mr-1 h-3 w-3" /> Operator</>}
                      </Badge>
                    </TableCell>
                    <TableCell>{u._count?.documents ?? 0}</TableCell>
                    <TableCell className="text-slate-500">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <button title="O'chirish" onClick={() => setToDelete(u)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Foydalanuvchini o'chirish"
        description={`"${toDelete?.fullName}" o'chiriladi.`}
        destructive
        loading={deleting}
        confirmText="O'chirish"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
