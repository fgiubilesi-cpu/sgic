-- FileMaker -> SGIC staging foundation for management dashboard

CREATE TABLE IF NOT EXISTS public.management_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_system text NOT NULL DEFAULT 'filemaker',
  sync_scope text NOT NULL DEFAULT 'direction',
  sync_mode text NOT NULL DEFAULT 'incremental',
  status text NOT NULL DEFAULT 'queued',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  records_read integer NOT NULL DEFAULT 0,
  records_written integer NOT NULL DEFAULT 0,
  records_skipped integer NOT NULL DEFAULT 0,
  error_summary text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT management_sync_runs_status_check CHECK (
    status IN ('queued', 'running', 'success', 'warning', 'failed')
  ),
  CONSTRAINT management_sync_runs_mode_check CHECK (
    sync_mode IN ('full', 'incremental', 'manual')
  )
);

CREATE TABLE IF NOT EXISTS public.management_clients_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sync_run_id uuid REFERENCES public.management_sync_runs(id) ON DELETE SET NULL,
  source_system text NOT NULL DEFAULT 'filemaker',
  source_record_id text NOT NULL,
  client_code text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  name text NOT NULL,
  vat_number text,
  status text,
  account_owner text,
  service_model text,
  active_locations_count integer,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT management_clients_staging_unique UNIQUE (
    organization_id,
    source_system,
    source_record_id
  )
);

CREATE TABLE IF NOT EXISTS public.management_service_lines_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sync_run_id uuid REFERENCES public.management_sync_runs(id) ON DELETE SET NULL,
  source_system text NOT NULL DEFAULT 'filemaker',
  source_record_id text NOT NULL,
  client_source_record_id text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  location_source_record_id text,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  service_code text,
  service_name text NOT NULL,
  service_area text,
  cadence text,
  status text,
  owner_name text,
  quantity numeric(12,2),
  annual_value numeric(12,2),
  start_date date,
  end_date date,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT management_service_lines_staging_unique UNIQUE (
    organization_id,
    source_system,
    source_record_id
  )
);

CREATE TABLE IF NOT EXISTS public.management_contracts_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sync_run_id uuid REFERENCES public.management_sync_runs(id) ON DELETE SET NULL,
  source_system text NOT NULL DEFAULT 'filemaker',
  source_record_id text NOT NULL,
  client_source_record_id text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  contract_code text,
  contract_type text,
  status text,
  owner_name text,
  annual_value numeric(12,2),
  issue_date date,
  start_date date,
  renewal_date date,
  end_date date,
  notes text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT management_contracts_staging_unique UNIQUE (
    organization_id,
    source_system,
    source_record_id
  )
);

CREATE TABLE IF NOT EXISTS public.management_deadlines_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sync_run_id uuid REFERENCES public.management_sync_runs(id) ON DELETE SET NULL,
  source_system text NOT NULL DEFAULT 'filemaker',
  source_record_id text NOT NULL,
  client_source_record_id text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  location_source_record_id text,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  deadline_type text,
  title text NOT NULL,
  status text,
  priority text,
  owner_name text,
  due_date date NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT management_deadlines_staging_unique UNIQUE (
    organization_id,
    source_system,
    source_record_id
  )
);

CREATE TABLE IF NOT EXISTS public.management_capacity_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sync_run_id uuid REFERENCES public.management_sync_runs(id) ON DELETE SET NULL,
  source_system text NOT NULL DEFAULT 'filemaker',
  source_record_id text NOT NULL,
  client_source_record_id text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  location_source_record_id text,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  service_line_source_record_id text,
  personnel_id uuid REFERENCES public.personnel(id) ON DELETE SET NULL,
  owner_name text,
  period_start date,
  period_end date,
  planned_hours numeric(10,2),
  planned_fte numeric(8,2),
  status text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT management_capacity_staging_unique UNIQUE (
    organization_id,
    source_system,
    source_record_id
  )
);

