# SGIC — TODO.md
> Aggiornato: 2026-03-28 | Sprint 20

---

## CURRENT SPRINT — Sprint 20: Stabilizzazione crash clienti + sessione

> In corso. Focus: fermare i crash da schema non allineato e impedire logout/freeze su errori dati.

- [x] **FIX-CLIENTS-1** Migration SQL per `clients.deleted_at` + contratto tipi aggiornato
- [x] **FIX-CLIENTS-2** Fallback applicativo sui read path critici (`my-day`, `management`, `documents`, `organization`) finché il DB non applica la migration
- [x] **AUTH-1** Middleware Supabase attivato a livello app per refresh sessione coerente
- [x] **AUTH-2** `getOrganizationContext()` distingue errore auth da errore dati, evitando redirect impropri a `/login`
- [x] **ROUTES-1** Alias legacy `/normative` → `/regulatory` e `/organizzazione` → `/organization`
- [x] **UX-1** Sidebar ripensata per cluster operativi (`Workspace`, `Operativita`, `Contesto`, `Sistema`) con `Audit` e `Campionamenti` nello stesso blocco

---

## CURRENT SPRINT — Sprint 19: Knowledge Base contestuale

> Completato. Motore KB condiviso attivo tra ricerca, NC e checklist.

- [x] **KB-1** Full-text search nei documenti con snippet e ranking (`document_ingestions.extracted_text` + `/api/knowledge/search`)
- [x] **KB-2** Cross-reference NC → riferimenti normativi suggeriti con apertura documento e collegamento one-click
- [x] **KB-3** Suggerimento procedure durante compilazione checklist con pulsante info e apertura automatica su `NOK`
- [x] `npx tsc --noEmit` → 0 errori
- [x] `npm run verify:release` → build green

---

## CURRENT SPRINT PRECEDENTE — Sprint 18: Filtri avanzati + Knowledge Base

> Completato. Tag: v1.2-sprint18

- [x] **FIX-NC** Bug NC count: aggiunto `deleted_at IS NULL` in `get-audits.ts`
- [x] **FILTER-DATE** Date range picker (dateMin/dateMax) nella toolbar audit
- [x] **KB-1** Base full-text search nei documenti (`document_ingestions.extracted_text`)
- [x] **KB-2** Base cross-reference NC → documenti: tabella `nc_documents` + panel in NC detail
- [x] **KB-3** Base suggerimento procedure durante compilazione checklist (`SuggestedDocumentsRow`)
- [x] `npx tsc --noEmit` → 0 errori
- [x] Tag `v1.2-sprint18`

---

## CURRENT SPRINT PRECEDENTE — Sprint 14: Test e2e + Ricerca + Fix DB

> Completato. Prossimo: Sprint 15 (dashboard scadenze unificata).

### Test manuali end-to-end — verifica codice (Sprint 14)

> Verifica a livello codice eseguita 2026-03-21. Test browser manuali da eseguire in sessione dal vivo.

- [x] **V1** Flusso audit completo — PASS (codice verificato: create-audit-sheet, checklist-manager, checklist-row OK/NOK/NA, NC auto-create da NOK, score aggiornato)
- [x] **V2** Flusso NC→AC — PASS (codice verificato: nc-ac-tab, corrective-action-form, corrective-action-actions con stati pending/in_progress/completed)
- [x] **V3** Bozza mail — PASS (codice verificato: email-draft-modal, email-draft-actions)
- [x] **V4** XLS 3 fogli — PASS (codice verificato: export-actions usa ExcelJS con 3 fogli Checklist/NC/AC)
- [x] **V5** Template — PASS (codice verificato: template-editor-form, template-actions, import-template-sheet CSV)
- [x] **V6** Portale cliente read-only — PASS (codice verificato: readOnly prop propagata, banner ambra, bottoni disabilitati)

### SEARCH — Ricerca globale

- [x] Scaffold verificato in `src/features/search/` — già funzionante
- [x] Pagina `/search` attiva con risultati raggruppati per tipo
- [x] `GlobalSearchLauncher` già presente nel layout header (topbar)
- [x] Query ilike su: audits, clients, locations, personnel, documents con filtro ruolo client

### DB-FIX — Fix search_path funzioni DB

- [x] Verifica eseguita: tutte le 10 funzioni DB già hanno `search_path=public`
- [x] Nessun warning search_path nei security advisors (solo: leaked password protection — non pertinente)

### Verifica finale Sprint 14

