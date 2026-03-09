# SGIC — TODO.md
> Aggiornato: 2026-03-08 | Sprint 3

---

## CURRENT SPRINT — Stabilità + UX Core

### P0 — Stabilità critica ✅ COMPLETATO

- [x] **S1** Rimuovere tutti i `console.error` di debug aggiunti in get-audit.ts
- [x] **S2** Cleanup audit di test nel DB (titoli "111", "1111", ecc.) — query SQL — 13 audit eliminati
- [x] **S3** Commit stabile su git con tag `v0.2-stable` dopo P0 completato
- [x] **S4** Verificare che RLS sia riabilitata su `checklists` e `checklist_items` — abilitata
- [x] **S5** Aggiungere a CLAUDE.md tutte le colonne mancanti scoperte oggi — già presenti

### P1 — UX Checklist

- [x] **U1** Layout checklist compatto stile tabella — ogni domanda su una riga ~44px
  - Colonne: # | Domanda | OK | NOK | N/A | Note inline | 📎
  - Righe zebrate, bordo sinistro colorato per stato (verde=OK, rosso=NOK, grigio=N/A, bianco=pending)
  - Note: input inline, non espanso
  - Foto/allegati: icona 📎 nella riga, non bottone visibile sempre
  - Microfono: icona piccola dentro il campo note
  - ✅ Implementato: bordo sinistro by outcome + media icons opacity-0/group-hover:opacity-100
- [x] **U2** Progress bar checklist visibile in cima alla pagina audit (% completamento)
  - ✅ Implementato: colore dinamico (rosso <50%, giallo 50-80%, verde >80%)
  - ✅ Label feedback: "Appena iniziato", "A metà strada", "Quasi finito!"
  - ✅ Transizione smooth 500ms (transition-all duration-500 ease-out)
  - ✅ Altezza aumentata: h-3 (da h-2)
