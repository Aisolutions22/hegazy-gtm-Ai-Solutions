import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STAGE_WEIGHTS: Record<string, number> = {
  lead: 0.1,
  contacted: 0.25,
  qualified: 0.5,
  negotiation: 0.75,
  won: 1,
  lost: 0,
};

const STAGE_ORDER = ["lead", "contacted", "qualified", "negotiation", "won"] as const;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function addMonths(base: Date, n: number) {
  return new Date(base.getFullYear(), base.getMonth() + n, 1);
}

export type CockpitData = ReturnType<typeof buildCockpit>;

function buildCockpit(args: {
  sales: { period_month: string; revenue: number; profit: number; tons: number; company_id: string }[];
  opps: {
    id: string; title: string | null; expected_revenue: number; expected_profit: number;
    pipeline_status: string; deadline: string | null; updated_at: string; company_id: string;
    company: { name: string; sector_id: string | null; type: string } | null;
  }[];
  companies: { id: string; name: string; type: string; sector_id: string | null; icp_score: number | null; icp_tier: string | null }[];
  sectors: { id: string; name_en: string; name_ar: string }[];
}) {
  const { sales, opps, companies, sectors } = args;
  const sectorById = new Map(sectors.map((s) => [s.id, s]));
  const companyById = new Map(companies.map((c) => [c.id, c]));

  // ---- Forecast (12 months: trailing 6 actuals + current + 5 forward weighted)
  const today = new Date();
  const startMonth = addMonths(today, -6);
  const forecast: { month: string; actualRevenue: number; actualProfit: number; forecastRevenue: number; forecastProfit: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = addMonths(startMonth, i);
    forecast.push({ month: monthKey(d), actualRevenue: 0, actualProfit: 0, forecastRevenue: 0, forecastProfit: 0 });
  }
  const fMap = new Map(forecast.map((r) => [r.month, r]));
  for (const s of sales) {
    const k = String(s.period_month).slice(0, 7);
    const row = fMap.get(k);
    if (row) {
      row.actualRevenue += Number(s.revenue || 0);
      row.actualProfit += Number(s.profit || 0);
    }
  }
  const todayKey = monthKey(today);
  for (const o of opps) {
    if (o.pipeline_status === "won" || o.pipeline_status === "lost" || !o.deadline) continue;
    const k = String(o.deadline).slice(0, 7);
    const row = fMap.get(k);
    if (!row || k < todayKey) continue;
    const w = STAGE_WEIGHTS[o.pipeline_status] ?? 0;
    row.forecastRevenue += Number(o.expected_revenue || 0) * w;
    row.forecastProfit += Number(o.expected_profit || 0) * w;
  }

  // ---- Pipeline Health (open only)
  const pipeline = STAGE_ORDER.filter((s) => s !== "won").map((stage) => {
    const items = opps.filter((o) => o.pipeline_status === stage);
    const value = items.reduce((s, o) => s + Number(o.expected_revenue || 0), 0);
    const weighted = value * (STAGE_WEIGHTS[stage] ?? 0);
    return { stage, count: items.length, value, weighted };
  });
  const totalPipeline = pipeline.reduce((s, r) => s + r.value, 0);
  const weightedPipeline = pipeline.reduce((s, r) => s + r.weighted, 0);

  // ---- Revenue by sector (YTD)
  const yearStart = `${today.getFullYear()}-01-01`;
  const sectorAgg = new Map<string, { id: string; name_en: string; name_ar: string; revenue: number; profit: number; tons: number }>();
  for (const s of sales) {
    if (String(s.period_month) < yearStart) continue;
    const c = companyById.get(s.company_id);
    const sid = c?.sector_id ?? "__none__";
    const sec = sid === "__none__" ? null : sectorById.get(sid);
    const key = sid;
    const entry = sectorAgg.get(key) ?? {
      id: key,
      name_en: sec?.name_en ?? "Uncategorized",
      name_ar: sec?.name_ar ?? "غير مصنف",
      revenue: 0, profit: 0, tons: 0,
    };
    entry.revenue += Number(s.revenue || 0);
    entry.profit += Number(s.profit || 0);
    entry.tons += Number(s.tons || 0);
    sectorAgg.set(key, entry);
  }
  const revenueBySector = Array.from(sectorAgg.values()).sort((a, b) => b.revenue - a.revenue);
  const totalYtdRevenue = revenueBySector.reduce((s, r) => s + r.revenue, 0);

  const sectorRanking = revenueBySector.map((s) => ({
    ...s,
    margin: s.revenue > 0 ? (s.profit / s.revenue) * 100 : 0,
    share: totalYtdRevenue > 0 ? (s.revenue / totalYtdRevenue) * 100 : 0,
  }));

  // ---- Top Target Accounts (by ICP, with open-opp value)
  const openOppByCompany = new Map<string, { count: number; value: number }>();
  for (const o of opps) {
    if (o.pipeline_status === "won" || o.pipeline_status === "lost") continue;
    const e = openOppByCompany.get(o.company_id) ?? { count: 0, value: 0 };
    e.count += 1;
    e.value += Number(o.expected_revenue || 0);
    openOppByCompany.set(o.company_id, e);
  }
  const topTargets = companies
    .filter((c) => c.type === "target")
    .sort((a, b) => (b.icp_score ?? 0) - (a.icp_score ?? 0))
    .slice(0, 6)
    .map((c) => ({
      id: c.id, name: c.name, icp_score: c.icp_score ?? 0, icp_tier: c.icp_tier ?? "low",
      openOpps: openOppByCompany.get(c.id)?.count ?? 0,
      pipelineValue: openOppByCompany.get(c.id)?.value ?? 0,
    }));

  // ---- Revenue Risk
  const customerRevenue = new Map<string, number>();
  for (const s of sales) {
    if (String(s.period_month) < yearStart) continue;
    customerRevenue.set(s.company_id, (customerRevenue.get(s.company_id) ?? 0) + Number(s.revenue || 0));
  }
  const sortedCustomers = Array.from(customerRevenue.entries())
    .map(([id, rev]) => ({ id, rev, name: companyById.get(id)?.name ?? "—" }))
    .sort((a, b) => b.rev - a.rev);
  const totalCustRevenue = sortedCustomers.reduce((s, r) => s + r.rev, 0);
  const top1Share = totalCustRevenue > 0 ? (sortedCustomers[0]?.rev ?? 0) / totalCustRevenue * 100 : 0;
  const top3Share = totalCustRevenue > 0
    ? sortedCustomers.slice(0, 3).reduce((s, r) => s + r.rev, 0) / totalCustRevenue * 100
    : 0;
  const atRiskCustomers = sortedCustomers.slice(0, 10)
    .filter((c) => (openOppByCompany.get(c.id)?.count ?? 0) === 0)
    .slice(0, 5)
    .map((c) => ({ ...c, share: totalCustRevenue > 0 ? (c.rev / totalCustRevenue) * 100 : 0 }));

  // ---- Top Opps This Month
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = addMonths(today, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const topOppsMonth = opps
    .filter((o) =>
      o.pipeline_status !== "won" && o.pipeline_status !== "lost" &&
      o.deadline && o.deadline >= monthStart && o.deadline < monthEnd
    )
    .sort((a, b) => Number(b.expected_revenue) - Number(a.expected_revenue))
    .slice(0, 6);

  // ---- 90-Day Progress (trailing 90 days vs prior 90 days)
  const now = today.getTime();
  const day = 24 * 60 * 60 * 1000;
  const t0 = now - 90 * day;
  const tPrev0 = now - 180 * day;
  let curr90Rev = 0, prev90Rev = 0;
  for (const s of sales) {
    const t = new Date(s.period_month).getTime();
    if (t >= t0 && t <= now) curr90Rev += Number(s.revenue || 0);
    else if (t >= tPrev0 && t < t0) prev90Rev += Number(s.revenue || 0);
  }
  // Target: prior90 * 1.15 (15% growth)
  const goal90 = prev90Rev * 1.15;
  const goalProgress = goal90 > 0 ? (curr90Rev / goal90) * 100 : 0;
  const goalDelta = curr90Rev - prev90Rev;

  // ---- Strategic Recommendations
  const recs: { id: string; level: "info" | "warning" | "success" | "danger"; titleKey: string; values: Record<string, string | number> }[] = [];
  if (sectorRanking[0]) {
    recs.push({
      id: "top-sector", level: "success", titleKey: "topSector",
      values: { sector: sectorRanking[0].name_en, share: Math.round(sectorRanking[0].share) },
    });
  }
  if (top1Share > 35) {
    recs.push({
      id: "concentration", level: "danger", titleKey: "concentration",
      values: { name: sortedCustomers[0]?.name ?? "—", share: Math.round(top1Share) },
    });
  }
  const stalledNeg = opps.filter((o) => {
    if (o.pipeline_status !== "negotiation") return false;
    const ageDays = (now - new Date(o.updated_at).getTime()) / day;
    return ageDays > 14;
  }).length;
  if (stalledNeg > 0) {
    recs.push({
      id: "stalled-neg", level: "warning", titleKey: "stalledNegotiation",
      values: { count: stalledNeg },
    });
  }
  const aTargetsNoOpp = companies.filter((c) =>
    c.type === "target" && c.icp_tier === "A" && (openOppByCompany.get(c.id)?.count ?? 0) === 0
  ).length;
  if (aTargetsNoOpp > 0) {
    recs.push({
      id: "a-targets", level: "info", titleKey: "tierANoOpp",
      values: { count: aTargetsNoOpp },
    });
  }
  if (atRiskCustomers.length > 0) {
    recs.push({
      id: "risk-cust", level: "warning", titleKey: "topCustomerNoPipeline",
      values: { count: atRiskCustomers.length },
    });
  }
  if (goalProgress > 100) {
    recs.push({ id: "goal-beat", level: "success", titleKey: "goalBeat", values: { pct: Math.round(goalProgress) } });
  } else if (goal90 > 0 && goalProgress < 70) {
    recs.push({ id: "goal-miss", level: "danger", titleKey: "goalMiss", values: { pct: Math.round(goalProgress) } });
  }

  // KPIs
  const next90RevForecast = forecast
    .filter((f) => f.month >= todayKey)
    .slice(0, 3)
    .reduce((s, r) => s + r.forecastRevenue, 0);
  const next90ProfitForecast = forecast
    .filter((f) => f.month >= todayKey)
    .slice(0, 3)
    .reduce((s, r) => s + r.forecastProfit, 0);

  return {
    forecast, pipeline, totalPipeline, weightedPipeline,
    revenueBySector, sectorRanking, totalYtdRevenue,
    topTargets, atRiskCustomers, top1Share, top3Share,
    topOppsMonth,
    goal: { target: goal90, actual: curr90Rev, progress: goalProgress, delta: goalDelta, prev: prev90Rev },
    recs,
    next90RevForecast, next90ProfitForecast,
  };
}

export function useRevenueCockpit() {
  return useQuery({
    queryKey: ["revenue-cockpit"],
    queryFn: async () => {
      const trailingStart = new Date();
      trailingStart.setMonth(trailingStart.getMonth() - 7);
      const trailingISO = `${trailingStart.getFullYear()}-${String(trailingStart.getMonth() + 1).padStart(2, "0")}-01`;

      const [salesRes, oppsRes, companiesRes, sectorsRes] = await Promise.all([
        supabase.from("sales_records")
          .select("period_month,revenue,profit,tons,company_id")
          .gte("period_month", trailingISO)
          .is("archived_at", null),
        supabase.from("opportunities")
          .select("id,title,expected_revenue,expected_profit,pipeline_status,deadline,updated_at,company_id,company:companies(name,sector_id,type)")
          .is("archived_at", null),
        supabase.from("companies")
          .select("id,name,type,sector_id,icp_score,icp_tier")
          .is("archived_at", null),
        supabase.from("sectors").select("id,name_en,name_ar").is("archived_at", null),
      ]);

      return buildCockpit({
        sales: (salesRes.data ?? []) as never,
        opps: (oppsRes.data ?? []) as never,
        companies: (companiesRes.data ?? []) as never,
        sectors: (sectorsRes.data ?? []) as never,
      });
    },
  });
}
