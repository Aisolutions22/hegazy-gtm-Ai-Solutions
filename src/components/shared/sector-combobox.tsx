import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type SectorOption = { id: string; name_en: string; name_ar: string };

export function SectorCombobox({
  sectors,
  value,
  onChange,
}: {
  sectors: SectorOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newEn, setNewEn] = useState("");
  const [newAr, setNewAr] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = sectors.find((s) => s.id === value);

  async function createAndSelect() {
    if (!newEn.trim() || !newAr.trim()) {
      toast.error(t("sectors.bothNamesRequired"));
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("sectors")
        .insert({ name_en: newEn.trim(), name_ar: newAr.trim() } as never)
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as { id: string }).id;
      qc.invalidateQueries({ queryKey: ["sectors"] });
      onChange(id);
      setOpen(false);
      setAddingNew(false);
      setNewEn("");
      setNewAr("");
      toast.success(t("common.save"));
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setAddingNew(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className="truncate">
            {selected
              ? ar
                ? selected.name_ar
                : selected.name_en
              : "—"}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <X
                className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {addingNew ? (
          <div className="p-3 space-y-2">
            <div className="text-xs text-muted-foreground">{t("sectors.newSector")}</div>
            <div>
              <Label className="text-xs">Name (EN)</Label>
              <Input value={newEn} onChange={(e) => setNewEn(e.target.value)} autoFocus />
            </div>
            <div>
              <Label className="text-xs">الاسم (AR)</Label>
              <Input value={newAr} onChange={(e) => setNewAr(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingNew(false);
                  setNewEn("");
                  setNewAr("");
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button size="sm" onClick={createAndSelect} disabled={creating}>
                {t("common.save")}
              </Button>
            </div>
          </div>
        ) : (
          <Command>
            <CommandInput
              placeholder={t("common.search")}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>{t("commandPalette.empty")}</CommandEmpty>
              <CommandGroup>
                {sectors.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={`${s.name_en} ${s.name_ar}`}
                    onSelect={() => {
                      onChange(s.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "me-2 h-4 w-4",
                        value === s.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {ar ? s.name_ar : s.name_en}
                  </CommandItem>
                ))}
                <CommandItem
                  value="__add_new_sector__"
                  onSelect={() => {
                    setAddingNew(true);
                    setNewEn(search);
                  }}
                  className="text-primary"
                >
                  <Plus className="me-2 h-4 w-4" />
                  {t("sectors.addNew")}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
