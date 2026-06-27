import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createTargetCompanyByName } from "@/hooks/use-contacts";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type CompanyOption = { id: string; name: string };

export function CompanyCombobox({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies", "for-pick"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id,name")
        .is("archived_at", null)
        .order("name");
      return (data ?? []) as CompanyOption[];
    },
  });

  const selected = companies.find((c) => c.id === value);

  async function createAndSelect() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const id = await createTargetCompanyByName(newName.trim());
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["companies", "for-pick"] });
      onChange(id);
      setOpen(false);
      setAddingNew(false);
      setNewName("");
      toast.success(t("contacts.companyCreated"));
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setAddingNew(false); }}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
            <span className="truncate">{selected?.name ?? t("contacts.pickCompany")}</span>
            <div className="flex items-center gap-1">
              {value && (
                <X
                  className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); onChange(null); }}
                />
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          {addingNew ? (
            <div className="p-3 space-y-2">
              <div className="text-xs text-muted-foreground">{t("contacts.newCompanyName")}</div>
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createAndSelect(); } }}
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => { setAddingNew(false); setNewName(""); }}>
                  {t("common.cancel")}
                </Button>
                <Button size="sm" onClick={createAndSelect} disabled={creating || !newName.trim()}>
                  {t("common.save")}
                </Button>
              </div>
            </div>
          ) : (
            <Command>
              <CommandInput placeholder={t("common.search")} value={search} onValueChange={setSearch} />
              <CommandList>
                <CommandEmpty>{t("commandPalette.empty")}</CommandEmpty>
                <CommandGroup>
                  {companies.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.name}
                      onSelect={() => { onChange(c.id); setOpen(false); }}
                    >
                      <Check className={cn("me-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")} />
                      {c.name}
                    </CommandItem>
                  ))}
                  <CommandItem
                    value="__add_new__"
                    onSelect={() => { setAddingNew(true); setNewName(search); }}
                    className="text-primary"
                  >
                    <Plus className="me-2 h-4 w-4" />
                    {t("contacts.addNewCompany")}
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
