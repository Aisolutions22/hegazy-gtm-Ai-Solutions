-- Restore EXECUTE on role-check helpers to the authenticated role.
-- RLS policies on staff-gated tables call is_staff(auth.uid()) / has_role(auth.uid(), ...).
-- PostgREST runs queries as the `authenticated` role; without EXECUTE, the
-- policy evaluation fails and PostgREST returns empty result sets.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

-- Keep these revoked from PUBLIC and anon to avoid unauthenticated probing.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;