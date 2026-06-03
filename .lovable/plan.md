
# Hegazy GTM OS 2026 — V1 Plan (Core)

A production-grade internal GTM operating system. V1 focuses on the foundation and the most-used modules. Remaining modules (Sales Analytics, GTM/ICP, Calendar, Meetings, Strategic Intelligence, Competitors, Goals, Current Situation) will be added in follow-up iterations on top of the same schema and shell.

## V1 Scope

**In:** Auth, role gating (Owner/Admin), App Shell (sidebar + topbar), Dashboard, Companies + Company 360, Products, Opportunities (with Won → Customer rule), Tasks, Sales Records (manual + auto), Activity Log, Archive, Settings.

**Deferred to V2:** Current Situation, GTM Engine, ICP scoring, Sales Analytics deep charts, Calendar, Meetings & Decisions, Strategic Intelligence (rich text KB), Competitors, Goals & Roadmap.

## Design & Localization

- Theme: white + light blue, modern industrial executive. Light/Dark mode.
- shadcn/ui + Tailwind v4 design tokens in `src/styles.css` (oklch).
- Default locale: **Arabic RTL**, switchable to English. `dir` toggled on `<html>`. Use `i18next` with `ar` + `en` resource bundles.
- Fonts: Cairo / IBM Plex Sans Arabic for AR, Inter for EN.
- Fixed sidebar (collapsible via shadcn Sidebar), topbar with search, notifications, theme toggle, language toggle, user menu.

## Architecture

- TanStack Start + React 19 + TypeScript + Tailwind v4 + shadcn/ui.
- Lovable Cloud (Supabase) enabled. Auth via Supabase Auth (email + password).
- Data via `createServerFn` + `requireSupabaseAuth`, TanStack Query for cache; protected pages under `src/routes/_authenticated/`.
- Role table `user_roles` (`app_role` enum: `owner`, `admin`) + `has_role()` security definer. First signed-up user auto-promoted to `owner`.
- No hard deletes — every domain table has `archived_at`. Archive page restores.
- Every mutation writes to `activity_logs`.

## Database Schema (V1)

All public-schema tables get explicit GRANTs + RLS. RLS: authenticated users (owner/admin) can read/write; archive sets `archived_at`.

- `profiles` (id → auth.users, full_name, avatar_url, locale, theme)
- `user_roles` (user_id, role)
- `sectors` (id, name_ar, name_en, archived_at)
- `companies` (id, name, type [`customer`|`target`|`opportunity`], sector_id, website, linkedin, location, contact_person, phone, email, notes, logo_url, status, archived_at)
- `products` (id, name_ar, name_en, description, default_margin, sector_id, archived_at) — seeded with Coils, Circles, Sheets, Deoxidizer
- `opportunities` (id, company_id, product_id, expected_tons, expected_revenue, expected_profit, blockers, next_action, owner_id, deadline, pipeline_status [`lead`|`contacted`|`qualified`|`negotiation`|`won`|`lost`], archived_at)
- `sales_records` (id, company_id, product_id, opportunity_id nullable, period_month, tons, revenue, profit, margin generated, created_by, archived_at)
- `tasks` (id, title, description, priority, status [`todo`|`in_progress`|`blocked`|`completed`], deadline, assignee_id, company_id, opportunity_id, archived_at)
- `task_comments` (id, task_id, user_id, body)
- `activity_logs` (id, user_id, entity_type, entity_id, action [`created`|`edited`|`archived`|`restored`|`status_changed`], meta jsonb, created_at)
- `notifications` (id, user_id, title, body, read_at, created_at)
- `app_settings` (singleton: logo_url, default_locale, default_theme)

DB trigger: when `opportunities.pipeline_status` flips to `won`, set `companies.type = 'customer'` and insert a `sales_records` row from the opportunity's expected values (auto path for "Both"). Trigger writes to `activity_logs`.

Seed: 4 default products, a small starter sector list (Construction, Cookware, Industrial, Packaging, Electrical, Other).

## Routes

```
/auth                                 sign in / sign up
/_authenticated/                      shell (sidebar + topbar)
  index                               Dashboard
  companies / companies.$id           list + Company 360
  products
  opportunities                       table + Kanban by pipeline_status
  tasks                               Kanban / Table toggle
  sales                               manual entry + list (analytics page later)
  activity
  archive
  settings
```

Placeholder routes (empty "coming soon" pages) created for: current-situation, gtm, analytics, calendar, meetings, intelligence, competitors, goals — so nav matches the spec and V2 can fill them in.

## Key UI

- **Dashboard:** KPI cards (Revenue YTD, Profit YTD, Avg Margin %, Tons YTD, Active Customers, Open Opportunities), Today's Focus (tasks due today), Top Opportunities (by expected_revenue, open), Upcoming Deadlines, Recent Activity, Notifications. Recharts: Monthly Revenue / Profit / Tons (last 12 months from `sales_records`).
- **Companies:** searchable/filterable table, type badges, archive action.
- **Company 360:** header w/ logo + type, tabs — Profile, Contacts, Sales History, Opportunities, Tasks, Notes, Timeline (from activity_logs).
- **Opportunities:** Kanban columns = pipeline stages, drag to change stage; moving to Won fires the trigger.
- **Tasks:** Kanban (status columns) + table view toggle, comments drawer.
- **Archive:** unified list across entity types with Restore.
- **Settings:** profile, theme, language, logo upload (Supabase Storage `branding` bucket), users list (owner can invite/promote — V1 shows list + role).

## Technical Notes

- TanStack Query: `queryOptions` + `ensureQueryData` in loaders, `useSuspenseQuery` in components. `errorComponent` + `notFoundComponent` on every loader route.
- Validation: zod schemas on every server fn `inputValidator`.
- All currency/tons formatted with locale-aware `Intl.NumberFormat`.
- Activity log written from server fns (one helper) so client never forges entries.
- Storage bucket `branding` (public) for company logos + app logo; `avatars` (public) for users.

## Out of Scope (explicit)

- ICP scoring engine, SWOT editor, rich-text KB, Competitor tracker, Goals/Roadmap progress, Calendar (FullCalendar), Meetings → tasks generator, deep Sales Analytics page. These get their own follow-up plan once V1 is approved and shipping.

## Deliverable Order

1. Enable Lovable Cloud + migrations (schema, RLS, trigger, seed).
2. Auth (sign in/up, role bootstrap, `_authenticated` gate already managed).
3. Shell: sidebar, topbar, i18n (AR default + RTL), theme toggle.
4. Dashboard with real queries.
5. Companies + Company 360.
6. Products.
7. Opportunities (table + Kanban + Won rule).
8. Tasks (Kanban + table + comments).
9. Sales records (manual entry, list).
10. Activity Log + Archive + Settings.
11. Placeholder routes for V2 modules.
