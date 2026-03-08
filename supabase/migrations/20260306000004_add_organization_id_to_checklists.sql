-- Add organization_id column to checklists table
-- This ensures every checklist has a reference to its organization (required by CLAUDE.md)

ALTER TABLE checklists
ADD COLUMN organization_id uuid NOT NULL DEFAULT (SELECT id FROM organizations WHERE is_platform_owner = true LIMIT 1);

-- Add foreign key constraint
ALTER TABLE checklists
ADD CONSTRAINT checklists_organization_id_fk
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_checklists_organization_id ON checklists(organization_id);

-- Remove default constraint since we want explicit values going forward
ALTER TABLE checklists
ALTER COLUMN organization_id DROP DEFAULT;
