# SGIC — Known Errors & Solutions
> Aggiornato: 2026-03-09 | Sprint 5

---

## checklist_items — audit_id denormalizzato (CRITICO)

**Problema**: `checklist_items.audit_id` esiste ma è spesso NULL — non affidabile per query.

**Pattern corretto** (obbligatorio ovunque):
```typescript
// ❌ SBAGLIATO — audit_id spesso NULL
await supabase.from('checklist_items').select('outcome').eq('audit_id', auditId)

// ✅ CORRETTO — sempre questo pattern
const { data: checklists } = await supabase
  .from('checklists').select('id').eq('audit_id', auditId)

const checklistIds = checklists?.map(c => c.id) ?? []

if (checklistIds.length === 0) {
  return /* empty/zero result appropriato al contesto */
}

const { data: items } = await supabase
  .from('checklist_items')
  .select('outcome')
  .in('checklist_id', checklistIds)
```

**File fixati**: 
- `audit-completion-section.tsx` — compliance score (Sprint 5)
- `actions.ts` → updateChecklistItem() (Sprint 4)

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

**Status values reali:** `pending` | `in_progress` | `completed`  
**NON esistono:** `closed`, `verified`, `open`

**Logica corretta:**
```typescript
// Completare una AC
{ status: 'completed', completedAt: new Date().toISOString() }
// closed_at è per logiche future (verifica prossimo audit)
```

---

## corrective_actions — RLS Fix (Sprint 4) ✅

**Problema**: Policy usava `get_user_organization_id()` che legge `organization_id`
dal JWT Supabase. Il JWT non contiene questo campo → ritorna NULL → INSERT bloccato.

**Fix applicato**: Migration `fix_corrective_actions_rls` — tutte e 4 le policy
riscritte con pattern `profiles WHERE id = (select auth.uid()::uuid)`.

---

## audits — updated_at non esiste ✅

**Problema**: `audits` NON ha `updated_at`. Passarla causa PGRST204.

```typescript
// ❌ SBAGLIATO
await supabase.from('audits').update({ score: 85, updated_at: new Date().toISOString() })

// ✅ CORRETTO
await supabase.from('audits').update({ score: 85 })
```

**File fixato**: `audit-completion-actions.ts` (Sprint 4)

---

## NC auto-create — errore swallowed ✅

**Problema**: Se INSERT su `non_conformities` falliva, l'errore veniva solo loggato
e la funzione ritornava `{ success: true }`. Frontend non sapeva del fallimento.

**Fix applicato** (Sprint 4):
```typescript
// ✅ Ora ritorna errore visibile
if (ncError) {
  return { success: false, error: `NC creation failed: ${ncError.message}` }
}

// ✅ Frontend mostra errore specifico
toast.error(result.error ?? "Failed to save outcome.")
```

---

## checklists — HA organization_id

⚠️ Documentazione precedente era errata. La colonna **ESISTE** e va passata negli INSERT:

```typescript
await supabase.from('checklists').insert({
  audit_id: auditId,
  title: 'Checklist',
  organization_id: organizationId,  // ← obbligatoria
})
```

---

## RLS pattern corretto (sempre questo)

```sql
CREATE POLICY "nome" ON tabella FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = (select auth.uid()::uuid)
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = (select auth.uid()::uuid)
  ));
```

La subquery `(select auth.uid()::uuid)` viene eseguita una volta per statement
invece che per ogni riga — performance migliori su tabelle grandi.

---

## Template import — CSV/Excel edge cases

**CSV parser** (`template-schema.ts` → `parseImportedQuestions()`):
- Colonne riconosciute: `question`, `domanda`, `Question`, `Domanda` (case-insensitive)
- Fallback: primo valore della riga se nessuna colonna riconosciuta
- Righe vuote e whitespace extra gestiti

**Excel parser** (SheetJS):
- Try SheetJS prima
- Se errore → toast error + suggerimento formato CSV

---

## WARN sicurezza — function_search_path_mutable (non urgente)

Funzioni DB senza `search_path` fisso (solo WARN, non ERROR):
`update_updated_at_column`, `log_table_change`, `update_non_conformities_updated_at`,
`update_corrective_actions_updated_at`, `update_corrective_actions_closed_at`,
`sync_user_metadata_to_jwt`, `get_user_role`, `get_user_organization_id`,
`update_version_and_timestamp`, `handle_new_user`

**Fix futuro**: Aggiungere `SET search_path = public` a ogni funzione.