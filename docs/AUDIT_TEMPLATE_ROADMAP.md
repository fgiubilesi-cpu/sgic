# Audit Template Roadmap

## Objective

Make audit templates a reliable first-class workflow:

- every new audit/checklist must have a clear template source
- templates must be visible from the audit detail page
- inspectors must be able to create and maintain templates in platform
- Excel/XLSX import must create or update templates without manual re-entry
- template edits must affect future audits, not silently mutate past audits

## Current Problems

1. Audit-template traceability is broken.
   - `createAuditFromTemplate` creates the audit but does not persist `audits.template_id`.
   - `getAudit` does not expose `template_id`, so the UI cannot reliably show the active template.
   - `checklists` currently have no direct `template_id`, even though the product model already supports multiple checklists per audit.

2. Template actions are misleading or incomplete.
   - `Cambia template` in audit detail is still a placeholder.
   - `Nuovo template` in the audit tab collects questions but only persists title/description.
   - `Duplica` does not copy questions.
   - several flows rely on implicit refreshes that never happen.

3. Excel import does not match the real business need.
   - current flow imports only into an existing template
   - parser assumes a rigid 2-column sheet
   - repeated imports create duplicates because there is no replace/append strategy

4. Template management is split across inconsistent surfaces.
   - `/templates` page
   - `/templates/[id]` editor
   - audit detail `Template` tab
   - these surfaces expose different capabilities and different data freshness

## Product Decisions

These decisions guide the implementation:

1. `/templates` is the canonical template library.
   - The audit detail page should show template provenance and allow safe assignment/switching.
   - Full CRUD remains available in the library, with quick access from the audit.

2. Template edits are non-retroactive.
   - Existing audits keep their checklist snapshot.
   - Future audits inherit the updated template.

3. Excel import defaults to `Create new template`.
   - Updating an existing template is allowed only through an explicit mode.

4. Import v1 is `1 sheet = 1 template`.
   - Multi-sheet batch import can come later.

5. Template switching on an audit is allowed only when the audit is still safe to reset.
   - recommended rule: `Scheduled` status, no compiled answers, no notes, no media, no NC

6. Each checklist should know its source template.
   - add `checklists.template_id`
   - keep `audits.template_id` as the main audit-level reference for compatibility and filtering

## Implementation Phases

### Phase 1. Data Integrity

- add `checklists.template_id`
- backfill `checklists.template_id` from `audits.template_id` and `source_question_id` where possible
- backfill `audits.template_id` from checklist/template-question lineage where possible
- update generated database types
- update `Audit` and `AuditWithChecklists` types to expose `template_id`
- persist `audits.template_id` and `checklists.template_id` in `createAuditFromTemplate`

Done when:

- a newly created audit always stores the selected template
- the audit detail page can read the template reference without `any` casts

### Phase 2. Audit Template UX

- redesign the audit `Template` tab around the active template
- show:
  - active template name
  - description
  - question count
  - checklist count
  - quick actions: edit, open library, switch template
- replace placeholder buttons with real actions
- remove fake inline creation flows from the audit tab
- add refresh after template actions

Done when:

- the active template is obvious on every audit
- every visible button performs a real action

### Phase 3. Template Library Consolidation

- improve `/templates` to use the same metadata and actions as the audit tab
- fix duplication so questions are copied
- keep one full editor model and reuse it across surfaces
- ensure delete is blocked when template is in use

Done when:

- template cards behave consistently in library and audit contexts
- edit/duplicate/delete have predictable results

### Phase 4. Excel Import Wizard

- replace the current import flow with a wizard:
  - upload file
  - choose sheet
  - choose question column
  - optional order column
  - preview parsed rows
  - choose import mode
- import modes:
  - create new template
  - append to existing template
  - replace existing template questions
- for replace mode:
  - soft-delete current active questions
  - insert the imported rows as new `template_questions`

Done when:

- an existing Excel checklist can become a usable template without manual re-entry
- imports are deterministic and previewable before commit

### Phase 5. Safe Template Switching

- add server action to switch the template on an audit
- validate that the audit is safe to reset
- replace checklist/questions from the selected template
- keep the audit title/date/client/location untouched
- update both `audits.template_id` and `checklists.template_id`

Done when:

- switching template is possible only in safe states
- the checklist rendered in the audit really matches the selected template

### Phase 6. QA and Rollout

- test with:
  - one manual template
  - one imported Excel template
  - one existing audit with legacy linkage
- verify:
  - template visibility in audit detail
  - audit creation from template
  - edit template
  - duplicate template
  - import replace mode
  - import append mode
  - safe/unsafe template switching

## Expected Deliverables

- database migration for checklist-template lineage
- updated audit/template queries and actions
- working template assignment in audit detail
- working Excel import wizard
- cleaned UI on `/templates` and `/audits/[id]?tab=templates`
