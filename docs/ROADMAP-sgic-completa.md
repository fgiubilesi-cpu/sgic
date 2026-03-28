---
type: roadmap
date: 2026-03-21
status: active
tags: [sgic, roadmap, sprint, completa]
author: claude-strategy
per: codex / claude-code / fil
---

# SGIC — Roadmap completa

> Visione: rendere SGIC lo strumento operativo quotidiano per ispettori G&A e Fil,
> con dati reali, scadenze automatiche, report per clienti e assistenza AI.
> Organizzata in sprint incrementali. Ogni sprint è indipendente e deployabile.

---

## SPRINT 13: Completamento moduli esistenti — Parte 1

> Obiettivo: chiudere i buchi lasciati dagli sprint precedenti.
> Effort stimato: 1 sessione lunga o 2 sessioni medie.

### P5 — Widget scadenze visite mediche in dashboard
- Nella dashboard, aggiungere un widget che mostra le visite mediche in scadenza nei prossimi 30/60/90 giorni
- Query su `medical_visits` dove `expiry_date` è nel range
- Colori semaforo: rosso (scaduta), giallo (entro 30gg), verde (>30gg)
- Filtro per cliente (usa ClientFilter esistente)

### F3 — Pagina dettaglio corso /training/[id]
- Pagina con: titolo corso, descrizione, durata, validità (validity_months)
- Tab "Registrazioni": lista persone iscritte/completate con date
- Tab "Scadenze": persone il cui attestato scade entro 90gg (completion_date + validity_months)
- Link alla scheda personale di ogni persona

### F5 — Scadenze attestati formazione
- Calcolo: `completion_date + validity_months = expiry_date`
- Widget in dashboard (simile a P5): attestati in scadenza prossimi 30/60/90gg
- Badge nella pagina /training: contatore attestati scaduti/in scadenza

### S4 — Export risultati lab XLS per cliente
- Bottone "Esporta XLS" nella pagina /samplings
- Filtro per cliente attivo → esporta solo quei campionamenti
- Colonne: titolo, matrice, data campionamento, stato, risultati

### Verifica Sprint 13
- `npx tsc --noEmit` → 0 errori
- Tag `v0.7-sprint13`

---

## SPRINT 14: Completamento moduli esistenti — Parte 2

> Obiettivo: test e2e + stabilizzazione + ricerca globale.
> Effort stimato: 1 sessione.

### V1-V6 — Test manuali end-to-end
- V1: flusso audit completo (crea → compila → score → NC auto)
- V2: flusso NC→AC (crea AC → cambia stato → badge scadenza)
- V3: bozza mail (genera testo → copia)
- V4: export Excel (3 fogli)
- V5: template (crea → domande → reorder → import CSV → crea audit)
- V6: portale cliente (read-only → banner → bottoni disabilitati)
- Per ogni test: documentare risultato in TODO.md (pass/fail + eventuali fix)

### SEARCH — Ricerca globale
- Verificare stato dello scaffold in `src/features/search/`
- Se funzionante: attivare in UI
- Se non funzionante: implementare con `ilike` su audit.title, client.name, non_conformities.title, personnel.full_name, training_courses.title
- Input ricerca nella topbar, risultati raggruppati per tipo con link

### DB-FIX — Fix search_path funzioni DB
- Risolvere il warning di sicurezza sulle funzioni DB
- `ALTER FUNCTION ... SET search_path = public;` per ogni funzione

### Verifica Sprint 14
- Tutti V1-V6 pass
- Ricerca funzionante
- `npx tsc --noEmit` → 0 errori
- Tag `v0.8-sprint14`

---

## SPRINT 15: Dashboard scadenze unificata

> Obiettivo: una vista unica "cosa scade quando" su tutti i moduli.
> Questo è il killer feature per Fil e gli ispettori.
> Effort stimato: 1-2 sessioni.

### DEADLINES-1 — Pagina /deadlines (o sezione dashboard)
- Vista unificata che fonde:
  - Visite mediche in scadenza (da `medical_visits.expiry_date`)
  - Attestati formazione in scadenza (da `training_registrations.completion_date + courses.validity_months`)
  - Audit programmati non ancora completati (da `audits.scheduled_date` dove status != completed)
  - Documenti con data revisione superata (da `documents.expiry_date` se esiste)
  - AC con due_date superata e status != completed (da `corrective_actions`)
