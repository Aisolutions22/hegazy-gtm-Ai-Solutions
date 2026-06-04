# Dashboard UX Refactor — Executive Operating System

Tighten the dashboard into a dense, executive-grade cockpit with an aluminium industrial visual identity. No new backend features — only UX, hierarchy, regrouping, and presentation polish using data already queried.

## 1. Sidebar regrouping (`src/components/app-shell.tsx`)

Restructure `navGroups` into the 5 requested groups:

- **GTM**: Dashboard, Current Situation, GTM Plan
- **Revenue**: Companies, Products, Opportunities, Sales, Analytics
- **Execution**: Tasks, Calendar, Meetings
- **Intelligence**: Intelligence, Competitors, Goals
- **System**: Activity, Archive, Settings

Add i18n keys `nav.groups.gtm/revenue/execution/intelligence/system` (EN + AR) for the group labels.

## 2. Dashboard layout (`src/routes/_authenticated/dashboard.tsx`)

New information hierarchy (top → bottom), tighter spacing (`space-y-4`, `gap-3`, smaller paddings):

```text
┌─────────────────────────────────────────────────────────┐
│ Executive header (title + period chip + last updated)   │
├─────────────────────────────────────────────────────────┤
│ KPI strip (6 compact cards, single row on lg)           │
├──────────────────────────────┬──────────────────────────┤
│ Monthly Trend chart (2026)   │ Today's Focus            │
│ (col-span-2)                 │ (tasks due today)        │
├──────────────────────────────┼──────────────────────────┤
│ Next Best Actions            │ Upcoming Deadlines       │
│ (top open opps, ranked)      │ (next 7d tasks + opps)   │
├──────────────────────────────┴──────────────────────────┤
│ Recent Activities (activity_logs feed, compact rows)    │
└─────────────────────────────────────────────────────────┘
```

Layout changes:
- Replace stacked full-width blocks with `lg:grid-cols-3` (chart 2/3 + Today's Focus 1/3) then `lg:grid-cols-2` for NBA + Deadlines.
- Reduce KPI card padding `p-4` → `p-3`, smaller labels, inline icon.
- Chart height `h-64` → `h-56`, denser axes.
- Remove redundant page description; replace with a thin meta row.

### Widgets

- **Today's Focus**: reuse existing `todayTasks` query (already present) — show priority dot, title, due time; cap at 6.
- **Next Best Actions**: reuse `topOpps` query, present as ranked actionable rows ("Advance {opp} — {stage}") with revenue and stage chip.
- **Upcoming Deadlines**: new query — `tasks` where `deadline` between today+1 and today+7, plus `opportunities` with `expected_close_date` in same window; unify into one sorted list (no schema changes).
- **Recent Activities**: new query — `activity_logs` joined with user, last 8 entries; render as compact feed (icon by action, entity, relative time).

## 3. Empty states

Create `src/components/empty-state.tsx` — accepts `icon`, `title`, `description`, optional `action`. Subtle dashed border, muted icon, single short sentence. Use in every widget and inside the chart when `monthly` totals are all zero. Add i18n keys `empty.noData/noTasks/noOpps/noActivity/noDeadlines`.

## 4. Aluminium industrial visual identity

Lightweight, subtle, non-intrusive — token-driven, no heavy images.

- **CSS tokens** (`src/styles.css`): add
  - `--gradient-aluminium: linear-gradient(135deg, oklch(0.92 0.005 240), oklch(0.85 0.008 240), oklch(0.95 0.004 240))`
  - `--shadow-industrial: 0 1px 0 color-mix(in oklab, white 60%, transparent) inset, 0 1px 2px color-mix(in oklab, var(--foreground) 8%, transparent)`
  - `.bg-coil` utility: a repeating linear-gradient producing thin metallic banding (aluminium coil texture) at ~4% opacity for backgrounds.
  - `.metal-card`: applies aluminium gradient + industrial shadow + 1px hairline border.
- **Background**: add a fixed, very low-opacity SVG of stacked coils as decorative `::before` on `<main>` (pointer-events: none, 3–5% opacity, masked at edges) — purely atmospheric.
- **Header accent**: thin brushed-metal divider under the page header.
- **KPI cards**: apply `.metal-card` for a subtle aluminium feel; keep dark-mode tokens too.
- **Icons**: keep current lucide set; tint primary icons with `text-primary` over metallic surface.

All visuals stay token-based — no raster images, no brand color override.

## 5. i18n additions (`src/lib/i18n.ts`)

Add keys for: nav groups, new widget titles (`dashboard.nextBestActions`, `dashboard.upcomingDeadlines`, `dashboard.recentActivities`, `dashboard.lastUpdated`, `dashboard.period`), empty-state strings. Provide AR translations.

## Files touched

- `src/components/app-shell.tsx` — regroup nav
- `src/components/empty-state.tsx` — new
- `src/routes/_authenticated/dashboard.tsx` — full layout refactor + 2 new queries
- `src/styles.css` — aluminium tokens + utilities
- `src/lib/i18n.ts` — new keys (EN + AR)

## Out of scope

- No schema changes, no new tables, no new server functions.
- No changes to other routes' content.
- No new business features — purely UX, layout, and visual identity.
