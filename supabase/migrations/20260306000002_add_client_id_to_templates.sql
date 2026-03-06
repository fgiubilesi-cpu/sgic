-- Add client_id to checklist_templates to support per-client template clones
ALTER TABLE checklist_templates
ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE CASCADE;

-- Create index for filtering by client
CREATE INDEX idx_checklist_templates_client_id ON checklist_templates(client_id);