- Ogni riga mostra: tipo, descrizione, cliente, persona coinvolta, data scadenza, stato

### DEADLINES-2 — Filtri e ordinamento
- Filtro per cliente (ClientFilter esistente)
- Filtro per tipo (visite / attestati / audit / documenti / AC)
- Filtro per urgenza: scaduto | entro 30gg | entro 90gg | tutto
- Ordinamento di default: più urgente prima
- Colori semaforo su ogni riga

### DEADLINES-3 — KPI strip scadenze
- In cima alla pagina: contatori
  - 🔴 Scadute: N
  - 🟡 Entro 30gg: N
  - 🟢 Entro 90gg: N
  - ✅ In regola: N
- Cliccabili → filtrano la tabella sotto

### Verifica Sprint 15
- Dashboard scadenze mostra dati reali da tutti i moduli
- Filtri funzionanti
- `npx tsc --noEmit` → 0 errori
- Tag `v0.9-sprint15`

---

## SPRINT 16: Notifiche email

> Obiettivo: SGIC avvisa proattivamente quando qualcosa scade.
> Dipendenza: Resend account configurato.
> Effort stimato: 1 sessione.

### EMAIL-1 — Setup Resend
- `npm install resend`
- Configurazione API key in `.env`
- Template email base HTML (header G&A, footer, stile professionale)

### EMAIL-2 — Email scadenze settimanale
- Server action che raccoglie tutte le scadenze prossime 30gg
- Raggruppa per tipo e cliente
- Invia riepilogo a Fil (e opzionalmente agli ispettori assegnati)
- Trigger manuale: bottone "Invia riepilogo scadenze" nella dashboard
- Trigger automatico futuro: cron settimanale (quando CI/CD è attivo)

### EMAIL-3 — Email post-audit al cliente
- Dopo completamento audit, bottone "Invia report al cliente"
- Email con: riepilogo audit, NC trovate, AC richieste, deadline
- Usa template professionale G&A

### EMAIL-4 — Email AC scadute
- Per ogni AC con due_date superata e status != completed
- Email al responsible_person_email con: descrizione NC, AC richiesta, giorni di ritardo
- Trigger manuale per ora (bottone in dashboard)

### Verifica Sprint 16
- Email inviata e ricevuta per ogni tipo
- Template professionale e leggibile
- Tag `v1.0-sprint16` ← prima versione "1.0"

---

## SPRINT 17: Integrazione FileMaker (lettura)

> Obiettivo: SGIC legge anagrafica clienti/persone da FM.
> Dipendenza: FM Data API attiva (task I.01 in gea-kb).
> Effort stimato: 2 sessioni.

### FM-1 — Script import clienti da FM
- Script Node.js che chiama FM Data API
- Legge tabella `clienti` di FM → mappa su tabella `clients` di SGIC
- Legge tabella `unitaOperative` → mappa su `locations`
- Gestione duplicati: match su nome + indirizzo, update se esistente
- Output: log di quanti importati/aggiornati/skippati

### FM-2 — Script import persone da FM
- Legge tabella `persone` di FM → mappa su `personnel` di SGIC
- Collega a client_id corretto
- Import visite mediche da FM se disponibili

### FM-3 — Sync manuale da UI
- Pagina /admin/fm-sync (solo ruolo admin)
- Bottone "Importa da FileMaker" con progress bar
- Log risultati importazione
- Schedulabile in futuro via cron

### FM-4 — Vista attività FM nella scheda cliente
- Tab "Attività G&A" nella pagina cliente /clients/[id]
- Chiamata live a FM Data API per attività di quel cliente
- Read-only, mostra: tipo attività, data, stato, note
- Graceful fallback se FM non raggiungibile

### Verifica Sprint 17
- Import funzionante con dati reali FM
- Nessun duplicato creato
- Vista attività mostra dati live

---

## SPRINT 18: AI Assistant — Fase 1

> Obiettivo: AI che aiuta l'ispettore durante e dopo l'audit.
> Dipendenza: Claude API key configurata.
> Effort stimato: 2-3 sessioni.

### AI-1 — Suggerimento testo NC
- Quando un ispettore segna un item come NOK, bottone "Suggerisci NC"
- L'AI riceve: domanda della checklist, outcome, notes dell'ispettore
- Genera: titolo NC, descrizione strutturata, severity suggerita
- L'ispettore rivede e approva/modifica prima di salvare
- Modello: Claude Sonnet (costo contenuto, velocità)

