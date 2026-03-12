ALTER TABLE public.client_contracts
  ADD COLUMN IF NOT EXISTS protocol_code text,
  ADD COLUMN IF NOT EXISTS issue_date date,
  ADD COLUMN IF NOT EXISTS validity_terms text,
  ADD COLUMN IF NOT EXISTS duration_terms text,
  ADD COLUMN IF NOT EXISTS exercised_activity text,
  ADD COLUMN IF NOT EXISTS client_references text,
  ADD COLUMN IF NOT EXISTS supervisor_name text;
