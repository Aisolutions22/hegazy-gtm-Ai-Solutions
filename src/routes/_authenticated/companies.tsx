import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Archive as ArchiveIcon } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/companies")({
  component: CompaniesPage,
});

function CompaniesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*, sector:sectors(name_en,name_ar)").is("archived_at", null).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: sectors = [] } = useQuery({
    queryKey: ["sectors"],
    queryFn: async () => (await supabase.from("sectors").select("*").is("archived_at", null)).data ?? [],
  });

  const filtered = companies.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  async function archiveCompany(id: string) {
    await supabase.from("companies").update({ archived_at: new Date().toISOString() }).eq("id", id);
    await logActivity("company", id, "archived");
    qc.invalidateQueries({ queryKey: ["companies"] });
    toast.success(t("common.archive"));
  }

  return (
    <div>
      <PageHeader
        title={t("companies.title")}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 me-1" />{t("companies.new")}</Button>
            </DialogTrigger>
            <CompanyForm sectors={sectors} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["companies"] }); }} />
          </Dialog>
        }
      />
      <Card className="mb-4"><CardContent className="p-3">
        <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </CardContent></Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("companies.fields.name")}</TableHead>
              <TableHead>{t("companies.fields.type")}</TableHead>
              <TableHead>{t("companies.fields.sector")}</TableHead>
              <TableHead>{t("companies.fields.contactPerson")}</TableHead>
              <TableHead>{t("companies.fields.phone")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t("common.empty")}</TableCell></TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell><Link to="/companies/$id" params={{ id: c.id }} className="font-medium hover:underline">{c.name}</Link></TableCell>
                <TableCell><Badge variant={c.type === "customer" ? "default" : "secondary"}>{t(`companies.types.${c.type}`)}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.sector?.name_en ?? "—"}</TableCell>
                <TableCell className="text-sm">{c.contact_person ?? "—"}</TableCell>
                <TableCell className="text-sm">{c.phone ?? "—"}</TableCell>
                <TableCell className="text-end">
                  <Button variant="ghost" size="icon" onClick={() => archiveCompany(c.id)}><ArchiveIcon className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CompanyForm({ sectors, onDone }: { sectors: Array<{ id: string; name_en: string; name_ar: string }>; onDone: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", type: "target", sector_id: "", contact_person: "", phone: "", email: "", website: "", location: "", notes: "" });
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!form.name.trim()) { toast.error(t("companies.fields.name")); return; }
    setSaving(true);
    const payload: Record<string, unknown> = { ...form };
    if (!payload.sector_id) delete payload.sector_id;
    const { data, error } = await supabase.from("companies").insert(payload as never).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (data) await logActivity("company", data.id, "created", { name: data.name });
    toast.success(t("common.save"));
    onDone();
  }
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{t("companies.new")}</DialogTitle></DialogHeader>
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
          <div><Label>{t("companies.fields.contactPerson")}</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
          <div><Label>{t("companies.fields.phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>{t("companies.fields.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>{t("companies.fields.location")}</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        </div>
        <div><Label>{t("companies.fields.website")}</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
        <div><Label>{t("companies.fields.notes")}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={saving}>{t("common.save")}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
