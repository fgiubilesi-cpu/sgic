-- Add is_platform_owner to organizations
ALTER TABLE organizations
ADD COLUMN is_platform_owner boolean DEFAULT false;

-- Create clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  vat_number text,
  email text,
  phone text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create locations table
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  type text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add client_id to profiles (for future Phase 2 client users)
ALTER TABLE profiles
ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

-- Add foreign keys to audits
ALTER TABLE audits
ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- Enable RLS on clients and locations
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients table
-- Admin/auditor: full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "clients_admin_all"
  ON clients
  FOR ALL
  USING (
    auth.uid()::uuid IN (
      SELECT user_id FROM profiles
      WHERE organization_id = clients.organization_id
      AND role IN ('admin', 'auditor')
    )
  )
  WITH CHECK (
    auth.uid()::uuid IN (
      SELECT user_id FROM profiles
      WHERE organization_id = clients.organization_id
      AND role IN ('admin', 'auditor')
    )
  );

-- Client users: read-only access to their own client
CREATE POLICY "clients_user_select"
  ON clients
  FOR SELECT
  USING (
    id IN (
      SELECT client_id FROM profiles
      WHERE user_id = auth.uid()::uuid
    )
  );

-- RLS policies for locations table
-- Admin/auditor: full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "locations_admin_all"
  ON locations
  FOR ALL
  USING (
    auth.uid()::uuid IN (
      SELECT user_id FROM profiles
      WHERE organization_id = locations.organization_id
      AND role IN ('admin', 'auditor')
    )
  )
  WITH CHECK (
    auth.uid()::uuid IN (
      SELECT user_id FROM profiles
      WHERE organization_id = locations.organization_id
      AND role IN ('admin', 'auditor')
    )
  );

-- Client users: read-only access to locations of their own client
CREATE POLICY "locations_user_select"
  ON locations
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM profiles
      WHERE user_id = auth.uid()::uuid
    )
  );

-- ===== UPDATED_AT TRIGGERS =====
-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for clients table
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for locations table
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
