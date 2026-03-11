-- Fix recursive RLS policy on profiles
-- The previous SELECT policy queried `profiles` from inside `profiles`,
-- which triggers infinite recursion when other policies depend on profiles.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_read_own ON public.profiles;

CREATE POLICY profiles_read_own
ON public.profiles
FOR SELECT
USING (
  id = (select auth.uid()::uuid)
);

NOTIFY pgrst, 'reload schema';
