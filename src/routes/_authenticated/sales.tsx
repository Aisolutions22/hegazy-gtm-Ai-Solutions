import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";
import { fmtCurrency, fmtMonth, fmtPercent } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/sales")({ component: SalesPage });

function SalesPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => (await supabase.from("sales_records").select("*, company:companies(name), product:products(name_en)").is("archived_at", null).order("period_month", { ascending: false })).data ?? [],
  });
  const { data: companies = [] } = useQuery({ queryKey: ["all-companies"], queryFn: async () => (await supabase.from("companies").select("id,name").is("archived_at", null)).data ?? [] });
  const { data: products = [] } = useQuery({ queryKey: ["all-products"], queryFn: async () => (await supabase.from("products").select("id,name_en").is("archived_at", null)).data ?? [] });

  return (
    <div>
      <PageHeader title={t("sales.title")} actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("sales.new")}</Button></DialogTrigger>
          <SalesForm companies={companies} products={products} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["sales"] }); }} />
        </Dialog>
      } />
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("sales.period")}</TableHead>
            <TableHead>{t("opportunities.company")}</TableHead>
            <TableHead>{t("opportunities.product")}</TableHead>
            <TableHead className="text-end">{t("sales.tons")}</TableHead>
            <TableHead className="text-end">{t("sales.revenue")}</TableHead>
            <TableHead className="text-end">{t("sales.profit")}</TableHead>
            <TableHead className="text-end">{t("sales.margin")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {sales.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t("common.empty")}</TableCell></TableRow>}
            {sales.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{fmtMonth(s.period_month, i18n.language)}</TableCell>
                <TableCell>{s.company?.name ?? "—"}</TableCell>
                <TableCell>{s.product?.name_en ?? "—"}</TableCell>
                <TableCell className="text-end">{Number(s.tons)}</TableCell>
                <TableCell className="text-end">{fmtCurrency(Number(s.revenue), i18n.language)}</TableCell>
                <TableCell className="text-end">{fmtCurrency(Number(s.profit), i18n.language)}</TableCell>
                <TableCell className="text-end">{fmtPercent(Number(s.margin), i18n.language)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function SalesForm({ companies, products, onDone }: { companies: Array<{ id: string; name: string }>; products: Array<{ id: string; name_en: string }>; onDone: () => void }) {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 7) + "-01";
  const [form, setForm] = useState({ company_id: "", product_id: "", period_month: today, tons: 0, revenue: 0, profit: 0 });
  async function save() {
    if (!form.company_id) { toast.error("company"); return; }
    const payload: Record<string, unknown> = { ...form };
    if (!payload.product_id) delete payload.product_id;
    const { data, error } = await supabase.from("sales_records").insert(payload as never).select().single();
    if (error) { toast.error(error.message); return; }
    if (data) await logActivity("sales_record", data.id, "created");
    toast.success(t("common.save"));
    onDone();
  }
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{t("sales.new")}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("opportunities.company")}</Label>
            <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t("opportunities.product")}</Label>
            <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name_en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t("sales.period")}</Label><Input type="date" value={form.period_month} onChange={(e) => setForm({ ...form, period_month: e.target.value })} /></div>
          <div><Label>{t("sales.tons")}</Label><Input type="number" value={form.tons} onChange={(e) => setForm({ ...form, tons: Number(e.target.value) })} /></div>
          <div><Label>{t("sales.revenue")}</Label><Input type="number" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: Number(e.target.value) })} /></div>
          <div><Label>{t("sales.profit")}</Label><Input type="number" value={form.profit} onChange={(e) => setForm({ ...form, profit: Number(e.target.value) })} /></div>
        </div>
      </div>
      <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
    </DialogContent>
  );
}
