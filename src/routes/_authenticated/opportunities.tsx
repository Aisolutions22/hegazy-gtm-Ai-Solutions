import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";
import { fmtCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { useOpportunities, useAllCompaniesLite, useAllProductsLite, useMoveOpportunityStage } from "@/hooks/use-opportunities";

const STAGES = ["lead", "contacted", "qualified", "negotiation", "won", "lost"] as const;

export const Route = createFileRoute("/_authenticated/opportunities")({ component: OppPage });

function OppPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: opps = [] } = useOpportunities();
  const { data: companies = [] } = useAllCompaniesLite();
  const { data: products = [] } = useAllProductsLite();
  const moveStageMut = useMoveOpportunityStage();

  async function moveStage(id: string, status: string) {
    try { await moveStageMut.mutateAsync({ id, status }); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div>
      <PageHeader title={t("opportunities.title")} actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("opportunities.new")}</Button></DialogTrigger>
          <OppForm companies={companies} products={products} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["opps"] }); }} />
        </Dialog>
      } />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
        {STAGES.map((stage) => {
          const items = opps.filter((o) => o.pipeline_status === stage);
          return (
            <div key={stage} className="min-w-[220px]">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(`opportunities.pipeline.${stage}`)}</h3>
                <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((o) => (
                  <Card key={o.id} className="hover:shadow-md transition">
                    <CardContent className="p-3 space-y-2">
                      <div className="text-sm font-medium">{o.title || o.company?.name}</div>
                      <div className="text-xs text-muted-foreground">{o.company?.name}{o.product ? ` · ${o.product.name_en}` : ""}</div>
                      <div className="text-sm font-semibold">{fmtCurrency(Number(o.expected_revenue), i18n.language)}</div>
                      <Select value={o.pipeline_status} onValueChange={(v) => moveStage(o.id, v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{t(`opportunities.pipeline.${s}`)}</SelectItem>)}</SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OppForm({ companies, products, onDone }: { companies: Array<{ id: string; name: string }>; products: Array<{ id: string; name_en: string }>; onDone: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ company_id: "", product_id: "", title: "", expected_tons: 0, expected_revenue: 0, expected_profit: 0, blockers: "", next_action: "", pipeline_status: "lead" });
  async function save() {
    if (!form.company_id) { toast.error(t("opportunities.company")); return; }
    const payload: Record<string, unknown> = { ...form };
    if (!payload.product_id) delete payload.product_id;
    const { data, error } = await supabase.from("opportunities").insert(payload as never).select().single();
    if (error) { toast.error(error.message); return; }
    if (data) await logActivity("opportunity", data.id, "created");
    toast.success(t("common.save"));
    onDone();
  }
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{t("opportunities.new")}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
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
          <div><Label>{t("opportunities.expectedTons")}</Label><Input type="number" value={form.expected_tons} onChange={(e) => setForm({ ...form, expected_tons: Number(e.target.value) })} /></div>
          <div><Label>{t("opportunities.expectedRevenue")}</Label><Input type="number" value={form.expected_revenue} onChange={(e) => setForm({ ...form, expected_revenue: Number(e.target.value) })} /></div>
          <div><Label>{t("opportunities.expectedProfit")}</Label><Input type="number" value={form.expected_profit} onChange={(e) => setForm({ ...form, expected_profit: Number(e.target.value) })} /></div>
          <div><Label>Stage</Label>
            <Select value={form.pipeline_status} onValueChange={(v) => setForm({ ...form, pipeline_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{t(`opportunities.pipeline.${s}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>{t("opportunities.blockers")}</Label><Textarea value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} /></div>
        <div><Label>{t("opportunities.nextAction")}</Label><Input value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} /></div>
      </div>
      <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
    </DialogContent>
  );
}
