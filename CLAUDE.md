# CLAUDE.md — SGIC
> Contesto completo per agenti AI. Leggi tutto prima di iniziare qualsiasi task.
> Aggiornato: 2026-03-09 | Sprint 7 completato — 0 errori TypeScript — tag v0.5-sprint7

---

## 1. Progetto

**SGIC** — Sistema di Gestione Ispezioni e Conformità  
Client: Giubilesi Associati (consulenza agri-food, ISO 9001)  
Stack: Next.js 16 App Router + TypeScript strict + Supabase + Tailwind + shadcn/ui + Zod + Sonner  
Porta dev: 3000 (o 3010 se avviato da Claude Code)  
Supabase project_id: `dchmmcnnfpyzemxqgnmb`  
Git tag stabile: `v0.5-sprint7`

### Ruoli utente
- `admin` / `inspector` — Giubilesi (is_platform_owner=true): accesso completo
- `client` — accesso read-only filtrato per client_id (implementato Sprint 7)

### Struttura navigazione
```
Dashboard     ← KPI reali + NC globale filtrabile + widget scadenze
Audit         ← modulo operativo
  [tab] Checklist          ← read-only per client
  [tab] Non Conformità / AC
    [subtab] Non Conformità  ← read-only per client
    [subtab] Azioni Correttive ← read-only per client
  [tab] Template           ← read-only per client
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
id, audit_id, title, organization_id, created_at ✅ HA organization_id

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
⚠️ Status reali SOLTANTO: `pending` | `in_progress` | `completed`

### `checklist_templates`
id, title, description, organization_id, created_at

### `template_questions`
id, template_id, question, sort_order, weight, deleted_at  
⚠️ Soft delete via deleted_at — mai DELETE fisico

### `profiles`
id, email, full_name, role, organization_id, client_id  
Ruoli: `admin`, `inspector`, `client`

---

## 4. Portale Cliente — Implementato Sprint 7

### Logica di filtro
```typescript
// In ogni query che deve rispettare il ruolo client
const { data: profile } = await supabase
  .from('profiles')
  .select('role, client_id')
  .eq('id', userId)
  .single()

if (profile.role === 'client' && profile.client_id) {
  query = query.eq('client_id', profile.client_id)
}
```

### Read-only mode
```typescript
// Page level
const isReadOnly = profile.role === 'client'

// Props ai componenti
<ChecklistManager readOnly={isReadOnly} />
<NcAcTab readOnly={isReadOnly} />
<TemplateEditor readOnly={isReadOnly} />
```

### Comportamento read-only
- Banner ambra in cima alla pagina audit: "📋 Modalità sola lettura"
- Bottoni outcome (OK/NOK/N/A): disabilitati + opacity
- Input note: disabilitato + placeholder "Sola lettura"
- Microfono e media: nascosti
- Bottoni Add AC, Edit AC, Close AC: disabilitati/nascosti
- Dropdown stato AC: disabilitato
- Bottoni "Esporta Excel" e "Bozza mail": nascosti
- Sezione completamento audit: nascosta

---

## 5. Struttura Cartelle

```
src/
  app/(dashboard)/
    dashboard/
    audits/[id]/
      page.tsx          ← readOnly prop, breadcrumb locale, tab via ?tab=
    clients/[id]/
  features/
    audits/
      actions/
        actions.ts
        corrective-action-actions.ts
        template-actions.ts
        audit-completion-actions.ts
        export-actions.ts
      queries/
        get-audit.ts                  ← AuditWithChecklists (client_name, location_name)
        get-audits.ts                 ← AuditWithNCCount, filtro client_id per ruolo client
        get-non-conformities.ts
        get-corrective-actions.ts
      schemas/
        audit-schema.ts
        non-conformity-schema.ts
        template-schema.ts
      components/
        checklist-manager.tsx         ← prop readOnly
        checklist-row.tsx             ← prop readOnly, toast errori specifici
        nc-ac-tab.tsx                 ← prop readOnly, subtab NC+AC, Report modal
        template-editor.tsx           ← prop readOnly, reorder + import
        audit-completion-section.tsx  ← nascosta se readOnly
        audit-table.tsx               ← colonne Score + NC Aperte
        export-excel-button.tsx
    clients/
    dashboard/
      queries/    → getDashboardStats (KPI reali, filtrabile per client)
      components/ → DashboardFilters, NCGlobalTable, widget scadenze
    quality/
      schemas/    → nc-ac.schema.ts
      constants.ts
  lib/supabase/
    get-org-context.ts
  types/
    database.types.ts ← rigenerato Sprint 7
```

---

## 6. Pattern Obbligatori

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

### checklist_items → audit (CRITICO)
```typescript
// ❌ MAI — audit_id spesso NULL
.from('checklist_items').eq('audit_id', auditId)

// ✅ SEMPRE
const { data: checklists } = await supabase
  .from('checklists').select('id').eq('audit_id', auditId)
const checklistIds = checklists?.map(c => c.id) ?? []
if (checklistIds.length === 0) return /* empty */
await supabase.from('checklist_items').in('checklist_id', checklistIds)
```

### RLS policy
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

## 7. Errori Noti — Tabella Rapida

| Errore | Fix |
|--------|-----|
| audits non ha updated_at | non passarla negli update |
| checklist_items.audit_id NULL | usa checklist_id→checklists pattern |
| corrective_actions status sbagliato | solo: pending, in_progress, completed |
| RLS corrective_actions blocca INSERT | ✅ fixato Sprint 4 |
| Compliance Score 0% | ✅ fixato Sprint 5 |
| NC creation swallowed | ✅ fixato Sprint 4 |
| PGRST204 | NOTIFY pgrst, 'reload schema'; |
| 404 nuova route | aggiungere a isDashboardRoute in middleware.ts |
| non_conformities query restituisce deleted | aggiungere .is('deleted_at', null) |

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
- [ ] PDF report audit (Sprint 8)
- [ ] Email notifiche NC scadute via Resend (Sprint 8)
- [ ] Ricerca globale (Sprint 8)
- [ ] CI/CD GitHub Actions (Sprint 9)