-- Add soft-delete support to template_questions
-- ISO 9001 audit trail: deleted records are preserved with a timestamp
-- rather than being permanently removed from the database.

ALTER TABLE template_questions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- All queries should filter WHERE deleted_at IS NULL to exclude soft-deleted rows.
-- The application layer (template-editor.tsx / createAuditFromTemplate) already
-- applies this filter.

COMMENT ON COLUMN template_questions.deleted_at IS
  'Soft-delete timestamp. NULL = active record. Non-NULL = logically deleted.';
