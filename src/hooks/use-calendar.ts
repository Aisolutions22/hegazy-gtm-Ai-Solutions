import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from "date-fns";

export type CalendarEventKind = "meeting" | "task" | "opportunity";

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  date: string; // YYYY-MM-DD (local)
  title: string;
  companyId: string | null;
  companyName: string | null;
  meta: Record<string, unknown>;
}

function toLocalISO(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useCalendarEvents(month: Date) {
  // Buffer to cover leading/trailing days shown in the 6-week grid.
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const fromIso = format(gridStart, "yyyy-MM-dd");
  const toIso = format(gridEnd, "yyyy-MM-dd");
  // For meetings (timestamp) we need a wider upper bound
  const toIsoEnd = `${toIso}T23:59:59`;

  return useQuery({
    queryKey: ["calendar", fromIso, toIso],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const [meetings, tasks, opps] = await Promise.all([
        supabase
          .from("meetings")
          .select("id,title,meeting_date,company_id,company:companies(name)")
          .is("archived_at", null)
          .gte("meeting_date", fromIso)
          .lte("meeting_date", toIsoEnd),
        supabase
          .from("tasks")
          .select("id,title,deadline,priority,status,company_id,company:companies(name)")
          .is("archived_at", null)
          .not("deadline", "is", null)
          .gte("deadline", fromIso)
          .lte("deadline", toIso),
        supabase
          .from("opportunities")
          .select("id,title,deadline,expected_revenue,pipeline_status,company_id,company:companies(name)")
          .is("archived_at", null)
          .not("deadline", "is", null)
          .gte("deadline", fromIso)
          .lte("deadline", toIso),
      ]);

      const events: CalendarEvent[] = [];

      for (const m of meetings.data ?? []) {
        events.push({
          id: `meeting-${m.id}`,
          kind: "meeting",
          date: toLocalISO(m.meeting_date as string),
          title: m.title as string,
          companyId: (m.company_id as string | null) ?? null,
          companyName: ((m.company as { name?: string } | null)?.name) ?? null,
          meta: {},
        });
      }
      for (const t of tasks.data ?? []) {
        events.push({
          id: `task-${t.id}`,
          kind: "task",
          date: toLocalISO(t.deadline as string),
          title: t.title as string,
          companyId: (t.company_id as string | null) ?? null,
          companyName: ((t.company as { name?: string } | null)?.name) ?? null,
          meta: { priority: t.priority, status: t.status },
        });
      }
      for (const o of opps.data ?? []) {
        events.push({
          id: `opp-${o.id}`,
          kind: "opportunity",
          date: toLocalISO(o.deadline as string),
          title: o.title as string,
          companyId: (o.company_id as string | null) ?? null,
          companyName: ((o.company as { name?: string } | null)?.name) ?? null,
          meta: { expected_revenue: o.expected_revenue, pipeline_status: o.pipeline_status },
        });
      }

      return events;
    },
  });
}
