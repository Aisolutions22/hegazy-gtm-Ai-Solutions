import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Archive as ArchiveIcon, Package, Pencil, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCompaniesDialog } from "@/components/products/product-companies-dialog";

import { toast } from "sonner";
import { logActivity } from "@/lib/activity";
import { useSectors } from "@/hooks/use-company";
import { SectorCombobox } from "@/components/shared/sector-combobox";

export const Route = createFileRoute("/_authenticated/products")({ component: ProductsPage });

type ProductRow = {
  id: string;
  name_en: string;
  name_ar: string;
  description?: string | null;
  specialty?: string | null;
  default_margin: number | string;
  sector_id?: string | null;
};

type Sector = { id: string; name_en: string; name_ar: string };

function ProductsPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery<ProductRow[]>({
    queryKey: ["products"],
    queryFn: async () => (await supabase.from("products").select("*").is("archived_at", null).order("created_at")).data as ProductRow[] ?? [],
  });
  const { data: sectors = [] } = useSectors() as { data: Sector[] };
  const ar = i18n.language === "ar";
  const editing = products.find((p) => p.id === editingId);

  const grouped = useMemo(() => {
    const map = new Map<string | null, { sector: Sector | null; items: ProductRow[] }>();
    for (const s of sectors) map.set(s.id, { sector: s, items: [] });
    map.set(null, { sector: null, items: [] });
    for (const p of products) {
      const k = p.sector_id ?? null;
      if (!map.has(k)) map.set(k, { sector: null, items: [] });
      map.get(k)!.items.push(p);
    }
    return Array.from(map.values()).filter((g) => g.items.length > 0);
  }, [products, sectors]);

  async function archive(id: string) {
    await supabase.from("products").update({ archived_at: new Date().toISOString() }).eq("id", id);
    await logActivity("product", id, "archived");
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  return (
    <div>
      <PageHeader title={t("products.title")} actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("products.new")}</Button></DialogTrigger>
          <ProductForm sectors={sectors} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["products"] }); }} />
        </Dialog>
      } />

      <div className="space-y-6">
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={`sk-${i}`}><CardContent className="p-5 space-y-3">
                <div className="flex justify-between"><Skeleton className="h-10 w-10 rounded-lg" /><Skeleton className="h-6 w-20" /></div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent></Card>
            ))}
          </div>
        )}
        {!isLoading && grouped.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">{t("common.empty")}</CardContent></Card>
        )}
        {grouped.map((group) => {
          const title = group.sector
            ? (ar ? group.sector.name_ar : group.sector.name_en)
            : t("products.otherSector");
          return (
            <section key={group.sector?.id ?? "__other__"} className="space-y-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight">{title}</h2>
                <p className="text-xs text-muted-foreground">{t("products.sectorGroupLabel")}</p>
              </div>
              <div className="aluminium-divider" />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map((p) => (
                  <Card key={p.id} className="transition-shadow duration-200 hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="h-5 w-5 text-primary" /></div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewingId(p.id)} aria-label={t("products.viewCompanies")} title={t("products.viewCompanies")}><Building2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingId(p.id)} aria-label={t("common.edit")}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => archive(p.id)}><ArchiveIcon className="h-4 w-4" /></Button>
                        </div>

                      </div>
                      <h3 className="font-semibold">
                        {(p as { display_number?: number | null }).display_number != null && (
                          <span className="text-muted-foreground font-normal me-1">#{(p as { display_number?: number | null }).display_number}</span>
                        )}
                        {ar ? p.name_ar : p.name_en}
                      </h3>
                      {p.specialty && (
                        <div className="mt-0.5 text-xs text-muted-foreground italic">{p.specialty}</div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                      <div className="mt-3 text-xs"><span className="text-muted-foreground">{t("products.defaultMargin")}: </span><span className="font-semibold">{Number(p.default_margin)}%</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={!!editingId} onOpenChange={(o) => { if (!o) setEditingId(null); }}>
        {editing && (
          <ProductForm
            sectors={sectors}
            mode="edit"
            initialData={editing}
            onDone={() => { setEditingId(null); qc.invalidateQueries({ queryKey: ["products"] }); }}
          />
        )}
      </Dialog>

      <ProductCompaniesDialog
        productId={viewingId}
        productName={(() => {
          const p = products.find((x) => x.id === viewingId);
          return p ? (ar ? p.name_ar : p.name_en) : undefined;
        })()}
        open={!!viewingId}
        onOpenChange={(o) => { if (!o) setViewingId(null); }}
      />
    </div>

  );
}

function ProductForm({
  onDone,
  mode = "create",
  initialData,
  sectors,
}: {
  onDone: () => void;
  mode?: "create" | "edit";
  initialData?: ProductRow;
  sectors: Sector[];
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name_en: initialData?.name_en ?? "",
    name_ar: initialData?.name_ar ?? "",
    specialty: initialData?.specialty ?? "",
    description: initialData?.description ?? "",
    default_margin: Number(initialData?.default_margin ?? 10),
    sector_id: (initialData?.sector_id ?? null) as string | null,
  });
  async function save() {
    if (!form.name_en.trim() || !form.name_ar.trim()) { toast.error("Name required"); return; }
    const payload: Record<string, unknown> = { ...form };
    if (!payload.sector_id) payload.sector_id = null;
    if (mode === "edit" && initialData) {
      const { error } = await supabase.from("products").update(payload as never).eq("id", initialData.id);
      if (error) { toast.error(error.message); return; }
      await logActivity("product", initialData.id, "edited", { name: form.name_en });
    } else {
      const { data, error } = await supabase.from("products").insert(payload as never).select().single();
      if (error) { toast.error(error.message); return; }
      if (data) await logActivity("product", data.id, "created", { name: data.name_en });
    }
    toast.success(t("common.save"));
    onDone();
  }
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{mode === "edit" ? t("common.edit") : t("products.new")}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Name (EN)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
        <div><Label>الاسم (AR)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
        <div>
          <Label>{t("products.specialty")}</Label>
          <Input value={form.specialty ?? ""} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder={t("products.specialtyPlaceholder")} />
        </div>
        <div>
          <Label>{t("common.sector")}</Label>
          <SectorCombobox sectors={sectors} value={form.sector_id} onChange={(id) => setForm({ ...form, sector_id: id })} />
        </div>
        <div><Label>{t("products.defaultMargin")}</Label><Input type="number" value={form.default_margin} onChange={(e) => setForm({ ...form, default_margin: Number(e.target.value) })} /></div>
        <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      </div>
      <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
    </DialogContent>
  );
}
