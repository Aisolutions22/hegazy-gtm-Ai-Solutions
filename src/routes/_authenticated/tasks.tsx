import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";
import { fmtDate } from "@/lib/format";

const STATUSES = ["todo", "in_progress", "blocked", "completed"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export const Route = createFileRoute("/_authenticated/tasks")({ component: TasksPage });

function TasksPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await supabase.from("tasks").select("*, company:companies(name)").is("archived_at", null).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: companies = [] } = useQuery({ queryKey: ["all-companies"], queryFn: async () => (await supabase.from("companies").select("id,name").is("archived_at", null)).data ?? [] });

  async function moveStatus(id: string, status: string) {
    await supabase.from("tasks").update({ status: status as never }).eq("id", id);
    await logActivity("task", id, "status_changed", { to: status });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  return (
    <div>
      <PageHeader title={t("tasks.title")} actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("tasks.new")}</Button></DialogTrigger>
          <TaskForm companies={companies} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["tasks"] }); }} />
        </Dialog>
      } />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {STATUSES.map((s) => {
          const items = tasks.filter((task) => task.status === s);
          return (
            <div key={s}>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(`tasks.statuses.${s}`)}</h3>
                <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-3 space-y-2">
                      <div className="text-sm font-medium">{task.title}</div>
                      {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-[10px]">{t(`tasks.priorities.${task.priority}`)}</Badge>
                        {task.deadline && <span className="text-muted-foreground">{fmtDate(task.deadline, i18n.language)}</span>}
                      </div>
                      {task.company?.name && <div className="text-xs text-muted-foreground">{task.company.name}</div>}
                      <Select value={task.status} onValueChange={(v) => moveStatus(task.id, v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map((st) => <SelectItem key={st} value={st}>{t(`tasks.statuses.${st}`)}</SelectItem>)}</SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskForm({ companies, onDone }: { companies: Array<{ id: string; name: string }>; onDone: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", status: "todo", deadline: "", company_id: "" });
  async function save() {
    if (!form.title.trim()) { toast.error("title"); return; }
    const payload: Record<string, unknown> = { ...form };
    if (!payload.company_id) delete payload.company_id;
    if (!payload.deadline) delete payload.deadline;
    const { data, error } = await supabase.from("tasks").insert(payload as never).select().single();
    if (error) { toast.error(error.message); return; }
    if (data) await logActivity("task", data.id, "created", { title: data.title });
    toast.success(t("common.save"));
    onDone();
  }
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{t("tasks.new")}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("common.priority")}</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{t(`tasks.priorities.${p}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t("common.status")}</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`tasks.statuses.${s}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t("common.deadline")}</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
          <div><Label>Company</Label>
            <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
    </DialogContent>
  );
}
