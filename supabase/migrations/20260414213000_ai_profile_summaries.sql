CREATE TABLE IF NOT EXISTS public.ai_profile_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('cuidador', 'responsavel')),
  summary_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  bridge_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  readiness_score integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.ai_profile_summaries ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read summaries (bridge data is profile-level info used for matching)
CREATE POLICY "AI summaries readable by authenticated users"
ON public.ai_profile_summaries
FOR SELECT
TO authenticated
USING (true);

-- Only the owner can insert their own summary
CREATE POLICY "Users insert their own AI summary"
ON public.ai_profile_summaries
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Only the owner can update their own summary
CREATE POLICY "Users update their own AI summary"
ON public.ai_profile_summaries
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Only the owner can delete their own summary
CREATE POLICY "Users delete their own AI summary"
ON public.ai_profile_summaries
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
