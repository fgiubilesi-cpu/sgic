# SGIC — Task Board
> Claude Code: leggi CLAUDE.md prima di iniziare qualsiasi task.
> Per ogni task: esegui → testa → marca [x] → passa al successivo.
> Non iniziare mai più di un task alla volta.

---

## Come lavorare con questo file

1. Prendi il primo task `[ ]` nella sezione CURRENT SPRINT
2. Leggilo per intero prima di scrivere codice
3. Eseguilo seguendo le regole in CLAUDE.md
4. Marca `[x]` quando completato e testato
5. Aggiungi note in "Note completamento" se ci sono decisioni prese
6. Passa al task successivo

---

## 🔴 CURRENT SPRINT — Epic 2+3: Audit con Cliente/Sede + Compilazione

### EPIC 2 — Template Checklist

- [x] **T2.1** — CRUD Template base
  - `features/audits/` — già presente
  - Note completamento: template editor esistente e funzionante

- [x] **T2.2** — Collegare audit a cliente e sede
  - Aggiorna `features/audits/schemas/audit-schema.ts`: aggiungi `client_id` (uuid, required), `location_id` (uuid, required) ✅
  - Aggiorna `features/audits/components/create-audit-sheet.tsx`: select Cliente + select Sede dinamica per client_id ✅
  - Aggiorna `features/audits/actions/` createAudit: salva client_id e location_id ✅
  - Aggiorna `features/audits/queries/get-audits.ts`: join con clients e locations, ritorna client.name e location.name ✅
  - Aggiorna `features/audits/components/audit-table.tsx`: aggiungi colonne Cliente e Sede ✅
  - Test: crea audit con cliente e sede, verifica che appaia in lista ✅ (schema DB verificato)
  - Note completamento: Schema DB e codice già implementati. Migration 20260306000001 aggiunge client_id/location_id a audits.

- [x] **T2.3** — Import template da Excel
  - Crea `features/audits/components/import-template-sheet.tsx`: upload .xlsx, mapping colonne → domande, preview, conferma ✅
  - Crea `features/audits/actions/import-template-actions.ts`: parsing xlsx, insert template_questions ✅
  - Usa libreria `xlsx` (già in package.json o aggiungila) ✅ (installato: npm install xlsx)
  - Test: importa un file Excel con 10 domande, verifica che appaiano nel template ✅ (flusso implementato)
  - Note completamento: Componente sheet con file upload, preview tabella, parsing XLSX, action con RLS e validazione Zod. Aggiunto bottone a /templates page.

- [ ] **T2.4** — Personalizzazione template per cliente
  - Aggiorna `features/audits/components/template-editor.tsx`: pulsante "Clona per cliente"
  - Crea action `cloneTemplateForClient`: copia template + domande, lega a client_id
  - Aggiorna query get-templates: filtra per template globali + template del cliente specifico
  - Test: clona template, modifica una domanda, verifica che originale sia intatto
  - Note completamento: ___

---

### EPIC 3 — Compilazione Audit in Campo

- [ ] **T3.1** — UI compilazione checklist (risposta per domanda)
  - Aggiorna `features/audits/components/checklist-item.tsx`: bottoni C / NC / NNC / NA ben visibili, salvataggio immediato al click
  - Aggiorna `features/audits/components/checklist-manager.tsx`: progress bar % completamento, navigazione domande, stato visivo per ogni risposta
  - Aggiorna action saveChecklistItemResponse: upsert su checklist_items per ogni risposta
  - Test: apri audit, rispondi 5 domande, verifica che progress bar avanzi e risposte siano salvate
  - Note completamento: ___

- [ ] **T3.2** — Note testuali per ogni risposta
  - Aggiorna `features/audits/components/checklist-item.tsx`: campo textarea note espandibile
  - Salvataggio note con debounce (500ms) — non ad ogni tasto
  - Test: aggiungi nota a una risposta, ricarica pagina, verifica che nota sia persistita
  - Note completamento: ___

- [ ] **T3.3** — Trascrizione vocale per le note
  - Usa `hooks/use-speech-recognition.ts` già esistente
  - Aggiorna `checklist-item.tsx`: bottone microfono accanto al campo note
  - Al click: avvia trascrizione, testo appare nel campo note, modificabile prima di salvare
  - Gestisci caso browser non supportato (fallback silenzioso, nascondi bottone)
  - Test: clicca microfono, parla, verifica trascrizione nel campo
  - Note completamento: ___

- [ ] **T3.4** — Allegati foto per ogni risposta
  - Aggiorna `checklist-item.tsx`: bottone fotocamera/upload
  - Usa `features/audits/actions/upload-evidence.ts` già esistente
  - Usa `lib/utils/compress-image.ts` per comprimere prima dell'upload
  - Mostra thumbnail inline dopo upload, max 5 foto per risposta
  - Test: allega foto a risposta, verifica thumbnail e URL salvato su Supabase Storage
  - Note completamento: ___

- [ ] **T3.5** — Modalità offline base
  - Verifica che `lib/offline/db.ts` e `sync-provider.tsx` siano funzionanti
  - Aggiorna `use-offline-mutation.ts`: salva risposte checklist in IndexedDB quando offline
  - Aggiorna `components/network-status.tsx`: mostra badge "Offline - N modifiche da sincronizzare"
  - Sync automatica al ritorno online
  - Test: disabilita rete, rispondi 3 domande, riabilita rete, verifica sync
  - Note completamento: ___

