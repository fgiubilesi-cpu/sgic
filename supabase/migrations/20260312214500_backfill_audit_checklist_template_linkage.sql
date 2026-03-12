-- Ensure audits and checklists keep an explicit reference to their source template

ALTER TABLE public.audits
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL;

ALTER TABLE public.checklists
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audits_template_id ON public.audits(template_id);
CREATE INDEX IF NOT EXISTS idx_checklists_template_id ON public.checklists(template_id);

-- Step 1: inherit checklist template from audit when available
UPDATE public.checklists AS c
SET template_id = a.template_id
FROM public.audits AS a
WHERE c.audit_id = a.id
  AND c.template_id IS NULL
  AND a.template_id IS NOT NULL;

-- Step 2: infer checklist template from source_question_id lineage when unambiguous
WITH checklist_template_source AS (
  SELECT
    ci.checklist_id,
    MIN(tq.template_id::text)::uuid AS template_id,
    COUNT(DISTINCT tq.template_id) AS template_count
  FROM public.checklist_items AS ci
  JOIN public.template_questions AS tq ON tq.id = ci.source_question_id
  WHERE tq.template_id IS NOT NULL
  GROUP BY ci.checklist_id
)
UPDATE public.checklists AS c
SET template_id = src.template_id
FROM checklist_template_source AS src
WHERE c.id = src.checklist_id
  AND c.template_id IS NULL
  AND src.template_count = 1;

-- Step 3: backfill audit template from checklist template when unambiguous
WITH audit_template_source AS (
  SELECT
    c.audit_id,
    MIN(c.template_id::text)::uuid AS template_id,
    COUNT(DISTINCT c.template_id) AS template_count
  FROM public.checklists AS c
  WHERE c.template_id IS NOT NULL
  GROUP BY c.audit_id
)
UPDATE public.audits AS a
SET template_id = src.template_id
FROM audit_template_source AS src
WHERE a.id = src.audit_id
  AND a.template_id IS NULL
  AND src.template_count = 1;

NOTIFY pgrst, 'reload schema';
