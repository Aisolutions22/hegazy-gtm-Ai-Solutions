import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";

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
    queryFn: async () =>
      (await supabase
        .from("activity_logs")
        .select("*")
        .eq("entity_type", "company")
        .eq("entity_id", id)
        .order("created_at", { ascending: false })
        .limit(50)).data ?? [],
  });
}
