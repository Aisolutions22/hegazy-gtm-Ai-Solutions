import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";

export type CompanyProductRow = {
  id: string;
  company_id: string;
  product_id: string;
  notes: string | null;
  product: {
    id: string;
    name_en: string;
    name_ar: string;
    default_margin: number | string;
    sector?: { id: string; name_en: string; name_ar: string } | null;
  } | null;
};

export function useCompanyProducts(companyId: string) {
  return useQuery({
    queryKey: ["company-products", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_products" as never)
        .select("id,company_id,product_id,notes,product:products(id,name_en,name_ar,default_margin,sector:sectors(id,name_en,name_ar))")
        .eq("company_id", companyId);
      if (error) throw error;
      return (data ?? []) as unknown as CompanyProductRow[];
    },
  });
}

export function useLinkProduct(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("company_products" as never)
        .insert({ company_id: companyId, product_id: productId } as never);
      if (error) throw error;
      await logActivity("company", companyId, "edited", { linked_product: productId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-products", companyId] }),
  });
}

export function useUnlinkProduct(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("company_products" as never).delete().eq("id", linkId);
      if (error) throw error;
      await logActivity("company", companyId, "edited", { unlinked_link: linkId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-products", companyId] }),
  });
}

export function useAllProductsForPick() {
  return useQuery({
    queryKey: ["products", "for-pick"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name_en,name_ar")
        .is("archived_at", null)
        .order("name_en");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type ProductCompanyRow = {
  id: string;
  product_id: string;
  company_id: string;
  company: {
    id: string;
    name: string;
    type: string;
    sector?: { id: string; name_en: string; name_ar: string } | null;
  } | null;
};

export function useProductCompanies(productId: string | null) {
  return useQuery({
    queryKey: ["product-companies", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_products" as never)
        .select("id,product_id,company_id,company:companies(id,name,type,sector:sectors(id,name_en,name_ar))")
        .eq("product_id", productId as string);
      if (error) throw error;
      return (data ?? []) as unknown as ProductCompanyRow[];
    },
  });
}

