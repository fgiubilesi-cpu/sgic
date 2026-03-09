# CLAUDE.md — SGIC
> Contesto completo per agenti AI. Leggi tutto prima di iniziare qualsiasi task.
> Aggiornato: 2026-03-09 | Sprint 6 completato — 0 errori TypeScript — tag v0.5-sprint6

---

## 1. Progetto

**SGIC** — Sistema di Gestione Ispezioni e Conformità  
Client: Giubilesi Associati (consulenza agri-food, ISO 9001)  
Stack: Next.js 16 App Router + TypeScript strict + Supabase + Tailwind + shadcn/ui + Zod + Sonner  
Porta dev: 3000 (o 3010 se avviato da Claude Code)  
Supabase project_id: `dchmmcnnfpyzemxqgnmb`  
Git tag stabile: `v0.5-sprint6`

### Ruoli utente
- `inspector` / `admin` — Giubilesi (is_platform_owner=true): accesso completo
- `client` — fase 2: read-only filtrato per client_id

### Struttura navigazione
```
Dashboard     ← KPI reali + NC globale filtrabile + widget scadenze
Audit         ← modulo operativo
  [tab] Checklist
  [tab] Non Conformità / AC
    [subtab] Non Conformità
    [subtab] Azioni Correttive
  [tab] Template     ← CRUD + reorder + import CSV/Excel
Organization
Campionamenti ← futuro
Formazione    ← futuro
```

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

Seed: org id `4ed14a8b-a5b5-4933-b83f-a940b4993707` | admin id `c6cc8a13-6e0d-47fd-ab44-8c4093679bd2`

---

## 3. Schema DB — Colonne Importanti

### `audits`
id, title, status, scheduled_date, organization_id, client_id, location_id, score  
⚠️ NON ha `updated_at`

### `checklists`
id, audit_id, title, organization_id, created_at  
✅ HA organization_id

### `checklist_items`
id, checklist_id, question, outcome, notes, evidence_url, audio_url,  
organization_id, source_question_id, version, sort_order, updated_at, audit_id  
⚠️ `audit_id` denormalizzato e spesso NULL — NON usarlo per query  
✅ Pattern corretto: `checklist_id` → `checklists.audit_id`

### `non_conformities`
id, audit_id, checklist_item_id, organization_id, title, description,  
severity, status, closed_at, created_at, updated_at, deleted_at, evidence_url  
⚠️ Filtrare sempre `deleted_at IS NULL`

### `corrective_actions`
id, non_conformity_id, organization_id, description, root_cause, action_plan,  
responsible_person_name, responsible_person_email,  
due_date (date), target_completion_date (date),  
status (default 'pending'), updated_at, completed_at, closed_at, deleted_at  
⚠️ NON esistono: `title`, `assigned_to`  
⚠️ Status reali: `pending` | `in_progress` | `completed` SOLTANTO

### `checklist_templates`
id, title, description, organization_id, created_at

### `template_questions`
id, template_id, question, sort_order, weight, deleted_at  
⚠️ Soft delete via deleted_at

### `profiles`
id, email, full_name, role, organization_id, client_id  
Ruoli: `admin`, `inspector`, `client`

---

## 4. Struttura Cartelle

