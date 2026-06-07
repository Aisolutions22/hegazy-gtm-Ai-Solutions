import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";

export type NewMeeting = {
  title: string;
  meeting_date: string;
  attendees: string[];
  notes?: string | null;
  decisions?: string | null;
  company_id?: string | null;
  opportunity_id?: string | null;
};

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewMeeting) => {
      const { data: u } = await supabase.auth.getUser();
      const payload = { ...input, created_by: u.user?.id ?? null };
      const { data, error } = await supabase.from("meetings").insert(payload as never).select().single();
      if (error) throw new Error(error.message);
      await logActivity("meeting", data.id, "created", { title: data.title, company_id: input.company_id });
      return data;
    },
    onSuccess: (_d, vars) => {
      if (vars.company_id) {
        qc.invalidateQueries({ queryKey: ["company-meetings", vars.company_id] });
        qc.invalidateQueries({ queryKey: ["company-activity", vars.company_id] });
      }
    },
  });
}
