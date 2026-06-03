import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { fmtCurrency, fmtNumber, fmtPercent } from "@/lib/format";
import { TrendingUp, DollarSign, Percent, Package, Users, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const { data: kpis } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const [sales, customers, opps] = await Promise.all([
        supabase.from("sales_records").select("revenue,profit,tons").gte("period_month", yearStart).is("archived_at", null),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("type", "customer").is("archived_at", null),
        supabase.from("opportunities").select("id", { count: "exact", head: true }).not("pipeline_status", "in", "(won,lost)").is("archived_at", null),
      ]);
      const rev = sales.data?.reduce((s, r) => s + Number(r.revenue || 0), 0) ?? 0;
      const profit = sales.data?.reduce((s, r) => s + Number(r.profit || 0), 0) ?? 0;
      const tons = sales.data?.reduce((s, r) => s + Number(r.tons || 0), 0) ?? 0;
      const margin = rev > 0 ? (profit / rev) * 100 : 0;
      return { rev, profit, tons, margin, customers: customers.count ?? 0, openOpps: opps.count ?? 0 };
    },
  });

  const { data: monthly } = useQuery({
    queryKey: ["dashboard-monthly"],
    queryFn: async () => {
      const year = new Date().getFullYear();
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      const { data } = await supabase.from("sales_records").select("period_month,revenue,profit,tons").gte("period_month", yearStart).lte("period_month", yearEnd).is("archived_at", null);
      const map = new Map<string, { month: string; revenue: number; profit: number; tons: number }>();
      for (let i = 0; i < 12; i++) {
        const k = `${year}-${String(i + 1).padStart(2, "0")}`;
        map.set(k, { month: k, revenue: 0, profit: 0, tons: 0 });
      }
      (data ?? []).forEach((r) => {
        const k = String(r.period_month).slice(0, 7);
        const e = map.get(k); if (!e) return;
        e.revenue += Number(r.revenue); e.profit += Number(r.profit); e.tons += Number(r.tons);
      });
      return Array.from(map.values());
    },
  });


  const { data: topOpps } = useQuery({
    queryKey: ["dashboard-top-opps"],
    queryFn: async () => {
      const { data } = await supabase.from("opportunities").select("id,title,expected_revenue,pipeline_status,company:companies(name)").not("pipeline_status", "in", "(won,lost)").is("archived_at", null).order("expected_revenue", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const { data: todayTasks } = useQuery({
    queryKey: ["dashboard-today"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from("tasks").select("id,title,priority,deadline").lte("deadline", today).neq("status", "completed").is("archived_at", null).order("deadline").limit(8);
      return data ?? [];
    },
  });

  const kpiCards = [
    { label: t("dashboard.revenueYtd"), value: fmtCurrency(kpis?.rev, locale), icon: DollarSign },
    { label: t("dashboard.profitYtd"), value: fmtCurrency(kpis?.profit, locale), icon: TrendingUp },
    { label: t("dashboard.avgMargin"), value: fmtPercent(kpis?.margin, locale), icon: Percent },
    { label: t("dashboard.tonsYtd"), value: fmtNumber(kpis?.tons, locale), icon: Package },
    { label: t("dashboard.activeCustomers"), value: fmtNumber(kpis?.customers, locale), icon: Users },
    { label: t("dashboard.openOpps"), value: fmtNumber(kpis?.openOpps, locale), icon: Target },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("dashboard.title")} description={t("app.tagline")} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xl font-bold tracking-tight">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("dashboard.monthlyTrend")}</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" name={t("dashboard.revenue")} stroke="var(--color-chart-1)" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" name={t("dashboard.profit")} stroke="var(--color-chart-3)" strokeWidth={2} />
                <Line type="monotone" dataKey="tons" name={t("dashboard.tons")} stroke="var(--color-chart-4)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("dashboard.topOpps")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(topOpps ?? []).length === 0 && <p className="text-sm text-muted-foreground">{t("dashboard.noOpps")}</p>}
            {(topOpps ?? []).map((o) => (
              <div key={o.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                <div>
                  <div className="text-sm font-medium">{o.title || o.company?.name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{o.company?.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{fmtCurrency(Number(o.expected_revenue), locale)}</div>
                  <Badge variant="secondary" className="text-[10px]">{t(`opportunities.pipeline.${o.pipeline_status}`)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("dashboard.todayFocus")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(todayTasks ?? []).length === 0 && <p className="text-sm text-muted-foreground">{t("dashboard.noTasks")}</p>}
            {(todayTasks ?? []).map((task) => (
              <div key={task.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                <span className="text-sm">{task.title}</span>
                <Badge variant="outline" className="text-[10px]">{t(`tasks.priorities.${task.priority}`)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
