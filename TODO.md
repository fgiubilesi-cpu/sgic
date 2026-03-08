# TODO.md — SGIC

> Leggi sempre CLAUDE.md prima di iniziare.  
> Un task alla volta: esegui → testa → marca [x] → commit → fermati.  
> I test UI manuali (🧑 Test manuale) vanno fatti dall'utente nel browser — Claude Code non può autenticarsi.

---

## CURRENT SPRINT: Sprint Bug Fix — Core Audit Flow

**Obiettivo:** Rendere il flusso audit utilizzabile end-to-end. Questi bug bloccano qualsiasi demo.  
**Priorità:** Tutti P0 — nessuna nuova feature prima che questi siano risolti.

---

### BUG-1 — Campo note non funziona (tastiera)

- [x] **BUG-1A — Diagnosi**
  - Causa: `useOptimistic` per le note veniva resettato quando un'altra transition (es. click outcome) si concludeva, perdendo il testo digitato dall'utente

- [x] **BUG-1B — Fix**
  - Sostituito `useOptimistic` per `notes` con `useState(localNotes)` — mai resettato da re-render esterni
  - `handleNotesChange` aggiorna `localNotes` direttamente + debounce 500ms su `saveNotes`
  - `localNotesRef` usato per `appendTranscript` per evitare stale closure

- [ ] 🧑 **Test manuale:** apri un audit, scrivi nel campo note di un item, verifica che il testo rimanga e venga salvato

---

### BUG-2 — Trascrizione audio (microfono → testo) non funziona

- [x] **BUG-2A — Diagnosi**
  - `AudioRecorder` usa MediaRecorder API (registra audio → Supabase) — funziona
  - Il bottone mic nella colonna Note usa Web Speech API (`SpeechRecognition`) → speech-to-text
  - Bug: `lang = "en-US"` (doveva essere `it-IT`); stale closure su `optimisticItem.notes` risolto con BUG-1 fix

- [x] **BUG-2B — Fix**
  - Cambiato `lang` da `en-US` a `it-IT` in `use-speech-recognition.ts`
  - `appendTranscript` ora legge da `localNotesRef` (sempre aggiornato) invece di `optimisticItem.notes`
  - Browser senza SpeechRecognition: pulsante nascosto (`isSupported === false`)

- [ ] 🧑 **Test manuale:** clicca microfono, parla, verifica che il testo appaia nel campo note

---

### BUG-3 — Nuovo audit: picklist non permettono selezione

- [x] **BUG-3A — Diagnosi**
  - Usa `<Select>` shadcn/ui (Radix UI) con `position="popper"` — rendering via Portal corretto
  - Bug 1: `defaultValue={field.value}` (uncontrolled) → select non riflette `form.reset()` alla riapertura
  - Bug 2: z-index SelectContent `z-50` uguale al Sheet overlay → potenziale conflitto
  - Bug 3: `supabase` in `useEffect` deps poteva causare re-fetch se non singleton (ora module-level)

- [x] **BUG-3B — Fix**
  - `supabase` spostato a module scope (singleton stabile, fuori dalla deps di useEffect)
  - `defaultValue={field.value}` → `value={field.value}` su tutti e 3 i Select (controlled)
  - SelectContent `z-[100]` → `z-[200]` per stare sopra il Sheet overlay
  - `setSelectedClientId("")` aggiunto in `onSubmit` per reset corretto dopo submit

- [ ] 🧑 **Test manuale:** crea un nuovo audit selezionando cliente, sede e template dalle picklist

---

### BUG-4 — Auto-creazione NC da flag checklist item

- [x] **BUG-4A — Logica auto-creazione**
  - La logica era già parzialmente implementata ma con errori: severity `major` (ora `medium`), status cancellazione `closed` (ora `cancelled`)

- [x] **BUG-4B — Server action**
  - `updateChecklistItem` in `actions.ts` già gestiva la logica — corretti severity e status
  - Cancellazione: prima SELECT per verificare esistenza NC aperta, poi UPDATE a `cancelled`
  - Action ora ritorna `{ success: true, ncCreated: boolean, ncCancelled: boolean }`

- [x] **BUG-4C — Feedback UI**
  - `handleOutcomeChange` in `checklist-row.tsx` legge `result.ncCreated/ncCancelled` e mostra toast Sonner

- [ ] 🧑 **Test manuale:** flagga un item come non conforme → verifica toast → vai al tab NC → verifica che la NC sia presente

---

## SPRINT 2: Navigazione e Struttura Moduli

**Obiettivo:** Ristrutturare il menu e le route per riflettere l'architettura definitiva.  
**Dipendenza:** Sprint Bug Fix completato e testato manualmente.

---

- [ ] **NAV-1 — Menu laterale**
  - Voci: Dashboard, Audit, Campionamenti (disabled + badge "coming soon"), Formazione (disabled + badge "coming soon")
  - Rimuovere "Qualità" come voce separata dal menu
  - Audit come link alla lista audit
  - Commit: `"refactor(nav): sidebar menu aligned to final architecture"`

- [ ] **NAV-2 — Tab dentro pagina audit**
  - La pagina `/audits/[id]` deve avere 3 tab: Checklist (default), Non Conformità / AC, Template
  - Tab routing via searchParams: `?tab=checklist` (default), `?tab=nc`, `?tab=templates`
  - Preservare tab attivo su navigazione
  - Commit: `"refactor(audit): three-tab layout (checklist, NC/AC, templates)"`

