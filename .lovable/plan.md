## Security verification — no action needed

A fresh full security scan (Wiz / connector scan + Lovable Supabase scan + Supabase linter) was just run.

### Results
- **Wiz / connector scan:** 0 findings.
- **Privilege-escalation scan:** 0 findings. The `user_roles` policies correctly block self-promotion (INSERT/UPDATE/DELETE require `has_role(auth.uid(),'owner')` **and** `user_id <> auth.uid()`), public sign-up is disabled at the auth provider, and `handle_new_user()` assigns the non-staff `member` role to every new account after the first.
- **Supabase linter:** 2 warnings only, both the same accepted-by-design item — `has_role()` and `is_staff()` are SECURITY DEFINER and EXECUTE-granted to `authenticated` because RLS itself calls them. They are read-only, parameterized, return boolean, have `SET search_path = public`, and are revoked from `PUBLIC` and `anon`. Documented in the project security memory so future scans don't re-flag them.

### Recommendation
No code or database changes. Close the loop here. If you'd like, the next thing worth doing is a one-off SQL regression test that attempts a self-promotion `INSERT` into `user_roles` and asserts it fails — say the word and I'll add it.
