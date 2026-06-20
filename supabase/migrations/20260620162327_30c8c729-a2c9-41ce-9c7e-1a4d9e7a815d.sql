-- 1) Add a non-privileged role for new sign-ups
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';

-- Commit enum addition so it can be referenced below
COMMIT;
BEGIN;

-- 2) Change default role for new users from admin to member
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count INT;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT count(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'owner';
  ELSE
    assigned_role := 'member';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 3) Restrict writes on user_roles to owners only
DROP POLICY IF EXISTS "owners manage roles" ON public.user_roles;
CREATE POLICY "owners manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- 4) Tighten avatars SELECT policy: own files or staff only
DROP POLICY IF EXISTS "auth read avatars" ON storage.objects;
CREATE POLICY "user or staff read avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.is_staff(auth.uid())
  )
);

-- 5) Revoke EXECUTE on SECURITY DEFINER helper functions from authenticated.
-- Trigger-attached functions (handle_new_user, handle_opportunity_won) still run
-- as the trigger owner regardless of caller EXECUTE rights.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_opportunity_won() FROM PUBLIC, anon, authenticated;
-- has_role / is_staff are referenced inside RLS policies; RLS evaluates as the
-- table owner so policy use still works after revoking direct EXECUTE.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;

COMMIT;
BEGIN;