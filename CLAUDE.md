# CLAUDE.md — SGIC
> Contesto completo per agenti AI. Leggi tutto prima di iniziare qualsiasi task.
> Aggiornato: 2026-03-09 | Sprint 4 completato

---

## 1. Progetto

**SGIC** — Sistema di Gestione Ispezioni e Conformità  
Client: Giubilesi Associati (consulenza agri-food, ISO 9001)  
Stack: Next.js 16 App Router + TypeScript strict + Supabase + Tailwind + shadcn/ui + Zod + Sonner  
Porta dev: 3000 (o 3010 se avviato da Claude Code)  
Supabase project_id: `dchmmcnnfpyzemxqgnmb`

### Ruoli utente
- `inspector` / `admin` — Giubilesi (is_platform_owner=true): crea audit, compila checklist, gestisce NC/AC
- `client` — cliente finale: fase 2, accesso read-only al portale

### Struttura navigazione (menu laterale sinistro)
```
Dashboard     ← centro di controllo con filtri
Audit         ← modulo operativo padre
  [tab] Checklist
  [tab] Non Conformità / AC
    [subtab] Non Conformità
    [subtab] Azioni Correttive
  [tab] Template     ← gestione template organizzazione + import CSV/Excel
Organization  ← dati organizzazione
Campionamenti ← futuro
Formazione    ← futuro
```

### Report audit (deliverable core)
- Formato primario: **Excel** — checklist completa con domande, outcome, note, allegati
- Bottone "Genera Report NC-AC" → testo bozza mail con lista NC+AC (client-side, no API)
- Il report viene revisionato e inviato manualmente dall'ispettore

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
id, title, status, scheduled_date, organization_id, client_id, location_id, score numeric(5,2)  
⚠️ NON ha updated_at — non passarla mai negli update

### `checklists`
id, audit_id, title, organization_id, created_at  
✅ HA organization_id (correzione rispetto a doc precedente)

### `checklist_items`
id, checklist_id, question, outcome, notes, evidence_url, audio_url,  
organization_id, source_question_id, version, sort_order, updated_at, audit_id (denormalizzato)  
⚠️ audit_id è denormalizzato — non usarlo per JOIN → usa checklist_id → checklists.audit_id

### `non_conformities`
id, audit_id, checklist_item_id, organization_id, title, description,  
severity, status, closed_at, created_at, updated_at, deleted_at, evidence_url

### `corrective_actions`
id, non_conformity_id, organization_id, description, root_cause, action_plan,  
responsible_person_name, responsible_person_email,  
due_date (date), target_completion_date (date),  
status (default 'pending'), updated_at, completed_at, closed_at, deleted_at  
⚠️ NON esistono: title, assigned_to  
⚠️ Status values reali: `pending` | `in_progress` | `completed`  
⚠️ NON esistono status: "closed", "verified", "open"

### `checklist_templates`
id, title, description, organization_id, created_at

### `template_questions`
id, template_id, question, sort_order, weight, deleted_at  
⚠️ Soft delete via deleted_at — mai DELETE fisico

---

## 4. Infrastruttura Media

Bucket Supabase Storage: `checklist-media` (privato)  
Path convention: `{organizationId}/{auditId}/{itemId}/evidence.{ext}` o `audio.webm`  
URL firmati con scadenza 1h via createSignedUrl()

---

## 5. Struttura Cartelle

