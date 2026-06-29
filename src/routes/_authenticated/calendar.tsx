import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, CheckSquare, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCalendarEvents, type CalendarEvent, type CalendarEventKind } from "@/hooks/use-calendar";

export const Route = createFileRoute("/_authenticated/calendar")({ component: CalendarPage });

const KIND_STYLES: Record<CalendarEventKind, { dot: string; chip: string; icon: typeof CalendarDays }> = {
  meeting: { dot: "bg-sky-500", chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30", icon: CalendarDays },
  task: { dot: "bg-amber-500", chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30", icon: CheckSquare },
  opportunity: { dot: "bg-primary", chip: "bg-primary/10 text-primary border-primary/30", icon: Target },
};

function CalendarPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? ar : enUS;
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);

  const { data: events = [], isLoading } = useCalendarEvents(month);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { locale });
    const end = endOfWeek(endOfMonth(month), { locale });
    const days: Date[] = [];
    for (let d = start; d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      days.push(d);
    }
    return days;
  }, [month, locale]);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { locale });
    return Array.from({ length: 7 }, (_, i) =>
      format(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), "EEE", { locale }),
    );
  }, [locale]);

  const today = new Date();

  return (
    <div>
      <PageHeader title={t("nav.calendar")} />
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, -1))} aria-label="prev">
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setMonth(startOfMonth(new Date())); setSelected(new Date()); }}>
                {t("calendar.today")}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))} aria-label="next">
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold">{format(month, "LLLL yyyy", { locale })}</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {(["meeting", "task", "opportunity"] as const).map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", KIND_STYLES[k].dot)} />
                  {t(`calendar.kinds.${k}`)}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground">
            {weekdayLabels.map((w, i) => (
              <div key={i} className="px-2 py-1 text-center">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay.get(iso) ?? [];
              const inMonth = isSameMonth(day, month);
              const isToday = isSameDay(day, today);
              const isSelected = selected && isSameDay(day, selected);
              const visible = dayEvents.slice(0, 3);
              const extra = dayEvents.length - visible.length;

              return (
                <Popover key={iso} open={isSelected ?? false} onOpenChange={(o) => setSelected(o ? day : null)}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "min-h-[88px] rounded-md border bg-card p-1.5 text-start transition-colors hover:bg-accent/40 flex flex-col gap-1",
                        !inMonth && "opacity-40",
                        isToday && "border-primary ring-1 ring-primary/40",
                        isSelected && "bg-accent/60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-semibold", isToday && "text-primary")}>
                          {format(day, "d", { locale })}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">{dayEvents.length}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-0.5 mt-auto">
                        {visible.map((e) => (
                          <span
                            key={e.id}
                            className={cn("h-1.5 w-1.5 rounded-full", KIND_STYLES[e.kind].dot)}
                            title={e.title}
                          />
                        ))}
                        {extra > 0 && (
                          <span className="text-[10px] text-muted-foreground leading-none ms-1">+{extra}</span>
                        )}
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="center" className="w-72 p-3">
                    <div className="text-sm font-semibold mb-2">{format(day, "PPP", { locale })}</div>
                    {dayEvents.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t("calendar.noEvents")}</p>
                    ) : (
                      <ul className="space-y-2">
                        {dayEvents.map((e) => {
                          const Icon = KIND_STYLES[e.kind].icon;
                          return (
                            <li key={e.id} className="flex items-start gap-2">
                              <Badge variant="outline" className={cn("gap-1 shrink-0", KIND_STYLES[e.kind].chip)}>
                                <Icon className="h-3 w-3" />
                                {t(`calendar.kinds.${e.kind}`)}
                              </Badge>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate">{e.title}</div>
                                {e.companyId && e.companyName && (
                                  <Link
                                    to="/companies/$id"
                                    params={{ id: e.companyId }}
                                    className="text-xs text-primary hover:underline truncate block"
                                  >
                                    {e.companyName}
                                  </Link>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
