# Investigation: "All application data appears missing"

No changes were made. This is a read-only report from the live database.

## TL;DR

The data is **physically intact** in the correct database. Recent migrations only changed RLS policies and one SECURITY DEFINER function — none dropped, truncated, or recreated tables. The most likely cause is that **the account you're signed in with no longer satisfies the staff-only RLS policies** (which gate `companies`, `opportunities`, `meetings`, `tasks`, `sales_records`, `activity_logs`, `products`, `sectors`, `app_settings`). If your user row in `user_roles` is `member` (or missing), every domain table will return zero rows from the frontend even though the data is there.

## 1. Is the data physically deleted?

**No.** Live row counts from `pg_stat_user_tables` on the project's database right now:

| Table | Live rows |
|---|---|
| activity_logs | 19 |
| app_settings | 1 |
| companies | 3 |
| meetings | 2 |
| opportunities | 1 |
| products | 4 |
| profiles | 2 |
| sales_records | 2 |
| sectors | 6 |
| tasks | 3 |
| user_roles | 2 |
| company_notes, notifications, task_comments | 0 |

Non-zero `n_dead_tup` on a few tables just reflects normal updates/deletes during use — not a wipe. No table has been recreated (no reset stats).

## 2. Is it hidden by RLS?

**Almost certainly yes, for the current session.** Every domain table is gated by `is_staff(auth.uid())`, which returns true only when the user holds the `owner` or `admin` role in `public.user_roles`. The earlier security hardening turn changed new sign-ups to receive `member` (not `admin`), and split `user_roles` writes so only an `owner` (and not yourself) can grant roles. If you signed in with an account that isn't `owner`/`admin`, the Data API will silently return empty arrays for all CRM tables — exactly the "data is gone" symptom.

This will be confirmed in build mode by running, as the signed-in user: `select public.is_staff(auth.uid()), (select array_agg(role) from public.user_roles where user_id = auth.uid())`.

## 3. Are we connected to the correct project?

**Yes.** `.env` `VITE_SUPABASE_PROJECT_ID = xsmtjocxyyamdzfwunls` matches the Lovable Cloud project info (`https://xsmtjocxyyamdzfwunls.supabase.co`). The app is talking to the right database — the one whose row counts are shown above.

## 4. Did any migration drop / truncate / recreate tables?

**No.** The three most recent migrations (`20260620165018`, `20260620165141`, `20260620165309`) contain no `DROP TABLE`, `TRUNCATE`, `DELETE FROM`, or `DROP SCHEMA` statements. They are the policy/role/function hardening migrations from earlier this session:

- `165018` — split `user_roles` ALL policy into per-command policies that block self-modification.
- `165141` — replaced avatars storage policies with own-folder-or-staff rules + WITH CHECK on UPDATE.
- `165309` — switched `handle_opportunity_won()` to SECURITY INVOKER.

None of them touch table data or structure.

## 5. Evidence summary

- Live row counts above (source: `pg_stat_user_tables`).
- Migration scans above (source: grep over `supabase/migrations/*.sql`).
- Project identity match (source: `.env` vs `supabase--project_info`).

## Recommended next step (in build mode)

1. Confirm the hypothesis by checking `is_staff(auth.uid())` and the `user_roles` row for the currently signed-in user.
2. If the result is `false`/`member`, the fix is a one-row update in `user_roles` for that user (grant `owner` or `admin`) — performed via the `insert` tool, not a migration. Data will immediately reappear in the UI; nothing else needs to change.
3. If `is_staff` returns `true` and rows are still missing in the UI, investigate the client (cached session, wrong env at build time) — but based on the evidence above, that is unlikely.

No code or schema changes are proposed at this stage.
