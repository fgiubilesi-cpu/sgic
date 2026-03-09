-- RLS Policies for Client Read-Only Access (Fase 2)
-- Enable role-based access control for client users

-- Drop existing audit policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view audits from their organization" ON audits;
DROP POLICY IF EXISTS "Users can create audits" ON audits;
DROP POLICY IF EXISTS "audits_insert_policy" ON audits;

-- Ensure RLS is enabled on audits
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Policy for inspector/admin: see all audits in their organization
CREATE POLICY "inspectors_see_org_audits" ON audits FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  );

-- Policy for clients: see only audits for their client
CREATE POLICY "clients_see_own_audits" ON audits FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role = 'client'
      AND client_id IS NOT NULL
    )
  );

-- Policy for inspectors/admins to create audits
CREATE POLICY "inspectors_create_audits" ON audits FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  );

-- Policy for inspectors/admins to update audits
CREATE POLICY "inspectors_update_audits" ON audits FOR UPDATE
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

-- Similar policies for checklist_items
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Drop existing checklist_items policies if they exist
DROP POLICY IF EXISTS "Users can view checklist items from their organization" ON checklist_items;
DROP POLICY IF EXISTS "Users can insert checklist items" ON checklist_items;

-- Inspectors can see checklist items from their organization
CREATE POLICY "inspectors_see_checklist_items" ON checklist_items FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  );

-- Clients can see checklist items from their own client's audits
CREATE POLICY "clients_see_own_checklist_items" ON checklist_items FOR SELECT
  USING (
    checklist_id IN (
      SELECT checklists.id FROM checklists
      JOIN audits ON checklists.audit_id = audits.id
      WHERE audits.client_id IN (
        SELECT client_id FROM profiles
        WHERE id = (select auth.uid()::uuid)
        AND role = 'client'
        AND client_id IS NOT NULL
      )
    )
  );

-- Inspectors can create checklist items
CREATE POLICY "inspectors_create_checklist_items" ON checklist_items FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  );

-- Inspectors can update checklist items
CREATE POLICY "inspectors_update_checklist_items" ON checklist_items FOR UPDATE
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

-- Similar policies for non_conformities
ALTER TABLE non_conformities ENABLE ROW LEVEL SECURITY;

-- Inspectors can see all NCs from their organization
CREATE POLICY "inspectors_see_nc" ON non_conformities FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  );

-- Clients can see NCs from their own client's audits
CREATE POLICY "clients_see_own_nc" ON non_conformities FOR SELECT
  USING (
    audit_id IN (
      SELECT audits.id FROM audits
      WHERE audits.client_id IN (
        SELECT client_id FROM profiles
        WHERE id = (select auth.uid()::uuid)
        AND role = 'client'
        AND client_id IS NOT NULL
      )
    )
  );

-- Inspectors can manage NCs
CREATE POLICY "inspectors_manage_nc" ON non_conformities FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('inspector', 'admin')
    )
  );

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
