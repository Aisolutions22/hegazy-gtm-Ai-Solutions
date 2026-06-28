import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";
import { ExtraFieldsManager, ExtraFieldsHint } from "@/components/shared/extra-fields-manager";
import { normalizeUrlForStorage } from "@/lib/url";

export type CompanyFormData = {
  id?: string;
  name?: string;
  type?: string;
  sector_id?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  linkedin?: string | null;
  location?: string | null;
  notes?: string | null;
};

export function CompanyForm({
  sectors,
  onDone,
  mode = "create",
  initialData,
}: {
  sectors: Array<{ id: string; name_en: string; name_ar: string }>;
  onDone: () => void;
  mode?: "create" | "edit";
  initialData?: CompanyFormData;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    type: initialData?.type ?? "target",
    sector_id: initialData?.sector_id ?? "",
    contact_person: initialData?.contact_person ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    website: initialData?.website ?? "",
    linkedin: initialData?.linkedin ?? "",
    location: initialData?.location ?? "",
    notes: initialData?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name.trim()) { toast.error(t("companies.fields.name")); return; }
    setSaving(true);
    const payload: Record<string, unknown> = { ...form };
    if (!payload.sector_id) delete payload.sector_id;
    if (mode === "edit" && initialData?.id) {
      const { error } = await supabase.from("companies").update(payload as never).eq("id", initialData.id);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      await logActivity("company", initialData.id, "edited", { name: form.name });
      qc.invalidateQueries({ queryKey: ["company", initialData.id] });
      qc.invalidateQueries({ queryKey: ["company-activity", initialData.id] });
    } else {
      const { data, error } = await supabase.from("companies").insert(payload as never).select().single();
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      if (data) await logActivity("company", data.id, "created", { name: data.name });
    }
    qc.invalidateQueries({ queryKey: ["companies"] });
    toast.success(t("common.save"));
    onDone();
  }

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{mode === "edit" ? t("common.edit") : t("companies.new")}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>{t("companies.fields.name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("companies.fields.type")}</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="target">{t("companies.types.target")}</SelectItem>
                <SelectItem value="opportunity">{t("companies.types.opportunity")}</SelectItem>
                <SelectItem value="customer">{t("companies.types.customer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("companies.fields.sector")}</Label>
            <Select value={form.sector_id} onValueChange={(v) => setForm({ ...form, sector_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("companies.fields.phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>{t("companies.fields.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="col-span-2"><Label>{t("companies.fields.location")}</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        </div>
        <div><Label>{t("companies.fields.website")}</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
        <div><Label>{t("companies.fields.linkedin")}</Label><Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /></div>
        <div><Label>{t("companies.fields.notes")}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        {mode === "edit" && initialData?.id ? (
          <ExtraFieldsManager entityType="company" entityId={initialData.id} />
        ) : (
          <ExtraFieldsHint />
        )}
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={saving}>{t("common.save")}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
