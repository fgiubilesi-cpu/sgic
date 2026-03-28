ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

COMMENT ON COLUMN public.clients.deleted_at IS
  'Soft delete timestamp for archived clients. NULL means the client is active.';

CREATE INDEX IF NOT EXISTS idx_clients_org_deleted_name
  ON public.clients (organization_id, deleted_at, name);

NOTIFY pgrst, 'reload schema';