- [x] `npx tsc --noEmit` → 0 errori
- [x] Tag `v0.8-sprint14`

---

## CURRENT SPRINT PRECEDENTE — Sprint 13: Completamento moduli esistenti — Parte 1

> Tutti completati.

---

## Completato — Sprint 9: Client Filter + Documenti

### Completato in Sprint 9

- [x] **CF1** Componente ClientFilter globale in header (dropdown + URL params)
- [x] **CF2** Query get-clients-list per opzioni filtro
- [x] **D1** Pagina /documents con tabella, KPI strip, filtro per cliente
- [x] **D2** Nav link "Documenti" attivato in sidebar
- [x] **D3** Nav link "Personale" attivato in sidebar

### Fix tecnici Sprint 9

- [x] Fix `import { type Foo }` → `import type { Foo }` su 22 file (webpack compat)
- [x] Eliminati 38 file duplicati (spazio nel nome)
- [x] Eliminati 6 file extensionless (parse error webpack)
- [x] Creata tabella `checklist_item_media` su Supabase
- [x] Fix audio-recorder.tsx type error
- [x] Build 0 errori TypeScript

### Test manuali end-to-end (da Sprint 8, ancora da validare)

- [ ] **V1** Flusso audit completo: crea audit da template → compila 1 OK + 1 NOK + 1 N/A → verifica score aggiornato + NC auto-creata → tab NC mostra la NC
- [ ] **V2** Flusso NC→AC: apri NC → aggiungi AC → aggiungi seconda AC → cambia stato NC → verifica badge scadenza
- [ ] **V3** Bozza mail: clicca "Bozza mail" → verifica testo con NC e AC → copia negli appunti
- [ ] **V4** XLS: completa audit → "Esporta Excel" → verifica file con 3 fogli
- [ ] **V5** Template: crea → aggiungi domande → reorder ↑↓ → import CSV → crea audit da template
- [ ] **V6** Portale cliente: accedi con ruolo client → sola lettura → banner corretto

---

## Completato — Sprint 10: Personale + Visite Mediche

- [x] **P1** Tabella `medical_visits` (personnel_id, visit_date, expiry_date, fitness_status, doctor, protocol)
- [x] **P2** Tab visite mediche nella scheda personale (/personnel/[id])
- [x] **P3** Pagina /personnel con filtro per cliente e KPI strip
- [x] **P4** Cross-link formazione nella scheda personale (già presente)
- [x] **P5** Widget scadenze visite in dashboard (Sprint 13)

## Completato — Sprint 11: Formazione

- [x] **F1** Migrazione: aggiunto `client_id` e `location_id` a `training_courses`
- [x] **F2** Pagina /training con catalogo corsi e registrazioni recenti
- [x] **F4** Voce "Formazione" attivata in sidebar
- [x] **F3** Pagina /training/[id] con dettaglio corso (Sprint 13)
- [x] **F5** Scadenze attestati: widget dashboard 90gg + KPI strip in /training (Sprint 13)

## Completato — Sprint 12: Campionamenti e Analisi

- [x] **S1** Migrazione: aggiunto `client_id`, `location_id`, `title`, `matrix`, `sampling_date`, `status` a `samplings`
- [x] **S2** Pagina /samplings con lista filtrabili per cliente
- [x] **S3** Voce "Campionamenti" attivata in sidebar
- [x] **S4** Export risultati lab XLS per cliente (Sprint 13)

## Completato — Sprint 13: Completamento moduli esistenti — Parte 1

- [x] **P5** Widget scadenze visite in dashboard (Sprint 13)
- [x] **F3** Pagina /training/[id] con dettaglio corso (Sprint 13)
- [x] **F5** Scadenze attestati: widget dashboard 90gg + KPI strip in /training (Sprint 13)
- [x] **S4** Export risultati lab XLS per cliente (Sprint 13)

## Completato — Sprint 15: Dashboard scadenze unificata

- [x] **DEADLINES-1** Pagina /deadlines con vista unificata (visite mediche + attestati + audit + documenti + AC)
- [x] **DEADLINES-2** Filtri tipo + urgenza client-side + semaforo per riga + ordinamento urgenza
- [x] **DEADLINES-3** KPI strip scadute/entro 30gg/entro 90gg/in regola — cliccabili → filtrano tabella
- [x] Link "Scadenze" aggiunto in sidebar (layout.tsx)
- [x] `npx tsc --noEmit` → 0 errori
- [x] Tag `v0.9-sprint15`

