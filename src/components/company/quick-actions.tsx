import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, ListTodo, CalendarDays, StickyNote, X } from "lucide-react";
import { toast } from "sonner";
import { useAllProductsLite } from "@/hooks/use-opportunities";
import { useCreateTaskForCompany, useCreateOpportunityForCompany, useCompanyOpportunities } from "@/hooks/use-company";
import { useCreateMeeting } from "@/hooks/use-meetings";
import { useCreateNote } from "@/hooks/use-notes";

const STAGES = ["lead", "contacted", "qualified", "negotiation", "won", "lost"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

type Action = "opp" | "task" | "meeting" | "note" | null;

export function QuickActionsMenu({ companyId }: { companyId: string }) {
  const { t } = useTranslation();
  const [action, setAction] = useState<Action>(null);
  const close = () => setAction(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> {t("company360.quickActions.title")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setAction("opp")}>
            <Briefcase className="h-4 w-4 me-2" />{t("company360.quickActions.addOpp")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAction("task")}>
            <ListTodo className="h-4 w-4 me-2" />{t("company360.quickActions.addTask")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAction("meeting")}>
            <CalendarDays className="h-4 w-4 me-2" />{t("company360.quickActions.addMeeting")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAction("note")}>
            <StickyNote className="h-4 w-4 me-2" />{t("company360.quickActions.addNote")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={action === "opp"} onOpenChange={(o) => !o && close()}>
        {action === "opp" && <AddOppDialog companyId={companyId} onDone={close} />}
      </Dialog>
      <Dialog open={action === "task"} onOpenChange={(o) => !o && close()}>
        {action === "task" && <AddTaskDialog companyId={companyId} onDone={close} />}
      </Dialog>
      <Sheet open={action === "meeting"} onOpenChange={(o) => !o && close()}>
        {action === "meeting" && <AddMeetingSheet companyId={companyId} onDone={close} />}
      </Sheet>
      <Dialog open={action === "note"} onOpenChange={(o) => !o && close()}>
        {action === "note" && <AddNoteDialog companyId={companyId} onDone={close} />}
      </Dialog>
    </>
  );
}

/* Inline trigger version for "+ Add" buttons inside tabs */
export function QuickActionButton({ companyId, kind, label }: { companyId: string; kind: Exclude<Action, null>; label: string }) {
  const [open, setOpen] = useState(false);
  const Trigger = (
    <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1">
      <Plus className="h-3.5 w-3.5" />{label}
    </Button>
  );
  if (kind === "meeting") {
    return (
      <>
        {Trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          {open && <AddMeetingSheet companyId={companyId} onDone={() => setOpen(false)} />}
        </Sheet>
      </>
    );
  }
  return (
    <>
      {Trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        {open && kind === "opp" && <AddOppDialog companyId={companyId} onDone={() => setOpen(false)} />}
        {open && kind === "task" && <AddTaskDialog companyId={companyId} onDone={() => setOpen(false)} />}
        {open && kind === "note" && <AddNoteDialog companyId={companyId} onDone={() => setOpen(false)} />}
      </Dialog>
    </>
  );
}

/* --- forms --- */

function AddOppDialog({ companyId, onDone }: { companyId: string; onDone: () => void }) {
  const { t } = useTranslation();
  const { data: products = [] } = useAllProductsLite();
  const create = useCreateOpportunityForCompany(companyId);
  const [f, setF] = useState({ title: "", product_id: "", expected_tons: 0, expected_revenue: 0, expected_profit: 0, deadline: "", pipeline_status: "lead" });
  async function save() {
    if (!f.title.trim()) { toast.error(t("company360.validation.titleRequired")); return; }
    try {
      await create.mutateAsync({
        title: f.title,
        product_id: f.product_id || null,
        expected_tons: f.expected_tons,
        expected_revenue: f.expected_revenue,
        expected_profit: f.expected_profit,
        deadline: f.deadline || null,
        pipeline_status: f.pipeline_status,
      });
      toast.success(t("common.save"));
      onDone();
    } catch (e) { toast.error((e as Error).message); }
  }
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{t("company360.quickActions.addOpp")}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>{t("opportunities.new")}</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("opportunities.product")}</Label>
            <Select value={f.product_id} onValueChange={(v) => setF({ ...f, product_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name_en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("opportunities.pipeline.lead")}</Label>
            <Select value={f.pipeline_status} onValueChange={(v) => setF({ ...f, pipeline_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{t(`opportunities.pipeline.${s}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t("opportunities.expectedTons")}</Label><Input type="number" value={f.expected_tons} onChange={(e) => setF({ ...f, expected_tons: Number(e.target.value) })} /></div>
          <div><Label>{t("opportunities.expectedRevenue")}</Label><Input type="number" value={f.expected_revenue} onChange={(e) => setF({ ...f, expected_revenue: Number(e.target.value) })} /></div>
          <div><Label>{t("opportunities.expectedProfit")}</Label><Input type="number" value={f.expected_profit} onChange={(e) => setF({ ...f, expected_profit: Number(e.target.value) })} /></div>
          <div><Label>{t("common.deadline")}</Label><Input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></div>
        </div>
      </div>
      <DialogFooter><Button onClick={save} disabled={create.isPending}>{t("common.save")}</Button></DialogFooter>
    </DialogContent>
  );
}

function AddTaskDialog({ companyId, onDone }: { companyId: string; onDone: () => void }) {
  const { t } = useTranslation();
  const { data: opps = [] } = useCompanyOpportunities(companyId);
  const create = useCreateTaskForCompany(companyId);
  const [f, setF] = useState({ title: "", description: "", priority: "medium", deadline: "", opportunity_id: "" });
  async function save() {
    if (!f.title.trim()) { toast.error(t("company360.validation.titleRequired")); return; }
    try {
      await create.mutateAsync({
        title: f.title,
        description: f.description || undefined,
        priority: f.priority,
        deadline: f.deadline || null,
        opportunity_id: f.opportunity_id || null,
      });
      toast.success(t("common.save"));
      onDone();
    } catch (e) { toast.error((e as Error).message); }
  }
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{t("company360.quickActions.addTask")}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>{t("tasks.new")}</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><Label>{t("companies.fields.notes")}</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("common.priority")}</Label>
            <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{t(`tasks.priorities.${p}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t("common.deadline")}</Label><Input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></div>
          {opps.length > 0 && (
            <div className="col-span-2">
              <Label>{t("opportunities.title")}</Label>
              <Select value={f.opportunity_id} onValueChange={(v) => setF({ ...f, opportunity_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{opps.map((o) => <SelectItem key={o.id} value={o.id}>{o.title || "—"}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      <DialogFooter><Button onClick={save} disabled={create.isPending}>{t("common.save")}</Button></DialogFooter>
    </DialogContent>
  );
}

function AddMeetingSheet({ companyId, onDone }: { companyId: string; onDone: () => void }) {
  const { t } = useTranslation();
  const { data: opps = [] } = useCompanyOpportunities(companyId);
  const create = useCreateMeeting();
  const [f, setF] = useState({ title: "", meeting_date: new Date().toISOString().slice(0, 16), notes: "", decisions: "", opportunity_id: "" });
  const [attendees, setAttendees] = useState<string[]>([]);
  const [att, setAtt] = useState("");

  function addAttendee() {
    const v = att.trim();
    if (!v) return;
    setAttendees((a) => [...a, v]);
    setAtt("");
  }

  async function save() {
    if (!f.title.trim()) { toast.error(t("company360.validation.titleRequired")); return; }
    try {
      await create.mutateAsync({
        title: f.title,
        meeting_date: new Date(f.meeting_date).toISOString(),
        attendees,
        notes: f.notes || null,
        decisions: f.decisions || null,
        company_id: companyId,
        opportunity_id: f.opportunity_id || null,
      });
      toast.success(t("common.save"));
      onDone();
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <SheetContent className="sm:max-w-lg overflow-y-auto">
      <SheetHeader><SheetTitle>{t("company360.quickActions.addMeeting")}</SheetTitle></SheetHeader>
      <div className="space-y-3 mt-4">
        <div><Label>{t("company360.meetings.titleField")}</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><Label>{t("company360.meetings.dateField")}</Label><Input type="datetime-local" value={f.meeting_date} onChange={(e) => setF({ ...f, meeting_date: e.target.value })} /></div>
        <div>
          <Label>{t("company360.meetings.attendees")}</Label>
          <div className="flex gap-2">
            <Input value={att} onChange={(e) => setAtt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttendee(); } }} placeholder={t("company360.meetings.attendeesHint")} />
            <Button type="button" variant="outline" size="sm" onClick={addAttendee}>{t("common.add")}</Button>
          </div>
          {attendees.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {attendees.map((a, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {a}
                  <button onClick={() => setAttendees((arr) => arr.filter((_, j) => j !== i))} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div><Label>{t("company360.meetings.notesField")}</Label><Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        <div><Label>{t("company360.meetings.decisions")}</Label><Textarea rows={3} value={f.decisions} onChange={(e) => setF({ ...f, decisions: e.target.value })} placeholder={t("company360.meetings.decisionsHint")} /></div>
        {opps.length > 0 && (
          <div>
            <Label>{t("opportunities.title")}</Label>
            <Select value={f.opportunity_id} onValueChange={(v) => setF({ ...f, opportunity_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{opps.map((o) => <SelectItem key={o.id} value={o.id}>{o.title || "—"}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>
      <SheetFooter className="mt-4"><Button onClick={save} disabled={create.isPending}>{t("common.save")}</Button></SheetFooter>
    </SheetContent>
  );
}

function AddNoteDialog({ companyId, onDone }: { companyId: string; onDone: () => void }) {
  const { t } = useTranslation();
  const create = useCreateNote();
  const [note, setNote] = useState("");
  async function save() {
    if (!note.trim()) { toast.error(t("company360.validation.noteRequired")); return; }
    try {
      await create.mutateAsync({ company_id: companyId, note });
      toast.success(t("common.save"));
      onDone();
    } catch (e) { toast.error((e as Error).message); }
  }
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{t("company360.quickActions.addNote")}</DialogTitle></DialogHeader>
      <Textarea rows={6} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("company360.notes.placeholder")} />
      <DialogFooter><Button onClick={save} disabled={create.isPending}>{t("common.save")}</Button></DialogFooter>
    </DialogContent>
  );
}
