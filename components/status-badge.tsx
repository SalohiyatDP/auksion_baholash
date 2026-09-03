import { Badge } from "@/components/ui/badge";

const MAP: Record<string, { label: string; variant: "draft" | "generated" | "archived" }> = {
  DRAFT: { label: "Qoralama", variant: "draft" },
  GENERATED: { label: "Yaratilgan", variant: "generated" },
  ARCHIVED: { label: "Arxivlangan", variant: "archived" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, variant: "archived" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
