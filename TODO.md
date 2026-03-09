# SGIC — TODO.md
> Aggiornato: 2026-03-09 | Sprint 6

---

## CURRENT SPRINT — Test End-to-End + UX

### P0 — Test funzionali end-to-end (fare subito, manualmente)

- [ ] **V1** Test flusso completo audit: crea audit da template → apri → imposta 1 OK + 1 NOK + 1 N/A → verifica score aggiornato + NC auto-creata → tab NC mostra la NC — *RICHIEDE TEST MANUALE*
- [ ] **V2** Test flusso NC→AC: apri NC → aggiungi AC → verifica AC appare nel subtab AC → cambia stato AC → verifica badge scadenza — *RICHIEDE TEST MANUALE*
- [ ] **V3** Test "Genera Report NC-AC": clicca bottone → verifica testo generato corretto → copia negli appunti — *RICHIEDE TEST MANUALE*
- [ ] **V4** Test Template: crea nuovo template → aggiungi domande → reorder ↑↓ → import CSV → import Excel → crea audit da template — *RICHIEDE TEST MANUALE*
- [ ] **V5** Test Export Excel: completa audit → clicca "Esporta Excel" → verifica file scaricato con 3 fogli — *RICHIEDE TEST MANUALE*

### P1 — UX Miglioramenti

- [x] **UX1** Checklist: campo note non si svuota visivamente dopo il salvataggio — fix feedback UI (Sprint 6 — aggiunto toast.success "Note salvate" su save)
- [x] **UX2** Lista audit: aggiungere colonne "Score" e "NC aperte" nella tabella (Sprint 6 — Audit + AuditWithNCCount tipo, query NC count, table columns added)
- [x] **UX3** Dashboard: verificare che KPI "% compliance media" usi dati reali dal DB (Sprint 6 — Verified: getDashboardMetrics calcola avgScore da audit reali, MonthlyKPIs usa complianceAvg da 30gg reali)

### P2 — Dashboard NC Globale

- [x] **D1** Lista tutte le NC aperte di tutti gli audit, filtrabile per cliente/sede (Sprint 6 — GlobalNCTable component, getGlobalNCs() con filtri client/location, status != cancelled)
- [x] **D2** Widget "Audit in scadenza nei prossimi 7 giorni" (Sprint 6 — UpcomingAuditsWidget component, getUpcomingAudits() per prossimi 7 giorni, mostra daysUntil e isOverdue)
- [x] **D3** KPI reali: audit questo mese, NC aperte totali, % compliance media ultimi 30 giorni (Sprint 6 — MonthlyKPIs component, getMonthlyKPIs() calcola: auditsThisMonth, openNCsTotal (globale), complianceAvg ultimi 30gg)

---

## BACKLOG — Sprint Futuri

### Sprint 7 — Portale Cliente (Fase 2)
- [ ] Accesso client read-only con ruolo `client`
- [ ] Dashboard filtrata per client_id
- [ ] Vista audit e NC del proprio cliente

### Sprint 8 — Qualità e Infrastruttura
- [ ] PDF report audit (dopo Excel)
- [ ] CI/CD con GitHub Actions (lint + typecheck + test e2e su PR)
- [ ] Environment staging separato
- [ ] Fix search_path su funzioni DB (WARN sicurezza — non urgente)
- [ ] Ricerca globale
- [ ] Filtri avanzati lista audit
- [ ] Modalità offline base
- [ ] Notifiche email NC aperte da più di X giorni (Resend)

---

## COMPLETATO ✅

### Sprint 1-3
- Auth login/logout, struttura feature-based, multi-tenant
- CRUD Clienti e Sedi, Sidebar + middleware
- createAuditFromTemplate, lista audit, checklist compilabile
- Score automatico, NC auto-create da NOK
- Export Excel (3 fogli), Dashboard KPI base

### Sprint 4
- [x] Fix RLS corrective_actions (policy usava get_user_organization_id() → NULL)
- [x] Fix audit-completion-actions.ts: rimosso updated_at inesistente da audits
- [x] Fix NC creation error swallowed → ora visibile al frontend
- [x] Fix checklist-row.tsx: toast mostra errore specifico
- [x] Refactor nc-ac-tab.tsx: subtab NC + AC, AcTable, EditCaForm, Report modal
- [x] Refactor template-editor.tsx: reorder frecce + import CSV/Excel
- [x] DB Security: RLS su 6 tabelle + 13 indici FK

### Sprint 5
- [x] **B1** Fix Compliance Score: query usa ora checklist_id→checklists.audit_id invece di audit_id denormalizzato
- [x] **B2** Fix Breadcrumb: aggiunto breadcrumb locale in audits/[id]/page.tsx con cliente/sede/titolo
- [x] **UX4** Tab NC badge refresh: aggiunto router.refresh() / revalidatePath dopo operazioni AC
- [x] **TS1** Fix errori TypeScript pre-esistenti in routes.d.ts
- [x] **TS2** Fix errore TypeScript in audit-workflow.spec.ts
- [x] **G1** Commit + tag v0.4-sprint5 pushato su main
- [x] **G2** Rigenerati database.types.ts — 0 errori TypeScript