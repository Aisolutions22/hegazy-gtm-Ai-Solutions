import type { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Building2, Package, Target, ListChecks, BarChart3, CalendarDays,
  Users2, Brain, Swords, Goal, Activity, Archive, Settings,
  Sun, Moon, Globe, LogOut, Search, Bell, Gauge, UserRound, Tags,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import { EntityAvatar } from "@/components/shared/avatar-upload";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocale } from "@/lib/i18n";
import { getTheme, setTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useEffect, useState } from "react";

const navGroups = (t: (k: string) => string) => [
  {
    label: t("navGroups.gtm"),
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
      { to: "/revenue-cockpit", icon: Gauge, label: t("nav.revenueCockpit") },
    ],
  },
  {
    label: t("navGroups.crm"),
    items: [
      { to: "/companies", icon: Building2, label: t("nav.companies") },
      { to: "/contacts", icon: UserRound, label: t("nav.contacts") },
      { to: "/sectors", icon: Tags, label: t("nav.sectors") },
      { to: "/products", icon: Package, label: t("nav.products") },
    ],
  },
  {
    label: t("navGroups.sales"),
    items: [
      { to: "/opportunities", icon: Target, label: t("nav.opportunities") },
      { to: "/sales", icon: BarChart3, label: t("nav.sales") },
      { to: "/analytics", icon: BarChart3, label: t("nav.analytics") },
    ],
  },
  {
    label: t("navGroups.execution"),
    items: [
      { to: "/tasks", icon: ListChecks, label: t("nav.tasks") },
      { to: "/calendar", icon: CalendarDays, label: t("nav.calendar") },
      { to: "/meetings", icon: Users2, label: t("nav.meetings") },
    ],
  },
  {
    label: t("navGroups.intelligence"),
    items: [
      { to: "/intelligence", icon: Brain, label: t("nav.intelligence") },
      { to: "/competitors", icon: Swords, label: t("nav.competitors") },
      { to: "/goals", icon: Goal, label: t("nav.goals") },
    ],
  },
  {
    label: t("navGroups.system"),
    items: [
      { to: "/activity", icon: Activity, label: t("nav.activity") },
      { to: "/archive", icon: Archive, label: t("nav.archive") },
      { to: "/settings", icon: Settings, label: t("nav.settings") },
    ],
  },
];

function AppSidebar() {
  const { t, i18n } = useTranslation();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const side = i18n.language === "ar" ? "right" : "left";

  return (
    <Sidebar collapsible="icon" side={side}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">H</div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{t("app.name")}</span>
              <span className="text-[10px] text-muted-foreground">{t("app.tagline")}</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups(t).map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => {
                  const active = pathname === it.to || pathname.startsWith(it.to + "/");
                  return (
                    <SidebarMenuItem key={it.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={it.label}>
                        <Link to={it.to}>
                          <it.icon className="h-4 w-4" />
                          <span>{it.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

function Topbar() {
  const { t, i18n } = useTranslation();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [cmdOpen, setCmdOpen] = useState(false);
  useEffect(() => setThemeState(getTheme()), []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    setThemeState(next);
  };
  const toggleLocale = () => setLocale(i18n.language === "ar" ? "en" : "ar");

  const { data: profile } = useMyProfile();
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 glass px-4">
      <SidebarTrigger />
      <button
        type="button"
        onClick={() => setCmdOpen(true)}
        className="relative max-w-md flex-1 flex items-center gap-2 h-9 px-3 rounded-md bg-muted/50 text-start text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{t("commandPalette.trigger")}</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono">
          {isMac ? "⌘" : "Ctrl"}K
        </kbd>
      </button>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <div className="ms-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleLocale} title="Language"><Globe className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Theme">
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" title="Notifications"><Bell className="h-4 w-4" /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-1 h-auto rounded-full">
              <EntityAvatar name={profile?.full_name ?? user?.email ?? null} url={profile?.avatar_url ?? null} size="sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-xs truncate">{user?.email}</span>
              {role && <span className="text-[10px] text-muted-foreground capitalize font-normal">{role}</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}><Settings className="h-4 w-4 me-2" />{t("nav.settings")}</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}>
              <LogOut className="h-4 w-4 me-2" />{t("auth.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
