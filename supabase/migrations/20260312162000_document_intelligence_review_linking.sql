-- Document Intelligence M3-M6 foundations
-- - review tracking
-- - extracted entities linkage
-- - linked status on documents intake
-- - document_versions write policies

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_ingestion_status_check;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_ingestion_status_check
  CHECK (ingestion_status IN ('manual', 'uploaded', 'parsed', 'review_required', 'reviewed', 'linked', 'failed'));

CREATE TABLE IF NOT EXISTS public.document_extraction_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  ingestion_id uuid REFERENCES public.document_ingestions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'reviewed',
  review_action text NOT NULL DEFAULT 'save_review',
  reviewed_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewer_notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_extraction_reviews_status_check
    CHECK (status IN ('review_required', 'reviewed', 'applied', 'rejected', 'failed')),
  CONSTRAINT document_extraction_reviews_action_check
    CHECK (review_action IN ('save_review', 'apply_to_workspace'))
);

CREATE TABLE IF NOT EXISTS public.document_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  extraction_review_id uuid REFERENCES public.document_extraction_reviews(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  linked_table text,
  linked_record_id uuid,
  confidence text NOT NULL DEFAULT 'medium',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_entities_confidence_check
    CHECK (confidence IN ('low', 'medium', 'high'))
);

ALTER TABLE public.document_extraction_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_extraction_reviews_select" ON public.document_extraction_reviews;
DROP POLICY IF EXISTS "document_extraction_reviews_insert" ON public.document_extraction_reviews;
DROP POLICY IF EXISTS "document_extraction_reviews_update" ON public.document_extraction_reviews;

CREATE POLICY "document_extraction_reviews_select"
ON public.document_extraction_reviews
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.profiles
    WHERE id = (SELECT auth.uid()::uuid)
  )
);

CREATE POLICY "document_extraction_reviews_insert"
ON public.document_extraction_reviews
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.profiles
    WHERE id = (SELECT auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
  )
);

CREATE POLICY "document_extraction_reviews_update"
ON public.document_extraction_reviews
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

DROP POLICY IF EXISTS "document_entities_select" ON public.document_entities;
DROP POLICY IF EXISTS "document_entities_insert" ON public.document_entities;
DROP POLICY IF EXISTS "document_entities_update" ON public.document_entities;

CREATE POLICY "document_entities_select"
ON public.document_entities
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.profiles
    WHERE id = (SELECT auth.uid()::uuid)
  )
);

CREATE POLICY "document_entities_insert"
ON public.document_entities
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.profiles
    WHERE id = (SELECT auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
  )
);

CREATE POLICY "document_entities_update"
ON public.document_entities
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

CREATE INDEX IF NOT EXISTS idx_document_extraction_reviews_org_id
  ON public.document_extraction_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_extraction_reviews_document_id
  ON public.document_extraction_reviews(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_extraction_reviews_status
  ON public.document_extraction_reviews(status);

CREATE INDEX IF NOT EXISTS idx_document_entities_org_id
  ON public.document_entities(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_entities_document_id
  ON public.document_entities(document_id);
CREATE INDEX IF NOT EXISTS idx_document_entities_entity_type
  ON public.document_entities(entity_type);

DROP TRIGGER IF EXISTS update_document_extraction_reviews_updated_at ON public.document_extraction_reviews;
CREATE TRIGGER update_document_extraction_reviews_updated_at
  BEFORE UPDATE ON public.document_extraction_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_entities_updated_at ON public.document_entities;
CREATE TRIGGER update_document_entities_updated_at
  BEFORE UPDATE ON public.document_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "document_versions_access_policy" ON public.document_versions;
DROP POLICY IF EXISTS "document_versions_insert_policy" ON public.document_versions;
DROP POLICY IF EXISTS "document_versions_update_policy" ON public.document_versions;

CREATE POLICY "document_versions_access_policy"
ON public.document_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.documents
    WHERE documents.id = document_versions.document_id
      AND documents.organization_id IN (
        SELECT organization_id
        FROM public.profiles
        WHERE id = (SELECT auth.uid()::uuid)
      )
  )
);

CREATE POLICY "document_versions_insert_policy"
ON public.document_versions
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.profiles
    WHERE id = (SELECT auth.uid()::uuid)
      AND role IN ('admin', 'auditor', 'inspector')
  )
);

CREATE POLICY "document_versions_update_policy"
ON public.document_versions
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

NOTIFY pgrst, 'reload schema';
