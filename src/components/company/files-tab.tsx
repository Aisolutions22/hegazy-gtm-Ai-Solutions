import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FileText, ExternalLink, Archive as ArchiveIcon } from "lucide-react";
import { fmtDateTime } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import {
  useCompanyDocuments, useAddCompanyDocument, useArchiveCompanyDocument,
} from "@/hooks/use-company-documents";

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function FilesTab({ companyId }: { companyId: string }) {
  const { t, i18n } = useTranslation();
  const { data: docs = [] } = useCompanyDocuments(companyId);
  const add = useAddCompanyDocument();
  const archive = useArchiveCompanyDocument();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  async function submit() {
    if (!name.trim()) { toast.error(t("files.nameRequired")); return; }
    if (!isValidUrl(url)) { toast.error(t("files.invalidUrl")); return; }
    await add.mutateAsync({ company_id: companyId, display_name: name.trim(), drive_url: url.trim() });
    setOpen(false); setName(""); setUrl("");
    toast.success(t("common.save"));
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 me-1" />{t("files.add")}
        </Button>
      </div>

      {docs.length === 0 ? (
        <EmptyState icon={FileText} title={t("common.empty")} compact />
      ) : (
        <div className="divide-y border rounded-md bg-card">
          {docs.map((d) => {
            const who = d.creator?.full_name ?? d.creator?.email ?? null;
            return (
              <div key={d.id} className="p-3 flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <a
                    href={d.drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm hover:underline text-primary inline-flex items-center gap-1"
                  >
                    {d.display_name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {fmtDateTime(d.created_at, i18n.language)}
                    {who && <> · {who}</>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("common.archive")}
                  onClick={async () => {
                    await archive.mutateAsync({ id: d.id, company_id: companyId });
                    toast.success(t("common.archive"));
                  }}
                >
                  <ArchiveIcon className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("files.add")}</DialogTitle>
            <DialogDescription>{t("files.addHint")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{t("files.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("files.namePlaceholder")} />
            </div>
            <div>
              <Label className="text-xs">{t("files.url")}</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={submit} disabled={add.isPending}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
