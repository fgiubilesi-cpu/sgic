# Client Workspace Plan

## Vision

Trasformare la scheda `Cliente` da pagina anagrafica arricchita a vero workspace operativo interno.

La scheda cliente deve diventare il punto unico in cui il team vede:

- il perimetro del rapporto con il cliente
- cosa va fatto e con quali scadenze
- come il cliente e organizzato
- quali sedi, audit, documenti e procedure sono rilevanti
- quali rischi, criticita e note interne richiedono attenzione

## Product principle

`Cliente = dossier operativo completo`

Il modulo non deve essere un semplice CRM e non deve nemmeno frammentarsi in troppi mini-moduli.
Deve invece dare una vista unica, leggibile e azionabile.

## IA definitiva della scheda cliente

Tabs da implementare:

1. `overview`
2. `activities`
3. `contract`
4. `org-chart`
5. `locations`
6. `audits`
7. `documents`
8. `deadlines`
9. `notes`

## Scope del progetto

Dentro questo stream rientra:

- nuova architettura della scheda cliente a tab
- nuove query, componenti e action necessarie
- nuovo modello dati dove serve davvero
- integrazione con audit, documenti, sedi e collaboratori gia esistenti
- dashboard interna del cliente orientata all'operativita

Fuori scope per questo stream:

- portale cliente esterno
- condivisione dati verso il cliente
- fatturazione
- firma elettronica
- workflow approvativi complessi
- nuove aree verticali autonome come `Campionamenti` o `Formazione` separate dal cliente

## UX target

La scheda cliente deve avere:

- header forte con stato cliente e segnali di rischio
- tab chiare e leggibili
- overview iniziale che spiega in pochi secondi lo stato del cliente
- dati strutturati e non dump tabellari
- CTA coerenti per creare subito sede, attivita, audit, documento, contatto

## Data model target

### Esistente da riusare

- `clients`
- `locations`
- `personnel`
- `audits`
- `documents`
- `training_courses`
- `training_records`

### Nuove entita probabili

1. `client_contracts`
2. `client_tasks`
3. `client_contacts`
4. `client_deadlines`
5. `client_notes`

### Reuse / extension rules

- `documents` resta la tabella unica per documenti, manuali, procedure, contratti allegati e certificati
- `personnel` non va usato per modellare l'organigramma del cliente; serve una tabella dedicata `client_contacts`
- `client_deadlines` deve esistere solo per scadenze manuali o contrattuali non gia rappresentate altrove
- `client_tasks` deve essere la sorgente delle attivita operative interne

## Dati per ogni tab

### 1. Overview

Contenuti:

- stato cliente
- score ultimo audit
- score medio ultimi audit
- audit aperti o imminenti
- NC aperte
- numero sedi attive
- numero contatti chiave
- numero attivita aperte
- prossime scadenze
- alert sintetici

CTA:

- `Nuova attivita`
- `Nuova sede`
- `Nuovo audit`
- `Nuovo documento`
- `Apri contratto`

Done when:

- in 10 secondi si capisce lo stato del cliente
- overview mostra dati veri, non placeholder
- le CTA coprono i flussi operativi piu frequenti

### 2. Activities

Contenuti:

- attivita aperte
- attivita completate recenti
- attivita ricorrenti
- priorita
- assegnatario
- data target
- sede collegata
- audit collegato
- stato

Campi minimi task:

- titolo
- descrizione breve
- stato
- priorita
- due_date
- owner_name o owner_profile_id
- client_id
- location_id opzionale
- audit_id opzionale
- is_recurring
- recurrence_label opzionale

Done when:

- si possono creare, modificare, chiudere e filtrare le attivita
- la tab e davvero usabile come lista lavoro
- overview e scadenze consumano questi dati

### 3. Contract

Contenuti:

- tipo contratto
- data inizio
- data rinnovo
- data scadenza
- stato contratto
- servizi inclusi
- frequenza attivita previste
- referente interno
- note contrattuali
- allegati contratto

Decisione:

