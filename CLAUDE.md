# CLAUDE.md — SGIC
> Contesto completo per agenti AI. Leggi tutto prima di iniziare qualsiasi task.

---

## 1. Progetto

**SGIC** — Sistema di Gestione Ispezioni e Conformità  
Client: Giubilesi Associati (consulenza agri-food, ISO 9001)  
Stack: Next.js 16 App Router + TypeScript strict + Supabase + Tailwind + shadcn/ui + Zod + Sonner  
Porta dev: 3000 (o 3010 se avviato da Claude Code)

### Ruoli utente
- `inspector` — Giubilesi (is_platform_owner=true): crea audit, compila checklist, gestisce NC/AC
- `client` — cliente finale: oggi riceve solo report via mail, in futuro accede al portale

### Struttura navigazione (menu laterale sinistro)
```
Dashboard     ← centro di controllo con filtri (cliente, sede, modulo, periodo)
Audit         ← modulo operativo padre
  [tab] Checklist
  [tab] Non Conformità / AC
  [tab] Template
Campionamenti ← futuro
Formazione    ← futuro
```
⚠️ NON esiste più "Qualità" come voce separata — le NC/AC globali vivono nella Dashboard con filtri.

### Report audit (deliverable core)
- Formato primario: **Excel** — checklist completa con domande, outcome, note, allegati media
- Formato secondario: PDF (nice-to-have futuro)
- Sintesi mail: testo bozza auto-generato post-audit con lista NC trovate (helper per ispettore)
- Il report viene ancora revisionato e inviato manualmente dall'ispettore

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
id, audit_id, title, created_at, updated_at  
⚠️ NON ha organization_id — non inserirla mai

### `checklist_items`
id, checklist_id, question, outcome, notes, evidence_url, audio_url, organization_id, source_question_id, version, created_at, updated_at, sort_order integer, audit_id uuid (denormalizzato)  
⚠️ NON ha audit_id come FK reale — è denormalizzato, non usare per join

### `non_conformities`
id, audit_id, checklist_item_id, organization_id, title, description, severity, status, closed_at, created_at

### `corrective_actions`
id, non_conformity_id, organization_id, title, description, assigned_to, due_date, status, closed_at  
- Una NC può avere più AC (1:N), di solito 1:1 nella pratica  
- due_date: opzionale, con reminder visivo UI quando scaduta  
- status: open → in_progress → closed → verified (verifica avviene al prossimo audit)

---

## 4. Infrastruttura Media (evidence_url / audio_url)

`checklist_items` ha già due colonne dedicate ai media:
- `evidence_url` → foto/video (una URL Supabase Storage)
- `audio_url` → nota audio (una URL Supabase Storage)

### Bucket Supabase Storage
- Nome bucket: `checklist-media`
- Path convention: `{organizationId}/{auditId}/{itemId}/evidence.{ext}`
- Path convention: `{organizationId}/{auditId}/{itemId}/audio.webm`
- Accesso: bucket privato, URL firmati con scadenza 1h

### Pattern upload
```typescript
// Upload file su Supabase Storage
const { data, error } = await supabase.storage
  .from('checklist-media')
  .upload(path, file, { upsert: true })

// Ottieni URL firmato
const { data: { signedUrl } } = await supabase.storage
  .from('checklist-media')
  .createSignedUrl(path, 3600)
```

### Aggiornamento item dopo upload
```typescript
await supabase
  .from('checklist_items')
  .update({ evidence_url: signedUrl }) // o audio_url
  .eq('id', itemId)
```

---

## 5. Struttura Cartelle

```
src/
  app/(dashboard)/
    dashboard/          ← centro di controllo con filtri
    audits/[id]/
      page.tsx          ← tab: checklist (default)
      non-conformities/ ← tab: NC/AC
      templates/        ← tab: template checklist
    clients/[id]/
  features/
    audits/
      actions/    → createAuditFromTemplate, updateChecklistItem, updateAuditStatus, autoCreateNC
      queries/    → getAudit, getAudits, getAuditSummary, getNonConformities, getCorrectiveActions
      schemas/    → audit-schema.ts, non-conformity-schema.ts
      components/ → ChecklistManager, AuditStats, NonConformitiesList, AuditStatusBadge,
                    MediaCapture, AudioRecorder, NCAutoCreate
      constants.ts
    clients/
    dashboard/          ← nuovo modulo
      queries/    → getDashboardStats, getNCGlobal, getACAudit
      components/ → DashboardFilters, NCGlobalTable, AuditTrendChart
    quality/            ← mantenuto solo per nc-ac.schema.ts
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

## 7. Errori Noti e Soluzioni

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
| organization_id su checklists | Colonna non esiste | non inserire mai organization_id in checklists |

### RLS policy corretta per INSERT/ALL
```sql
CREATE POLICY "nome" ON tabella FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::uuid))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::uuid));
```

---

## 8. Regole per Agenti

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

## 9. Workflow Agenti

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

## 10. Comandi Utili

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

---

## 11. Backlog Tecnico

- [ ] Rigenera database.types.ts dopo ogni migrazione DB significativa (`supabase gen types typescript --linked --schema public > src/types/database.types.ts`)
- [ ] Portale cliente (fase 2): accesso dashboard filtrata per il proprio client_id
- [ ] PDF report audit (nice-to-have, dopo Excel)
- [ ] Multi-sito avanzato: dashboard aggregata cross-location per gruppo