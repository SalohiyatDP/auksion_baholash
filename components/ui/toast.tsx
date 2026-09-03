"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const remove = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (m: string) => toast(m, "success"),
      error: (m: string) => toast(m, "error"),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border bg-white p-4 shadow-lg animate-in",
              t.kind === "success" && "border-green-200",
              t.kind === "error" && "border-red-200",
              t.kind === "info" && "border-blue-200"
            )}
          >
            {t.kind === "success" && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
            {t.kind === "error" && <XCircle className="h-5 w-5 shrink-0 text-red-600" />}
            {t.kind === "info" && <Info className="h-5 w-5 shrink-0 text-blue-600" />}
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast ToastProvider ichida ishlatilishi kerak");
  return ctx;
}
