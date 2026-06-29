import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { fmtDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/activity")({ component: ActivityPage });

function ActivityPage() {
  const { t, i18n } = useTranslation();
  const { data: items = [] } = useQuery({
    queryKey: ["activity"],
    queryFn: async () => (await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  return (
    <div>
      <PageHeader title={t("activity.title")} />
      <Card><CardContent className="p-0">
        <div className="divide-y">
          {items.length === 0 && <p className="text-center text-muted-foreground py-8">{t("common.empty")}</p>}
          {items.map((a) => (
            <div key={a.id} className="p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{a.entity_type}</Badge>
                <span>{t(`activity.actions.${a.action}`)}</span>
              </div>
              <span className="text-xs text-muted-foreground">{fmtDateTime(a.created_at, i18n.language)}</span>
            </div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}
