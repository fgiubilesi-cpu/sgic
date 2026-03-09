# ERRORS.md — SGIC
> Errori noti, cause e soluzioni. Aggiornato: 2026-03-08

---

## ❌ RIMOSSO — Errore non più valido

~~`checklists` non ha `organization_id`~~ — **FALSO**. La colonna esiste nel DB reale. Verificato da `database.types.ts`. Inserire sempre `organization_id` negli INSERT su `checklists`.

---

## checklist_items — audit_id è denormalizzato, NON usarlo per JOIN

**Problema**: `checklist_items.audit_id` esiste come colonna ma è denormalizzato — non è una FK affidabile per join. La FK reale è su `checklist_id`.

**Se hai bisogno dell'audit_id partendo da un checklist_item:**
```typescript
// 1. Leggi il checklist_id dall'item
const { data: item } = await supabase
  .from('checklist_items')
  .select('organization_id, checklist_id, question, outcome')
  .eq('id', itemId)
  .single()

// 2. Ottieni audit_id dalla tabella checklists
const { data: checklist } = await supabase
  .from('checklists')
  .select('audit_id')
  .eq('id', item.checklist_id)
  .single()

const auditId = checklist.audit_id
```

**File interessati**: `src/features/audits/actions/actions.ts` → `updateChecklistItem()`

---

## corrective_actions — colonne title e assigned_to non esistono

**Problema**: `corrective_actions` NON ha le colonne `title` o `assigned_to`. Usarle causa PGRST204.

**Colonne corrette da usare:**
- Al posto di `title` → usare `action_plan` (descrizione del piano)
- Al posto di `assigned_to` → usare `responsible_person_name` + `responsible_person_email`

**Schema completo corrective_actions:**
```
action_plan, closed_at, completed_at, created_at, deleted_at,
description, due_date, id, non_conformity_id, organization_id,
owner_id, responsible_person_email, responsible_person_name,
root_cause, status, target_completion_date, updated_at
```

---

## RLS — Pattern corretto con performance ottimizzata

**Problema**: Scrivere `auth.uid()` direttamente nel USING/WITH CHECK causa rivalutazione per ogni riga → lento su tabelle grandi.

**Pattern SBAGLIATO (lento):**
```sql
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()::uuid
))
```

**Pattern CORRETTO (performante — valutato una sola volta):**
```sql
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = (select auth.uid()::uuid)
))
WITH CHECK (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = (select auth.uid()::uuid)
))
```

---

## RLS — INSERT bloccato senza WITH CHECK

**Problema**: Una policy con solo `USING` non copre INSERT. L'operazione viene bloccata silenziosamente.

**Fix**: Aggiungere sempre `WITH CHECK` per policies FOR ALL o FOR INSERT:
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

## PGRST204 — Colonna non trovata

**Causa**: La cache dello schema PostgREST è vecchia dopo un ALTER TABLE.

**Fix immediato:**
```sql
NOTIFY pgrst, 'reload schema';
```

---

## Loop ricorsivo createClient

**Causa**: Conflitto di nome nell'import di Supabase.

**Fix:**
```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
```

---

## 404 su nuova route

**Causa**: Il middleware non conosce la nuova route.

**Fix**: Aggiungere il path a `isDashboardRoute` in `middleware.ts`.

---

## ncSeveritySchema is not defined

**Causa**: Nome variabile sbagliato.

**Fix**: Usare `ncSeverityEnum` (non `ncSeveritySchema`) importato da `features/quality/schemas/nc-ac.schema.ts`.

---

## Tabelle senza RLS — rischio sicurezza

**Problema**: Le seguenti tabelle sono pubblicamente accessibili senza RLS:

| Tabella | Stato |
|---|---|
| `documents` | RLS disabilitata (policies esistono ma inattive) |
| `risks` | RLS disabilitata (policies esistono ma inattive) |
| `training_records` | RLS assente |
| `training_courses` | RLS assente |
| `personnel` | RLS assente |
| `document_versions` | RLS assente |
| `action_evidence` | RLS abilitata ma zero policies |

**Fix da applicare (sprint sicurezza):**
```sql
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Policy per action_evidence
CREATE POLICY "action_evidence_org_isolation" ON public.action_evidence
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = (select auth.uid()::uuid)
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = (select auth.uid()::uuid)
  ));
```

---

## Supabase joins — sintassi corretta

**Sbagliato:**
```typescript
.select("*, clients(name), locations(name)")
```

**Corretto:**
```typescript
.select("*, client:client_id(name), location:location_id(name)")
```