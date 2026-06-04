import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fmtCurrency, fmtDate, fmtMonth } from "@/lib/format";
import { ArrowLeft } from "lucide-react";
import {
  useCompany, useCompanyOpportunities, useCompanySales, useCompanyTasks, useCompanyActivity,
} from "@/hooks/use-company";

export const Route = createFileRoute("/_authenticated/companies/$id")({
  component: Company360,
});

function Company360() {
  const { id } = Route.useParams();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const { data: company } = useCompany(id);
  const { data: opps = [] } = useCompanyOpportunities(id);
  const { data: sales = [] } = useCompanySales(id);
  const { data: tasks = [] } = useCompanyTasks(id);
  const { data: activity = [] } = useCompanyActivity(id);

  if (!company) return <p className="text-muted-foreground">{t("common.loading")}</p>;

  return (
    <div className="space-y-6">
      <Link to="/companies" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4 me-1" />{t("companies.title")}</Link>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="h-16 w-16"><AvatarFallback className="text-lg font-bold gradient-primary text-primary-foreground">{company.name[0]}</AvatarFallback></Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={company.type === "customer" ? "default" : "secondary"}>{t(`companies.types.${company.type}`)}</Badge>
              {company.sector?.name_en && <span className="text-sm text-muted-foreground">· {company.sector.name_en}</span>}
              {company.location && <span className="text-sm text-muted-foreground">· {company.location}</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t("companies.tabs.profile")}</TabsTrigger>
          <TabsTrigger value="sales">{t("companies.tabs.sales")}</TabsTrigger>
          <TabsTrigger value="opportunities">{t("companies.tabs.opportunities")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("companies.tabs.tasks")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("companies.tabs.timeline")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card><CardContent className="p-6 grid sm:grid-cols-2 gap-3 text-sm">
            <Info label={t("companies.fields.contactPerson")} value={company.contact_person} />
            <Info label={t("companies.fields.phone")} value={company.phone} />
            <Info label={t("companies.fields.email")} value={company.email} />
            <Info label={t("companies.fields.website")} value={company.website} />
            <Info label={t("companies.fields.linkedin")} value={company.linkedin} />
            <Info label={t("companies.fields.location")} value={company.location} />
            {company.notes && <div className="sm:col-span-2"><div className="text-xs text-muted-foreground mb-1">{t("companies.fields.notes")}</div><p>{company.notes}</p></div>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardContent className="p-0">
              {sales.length === 0 ? <p className="text-center text-muted-foreground py-8">{t("common.empty")}</p> :
                <table className="w-full text-sm">
                  <thead className="bg-muted/40"><tr>
                    <th className="text-start p-3">{t("sales.period")}</th>
                    <th className="text-start p-3">{t("opportunities.product")}</th>
                    <th className="text-end p-3">{t("sales.revenue")}</th>
                    <th className="text-end p-3">{t("sales.profit")}</th>
                    <th className="text-end p-3">{t("sales.tons")}</th>
                  </tr></thead>
                  <tbody>{sales.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3">{fmtMonth(s.period_month, locale)}</td>
                      <td className="p-3">{s.product?.name_en ?? "—"}</td>
                      <td className="p-3 text-end">{fmtCurrency(Number(s.revenue), locale)}</td>
                      <td className="p-3 text-end">{fmtCurrency(Number(s.profit), locale)}</td>
                      <td className="p-3 text-end">{Number(s.tons)}</td>
                    </tr>
                  ))}</tbody>
                </table>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card><CardContent className="p-0">
            {opps.length === 0 ? <p className="text-center text-muted-foreground py-8">{t("common.empty")}</p> :
              <div className="divide-y">{opps.map((o) => (
                <div key={o.id} className="p-4 flex justify-between">
                  <div><div className="font-medium">{o.title || "—"}</div><Badge variant="outline" className="mt-1 text-[10px]">{t(`opportunities.pipeline.${o.pipeline_status}`)}</Badge></div>
                  <div className="text-end"><div className="font-semibold">{fmtCurrency(Number(o.expected_revenue), locale)}</div><div className="text-xs text-muted-foreground">{Number(o.expected_tons)} t</div></div>
                </div>
              ))}</div>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card><CardContent className="p-0">
            {tasks.length === 0 ? <p className="text-center text-muted-foreground py-8">{t("common.empty")}</p> :
              <div className="divide-y">{tasks.map((task) => (
                <div key={task.id} className="p-4 flex justify-between">
                  <span>{task.title}</span>
                  <Badge variant="outline">{t(`tasks.statuses.${task.status}`)}</Badge>
                </div>
              ))}</div>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card><CardContent className="p-4 space-y-3">
            {activity.length === 0 && <p className="text-center text-muted-foreground py-4">{t("common.empty")}</p>}
            {activity.map((a) => (
              <div key={a.id} className="flex justify-between text-sm border-b last:border-0 pb-2">
                <span>{t(`activity.actions.${a.action}`)}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(a.created_at, locale)}</span>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium">{value || "—"}</div></div>
  );
}
