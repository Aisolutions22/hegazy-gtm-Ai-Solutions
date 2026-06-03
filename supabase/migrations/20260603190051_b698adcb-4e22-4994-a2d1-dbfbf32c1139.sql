
CREATE POLICY "staff read branding" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'branding' AND public.is_staff(auth.uid()));
CREATE POLICY "staff write branding" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding' AND public.is_staff(auth.uid()));
CREATE POLICY "staff update branding" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'branding' AND public.is_staff(auth.uid()));
CREATE POLICY "staff delete branding" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'branding' AND public.is_staff(auth.uid()));

CREATE POLICY "auth read avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "user write own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
