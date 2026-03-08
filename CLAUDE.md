# CLAUDE.md — SGIC
> Contesto completo per agenti AI. Leggi tutto prima di iniziare qualsiasi task.

---

## 1. Progetto

**SGIC** — Sistema di Gestione Ispezioni e Conformità  
Client: Giubilesi Associati (consulenza agri-food, ISO 9001)  
Stack: Next.js 16 App Router + TypeScript strict + Supabase + Tailwind + shadcn/ui + Zod + Sonner  
Porta dev: 3000 (o 3010 se avviato da Claude Code)

---

## 2. Architettura Multi-Tenant

```
organizations (is_platform_owner=true → Giubilesi, vede tutto)
  └── clients
        └── locations
              └── audits
                    └── checklists (1:1 con audit)
                          └── checklist_items
                                └── non_conformities
                                      └── corrective_actions
```

Seed: organization id `4ed14a8b-a5b5-4933-b83f-a940b4993707`, admin id `c6cc8a13-6e0d-47fd-ab44-8c4093679bd2`

---

## 3. Schema DB — Colonne Importanti

### `audits`
id, title, status, scheduled_date, organization_id, client_id, location_id, **score numeric(5,2)**

### `checklists`
id, audit_id, title, created_at, **organization_id uuid NOT NULL**

### `checklist_items`
id, checklist_id, question, outcome, notes, evidence_url, audio_url, organization_id, source_question_id, version, created_at, updated_at, **sort_order integer**, **audit_id uuid** (denormalizzato)

### `non_conformities`
id, audit_id, checklist_item_id, organization_id, title, description, severity, status, closed_at, created_at

### `corrective_actions`
id, non_conformity_id, organization_id, title, description, assigned_to, due_date, status, closed_at

---

## 4. Struttura Cartelle

```
src/
  app/(dashboard)/
    audits/[id]/
    clients/[id]/
    templates/
    quality/
  features/
    audits/
      actions/    → createAuditFromTemplate, updateChecklistItem, updateAuditStatus
      queries/    → getAudit, getAudits, getAuditSummary, getNonConformities, getCorrectiveActions
      schemas/    → audit-schema.ts, non-conformity-schema.ts
      components/ → ChecklistManager, AuditStats, NonConformitiesList, AuditStatusBadge
      constants.ts
    clients/
    quality/
      schemas/    → nc-ac.schema.ts (ncSeverityEnum, ncStatusEnum)
      constants.ts
  lib/supabase/
    get-org-context.ts  → getOrganizationContext() → { supabase, organizationId, userId } | null
  types/
    database.types.ts   → SOLO tipi TypeScript generati, NON Zod schemas
```

---

## 5. Pattern Obbligatori

### Server Actions
```typescript
'use server'
const ctx = await getOrganizationContext()
if (!ctx) return { success: false, error: 'Not authenticated.' }
const { supabase, organizationId, userId } = ctx
```

### Supabase joins
```typescript
// CORRETTO
.select("..., client:client_id(name), location:location_id(name)")
// SBAGLIATO — non funziona
.select("..., clients(name), locations(name)")
```

### Zod schemas
NON importare da database.types.ts. Schemas Zod → `features/{nome}/schemas/`

---

## 6. Errori Noti e Soluzioni

| Errore | Causa | Fix |
|--------|-------|-----|
| `auth.uid()` in RLS non funziona | Manca cast | `auth.uid()::uuid` |
| profiles non trovato | Colonna sbagliata | usa `id` non `user_id` |
| Loop ricorsivo createClient | Conflitto nome import | `import { createClient as createSupabaseClient }` |
| 404 su nuova route | Middleware non aggiornato | aggiungere a `isDashboardRoute` in middleware.ts |
| PGRST204 colonna non trovata | Schema cache vecchia | `NOTIFY pgrst, 'reload schema';` |
| INSERT bloccato da RLS | Manca WITH CHECK | aggiungere `WITH CHECK (...)` alla policy |
| `ncSeveritySchema is not defined` | Nome sbagliato | usare `ncSeverityEnum` da nc-ac.schema |
| checklist_items non ha audit_id come FK | Struttura DB | FK è checklist_id; audit_id è denormalizzato |

### RLS policy corretta per INSERT/ALL
```sql
CREATE POLICY "nome" ON tabella FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::uuid))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::uuid));
```

---

## 7. Regole per Agenti

1. Leggi CLAUDE.md e TODO.md prima di iniziare
2. Un task alla volta — esegui → testa → marca [x] → fermati
3. Prima di modificare il DB, verifica colonne esistenti:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'nome' AND table_schema = 'public';
   ```
4. Dopo ogni ALTER TABLE → `NOTIFY pgrst, 'reload schema';`
5. Non aggiungere migration per colonne già esistenti
6. Commit dopo ogni P0 completato

---

## 8. Workflow Agenti

### Un task
```
Leggi CLAUDE.md e TODO.md.
Prendi il primo task [ ] nel CURRENT SPRINT, eseguilo,
marcalo [x] con note, poi fermati e aspetta.
```

### Sprint completo autonomo
```
Leggi CLAUDE.md e TODO.md.
Esegui tutti i task [ ] del CURRENT SPRINT in sequenza.
Per ogni task: esegui → testa → marca [x] → commit → prossimo.
Fermati solo se trovi un errore bloccante.
```

---

## 9. Comandi Utili

```bash
# Rigenera tipi TypeScript
supabase gen types typescript --linked --schema public > src/types/database.types.ts

# Dev server
npm run dev

# Kill processi
kill $(lsof -t -i:3000) && kill $(lsof -t -i:3010)

# Test e2e
npm run test:e2e
```

```sql
-- Verifica colonne
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'nome' AND table_schema = 'public' ORDER BY ordinal_position;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
```