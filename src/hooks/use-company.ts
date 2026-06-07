import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";
import type { IcpScores } from "@/lib/icp";

const YEAR = new Date().getFullYear();

export function useCompaniesList() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("*, sector:sectors(name_en,name_ar)")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: async () => (await supabase.from("sectors").select("*").is("archived_at", null)).data ?? [],
  });
}

export function useArchiveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("companies").update({ archived_at: new Date().toISOString() }).eq("id", id);
      await logActivity("company", id, "archived");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ["company", id],
    queryFn: async () =>
      (await supabase.from("companies").select("*, sector:sectors(name_en)").eq("id", id).single()).data,
  });
}

export function useCompanyOpportunities(id: string) {
  return useQuery({
    queryKey: ["company-opps", id],
    queryFn: async () =>
      (await supabase.from("opportunities").select("*").eq("company_id", id).is("archived_at", null)).data ?? [],
  });
}

export function useCompanySales(id: string) {
  return useQuery({
    queryKey: ["company-sales", id],
    queryFn: async () =>
      (await supabase
        .from("sales_records")
        .select("*, product:products(name_en)")
        .eq("company_id", id)
        .is("archived_at", null)
        .order("period_month", { ascending: false })).data ?? [],
  });
}

export function useCompanyTasks(id: string) {
  return useQuery({
    queryKey: ["company-tasks", id],
    queryFn: async () =>
      (await supabase.from("tasks").select("*").eq("company_id", id).is("archived_at", null)).data ?? [],
  });
}

export function useCompanyActivity(id: string) {
  return useQuery({
    queryKey: ["company-activity", id],
    queryFn: async () => {
      // Activities directly on the company, plus activities meta-tagged with this company_id
      const [direct, related] = await Promise.all([
        supabase.from("activity_logs").select("*").eq("entity_type", "company").eq("entity_id", id).order("created_at", { ascending: false }).limit(50),
        supabase.from("activity_logs").select("*").contains("meta", { company_id: id } as never).order("created_at", { ascending: false }).limit(50),
      ]);
      const all = [...(direct.data ?? []), ...(related.data ?? [])];
      const dedup = Array.from(new Map(all.map((a) => [a.id, a])).values());
      return dedup.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 50);
    },
  });
}

export function useCompanyMeetings(id: string) {
  return useQuery({
    queryKey: ["company-meetings", id],
    queryFn: async () =>
      (await supabase
        .from("meetings")
        .select("*")
        .eq("company_id", id)
        .is("archived_at", null)
        .order("meeting_date", { ascending: false })).data ?? [],
  });
}

export function useCompanyNotes(id: string) {
  return useQuery({
    queryKey: ["company-notes", id],
    queryFn: async () =>
      (await supabase
        .from("company_notes")
        .select("*")
        .eq("company_id", id)
        .is("archived_at", null)
        .order("created_at", { ascending: false })).data ?? [],
  });
}

export function useCompanyKpis(id: string) {
  return useQuery({
    queryKey: ["company-kpis", id, YEAR],
    queryFn: async () => {
      const yearStart = `${YEAR}-01-01`;
      const [sales, openOpps, openTasks, meetingsCount] = await Promise.all([
        supabase.from("sales_records").select("revenue,profit,tons").eq("company_id", id).gte("period_month", yearStart).is("archived_at", null),
        supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("company_id", id).not("pipeline_status", "in", "(won,lost)").is("archived_at", null),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("company_id", id).neq("status", "completed").is("archived_at", null),
        supabase.from("meetings").select("id", { count: "exact", head: true }).eq("company_id", id).is("archived_at", null),
      ]);
      const rev = sales.data?.reduce((s, r) => s + Number(r.revenue || 0), 0) ?? 0;
      const profit = sales.data?.reduce((s, r) => s + Number(r.profit || 0), 0) ?? 0;
      const tons = sales.data?.reduce((s, r) => s + Number(r.tons || 0), 0) ?? 0;
      const margin = rev > 0 ? (profit / rev) * 100 : 0;
      return {
        rev, profit, tons, margin,
        openOpps: openOpps.count ?? 0,
        openTasks: openTasks.count ?? 0,
        meetings: meetingsCount.count ?? 0,
      };
    },
  });
}

export function useUpdateCompanyIcp(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scores: Partial<IcpScores>) => {
      const { error } = await supabase.from("companies").update(scores as never).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity("company", id, "edited", { icp: scores });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", id] });
      qc.invalidateQueries({ queryKey: ["company-activity", id] });
    },
  });
}

export function useCreateTaskForCompany(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string; priority: string; deadline?: string | null; opportunity_id?: string | null }) => {
      const { data: u } = await supabase.auth.getUser();
      const payload: Record<string, unknown> = {
        title: input.title,
        description: input.description || null,
        priority: input.priority,
        company_id: id,
        created_by: u.user?.id ?? null,
      };
      if (input.deadline) payload.deadline = input.deadline;
      if (input.opportunity_id) payload.opportunity_id = input.opportunity_id;
      const { data, error } = await supabase.from("tasks").insert(payload as never).select().single();
      if (error) throw new Error(error.message);
      await logActivity("task", data.id, "created", { title: data.title, company_id: id });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-tasks", id] });
      qc.invalidateQueries({ queryKey: ["company-kpis", id] });
      qc.invalidateQueries({ queryKey: ["company-activity", id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useCreateOpportunityForCompany(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; product_id?: string | null; expected_tons: number; expected_revenue: number; expected_profit: number; deadline?: string | null; pipeline_status: string }) => {
      const payload: Record<string, unknown> = {
        company_id: id,
        title: input.title,
        expected_tons: input.expected_tons,
        expected_revenue: input.expected_revenue,
        expected_profit: input.expected_profit,
        pipeline_status: input.pipeline_status,
      };
      if (input.product_id) payload.product_id = input.product_id;
      if (input.deadline) payload.deadline = input.deadline;
      const { data, error } = await supabase.from("opportunities").insert(payload as never).select().single();
      if (error) throw new Error(error.message);
      await logActivity("opportunity", data.id, "created", { company_id: id });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-opps", id] });
      qc.invalidateQueries({ queryKey: ["company-kpis", id] });
      qc.invalidateQueries({ queryKey: ["company-activity", id] });
      qc.invalidateQueries({ queryKey: ["opps"] });
    },
  });
}