```
src/
  app/(dashboard)/
    dashboard/
    audits/[id]/
      page.tsx          ← tab via query param: ?tab=checklist (default) | ?tab=nc | ?tab=templates
    clients/[id]/
  features/
    audits/
      actions/
        actions.ts                    ← updateChecklistItem (con NC auto-create)
        corrective-action-actions.ts  ← createCorrectiveAction, updateCorrectiveAction
        template-actions.ts           ← CRUD template + reorder + import bulk
        audit-completion-actions.ts   ← completeAudit, updateAuditStatus
        export-actions.ts             ← exportAuditToExcel
      queries/
        get-audit.ts
        get-audits.ts
        get-non-conformities.ts
        get-corrective-actions.ts
      schemas/
        audit-schema.ts
        non-conformity-schema.ts
        template-schema.ts            ← Zod + CSV/Excel parser
      components/
        checklist-manager.tsx
        checklist-row.tsx
        nc-ac-tab.tsx                 ← refactored Sprint 4 (subtab NC + AC)
        template-editor.tsx           ← refactored Sprint 4 (reorder + import)
        audit-completion-section.tsx
        export-excel-button.tsx
      constants.ts
    clients/
    dashboard/
      queries/    → getDashboardStats, getNCGlobal
      components/ → DashboardFilters, NCGlobalTable, AuditTrendChart
    quality/
      schemas/    → nc-ac.schema.ts (ncSeverityEnum, ncStatusEnum)
      constants.ts
  lib/supabase/
    get-org-context.ts  → getOrganizationContext() → { supabase, organizationId, userId } | null
  types/
    database.types.ts   → SOLO tipi TypeScript generati, NON Zod schemas
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

### Supabase joins (sintassi corretta)
```typescript
// ✅ CORRETTO
.select("..., client:client_id(name), location:location_id(name)")
// ❌ SBAGLIATO — non funziona con Supabase
.select("..., clients(name), locations(name)")
```

### Zod schemas
NON importare da database.types.ts. Schemas Zod → `features/{nome}/schemas/`

---

## 7. Errori Noti e Soluzioni

| Errore | Causa | Fix |
|--------|-------|-----|
| RLS blocca INSERT corrective_actions | Policy usava get_user_organization_id() che legge JWT (ritorna NULL) | ✅ FIXATO Sprint 4: policy usa profiles lookup |
| auth.uid() in RLS non funziona | Manca subquery e cast | `(select auth.uid()::uuid)` |
| AC status "closed"/"verified" non esiste | Enum sbagliato | usare: pending, in_progress, completed |
| audits non ha updated_at | Colonna inesistente | rimuovere updated_at dagli update su audits |
| checklist_items.audit_id = null | Campo denormalizzato non affidabile | recuperare audit_id da checklists table |
| PGRST204 colonna non trovata | Schema cache vecchia | `NOTIFY pgrst, 'reload schema';` |
| Loop ricorsivo createClient | Conflitto nome import | `import { createClient as createSupabaseClient }` |
| 404 su nuova route | Middleware non aggiornato | aggiungere a isDashboardRoute in middleware.ts |
| INSERT bloccato RLS | Manca WITH CHECK | aggiungere WITH CHECK alla policy |
| ncSeveritySchema is not defined | Nome sbagliato | usare ncSeverityEnum da nc-ac.schema |

### RLS policy pattern corretto (usare sempre questo)
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

## 8. nc-ac-tab.tsx — Architettura Attuale

### Subtab [Non Conformità]
- Tabella NcRow espandibile con badge severità/stato
- Form inline AddCaForm per aggiungere AC a ogni NC
- Filtro AC per non_conformity_id

### Subtab [Azioni Correttive]
- Tabella AcTable con TUTTE le AC dell'audit
- Colonne: Descrizione | NC Collegata | Responsabile | Scadenza | Stato | Azioni
- Badge scadenza: rosso se due_date < oggi, giallo se entro 7gg (solo se status != completed)
- Dropdown stato inline: pending → in_progress → completed
- Bottone "✕" chiude AC (status=completed, setta completed_at)
- Bottone "✏️" apre EditCaForm inline (6 campi: description, action_plan, root_cause, responsible_person_name, responsible_person_email, due_date)

### Bottone "Genera Report NC-AC"
- Client-side, nessuna API call
- Testo strutturato: audit info + lista NC con AC collegate
- Modal Dialog con textarea readonly + "Copia negli appunti"

---

## 9. Template Management — Implementato Sprint 4

### Funzionalità
- Lista template organizzazione con contatore domande
- Crea/modifica template (titolo, descrizione)
- Aggiunta/rimozione domande (soft delete via deleted_at)
- Reorder domande con frecce ↑↓
- Import bulk da CSV o Excel

### Import CSV/Excel
- CSV: parser manuale, colonna "question" o "domanda" (case-insensitive)
- Excel: SheetJS, fallback su errore
- Flusso: seleziona file → anteprima domande → conferma → salva → reload

### File chiave
- `template-schema.ts`: Zod validation + parseImportedQuestions()
- `template-actions.ts`: addTemplateQuestion, reorderTemplateQuestion, importTemplateQuestions
- `template-editor.tsx`: UI completa

---

## 10. Regole per Agenti

1. Leggi CLAUDE.md e TODO.md prima di iniziare qualsiasi task
2. Un task alla volta — esegui → testa → marca [x] → fermati
3. Prima di modificare il DB, verifica colonne:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'nome' AND table_schema = 'public' ORDER BY ordinal_position;
   ```
4. Dopo ogni ALTER TABLE → `NOTIFY pgrst, 'reload schema';`
5. Non aggiungere migration per colonne già esistenti
6. npx tsc --noEmit dopo ogni modifica TypeScript
7. Commit dopo ogni milestone completata

---

## 11. Comandi Utili

```bash
# Rigenera tipi TypeScript
supabase gen types typescript --linked --schema public > src/types/database.types.ts

# Dev server
npm run dev

# Kill processi porta
kill $(lsof -t -i:3000) && kill $(lsof -t -i:3010)

# TypeScript check
npx tsc --noEmit
```

```sql
-- Verifica colonne tabella
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'nome' AND table_schema = 'public' ORDER BY ordinal_position;

-- Reload schema cache PostgREST
NOTIFY pgrst, 'reload schema';
```

---

## 12. Backlog Tecnico

- [ ] Fix 5 errori TypeScript pre-esistenti in routes.d.ts e audit-workflow.spec.ts
- [ ] Rigenera database.types.ts dopo migrazioni significative
- [ ] Fix search_path su funzioni DB (WARN sicurezza — non urgente)
- [ ] Portale cliente (fase 2): accesso dashboard filtrata per client_id
- [ ] PDF report audit (nice-to-have, dopo Excel)
- [ ] Compliance Score 0% con 3 NOK — verificare calcolo score
- [ ] Breadcrumb "Control Panel" generico — mostrare nome cliente/sede