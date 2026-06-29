import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Archive as ArchiveIcon, Pencil, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useContacts, useArchiveContact, type ContactRow } from "@/hooks/use-contacts";
import { ContactForm } from "@/components/contacts/contact-form";
import { EntityAvatar } from "@/components/shared/avatar-upload";

export const Route = createFileRoute("/_authenticated/contacts")({
  component: ContactsPage,
});

function ContactsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRow | null>(null);

  const { data: contacts = [] } = useContacts();
  const archive = useArchiveContact();

  const filtered = contacts.filter((c) => {
    const hay = `${c.full_name} ${c.job_title ?? ""} ${c.company?.name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  async function onArchive(id: string) {
    await archive.mutateAsync(id);
    toast.success(t("common.archive"));
  }

  return (
    <div>
      <PageHeader
        title={t("contacts.title")}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 me-1" />{t("contacts.new")}</Button>
            </DialogTrigger>
            {open && <ContactForm onDone={() => setOpen(false)} />}
          </Dialog>
        }
      />
      <Card className="mb-4"><CardContent className="p-3">
        <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </CardContent></Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("contacts.fields.fullName")}</TableHead>
              <TableHead>{t("contacts.fields.jobTitle")}</TableHead>
              <TableHead>{t("contacts.fields.company")}</TableHead>
              <TableHead>{t("contacts.fields.phone")}</TableHead>
              <TableHead>{t("contacts.fields.email")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <UserRound className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  {t("common.empty")}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <EntityAvatar name={c.full_name} url={c.avatar_url ?? null} size="sm" />
                    <span>{c.full_name}</span>
                    {c.is_primary && <Badge variant="secondary" className="text-[9px]">{t("contacts.primary")}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.job_title ?? "—"}</TableCell>
                <TableCell className="text-sm">
                  {c.company ? (
                    <Link to="/companies/$id" params={{ id: c.company.id }} className="hover:underline">
                      {c.company.name}
                    </Link>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-sm">{c.phone ?? "—"}</TableCell>
                <TableCell className="text-sm">{c.email ?? "—"}</TableCell>
                <TableCell className="text-end">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label={t("common.edit")}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onArchive(c.id)}><ArchiveIcon className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        {editing && (
          <ContactForm mode="edit" initialData={editing} onDone={() => setEditing(null)} />
        )}
      </Dialog>
    </div>
  );
}
