import { useTranslation } from "react-i18next";
import { useCompanyMeetings } from "@/hooks/use-company";
import { EmptyState } from "@/components/empty-state";
import { CalendarDays, Users } from "lucide-react";
import { fmtDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function MeetingsList({ companyId, limit }: { companyId: string; limit?: number }) {
  const { t, i18n } = useTranslation();
  const { data = [] } = useCompanyMeetings(companyId);
  const items = limit ? data.slice(0, limit) : data;
  if (items.length === 0) return <EmptyState icon={CalendarDays} title={t("company360.meetings.empty")} compact />;
  return (
    <div className="space-y-3">
      {items.map((m) => (
        <div key={m.id} className="rounded-lg border p-3 bg-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-medium text-sm">{m.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(m.meeting_date, i18n.language)}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{t("common.createdAt") || "Created"}: {fmtDateTime(m.created_at, i18n.language)}</div>
            </div>
            {m.attendees?.length > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1"><Users className="h-3 w-3" />{m.attendees.length}</Badge>
            )}
          </div>
          {m.attendees?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {m.attendees.map((a, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{a}</Badge>
              ))}
            </div>
          )}
          {m.notes && <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{m.notes}</p>}
          {m.decisions && (
            <div className="mt-2 rounded-md bg-primary/5 border border-primary/20 p-2">
              <div className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">{t("company360.meetings.decisions")}</div>
              <p className="text-xs whitespace-pre-wrap">{m.decisions}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
