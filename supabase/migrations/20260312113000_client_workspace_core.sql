-- Client Workspace core entities
-- M2-M4-M8-M9 foundation:
-- - client_contracts
-- - client_tasks
-- - client_contacts extensions
-- - client_deadlines
-- - client_notes
-- - document categories for contract/certificate/other

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'document_category'
      AND n.nspname = 'public'
  ) THEN
    BEGIN
      ALTER TYPE public.document_category ADD VALUE IF NOT EXISTS 'Contract';
      ALTER TYPE public.document_category ADD VALUE IF NOT EXISTS 'Certificate';
      ALTER TYPE public.document_category ADD VALUE IF NOT EXISTS 'Other';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.client_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  contract_type text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'active',
  start_date date,
  renewal_date date,
  end_date date,
  service_scope text,
  activity_frequency text,
  internal_owner text,
  notes text,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_contracts_status_check CHECK (status IN ('draft', 'active', 'paused', 'expired')),
  CONSTRAINT client_contracts_unique_client UNIQUE (client_id)
);

CREATE TABLE IF NOT EXISTS public.client_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  audit_id uuid REFERENCES public.audits(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  due_date date,
  owner_name text,
  owner_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_label text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_tasks_status_check CHECK (status IN ('open', 'in_progress', 'blocked', 'done')),
  CONSTRAINT client_tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

ALTER TABLE public.client_contacts
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.client_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  source_type text NOT NULL DEFAULT 'manual',
  source_id uuid,
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_deadlines_source_type_check CHECK (
    source_type IN ('manual', 'contract', 'task', 'document', 'audit')
  ),
  CONSTRAINT client_deadlines_status_check CHECK (status IN ('open', 'completed', 'cancelled')),
  CONSTRAINT client_deadlines_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

CREATE TABLE IF NOT EXISTS public.client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  note_type text NOT NULL DEFAULT 'operational',
  pinned boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_notes_note_type_check CHECK (
    note_type IN ('operational', 'warning', 'decision', 'info')
  )
);

CREATE INDEX IF NOT EXISTS idx_client_contracts_org_id ON public.client_contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_client_id ON public.client_contracts(client_id);

CREATE INDEX IF NOT EXISTS idx_client_tasks_org_id ON public.client_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_client_id ON public.client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status_due_date ON public.client_tasks(status, due_date);
CREATE INDEX IF NOT EXISTS idx_client_tasks_location_id ON public.client_tasks(location_id);

CREATE INDEX IF NOT EXISTS idx_client_contacts_location_id ON public.client_contacts(location_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_is_active ON public.client_contacts(is_active);

CREATE INDEX IF NOT EXISTS idx_client_deadlines_org_id ON public.client_deadlines(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_deadlines_client_id_due_date ON public.client_deadlines(client_id, due_date);
CREATE INDEX IF NOT EXISTS idx_client_deadlines_status ON public.client_deadlines(status);

CREATE INDEX IF NOT EXISTS idx_client_notes_org_id ON public.client_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id_created_at ON public.client_notes(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_notes_pinned ON public.client_notes(pinned);

ALTER TABLE public.client_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_contracts_read" ON public.client_contracts;
DROP POLICY IF EXISTS "client_contracts_manage" ON public.client_contracts;
CREATE POLICY "client_contracts_read" ON public.client_contracts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
    )
  );
CREATE POLICY "client_contracts_manage" ON public.client_contracts FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
        AND role IN ('admin', 'auditor', 'inspector')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
        AND role IN ('admin', 'auditor', 'inspector')
    )
  );

DROP POLICY IF EXISTS "client_tasks_read" ON public.client_tasks;
DROP POLICY IF EXISTS "client_tasks_manage" ON public.client_tasks;
CREATE POLICY "client_tasks_read" ON public.client_tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
    )
  );
CREATE POLICY "client_tasks_manage" ON public.client_tasks FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
        AND role IN ('admin', 'auditor', 'inspector')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
        AND role IN ('admin', 'auditor', 'inspector')
    )
  );

DROP POLICY IF EXISTS "client_deadlines_read" ON public.client_deadlines;
DROP POLICY IF EXISTS "client_deadlines_manage" ON public.client_deadlines;
CREATE POLICY "client_deadlines_read" ON public.client_deadlines FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
    )
  );
CREATE POLICY "client_deadlines_manage" ON public.client_deadlines FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
        AND role IN ('admin', 'auditor', 'inspector')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
        AND role IN ('admin', 'auditor', 'inspector')
    )
  );

DROP POLICY IF EXISTS "client_notes_read" ON public.client_notes;
DROP POLICY IF EXISTS "client_notes_manage" ON public.client_notes;
CREATE POLICY "client_notes_read" ON public.client_notes FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
    )
  );
CREATE POLICY "client_notes_manage" ON public.client_notes FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
        AND role IN ('admin', 'auditor', 'inspector')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
        AND role IN ('admin', 'auditor', 'inspector')
    )
  );

DROP TRIGGER IF EXISTS update_client_contracts_updated_at ON public.client_contracts;
CREATE TRIGGER update_client_contracts_updated_at
  BEFORE UPDATE ON public.client_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_tasks_updated_at ON public.client_tasks;
CREATE TRIGGER update_client_tasks_updated_at
  BEFORE UPDATE ON public.client_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_deadlines_updated_at ON public.client_deadlines;
CREATE TRIGGER update_client_deadlines_updated_at
  BEFORE UPDATE ON public.client_deadlines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_notes_updated_at ON public.client_notes;
CREATE TRIGGER update_client_notes_updated_at
  BEFORE UPDATE ON public.client_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';
