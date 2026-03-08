# Known Errors & Solutions

## checklists — No organization_id Column

**Problem**: `checklists` table does NOT have an `organization_id` column. It only has:
- `id`
- `audit_id` (FK to audits)
- `title`
- `created_at`
- `updated_at`

Trying to insert `organization_id` causes: `PGRST204: Could not find the 'organization_id' column of 'checklists' in the schema cache`

**Solution**: Remove `organization_id` from checklists insert. It only belongs on `checklist_items`.

**Example (from createAuditFromTemplate in actions.ts)**:
```typescript
// ❌ WRONG:
const { data: checklist } = await supabase
  .from('checklists')
  .insert({
    audit_id: audit.id,
    title: title,
    organization_id: organizationId,  // ← Remove this!
  })

// ✅ CORRECT:
const { data: checklist } = await supabase
  .from('checklists')
  .insert({
    audit_id: audit.id,
    title: title,
  })
```

---

## checklist_items — No audit_id Column

**Problem**: `checklist_items` table does NOT have an `audit_id` column. It only has:
- `checklist_id` (FK to checklists)
- `organization_id` (FK to organizations)

Trying to read or insert `audit_id` from `checklist_items` will fail with a column not found error.

**Solution**: To get the `audit_id` for a checklist item:
1. Read the `checklist_id` from the checklist_item
2. Query the `checklists` table to fetch `audit_id` using the `checklist_id`
3. Use that `audit_id` in downstream operations (NC creation, score updates, etc.)

**Example (from updateChecklistItem in actions.ts)**:
```typescript
const { data: item } = await supabase
  .from('checklist_items')
  .select('organization_id, checklist_id, question, outcome')
  .eq('id', itemId)
  .single()

// Get audit_id from checklists table
const { data: checklist } = await supabase
  .from('checklists')
  .select('audit_id')
  .eq('id', item.checklist_id)
  .single()

const auditId = checklist.audit_id
```

**Files affected**:
- `src/features/audits/actions/actions.ts` → `updateChecklistItem()` function
