
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Storage policies on storage.objects for the avatars bucket
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_staff_insert" ON storage.objects;
CREATE POLICY "avatars_staff_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "avatars_staff_update" ON storage.objects;
CREATE POLICY "avatars_staff_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'avatars' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "avatars_staff_delete" ON storage.objects;
CREATE POLICY "avatars_staff_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND public.is_staff(auth.uid()));
