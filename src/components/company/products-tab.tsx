import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Package, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";
import {
  useCompanyProducts, useLinkProduct, useUnlinkProduct, useAllProductsForPick,
} from "@/hooks/use-company-products";

export function ProductsTab({ companyId }: { companyId: string }) {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const qc = useQueryClient();
  const { data: links = [] } = useCompanyProducts(companyId);
  const { data: allProducts = [] } = useAllProductsForPick();
  const link = useLinkProduct(companyId);
  const unlink = useUnlinkProduct(companyId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newP, setNewP] = useState({ name_en: "", name_ar: "" });
  const [saving, setSaving] = useState(false);

  const linkedIds = new Set(links.map((l) => l.product_id));
  const available = allProducts.filter((p) => !linkedIds.has(p.id));

  async function pickExisting(productId: string) {
    try {
      await link.mutateAsync(productId);
      setPickerOpen(false);
      toast.success(t("common.save"));
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  }

  async function createAndLink() {
    if (!newP.name_en.trim() || !newP.name_ar.trim()) {
      toast.error(t("contacts.validation.nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .insert({ name_en: newP.name_en.trim(), name_ar: newP.name_ar.trim(), default_margin: 10 } as never)
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as { id: string }).id;
      await logActivity("product", id, "created", { name: newP.name_en });
      await link.mutateAsync(id);
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "for-pick"] });
      setCreateOpen(false);
      setNewP({ name_en: "", name_ar: "" });
      toast.success(t("common.save"));
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 me-1" />{t("company360.linkProduct")}</Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-80" align="end">
            <Command>
              <CommandInput placeholder={t("common.search")} />
              <CommandList>
                <CommandEmpty>{t("commandPalette.empty")}</CommandEmpty>
                <CommandGroup>
                  {available.map((p) => (
                    <CommandItem key={p.id} value={ar ? p.name_ar : p.name_en} onSelect={() => pickExisting(p.id)}>
                      <Package className="me-2 h-4 w-4 text-muted-foreground" />
                      {ar ? p.name_ar : p.name_en}
                    </CommandItem>
                  ))}
                  <CommandItem
                    value="__add_new__"
                    onSelect={() => { setPickerOpen(false); setCreateOpen(true); }}
                    className="text-primary"
                  >
                    <Plus className="me-2 h-4 w-4" />{t("company360.addNewProduct")}
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {links.length === 0 ? (
        <EmptyState icon={Package} title={t("common.empty")} compact />
      ) : (
        <div className="divide-y border rounded-md bg-card">
          {links.map((l) => (
            <div key={l.id} className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{ar ? l.product?.name_ar : l.product?.name_en}</div>
                {l.product?.specialty && (
                  <div className="text-xs text-muted-foreground italic mt-0.5">{l.product.specialty}</div>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {l.product?.sector && (
                    <Badge variant="outline" className="text-[9px]">
                      {ar ? l.product.sector.name_ar : l.product.sector.name_en}
                    </Badge>
                  )}
                  {l.product?.default_margin != null && (
                    <span>{t("products.defaultMargin")}: {Number(l.product.default_margin)}%</span>
                  )}
                  {l.notes && <span className="truncate">· {l.notes}</span>}
                </div>
              </div>
              <Button
                variant="ghost" size="icon" aria-label={t("company360.unlinkProduct")}
                onClick={async () => { await unlink.mutateAsync(l.id); toast.success(t("common.save")); }}
              ><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("company360.addNewProduct")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name (EN)</Label>
              <Input value={newP.name_en} onChange={(e) => setNewP({ ...newP, name_en: e.target.value })} /></div>
            <div><Label>الاسم (AR)</Label>
              <Input value={newP.name_ar} onChange={(e) => setNewP({ ...newP, name_ar: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={createAndLink} disabled={saving}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
