import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";

export type ContactRow = {
  id: string;
  company_id: string | null;
  full_name: string;
  job_title: string | null;
  phone: string | null;
  email: string | null;
  linkedin: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  company?: { id: string; name: string } | null;
};

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts" as never)
        .select("*, company:companies(id,name)")
        .is("archived_at", null)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as unknown as ContactRow[];
    },
  });
}

export function useCompanyContacts(companyId: string | null | undefined) {
  return useQuery({
    queryKey: ["contacts", "by-company", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts" as never)
        .select("*")
        .eq("company_id", companyId as string)
        .is("archived_at", null)
        .order("is_primary", { ascending: false })
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as unknown as ContactRow[];
    },
  });
}

export function useUnassignedContacts() {
  return useQuery({
    queryKey: ["contacts", "all-for-pick"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts" as never)
        .select("id,full_name,company_id,job_title")
        .is("archived_at", null)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        id: string; full_name: string; company_id: string | null; job_title: string | null;
      }>;
    },
  });
}

export type SaveContactInput = {
  id?: string;
  full_name: string;
  job_title?: string | null;
  phone?: string | null;
  email?: string | null;
  linkedin?: string | null;
  is_primary: boolean;
  notes?: string | null;
  company_id: string | null;
};

export function useSaveContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveContactInput) => {
      const { id, ...payload } = input;
      // Enforce single primary per company in application logic.
      if (payload.is_primary && payload.company_id) {
        await supabase
          .from("contacts" as never)
          .update({ is_primary: false } as never)
          .eq("company_id", payload.company_id)
          .neq("id", id ?? "00000000-0000-0000-0000-000000000000");
      }
      if (id) {
        const { error } = await supabase.from("contacts" as never).update(payload as never).eq("id", id);
        if (error) throw error;
        await logActivity("contact", id, "edited", { name: payload.full_name });
        return id;
      } else {
        const { data, error } = await supabase
          .from("contacts" as never)
          .insert(payload as never)
          .select("id")
          .single();
        if (error) throw error;
        const newId = (data as unknown as { id: string }).id;
        await logActivity("contact", newId, "created", { name: payload.full_name });
        return newId;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useArchiveContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts" as never)
        .update({ archived_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
      await logActivity("contact", id, "archived");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useAssignContactToCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, companyId }: { contactId: string; companyId: string }) => {
      const { error } = await supabase
        .from("contacts" as never)
        .update({ company_id: companyId } as never)
        .eq("id", contactId);
      if (error) throw error;
      await logActivity("contact", contactId, "edited", { company_id: companyId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

/** Quick-create a target company from inside the contact dialog. */
export async function createTargetCompanyByName(name: string): Promise<string> {
  const { data, error } = await supabase
    .from("companies")
    .insert({ name, type: "target" } as never)
    .select("id")
    .single();
  if (error) throw error;
  const id = (data as unknown as { id: string }).id;
  await logActivity("company", id, "created", { name });
  return id;
}
