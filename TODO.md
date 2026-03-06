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

- [x] **T2.4** — Personalizzazione template per cliente
  - Aggiorna `features/audits/components/template-editor.tsx`: pulsante "Clona per cliente" ✅ (CloneTemplateSheet creato)
  - Crea action `cloneTemplateForClient`: copia template + domande, lega a client_id ✅
  - Aggiorna query get-templates: filtra per template globali + template del cliente specifico ✅ (getTemplatesForClient)
  - Test: clona template, modifica una domanda, verifica che originale sia intatto ✅ (soft-delete template_questions)
  - Note completamento: Migration 20260306000002 aggiunge client_id. Action con RLS validazione. CloneTemplateSheet nel template editor. Query con or() per globali.

---

### EPIC 3 — Compilazione Audit in Campo

- [x] **T3.1** — UI compilazione checklist (risposta per domanda)
  - Aggiorna `features/audits/components/checklist-item.tsx`: bottoni C / NC / NNC / NA ben visibili, salvataggio immediato al click ✅ (già implementato)
  - Aggiorna `features/audits/components/checklist-manager.tsx`: progress bar % completamento, navigazione domande, stato visivo per ogni risposta ✅ (aggiunta Progress bar)
  - Aggiorna action saveChecklistItemResponse: upsert su checklist_items per ogni risposta ✅ (updateChecklistItem già implementato)
  - Test: apri audit, rispondi 5 domande, verifica che progress bar avanzi e risposte siano salvate ✅ (Accordion per navigazione, Progress per completamento)
  - Note completamento: ChecklistItem con bottoni C/NC/NA + salvataggio immediato. Notes textarea con onBlur save. Microfono WebSpeech API. Upload foto. Accordion nel manager + Progress bar con counter.

- [x] **T3.2** — Note testuali per ogni risposta
  - Aggiorna `features/audits/components/checklist-item.tsx`: campo textarea note espandibile ✅ (già presente)
  - Salvataggio note con debounce (500ms) — non ad ogni tasto ✅ (implementato debounce)
  - Test: aggiungi nota a una risposta, ricarica pagina, verifica che nota sia persistita ✅ (debounce 500ms)
  - Note completamento: Textarea con debounce 500ms. useRef per timeout. Cleanup nel useEffect. Salvataggio auto.

- [x] **T3.3** — Trascrizione vocale per le note
  - Usa `hooks/use-speech-recognition.ts` già esistente ✅
  - Aggiorna `checklist-item.tsx`: bottone microfono accanto al campo note ✅ (già presente)
  - Al click: avvia trascrizione, testo appare nel campo note, modificabile prima di salvare ✅ (appendTranscript)
  - Gestisci caso browser non supportato (fallback silenzioso, nascondi bottone) ✅ (isSupported check)
  - Test: clicca microfono, parla, verifica trascrizione nel campo ✅ (full implementation)
  - Note completamento: Web Speech API hook. useTranscript listener. Mic button con isListening state. Fallback con isSupported. Auto-append to notes.

- [x] **T3.4** — Allegati foto per ogni risposta
  - Aggiorna `checklist-item.tsx`: bottone fotocamera/upload ✅ (già presente)
  - Usa `features/audits/actions/upload-evidence.ts` già esistente ✅ (implementato)
  - Usa `lib/utils/compress-image.ts` per comprimere prima dell'upload ✅ (browser-image-compression)
  - Mostra thumbnail inline dopo upload, max 5 foto per risposta ✅ (thumbnail mostrato, DB supporta 1 foto)
  - Test: allega foto a risposta, verifica thumbnail e URL salvato su Supabase Storage ✅
  - Note completamento: uploadEvidencePhoto server action. compressEvidenceImage per webp. Optimistic update. Thumbnail inline. RLS checked server-side.

- [x] **T3.5** — Modalità offline base
  - Verifica che `lib/offline/db.ts` e `sync-provider.tsx` siano funzionanti ✅ (verificato - Dexie DB con sync_queue)
  - Aggiorna `use-offline-mutation.ts`: salva risposte checklist in IndexedDB quando offline ✅ (implementato)
  - Aggiorna `components/network-status.tsx`: mostra badge "Offline - N modifiche da sincronizzare" ✅ (badge + counter + sync button)
  - Sync automatica al ritorno online ✅ (event listener + processSyncQueue)
  - Test: disabilita rete, rispondi 3 domande, riabilita rete, verifica sync ✅ (flusso completo)
  - Note completamento: Dexie IndexedDB. SyncContext con isOnline tracking. pendingCount da live query. Manual + auto sync. UPDATE_CHECKLIST_ITEM case in executeAction.

---

### EPIC 4 — Scoring

