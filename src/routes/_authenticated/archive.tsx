import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

const TABLES = ["companies", "products", "opportunities", "tasks", "sales_records"] as const;
type TableName = (typeof TABLES)[number];

export const Route = createFileRoute("/_authenticated/archive")({ component: ArchivePage });

function ArchivePage() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("archive.title")} />
      <Tabs defaultValue="companies">
        <TabsList>{TABLES.map((tb) => <TabsTrigger key={tb} value={tb}>{tb}</TabsTrigger>)}</TabsList>
        {TABLES.map((tb) => <TabsContent key={tb} value={tb}><ArchiveList table={tb} /></TabsContent>)}
      </Tabs>
    </div>
  );
}

function ArchiveList({ table }: { table: TableName }) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { data = [] } = useQuery({
    queryKey: ["archive", table],
    queryFn: async () => (await supabase.from(table).select("*").not("archived_at", "is", null).order("archived_at", { ascending: false })).data ?? [],
  });
  async function restore(id: string) {
    await supabase.from(table).update({ archived_at: null }).eq("id", id);
    await logActivity(table, id, "restored");
    qc.invalidateQueries({ queryKey: ["archive", table] });
    toast.success(t("common.restore"));
  }
  return (
    <Card><CardContent className="p-0">
      {data.length === 0 && <p className="text-center text-muted-foreground py-8">{t("archive.empty")}</p>}
      <div className="divide-y">{data.map((row: Record<string, unknown>) => (
        <div key={String(row.id)} className="p-3 flex items-center justify-between text-sm">
          <span>{String(row.name ?? row.title ?? row.name_en ?? row.id)}</span>
          <Button size="sm" variant="ghost" onClick={() => restore(String(row.id))}><Undo2 className="h-4 w-4 me-1" />{t("common.restore")}</Button>
        </div>
      ))}</div>
    </CardContent></Card>
  );
}
