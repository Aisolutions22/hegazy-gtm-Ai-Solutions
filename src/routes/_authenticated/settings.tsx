import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { setLocale } from "@/lib/i18n";
import { getTheme, setTheme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AvatarUpload, EntityAvatar } from "@/components/shared/avatar-upload";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, role } = useAuth();
  const isStaff = role === "owner" || role === "admin";
  const qc = useQueryClient();
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  useEffect(() => setThemeState(getTheme()), []);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () =>
      (await supabase.from("profiles").select("id,full_name,email,avatar_url").eq("id", user!.id).single()).data,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,avatar_url"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      const roleMap = new Map((roles.data ?? []).map((r) => [r.user_id, r.role]));
      return (profiles.data ?? []).map((p) => ({ ...p, role: roleMap.get(p.id) }));
    },
  });

  return (
    <div>
      <PageHeader title={t("settings.title")} />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t("settings.profile")}</TabsTrigger>
          <TabsTrigger value="appearance">{t("settings.appearance")}</TabsTrigger>
          <TabsTrigger value="users">{t("settings.users")}</TabsTrigger>
          {isStaff && <TabsTrigger value="sectors">{t("settings.sectors")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card><CardContent className="p-6 space-y-6">
            {user && (
              <AvatarUpload
                name={profile?.full_name ?? user.email ?? ""}
                url={profile?.avatar_url ?? null}
                pathPrefix={`profiles/${user.id}`}
                table="profiles"
                column="avatar_url"
                rowId={user.id}
                onChanged={() => qc.invalidateQueries({ queryKey: ["my-profile", user.id] })}
              />
            )}
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Email: </span><span className="font-medium">{user?.email}</span></div>
              <div><span className="text-muted-foreground">Role: </span><Badge>{role}</Badge></div>
            </div>
            <SelfPasswordChange />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card><CardContent className="p-6 space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">{t("settings.theme")}</div>
              <div className="flex gap-2">
                <Button variant={theme === "light" ? "default" : "outline"} onClick={() => { setTheme("light"); setThemeState("light"); }}>{t("settings.light")}</Button>
                <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => { setTheme("dark"); setThemeState("dark"); }}>{t("settings.dark")}</Button>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">{t("settings.language")}</div>
              <div className="flex gap-2">
                <Button variant={i18n.language === "ar" ? "default" : "outline"} onClick={() => setLocale("ar")}>عربي</Button>
                <Button variant={i18n.language === "en" ? "default" : "outline"} onClick={() => setLocale("en")}>English</Button>
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="users">
          <Card><CardContent className="p-0">
            <div className="divide-y">{users.map((u) => (
              <div key={u.id} className="p-3 flex items-center gap-3 text-sm">
                <EntityAvatar name={u.full_name ?? u.email ?? ""} url={u.avatar_url ?? null} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.full_name ?? u.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
                <Badge variant={u.role === "owner" ? "default" : "secondary"}>{u.role ?? "—"}</Badge>
                {isStaff && <ResetPasswordButton userId={u.id} userName={u.full_name ?? u.email ?? ""} />}
              </div>
            ))}</div>
          </CardContent></Card>
        </TabsContent>

        {isStaff && (
          <TabsContent value="sectors">
            <SectorsManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function SelfPasswordChange() {
  const { t } = useTranslation();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (pw.length < 8) { toast.error(t("password.tooShort")); return; }
    if (pw !== pw2) { toast.error(t("password.mismatch")); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setPw(""); setPw2("");
    toast.success(t("password.updated"));
  }
  return (
    <div className="space-y-2 max-w-sm border-t pt-4">
      <div className="text-sm font-medium">{t("password.change")}</div>
      <div><Label className="text-xs">{t("password.new")}</Label>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <div><Label className="text-xs">{t("password.confirm")}</Label>
        <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
      <Button size="sm" onClick={submit} disabled={busy}>{t("common.save")}</Button>
    </div>
  );
}

function ResetPasswordButton({ userId, userName }: { userId: string; userName: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (pw.length < 8) { toast.error(t("password.tooShort")); return; }
    if (pw !== pw2) { toast.error(t("password.mismatch")); return; }
    setBusy(true);
    const { error } = await supabase.functions.invoke("reset-user-password", {
      body: { target_user_id: userId, new_password: pw },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setOpen(false); setPw(""); setPw2("");
    toast.success(t("password.updated"));
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost"><KeyRound className="h-3.5 w-3.5 me-1" />{t("password.resetCta")}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{t("password.resetFor", { name: userName })}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <div><Label className="text-xs">{t("password.new")}</Label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div><Label className="text-xs">{t("password.confirm")}</Label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={busy}>{t("password.resetCta")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectorsManager() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const qc = useQueryClient();
  const { data: sectors = [] } = useSectors();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name_en: "", name_ar: "" });
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState({ name_en: "", name_ar: "" });

  function refresh() { qc.invalidateQueries({ queryKey: ["sectors"] }); }

  async function startEdit(s: { id: string; name_en: string; name_ar: string }) {
    setEditingId(s.id);
    setDraft({ name_en: s.name_en, name_ar: s.name_ar });
  }
  async function saveEdit() {
    if (!draft.name_en.trim() || !draft.name_ar.trim()) { toast.error(t("sectors.bothNamesRequired")); return; }
    const { error } = await supabase.from("sectors").update(draft as never).eq("id", editingId!);
    if (error) { toast.error(error.message); return; }
    setEditingId(null);
    refresh();
    toast.success(t("common.save"));
  }
  async function remove(id: string) {
    const [cRes, pRes] = await Promise.all([
      supabase.from("companies").select("id", { count: "exact", head: true }).eq("sector_id", id),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("sector_id", id),
    ]);
    const cCount = cRes.count ?? 0;
    const pCount = pRes.count ?? 0;
    if (cCount > 0 || pCount > 0) {
      toast.error(t("sectors.inUse", { companies: cCount, products: pCount }));
      return;
    }
    if (!confirm(t("sectors.confirmDelete"))) return;
    const { error } = await supabase.from("sectors").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
    toast.success(t("sectors.deleted"));
  }
  async function createNew() {
    if (!newDraft.name_en.trim() || !newDraft.name_ar.trim()) { toast.error(t("sectors.bothNamesRequired")); return; }
    const { error } = await supabase.from("sectors").insert(newDraft as never);
    if (error) { toast.error(error.message); return; }
    setNewDraft({ name_en: "", name_ar: "" });
    setCreating(false);
    refresh();
    toast.success(t("common.save"));
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-3 flex justify-between items-center border-b">
          <div className="text-sm font-medium">{t("sectors.manage")}</div>
          {!creating && (
            <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4 me-1" />{t("sectors.new")}</Button>
          )}
        </div>
        {creating && (
          <div className="p-3 border-b grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <div><Label className="text-xs">{t("sectors.nameEn")}</Label>
              <Input value={newDraft.name_en} onChange={(e) => setNewDraft({ ...newDraft, name_en: e.target.value })} /></div>
            <div><Label className="text-xs">{t("sectors.nameAr")}</Label>
              <Input value={newDraft.name_ar} onChange={(e) => setNewDraft({ ...newDraft, name_ar: e.target.value })} /></div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setNewDraft({ name_en: "", name_ar: "" }); }}>{t("common.cancel")}</Button>
              <Button size="sm" onClick={createNew}>{t("common.save")}</Button>
            </div>
          </div>
        )}
        <div className="divide-y">
          {sectors.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">{t("common.empty")}</div>}
          {sectors.map((s) => (
            <div key={s.id} className="p-3 flex items-center gap-2">
              {editingId === s.id ? (
                <>
                  <Input className="flex-1" value={draft.name_en} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} placeholder={t("sectors.nameEn")} />
                  <Input className="flex-1" value={draft.name_ar} onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })} placeholder={t("sectors.nameAr")} />
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{t("common.cancel")}</Button>
                  <Button size="sm" onClick={saveEdit}>{t("common.save")}</Button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{ar ? s.name_ar : s.name_en}</div>
                    <div className="text-xs text-muted-foreground truncate">{ar ? s.name_en : s.name_ar}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(s)} aria-label={t("common.edit")}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(s.id)} aria-label={t("common.delete") || "Delete"}><Trash2 className="h-4 w-4" /></Button>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
