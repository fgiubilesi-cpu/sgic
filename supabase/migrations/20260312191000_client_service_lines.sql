CREATE TABLE IF NOT EXISTS public.client_service_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  source_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  code text,
  title text NOT NULL,
  section text,
  billing_phase text,
  frequency_label text,
  quantity integer,
  unit text,
  unit_price numeric(12,2),
  total_price numeric(12,2),
  is_recurring boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_service_lines_org_id ON public.client_service_lines(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_service_lines_client_id ON public.client_service_lines(client_id);
CREATE INDEX IF NOT EXISTS idx_client_service_lines_source_document_id ON public.client_service_lines(source_document_id);
CREATE INDEX IF NOT EXISTS idx_client_service_lines_sort_order ON public.client_service_lines(client_id, sort_order);

ALTER TABLE public.client_service_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_service_lines_read" ON public.client_service_lines;
DROP POLICY IF EXISTS "client_service_lines_manage" ON public.client_service_lines;

CREATE POLICY "client_service_lines_read" ON public.client_service_lines FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid()::uuid)
    )
  );

CREATE POLICY "client_service_lines_manage" ON public.client_service_lines FOR ALL
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

DROP TRIGGER IF EXISTS update_client_service_lines_updated_at ON public.client_service_lines;
CREATE TRIGGER update_client_service_lines_updated_at
  BEFORE UPDATE ON public.client_service_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';
