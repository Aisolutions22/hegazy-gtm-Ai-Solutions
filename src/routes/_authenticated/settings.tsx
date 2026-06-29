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

