# SGIC — TODO.md
> Aggiornato: 2026-03-09 | Sprint 7 ✅ Completato

---

## CURRENT SPRINT — Sprint 8 - Qualità

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

### Sprint 7
- [x] P0 V1-V5: Marked as manual tests (no auto-testing possible)
- [x] P1 C1: Middleware routing already supports client role → /client-dashboard
- [x] P1 C2: Modified get-audits.ts to filter by client_id for client role users
- [x] P1 C3: Audit list filtering by client_id completed via C2
- [x] P1 C4: Implemented read-only UI mode:
  - Added read-only banner on audit detail page
  - Disabled checklist outcome buttons, notes, speech, media
  - Disabled NC/AC management (Add AC, status changes, edit)
  - Hid export and email draft for client role
  - Passed readOnly prop through component hierarchy
- [x] P1 C5: TypeScript verification complete (0 errors)
- [x] P2 G1: Commit c27fefd with tag v0.5-sprint7 pushed to main
- [x] P2 G2: GitHub push successful
- [x] Regenerated database.types.ts with latest schema