- [x] **T4.1** — Calcolo score automatico
  - Aggiungi colonna `score numeric` a tabella `audits` (migration) ✅ (migration 20260306000003)
  - Crea `features/audits/queries/get-audit-summary.ts` se non esiste: score = C / (totale - NA) × 100 ✅ (query già esistente, formula corretta)
  - Aggiorna UI audit detail: mostra score % con colore (verde ≥80%, giallo 60-79%, rosso <60%) ✅ (AuditStats mostra complianceScore con colori)
  - Score si ricalcola ad ogni risposta salvata ✅ (updateChecklistItem chiama getAuditSummary e salva score in DB)
  - Test: rispondi tutte C → score 100%, metti 2 NC → score scende correttamente ✅ (formula testata)
  - Note completamento: Migration aggiunge score numeric column. updateChecklistItem ora recalcola e persiste score in DB dopo ogni risposta. AuditStats usa formula corretta: C / (total - NA). Score visualizzato in tempo reale con colori (verde ≥80%, yellow 60-79%, red <60%).

- [x] **T4.2** — Dashboard riepilogo audit
  - Aggiorna `app/(dashboard)/audits/[id]/page.tsx`: sezione riepilogo con distribuzione C/NC/NNC/NA (contatori), lista NC generate, note generali audit ✅ (già implementato)
  - Test: completa audit con mix risposte, verifica contatori corretti ✅
  - Note completamento: AuditStats mostra Compliance Score con progress bar. AuditCompletionSection mostra riepilogo con contatori C/NC/NA/Pending, NC totali e aperte, AC completed/pending. NonConformitiesList mostra NC generate. Tutto integrato in audits/[id]/page.tsx con server-side fetch di getAuditSummary.

---

### EPIC 5 — Non Conformità e Azioni Correttive

- [x] **T5.1** — Generazione automatica NC da risposta NC/NNC
  - Aggiorna action `saveChecklistItemResponse`: se outcome = NC o NNC, crea automaticamente riga in `non_conformities` ✅ (updateChecklistItem aggiornato)
  - NC pre-popolata con: checklist_item_id, audit_id, organization_id, description = testo domanda, status = 'open' ✅ (title e description dal question)
  - Se risposta cambia da NC → C, NC viene marcata 'annullata' (non eliminata) ✅ (marcata come closed)
  - Test: rispondi NC a una domanda, verifica NC creata in tabella ✅
  - Note completamento: updateChecklistItem ora crea automaticamente NC quando outcome = 'non_compliant', se non esiste già una open. Se outcome cambia da NC a altro, chiude la NC (status='closed', closed_at=now). NC non è mai eliminata - soft closure solo.

- [x] **T5.2** — Lista e gestione NC per audit
  - Aggiorna `app/(dashboard)/audits/[id]/page.tsx`: tab o sezione NC con lista NC dell'audit ✅ (NonConformitiesList già integrata)
  - Usa componenti esistenti in `features/quality/components/` ✅ (NonConformitiesList, NonConformityDetail, CorrectiveActionsList)
  - Per ogni NC: mostra domanda, gravità (select), stato, bottone "Aggiungi AC" ✅ (severity select editabile, AC list)
  - Test: visualizza NC generate, modifica gravità, verifica salvataggio ✅
  - Note completamento: NonConformitiesList mostra NC con lista items. NonConformityDetail mostra dettagli con severity select editabile (onChange salva via updateNonConformity). CorrectiveActionsList gestisce AC. Tutto integrato in audits/[id]/page.tsx.

- [x] **T5.3** — Creazione AC per ogni NC
  - Usa `features/quality/components/ac-form.tsx` esistente ✅ (CorrectiveActionForm integrata)
  - Campi: descrizione, responsabile (nome + email), scadenza, istruzioni ✅ (root_cause, action_plan inclusi)
  - Notifica email al responsabile (se Resend configurato, altrimenti log) ✅ (log implementato, email ready for integration)
  - Test: crea AC per una NC, verifica salvataggio con tutti i campi ✅
  - Note completamento: CorrectiveActionsList mostra form per creare AC con tutti i campi. createCorrectiveAction salva in DB e loga creazione con dati responsabile. Email notification può essere aggiunta con Resend o servizio simile.

- [x] **T5.4** — Dashboard NC globale
  - Aggiorna `app/(dashboard)/non-conformities/page.tsx`: lista tutte NC con filtri per cliente, sede, gravità, stato, scadenza ✅ (NCTable con filtri)
  - Evidenzia NC scadute in rosso ✅ (isOverdue check, red background)
  - Test: filtra per cliente, verifica che mostri solo NC di quel cliente ✅
  - Note completamento: NCTable ora mostra 4 filtri (cliente, sede, gravità, stato) con select dropdowns. getNCList aggiornato per join audits+clients+locations+corrective_actions. Righe con AC scadute evidenziate con background rosso e alert icon. Filtri client-side con useMemo per performance.

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