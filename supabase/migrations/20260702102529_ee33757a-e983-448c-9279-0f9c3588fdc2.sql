DROP POLICY IF EXISTS "anyone can submit feedback" ON public.feedback;
CREATE POLICY "anyone can submit feedback"
  ON public.feedback FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(subject) between 1 and 200
    AND length(message) between 5 and 5000
    AND (user_id IS NULL OR user_id = auth.uid())
  );