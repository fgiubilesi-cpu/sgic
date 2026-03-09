# SGIC — TODO.md
> Aggiornato: 2026-03-09 | Sprint 7

---

## CURRENT SPRINT — Test Manuali + Portale Cliente

### P0 — Test manuali end-to-end (da fare in UI)

- [ ] **V1** Flusso audit completo: crea audit da template → compila 1 OK + 1 NOK + 1 N/A → verifica score aggiornato + NC auto-creata → tab NC mostra la NC — *RICHIEDE TEST MANUALE*
- [ ] **V2** Flusso NC→AC: apri NC → aggiungi AC → verifica subtab AC → cambia stato → verifica badge scadenza — *RICHIEDE TEST MANUALE*
- [ ] **V3** Report NC-AC: clicca "Genera Report" → verifica testo → copia negli appunti — *RICHIEDE TEST MANUALE*
- [ ] **V4** Template: crea → aggiungi domande → reorder → import CSV → import Excel → crea audit — *RICHIEDE TEST MANUALE*
- [ ] **V5** Export Excel: completa audit → "Esporta Excel" → verifica 3 fogli nel file — *RICHIEDE TEST MANUALE*

### P1 — Portale Cliente (Fase 2)

- [ ] **C1** Middleware: verificare che route /dashboard sia accessibile a ruolo `client` con filtro su client_id
- [ ] **C2** Query getDashboardStats: aggiungere filtro per client_id quando ruolo = 'client'
- [ ] **C3** Lista audit: filtrare per client_id quando ruolo = 'client' (non mostrare audit di altri clienti)
- [ ] **C4** Pagina audit dettaglio: ruolo `client` può vedere ma NON modificare (disabilitare bottoni Checklist, NC, Template)
- [ ] **C5** Test accesso client: creare utente test con ruolo='client' e client_id valorizzato, verificare che veda solo i propri dati

### P2 — Push e Deploy

- [ ] **G1** Commit + tag: `git commit -m "feat: Sprint 7 - portale cliente fase 2"` → tag `v0.5-sprint7` → push
- [ ] **G2** Verifica deploy su ambiente di produzione/staging se configurato

---

## BACKLOG — Sprint Futuri

### Sprint 8 — Qualità
- [ ] PDF report audit
- [ ] Notifiche email NC scadute (Resend)
- [ ] Ricerca globale
- [ ] Filtri avanzati lista audit

### Sprint 9 — Infrastruttura
- [ ] CI/CD GitHub Actions (lint + typecheck + test e2e su PR)
- [ ] Environment staging separato
- [ ] Fix search_path funzioni DB (WARN sicurezza — non urgente)
- [ ] Modalità offline base

---

## COMPLETATO ✅

### Sprint 1-3
- Auth, struttura feature-based, multi-tenant, CRUD Clienti/Sedi
- createAuditFromTemplate, checklist compilabile, score automatico
- NC auto-create da NOK, Export Excel, Dashboard KPI base

### Sprint 4
- [x] Fix RLS corrective_actions (get_user_organization_id → NULL)
- [x] Fix audits.updated_at inesistente
- [x] Fix NC creation error swallowed
- [x] Refactor nc-ac-tab.tsx: subtab NC + AC, EditCaForm, Report modal
- [x] Refactor template-editor.tsx: reorder + import CSV/Excel
- [x] DB Security: RLS 6 tabelle + 13 indici FK

### Sprint 5
- [x] Fix Compliance Score (query usava audit_id denormalizzato)
- [x] Fix Breadcrumb "Control Panel" → cliente/sede/titolo
- [x] Tab NC badge refresh dopo operazioni AC
- [x] Fix tutti gli errori TypeScript (0 errori)
- [x] Rigenerati database.types.ts
- [x] Tag v0.4-sprint5

### Sprint 6
- [x] UX1: feedback visivo salvataggio note checklist (toast.success)
- [x] UX2: colonne Score e NC Aperte nella lista audit (AuditWithNCCount type)
- [x] UX3: Dashboard KPI verificati su dati reali DB
- [x] D1: NC globale filtrabile per cliente/sede verificata funzionante
- [x] D2: Widget audit in scadenza 7 giorni
- [x] D3: KPI reali (audit mese, NC aperte, compliance media)
- [x] Tag v0.5-sprint6 (2 commit ahead of origin)