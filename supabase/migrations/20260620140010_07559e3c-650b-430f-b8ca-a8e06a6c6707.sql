DROP POLICY IF EXISTS "auth read profiles" ON public.profiles;
CREATE POLICY "users read own profile or staff reads all"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "auth read roles" ON public.user_roles;
CREATE POLICY "users read own roles or staff reads all"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_staff(auth.uid()));