import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Cropper, { type Area } from "react-easy-crop";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const MAX_BYTES = 8 * 1024 * 1024;
const OUTPUT_SIZE = 512;
const OUTPUT_QUALITY = 0.85;

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
  "2xl": "h-32 w-32 text-2xl",
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

async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))),
      "image/jpeg",
      OUTPUT_QUALITY,
    ),
  );
}

export function AvatarUpload({
  name,
  url,
  pathPrefix,
  table,
  column,
  rowId,
  size = "2xl",
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

  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => setPixels(areaPixels), []);

  function pickFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(t("avatar.invalidType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("avatar.tooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(String(reader.result));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }

  async function saveCrop() {
    if (!src || !pixels) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(src, pixels);
      const path = `${pathPrefix}/${Date.now()}.jpg`;
      const up = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const signed = await supabase.storage.from("avatars").createSignedUrl(path, TEN_YEARS);
      if (signed.error) throw signed.error;
      const signedUrl = signed.data.signedUrl;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upd = await (supabase.from(table) as any)
        .update({ [column]: signedUrl })
        .eq("id", rowId);
      if (upd.error) throw upd.error;
      onChanged?.(signedUrl);
      toast.success(t("common.save"));
      setSrc(null);
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
    <div className="flex items-center gap-4">
      <EntityAvatar name={name} url={url} size={size} />
      <div className="flex flex-col gap-1.5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickFile(f);
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

      <Dialog open={!!src} onOpenChange={(o) => { if (!o) setSrc(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("avatar.cropTitle")}</DialogTitle>
          </DialogHeader>
          {src && (
            <div className="space-y-3">
              <div className="relative h-72 w-full bg-muted rounded-md overflow-hidden">
                <Cropper
                  image={src}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("avatar.zoom")}</label>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.05}
                  onValueChange={(v) => setZoom(v[0] ?? 1)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSrc(null)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button onClick={saveCrop} disabled={busy || !pixels}>
              {busy && <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
