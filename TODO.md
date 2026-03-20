# SGIC — TODO.md
> Aggiornato: 2026-03-09 | Sprint 8

---

## CURRENT SPRINT — Completamento flusso audit end-to-end

### A — Fix critici NC/AC

- [x] **A0** XLS export — già completo (3 fogli: checklist, NC, AC)
- [x] **A0b** Bozza mail post-audit — già completo (testo deterministico da copiare)
- [ ] **A1** Fix AC multipla: permettere l'aggiunta di più AC per la stessa NC
- [ ] **A2** Implementare Delete AC (soft delete con deleted_at)
- [ ] **A3** Cambio stato NC dall'UI (open → pending_verification → closed) nel pannello espanso
- [ ] **A4** Includere AC nel testo bozza mail (attualmente mostra solo NC)

### Test manuali end-to-end (dopo A1-A4)

- [ ] **V1** Flusso audit completo: crea audit da template → compila 1 OK + 1 NOK + 1 N/A → verifica score aggiornato + NC auto-creata → tab NC mostra la NC
- [ ] **V2** Flusso NC→AC: apri NC → aggiungi AC → aggiungi seconda AC → cambia stato NC → verifica badge scadenza
- [ ] **V3** Bozza mail: clicca "Bozza mail" → verifica testo con NC e AC → copia negli appunti
- [ ] **V4** XLS: completa audit → "Esporta Excel" → verifica file con 3 fogli
- [ ] **V5** Template: crea → aggiungi domande → reorder ↑↓ → import CSV → crea audit da template
- [ ] **V6** Portale cliente: accedi con ruolo client → sola lettura → banner corretto

### Commit e Tag

- [ ] **G1** commit + tag `v0.6-sprint8`

---

## BACKLOG — Sprint Futuri

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