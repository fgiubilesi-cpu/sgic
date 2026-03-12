
-- ============================================================
-- 1. FIX auth_rls_initplan — organizations
-- ============================================================
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;

CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)
  ));

CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (id IN (
    SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)
  ))
  WITH CHECK (id IN (
    SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)
  ));

-- ============================================================
-- 2. FIX auth_rls_initplan — profiles
-- ============================================================
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;

CREATE POLICY "profiles_read_own" ON profiles FOR SELECT
  USING (id = (SELECT auth.uid()::uuid)
    OR organization_id IN (
      SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)
    )
  );

-- ============================================================
-- 3. FIX multiple_permissive_policies — checklists (rimuovi vecchia policy ridondante)
-- ============================================================
DROP POLICY IF EXISTS "Users can view checklists of own org" ON checklists;
-- Rimane solo checklists_admin_all che copre già tutto

-- ============================================================
-- 4. FIX multiple_permissive_policies — clients (rimuovi ridondante)
-- ============================================================
DROP POLICY IF EXISTS "clients_user_select" ON clients;
-- Rimane solo clients_admin_all

-- ============================================================
-- 5. FIX multiple_permissive_policies — locations (rimuovi ridondante)
-- ============================================================
DROP POLICY IF EXISTS "locations_user_select" ON locations;
-- Rimane solo locations_admin_all

-- ============================================================
-- 6. FIX multiple_permissive_policies — documents (drop duplicate policies)
-- ============================================================
DROP POLICY IF EXISTS "documents_delete_policy" ON documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON documents;
DROP POLICY IF EXISTS "documents_access_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
-- Rimangono: documents_select_organization, documents_insert_organization, etc.

-- ============================================================
-- 7. FIX multiple_permissive_policies — risks (drop duplicate policies)
-- ============================================================
DROP POLICY IF EXISTS "risks_delete_policy" ON risks;
DROP POLICY IF EXISTS "risks_insert_policy" ON risks;
DROP POLICY IF EXISTS "risks_access_policy" ON risks;
DROP POLICY IF EXISTS "risks_update_policy" ON risks;
-- Rimangono: risks_select_organization, risks_insert_organization, etc.

-- ============================================================
-- 8. FIX duplicate_index — action_evidence
-- ============================================================
DROP INDEX IF EXISTS idx_action_evidence_action;
-- Rimane idx_action_evidence_corrective_action_id

-- ============================================================
-- 9. FIX unindexed_foreign_keys — tabelle critiche (audits, profiles, locations, clients)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_audits_auditor_id ON audits(auditor_id);
CREATE INDEX IF NOT EXISTS idx_audits_template_id ON audits(template_id);
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_client_id ON locations(client_id);
CREATE INDEX IF NOT EXISTS idx_locations_organization_id ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_template_questions_template_id ON template_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_organization_id ON checklist_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_trail_changed_by ON audit_trail(changed_by);

NOTIFY pgrst, 'reload schema';
;
