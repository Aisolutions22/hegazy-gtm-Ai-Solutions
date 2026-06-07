
# Company 360 — Executive Command Center

Turn Company 360 into the daily workspace: real meetings, real ICP engine, notes timeline, inline quick actions — all on one page.

## 1. Database (single migration)

### `meetings`
```
id uuid pk, title text not null, meeting_date timestamptz not null,
attendees text[], notes text, decisions text,
company_id uuid → companies (set null), opportunity_id uuid → opportunities (set null),
created_by uuid, created_at, updated_at
```
Indexed on `company_id`, `meeting_date desc`. RLS via `is_staff()`. `archived_at` for soft delete. Plus standard GRANTs + updated_at trigger.

### `company_notes`
```
id uuid pk, company_id uuid → companies (cascade) not null,
note text not null, created_by uuid, created_at, updated_at, archived_at
```
RLS via `is_staff()`, GRANTs, updated_at trigger.

### ICP columns on `companies`
Add 6 sub-scores (0–max each) + computed total + tier:
```
icp_sector_fit smallint default 0           (0..25)
icp_consumption smallint default 0          (0..20)
icp_frequency smallint default 0            (0..15)
icp_profitability smallint default 0        (0..20)
icp_strategic smallint default 0            (0..10)
icp_accessibility smallint default 0        (0..10)
icp_score smallint GENERATED ALWAYS AS (sum of above) STORED
icp_tier text GENERATED ALWAYS AS (
  CASE WHEN score>=90 'A' WHEN >=75 'B' WHEN >=50 'C' ELSE 'low' END) STORED
```
CHECK constraints enforce each sub-score range. Index on `icp_score desc`.

### `app_settings` row for ICP weights
Insert a `key='icp_weights'` row with the default max-points per dimension so the formula stays configurable from Settings later (UI deferred — out of scope for this turn).

### Future hook (no code yet)
Schema-only readiness for "decision → tasks": meetings already has `decisions text`. Conversion UI in a future iteration.

## 2. Hooks (`src/hooks/`)

- `use-company.ts` — add: `useCompanyMeetings(id)`, `useCompanyNotes(id)`, `useUpdateCompanyIcp(id)`, `useCompanyKpis(id)` (aggregates revenue/profit/tons + open opps/tasks count from existing tables in one parallel batch).
- `use-meetings.ts` (new) — `useCreateMeeting()` mutation; invalidates `company-meetings`, `company-activity`.
- `use-notes.ts` (new) — `useCreateNote()` mutation; invalidates `company-notes`, `company-activity`.
- Existing `use-opportunities.ts` / tasks creation: add `useCreateOpportunity()` and `useCreateTask()` mutations scoped by company.

All mutations call `logActivity()` so the activity timeline reflects every quick action.

## 3. Company 360 layout (`src/routes/_authenticated/companies.$id.tsx`)

Replace current tabs-only layout with a command-center grid:

```
┌─ Header: avatar · name · type badge · sector · location · [Quick Actions ▾]
├─ ICP Score panel (big tier badge A/B/C/Low + score, 6 sub-bars, "Edit scores")
├─ KPI strip: Revenue YTD · Profit YTD · Tons YTD · Margin · Open Opps · Open Tasks
├─ Two-column grid:
│   ├─ Left (2/3):  Tabs[Overview · Sales · Opportunities · Tasks · Meetings · Notes]
│   │     • Overview = profile fields + latest 3 meetings + latest 3 notes
│   │     • Meetings tab = list w/ date, attendees, decisions, "+ Add Meeting"
│   │     • Notes tab = timeline (chronological feed) w/ "+ Add Note"
│   └─ Right (1/3): Activity Feed (live from activity_logs scoped to this company)
```

Empty states use existing `<EmptyState/>`.

## 4. Quick actions (inline)

Single `<QuickActionsMenu/>` in header → opens dedicated dialog/sheet per action, all pre-filled with `company_id`:

- **Add Opportunity** — dialog: title, product, expected tons/revenue/profit, deadline, pipeline_status (default `lead`).
- **Add Task** — dialog: title, description, priority, deadline, optional opportunity link.
- **Add Meeting** — sheet (more fields): title, date/time, attendees (tag input → `text[]`), notes, decisions, optional opportunity link.
- **Add Note** — small dialog: textarea only.

On success → toast, invalidate relevant queries, close dialog. User never leaves the page.

## 5. ICP edit dialog

`<IcpEditDialog/>` triggered from the ICP panel: 6 sliders (each bounded to its max), live total preview, tier badge updates as user moves sliders. Saves via `useUpdateCompanyIcp`.

## 6. i18n

Add Arabic + English strings for: ICP dimensions & tiers, meetings/notes labels, quick-action buttons, empty states. Update `src/lib/i18n.ts`.

## 7. Sidebar

`/meetings` route already exists as "Coming Soon". Scope of this turn keeps the global Meetings page out — meetings are accessed through Company 360. (Optional: replace stub with a global list of recent meetings across all companies. **Suggest doing this in the same turn since the table now exists** — confirm if you want it included.)

## Files touched

**Migration (1):** meetings, company_notes, ICP columns, app_settings seed row.

**New files:**
- `src/hooks/use-meetings.ts`
- `src/hooks/use-notes.ts`
- `src/components/company/quick-actions-menu.tsx`
- `src/components/company/icp-panel.tsx`
- `src/components/company/icp-edit-dialog.tsx`
- `src/components/company/add-opportunity-dialog.tsx`
- `src/components/company/add-task-dialog.tsx`
- `src/components/company/add-meeting-sheet.tsx`
- `src/components/company/add-note-dialog.tsx`
- `src/components/company/kpi-strip.tsx`
- `src/components/company/activity-feed.tsx`
- `src/components/company/notes-timeline.tsx`
- `src/components/company/meetings-list.tsx`

**Edited:**
- `src/hooks/use-company.ts` (add KPIs, meetings, notes, ICP update)
- `src/hooks/use-opportunities.ts` (add create mutation)
- `src/routes/_authenticated/companies.$id.tsx` (full rewrite around new layout)
- `src/lib/i18n.ts`

## Out of scope (deferred, explicit)
- Settings UI to edit ICP weights (row exists, no editor yet).
- Converting meeting decisions into tasks (schema supports it via free-text `decisions`; conversion UX later).
- Global Meetings page redesign (unless you say "yes" to including it).

## Open question
Include a global Meetings list page (`/meetings`) in this same turn now that the table exists? Default: **no, keep this turn scoped to Company 360.**
