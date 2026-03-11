-- Link personnel records to clients and locations
-- Also add email/contact data required by the UI.

ALTER TABLE public.personnel
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_personnel_client_id ON public.personnel(client_id);
CREATE INDEX IF NOT EXISTS idx_personnel_location_id ON public.personnel(location_id);

-- Align client/location management policies with application roles.
DROP POLICY IF EXISTS "clients_admin_all" ON public.clients;
CREATE POLICY "clients_admin_all"
  ON public.clients
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
    )
  );

DROP POLICY IF EXISTS "locations_admin_all" ON public.locations;
CREATE POLICY "locations_admin_all"
  ON public.locations
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
    )
  );

-- Extend personnel policies so records can be maintained from the app.
DROP POLICY IF EXISTS "personnel_access_policy" ON public.personnel;
DROP POLICY IF EXISTS "personnel_insert_policy" ON public.personnel;
DROP POLICY IF EXISTS "personnel_update_policy" ON public.personnel;
DROP POLICY IF EXISTS "personnel_delete_policy" ON public.personnel;

CREATE POLICY "personnel_access_policy" ON public.personnel FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = (select auth.uid()::uuid)
    )
  );

CREATE POLICY "personnel_insert_policy" ON public.personnel FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
    )
  );

CREATE POLICY "personnel_update_policy" ON public.personnel FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
    )
  );

CREATE POLICY "personnel_delete_policy" ON public.personnel FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = (select auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
    )
  );

NOTIFY pgrst, 'reload schema';