## Completato — Sprint 16: Notifiche email (Resend)

- [x] **EMAIL-1** Setup `resend` package + `RESEND_API_KEY` in .env.local (placeholder) + template HTML G&A
- [x] **EMAIL-2** Server action `sendDeadlinesSummaryAction` + bottone "Invia riepilogo scadenze" in /deadlines
- [x] **EMAIL-3** Server action `sendAuditReportAction` + bottone "Invia report al cliente" in /audits/[id]
- [x] **EMAIL-4** Server action `sendOverdueACNotificationsAction` + bottone "Notifica AC scadute" in /deadlines
- [x] `npx tsc --noEmit` → 0 errori
- [x] Tag `v1.0-sprint16`

> ⚠️ Richiede: aggiungere chiave reale in `.env.local` → `RESEND_API_KEY=re_...`
> ⚠️ Richiede: aggiornare `RESEND_FROM_EMAIL` con dominio verificato su Resend

## Completato — Sprint 17: Integrazione FileMaker (lettura)

- [x] **FM-1** Client FM Data API (`src/lib/filemaker/fm-client.ts`) + script import clienti/sedi
- [x] **FM-2** Script import persone e visite mediche da FM
- [x] **FM-3** Pagina `/admin/fm-sync` (solo admin): bottone sync, log risultati, gestione errori
- [x] **FM-4** Widget "Attività G&A" nella scheda cliente `/clients/[id]` — live da FM con fallback
- [x] Migrazione DB: colonna `fm_record_id text` su `clients`, `locations`, `personnel` + indici
- [x] `database.types.ts` rigenerato
- [x] `npx tsc --noEmit` → 0 errori
- [x] Tag `v1.1-sprint17`

> ⚠️ Richiede: FM_HOST, FM_DATABASE, FM_USERNAME, FM_PASSWORD in `.env.local`
> ⚠️ Aggiustare nomi layout/campi in `src/lib/filemaker/fm-client.ts` → `FM_LAYOUTS` e `FM_FIELDS`

## Sprint 14+: Knowledge Base

- [x] Ricerca full-text nei documenti (basata su extracted_text)
- [x] Cross-reference audit/NC → documenti di riferimento
- [x] Suggerimento procedure durante compilazione checklist

---

## BACKLOG

- [x] Ricerca globale: funzionante — /search con ilike multi-tabella + launcher nel topbar
- [x] Fix search_path funzioni DB: tutte le funzioni già hanno search_path=public
- [ ] CI/CD GitHub Actions (lint + typecheck + test e2e su PR)
- [ ] Filtri avanzati lista audit (data, stato, score range)
- [ ] Storico audit per cliente: vista timeline

---

## COMPLETATO ✅

### Sprint 1-3
- Auth, struttura feature-based, multi-tenant, CRUD Clienti/Sedi
- createAuditFromTemplate, checklist compilabile, score automatico
- NC auto-create da NOK, Export Excel, Dashboard KPI base

### Sprint 4
- [x] Fix RLS corrective_actions
- [x] Fix audits.updated_at inesistente
- [x] Fix NC creation error swallowed
- [x] Refactor nc-ac-tab.tsx: subtab NC+AC, EditCaForm, Report modal
- [x] Refactor template-editor.tsx: reorder + import CSV/Excel
- [x] DB Security: RLS 6 tabelle + 13 indici FK

### Sprint 5
- [x] Fix Compliance Score (checklist_id pattern)
- [x] Fix Breadcrumb → cliente/sede/titolo
- [x] Tab NC badge refresh
- [x] 0 errori TypeScript — database.types.ts rigenerato
- [x] Tag v0.4-sprint5

### Sprint 6
- [x] UX note checklist (toast feedback)
- [x] Lista audit: colonne Score + NC Aperte
- [x] Dashboard KPI reali, NC globale, widget scadenze
- [x] Tag v0.5-sprint6

### Sprint 7
- [x] **C1** Middleware: route /dashboard accessibile a ruolo client
- [x] **C2** Query dashboard filtrata per client_id
- [x] **C3** Lista audit filtrata per client_id (ruolo client vede solo propri audit)
- [x] **C4** Pagina audit read-only: banner + bottoni disabilitati (ChecklistRow, NcAcTab, template)
- [x] **C5** TypeScript 0 errori verificato
- [x] database.types.ts rigenerato
- [x] Tag v0.5-sprint7
