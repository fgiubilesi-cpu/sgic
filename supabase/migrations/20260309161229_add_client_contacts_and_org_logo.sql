
-- Colonna logo_url su organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url text;

-- Tabella contatti cliente (anagrafici, senza Auth per ora)
CREATE TABLE IF NOT EXISTS client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  role text,
  notes text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_contacts_all" ON client_contacts FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = (SELECT auth.uid()::uuid)
  ));

-- Trigger updated_at
CREATE TRIGGER update_client_contacts_updated_at
  BEFORE UPDATE ON client_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_org_id ON client_contacts(organization_id);

NOTIFY pgrst, 'reload schema';
;
