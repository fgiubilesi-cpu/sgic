-- Multi-media attachments for audit checklist items

INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-media', 'checklist-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.checklist_item_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    media_kind TEXT NOT NULL DEFAULT 'image' CHECK (media_kind IN ('image', 'video')),
    original_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_item_media_item_id
    ON public.checklist_item_media(checklist_item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_checklist_item_media_audit_id
    ON public.checklist_item_media(audit_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_checklist_item_media_org_id
    ON public.checklist_item_media(organization_id, created_at DESC);

ALTER TABLE public.checklist_item_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inspectors_see_checklist_item_media" ON public.checklist_item_media;
CREATE POLICY "inspectors_see_checklist_item_media"
    ON public.checklist_item_media
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "inspectors_create_checklist_item_media" ON public.checklist_item_media;
CREATE POLICY "inspectors_create_checklist_item_media"
    ON public.checklist_item_media
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "inspectors_update_checklist_item_media" ON public.checklist_item_media;
CREATE POLICY "inspectors_update_checklist_item_media"
    ON public.checklist_item_media
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "inspectors_delete_checklist_item_media" ON public.checklist_item_media;
CREATE POLICY "inspectors_delete_checklist_item_media"
    ON public.checklist_item_media
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE OR REPLACE FUNCTION public.set_checklist_item_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_checklist_item_media_updated_at ON public.checklist_item_media;
CREATE TRIGGER set_checklist_item_media_updated_at
BEFORE UPDATE ON public.checklist_item_media
FOR EACH ROW EXECUTE FUNCTION public.set_checklist_item_media_updated_at();

DROP TRIGGER IF EXISTS audit_log_checklist_item_media ON public.checklist_item_media;
CREATE TRIGGER audit_log_checklist_item_media
AFTER INSERT OR UPDATE OR DELETE ON public.checklist_item_media
FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

DROP POLICY IF EXISTS "Users can upload checklist media for their organization" ON storage.objects;
CREATE POLICY "Users can upload checklist media for their organization"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'checklist-media' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view checklist media for their organization" ON storage.objects;
CREATE POLICY "Users can view checklist media for their organization"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'checklist-media' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete checklist media for their organization" ON storage.objects;
CREATE POLICY "Users can delete checklist media for their organization"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'checklist-media' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
  )
);
