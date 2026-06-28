import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSaveContact, type ContactRow } from "@/hooks/use-contacts";
import { CompanyCombobox } from "@/components/contacts/company-combobox";
import { ExtraFieldsManager, ExtraFieldsHint } from "@/components/shared/extra-fields-manager";

export function ContactForm({
  onDone,
  mode = "create",
  initialData,
  lockedCompanyId,
}: {
  onDone: () => void;
  mode?: "create" | "edit";
  initialData?: Partial<ContactRow>;
  /** When set (Team tab), the company combobox is pre-filled but still editable. */
  lockedCompanyId?: string | null;
}) {
  const { t } = useTranslation();
  const save = useSaveContact();

  const [form, setForm] = useState({
    full_name: initialData?.full_name ?? "",
    job_title: initialData?.job_title ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    linkedin: (initialData as { linkedin?: string | null } | undefined)?.linkedin ?? "",
    is_primary: initialData?.is_primary ?? false,
    notes: initialData?.notes ?? "",
    company_id: (initialData?.company_id ?? lockedCompanyId ?? null) as string | null,
  });

  async function onSave() {
    if (!form.full_name.trim()) { toast.error(t("contacts.validation.nameRequired")); return; }
    try {
      await save.mutateAsync({ id: initialData?.id, ...form });
      toast.success(t("common.save"));
      onDone();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  }

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{mode === "edit" ? t("common.edit") : t("contacts.new")}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>{t("contacts.fields.fullName")}</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("contacts.fields.jobTitle")}</Label>
            <Input value={form.job_title ?? ""} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
          </div>
          <div>
            <Label>{t("contacts.fields.phone")}</Label>
            <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>{t("contacts.fields.email")}</Label>
            <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>{t("contacts.fields.company")}</Label>
          <CompanyCombobox value={form.company_id} onChange={(id) => setForm({ ...form, company_id: id })} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="cursor-pointer">{t("contacts.fields.isPrimary")}</Label>
            <p className="text-xs text-muted-foreground">{t("contacts.fields.isPrimaryHint")}</p>
          </div>
          <Switch checked={form.is_primary} onCheckedChange={(v) => setForm({ ...form, is_primary: v })} />
        </div>
        <div>
          <Label>{t("contacts.fields.notes")}</Label>
          <Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>{t("common.cancel")}</Button>
        <Button onClick={onSave} disabled={save.isPending}>{t("common.save")}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