- [ ] **NAV-3 — Componente tab NC/AC**
  - Lista NC dell'audit corrente con severity badge e status
  - Per ogni NC: espandibile con le sue AC
  - Bottone "Aggiungi AC" su ogni NC
  - Campo `due_date` opzionale su AC con indicatore visivo rosso se scaduta
  - Campo `assigned_to` con input testo libero (no user picker per ora)
  - Commit: `"feat(nc-ac): NC/AC tab inside audit with assignment and due date"`

- [ ] 🧑 **Test manuale:** naviga tra i 3 tab, crea una AC su una NC, assegna una due date scaduta e verifica indicatore rosso

---

## SPRINT 3: Excel Report

**Obiettivo:** Export Excel dell'audit completo — deliverable core per l'ispettore.  
**Dipendenza:** Sprint Bug Fix completato.

---

- [ ] **XLS-1 — Struttura Excel**
  - Foglio 1 "Checklist": una riga per item → colonne: domanda, outcome, note, evidence_url, audio_url
  - Foglio 2 "Non Conformità": NC trovate → colonne: titolo, severity, status, item collegato
  - Foglio 3 "Azioni Correttive": AC per ogni NC → colonne: titolo, assigned_to, due_date, status
  - Header riga 1 con bold e colore di sfondo
  - Outcome colorato: verde (compliant), rosso (non_compliant), grigio (not_applicable)

- [ ] **XLS-2 — Server action e route API**
  - File: `src/features/audits/actions/export-actions.ts` → `generateAuditExcel(auditId)`
  - Route: `app/api/audits/[id]/export/route.ts` → GET → download `.xlsx`
  - Usa libreria `exceljs` (installare se non presente)
  - Commit: `"feat(export): Excel report generation for audit"`

- [ ] **XLS-3 — Bottone export in UI**
  - Posizione: header della pagina audit (visibile da tutti i tab)
  - Label: "Esporta Excel" con icona download
  - Loading state durante generazione

- [ ] 🧑 **Test manuale:** esporta un audit con NC e verifica che il file Excel sia completo e leggibile

---

## SPRINT 4: Sintesi Mail

**Obiettivo:** Bozza automatica del testo mail post-audit per l'ispettore.  
**Dipendenza:** BUG-4 completato.

---

- [ ] **MAIL-1 — Generazione bozza**
  - Trigger: bottone "Genera bozza mail" nella pagina audit (solo se audit ha almeno 1 NC)
  - Contenuto: saluto, data audit, cliente, sede, score, lista NC con severity, chiusura professionale
  - Lingua: italiano formale
  - Output: textarea copiabile (non invia mail — l'ispettore copia e incolla nel suo client mail)

- [ ] **MAIL-2 — UI**
  - Modal o panel laterale con la bozza generata
  - Bottone "Copia testo" con feedback visivo (copiato!)
  - Commit: `"feat(mail): auto-generated audit summary email draft"`

- [ ] 🧑 **Test manuale:** genera bozza su audit con NC, verifica che il testo sia sensato e copiabile

---

## SPRINT 5: Dashboard

**Obiettivo:** Centro di controllo con filtri potenti — sostituisce "Qualità" come voce separata.  
**Dipendenza:** Sprint 2 (navigazione) completato.

---

- [ ] **DASH-1 — Filtri**
  - Filtri: cliente (select), sede (select dipendente da cliente), modulo (audit/campionamenti/formazione), periodo (date range)
  - Filtri persistono in URL params (`?client=...&location=...&period=...`)
  - Bottone reset filtri

- [ ] **DASH-2 — Metriche principali (card)**
  - Audit totali nel periodo, NC aperte, AC scadute, score medio audit
  - Tutto filtrato dai filtri attivi

- [ ] **DASH-3 — Tabella NC globali**
  - NC di tutti gli audit filtrati con link diretto all'audit e all'item
  - Colonne: audit, cliente, sede, data, NC title, severity, status AC

- [ ] **DASH-4 — Trend audit**
  - Grafico linea: score medio nel tempo per cliente/sede selezionata
  - Libreria: recharts (già disponibile)
  - Commit: `"feat(dashboard): overview with filters, NC global table, audit trend chart"`

- [ ] 🧑 **Test manuale:** verifica filtri, metriche, tabella NC e grafico trend con dati reali

---

## SPRINT 6: Demo Data

**Obiettivo:** Dati seed realistici per la demo — sostituisce Base44.  
**Dipendenza:** Tutti gli sprint precedenti completati.

---

- [ ] **DEMO-1 — Script seed**
  - 2 clienti fittizi (es. ristorante + mensa aziendale)
  - 2 sedi per cliente
  - 3 audit per sede (storico 6 mesi con date reali)
  - Checklist con mix realistico di esiti (compliant/non_compliant/not_applicable)
  - NC e AC con testi in italiano professionale
  - Score variabile per mostrare trend nel grafico Dashboard

- [ ] **DEMO-2 — Script reset**
  - Comando npm per resettare i dati demo allo stato iniziale
  - Commit: `"chore(seed): realistic demo data for sales demo"`

---

## BACKLOG (non schedulato)

- [ ] Status audit formale: draft → in_progress → closed (con transizioni UI)
- [ ] Verifica chiusura AC al prossimo audit (workflow futuro)
- [ ] Portale cliente: accesso dashboard filtrata per proprio client_id (fase 2)
- [ ] PDF report audit (nice-to-have dopo Excel)
- [ ] App mobile / PWA ottimizzata per uso sul campo
- [ ] Campionamenti: modulo alimenti e superfici con risultati laboratorio
- [ ] Formazione: modulo completo (training/personnel già migrato in DB)
- [ ] Rigenera database.types.ts dopo ogni migrazione DB significativa