```
src/
  app/(dashboard)/
    dashboard/          ← KPI reali, NC globale, widget scadenze
    audits/[id]/
      page.tsx          ← breadcrumb locale cliente/sede, tab via ?tab=
    clients/[id]/
  features/
    audits/
      actions/
        actions.ts                    ← updateChecklistItem (NC auto-create)
        corrective-action-actions.ts  ← createCorrectiveAction, updateCorrectiveAction
        template-actions.ts           ← CRUD + reorderTemplateQuestion + importTemplateQuestions
        audit-completion-actions.ts
        export-actions.ts
      queries/
        get-audit.ts                  ← AuditWithChecklists (client_name, location_name)
        get-audits.ts                 ← AuditWithNCCount type (score, nc_count)
        get-non-conformities.ts
        get-corrective-actions.ts
      schemas/
        audit-schema.ts
        non-conformity-schema.ts
        template-schema.ts            ← Zod + parseImportedQuestions()
      components/
        checklist-manager.tsx
        checklist-row.tsx             ← toast specifico + feedback note
        nc-ac-tab.tsx                 ← subtab NC+AC, EditCaForm, Report modal
        template-editor.tsx           ← reorder + import
        audit-completion-section.tsx  ← compliance score (fix Sprint 5)
        audit-table.tsx               ← colonne Score + NC Aperte (Sprint 6)
        export-excel-button.tsx
    clients/
    dashboard/
      queries/    → getDashboardStats (KPI reali), getNCGlobal (filtrabile)
      components/ → DashboardFilters, NCGlobalTable, AuditTrendChart, widget scadenze
    quality/
      schemas/    → nc-ac.schema.ts
      constants.ts
  lib/supabase/
    get-org-context.ts  → getOrganizationContext() → { supabase, organizationId, userId }
  types/
    database.types.ts   ← rigenerato Sprint 5, 0 errori TS
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
// ✅ CORRETTO
.select("..., client:client_id(name), location:location_id(name)")
// ❌ SBAGLIATO
.select("..., clients(name), locations(name)")
```

### checklist_items → audit (pattern obbligatorio)
```typescript
// ❌ MAI così — audit_id spesso NULL
.from('checklist_items').select('outcome').eq('audit_id', auditId)

// ✅ SEMPRE così
const { data: checklists } = await supabase
  .from('checklists').select('id').eq('audit_id', auditId)
const checklistIds = checklists?.map(c => c.id) ?? []
if (checklistIds.length === 0) return /* empty */
await supabase.from('checklist_items').select('outcome').in('checklist_id', checklistIds)
```

### RLS policy (pattern standard)
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

## 6. Errori Noti — Tabella Rapida

| Errore | Fix |
|--------|-----|
| audits non ha updated_at | non passarla negli update |
| checklist_items.audit_id NULL | usa checklist_id→checklists pattern |
| corrective_actions status sbagliato | solo: pending, in_progress, completed |
| RLS corrective_actions blocca INSERT | ✅ fixato Sprint 4 — usa profiles lookup |
| Compliance Score 0% | ✅ fixato Sprint 5 — usa checklist_id pattern |
| NC creation swallowed | ✅ fixato Sprint 4 — ritorna errore visibile |
| PGRST204 | NOTIFY pgrst, 'reload schema'; |
| 404 nuova route | aggiungere a isDashboardRoute in middleware.ts |

---

## 7. Portale Cliente — Specifiche (Fase 2, Sprint 7)

Quando ruolo = 'client':
- Vedere solo audit del proprio `client_id`
- NON modificare checklist, NC, AC, template
- Dashboard filtrata per il proprio client_id
- Middleware deve permettere accesso a /dashboard alle route audit

Implementazione:
- `getOrganizationContext()` già disponibile con userId
- Query deve fare JOIN su `profiles` per recuperare `client_id` se ruolo = 'client'
- Bottoni di modifica disabilitati via props `readOnly={role === 'client'}`

---

## 8. Regole per Agenti

1. Leggi CLAUDE.md e TODO.md prima di qualsiasi task
2. Un task alla volta — esegui → verifica → marca [x] → fermati
3. Prima di modificare DB: verifica colonne con information_schema
4. Dopo ALTER TABLE: `NOTIFY pgrst, 'reload schema';`
5. npx tsc --noEmit dopo ogni modifica — deve restare a 0 errori
6. non_conformities: filtrare sempre `deleted_at IS NULL`
7. Commit dopo ogni milestone

---

## 9. Comandi Utili

```bash
npm run dev
npx tsc --noEmit
kill $(lsof -t -i:3000) && kill $(lsof -t -i:3010)
supabase gen types typescript --linked --schema public > src/types/database.types.ts
```

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'nome' AND table_schema = 'public' ORDER BY ordinal_position;
NOTIFY pgrst, 'reload schema';
```

---

## 10. Backlog Tecnico

- [ ] Fix search_path funzioni DB (WARN sicurezza — non urgente)
- [ ] PDF report audit
- [ ] CI/CD GitHub Actions
- [ ] Notifiche email NC scadute (Resend)