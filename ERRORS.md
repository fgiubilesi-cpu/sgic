# SGIC — Known Errors & Solutions
> Aggiornato: 2026-03-09 | Sprint 7

---

## checklist_items — audit_id denormalizzato (CRITICO)

**Problema**: `checklist_items.audit_id` esiste ma è spesso NULL. Non affidabile.

```typescript
// ❌ SBAGLIATO
.from('checklist_items').select('outcome').eq('audit_id', auditId)

// ✅ CORRETTO — sempre questo pattern
const { data: checklists } = await supabase
  .from('checklists').select('id').eq('audit_id', auditId)
const checklistIds = checklists?.map(c => c.id) ?? []
if (checklistIds.length === 0) return /* empty result */
await supabase.from('checklist_items')
  .select('outcome').in('checklist_id', checklistIds)
```

**File fixati**: `audit-completion-section.tsx` (Sprint 5), `actions.ts` (Sprint 4)

---

## corrective_actions — Schema e Status Reali

**Colonne che ESISTONO:**
```
id, non_conformity_id, organization_id,
description, root_cause, action_plan,
responsible_person_name, responsible_person_email,
due_date (date), target_completion_date (date),
status (default 'pending'), updated_at,
completed_at, closed_at, deleted_at
```

**NON esistono:** `title`, `assigned_to`  
**Status reali:** `pending` | `in_progress` | `completed`  
**NON esistono:** `closed`, `verified`, `open`

---

## corrective_actions — RLS Fix ✅ Sprint 4

**Problema**: Policy usava `get_user_organization_id()` che legge dal JWT → NULL.  
**Fix**: Policy riscritte con `profiles WHERE id = (select auth.uid()::uuid)`.

---

## audits — updated_at non esiste ✅ Sprint 4

```typescript
// ❌ SBAGLIATO — PGRST204
supabase.from('audits').update({ score: 85, updated_at: new Date() })
// ✅ CORRETTO
supabase.from('audits').update({ score: 85 })
```

---

## non_conformities — filtrare sempre deleted_at

```typescript
// ✅ Obbligatorio in ogni query su non_conformities
.from('non_conformities')
.select('...')
.is('deleted_at', null)
```

---

## Portale cliente — read-only pattern

```typescript
// ✅ Pattern implementato Sprint 7
const { data: profile } = await supabase
  .from('profiles').select('role, client_id').eq('id', userId).single()

const isReadOnly = profile.role === 'client'

// Props ai componenti
<ChecklistManager readOnly={isReadOnly} />
<NcAcTab readOnly={isReadOnly} />
```

Componenti che accettano `readOnly`:
- `checklist-manager.tsx` ✅
- `checklist-row.tsx` ✅  
- `nc-ac-tab.tsx` ✅
- `template-editor.tsx` ✅

---

## checklists — HA organization_id

```typescript
// ✅ organization_id obbligatoria nell'INSERT
await supabase.from('checklists').insert({
  audit_id: auditId,
  title: 'Checklist',
  organization_id: organizationId,
})
```

---

## RLS pattern corretto

```sql
CREATE POLICY "nome" ON tabella FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = (select auth.uid()::uuid)
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = (select auth.uid()::uuid)
  ));
```

---

## WARN sicurezza — function_search_path_mutable (non urgente)

Funzioni senza `search_path` fisso (WARN non ERROR):
`get_user_organization_id`, `get_user_role`, `handle_new_user`,
`update_updated_at_column`, `log_table_change`, e altre.  
Fix futuro: `SET search_path = public` in ogni funzione.