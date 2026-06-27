import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { fmtCurrency, fmtNumber, fmtPercent, fmtDate } from "@/lib/format";
import {
  TrendingUp, DollarSign, Percent, Package, Users, Target,
  CalendarClock, ListChecks, Sparkles, Activity as ActivityIcon, Factory, Building2,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import {
  useDashboardKpis, useDashboardMonthly, useTopOpportunities,
  useTodayTasks, useUpcomingDeadlines, useRecentActivities, useRecentCompanies,
} from "@/hooks/use-dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const { data: kpis } = useDashboardKpis();
  const { data: monthly } = useDashboardMonthly();
  const { data: topOpps } = useTopOpportunities();
  const { data: todayTasks } = useTodayTasks();
  const { data: upcoming } = useUpcomingDeadlines();
  const { data: activities } = useRecentActivities();
  const { data: recentCompanies } = useRecentCompanies();

  const kpiCards = [
    { label: t("dashboard.revenueYtd"), value: fmtCurrency(kpis?.rev, locale), icon: DollarSign },
    { label: t("dashboard.profitYtd"), value: fmtCurrency(kpis?.profit, locale), icon: TrendingUp },
    { label: t("dashboard.avgMargin"), value: fmtPercent(kpis?.margin, locale), icon: Percent },
    { label: t("dashboard.tonsYtd"), value: fmtNumber(kpis?.tons, locale), icon: Package },
    { label: t("dashboard.activeCustomers"), value: fmtNumber(kpis?.customers, locale), icon: Users },
    { label: t("dashboard.openOpps"), value: fmtNumber(kpis?.openOpps, locale), icon: Target },
  ];

  const chartHasData = (monthly ?? []).some((m) => m.revenue || m.profit || m.tons);
  const now = new Date();

  return (
    <div className="space-y-4 industrial-backdrop">
      {/* Executive header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md metal-card flex items-center justify-center">
            <Factory className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{t("dashboard.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="secondary" className="font-medium">{t("dashboard.period")}</Badge>
          <span className="text-muted-foreground">
            {t("dashboard.lastUpdated")} · {fmtDate(now, locale)}
          </span>
        </div>
      </div>
      <div className="aluminium-divider" />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {kpiCards.map((k) => (
          <Card key={k.label} className="metal-card overflow-hidden border-0 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</span>
                <k.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="text-lg font-bold tracking-tight tabular-nums">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Today's Focus */}
      <div className="grid lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 bg-coil">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t("dashboard.monthlyTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              {chartHasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly ?? []} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={10} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={10} />
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="revenue" name={t("dashboard.revenue")} stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="profit" name={t("dashboard.profit")} stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="tons" name={t("dashboard.tons")} stroke="var(--color-chart-4)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={TrendingUp} title={t("dashboard.noChartData")} className="h-full" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              {t("dashboard.todayFocus")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {(todayTasks ?? []).length === 0 ? (
              <EmptyState icon={ListChecks} title={t("dashboard.noTasks")} compact />
            ) : (
              (todayTasks ?? []).map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      task.priority === "urgent" ? "bg-destructive" :
                      task.priority === "high" ? "bg-warning" :
                      task.priority === "medium" ? "bg-primary" : "bg-muted-foreground"
                    }`} />
                    <span className="text-xs truncate">{task.title}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                    {t(`tasks.priorities.${task.priority}`)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* NBA + Upcoming Deadlines */}
      <div className="grid lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("dashboard.nextBestActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {(topOpps ?? []).length === 0 ? (
              <EmptyState icon={Target} title={t("dashboard.noOpps")} compact />
            ) : (
              (topOpps ?? []).map((o, idx) => (
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
                      <div className="text-xs font-medium truncate">
                        {t("dashboard.advance")}: {o.title || o.company?.name || "—"}
                      </div>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              {t("dashboard.upcomingDeadlines")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {(upcoming ?? []).length === 0 ? (
              <EmptyState icon={CalendarClock} title={t("dashboard.noDeadlines")} compact />
            ) : (
              (upcoming ?? []).map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                      {row.kind === "task" ? t("nav.tasks") : t("opportunities.title")}
                    </Badge>
                    <span className="text-xs truncate">{row.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{fmtDate(row.deadline, locale)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ActivityIcon className="h-4 w-4 text-primary" />
            {t("dashboard.recentActivities")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {(activities ?? []).length === 0 ? (
            <EmptyState icon={ActivityIcon} title={t("dashboard.noActivity")} compact />
          ) : (
            <div className="divide-y divide-border/50">
              {(activities ?? []).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs">
                      <span className="text-muted-foreground">{t(`activity.actions.${a.action}`)}</span>{" "}
                      <span className="font-medium">{a.entity_type}</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                    {fmtDate(a.created_at, locale)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
