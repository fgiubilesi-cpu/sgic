# SGIC — TODO.md
> Aggiornato: 2026-03-09 | Sprint 4

---

## CURRENT SPRINT — Stabilizzazione + Deploy Ready

### P0 — Fix DB e Sicurezza (fare subito)

- [ ] **DB1** Applicare migration RLS client access: `supabase/migrations/20260309000001_rls_client_access.sql`
- [ ] **DB2** Abilitare RLS su tabelle esposte: `documents`, `risks`, `training_records`, `training_courses`, `personnel`, `document_versions`
- [ ] **DB3** Aggiungere policy su `action_evidence` (RLS abilitata ma zero policies)
- [ ] **DB4** Fix RLS performance: sostituire `auth.uid()` con `(select auth.uid()::uuid)` in tutte le policies
- [ ] **DB5** Rimuovere policy duplicate su `audits` INSERT (`"Users can create audits"` e `audits_insert_policy`)
- [ ] **DB6** Aggiungere indici FK mancanti su: `audits`, `checklist_items`, `non_conformities`, `corrective_actions`, `checklists`

### P1 — Test e Verifica Funzionale

- [ ] **V1** Test manuale flusso completo: login → crea audit → compila checklist → verifica score e NC
- [ ] **V2** Test export Excel: verifica 3 fogli (Checklist, NC, AC) con dati reali
- [ ] **V3** Test cambio stato AC: open → completed → verified → NC chiusa
- [ ] **V4** Test ruolo client: accesso solo ai propri audit, tab Templates nascosto
- [ ] **V5** Test Dashboard KPI con dati reali

### P2 — Errori TypeScript da risolvere

- [ ] **TS1** Fix 5 errori pre-esistenti in `.next/dev/types/routes.d.ts`
- [ ] **TS2** Fix errore in `tests/e2e/audit-workflow.spec.ts` (Playwright)

### P3 — Pulizia e Refactoring

- [ ] **C1** Verificare che i form AC usino campi DB reali: `action_plan`, `responsible_person_name`, `responsible_person_email` (NON `title`/`assigned_to`)
- [ ] **C2** Verificare che `AddCaForm` in `nc-ac-tab.tsx` mappi correttamente sui campi DB reali
- [ ] **C3** Commit pulito con tag `v0.3-sprint4` dopo P0+P1 completati

---

## COMPLETATO ✅

### Sprint 1-3

- [x] Auth login/logout
- [x] Struttura feature-based Next.js
- [x] Multi-tenant organizations + is_platform_owner
- [x] CRUD Clienti e Sedi
- [x] Sidebar navigazione + middleware
- [x] Schema DB: clients, locations, checklists, checklist_items
- [x] createAuditFromTemplate (audits → checklists → checklist_items)
- [x] Lista audit con join cliente/sede
- [x] Pagina dettaglio audit con checklist compilabile
- [x] Score automatico audit
- [x] Generazione NC automatica da risposta NOK
- [x] Fix RLS policies core tables
- [x] Colonne DB: score, organization_id su checklists, sort_order e audit_id su checklist_items
- [x] Fix 18 errori TypeScript (AuditOutcome type, NCsSeverity alias, importazioni)

### P1 — UX Checklist ✅

- [x] **U1** Layout checklist compatto stile tabella (h-11, bordo sinistro per outcome, media hover)
- [x] **U2** Progress bar con colore dinamico (rosso/giallo/verde) e label feedback
- [x] **U3** Badge NC rosso nella riga quando item ha non conformità

### P2 — Flusso NC → AC ✅

- [x] **N1** Risposta NOK genera automaticamente NC (severity=minor, status=open)
- [x] **N2** Lista NC nella pagina audit: tabella compatta con stato, severità, domanda
- [x] **N3** Form creazione AC da NC (description, rootCause, actionPlan, responsabile, dueDate)
- [x] **N4** Cambio stato AC: open → completed → verified
- [x] **N5** Quando AC verified → NC status=closed
- [x] **N6** Dashboard NC globale con filtro per cliente

### P3 — Report Excel ✅

- [x] **R1** Setup exceljs
- [x] **R2** Server Action export con 3 fogli: Checklist + Non Conformità + AC
- [x] **R3** Bottone "Scarica Excel" nella pagina dettaglio audit
- [x] **R4** Fogli separati NC e AC nel report

### P4 — Dashboard Homepage ✅

- [x] **D1** KPI reali: audit questo mese, NC aperte, % compliance 30gg
- [x] **D2** Lista ultimi 5 audit con link diretto
- [x] **D3** Widget audit in scadenza 7 giorni (alert rosso/giallo)

### Extra (non pianificato ma implementato)

- [x] Fase 2 foundation: ruolo client con accesso read-only ai propri audit
- [x] Role-based routing (client → /client-dashboard)
- [x] Storico audit con timeline visuale
- [x] CI/CD GitHub Actions (lint + build + E2E)
- [x] Sidebar con Organization + Settings ripristinata

---

## BACKLOG — Sprint Futuri

- [ ] Notifiche email NC aperte da più di X giorni (Resend)
- [ ] Import checklist da Excel (già sviluppato, da testare)
- [ ] Personalizzazione template per cliente (già sviluppato, da testare)
- [ ] Trascrizione vocale note (Web Speech API)
- [ ] Upload foto allegati (Supabase Storage)
- [ ] Modalità offline base
- [ ] Ricerca globale
- [ ] Filtri avanzati lista audit
- [ ] PDF report audit (nice-to-have)
- [ ] Multi-sito avanzato: dashboard aggregata cross-location per gruppo
- [ ] Portale cliente Fase 2 completo (dopo test Fase 2 foundation)
- [ ] Environment staging separato