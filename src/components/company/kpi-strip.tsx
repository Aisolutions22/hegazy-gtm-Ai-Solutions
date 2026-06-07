import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { fmtCurrency, fmtNumber, fmtPercent } from "@/lib/format";
import { useCompanyKpis } from "@/hooks/use-company";
import { Banknote, TrendingUp, Weight, Percent, Briefcase, ListTodo, Skeleton as _S } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function KpiStrip({ companyId }: { companyId: string }) {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useCompanyKpis(companyId);

  const items = [
    { label: t("company360.kpi.revenue"), value: fmtCurrency(data?.rev ?? 0, i18n.language), icon: Banknote },
    { label: t("company360.kpi.profit"), value: fmtCurrency(data?.profit ?? 0, i18n.language), icon: TrendingUp },
    { label: t("company360.kpi.tons"), value: `${fmtNumber(data?.tons ?? 0, i18n.language)} t`, icon: Weight },
    { label: t("company360.kpi.margin"), value: fmtPercent(data?.margin ?? 0, i18n.language), icon: Percent },
    { label: t("company360.kpi.openOpps"), value: fmtNumber(data?.openOpps ?? 0, i18n.language), icon: Briefcase },
    { label: t("company360.kpi.openTasks"), value: fmtNumber(data?.openTasks ?? 0, i18n.language), icon: ListTodo },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {items.map((k) => (
        <Card key={k.label} className="metal-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              <k.icon className="h-3.5 w-3.5" />
              <span>{k.label}</span>
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {isLoading ? <Skeleton className="h-6 w-20" /> : k.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
