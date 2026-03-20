# SGIC — TODO.md
> Aggiornato: 2026-03-21 | Sprint 9

---

## CURRENT SPRINT — Sprint 9: Client Filter + Documenti

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
- [ ] **P5** Widget scadenze visite in dashboard (sprint futuro)

## Completato — Sprint 11: Formazione

- [x] **F1** Migrazione: aggiunto `client_id` e `location_id` a `training_courses`
- [x] **F2** Pagina /training con catalogo corsi e registrazioni recenti
- [x] **F4** Voce "Formazione" attivata in sidebar
- [ ] **F3** Pagina /training/[id] con dettaglio corso (sprint futuro)
- [ ] **F5** Scadenze attestati: alert basati su validity_months + completion_date (sprint futuro)

## Completato — Sprint 12: Campionamenti e Analisi

- [x] **S1** Migrazione: aggiunto `client_id`, `location_id`, `title`, `matrix`, `sampling_date`, `status` a `samplings`
- [x] **S2** Pagina /samplings con lista filtrabili per cliente
- [x] **S3** Voce "Campionamenti" attivata in sidebar
- [ ] **S4** Export risultati lab XLS per cliente (sprint futuro)

## Sprint 13+: Knowledge Base

- [ ] Ricerca full-text nei documenti (basata su extracted_text)
- [ ] Cross-reference audit/NC → documenti di riferimento
- [ ] Suggerimento procedure durante compilazione checklist

---

## BACKLOG

- [ ] Ricerca globale: verificare se già funzionante (feature scaffoldata in `src/features/search/`)
- [ ] CI/CD GitHub Actions (lint + typecheck + test e2e su PR)
- [ ] Filtri avanzati lista audit (data, stato, score range)
- [ ] Storico audit per cliente: vista timeline
- [ ] Fix search_path funzioni DB (WARN sicurezza — non urgente)

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