-- Migration: Strengthen RLS policies with explicit ::uuid cast
-- Replaces organization_id IN (SELECT ...) with organization_id = (SELECT ...::uuid)
-- Benefits:
--   1. Explicit ::uuid cast prevents implicit type coercion issues
--   2. = instead of IN is more efficient for single-row subqueries (profiles.id is unique)
--   3. Consistent pattern across all tables

-- ===== audit_logs =====
DROP POLICY IF EXISTS "Users can view audit logs for their organization" ON public.audit_logs;
CREATE POLICY "Users can view audit logs for their organization"
    ON public.audit_logs
    FOR SELECT
    USING (
        organization_id = (
            SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
        )
    );

-- ===== non_conformities =====
DROP POLICY IF EXISTS non_conformities_select_policy ON public.non_conformities;
DROP POLICY IF EXISTS non_conformities_insert_policy ON public.non_conformities;
DROP POLICY IF EXISTS non_conformities_update_policy ON public.non_conformities;

CREATE POLICY non_conformities_select_policy ON public.non_conformities
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY non_conformities_insert_policy ON public.non_conformities
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY non_conformities_update_policy ON public.non_conformities
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ===== corrective_actions =====
DROP POLICY IF EXISTS corrective_actions_select_policy ON public.corrective_actions;
DROP POLICY IF EXISTS corrective_actions_insert_policy ON public.corrective_actions;
DROP POLICY IF EXISTS corrective_actions_update_policy ON public.corrective_actions;

CREATE POLICY corrective_actions_select_policy ON public.corrective_actions
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY corrective_actions_insert_policy ON public.corrective_actions
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY corrective_actions_update_policy ON public.corrective_actions
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ===== action_evidence =====
DROP POLICY IF EXISTS action_evidence_select_policy ON public.action_evidence;
DROP POLICY IF EXISTS action_evidence_insert_policy ON public.action_evidence;
DROP POLICY IF EXISTS action_evidence_delete_policy ON public.action_evidence;

CREATE POLICY action_evidence_select_policy ON public.action_evidence
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY action_evidence_insert_policy ON public.action_evidence
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY action_evidence_delete_policy ON public.action_evidence
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ===== audit_trail =====
DROP POLICY IF EXISTS audit_trail_organization_access ON public.audit_trail;
DROP POLICY IF EXISTS audit_trail_insert ON public.audit_trail;

CREATE POLICY audit_trail_organization_access ON public.audit_trail
  FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY audit_trail_insert ON public.audit_trail
  FOR INSERT
  WITH CHECK (
    organization_id = (
      SELECT organization_id::uuid FROM public.profiles WHERE id = auth.uid()
    )
  );
