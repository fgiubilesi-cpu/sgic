# SGIC — TODO.md
> Aggiornato: 2026-03-09 | Sprint 8

---

## CURRENT SPRINT — Qualità + Test Manuali

### P0 — Test manuali end-to-end (da fare in UI — non automatizzabili)

- [ ] **V1** Flusso audit completo: crea audit da template → compila 1 OK + 1 NOK + 1 N/A → verifica score aggiornato + NC auto-creata → tab NC mostra la NC
- [ ] **V2** Flusso NC→AC: apri NC → aggiungi AC → verifica subtab AC → cambia stato → verifica badge scadenza
- [ ] **V3** Report NC-AC: clicca "Genera Report" → verifica testo generato → copia negli appunti
- [ ] **V4** Template: crea → aggiungi domande → reorder ↑↓ → import CSV → import Excel → crea audit da template
- [ ] **V5** Export Excel: completa audit → "Esporta Excel" → verifica file con 3 fogli
- [ ] **V6** Portale cliente: accedi con utente ruolo='client' → verifica vede solo propri audit → verifica banner "Modalità sola lettura" → verifica bottoni disabilitati

### P1 — PDF Report Audit

- [ ] **R1** Setup `@react-pdf/renderer` (npm install)
- [ ] **R2** Template PDF: copertina (logo, cliente, sede, data) + dati audit + tabella checklist con esiti + sezione NC e AC
- [ ] **R3** Bottone "Scarica PDF" nella pagina dettaglio audit (accanto a "Esporta Excel")
- [ ] **R4** Il PDF è read-only per ruolo client — bottone visibile ma genera report senza dati sensibili se necessario

### P2 — Notifiche Email NC Scadute

- [ ] **E1** Setup Resend (`npm install resend`)
- [ ] **E2** Server action `sendOverdueNcNotification`: trova NC con AC scadute (due_date < oggi, status != 'completed') e invia email al responsible_person_email
- [ ] **E3** Trigger manuale: bottone "Invia notifiche scadute" nella Dashboard (solo per admin/inspector)
- [ ] **E4** Template email: lista NC + AC scadute con link diretto all'audit

### P3 — Ricerca Globale

- [ ] **S1** Input ricerca nella topbar (o sidebar) — cerca in: titoli audit, domande checklist, clienti, NC
- [ ] **S2** Query full-text su Supabase: `ilike` su audit.title, client.name, non_conformities.title
- [ ] **S3** Risultati raggruppati per tipo con link diretto

### P4 — Commit e Tag

- [ ] **G1** `git commit -m "feat: Sprint 8 - PDF report, email notifiche, ricerca globale"` → tag `v0.6-sprint8` → push

---

## BACKLOG — Sprint Futuri

- [ ] CI/CD GitHub Actions (lint + typecheck + test e2e su PR)
- [ ] Environment staging separato
- [ ] Fix search_path funzioni DB (WARN sicurezza — non urgente)
- [ ] Filtri avanzati lista audit (data, stato, score range)
- [ ] Modalità offline base
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