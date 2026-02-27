-- Finalize Base Audit Architecture
-- Phase: Base Architecture Stabilization
-- Changes:
-- 1. Add source_question_id to checklist_items (reference to template_questions for audit trail)
-- 2. Update audit status enum from (planned, in_progress, completed, archived) to (Scheduled, In Progress, Review, Closed)
-- 3. Migrate existing audit data to new status values

-- ===== STEP 1: Add source_question_id to checklist_items =====
-- This creates a reference link to the original template question, enabling audit trail and versioning

ALTER TABLE public.checklist_items
ADD COLUMN source_question_id UUID REFERENCES public.template_questions(id) ON DELETE SET NULL;

CREATE INDEX idx_checklist_items_source_question ON public.checklist_items(source_question_id);

COMMENT ON COLUMN public.checklist_items.source_question_id IS
  'Foreign key reference to the original template_question. Enables audit trail and template version tracking.';

-- ===== STEP 2: Update audit status enum =====
-- Current: planned, in_progress, completed, archived
-- New: Scheduled, In Progress, Review, Closed
-- This aligns with ISO 9001 audit lifecycle terminology

-- First, drop the old CHECK constraint
ALTER TABLE public.audits
DROP CONSTRAINT audits_status_check;

-- Add the new CHECK constraint with updated values
ALTER TABLE public.audits
ADD CONSTRAINT audits_status_check
CHECK (status IN ('Scheduled', 'In Progress', 'Review', 'Closed'));

-- ===== STEP 3: Migrate existing data to new status values =====
-- Map old values to new values:
-- planned → Scheduled
-- in_progress → In Progress
-- completed → Closed
-- archived → Closed (treat archived as closed)

UPDATE public.audits
SET status = CASE
  WHEN status = 'planned' THEN 'Scheduled'
  WHEN status = 'in_progress' THEN 'In Progress'
  WHEN status = 'completed' THEN 'Closed'
  WHEN status = 'archived' THEN 'Closed'
  ELSE 'Scheduled'
END
WHERE status IN ('planned', 'in_progress', 'completed', 'archived');

-- Update audit comments
COMMENT ON COLUMN public.audits.status IS
  'Audit lifecycle: Scheduled → In Progress → Review → Closed. Supports ISO 9001 compliance workflow.';

-- ===== VERIFICATION =====
-- After migration, run these queries to verify:
-- SELECT DISTINCT status FROM public.audits;
-- SELECT COUNT(*) FROM public.checklist_items WHERE source_question_id IS NULL;
