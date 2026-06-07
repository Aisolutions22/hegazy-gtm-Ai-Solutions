import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/empty-state";
import { fmtCurrency, fmtNumber, fmtPercent } from "@/lib/format";
import { useRevenueCockpit } from "@/hooks/use-revenue-cockpit";
import {
  Gauge, TrendingUp, TrendingDown, AlertTriangle, Target, Sparkles,
  Trophy, Factory, ArrowUpRight, Activity, ShieldAlert, Crown, Lightbulb,
} from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend,
  BarChart, Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/revenue-cockpit")({
  component: RevenueCockpit,
});

const STAGE_COLORS: Record<string, string> = {
  lead: "var(--color-chart-4)",
  contacted: "var(--color-chart-5)",
  qualified: "var(--color-chart-2)",
  negotiation: "var(--color-chart-3)",
};

const TIER_COLORS: Record<string, string> = {
  A: "bg-success/15 text-success border-success/30",
  B: "bg-primary/15 text-primary border-primary/30",
  C: "bg-warning/15 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};

const REC_LEVEL: Record<string, { bg: string; icon: typeof Sparkles }> = {
  success: { bg: "border-l-success bg-success/5", icon: Trophy },
  warning: { bg: "border-l-warning bg-warning/5", icon: AlertTriangle },
  danger: { bg: "border-l-destructive bg-destructive/5", icon: ShieldAlert },
  info: { bg: "border-l-primary bg-primary/5", icon: Lightbulb },
};

function RevenueCockpit() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { data, isLoading } = useRevenueCockpit();

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-64 bg-muted/50 animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/30 animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const sectorName = (s: { name_en: string; name_ar: string }) => (locale === "ar" ? s.name_ar : s.name_en);
  const formatMonth = (m: string) => m.slice(5);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md gradient-primary flex items-center justify-center text-primary-foreground">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{t("cockpit.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("cockpit.subtitle")}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">{t("cockpit.executiveView")}</Badge>
      </div>
      <div className="aluminium-divider" />

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <KpiBlock
          label={t("cockpit.kpi.forecast90Rev")}
          value={fmtCurrency(data.next90RevForecast, locale)}
          icon={TrendingUp}
          accent="text-primary"
        />
        <KpiBlock
          label={t("cockpit.kpi.forecast90Profit")}
          value={fmtCurrency(data.next90ProfitForecast, locale)}
          icon={Sparkles}
          accent="text-success"
        />
        <KpiBlock
          label={t("cockpit.kpi.weightedPipeline")}
          value={fmtCurrency(data.weightedPipeline, locale)}
          sub={`${t("cockpit.kpi.totalPipeline")}: ${fmtCurrency(data.totalPipeline, locale)}`}
          icon={Target}
          accent="text-chart-3"
        />
        <KpiBlock
          label={t("cockpit.kpi.concentration")}
          value={fmtPercent(data.top1Share, locale)}
          sub={`Top 3: ${fmtPercent(data.top3Share, locale)}`}
          icon={ShieldAlert}
          accent={data.top1Share > 35 ? "text-destructive" : "text-muted-foreground"}
        />
      </div>

      {/* Forecast chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t("cockpit.forecast.title")}
            <Badge variant="outline" className="text-[9px] ms-auto">{t("cockpit.forecast.legend")}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.forecast} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tickFormatter={formatMonth} stroke="var(--color-muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="actualRevenue" name={t("cockpit.forecast.actualRev")} fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="forecastRevenue" name={t("cockpit.forecast.fcRev")} fill="var(--color-chart-2)" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="actualProfit" name={t("cockpit.forecast.actualProfit")} stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="forecastProfit" name={t("cockpit.forecast.fcProfit")} stroke="var(--color-chart-3)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline + Sector */}
      <div className="grid lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {t("cockpit.pipeline.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {data.pipeline.map((p) => {
              const pct = data.totalPipeline > 0 ? (p.value / data.totalPipeline) * 100 : 0;
              return (
                <div key={p.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[p.stage] }} />
                      <span className="font-medium">{t(`opportunities.pipeline.${p.stage}`)}</span>
                      <span className="text-muted-foreground">({p.count})</span>
                    </div>
                    <span className="tabular-nums font-semibold">{fmtCurrency(p.value, locale)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: STAGE_COLORS[p.stage] }} />
                  </div>
                </div>
              );
            })}
            {data.pipeline.every((p) => p.count === 0) && (
              <EmptyState icon={Target} title={t("cockpit.pipeline.empty")} compact />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Factory className="h-4 w-4 text-primary" />
              {t("cockpit.sector.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              {data.revenueBySector.length === 0 ? (
                <EmptyState icon={Factory} title={t("cockpit.sector.empty")} className="h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.revenueBySector.slice(0, 8).map((s) => ({ name: sectorName(s), revenue: s.revenue }))} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={10} />
                    <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={10} width={100} />
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtCurrency(v, locale)} />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {data.revenueBySector.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={`var(--color-chart-${(i % 5) + 1})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Targets + Top Opps This Month */}
      <div className="grid lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              {t("cockpit.targets.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1.5">
            {data.topTargets.length === 0 ? (
              <EmptyState icon={Crown} title={t("cockpit.targets.empty")} compact />
            ) : (
              data.topTargets.map((c) => (
                <Link
                  key={c.id}
                  to="/companies/$id"
                  params={{ id: c.id }}
                  className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${TIER_COLORS[c.icp_tier] ?? TIER_COLORS.low}`}>
                      {c.icp_tier}
                    </Badge>
                    <span className="text-xs font-medium truncate">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">ICP {c.icp_score}</span>
                    <span className="text-xs font-semibold tabular-nums">{fmtCurrency(c.pipelineValue, locale)}</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("cockpit.topOpps.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1.5">
            {data.topOppsMonth.length === 0 ? (
              <EmptyState icon={Sparkles} title={t("cockpit.topOpps.empty")} compact />
            ) : (
              data.topOppsMonth.map((o, idx) => (
                <Link
                  key={o.id}
                  to="/opportunities"
                  className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-5 w-5 rounded bg-muted text-[10px] font-semibold flex items-center justify-center shrink-0 text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{o.title || o.company?.name || "—"}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{o.company?.name}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold tabular-nums">{fmtCurrency(Number(o.expected_revenue), locale)}</div>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{t(`opportunities.pipeline.${o.pipeline_status}`)}</Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk + Goal */}
      <div className="grid lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              {t("cockpit.risk.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("cockpit.risk.top1")}</span>
              <span className={`font-semibold tabular-nums ${data.top1Share > 35 ? "text-destructive" : ""}`}>
                {fmtPercent(data.top1Share, locale)}
              </span>
            </div>
            <Progress value={Math.min(100, data.top1Share)} className={data.top1Share > 35 ? "[&>div]:bg-destructive" : ""} />
            <div className="pt-2 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("cockpit.risk.atRisk")}</p>
              {data.atRiskCustomers.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("cockpit.risk.allCovered")}</p>
              ) : (
                data.atRiskCustomers.map((c) => (
                  <Link
                    key={c.id}
                    to="/companies/$id"
                    params={{ id: c.id }}
                    className="flex items-center justify-between gap-2 py-1 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors"
                  >
                    <span className="text-xs truncate">{c.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground tabular-nums">{fmtCurrency(c.rev, locale)}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-warning border-warning/30">
                        {fmtPercent(c.share, locale)}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {t("cockpit.goal.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("cockpit.goal.actual")}</div>
                <div className="text-2xl font-bold tabular-nums">{fmtCurrency(data.goal.actual, locale)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("cockpit.goal.target")}</div>
                <div className="text-sm font-semibold tabular-nums text-muted-foreground">{fmtCurrency(data.goal.target, locale)}</div>
              </div>
            </div>
            <Progress value={Math.min(100, data.goal.progress)} />
            <div className="flex items-center justify-between text-xs">
              <Badge variant={data.goal.progress >= 100 ? "default" : data.goal.progress >= 70 ? "secondary" : "destructive"}>
                {fmtPercent(data.goal.progress, locale)}
              </Badge>
              <span className={`flex items-center gap-1 tabular-nums ${data.goal.delta >= 0 ? "text-success" : "text-destructive"}`}>
                {data.goal.delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {fmtCurrency(Math.abs(data.goal.delta), locale)} {t("cockpit.goal.vsPrev")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sector ranking */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            {t("cockpit.ranking.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.sectorRanking.length === 0 ? (
            <EmptyState icon={Trophy} title={t("cockpit.ranking.empty")} compact />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b">
                    <th className="text-start font-medium py-2">#</th>
                    <th className="text-start font-medium py-2">{t("cockpit.ranking.sector")}</th>
                    <th className="text-end font-medium py-2">{t("cockpit.ranking.revenue")}</th>
                    <th className="text-end font-medium py-2">{t("cockpit.ranking.tons")}</th>
                    <th className="text-end font-medium py-2">{t("cockpit.ranking.margin")}</th>
                    <th className="text-end font-medium py-2">{t("cockpit.ranking.share")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sectorRanking.map((s, i) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/40">
                      <td className="py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="py-2 font-medium">{sectorName(s)}</td>
                      <td className="py-2 text-end tabular-nums font-semibold">{fmtCurrency(s.revenue, locale)}</td>
                      <td className="py-2 text-end tabular-nums">{fmtNumber(s.tons, locale)}</td>
                      <td className="py-2 text-end tabular-nums">
                        <span className={s.margin >= 15 ? "text-success" : s.margin >= 8 ? "" : "text-warning"}>
                          {fmtPercent(s.margin, locale)}
                        </span>
                      </td>
                      <td className="py-2 text-end tabular-nums text-muted-foreground">{fmtPercent(s.share, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategic Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            {t("cockpit.recs.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {data.recs.length === 0 ? (
            <EmptyState icon={Lightbulb} title={t("cockpit.recs.empty")} compact />
          ) : (
            data.recs.map((r) => {
              const meta = REC_LEVEL[r.level];
              const Icon = meta.icon;
              return (
                <div key={r.id} className={`flex items-start gap-3 p-3 rounded border-l-4 ${meta.bg}`}>
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-xs leading-relaxed">{t(`cockpit.recs.${r.titleKey}`, r.values as never)}</p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiBlock({
  label, value, sub, icon: Icon, accent = "text-primary",
}: { label: string; value: string; sub?: string; icon: typeof Sparkles; accent?: string }) {
  return (
    <Card className="metal-card border-0 shadow-none">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className={`h-3.5 w-3.5 ${accent}`} />
        </div>
        <div className="text-lg font-bold tracking-tight tabular-nums">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}
