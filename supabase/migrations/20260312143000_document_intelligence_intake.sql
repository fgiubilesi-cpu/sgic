-- Document Intelligence foundations (M1 + M2)
-- - storage bucket for documents
-- - richer document metadata
-- - intake tracking table
-- - category extension

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'document_category'
      AND n.nspname = 'public'
  ) THEN
    BEGIN
      ALTER TYPE public.document_category ADD VALUE IF NOT EXISTS 'OrgChart';
      ALTER TYPE public.document_category ADD VALUE IF NOT EXISTS 'Authorization';
      ALTER TYPE public.document_category ADD VALUE IF NOT EXISTS 'Registry';
      ALTER TYPE public.document_category ADD VALUE IF NOT EXISTS 'Report';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documents_storage_select_org" ON storage.objects;
DROP POLICY IF EXISTS "documents_storage_insert_org" ON storage.objects;
DROP POLICY IF EXISTS "documents_storage_update_org" ON storage.objects;
DROP POLICY IF EXISTS "documents_storage_delete_org" ON storage.objects;

CREATE POLICY "documents_storage_select_org"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "documents_storage_insert_org"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'auditor', 'inspector')
  )
);

CREATE POLICY "documents_storage_update_org"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'auditor', 'inspector')
  )
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'auditor', 'inspector')
  )
);

CREATE POLICY "documents_storage_delete_org"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'auditor', 'inspector')
  )
);

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS ingestion_status text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS extracted_payload jsonb;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_ingestion_status_check
  CHECK (ingestion_status IN ('manual', 'uploaded', 'parsed', 'review_required', 'reviewed', 'failed'));

CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON public.documents(storage_path);
CREATE INDEX IF NOT EXISTS idx_documents_ingestion_status ON public.documents(ingestion_status);

CREATE TABLE IF NOT EXISTS public.document_ingestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  parser_type text NOT NULL DEFAULT 'manual_v1',
  status text NOT NULL DEFAULT 'uploaded',
  extracted_text text,
  extracted_payload jsonb,
  review_notes text,
  error_message text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_ingestions_status_check
    CHECK (status IN ('uploaded', 'parsed', 'review_required', 'reviewed', 'linked', 'failed'))
);

ALTER TABLE public.document_ingestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "document_ingestions_select" ON public.document_ingestions;
DROP POLICY IF EXISTS "document_ingestions_insert" ON public.document_ingestions;
DROP POLICY IF EXISTS "document_ingestions_update" ON public.document_ingestions;

CREATE POLICY "document_ingestions_select"
ON public.document_ingestions
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.profiles
    WHERE id = (SELECT auth.uid()::uuid)
  )
);

CREATE POLICY "document_ingestions_insert"
ON public.document_ingestions
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.profiles
    WHERE id = (SELECT auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
  )
);

CREATE POLICY "document_ingestions_update"
ON public.document_ingestions
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.profiles
    WHERE id = (SELECT auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.profiles
    WHERE id = (SELECT auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
  )
);

CREATE INDEX IF NOT EXISTS idx_document_ingestions_org_id ON public.document_ingestions(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_ingestions_document_id ON public.document_ingestions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_ingestions_status ON public.document_ingestions(status);

DROP TRIGGER IF EXISTS update_document_ingestions_updated_at ON public.document_ingestions;
CREATE TRIGGER update_document_ingestions_updated_at
  BEFORE UPDATE ON public.document_ingestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';
