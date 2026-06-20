-- Drop the broad ALL policy and replace with explicit per-command policies.
DROP POLICY IF EXISTS "owners manage roles" ON public.user_roles;

-- Only owners can grant a role, and never to themselves (no self-escalation).
CREATE POLICY "owners insert roles for others"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  AND user_id <> auth.uid()
);

-- Only owners can modify a role row, and never their own row.
CREATE POLICY "owners update roles for others"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  AND user_id <> auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  AND user_id <> auth.uid()
);

-- Only owners can revoke a role, and never their own row.
CREATE POLICY "owners delete roles for others"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  AND user_id <> auth.uid()
);