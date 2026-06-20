import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Archive as ArchiveIcon, Package, Pencil } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/products")({ component: ProductsPage });

type ProductRow = {
  id: string;
  name_en: string;
  name_ar: string;
  description?: string | null;
  default_margin: number | string;
};

function ProductsPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await supabase.from("products").select("*").is("archived_at", null).order("created_at")).data ?? [],
  });
  const ar = i18n.language === "ar";
  const editing = products.find((p) => p.id === editingId);

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
          <ProductForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["products"] }); }} />
        </Dialog>
      } />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="h-5 w-5 text-primary" /></div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingId(p.id)} aria-label={t("common.edit")}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => archive(p.id)}><ArchiveIcon className="h-4 w-4" /></Button>
                </div>
              </div>
              <h3 className="font-semibold">{ar ? p.name_ar : p.name_en}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
              <div className="mt-3 text-xs"><span className="text-muted-foreground">{t("products.defaultMargin")}: </span><span className="font-semibold">{Number(p.default_margin)}%</span></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingId} onOpenChange={(o) => { if (!o) setEditingId(null); }}>
        {editing && (
          <ProductForm
            mode="edit"
            initialData={editing as ProductRow}
            onDone={() => { setEditingId(null); qc.invalidateQueries({ queryKey: ["products"] }); }}
          />
        )}
      </Dialog>
    </div>
  );
}

function ProductForm({
  onDone,
  mode = "create",
  initialData,
}: {
  onDone: () => void;
  mode?: "create" | "edit";
  initialData?: ProductRow;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name_en: initialData?.name_en ?? "",
    name_ar: initialData?.name_ar ?? "",
    description: initialData?.description ?? "",
    default_margin: Number(initialData?.default_margin ?? 10),
  });
  async function save() {
    if (!form.name_en.trim() || !form.name_ar.trim()) { toast.error("Name required"); return; }
    if (mode === "edit" && initialData) {
      const { error } = await supabase.from("products").update(form).eq("id", initialData.id);
      if (error) { toast.error(error.message); return; }
      await logActivity("product", initialData.id, "edited", { name: form.name_en });
    } else {
      const { data, error } = await supabase.from("products").insert(form).select().single();
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
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>{t("products.defaultMargin")}</Label><Input type="number" value={form.default_margin} onChange={(e) => setForm({ ...form, default_margin: Number(e.target.value) })} /></div>
      </div>
      <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
    </DialogContent>
  );
}
