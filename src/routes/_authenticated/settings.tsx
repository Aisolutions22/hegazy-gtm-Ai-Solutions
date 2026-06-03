import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { setLocale } from "@/lib/i18n";
import { getTheme, setTheme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, role } = useAuth();
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  useEffect(() => setThemeState(getTheme()), []);

  const { data: users = [] } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email"),
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
          <Card><CardContent className="p-6 space-y-2">
            <div className="text-sm"><span className="text-muted-foreground">Email: </span><span className="font-medium">{user?.email}</span></div>
            <div className="text-sm"><span className="text-muted-foreground">Role: </span><Badge>{role}</Badge></div>
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
              <div key={u.id} className="p-3 flex items-center justify-between text-sm">
                <div><div className="font-medium">{u.full_name ?? u.email}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
                <Badge variant={u.role === "owner" ? "default" : "secondary"}>{u.role ?? "—"}</Badge>
              </div>
            ))}</div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