CREATE INDEX IF NOT EXISTS idx_management_sync_runs_org_started_at
  ON public.management_sync_runs(organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_management_sync_runs_status
  ON public.management_sync_runs(status);

CREATE INDEX IF NOT EXISTS idx_management_clients_staging_org_client
  ON public.management_clients_staging(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_management_clients_staging_source
  ON public.management_clients_staging(organization_id, source_system, source_record_id);

CREATE INDEX IF NOT EXISTS idx_management_service_lines_staging_org_client
  ON public.management_service_lines_staging(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_management_service_lines_staging_org_area
  ON public.management_service_lines_staging(organization_id, service_area);

CREATE INDEX IF NOT EXISTS idx_management_contracts_staging_org_client
  ON public.management_contracts_staging(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_management_contracts_staging_dates
  ON public.management_contracts_staging(organization_id, renewal_date, end_date);

CREATE INDEX IF NOT EXISTS idx_management_deadlines_staging_org_due_date
  ON public.management_deadlines_staging(organization_id, due_date);
CREATE INDEX IF NOT EXISTS idx_management_deadlines_staging_org_client
  ON public.management_deadlines_staging(organization_id, client_id);

CREATE INDEX IF NOT EXISTS idx_management_capacity_staging_org_period
  ON public.management_capacity_staging(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_management_capacity_staging_org_client
  ON public.management_capacity_staging(organization_id, client_id);

ALTER TABLE public.management_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_clients_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_service_lines_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_contracts_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_deadlines_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_capacity_staging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "management_sync_runs_read" ON public.management_sync_runs;
CREATE POLICY "management_sync_runs_read" ON public.management_sync_runs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
    )
  );

DROP POLICY IF EXISTS "management_sync_runs_manage" ON public.management_sync_runs;
CREATE POLICY "management_sync_runs_manage" ON public.management_sync_runs FOR ALL
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

DROP POLICY IF EXISTS "management_clients_staging_read" ON public.management_clients_staging;
CREATE POLICY "management_clients_staging_read" ON public.management_clients_staging FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
    )
  );

DROP POLICY IF EXISTS "management_clients_staging_manage" ON public.management_clients_staging;
CREATE POLICY "management_clients_staging_manage" ON public.management_clients_staging FOR ALL
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

DROP POLICY IF EXISTS "management_service_lines_staging_read" ON public.management_service_lines_staging;
CREATE POLICY "management_service_lines_staging_read" ON public.management_service_lines_staging FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
    )
  );

DROP POLICY IF EXISTS "management_service_lines_staging_manage" ON public.management_service_lines_staging;
CREATE POLICY "management_service_lines_staging_manage" ON public.management_service_lines_staging FOR ALL
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

DROP POLICY IF EXISTS "management_contracts_staging_read" ON public.management_contracts_staging;
CREATE POLICY "management_contracts_staging_read" ON public.management_contracts_staging FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
    )
  );

DROP POLICY IF EXISTS "management_contracts_staging_manage" ON public.management_contracts_staging;
CREATE POLICY "management_contracts_staging_manage" ON public.management_contracts_staging FOR ALL
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

DROP POLICY IF EXISTS "management_deadlines_staging_read" ON public.management_deadlines_staging;
CREATE POLICY "management_deadlines_staging_read" ON public.management_deadlines_staging FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
    )
  );

DROP POLICY IF EXISTS "management_deadlines_staging_manage" ON public.management_deadlines_staging;
CREATE POLICY "management_deadlines_staging_manage" ON public.management_deadlines_staging FOR ALL
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

DROP POLICY IF EXISTS "management_capacity_staging_read" ON public.management_capacity_staging;
CREATE POLICY "management_capacity_staging_read" ON public.management_capacity_staging FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
    )
  );

DROP POLICY IF EXISTS "management_capacity_staging_manage" ON public.management_capacity_staging;
CREATE POLICY "management_capacity_staging_manage" ON public.management_capacity_staging FOR ALL
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

DROP TRIGGER IF EXISTS update_management_clients_staging_updated_at ON public.management_clients_staging;
CREATE TRIGGER update_management_clients_staging_updated_at
  BEFORE UPDATE ON public.management_clients_staging
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_management_service_lines_staging_updated_at ON public.management_service_lines_staging;
CREATE TRIGGER update_management_service_lines_staging_updated_at
  BEFORE UPDATE ON public.management_service_lines_staging
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_management_contracts_staging_updated_at ON public.management_contracts_staging;
CREATE TRIGGER update_management_contracts_staging_updated_at
  BEFORE UPDATE ON public.management_contracts_staging
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_management_deadlines_staging_updated_at ON public.management_deadlines_staging;
CREATE TRIGGER update_management_deadlines_staging_updated_at
  BEFORE UPDATE ON public.management_deadlines_staging
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_management_capacity_staging_updated_at ON public.management_capacity_staging;
CREATE TRIGGER update_management_capacity_staging_updated_at
  BEFORE UPDATE ON public.management_capacity_staging
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
