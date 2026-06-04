import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";

export function useOpportunities() {
  return useQuery({
    queryKey: ["opps"],
    queryFn: async () =>
      (await supabase
        .from("opportunities")
        .select("*, company:companies(name), product:products(name_en)")
        .is("archived_at", null)
        .order("created_at", { ascending: false })).data ?? [],
  });
}

export function useAllCompaniesLite() {
  return useQuery({
    queryKey: ["all-companies"],
    queryFn: async () => (await supabase.from("companies").select("id,name").is("archived_at", null)).data ?? [],
  });
}

export function useAllProductsLite() {
  return useQuery({
    queryKey: ["all-products"],
    queryFn: async () => (await supabase.from("products").select("id,name_en").is("archived_at", null)).data ?? [],
  });
}

export function useMoveOpportunityStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("opportunities")
        .update({ pipeline_status: status as never })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity("opportunity", id, "status_changed", { to: status });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opps"] }),
  });
}