- niente storico rinnovi avanzato nel primo ciclo
- un solo contratto corrente per cliente nel primo step

Done when:

- il team capisce cosa rientra nel servizio
- esiste almeno una struttura contrattuale persistita
- scadenza contratto confluisce nella tab `Deadlines`

### 4. Org Chart

Contenuti:

- referenti cliente
- direzione
- qualita
- HACCP / sicurezza / produzione / amministrazione
- sede di riferimento
- email
- telefono
- contatto principale
- note relazionali

Decisione:

- solo contatti del cliente nel primo ciclo
- niente organigramma interno del team SGIC in questa tab

Done when:

- esiste una tabella dedicata per contatti cliente
- i contatti sono leggibili e filtrabili
- overview mostra i referenti chiave

### 5. Locations

Contenuti:

- sedi attive / archiviate
- tipo sede
- indirizzo
- referenti sede
- documenti sede
- ultime attivita
- ultimi audit sede
- criticita note

Done when:

- la tab sedi e piu ricca dell'attuale
- ogni sede mostra contesto operativo, non solo anagrafica
- da qui si possono creare audit/documenti/attivita legate alla sede

### 6. Audits

Contenuti:

- storico audit cliente
- piano audit
- audit per sede
- trend score
- criticita ricorrenti
- ultimi esiti
- CTA `Nuovo audit`

Done when:

- la tab audit cliente diventa una lettura storica e decisionale
- il collegamento cliente/audit e piu forte di oggi
- trend e warning sono leggibili

### 7. Documents

Categorie iniziali:

- contratto
- manuale
- procedura
- certificato
- modulo
- altro

Contenuti:

- archivio documenti cliente
- documenti per sede
- documenti per contatto/collaboratore quando rilevante
- stato pubblicazione
- data emissione
- data scadenza
- revisione
- owner interno

Decisione:

- manuali e procedure restano categorie, non tab separate nel primo ciclo

Done when:

- la tab documenti supporta bene categorie e scadenze
- i documenti alimentano la tab `Deadlines`

### 8. Deadlines

Fonti:

- contratto
- audit
- documenti
- attivita con scadenza
- eventuali scadenze manuali

Decisione:

- la tab mostra sia scadenze aggregate sia scadenze manuali create ad hoc

Done when:

- esiste una vista unica per tutto cio che scade
- ordinamento e filtri per urgenza funzionano
- da qui si puo aprire il record sorgente

### 9. Notes

Contenuti:

- note operative interne
- warning relazionali
- decisioni rilevanti
- appunti contestuali

Done when:

- note semplici ma persistite
- lettura cronologica chiara
- uso interno esplicito

## Execution strategy

Implementazione a cascata, senza saltare avanti.

### M0 - Foundations

Obiettivo:

- definire shell cliente a tab
- stabilire componenti, route e query condivise
- evitare refactor confusi durante le milestone successive

Lavoro:

- creare file piano e usarlo come fonte di verita
- ridefinire la pagina `clients/[id]` come workspace a tab
- introdurre un layer query/workspace dedicato
- stabilire KPI overview e struttura CTA

Done when:

- la scheda cliente ha shell nuova e tab vuote/placeholder tecnici coerenti
- i dati base attuali continuano a funzionare

### M1 - Overview

Obiettivo:

- creare la nuova home operativa del cliente

Lavoro:

- KPI
- header stato cliente
- blocchi `health`, `next actions`, `next deadlines`, `key contacts`
- CTA principali

Dipendenze:

- M0

Done when:

- overview leggibile e utile anche senza le tab successive complete

### M2 - Contract

Obiettivo:

- introdurre il perimetro contrattuale del cliente

Lavoro:

- migration `client_contracts`
- form contratto
- query contratto corrente
- card contratto in overview
- scadenza contratto verso deadlines

Dipendenze:

- M0

Done when:

- ogni cliente puo avere un contratto corrente strutturato

### M3 - Activities

Obiettivo:

- introdurre il motore operativo interno per cliente

Lavoro:

