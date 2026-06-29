import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useSectors } from "@/hooks/use-company";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sectors")({ component: SectorsPage });

function SectorsPage() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const qc = useQueryClient();
  const { data: sectors = [] } = useSectors();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name_en: "", name_ar: "" });
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState({ name_en: "", name_ar: "" });

  function refresh() { qc.invalidateQueries({ queryKey: ["sectors"] }); }

  function startEdit(s: { id: string; name_en: string; name_ar: string }) {
    setEditingId(s.id);
    setDraft({ name_en: s.name_en, name_ar: s.name_ar });
  }
  async function saveEdit() {
    if (!draft.name_en.trim() || !draft.name_ar.trim()) { toast.error(t("sectors.bothNamesRequired")); return; }
    const { error } = await supabase.from("sectors").update(draft as never).eq("id", editingId!);
    if (error) { toast.error(error.message); return; }
    setEditingId(null);
    refresh();
    toast.success(t("common.save"));
  }
  async function remove(id: string) {
    const [cRes, pRes] = await Promise.all([
      supabase.from("companies").select("id", { count: "exact", head: true }).eq("sector_id", id),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("sector_id", id),
    ]);
    const cCount = cRes.count ?? 0;
    const pCount = pRes.count ?? 0;
    if (cCount > 0 || pCount > 0) {
      toast.error(t("sectors.inUse", { companies: cCount, products: pCount }));
      return;
    }
    if (!confirm(t("sectors.confirmDelete"))) return;
    const { error } = await supabase.from("sectors").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
    toast.success(t("sectors.deleted"));
  }
  async function createNew() {
    if (!newDraft.name_en.trim() || !newDraft.name_ar.trim()) { toast.error(t("sectors.bothNamesRequired")); return; }
    const { error } = await supabase.from("sectors").insert(newDraft as never);
    if (error) { toast.error(error.message); return; }
    setNewDraft({ name_en: "", name_ar: "" });
    setCreating(false);
    refresh();
    toast.success(t("common.save"));
  }

  return (
    <div>
      <PageHeader title={t("nav.sectors")} description={t("sectors.manage")} />
      <Card>
        <CardContent className="p-0">
          <div className="p-3 flex justify-between items-center border-b">
            <div className="text-sm font-medium">{t("sectors.manage")}</div>
            {!creating && (
              <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4 me-1" />{t("sectors.new")}</Button>
            )}
          </div>
          {creating && (
            <div className="p-3 border-b grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div><Label className="text-xs">{t("sectors.nameEn")}</Label>
                <Input value={newDraft.name_en} onChange={(e) => setNewDraft({ ...newDraft, name_en: e.target.value })} /></div>
              <div><Label className="text-xs">{t("sectors.nameAr")}</Label>
                <Input value={newDraft.name_ar} onChange={(e) => setNewDraft({ ...newDraft, name_ar: e.target.value })} /></div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setNewDraft({ name_en: "", name_ar: "" }); }}>{t("common.cancel")}</Button>
                <Button size="sm" onClick={createNew}>{t("common.save")}</Button>
              </div>
            </div>
          )}
          <div className="divide-y">
            {sectors.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">{t("common.empty")}</div>}
            {sectors.map((s) => (
              <div key={s.id} className="p-3 flex items-center gap-2">
                {editingId === s.id ? (
                  <>
                    <Input className="flex-1" value={draft.name_en} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} placeholder={t("sectors.nameEn")} />
                    <Input className="flex-1" value={draft.name_ar} onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })} placeholder={t("sectors.nameAr")} />
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{t("common.cancel")}</Button>
                    <Button size="sm" onClick={saveEdit}>{t("common.save")}</Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {(s as { display_number?: number | null }).display_number != null && (
                          <span className="text-muted-foreground font-normal me-1">#{(s as { display_number?: number | null }).display_number}</span>
                        )}
                        {ar ? s.name_ar : s.name_en}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{ar ? s.name_en : s.name_ar}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(s)} aria-label={t("common.edit")}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(s.id)} aria-label={t("common.delete") || "Delete"}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