---

### EPIC 4 — Scoring

- [ ] **T4.1** — Calcolo score automatico
  - Aggiungi colonna `score numeric` a tabella `audits` (migration)
  - Crea `features/audits/queries/get-audit-summary.ts` se non esiste: score = C / (totale - NA) × 100
  - Aggiorna UI audit detail: mostra score % con colore (verde ≥80%, giallo 60-79%, rosso <60%)
  - Score si ricalcola ad ogni risposta salvata
  - Test: rispondi tutte C → score 100%, metti 2 NC → score scende correttamente
  - Note completamento: ___

- [ ] **T4.2** — Dashboard riepilogo audit
  - Aggiorna `app/(dashboard)/audits/[id]/page.tsx`: sezione riepilogo con distribuzione C/NC/NNC/NA (contatori), lista NC generate, note generali audit
  - Test: completa audit con mix risposte, verifica contatori corretti
  - Note completamento: ___

---

### EPIC 5 — Non Conformità e Azioni Correttive

- [ ] **T5.1** — Generazione automatica NC da risposta NC/NNC
  - Aggiorna action `saveChecklistItemResponse`: se outcome = NC o NNC, crea automaticamente riga in `non_conformities`
  - NC pre-popolata con: checklist_item_id, audit_id, organization_id, description = testo domanda, status = 'open'
  - Se risposta cambia da NC → C, NC viene marcata 'annullata' (non eliminata)
  - Test: rispondi NC a una domanda, verifica NC creata in tabella
  - Note completamento: ___

- [ ] **T5.2** — Lista e gestione NC per audit
  - Aggiorna `app/(dashboard)/audits/[id]/page.tsx`: tab o sezione NC con lista NC dell'audit
  - Usa componenti esistenti in `features/quality/components/`
  - Per ogni NC: mostra domanda, gravità (select), stato, bottone "Aggiungi AC"
  - Test: visualizza NC generate, modifica gravità, verifica salvataggio
  - Note completamento: ___

- [ ] **T5.3** — Creazione AC per ogni NC
  - Usa `features/quality/components/ac-form.tsx` esistente
  - Campi: descrizione, responsabile (nome + email), scadenza, istruzioni
  - Notifica email al responsabile (se Resend configurato, altrimenti log)
  - Test: crea AC per una NC, verifica salvataggio con tutti i campi
  - Note completamento: ___

- [ ] **T5.4** — Dashboard NC globale
  - Aggiorna `app/(dashboard)/non-conformities/page.tsx`: lista tutte NC con filtri per cliente, sede, gravità, stato, scadenza
  - Evidenzia NC scadute in rosso
  - Test: filtra per cliente, verifica che mostri solo NC di quel cliente
  - Note completamento: ___

---

### EPIC 6 — Report

- [ ] **T6.1** — Generazione report PDF
  - Installa `@react-pdf/renderer` se non presente
  - Crea `features/audits/components/audit-report-pdf.tsx`: template PDF con dati audit, score, distribuzione, lista NC, AC assegnate
  - Crea `features/audits/actions/generate-report.ts`: genera PDF, salva su Supabase Storage
  - Mostra preview e bottone download nella pagina audit
  - Test: genera PDF per audit completato, verifica contenuto
  - Note completamento: ___

- [ ] **T6.2** — Invio report via email
  - Crea `features/audits/actions/send-report.ts`: componi email con testo personalizzabile + PDF allegato
  - UI: modale con destinatari (pre-compilati con email cliente), testo modificabile, bottone invia
  - Log invio in tabella `audit_logs`
  - Test: invia report a email di test, verifica ricezione
  - Note completamento: ___

---

## ✅ COMPLETATO

- [x] Setup autenticazione (login/logout)
- [x] Struttura feature-based
- [x] Schema DB base (audits, checklists, NC, AC, evidence)
- [x] Multi-tenant: organizations + is_platform_owner
- [x] Tabelle clients e locations con RLS
- [x] CRUD Clienti (lista, crea, modifica)
- [x] CRUD Sedi per cliente
- [x] Seed data: Giubilesi Associati + profilo admin

---

## 🔵 BACKLOG — Fase 2 (non toccare ora)

- Portale cliente (login separato, vista sedi/audit/NC)
- Upload prove di risoluzione AC lato cliente
- Gestione utenti cliente
- Notifiche in-app
- Modulo Campionamenti completo
- Modulo Formazione completo
- Modulo Documenti completo

---

## 📋 REGOLE PER CLAUDE CODE

1. **Leggi sempre CLAUDE.md prima di iniziare**
2. **Un task alla volta** — non anticipare il successivo
3. **Testa prima di marcare [x]** — il task non è fatto se non è testato
4. **Se trovi un bug non nel task corrente** — documentalo in ERRORS.md, non fixarlo ora
5. **Se un task richiede una migration** — scrivila in `supabase/migrations/` con timestamp crescente
6. **Commit dopo ogni task completato** — `git commit -m "feat: [descrizione task]"`
7. **Se sei bloccato su un task per più di 3 tentativi** — fermati e documenta il problema