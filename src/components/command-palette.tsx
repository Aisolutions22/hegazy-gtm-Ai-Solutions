import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Package, Target, ListChecks } from "lucide-react";

type Hit = {
  id: string;
  kind: "company" | "product" | "opportunity" | "task";
  label: string;
  sub?: string;
  to: string;
};

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: hits = [] } = useQuery({
    queryKey: ["cmdk-search", query],
    enabled: open,
    queryFn: async (): Promise<Hit[]> => {
      const q = query.trim();
      const ilike = q ? `%${q}%` : "%";
      const [companies, products, opps, tasks] = await Promise.all([
        supabase.from("companies").select("id,name,type").is("archived_at", null).ilike("name", ilike).limit(8),
        supabase.from("products").select("id,name_en,name_ar").is("archived_at", null).or(`name_en.ilike.${ilike},name_ar.ilike.${ilike}`).limit(8),
        supabase.from("opportunities").select("id,title,pipeline_status,company:companies(name)").is("archived_at", null).ilike("title", ilike).limit(8),
        supabase.from("tasks").select("id,title,status,priority").is("archived_at", null).ilike("title", ilike).limit(8),
      ]);
      return [
        ...((companies.data ?? []).map((c): Hit => ({ id: c.id, kind: "company", label: c.name, sub: c.type, to: `/companies/${c.id}` }))),
        ...((products.data ?? []).map((p): Hit => ({ id: p.id, kind: "product", label: ar ? (p.name_ar || p.name_en) : p.name_en, to: "/products" }))),
        ...((opps.data ?? []).map((o): Hit => ({ id: o.id, kind: "opportunity", label: o.title || o.company?.name || "—", sub: o.company?.name, to: "/opportunities" }))),
        ...((tasks.data ?? []).map((t): Hit => ({ id: t.id, kind: "task", label: t.title, sub: t.priority, to: "/tasks" }))),
      ];
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (to: string) => {
    onOpenChange(false);
    setQuery("");
    navigate({ to });
  };

  const groups: { kind: Hit["kind"]; label: string; icon: typeof Building2 }[] = [
    { kind: "company", label: t("nav.companies"), icon: Building2 },
    { kind: "product", label: t("nav.products"), icon: Package },
    { kind: "opportunity", label: t("nav.opportunities"), icon: Target },
    { kind: "task", label: t("nav.tasks"), icon: ListChecks },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("commandPalette.placeholder")} value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{t("commandPalette.empty")}</CommandEmpty>
        {groups.map((g, gi) => {
          const items = hits.filter((h) => h.kind === g.kind);
          if (items.length === 0) return null;
          return (
            <div key={g.kind}>
              {gi > 0 && <CommandSeparator />}
              <CommandGroup heading={g.label}>
                {items.map((h) => (
                  <CommandItem key={`${h.kind}-${h.id}`} value={`${g.kind} ${h.label} ${h.sub ?? ""}`} onSelect={() => go(h.to)}>
                    <g.icon className="h-4 w-4 me-2 text-muted-foreground" />
                    <span className="truncate">{h.label}</span>
                    {h.sub && <span className="ms-2 text-xs text-muted-foreground truncate">{h.sub}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
