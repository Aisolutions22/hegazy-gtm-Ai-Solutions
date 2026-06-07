import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { ICP_DIMENSIONS, type IcpScores, computeIcpTotal, tierColor, tierFromScore } from "@/lib/icp";
import { useUpdateCompanyIcp } from "@/hooks/use-company";
import { cn } from "@/lib/utils";

type CompanyIcp = {
  icp_sector_fit: number;
  icp_consumption: number;
  icp_frequency: number;
  icp_profitability: number;
  icp_strategic: number;
  icp_accessibility: number;
  icp_score?: number | null;
  icp_tier?: string | null;
};

export function IcpPanel({ companyId, company }: { companyId: string; company: CompanyIcp }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const score = company.icp_score ?? computeIcpTotal(company as IcpScores);
  const tier = (company.icp_tier as "A" | "B" | "C" | "low" | null) ?? tierFromScore(score);

  return (
    <Card className="metal-card">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">{t("company360.icp.title")}</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Pencil className="h-3.5 w-3.5" />
              {t("company360.icp.edit")}
            </Button>
          </DialogTrigger>
          <IcpEditDialog companyId={companyId} company={company} onDone={() => setOpen(false)} />
        </Dialog>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <div className={cn("rounded-lg border px-3 py-2 text-center min-w-[88px]", tierColor(tier))}>
            <div className="text-[10px] uppercase tracking-wider opacity-80">{t("company360.icp.tier")}</div>
            <div className="text-2xl font-bold leading-none">
              {tier === "low" ? "—" : tier}
            </div>
            <div className="text-[11px] mt-1 opacity-80">{t(`company360.icp.tiers.${tier}`)}</div>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tabular-nums">{score}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <Progress value={score} className="h-2 mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-4">
          {ICP_DIMENSIONS.map((d) => {
            const v = Number(company[d.column]) || 0;
            return (
              <div key={d.key}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-muted-foreground">{t(`company360.icp.dims.${d.key}`)}</span>
                  <span className="tabular-nums font-medium">{v}/{d.max}</span>
                </div>
                <Progress value={(v / d.max) * 100} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function IcpEditDialog({ companyId, company, onDone }: { companyId: string; company: CompanyIcp; onDone: () => void }) {
  const { t } = useTranslation();
  const update = useUpdateCompanyIcp(companyId);
  const [scores, setScores] = useState<IcpScores>({
    icp_sector_fit: company.icp_sector_fit ?? 0,
    icp_consumption: company.icp_consumption ?? 0,
    icp_frequency: company.icp_frequency ?? 0,
    icp_profitability: company.icp_profitability ?? 0,
    icp_strategic: company.icp_strategic ?? 0,
    icp_accessibility: company.icp_accessibility ?? 0,
  });
  const total = computeIcpTotal(scores);
  const tier = tierFromScore(total);

  async function save() {
    try {
      await update.mutateAsync(scores);
      toast.success(t("common.save"));
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{t("company360.icp.editTitle")}</DialogTitle>
      </DialogHeader>
      <div className="flex items-center justify-between rounded-md border p-3 bg-muted/30">
        <span className="text-sm font-medium">{t("company360.icp.total")}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", tierColor(tier))}>
            {tier === "low" ? t("company360.icp.tiers.low") : tier}
          </Badge>
          <span className="text-2xl font-bold tabular-nums">{total}</span>
        </div>
      </div>
      <div className="space-y-4 mt-2">
        {ICP_DIMENSIONS.map((d) => (
          <div key={d.key}>
            <div className="flex justify-between text-sm mb-1">
              <span>{t(`company360.icp.dims.${d.key}`)}</span>
              <span className="tabular-nums font-medium text-muted-foreground">
                {scores[d.column]} / {d.max}
              </span>
            </div>
            <Slider
              value={[scores[d.column]]}
              min={0}
              max={d.max}
              step={1}
              onValueChange={(v) => setScores((s) => ({ ...s, [d.column]: v[0] }))}
            />
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={update.isPending}>{t("common.save")}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
