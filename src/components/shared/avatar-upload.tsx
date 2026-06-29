import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const MAX_BYTES = 4 * 1024 * 1024;

export function initialsOf(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const joined = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return joined || "?";
}

const sizeMap = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-base",
} as const;

export type EntityAvatarSize = keyof typeof sizeMap;

export function EntityAvatar({
  name,
  url,
  size = "md",
  className,
}: {
  name?: string | null;
  url?: string | null;
  size?: EntityAvatarSize;
  className?: string;
}) {
  return (
    <Avatar className={cn(sizeMap[size], "shrink-0", className)}>
      {url ? <AvatarImage src={url} alt={name ?? ""} /> : null}
      <AvatarFallback className="font-semibold gradient-primary text-primary-foreground">
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function AvatarUpload({
  name,
  url,
  pathPrefix,
  table,
  column,
  rowId,
  size = "xl",
  onChanged,
}: {
  name?: string | null;
  url?: string | null;
  /** e.g. profiles/{user_id} or companies/{company_id} */
  pathPrefix: string;
  table: "profiles" | "companies" | "contacts";
  column: "avatar_url" | "logo_url";
  rowId: string;
  size?: EntityAvatarSize;
  onChanged?: (url: string | null) => void;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(t("avatar.invalidType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("avatar.tooLarge"));
      return;
    }
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${pathPrefix}/${Date.now()}.${ext}`;
      const up = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (up.error) throw up.error;
      const signed = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, TEN_YEARS);
      if (signed.error) throw signed.error;
      const signedUrl = signed.data.signedUrl;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upd = await (supabase.from(table) as any)
        .update({ [column]: signedUrl })
        .eq("id", rowId);
      if (upd.error) throw upd.error;
      onChanged?.(signedUrl);
      toast.success(t("common.save"));
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setBusy(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upd = await (supabase.from(table) as any)
        .update({ [column]: null })
        .eq("id", rowId);
      if (upd.error) throw upd.error;
      onChanged?.(null);
      toast.success(t("common.save"));
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <EntityAvatar name={name} url={url} size={size} />
      <div className="flex flex-col gap-1.5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5 me-1" />
          )}
          {url ? t("avatar.change") : t("avatar.upload")}
        </Button>
        {url && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={clear}
            className="text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5 me-1" />
            {t("avatar.remove")}
          </Button>
        )}
      </div>
    </div>
  );
}
