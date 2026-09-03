"use client";

import * as React from "react";
import { UploadCloud, ImageIcon, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 20 * 1024 * 1024;

interface MapUploadProps {
  previewUrl: string | null;
  onSelect: (file: File | null) => void;
}

export function MapUpload({ previewUrl, onSelect }: MapUploadProps) {
  const { error } = useToast();
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function validateAndSelect(file: File) {
    if (!ALLOWED.includes(file.type)) {
      error("Faqat JPG, JPEG yoki PNG rasm yuklang");
      return;
    }
    if (file.size > MAX_SIZE) {
      error("Rasm hajmi 20 MB dan oshmasligi kerak");
      return;
    }
    onSelect(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className="relative overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Xarita" className="max-h-72 w-full object-contain bg-slate-50" />
          <div className="absolute right-2 top-2 flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
              <RefreshCw className="h-4 w-4" /> Almashtirish
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => onSelect(null)}>
              <X className="h-4 w-4" /> O&apos;chirish
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            dragging ? "border-primary bg-accent" : "border-slate-300 hover:border-primary/60 hover:bg-slate-50"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Xarita rasmini bu yerga tashlang yoki tanlang
          </p>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <ImageIcon className="h-3 w-3" /> JPG, JPEG, PNG — 20 MB gacha
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) validateAndSelect(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