### AI-2 — Suggerimento azione correttiva
- Nella scheda NC, bottone "Suggerisci AC"
- L'AI riceve: titolo e descrizione NC, contesto cliente, checklist item
- Genera: root cause analysis, action plan, deadline suggerita
- L'ispettore rivede e approva/modifica

### AI-3 — Riassunto storico cliente
- Nella scheda cliente, bottone "Genera riassunto"
- L'AI riceve: lista audit con score, NC aperte/chiuse, AC in corso, formazione, scadenze
- Genera: paragrafo narrativo "Negli ultimi 12 mesi il cliente X..."
- Utile prima di un audit per prepararsi

### AI-4 — Bozza report audit narrativo
- Dopo completamento audit, bottone "Genera report narrativo"
- L'AI riceve: dati audit completi (checklist, NC, AC, score)
- Genera: documento narrativo professionale con linguaggio G&A
- Revisione umana prima di invio al cliente

### Verifica Sprint 18
- Tutti e 4 i suggerimenti generano testo coerente
- Nessun dato sensibile inviato inappropriatamente
- Latenza accettabile (<10s per suggerimento)

---

## SPRINT 19: AI Assistant — Fase 2 (Knowledge Base)

> Obiettivo: l'AI usa la knowledge base normativa per suggerimenti contestuali.
> Dipendenza: Sprint 18 completato + corpus normativo indicizzato.
> Effort stimato: 2-3 sessioni.

### KB-1 — Ricerca full-text nei documenti
- Basata su `documents.extracted_text` (se esiste) o parsing PDF
- API endpoint: dato un termine, restituisce documenti rilevanti con snippet
- Usata dalla UI e dall'AI

### KB-2 — Cross-reference audit/NC → normativa
- Quando si visualizza una NC, sezione "Riferimenti normativi"
- L'AI cerca nel corpus documentale i riferimenti pertinenti
- Mostra: nome documento, articolo/sezione, snippet rilevante

### KB-3 — Suggerimento procedure durante compilazione
- Durante compilazione checklist, per ogni domanda:
  - Icona "info" che mostra la procedura di riferimento
  - Se l'ispettore segna NOK: suggerimento automatico della procedura violata
- Richiede mapping domande → documenti (manuale iniziale, poi AI-assistito)

### Verifica Sprint 19
- Full-text search funzionante
- Cross-reference mostra risultati pertinenti
- Suggerimenti procedura coerenti con le domande

---

## SPRINT 20+: Mobile, Report PDF, CI/CD

> Questi sprint sono più lontani. Li definiamo in dettaglio quando ci arriviamo.

### Mobile/PWA
- Verificare funzionamento offline compilazione checklist
- Ottimizzazione touch per checklist (bottoni grandi, swipe)
- Foto e audio funzionanti su mobile
- Geolocalizzazione audit

### Report PDF
- R1-R4 dal backlog originale
- PDF con: copertina, checklist, NC/AC, score
- Generabile da pagina audit
- Read-only per portale cliente

### CI/CD
- GitHub Actions: lint + typecheck su PR
- Deploy automatico su staging (Vercel)
- Environment staging con Supabase branch separato

### Backlog residuo
- Filtri avanzati lista audit (data, stato, score range)
- Storico audit per cliente (vista timeline)
- Modalità offline base

---

## Riepilogo timeline

| Sprint | Focus | Dipendenze | Milestone |
|---|---|---|---|
| 13 | Completamento moduli (P5, F3, F5, S4) | Nessuna | v0.7 |
| 14 | Test e2e + ricerca + fix DB | Nessuna | v0.8 |
| 15 | Dashboard scadenze unificata | Sprint 13 (widget esistono) | v0.9 |
| 16 | Notifiche email (Resend) | Sprint 15 (scadenze calcolate) | v1.0 🎉 |
| 17 | Import da FileMaker | FM Data API attiva | — |
| 18 | AI Assistant fase 1 | Claude API | — |
| 19 | AI Assistant fase 2 (KB) | Sprint 18 + corpus normativo | — |
| 20+ | Mobile, PDF, CI/CD | Vari | — |

---

*Roadmap generata nella sessione GEA Control System del 2026-03-21.*
*Ogni sprint va dettagliato nel TODO.md di SGIC prima dell'esecuzione.*
*Aggiornare STATUS.md dopo ogni sprint completato.*
