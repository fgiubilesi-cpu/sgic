# CLAUDE.md — SGIC
> Contesto completo per agenti AI. Leggi tutto prima di iniziare qualsiasi task.
> Aggiornato: 2026-03-09 | Sprint 5 completato — 0 errori TypeScript

---

## 1. Progetto

**SGIC** — Sistema di Gestione Ispezioni e Conformità  
Client: Giubilesi Associati (consulenza agri-food, ISO 9001)  
Stack: Next.js 16 App Router + TypeScript strict + Supabase + Tailwind + shadcn/ui + Zod + Sonner  
Porta dev: 3000 (o 3010 se avviato da Claude Code)  
Supabase project_id: `dchmmcnnfpyzemxqgnmb`  
Git tag stabile: `v0.4-sprint5`

### Ruoli utente
- `inspector` / `admin` — Giubilesi (is_platform_owner=true): crea audit, compila checklist, gestisce NC/AC
- `client` — fase 2, accesso read-only al portale

### Struttura navigazione
```
Dashboard     ← centro di controllo con filtri
Audit         ← modulo operativo padre
  [tab] Checklist
  [tab] Non Conformità / AC
    [subtab] Non Conformità
    [subtab] Azioni Correttive
  [tab] Template     ← gestione template organizzazione + import CSV/Excel
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

Seed: organization id `4ed14a8b-a5b5-4933-b83f-a940b4993707`  
Admin id: `c6cc8a13-6e0d-47fd-ab44-8c4093679bd2`

---

## 3. Schema DB — Colonne Importanti

### `audits`
id, title, status, scheduled_date, organization_id, client_id, location_id, score  
⚠️ NON ha `updated_at` — non passarla mai negli update

### `checklists`
id, audit_id, title, organization_id, created_at  
✅ HA organization_id

### `checklist_items`
id, checklist_id, question, outcome, notes, evidence_url, audio_url,  
organization_id, source_question_id, version, sort_order, updated_at, audit_id  
⚠️ `audit_id` è denormalizzato e spesso NULL — NON usarlo per JOIN  
✅ Pattern corretto: `checklist_id` → `checklists.audit_id`

### `non_conformities`
id, audit_id, checklist_item_id, organization_id, title, description,  
severity, status, closed_at, created_at, updated_at, deleted_at, evidence_url

### `corrective_actions`
id, non_conformity_id, organization_id, description, root_cause, action_plan,  
responsible_person_name, responsible_person_email,  
due_date (date), target_completion_date (date),  
status (default 'pending'), updated_at, completed_at, closed_at, deleted_at  
⚠️ NON esistono: `title`, `assigned_to`  
⚠️ Status values reali: `pending` | `in_progress` | `completed`  
⚠️ NON esistono status: closed, verified, open

### `checklist_templates`
id, title, description, organization_id, created_at

### `template_questions`
id, template_id, question, sort_order, weight, deleted_at  
⚠️ Soft delete via deleted_at — mai DELETE fisico

---

## 4. Struttura Cartelle

```
src/
  app/(dashboard)/
    dashboard/
    audits/[id]/
      page.tsx          ← tab via ?tab=checklist|nc|templates, breadcrumb locale cliente/sede
    clients/[id]/
  features/
    audits/
      actions/
        actions.ts                    ← updateChecklistItem (NC auto-create)
        corrective-action-actions.ts  ← createCorrectiveAction, updateCorrectiveAction
        template-actions.ts           ← CRUD template + reorder + import bulk
        audit-completion-actions.ts   ← completeAudit, updateAuditStatus
        export-actions.ts             ← exportAuditToExcel
      queries/
        get-audit.ts                  ← AuditWithChecklists type (ha client_name, location_name)
        get-audits.ts
        get-non-conformities.ts
        get-corrective-actions.ts
      schemas/
        audit-schema.ts
        non-conformity-schema.ts
        template-schema.ts            ← Zod + parseImportedQuestions() CSV/Excel
      components/
        checklist-manager.tsx
        checklist-row.tsx             ← toast mostra result.error specifico
        nc-ac-tab.tsx                 ← subtab NC + AC, Report modal
        template-editor.tsx           ← reorder frecce + import CSV/Excel
        audit-completion-section.tsx  ← compliance score fix Sprint 5
        export-excel-button.tsx
    clients/
    dashboard/
      queries/    → getDashboardStats, getNCGlobal
      components/ → DashboardFilters, NCGlobalTable, AuditTrendChart
    quality/
      schemas/    → nc-ac.schema.ts (ncSeverityEnum, ncStatusEnum)
      constants.ts
  lib/supabase/
    get-org-context.ts
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

