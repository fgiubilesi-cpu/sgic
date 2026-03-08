# SGIC — TODO.md
> Aggiornato: 2026-03-06 | Sprint 3

---

## CURRENT SPRINT — Stabilità + UX Core

### P0 — Stabilità critica (fare subito)

- [x] **S1** Rimuovere tutti i `console.error` di debug aggiunti in get-audit.ts
- [x] **S2** Cleanup audit di test nel DB (titoli "111", "1111", ecc.) — query SQL — 13 audit eliminati
- [x] **S3** Commit stabile su git con tag `v0.2-stable` dopo P0 completato
- [x] **S4** Verificare che RLS sia riabilitata su `checklists` e `checklist_items` — abilitata
- [x] **S5** Aggiungere a CLAUDE.md tutte le colonne mancanti scoperte oggi — già presenti

### P1 — UX Checklist (in corso)

- [ ] **U1** Layout checklist compatto stile tabella — ogni domanda su una riga ~44px
  - Colonne: # | Domanda | OK | NOK | N/A | Note inline | 📎
  - Righe zebrate, bordo sinistro colorato per stato
  - Note: input inline, non espanso
  - Foto/allegati: icona 📎 nella riga, non bottone visibile sempre
  - Microfono: icona piccola dentro il campo note
- [ ] **U2** Progress bar checklist visibile in cima alla pagina audit (% completamento)
- [ ] **U3** Indicatore visivo NC generate nella riga (es. badge rosso se NOK)

### P2 — Flusso NC → AC (core business)

- [ ] **N1** Verifica che risposta NOK generi automaticamente una NC — test end-to-end
- [ ] **N2** Lista NC nella pagina audit: tabella compatta con stato, severità, domanda collegata
- [ ] **N3** Form creazione AC da NC: titolo, responsabile, scadenza, descrizione
- [ ] **N4** Cambio stato AC: Aperta → In Progress → Chiusa
- [ ] **N5** Quando AC chiusa → NC si aggiorna a "risolta"
- [ ] **N6** Dashboard NC globale: lista tutte le NC aperte di tutti gli audit, filtrabile per cliente

### P3 — Report PDF

- [ ] **R1** Setup `@react-pdf/renderer`
- [ ] **R2** Template report audit: copertina (logo, cliente, sede, data), dati audit, tabella checklist con esiti, sezione NC e AC
- [ ] **R3** Bottone "Scarica PDF" nella pagina dettaglio audit
- [ ] **R4** Possibilità di includere/escludere sezioni nel report (checklist, NC, AC)

### P4 — Dashboard Homepage

- [ ] **D1** KPI reali: audit questo mese, NC aperte totali, % compliance media ultimi 30 giorni
- [ ] **D2** Lista ultimi 5 audit con link diretto
- [ ] **D3** Audit in scadenza nei prossimi 7 giorni (widget alert)

### P5 — Test automatici con Playwright

- [ ] **T1** Setup Playwright (`npm install -D @playwright/test`)
- [ ] **T2** Test login/logout
- [ ] **T3** Test flusso completo: crea audit → apri → compila domande → verifica score e NC
- [ ] **T4** Test CRUD clienti e sedi
- [ ] **T5** Script `npm run test:e2e` configurato in package.json

---

## BACKLOG — Sprint Futuri

- [ ] Notifiche email NC aperte da più di X giorni (Resend)
- [ ] Storico audit per cliente: vista timeline
- [ ] Accesso client read-only (Fase 2 — ruolo `client`)
- [ ] Import checklist da Excel (già sviluppato, da testare)
- [ ] Personalizzazione template per cliente (già sviluppato, da testare)
- [ ] Trascrizione vocale note (Web Speech API — da testare)
- [ ] Upload foto allegati (da testare con Supabase Storage)
- [ ] Modalità offline base (da testare)
- [ ] Ricerca globale
- [ ] Filtri avanzati lista audit
- [ ] CI/CD con GitHub Actions (lint + typecheck + test e2e su PR)
- [ ] Environment staging separato

---

## COMPLETATO ✅

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
- [x] Fix RLS policies
- [x] Colonne DB: score, organization_id su checklists, sort_order e audit_id su checklist_items