- migration `client_tasks`
- list/create/update/close task
- filtri per stato, priorita, assegnatario
- overview `next actions`
- link task -> sede / audit

Dipendenze:

- M0

Done when:

- la tab attivita e usabile davvero come strumento quotidiano

### M4 - Org Chart

Obiettivo:

- modellare i contatti chiave del cliente

Lavoro:

- migration `client_contacts`
- CRUD contatti
- ruolo/area/sede/contatto principale
- card contatti chiave in overview

Dipendenze:

- M0

Done when:

- esiste una mappa persone cliente leggibile e utile

### M5 - Locations upgrade

Obiettivo:

- portare la tab sedi a livello workspace

Lavoro:

- arricchire sede con contesto operativo
- blocchi ultimi audit/documenti/attivita
- CTA sede-centriche
- migliorare lista sedi

Dipendenze:

- M1
- M3
- M4

Done when:

- le sedi smettono di essere anagrafica piatta

### M6 - Audit integration

Obiettivo:

- rendere la tab audit cliente una vista decisionale

Lavoro:

- trend score
- andamento per sede
- insight ricorrenti
- piano audit
- collegamento forte con overview

Dipendenze:

- M1

Done when:

- la tab audit spiega andamento e rischi del cliente

### M7 - Documents upgrade

Obiettivo:

- rendere la tab documenti un archivio operativo categorizzato

Lavoro:

- categorie documento orientate al cliente
- filtri per categoria/stato/scadenza
- manuali e procedure come categorie
- collegamenti con sede e contratto

Dipendenze:

- M2
- M5

Done when:

- documenti, manuali e procedure convivono bene senza creare nuovi moduli

### M8 - Deadlines

Obiettivo:

- creare una vista unica delle scadenze cliente

Lavoro:

- migration `client_deadlines` se necessaria per scadenze manuali
- aggregatore da contratto, audit, documenti, task
- filtri per urgenza/tipo
- card `next deadlines` in overview

Dipendenze:

- M2
- M3
- M6
- M7

Done when:

- il team vede tutto quello che scade in un solo posto

### M9 - Notes

Obiettivo:

- introdurre note interne contestuali e storicizzate

Lavoro:

- migration `client_notes`
- CRUD note
- timeline note
- blocco note recenti in overview

Dipendenze:

- M1

Done when:

- esiste un posto semplice e chiaro per memoria operativa interna

### M10 - Final integration and polish

Obiettivo:

- rendere il workspace cliente coerente e pronto per `main`

Lavoro:

- microcopy
- loading/empty/error states
- CTA consistenti
- QA end-to-end
- verify release

Dipendenze:

- M1-M9

Done when:

- la scheda cliente e coerente in tutte le tab
- build verde
- nessun flusso chiave rotto

## Order of implementation

Ordine rigoroso:

1. M0
2. M1
3. M2
4. M3
5. M4
6. M5
7. M6
8. M7
9. M8
10. M9
11. M10

## Technical rules for this stream

- lavorare solo sul branch dedicato
- una milestone alla volta
- build verde alla fine di ogni milestone sostanziale
- niente merge su `main` finche il workspace cliente non e coerente
- usare questo file come riferimento unico
- fermarsi solo su blocchi reali di schema, RLS o dati

## Verification checklist

- `/clients` resta funzionante
- `/clients/[id]` apre sempre correttamente
- overview cliente leggibile
- attivita create e aggiornate
- contratto salvabile
- contatti cliente salvabili
- sedi integrate col nuovo workspace
- audit cliente coerenti
- documenti categorizzati e leggibili
- scadenze aggregate corrette
- note interne persistite
- `npm run verify:release`

## Progress log

- 2026-03-12: creato piano esecutivo del `Client Workspace` sul branch `codex/client-workspace`
- 2026-03-12: implementati M0-M10 sul branch `codex/client-workspace` con nuova scheda cliente a 9 tab, nuove entita (contract/tasks/deadlines/notes), integrazione org-chart, upgrade locations/audits/documents e verifica `npx tsc --noEmit` + `npm run verify:release` verde
