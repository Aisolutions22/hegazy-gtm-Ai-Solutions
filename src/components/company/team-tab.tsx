import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Pencil, Archive as ArchiveIcon, UserRound, Mail, Phone, Briefcase, Linkedin } from "lucide-react";
import { EntityAvatar } from "@/components/shared/avatar-upload";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { safeHref } from "@/lib/url";
import { ContactForm } from "@/components/contacts/contact-form";
import {
  useCompanyContacts, useUnassignedContacts, useArchiveContact,
  useAssignContactToCompany, type ContactRow,
} from "@/hooks/use-contacts";

export function TeamTab({ companyId }: { companyId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: contacts = [] } = useCompanyContacts(companyId);
  const archive = useArchiveContact();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const sorted = [...contacts].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));

  function refresh() {
    qc.invalidateQueries({ queryKey: ["contacts", "by-company", companyId] });
    qc.invalidateQueries({ queryKey: ["contacts"] });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <ExistingContactPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          companyId={companyId}
          onCreateNew={() => { setPickerOpen(false); setOpen(true); }}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 me-1" />{t("contacts.addPerson")}</Button>
          </DialogTrigger>
          {open && (
            <ContactForm
              lockedCompanyId={companyId}
              onDone={() => { setOpen(false); refresh(); }}
            />
          )}
        </Dialog>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={UserRound} title={t("common.empty")} compact />
      ) : (
        <div className="divide-y border rounded-md bg-card">
          {sorted.map((c) => (
            <div key={c.id} className="p-3 flex items-center gap-3">
              <EntityAvatar name={c.full_name} url={c.avatar_url ?? null} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {(c as { display_number?: number | null }).display_number != null && (
                    <span className="text-xs text-muted-foreground font-normal">#{(c as { display_number?: number | null }).display_number}</span>
                  )}
                  <span className="font-medium truncate">{c.full_name}</span>
                  {c.is_primary && <Badge variant="secondary" className="text-[9px]">{t("contacts.primary")}</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  {c.job_title && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{c.job_title}</span>}
                  {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                  {c.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                  {safeHref(c.linkedin) && (
                    <a href={safeHref(c.linkedin)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Linkedin className="h-3 w-3" />LinkedIn
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label={t("common.edit")}><Pencil className="h-4 w-4" /></Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => { await archive.mutateAsync(c.id); refresh(); toast.success(t("common.archive")); }}
                ><ArchiveIcon className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        {editing && (
          <ContactForm
            mode="edit"
            initialData={editing}
            lockedCompanyId={companyId}
            onDone={() => { setEditing(null); refresh(); }}
          />
        )}
      </Dialog>
    </div>
  );
}

function ExistingContactPicker({
  open, onOpenChange, companyId, onCreateNew,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  onCreateNew: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: all = [] } = useUnassignedContacts();
  const assign = useAssignContactToCompany();
  const available = all.filter((c) => c.company_id !== companyId);

  async function pick(id: string) {
    await assign.mutateAsync({ contactId: id, companyId });
    qc.invalidateQueries({ queryKey: ["contacts", "by-company", companyId] });
    onOpenChange(false);
    toast.success(t("common.save"));
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">{t("contacts.pickExisting")}</Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80" align="end">
        <Command>
          <CommandInput placeholder={t("common.search")} />
          <CommandList>
            <CommandEmpty>{t("commandPalette.empty")}</CommandEmpty>
            <CommandGroup>
              {available.map((c) => (
                <CommandItem key={c.id} value={c.full_name} onSelect={() => pick(c.id)}>
                  <UserRound className="me-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{c.full_name}</span>
                    {c.job_title && <span className="text-[10px] text-muted-foreground">{c.job_title}</span>}
                  </div>
                </CommandItem>
              ))}
              <CommandItem value="__add_new__" onSelect={onCreateNew} className="text-primary">
                <Plus className="me-2 h-4 w-4" />{t("contacts.addNewPerson")}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
