import { useTranslation } from "react-i18next";
import { fmtDate } from "@/lib/format";
import { useCompanyNotes } from "@/hooks/use-company";
import { EmptyState } from "@/components/empty-state";
import { StickyNote } from "lucide-react";

export function NotesTimeline({ companyId, limit }: { companyId: string; limit?: number }) {
  const { t, i18n } = useTranslation();
  const { data = [] } = useCompanyNotes(companyId);
  const items = limit ? data.slice(0, limit) : data;
  if (items.length === 0) return <EmptyState icon={StickyNote} title={t("company360.notes.empty")} compact />;
  return (
    <ol className="relative space-y-4 ps-4 before:absolute before:start-1.5 before:top-1 before:bottom-1 before:w-px before:bg-border">
      {items.map((n) => (
        <li key={n.id} className="relative">
          <span className="absolute -start-[7px] top-1.5 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
          <div className="text-[11px] text-muted-foreground">{fmtDate(n.created_at, i18n.language)}</div>
          <p className="text-sm whitespace-pre-wrap mt-0.5">{n.note}</p>
        </li>
      ))}
    </ol>
  );
}
