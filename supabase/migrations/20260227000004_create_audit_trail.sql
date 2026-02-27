-- Create Audit Trail Table
-- Tracks all audit status changes for history and evidence

CREATE TABLE IF NOT EXISTS public.audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL CHECK (new_status IN ('Scheduled', 'In Progress', 'Review', 'Closed')),
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups by audit_id
CREATE INDEX IF NOT EXISTS idx_audit_trail_audit_id ON public.audit_trail(audit_id);

-- Create index for faster lookups by organization_id
CREATE INDEX IF NOT EXISTS idx_audit_trail_organization_id ON public.audit_trail(organization_id);

-- Create index for faster lookups by changed_at (for history sorting)
CREATE INDEX IF NOT EXISTS idx_audit_trail_changed_at ON public.audit_trail(changed_at DESC);

-- Add column comment
COMMENT ON COLUMN public.audit_trail.old_status IS
  'Previous audit status. NULL for initial creation.';

COMMENT ON COLUMN public.audit_trail.new_status IS
  'New audit status after this change.';

COMMENT ON COLUMN public.audit_trail.changed_by IS
  'User ID who made the change.';

-- Enable RLS on audit_trail
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see audit trail entries for their organization
CREATE POLICY audit_trail_organization_access ON public.audit_trail
  FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS Policy: Only authenticated users can insert audit trail entries (via application)
CREATE POLICY audit_trail_insert ON public.audit_trail
  FOR INSERT
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );
