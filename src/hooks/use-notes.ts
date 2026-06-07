import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ company_id, note }: { company_id: string; note: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("company_notes")
        .insert({ company_id, note, created_by: u.user?.id ?? null } as never)
        .select()
        .single();
      if (error) throw new Error(error.message);
      await logActivity("company_note", data.id, "created", { company_id });
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["company-notes", vars.company_id] });
      qc.invalidateQueries({ queryKey: ["company-activity", vars.company_id] });
    },
  });
}
