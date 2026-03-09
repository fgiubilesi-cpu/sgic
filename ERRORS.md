# SGIC — Known Errors & Solutions
> Aggiornato: 2026-03-09 | Sprint 4

---

## checklist_items — audit_id denormalizzato

**Problema**: `checklist_items.audit_id` esiste nel DB ma è denormalizzato e spesso NULL.
Non usarlo per JOIN o per recuperare l'audit di appartenenza.

**Soluzione**: Recuperare audit_id tramite checklists table:
```typescript
const { data: item } = await supabase
  .from('checklist_items')
  .select('checklist_id, question, outcome')
  .eq('id', itemId)
  .single()

const { data: checklist } = await supabase
  .from('checklists')
  .select('audit_id')
  .eq('id', item.checklist_id)
  .single()

const auditId = checklist.audit_id
```

**File interessati**: `src/features/audits/actions/actions.ts` → updateChecklistItem()

---

## corrective_actions — Schema Reale

**Colonne che ESISTONO:**
```
id, non_conformity_id, organization_id,
description, root_cause, action_plan,
responsible_person_name, responsible_person_email,
due_date (date), target_completion_date (date),
status (default 'pending'), updated_at,
completed_at, closed_at, deleted_at
```

**Colonne che NON ESISTONO (non usarle mai):**
- `title` ❌
- `assigned_to` ❌

**Status values reali nel DB:**
- `pending` ✅
- `in_progress` ✅
- `completed` ✅
- `closed` ❌ — non esiste
- `verified` ❌ — non esiste
- `open` ❌ — non esiste

**Logica status corretta:**
- Completare una AC: `status = 'completed'` + `completed_at = now()`
- `closed_at` è per logiche future (es. verifica al prossimo audit)

---

## corrective_actions — RLS Fix (Sprint 4)

**Problema**: Le policy originali usavano `get_user_organization_id()` che legge
`organization_id` dal JWT Supabase. Supabase NON include organization_id nel JWT
di default → la funzione ritornava NULL → `organization_id = NULL` non matcha mai
→ INSERT/UPDATE/SELECT bloccati per tutti gli utenti.

**Fix applicato** (migration `fix_corrective_actions_rls`):
```sql
-- Sostituite tutte e 4 le policy con pattern profiles lookup:
CREATE POLICY "corrective_actions_insert_own_org" ON corrective_actions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = (select auth.uid()::uuid)
    )
  );
-- (stesso pattern per SELECT, UPDATE, DELETE)
```

**File interessati**: Migration applicata direttamente su Supabase.

---

## audits — updated_at non esiste

**Problema**: La tabella `audits` NON ha una colonna `updated_at`.
Passare `updated_at` in un `.update()` su audits causa errore PGRST204.

**Fix**: Rimuovere `updated_at` da tutti gli update su `audits`.

```typescript
// ❌ SBAGLIATO
await supabase.from('audits').update({ score: 85, updated_at: new Date().toISOString() })

// ✅ CORRETTO
await supabase.from('audits').update({ score: 85 })
```

**File interessati**: `src/features/audits/actions/audit-completion-actions.ts` — fixato Sprint 4.

---

## NC auto-create — errore swallowed

**Problema**: In `updateChecklistItem`, se l'INSERT su `non_conformities` falliva,
l'errore veniva solo loggato in console e la funzione ritornava `{ success: true }`.
Il frontend non sapeva del fallimento.

**Fix applicato** (Sprint 4):
```typescript
// ❌ PRIMA
if (ncError) {
  console.error('Failed to create non-conformity:', ncError)
}

// ✅ DOPO
if (ncError) {
  return { success: false, error: `NC creation failed: ${ncError.message}` }
}
```

E nel frontend (checklist-row.tsx):
```typescript
// ✅ Mostra errore specifico nel toast
toast.error(result.error ?? "Failed to save outcome.")
```

**File interessati**: 
- `src/features/audits/actions/actions.ts`
- `src/features/audits/components/checklist-row.tsx`

---

## Template import — CSV edge cases

**CSV Parser** (in template-schema.ts):
- Supporta colonne: "question", "domanda", "Question", "Domanda" (case-insensitive)
- Fallback: usa il primo valore della riga se nessuna colonna riconosciuta
- Gestisce righe vuote e whitespace extra
- Sort order: usa colonna "sort_order" se presente, altrimenti indice riga

**Excel Parser** (SheetJS):
- Try SheetJS prima
- Se errore → toast error + suggerimento "usa formato CSV"
- Versione: xlsx v0.18.5

---

## RLS pattern corretto (usare sempre questo)

```sql
-- ✅ Pattern ottimizzato con subquery per performance
CREATE POLICY "nome" ON tabella FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = (select auth.uid()::uuid)
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = (select auth.uid()::uuid)
  ));
```

**Perché `(select auth.uid()::uuid)` invece di `auth.uid()::uuid`**:
La subquery viene eseguita una volta sola per statement invece che per ogni riga,
migliorando le performance su tabelle con molte righe.

---

## WARN sicurezza — function_search_path_mutable (non urgente)

Supabase advisor segnala WARN su queste funzioni DB che non hanno `search_path` fisso:
- `update_updated_at_column`
- `log_table_change`  
- `update_non_conformities_updated_at`
- `update_corrective_actions_updated_at`
- `update_corrective_actions_closed_at`
- `sync_user_metadata_to_jwt`
- `get_user_role`
- `get_user_organization_id`
- `update_version_and_timestamp`
- `handle_new_user`

**Impatto**: Basso — WARN non ERROR. Non bloccante per il funzionamento.  
**Fix futuro**: Aggiungere `SET search_path = public` a ogni funzione.

---

## checklists — HA organization_id

**Nota**: Documentazione precedente diceva erroneamente che `checklists` non aveva
`organization_id`. **La colonna ESISTE** e va passata negli INSERT.

```typescript
// ✅ CORRETTO
await supabase.from('checklists').insert({
  audit_id: auditId,
  title: 'Checklist',
  organization_id: organizationId,  // ← va inclusa
})
```