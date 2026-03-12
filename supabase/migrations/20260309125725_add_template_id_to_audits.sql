
ALTER TABLE audits 
ADD COLUMN template_id uuid REFERENCES checklist_templates(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
;
