
-- Fix RLS policies for corrective_actions
-- Problem: existing policies use get_user_organization_id() which reads from JWT
-- and returns NULL because organization_id is not in the Supabase JWT by default.
-- Fix: replace with standard pattern using profiles table lookup.

DROP POLICY IF EXISTS "corrective_actions_select_own_org" ON corrective_actions;
DROP POLICY IF EXISTS "corrective_actions_insert_own_org" ON corrective_actions;
DROP POLICY IF EXISTS "corrective_actions_update_own_org" ON corrective_actions;
DROP POLICY IF EXISTS "corrective_actions_delete_own_org" ON corrective_actions;

CREATE POLICY "corrective_actions_select_own_org" ON corrective_actions
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = (select auth.uid()::uuid)
  ));

CREATE POLICY "corrective_actions_insert_own_org" ON corrective_actions
  FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = (select auth.uid()::uuid)
  ));

CREATE POLICY "corrective_actions_update_own_org" ON corrective_actions
  FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = (select auth.uid()::uuid)
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = (select auth.uid()::uuid)
  ));

CREATE POLICY "corrective_actions_delete_own_org" ON corrective_actions
  FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = (select auth.uid()::uuid)
  ));

NOTIFY pgrst, 'reload schema';
;
