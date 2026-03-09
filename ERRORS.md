# SGIC — Known Errors & Solutions
> Aggiornato: 2026-03-09 | Sprint 6

---

## checklist_items — audit_id denormalizzato (CRITICO)

**Problema**: `checklist_items.audit_id` esiste ma è spesso NULL.
NON usarlo per query — porta a risultati vuoti silenziosamente.

**Pattern obbligatorio ovunque**:
```typescript
// ❌ SBAGLIATO
await supabase.from('checklist_items').select('outcome').eq('audit_id', auditId)

// ✅ CORRETTO — sempre questo
const { data: checklists } = await supabase
  .from('checklists').select('id').eq('audit_id', auditId)
const checklistIds = checklists?.map(c => c.id) ?? []
if (checklistIds.length === 0) return /* zero/empty result */
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

**Status values reali:** `pending` | `in_progress` | `completed`
**NON esistono:** `closed`, `verified`, `open`

```typescript
// Completare una AC
{ status: 'completed', completedAt: new Date().toISOString() }
```

---

## corrective_actions — RLS Fix ✅ (Sprint 4)

**Problema**: Policy usava `get_user_organization_id()` che legge dal JWT.
Supabase non include `organization_id` nel JWT → ritorna NULL → INSERT bloccato.

**Fix**: Tutte le policy riscritte con `profiles WHERE id = (select auth.uid()::uuid)`.

---

## audits — updated_at non esiste ✅ (Sprint 4)

```typescript
// ❌ SBAGLIATO — PGRST204
await supabase.from('audits').update({ score: 85, updated_at: new Date() })
// ✅ CORRETTO
await supabase.from('audits').update({ score: 85 })
```

---

## NC auto-create — errore swallowed ✅ (Sprint 4)

```typescript
// ✅ Ora visibile
if (ncError) return { success: false, error: `NC creation failed: ${ncError.message}` }
// ✅ Frontend mostra errore specifico
toast.error(result.error ?? "Failed to save outcome.")
```

---

## non_conformities — filtrare sempre deleted_at

```typescript
// ✅ Sempre aggiungere questo filtro
.from('non_conformities')
.select('...')
.is('deleted_at', null)  // oppure .filter('deleted_at', 'is', null)
```

---

## checklists — HA organization_id

Documentazione precedente era errata. La colonna esiste e va passata:
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

La subquery `(select auth.uid()::uuid)` ottimizza le performance — viene eseguita
una volta per statement invece che per ogni riga.

---

## Template import — CSV/Excel edge cases

**CSV**: colonne riconosciute: `question`, `domanda` (case-insensitive).
Fallback: primo valore della riga. Righe vuote ignorate.

**Excel (SheetJS)**: se errore → toast + suggerimento "usa formato CSV".

---

## WARN sicurezza — function_search_path_mutable (non urgente)

Funzioni senza `search_path` fisso (WARN, non ERROR — non bloccante):
`update_updated_at_column`, `log_table_change`, `get_user_role`,
`get_user_organization_id`, `handle_new_user`, e altre.

Fix futuro: `SET search_path = public` in ogni funzione.