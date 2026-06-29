import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";

export type CompanyDocument = {
  id: string;
  company_id: string;
  display_name: string;
  drive_url: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  creator?: { full_name: string | null; email: string | null } | null;
};

export function useCompanyDocuments(companyId: string) {
  return useQuery({
    queryKey: ["company-documents", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_documents" as never)
        .select("*, creator:profiles!company_documents_created_by_fkey(full_name,email)")
        .eq("company_id", companyId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) {
        // Fallback if FK alias not auto-detected
        const fb = await supabase
          .from("company_documents" as never)
          .select("*")
          .eq("company_id", companyId)
          .is("archived_at", null)
          .order("created_at", { ascending: false });
        return (fb.data ?? []) as unknown as CompanyDocument[];
      }
      return (data ?? []) as unknown as CompanyDocument[];
    },
  });
}

export function useAddCompanyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { company_id: string; display_name: string; drive_url: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const payload = { ...input, created_by: auth.user?.id ?? null };
      const { data, error } = await supabase
        .from("company_documents" as never)
        .insert(payload as never)
        .select("id")
        .single();
      if (error) throw error;
      const newId = (data as unknown as { id: string }).id;
      await logActivity("company_document", newId, "created", {
        company_id: input.company_id,
        name: input.display_name,
      });
      return newId;
    },
    onSuccess: (_id, vars) =>
      qc.invalidateQueries({ queryKey: ["company-documents", vars.company_id] }),
  });
}

export function useArchiveCompanyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; company_id: string }) => {
      const { error } = await supabase
        .from("company_documents" as never)
        .update({ archived_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
      await logActivity("company_document", id, "archived");
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["company-documents", vars.company_id] }),
  });
}
