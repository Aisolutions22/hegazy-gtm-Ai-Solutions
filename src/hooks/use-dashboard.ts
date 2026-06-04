import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { localDateISO, addDaysISO } from "@/lib/format";

const YEAR = new Date().getFullYear();

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const yearStart = `${YEAR}-01-01`;
      const [sales, customers, opps] = await Promise.all([
        supabase.from("sales_records").select("revenue,profit,tons").gte("period_month", yearStart).is("archived_at", null),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("type", "customer").is("archived_at", null),
        supabase.from("opportunities").select("id", { count: "exact", head: true }).not("pipeline_status", "in", "(won,lost)").is("archived_at", null),
      ]);
      const rev = sales.data?.reduce((s, r) => s + Number(r.revenue || 0), 0) ?? 0;
      const profit = sales.data?.reduce((s, r) => s + Number(r.profit || 0), 0) ?? 0;
      const tons = sales.data?.reduce((s, r) => s + Number(r.tons || 0), 0) ?? 0;
      const margin = rev > 0 ? (profit / rev) * 100 : 0;
      return { rev, profit, tons, margin, customers: customers.count ?? 0, openOpps: opps.count ?? 0 };
    },
  });
}

export function useDashboardMonthly() {
  return useQuery({
    queryKey: ["dashboard-monthly", YEAR],
    queryFn: async () => {
      const yearStart = `${YEAR}-01-01`;
      const yearEnd = `${YEAR}-12-31`;
      const { data } = await supabase.from("sales_records").select("period_month,revenue,profit,tons").gte("period_month", yearStart).lte("period_month", yearEnd).is("archived_at", null);
      const map = new Map<string, { month: string; revenue: number; profit: number; tons: number }>();
      for (let i = 0; i < 12; i++) {
        const k = `${YEAR}-${String(i + 1).padStart(2, "0")}`;
        map.set(k, { month: k.slice(5), revenue: 0, profit: 0, tons: 0 });
      }
      (data ?? []).forEach((r) => {
        const k = String(r.period_month).slice(0, 7);
        const e = map.get(k); if (!e) return;
        e.revenue += Number(r.revenue); e.profit += Number(r.profit); e.tons += Number(r.tons);
      });
      return Array.from(map.values());
    },
  });
}

export function useTopOpportunities() {
  return useQuery({
    queryKey: ["dashboard-top-opps"],
    queryFn: async () => {
      const { data } = await supabase.from("opportunities").select("id,title,expected_revenue,pipeline_status,company:companies(name)").not("pipeline_status", "in", "(won,lost)").is("archived_at", null).order("expected_revenue", { ascending: false }).limit(5);
      return data ?? [];
    },
  });
}

export function useTodayTasks() {
  return useQuery({
    queryKey: ["dashboard-today"],
    queryFn: async () => {
      const today = localDateISO();
      const { data } = await supabase
        .from("tasks")
        .select("id,title,priority,deadline,status")
        .lte("deadline", today)
        .neq("status", "completed")
        .is("archived_at", null)
        .order("deadline")
        .limit(20);
      const rows = (data ?? []).filter((t) => t.status !== "completed" && t.deadline && String(t.deadline) <= today);
      return rows.slice(0, 6);
    },
  });
}

export type UpcomingRow = { id: string; kind: "task" | "opp"; title: string; deadline: string; meta?: string };

export function useUpcomingDeadlines() {
  return useQuery({
    queryKey: ["dashboard-upcoming"],
    queryFn: async (): Promise<UpcomingRow[]> => {
      const startStr = addDaysISO(1);
      const endStr = addDaysISO(7);
      const [tasks, opps] = await Promise.all([
        supabase.from("tasks").select("id,title,deadline,priority").gte("deadline", startStr).lte("deadline", endStr).neq("status", "completed").is("archived_at", null),
        supabase.from("opportunities").select("id,title,deadline,company:companies(name)").gte("deadline", startStr).lte("deadline", endStr).not("pipeline_status", "in", "(won,lost)").is("archived_at", null),
      ]);
      const rows: UpcomingRow[] = [
        ...(tasks.data ?? []).map((r): UpcomingRow => ({ id: `t-${r.id}`, kind: "task", title: r.title, deadline: r.deadline as string, meta: r.priority })),
        ...(opps.data ?? []).map((r): UpcomingRow => ({ id: `o-${r.id}`, kind: "opp", title: r.title || "—", deadline: r.deadline as string, meta: r.company?.name })),
      ];
      return rows.sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 8);
    },
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("id,action,entity_type,entity_id,created_at,meta")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });
}
