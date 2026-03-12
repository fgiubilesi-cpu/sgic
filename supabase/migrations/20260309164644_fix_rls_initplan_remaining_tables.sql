
-- audits
DROP POLICY IF EXISTS "Users can view organization audits" ON audits;
DROP POLICY IF EXISTS "audits_delete_policy" ON audits;
DROP POLICY IF EXISTS "audits_insert_policy" ON audits;
DROP POLICY IF EXISTS "audits_update_policy" ON audits;

CREATE POLICY "audits_select" ON audits FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));
CREATE POLICY "audits_insert" ON audits FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));
CREATE POLICY "audits_update" ON audits FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));
CREATE POLICY "audits_delete" ON audits FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- checklists
DROP POLICY IF EXISTS "checklists_admin_all" ON checklists;
CREATE POLICY "checklists_all" ON checklists FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- checklist_items
DROP POLICY IF EXISTS "checklist_items_admin_all" ON checklist_items;
CREATE POLICY "checklist_items_all" ON checklist_items FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- checklist_templates
DROP POLICY IF EXISTS "Templates visibili per org" ON checklist_templates;
CREATE POLICY "checklist_templates_all" ON checklist_templates FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- non_conformities
DROP POLICY IF EXISTS "non_conformities_select_own_org" ON non_conformities;
DROP POLICY IF EXISTS "non_conformities_insert_own_org" ON non_conformities;
DROP POLICY IF EXISTS "non_conformities_update_own_org" ON non_conformities;
DROP POLICY IF EXISTS "non_conformities_delete_own_org" ON non_conformities;
CREATE POLICY "non_conformities_all" ON non_conformities FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- clients
DROP POLICY IF EXISTS "clients_admin_all" ON clients;
CREATE POLICY "clients_all" ON clients FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- locations
DROP POLICY IF EXISTS "locations_admin_all" ON locations;
CREATE POLICY "locations_all" ON locations FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- documents
DROP POLICY IF EXISTS "documents_select_organization" ON documents;
DROP POLICY IF EXISTS "documents_insert_organization" ON documents;
DROP POLICY IF EXISTS "documents_update_organization" ON documents;
DROP POLICY IF EXISTS "documents_delete_organization" ON documents;
CREATE POLICY "documents_all" ON documents FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- risks
DROP POLICY IF EXISTS "risks_select_organization" ON risks;
DROP POLICY IF EXISTS "risks_insert_organization" ON risks;
DROP POLICY IF EXISTS "risks_update_organization" ON risks;
DROP POLICY IF EXISTS "risks_delete_organization" ON risks;
CREATE POLICY "risks_all" ON risks FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- audit_logs
DROP POLICY IF EXISTS "Users can view audit logs for their organization" ON audit_logs;
CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- audit_trail
DROP POLICY IF EXISTS "audit_trail_insert_policy" ON audit_trail;
CREATE POLICY "audit_trail_all" ON audit_trail FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- samplings
DROP POLICY IF EXISTS "Tenant isolation for samplings" ON samplings;
CREATE POLICY "samplings_all" ON samplings FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

-- lab_results
DROP POLICY IF EXISTS "Tenant isolation for lab_results" ON lab_results;
CREATE POLICY "lab_results_all" ON lab_results FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)));

NOTIFY pgrst, 'reload schema';
;
