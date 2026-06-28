import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

type EntityType = "company" | "contact";
type ExtraField = { id: string; label: string; value: string };

export function ExtraFieldsManager({
  entityType,
  entityId,
}: {
  entityType: EntityType;
  entityId: string;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const key = ["extra_fields", entityType, entityId];

  const { data: rows = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extra_fields" as never)
        .select("id,label,value")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as ExtraField[];
    },
  });

  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("extra_fields" as never).insert({
        entity_type: entityType,
        entity_id: entityId,
        label: label.trim(),
        value: value.trim(),
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setLabel(""); setValue("");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("extra_fields" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });

  function onAdd() {
    if (!label.trim() || !value.trim()) {
      toast.error(t("extraFields.bothRequired"));
      return;
    }
    add.mutate();
  }

  return (
    <div className="rounded-md border p-3 space-y-3">
      <Label className="text-sm font-medium">{t("extraFields.title")}</Label>
      {rows.length > 0 && (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-sm bg-muted/40 rounded px-2 py-1.5">
              <span className="font-medium min-w-[8rem] truncate">{r.label}</span>
              <span className="text-muted-foreground flex-1 truncate">{r.value}</span>
              <Button
                type="button" variant="ghost" size="icon" className="h-6 w-6"
                onClick={() => remove.mutate(r.id)}
                aria-label={t("common.delete") ?? "Delete"}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label className="text-xs">{t("extraFields.label")}</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("extraFields.labelPlaceholder")} />
        </div>
        <div className="flex-1">
          <Label className="text-xs">{t("extraFields.value")}</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <Button type="button" size="sm" onClick={onAdd} disabled={add.isPending}>
          <Plus className="h-4 w-4 me-1" />{t("extraFields.add")}
        </Button>
      </div>
    </div>
  );
}

export function ExtraFieldsHint() {
  const { t } = useTranslation();
  return (
    <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
      {t("extraFields.saveFirstHint")}
    </div>
  );
}
