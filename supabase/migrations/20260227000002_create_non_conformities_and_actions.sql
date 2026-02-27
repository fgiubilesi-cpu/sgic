-- Non-Conformities & Corrective Actions Schema
-- Extends the audit schema to track issues found during audits and remediation plans

-- ===== NON-CONFORMITIES (Issues found during audit) =====
CREATE TABLE IF NOT EXISTS public.non_conformities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'major'
    CHECK (severity IN ('minor', 'major', 'critical')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'closed', 'on_hold')),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_non_conformities_audit ON public.non_conformities(audit_id);
CREATE INDEX idx_non_conformities_item ON public.non_conformities(checklist_item_id);
CREATE INDEX idx_non_conformities_org ON public.non_conformities(organization_id);
CREATE INDEX idx_non_conformities_status ON public.non_conformities(status);

COMMENT ON TABLE public.non_conformities IS
  'Records of non-conformities (issues) identified during audits. Each NC is tied to a specific checklist item outcome.';
COMMENT ON COLUMN public.non_conformities.severity IS
  'Severity level: minor (observation), major (must fix), critical (blocks audit completion).';
COMMENT ON COLUMN public.non_conformities.status IS
  'NC lifecycle: open → in_progress → closed. on_hold for suspended remediation.';

-- ===== CORRECTIVE ACTIONS (Remediation plans for non-conformities) =====
CREATE TABLE IF NOT EXISTS public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  non_conformity_id UUID NOT NULL REFERENCES public.non_conformities(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  root_cause TEXT,
  action_plan TEXT,
  responsible_person_name TEXT,
  responsible_person_email TEXT,
  target_completion_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_corrective_actions_nc ON public.corrective_actions(non_conformity_id);
CREATE INDEX idx_corrective_actions_org ON public.corrective_actions(organization_id);
CREATE INDEX idx_corrective_actions_status ON public.corrective_actions(status);
CREATE INDEX idx_corrective_actions_target_date ON public.corrective_actions(target_completion_date);

COMMENT ON TABLE public.corrective_actions IS
  'Remediation plans and action items linked to non-conformities. Tracks responsibility and completion.';
COMMENT ON COLUMN public.corrective_actions.root_cause IS
  'AI-generated or manual root cause analysis. Basis for the corrective action.';
COMMENT ON COLUMN public.corrective_actions.action_plan IS
  'Step-by-step remediation plan. Can be AI-generated or manually defined.';

-- ===== ACTION EVIDENCE (Attachments proving action completion) =====
CREATE TABLE IF NOT EXISTS public.action_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corrective_action_id UUID NOT NULL REFERENCES public.corrective_actions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_action_evidence_action ON public.action_evidence(corrective_action_id);
CREATE INDEX idx_action_evidence_org ON public.action_evidence(organization_id);

COMMENT ON TABLE public.action_evidence IS
  'Supporting evidence (documents, photos) uploaded to prove corrective action completion.';

-- ===== ROW-LEVEL SECURITY (Multi-tenant isolation) =====

ALTER TABLE public.non_conformities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_evidence ENABLE ROW LEVEL SECURITY;

-- RLS: Non-Conformities
CREATE POLICY non_conformities_select_policy ON public.non_conformities
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY non_conformities_insert_policy ON public.non_conformities
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY non_conformities_update_policy ON public.non_conformities
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS: Corrective Actions
CREATE POLICY corrective_actions_select_policy ON public.corrective_actions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY corrective_actions_insert_policy ON public.corrective_actions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY corrective_actions_update_policy ON public.corrective_actions
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS: Action Evidence
CREATE POLICY action_evidence_select_policy ON public.action_evidence
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY action_evidence_insert_policy ON public.action_evidence
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY action_evidence_delete_policy ON public.action_evidence
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );
