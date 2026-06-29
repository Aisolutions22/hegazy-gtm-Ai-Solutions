import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanyActivity } from "@/hooks/use-company";
import { EmptyState } from "@/components/empty-state";
import { fmtDateTime } from "@/lib/format";
import { Activity, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ActivityFeed({ companyId }: { companyId: string }) {
  const { t, i18n } = useTranslation();
  const { data = [] } = useCompanyActivity(companyId);
  return (
    <Card className="metal-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {t("company360.activity")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <EmptyState icon={Activity} title={t("dashboard.noActivity")} compact />
        ) : (
          <ScrollArea className="h-[420px] pe-2">
            <ol className="relative space-y-3 ps-4 before:absolute before:start-1.5 before:top-1 before:bottom-1 before:w-px before:bg-border">
              {data.map((a) => (
                <li key={a.id} className="relative">
                  <Circle className="absolute -start-3 top-1 h-2.5 w-2.5 fill-primary text-primary" />
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{a.entity_type}</Badge>
                    <span className="text-xs">{t(`activity.actions.${a.action}`)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(a.created_at, i18n.language)}</div>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
