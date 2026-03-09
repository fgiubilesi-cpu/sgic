# SGIC — TODO.md
> Aggiornato: 2026-03-09 | Sprint 5

---

## CURRENT SPRINT — Test, Pulizia, UX

### P0 — Test funzionali end-to-end (fare subito)

- [ ] **V1** Test flusso completo audit: crea audit da template → apri → imposta 1 OK + 1 NOK + 1 N/A → verifica score aggiornato + NC auto-creata → tab NC mostra la NC
- [ ] **V2** Test flusso NC→AC: apri NC → aggiungi AC → verifica AC appare nel subtab AC → cambia stato AC → verifica badge scadenza
- [ ] **V3** Test "Genera Report NC-AC": clicca bottone → verifica testo generato corretto → copia negli appunti
- [ ] **V4** Test Template: crea nuovo template → aggiungi domande → reorder ↑↓ → import CSV → import Excel → crea audit da template
- [ ] **V5** Test Export Excel: completa audit → clicca "Esporta Excel" → verifica file scaricato con 3 fogli

### P1 — Bug noti da investigare

- [x] **B1** Compliance Score mostra 0% anche con 3 NOK — verificare calcolo in audit-completion-section.tsx
  Ipotesi: il calcolo conta solo `compliant` e ignora `non_compliant` nel denominatore
  **Fix**: Query checklist_items via checklist_id join (audit_id denormalizzato)
- [x] **B2** Breadcrumb mostra "Control Panel" invece di nome cliente/sede — trovare e correggere il componente breadcrumb in audits/[id]/page.tsx
  **Fix**: Aggiunto breadcrumb locale in /audits/[id]/page.tsx con Audit > Client > Location > Title

### P2 — Errori TypeScript pre-esistenti

- [x] **TS1** Fix 5 errori in routes.d.ts (pre-esistenti, non introdotti da Sprint 4)
  **Fix**: Escluso .next/dev/types/**/*.ts da tsconfig.json include (file generato auto)
- [x] **TS2** Fix 1 errore in audit-workflow.spec.ts (Playwright — pre-esistente)
  **Fix**: .click({nth}) → .locator().nth(index).click() sintassi corretta

### P3 — UX Miglioramenti

- [ ] **UX1** Checklist: note salvate ma campo non si svuota visivamente dopo il salvataggio — fix feedback UI
- [ ] **UX2** Lista audit: aggiungere colonna "Score" e "NC aperte" nella tabella audit
- [ ] **UX3** Dashboard: KPI "% compliance media ultimi 30 giorni" — verificare che usi dati reali dal DB
- [x] **UX4** Tab NC badge contatore non si aggiorna in real-time dopo aggiunta AC — fix con router.refresh() o revalidatePath
  **Verificato**: revalidatePath() è già in createCorrectiveAction, updateCorrectiveAction, completeCorrectiveAction

### P4 — Commit e Tag

- [x] **G1** Commit stabile con tutti i fix Sprint 5: `208ef78` → tag `v0.4-sprint5` → git push origin main --tags ✅
- [x] **G2** Rigenera database.types.ts: `supabase gen types typescript --linked --schema public > src/types/database.types.ts` ✅
  **Risultato**: 0 TypeScript errors, dev server online

---

## BACKLOG — Sprint Futuri

### Sprint 6 — Dashboard e Notifiche
- [ ] Dashboard NC globale: lista tutte le NC aperte di tutti gli audit, filtrabile per cliente/sede
- [ ] Widget "Audit in scadenza nei prossimi 7 giorni"
- [ ] KPI reali: audit questo mese, NC aperte totali, % compliance media
- [ ] Notifiche email NC aperte da più di X giorni (Resend)

### Sprint 7 — Portale Cliente (Fase 2)
- [ ] Accesso client read-only con ruolo `client`
- [ ] Dashboard filtrata per client_id
- [ ] Vista audit e NC del proprio cliente

### Sprint 8 — Qualità e Infrastruttura
- [ ] PDF report audit (dopo Excel)
- [ ] CI/CD con GitHub Actions (lint + typecheck + test e2e su PR)
- [ ] Environment staging separato
- [ ] Fix search_path su funzioni DB (WARN sicurezza)
- [ ] Ricerca globale
- [ ] Filtri avanzati lista audit
- [ ] Modalità offline base

---

## COMPLETATO ✅

### Sprint 1-3
- Auth login/logout
- Struttura feature-based Next.js
- Multi-tenant organizations + is_platform_owner
- CRUD Clienti e Sedi
- Sidebar navigazione + middleware
- Schema DB completo
- createAuditFromTemplate
- Lista audit con join cliente/sede
- Pagina dettaglio audit con checklist compilabile
- Score automatico audit
- Generazione NC automatica da risposta NOK
- Fix RLS policies
- Export Excel (3 fogli: checklist, NC, AC)
- Dashboard KPI base
- Fase 2 client read-only (struttura)

### Sprint 4
- [x] **DB** Fix RLS corrective_actions (policy usava get_user_organization_id() → NULL)
- [x] **BUG-1** Fix audit-completion-actions.ts: rimosso updated_at da update su audits (colonna inesistente)
- [x] **BUG-2** Fix updateChecklistItem: errore NC creation ora visibile al frontend invece di swallowato
- [x] **BUG-3** Fix checklist-row.tsx: toast mostra result.error specifico invece di messaggio generico
- [x] **NC/AC Tab** Refactor completo nc-ac-tab.tsx:
  - Subtab interni [Non Conformità] e [Azioni Correttive]
  - AcTable con dropdown stato, badge scadenza, bottone chiudi, form edit inline
  - Bottone "Genera Report NC-AC" con modal e copia negli appunti
- [x] **Template** Refactor template-editor.tsx con reorder frecce + import CSV/Excel
- [x] **DB Security** RLS abilitata su documents, risks, personnel, training_courses, training_records, document_versions + 13 indici FK aggiunti