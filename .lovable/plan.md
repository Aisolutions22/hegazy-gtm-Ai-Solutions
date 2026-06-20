# Fix Company 360 routing + add Edit to Companies & Products

## 1. Un-nest the Company 360 route

**Problem:** `src/routes/_authenticated/companies.$id.tsx` is currently a child of `companies.tsx` (the list page), which has no `<Outlet />`. Result: navigating to `/companies/:id` silently mounts nothing, list stays visible.

**Fix:** Rename the file using TanStack Router's trailing-underscore escape:

- `src/routes/_authenticated/companies.$id.tsx` → `src/routes/_authenticated/companies_.$id.tsx`
- Update the `createFileRoute` string from `"/_authenticated/companies/$id"` to `"/_authenticated/companies_/$id"` (the generated route ID includes the underscore; the URL `/companies/$id` is preserved because the trailing underscore is stripped from the URL but kept in the route ID).
- No changes needed to any `<Link to="/companies/$id">` calls — TanStack's path matcher still resolves the URL the same way (it routes through the de-nested route).
- After Vite regenerates `routeTree.gen.ts`, verify `AuthenticatedCompaniesIdRoute.getParentRoute()` resolves to the `_authenticated` layout, NOT to `AuthenticatedCompaniesRoute`.

No edits to `companies.tsx` (the list) needed — it remains a leaf route.

## 2. Add Edit to Companies page

In `src/routes/_authenticated/companies.tsx`:

- Import `Pencil` from `lucide-react`.
- Refactor `CompanyForm` to accept:
  ```ts
  { sectors, onDone, mode?: "create" | "edit", initialData?: Company }
  ```
  - Default `mode = "create"`.
  - When `mode === "edit"`, seed form state from `initialData`, change dialog title to `t("companies.edit")` (fallback to existing key), and on save call `supabase.from("companies").update(payload).eq("id", initialData.id)` then `logActivity("company", id, "edited", { name })`.
- In the table actions cell, add a Pencil icon button before the Archive button. Clicking it opens a per-row `<Dialog>` with `<CompanyForm mode="edit" initialData={c} ... />`. Use local `editingId` state to control which row's dialog is open (avoids rendering N dialogs).
- After save, invalidate `["companies"]`.

## 3. Add Edit to Products page

In `src/routes/_authenticated/products.tsx`:

- Import `Pencil`.
- Refactor `ProductForm` to accept `mode` + `initialData` (same shape pattern).
- On edit, `supabase.from("products").update(payload).eq("id", initialData.id)` and `logActivity("product", id, "edited", { name: name_en })`.
- Add a Pencil icon button on each product card next to Archive. Opens a Dialog with `<ProductForm mode="edit" initialData={p} ... />` controlled by an `editingId` state.

## 4. i18n

In `src/lib/i18n.ts`, add to both `en` and `ar` under `common`:
- `en.common.edit = "Edit"`
- `ar.common.edit = "تعديل"`

(Skip if already present.)

## 5. Verification

- Confirm `src/routeTree.gen.ts` shows `AuthenticatedCompaniesIdRoute` (now `AuthenticatedCompanies_IdRoute`) with `getParentRoute: () => AuthenticatedRouteRoute` — not `AuthenticatedCompaniesRoute`.
- Click a company in the list → full Company 360 page replaces the list view; all 6 tabs (overview, sales, opportunities, tasks, meetings, notes) render.
- Click Pencil on a company row → dialog opens pre-filled → save updates the row.
- Same for products.

## Files touched

- rename `src/routes/_authenticated/companies.$id.tsx` → `src/routes/_authenticated/companies_.$id.tsx` (+ update `createFileRoute` string)
- edit `src/routes/_authenticated/companies.tsx` (Edit dialog + form refactor)
- edit `src/routes/_authenticated/products.tsx` (Edit dialog + form refactor)
- edit `src/lib/i18n.ts` (add `common.edit`)
- `src/routeTree.gen.ts` regenerates automatically
