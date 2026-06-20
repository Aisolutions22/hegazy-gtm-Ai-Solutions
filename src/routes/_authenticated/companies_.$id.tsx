import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { fmtCurrency, fmtMonth } from "@/lib/format";
import { ArrowLeft, Briefcase, ListTodo, CalendarDays, StickyNote, Pencil } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import {
  useCompany, useCompanyOpportunities, useCompanySales, useCompanyTasks, useSectors,
} from "@/hooks/use-company";
import { IcpPanel } from "@/components/company/icp-panel";
import { KpiStrip } from "@/components/company/kpi-strip";
import { QuickActionsMenu, QuickActionButton } from "@/components/company/quick-actions";
import { ActivityFeed } from "@/components/company/activity-feed";
import { NotesTimeline } from "@/components/company/notes-timeline";
import { MeetingsList } from "@/components/company/meetings-list";
import { CompanyForm } from "@/components/company/company-form";

export const Route = createFileRoute("/_authenticated/companies_/$id")({
  component: Company360,
});

function Company360() {
  const { id } = Route.useParams();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [editOpen, setEditOpen] = useState(false);

  const { data: company } = useCompany(id);
  const { data: sectors = [] } = useSectors();
  const { data: opps = [] } = useCompanyOpportunities(id);
  const { data: sales = [] } = useCompanySales(id);
  const { data: tasks = [] } = useCompanyTasks(id);

  if (!company) return <p className="text-muted-foreground">{t("common.loading")}</p>;

  return (
    <div className="space-y-4">
      <Link to="/companies" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 me-1" />{t("companies.title")}
      </Link>

      {/* Header */}
      <Card className="metal-card">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-lg font-bold gradient-primary text-primary-foreground">{company.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant={company.type === "customer" ? "default" : "secondary"} className="text-[10px]">
                {t(`companies.types.${company.type}`)}
              </Badge>
              {company.sector?.name_en && <span>· {company.sector.name_en}</span>}
              {company.location && <span>· {company.location}</span>}
            </div>
          </div>
          <QuickActionsMenu companyId={id} />
        </CardContent>
      </Card>

      {/* ICP + KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <IcpPanel companyId={id} company={company} />
          <KpiStrip companyId={id} />
        </div>
        <ActivityFeed companyId={id} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">{t("company360.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="sales">{t("companies.tabs.sales")}</TabsTrigger>
          <TabsTrigger value="opportunities">{t("companies.tabs.opportunities")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("companies.tabs.tasks")}</TabsTrigger>
          <TabsTrigger value="meetings">{t("company360.tabs.meetings")}</TabsTrigger>
          <TabsTrigger value="notes">{t("company360.tabs.notes")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t("companies.tabs.profile")}</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
                <Info label={t("companies.fields.contactPerson")} value={company.contact_person} />
                <Info label={t("companies.fields.phone")} value={company.phone} />
                <Info label={t("companies.fields.email")} value={company.email} />
                <Info label={t("companies.fields.website")} value={company.website} />
                <Info label={t("companies.fields.linkedin")} value={company.linkedin} />
                <Info label={t("companies.fields.location")} value={company.location} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{t("company360.recentMeetings")}</CardTitle>
                <QuickActionButton companyId={id} kind="meeting" label={t("common.add")} />
              </CardHeader>
              <CardContent><MeetingsList companyId={id} limit={3} /></CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{t("company360.recentNotes")}</CardTitle>
                <QuickActionButton companyId={id} kind="note" label={t("common.add")} />
              </CardHeader>
              <CardContent><NotesTimeline companyId={id} limit={3} /></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <Card><CardContent className="p-0">
            {sales.length === 0 ? <EmptyState icon={Briefcase} title={t("common.empty")} compact /> :
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
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{t("opportunities.title")}</CardTitle>
              <QuickActionButton companyId={id} kind="opp" label={t("company360.quickActions.addOpp")} />
            </CardHeader>
            <CardContent className="p-0">
              {opps.length === 0 ? <EmptyState icon={Briefcase} title={t("common.empty")} compact /> :
                <div className="divide-y">{opps.map((o) => (
                  <div key={o.id} className="p-4 flex justify-between">
                    <div>
                      <div className="font-medium">{o.title || "—"}</div>
                      <Badge variant="outline" className="mt-1 text-[10px]">{t(`opportunities.pipeline.${o.pipeline_status}`)}</Badge>
                    </div>
                    <div className="text-end">
                      <div className="font-semibold">{fmtCurrency(Number(o.expected_revenue), locale)}</div>
                      <div className="text-xs text-muted-foreground">{Number(o.expected_tons)} t</div>
                    </div>
                  </div>
                ))}</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{t("tasks.title")}</CardTitle>
              <QuickActionButton companyId={id} kind="task" label={t("company360.quickActions.addTask")} />
            </CardHeader>
            <CardContent className="p-0">
              {tasks.length === 0 ? <EmptyState icon={ListTodo} title={t("common.empty")} compact /> :
                <div className="divide-y">{tasks.map((task) => (
                  <div key={task.id} className="p-4 flex justify-between">
                    <span>{task.title}</span>
                    <Badge variant="outline">{t(`tasks.statuses.${task.status}`)}</Badge>
                  </div>
                ))}</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4" />{t("company360.tabs.meetings")}</CardTitle>
              <QuickActionButton companyId={id} kind="meeting" label={t("company360.quickActions.addMeeting")} />
            </CardHeader>
            <CardContent><MeetingsList companyId={id} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><StickyNote className="h-4 w-4" />{t("company360.tabs.notes")}</CardTitle>
              <QuickActionButton companyId={id} kind="note" label={t("company360.quickActions.addNote")} />
            </CardHeader>
            <CardContent><NotesTimeline companyId={id} /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}
