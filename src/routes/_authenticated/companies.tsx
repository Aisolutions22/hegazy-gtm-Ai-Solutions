import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Plus, Archive as ArchiveIcon, Pencil } from "lucide-react";
import { toast } from "sonner";
import { CompanyForm, type CompanyFormData } from "@/components/company/company-form";
import { useCompaniesList, useSectors, useArchiveCompany } from "@/hooks/use-company";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/companies")({
  component: CompaniesPage,
});

type CompanyRow = CompanyFormData & { id: string; name: string; type: string; created_at?: string };


function CompaniesPage() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("__all__");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: companies = [] } = useCompaniesList();
  const { data: sectors = [] } = useSectors();
  const archive = useArchiveCompany();

  const filtered = companies.filter((c) => {
    if (!c.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (sectorFilter !== "__all__" && (c as { sector_id?: string | null }).sector_id !== sectorFilter) return false;
    return true;
  });

  const editing = filtered.find((c) => c.id === editingId) ?? companies.find((c) => c.id === editingId);

  async function archiveCompany(id: string) {
    await archive.mutateAsync(id);
    toast.success(t("common.archive"));
  }

  return (
    <div>
      <PageHeader
        title={t("companies.title")}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 me-1" />{t("companies.new")}</Button>
            </DialogTrigger>
            <CompanyForm sectors={sectors} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["companies"] }); }} />
          </Dialog>
        }
      />
      <Card className="mb-4"><CardContent className="p-3">
        <div className="flex gap-2 items-center">
          <Input className="flex-1" placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("products.allSectors")}</SelectItem>
              {sectors.map((s) => (
                <SelectItem key={s.id} value={s.id}>{ar ? s.name_ar : s.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>


      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("companies.fields.name")}</TableHead>
              <TableHead>{t("companies.fields.type")}</TableHead>
              <TableHead>{t("companies.fields.sector")}</TableHead>
              <TableHead>{t("companies.fields.contactPerson")}</TableHead>
              <TableHead>{t("companies.fields.phone")}</TableHead>
              <TableHead>{t("companies.fields.createdAt")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t("common.empty")}</TableCell></TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell><Link to="/companies/$id" params={{ id: c.id }} className="font-medium hover:underline">{c.name}</Link></TableCell>
                <TableCell><Badge variant={c.type === "customer" ? "default" : "secondary"}>{t(`companies.types.${c.type}`)}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.sector?.name_en ?? "—"}</TableCell>
                <TableCell className="text-sm">{c.contact_person ?? "—"}</TableCell>
                <TableCell className="text-sm">{c.phone ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground tabular-nums">{fmtDate((c as CompanyRow).created_at, i18n.language)}</TableCell>
                <TableCell className="text-end">
                  <Button variant="ghost" size="icon" onClick={() => setEditingId(c.id)} aria-label={t("common.edit")}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => archiveCompany(c.id)}><ArchiveIcon className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editingId} onOpenChange={(o) => { if (!o) setEditingId(null); }}>
        {editing && (
          <CompanyForm
            sectors={sectors}
            mode="edit"
            initialData={editing as CompanyRow}
            onDone={() => { setEditingId(null); qc.invalidateQueries({ queryKey: ["companies"] }); }}
          />
        )}
      </Dialog>
    </div>
  );
}

