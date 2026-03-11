-- Extend documents so they can be attached to clients, locations and personnel
-- and tracked with issue / expiry dates inside the client hub.

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS personnel_id uuid REFERENCES public.personnel(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS issue_date date,
ADD COLUMN IF NOT EXISTS expiry_date date;

CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_location_id ON public.documents(location_id);
CREATE INDEX IF NOT EXISTS idx_documents_personnel_id ON public.documents(personnel_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON public.documents(expiry_date);

COMMENT ON COLUMN public.documents.client_id IS
  'Optional link to a client. Used for customer-level documents and policies.';
COMMENT ON COLUMN public.documents.location_id IS
  'Optional link to a location. Used for site-specific procedures and certificates.';
COMMENT ON COLUMN public.documents.personnel_id IS
  'Optional link to a personnel record. Used for personal certificates or employee documents.';
COMMENT ON COLUMN public.documents.issue_date IS
  'Document issue / effective date.';
COMMENT ON COLUMN public.documents.expiry_date IS
  'Optional expiry date used for renewal tracking.';