- [x] **U3** Indicatore visivo NC generate nella riga (es. badge rosso se NOK)
  - ✅ Già implementato: badge "NC" rosso mostra quando hasNc === true (NC effettivamente creata per l'item)

### P2 — Flusso NC → AC (core business)

- [x] **N1** Verifica che risposta NOK generi automaticamente una NC — test end-to-end
  - ✅ **Logica verificata**: Flow completo implementato in updateChecklistItem (actions.ts linee 86-139)
  - ✅ **Bug critici corretti**:
    - Linea 106: `severity: 'medium'` → `'minor'` (enum non accettava 'medium')
    - Linea 128: `status: 'cancelled'` → `'closed'` (enum non accettava 'cancelled')
  - ✅ **Integrazione verificata**:
    - getNonConformitiesByAudit: fetches NC per audit con join su checklist_items
    - ChecklistManager: crea ncItemIds Set da prop nonConformities
    - ChecklistRow: mostra badge NC quando hasNc=true, riceve ncCreated/ncCancelled feedback
    - Audit page: fetches nonConformities in parallel, passa a ChecklistManager
  - ✅ **Compilazione**: Zero errori TypeScript dopo fix
  - ✅ **Flusso end-to-end**: outcome='non_compliant' → crea NC con severity='minor' + status='open' → badge appears → quando outcome cambia → NC chiuso (status='closed')
- [x] **N2** Lista NC nella pagina audit: tabella compatta con stato, severità, domanda collegata
  - ✅ **Implementato**: Refactor da accordion/card a table layout (simile a checklist compatta)
  - ✅ **Colonne table**: | Severità | Stato | Domanda Collegata | Azioni (Aggiungi AC)
  - ✅ **Altezza riga**: ~44px (h-11 class) — tabella compatta stile checklist
  - ✅ **Funzionalità mantenute**:
    - Expand/collapse via row click o tasto AC
    - CA list in expanded row con tutti i dettagli (responsabile, scadenza, status)
    - Add CA form nell'expanded section
  - ✅ **Zero errori TypeScript**
- [x] **N3** Form creazione AC da NC: titolo, responsabile, scadenza, descrizione
  - ✅ **Implementato**: Upgrade AddCaForm con tutti i campi richiesti
  - ✅ **Campi form** (N3 requirement):
    - Titolo (context NC mostrato in header)
    - Descrizione dell'azione (required, min 5 chars)
    - Causa radice (optional)
    - Piano d'azione (optional)
    - Responsabile (optional)
    - Scadenza (optional)
  - ✅ **Integrazione**: Form riceve props nc, ncId, auditId, onSuccess, onCancel
  - ✅ **Server action**: createCorrectiveAction accetta tutti i campi
  - ✅ **Zero errori TypeScript**
- [x] **N4** Cambio stato AC: Aperta → In Progress → Chiusa
  - ✅ **Implementato**: Status transition UI buttons per CA
  - ✅ **Stati AC**: open → completed → verified (schema-defined enums)
  - ✅ **Flow logica**:
    - open state: mostra button "Avanti" → completed
    - completed state: mostra button "Avanti" → verified
    - verified state: niente button (end state)
  - ✅ **Azione**: Clicked button chiama updateCorrectiveAction con nuovo status
  - ✅ **Toast feedback**: Notifica cambio stato
  - ✅ **Zero errori TypeScript**
- [x] **N5** Quando AC chiusa → NC si aggiorna a "risolta"
  - ✅ **Implementato**: Logic in updateCorrectiveAction per status→'verified'
  - ✅ **Flow completo**:
    - AC completed (completeCorrectiveAction) → NC status='pending_verification' (already existed)
    - AC verified (updateCorrectiveAction with status='verified') → NC status='closed' (risolta)
  - ✅ **Logica**: Quando AC raggiunge 'verified' → NC diventa 'closed' con closed_at timestamp
  - ✅ **Condizione**: Solo se NC è già in 'pending_verification' (non modifica altri stati)
  - ✅ **Revalidate path**: After NC update
  - ✅ **Zero errori TypeScript**
- [x] **N6** Dashboard NC globale: lista tutte le NC aperte di tutti gli audit, filtrabile per cliente
  - ✅ **Implementato**: Refactor NonConformities page a "use client" con filtering
  - ✅ **Funzione server action**: getOpenNCList(clientId?) in quality-actions.ts
    - Filtra NCs con status='open' solamente
    - Supporta filtro opzionale per client_id
    - Fetch connesso con audit e corrective_actions info
  - ✅ **UI componente**:
    - Select dropdown per filtro cliente (mostra tutti i clienti con conteggio NC)
    - Header dashboard mostra: "X NC aperte · Y clienti interessati"
    - Loading state e fetch data su selectedClientId change
  - ✅ **Compilazione**: Zero errori TypeScript
  - ✅ **State management**: useState hooks per ncs, clients, selectedClientId, isLoading

### P3 — Report Excel ✅ COMPLETATO

- [x] **R1** Setup `exceljs` (`npm install exceljs`)
  - ✅ **Installato**: npm install exceljs completato con successo
- [x] **R2** Server Action `exportAuditToExcel`: colonne domanda, esito, note, evidence_url
  - ✅ **Funzione già implementata**: generateAuditExcel in export-actions.ts
  - ✅ **Funzionalità**:
    - Fetch audit con client e location
    - Fetch checklist items con evidence_url e audio_url
    - Fetch non conformities e corrective actions
    - Genera Excel con 3 fogli: Checklist | Non Conformità | Azioni Correttive
    - Styling: header nero, colori outcome per status, dates formattate it-IT
    - Export a base64, ready per API download
  - ✅ **Esportazione index.ts**: Aggiunto export di generateAuditExcel
- [x] **R3** Bottone "Scarica Excel" nella pagina dettaglio audit
  - ✅ **Bottone già implementato**: ExportExcelButton in audit-detail page
  - ✅ **Ubicazione**: Header audit, accanto a EmailDraftModal
  - ✅ **Funzionalità**:
    - Icon: FileSpreadsheet (verde emerald)
    - Fetch da /api/audits/{id}/export
    - Download file con filename corretto
    - Toast notifications (loading, success, error)
    - Loading state durante generazione
- [x] **R4** Sezione NC e AC nel report (foglio separato)
  - ✅ **Già implementato**: 3 fogli nel workbook:
    - Foglio 1: Checklist (domanda, esito, note, allegati foto/audio)
    - Foglio 2: Non Conformità (titolo, gravità, stato, item, descrizione)
    - Foglio 3: Azioni Correttive (NC, descrizione, assegnata a, scadenza, stato)
  - ✅ **Route API**: GET /api/audits/[id]/export/route.ts
    - Converte buffer a base64
    - Ritorna file con header Content-Disposition corretto
    - Status 200 con Content-Type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - ✅ **TypeScript**: Zero errori dopo fix getClientsList

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
- [ ] PDF report audit (nice-to-have, dopo Excel)
- [ ] Multi-sito avanzato: dashboard aggregata cross-location per gruppo

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
- [x] Fix 18 errori TypeScript (AuditOutcome type, NCsSeverity alias, importazioni)
- [x] Zero errori npx tsc --noEmit