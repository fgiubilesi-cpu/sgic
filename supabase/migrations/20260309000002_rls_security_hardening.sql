-- RLS Security Hardening + Indices
-- DB2: Enable RLS on exposed tables
-- DB3: Add policies to action_evidence
-- DB4: Fix RLS performance (replace auth.uid() with subquery)
-- DB5: Remove duplicate INSERT policies
-- DB6: Add missing foreign key indices

--- ═══════════════════════════════════════════════════════════════════════
--- DB2: Enable RLS on exposed tables (documents, risks, training, personnel)
--- ═══════════════════════════════════════════════════════════════════════

-- Documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_access_policy" ON documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
CREATE POLICY "documents_access_policy" ON documents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
    )
  );
CREATE POLICY "documents_insert_policy" ON documents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  );
CREATE POLICY "documents_update_policy" ON documents FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  );

-- Risks table
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "risks_access_policy" ON risks;
DROP POLICY IF EXISTS "risks_insert_policy" ON risks;
CREATE POLICY "risks_access_policy" ON risks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
    )
  );
CREATE POLICY "risks_insert_policy" ON risks FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  );

-- Personnel table
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "personnel_access_policy" ON personnel;
DROP POLICY IF EXISTS "personnel_insert_policy" ON personnel;
CREATE POLICY "personnel_access_policy" ON personnel FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
    )
  );
CREATE POLICY "personnel_insert_policy" ON personnel FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  );

-- Training courses table
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "training_courses_access_policy" ON training_courses;
CREATE POLICY "training_courses_access_policy" ON training_courses FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
    )
  );

-- Training records table
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "training_records_access_policy" ON training_records;
CREATE POLICY "training_records_access_policy" ON training_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
    )
  );

-- Document versions table
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "document_versions_access_policy" ON document_versions;
CREATE POLICY "document_versions_access_policy" ON document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
      AND documents.organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = (select auth.uid()::uuid)
      )
    )
  );

--- ═══════════════════════════════════════════════════════════════════════
--- DB3: Add policies to action_evidence (RLS enabled but no policies)
--- ═══════════════════════════════════════════════════════════════════════

-- action_evidence policies
DROP POLICY IF EXISTS "action_evidence_access_policy" ON action_evidence;
DROP POLICY IF EXISTS "action_evidence_insert_policy" ON action_evidence;
CREATE POLICY "action_evidence_access_policy" ON action_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM corrective_actions
      WHERE corrective_actions.id = action_evidence.corrective_action_id
      AND corrective_actions.organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = (select auth.uid()::uuid)
      )
    )
  );

CREATE POLICY "action_evidence_insert_policy" ON action_evidence FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM corrective_actions
      WHERE corrective_actions.id = action_evidence.corrective_action_id
      AND corrective_actions.organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = (select auth.uid()::uuid)
        AND role IN ('inspector', 'admin')
      )
    )
  );

--- ═══════════════════════════════════════════════════════════════════════
--- DB4: Fix RLS performance - already done in 20260309000001
--- (All policies use (select auth.uid()::uuid) pattern)
--- This comment is for documentation.
--- ═══════════════════════════════════════════════════════════════════════

--- ═══════════════════════════════════════════════════════════════════════
--- DB5: Remove duplicate INSERT policies on audits
--- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can create audits" ON audits;
-- Keep only: inspectors_create_audits

--- ═══════════════════════════════════════════════════════════════════════
--- DB6: Add missing foreign key indices
--- ═══════════════════════════════════════════════════════════════════════

-- Audits table indices (organization_id, client_id, location_id)
CREATE INDEX IF NOT EXISTS idx_audits_organization_id ON audits(organization_id);
CREATE INDEX IF NOT EXISTS idx_audits_client_id ON audits(client_id);
CREATE INDEX IF NOT EXISTS idx_audits_location_id ON audits(location_id);

-- Checklist items indices (checklist_id, organization_id, audit_id)
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_id ON checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_organization_id ON checklist_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_audit_id ON checklist_items(audit_id);

-- Non conformities indices (audit_id, organization_id, checklist_item_id)
CREATE INDEX IF NOT EXISTS idx_non_conformities_audit_id ON non_conformities(audit_id);
CREATE INDEX IF NOT EXISTS idx_non_conformities_organization_id ON non_conformities(organization_id);
CREATE INDEX IF NOT EXISTS idx_non_conformities_checklist_item_id ON non_conformities(checklist_item_id);

-- Corrective actions indices (non_conformity_id, organization_id)
CREATE INDEX IF NOT EXISTS idx_corrective_actions_non_conformity_id ON corrective_actions(non_conformity_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_organization_id ON corrective_actions(organization_id);

-- Checklists indices (audit_id, organization_id)
CREATE INDEX IF NOT EXISTS idx_checklists_audit_id ON checklists(audit_id);
CREATE INDEX IF NOT EXISTS idx_checklists_organization_id ON checklists(organization_id);

-- Action evidence indices
CREATE INDEX IF NOT EXISTS idx_action_evidence_corrective_action_id ON action_evidence(corrective_action_id);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