### Pattern checklist_items → audit_id (CRITICO)
```typescript
// ❌ SBAGLIATO — audit_id spesso NULL
await supabase.from('checklist_items').select('outcome').eq('audit_id', auditId)

// ✅ CORRETTO — sempre così
const { data: checklists } = await supabase
  .from('checklists').select('id').eq('audit_id', auditId)
const checklistIds = checklists?.map(c => c.id) ?? []
if (checklistIds.length === 0) return /* empty result */
await supabase.from('checklist_items').select('outcome').in('checklist_id', checklistIds)
```

### RLS policy pattern
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

## 6. Errori Noti e Soluzioni

| Errore | Causa | Fix |
|--------|-------|-----|
| Compliance Score 0% | Query usava audit_id denormalizzato | ✅ FIXATO Sprint 5: usa checklist_id→checklists |
| RLS blocca INSERT corrective_actions | get_user_organization_id() ritorna NULL | ✅ FIXATO Sprint 4: usa profiles lookup |
| audits non ha updated_at | Colonna inesistente | non passare updated_at in update su audits |
| checklist_items.audit_id = null | Campo denormalizzato | recuperare da checklists table |
| NC creation error swallowed | console.error invece di return | ✅ FIXATO Sprint 4 |
| AC status "closed"/"verified" | Enum sbagliato | usare: pending, in_progress, completed |
| PGRST204 colonna non trovata | Schema cache | `NOTIFY pgrst, 'reload schema';` |
| Loop createClient | Conflitto import | `import { createClient as createSupabaseClient }` |
| 404 su nuova route | Middleware | aggiungere a isDashboardRoute in middleware.ts |

---

## 7. nc-ac-tab.tsx — Architettura

### Subtab [Non Conformità]
- Tabella NcRow espandibile, badge severità/stato
- AddCaForm inline per ogni NC

### Subtab [Azioni Correttive]  
- AcTable: tutte le AC dell'audit
- Badge scadenza: rosso se due_date < oggi, giallo se entro 7gg (solo se status != completed)
- Dropdown stato: pending → in_progress → completed
- Bottone "✕": completed + setta completed_at
- Bottone "✏️": EditCaForm inline (description, action_plan, root_cause, responsible_person_name, responsible_person_email, due_date)

### Bottone "Genera Report NC-AC"
- Client-side, no API — Modal con textarea readonly + copia negli appunti

---

## 8. Template Management

### Funzionalità implementate
- Lista template organizzazione con contatore domande
- CRUD template (titolo, descrizione)
- Aggiunta/rimozione domande (soft delete)
- Reorder con frecce ↑↓
- Import da CSV ("question"/"domanda") o Excel (SheetJS) con anteprima

---

## 9. Regole per Agenti

1. Leggi CLAUDE.md e TODO.md prima di iniziare
2. Un task alla volta — esegui → testa → marca [x] → fermati
3. Prima di modificare il DB:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'nome' AND table_schema = 'public' ORDER BY ordinal_position;
   ```
4. Dopo ogni ALTER TABLE → `NOTIFY pgrst, 'reload schema';`
5. npx tsc --noEmit dopo ogni modifica TypeScript (deve restare a 0 errori)
6. Commit dopo ogni milestone

---

## 10. Comandi Utili

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

## 11. Backlog Tecnico

- [ ] Fix search_path su funzioni DB (WARN sicurezza — non urgente)
- [ ] Portale cliente (fase 2)
- [ ] PDF report audit
- [ ] Compliance Score — verificare formula con test manuale post Sprint 5