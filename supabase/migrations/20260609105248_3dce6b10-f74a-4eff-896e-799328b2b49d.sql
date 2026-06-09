
CREATE POLICY "Users read own interview audio" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'interview-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own interview audio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'interview-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own interview audio" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'interview-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
