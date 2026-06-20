-- Drop the existing avatars policies so we can replace them with a tighter set.
DROP POLICY IF EXISTS "user or staff read avatars" ON storage.objects;
DROP POLICY IF EXISTS "user write own avatar" ON storage.objects;
DROP POLICY IF EXISTS "user update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "user delete own avatar" ON storage.objects;

-- SELECT: own folder, or staff (owner/admin).
CREATE POLICY "avatars read own or staff"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_staff(auth.uid())
  )
);

-- INSERT: user uploads into their own folder, or staff uploads anywhere in the bucket.
CREATE POLICY "avatars insert own or staff"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_staff(auth.uid())
  )
);

-- UPDATE: must own (or be staff) on both the existing row AND the new row,
-- so a user can't rename a file out of their folder.
CREATE POLICY "avatars update own or staff"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_staff(auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_staff(auth.uid())
  )
);

-- DELETE: own folder, or staff.
CREATE POLICY "avatars delete own or staff"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_staff(auth.uid())
  )
);