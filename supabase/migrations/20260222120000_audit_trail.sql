-- ISO 9001 Audit Trail Implementation

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    organization_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Strict RLS Policy: Users can only read logs for their organization
CREATE POLICY "Users can view audit logs for their organization"
    ON public.audit_logs
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- 4. Create trigger function
CREATE OR REPLACE FUNCTION public.log_table_change()
RETURNS TRIGGER AS $$
DECLARE
    current_org_id UUID;
BEGIN
    -- Extract organization_id from the record
    IF (TG_OP = 'DELETE') THEN
        current_org_id := OLD.organization_id;
    ELSE
        current_org_id := NEW.organization_id;
    END IF;

    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_by,
        organization_id
    ) VALUES (
        TG_TABLE_NAME,
        CASE 
            WHEN (TG_OP = 'DELETE') THEN OLD.id 
            ELSE NEW.id 
        END,
        TG_OP,
        to_jsonb(OLD),
        to_jsonb(NEW),
        auth.uid(),
        current_org_id
    );
    
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger to audits
CREATE TRIGGER audit_log_audits
AFTER INSERT OR UPDATE OR DELETE ON public.audits
FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

-- 6. Attach trigger to checklist_items
CREATE TRIGGER audit_log_checklist_items
AFTER INSERT OR UPDATE OR DELETE ON public.checklist_items
FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

-- 7. Storage RLS Policies for audit-evidence
-- Assuming the bucket 'audit-evidence' already exists or will be created.

-- Policy for uploading: Only if organization_id in path matches user's organization_id
-- The path structure is expected to be {organization_id}/{audit_id}/{file_name}
-- However, the current code in checklist-item.tsx uses {auditId}/{itemId}-{Date.now()}.{fileExt}
-- I should probably change the code to use {organizationId}/{auditId}/{fileName} for better RLS.

-- Let's define broad storage policies first based on the requirement:
-- "Verify that the Supabase Storage RLS policies enforce that users can only upload/read files belonging to their authenticated 'organization_id'."

CREATE POLICY "Users can upload evidence for their organization"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audit-evidence' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can view evidence for their organization"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audit-evidence' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete evidence for their organization"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audit-evidence' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
  )
);
