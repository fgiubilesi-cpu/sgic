# SGIC Operating System Roadmap

## Scopo

Trasformare SGIC in un sistema operativo interno per la gestione quotidiana del lavoro SGIC, senza inseguire un CRM generalista e senza dipendere dal portale cliente.

Direzione scelta:

- `SGIC` e il layer operativo e decisionale.
- `FileMaker` resta la sorgente gestionale primaria per dati amministrativi, contrattuali e di copertura servizio.
- Il `workspace cliente` resta il centro dell'operativita quotidiana.
- La `dashboard management` e uno stream separato che leggerà anche il lavoro prodotto qui.

## Come usare questo file

Questo documento e il backlog operativo principale per le sessioni autonome su SGIC.

Protocollo di lavoro:

1. leggere questo file all'inizio della sessione
2. scegliere il task `Now` a piu alto valore non bloccato
3. limitare il diff allo stream corretto
4. implementare
5. eseguire `npm run verify:release`
6. aggiornare stato task e progress log

Regole pratiche:

- non toccare lo stream `management` in questa roadmap, salvo task esplicitamente marcati come integrazione
- privilegiare miglioramenti che aumentano l'utilita quotidiana del team interno
- ogni nuova UI deve produrre o migliorare almeno uno tra:
  - chiarezza operativa
  - qualita del dato
  - velocita di esecuzione
  - leggibilita per la direzione

## Obiettivo prodotto

SGIC deve permettere a chi lavora ogni giorno di capire subito:

- cosa va fatto oggi
- quali clienti richiedono attenzione
- quali servizi non sono pienamente presidiati
- dove ci sono scadenze, ritardi o buchi di dato
- quale storico operativo conta davvero

Formula guida:

`Cliente -> Sede -> Linea servizio -> Task/Scadenze/Audit/Documenti -> Timeline -> Dashboard`

## Stream attivi

### Stream A - Workspace cliente ed execution engine

Obiettivo:

- rendere la scheda cliente il vero centro operativo interno

Comprende:

- task
- scadenze
- contatti
- contratto
- linee servizio
- overview operativa
- quality of data

### Stream B - Document intelligence

Obiettivo:

- far sì che i documenti alimentino il workspace e non restino solo archivio

Riferimento:

- [DOCUMENT_INTELLIGENCE_PLAN.md](/Users/filippo/Desktop/sgic/docs/DOCUMENT_INTELLIGENCE_PLAN.md)

### Stream C - Management dashboard

Obiettivo:

- fornire lettura direzionale a partire dai dati operativi e dallo staging FileMaker

Riferimento:

- [MANAGEMENT_DASHBOARD_ROADMAP.md](/Users/filippo/Desktop/sgic/docs/MANAGEMENT_DASHBOARD_ROADMAP.md)

Nota:

- questo stream e gestito in sessione parallela; evitare sovrapposizioni inutili

## Stato attuale sintetico

Gia consolidato:

- workspace cliente multi-tab
- task, contatti, note, contratto e scadenze manuali
- document intelligence iniziale
- copertura servizi nel workspace cliente
- copertura servizi nella lista clienti
- link espliciti `service_line_id` su task e scadenze
- quick action inline per collegare task e scadenze alle linee servizio

Ancora fragile o incompleto:

- visibilita dei buchi di dato operativi
- routine giornaliera per capire cosa fare oggi
- timeline cliente come memoria unica
- relazione forte tra linee servizio, audit, task ricorrenti e scadenze
- governo trasversale per sede

## Milestone operative

### M1 - Copertura servizi affidabile e governabile

Obiettivo:

- trasformare la copertura servizi da segnale utile a motore affidabile

Task:

- [x] introdurre una lettura di copertura servizi nel workspace cliente
- [x] portare la copertura servizi nella lista clienti
- [x] aggiungere `service_line_id` a task e scadenze manuali
- [x] dare priorita ai link espliciti nel motore di copertura
- [x] aggiungere quick action per collegare task e scadenze a una linea servizio
- [x] far emergere in UI i buchi di collegamento ancora da completare
- [x] aggiungere filtro globale per clienti con dati operativi incompleti
- [x] introdurre snapshot/query riusabile per la dashboard management

Done when:

- il team capisce non solo lo stato copertura, ma anche cosa manca per renderla affidabile
- i record non collegati sono individuabili e correggibili rapidamente
- la direzione puo consumare il segnale senza affidarsi solo a euristiche

### M2 - Daily execution cockpit

Obiettivo:

- rendere SGIC il primo schermo della giornata per chi lavora

Task:

- [x] costruire una prima vista cross-cliente per task e scadenze del giorno
- [x] introdurre viste `oggi`, `in ritardo`, `bloccate`
- [x] aggiungere vista `questa settimana`
- [x] aggiungere filtri per owner, cliente e priorita
- [x] aggiungere filtro per sede
- [x] mostrare task ricorrenti scoperti o non ripianificati
- [x] definire criteri chiari per backlog critico

Done when:

- ogni operatore capisce in pochi secondi dove intervenire
- il sistema riduce la necessita di fogli esterni o promemoria paralleli

### M3 - Timeline cliente e memoria operativa

Obiettivo:

- unificare eventi chiave in una memoria leggibile

Task:

- [x] modellare la timeline cliente come feed unico
- [x] includere task, note, documenti, audit e scadenze
- [x] rendere filtrabile la timeline per tipo evento
- [ ] aggiungere lettura ed eventi NC
- [ ] evidenziare decisioni e warning pin importanti

Done when:

- un nuovo operatore puo capire lo storico cliente senza leggere piu moduli separati

### M4 - Governo per sede

Obiettivo:

- far emergere il livello `sede` come nodo operativo reale

Task:

- [ ] score di salute per sede
- [ ] task, audit, documenti e scadenze aggregati per sede
- [ ] warning su sedi senza presidio recente
- [ ] link forte tra sede e linee servizio attive

Done when:

- la sede smette di essere solo anagrafica e diventa un perimetro operativo leggibile

### M5 - Erogazione servizio vs contratto

Obiettivo:

- rendere confrontabile cio che e stato venduto con cio che e stato eseguito

Task:

- [ ] definire regole standard `venduto / pianificato / eseguito / scoperto`
- [ ] introdurre eccezioni per linee one-shot vs ricorrenti
- [ ] evidenziare clienti con perimetro contratto non tradotto in piano operativo
- [ ] preparare output riusabile per management dashboard

Done when:

- SGIC permette di capire se il servizio e realmente sotto controllo

### M6 - Handoff verso management

Obiettivo:

- esporre al layer direzionale solo segnali gia maturi e leggibili

Task:

- [ ] definire read model condivisi tra workspace cliente e `/management`
- [ ] allineare nomenclatura KPI e stati
- [ ] stabilire freshness e proprieta dei dati tra SGIC e FileMaker

Done when:

- i numeri della direzione riflettono davvero il lavoro operativo

## Now

Task immediati da eseguire in questo stream:

1. `M2` Preparare il terreno per una inbox operativa giornaliera.
2. `M3` Arricchire la timeline con NC e segnali decisionali.
3. `M4` Iniziare score di salute per sede.

## Next

Task da affrontare dopo il blocco corrente:

1. introdurre una vista `oggi/in ritardo` cross-cliente
2. costruire una timeline cliente minima
3. rafforzare il nodo sede con segnali operativi

## Later

Task da fare solo dopo le milestone precedenti:

1. automatismi avanzati sui task ricorrenti
2. confronto copertura servizi vs staging FileMaker
3. alert direzionali evoluti

## Rischi e regole di coordinamento

Rischi attuali:

- sessioni parallele che toccano `layout`, `management`, auth o docs condivisi
- euristiche troppo forti dove manca un collegamento esplicito
- tabelle generate o artefatti `.next` sporchi durante lavori paralleli

Mitigazioni:

- tenere i diff stretti per feature
- usare migration additive
- evitare refactor larghi mentre ci sono piu sessioni attive
- verificare sempre con `npm run verify:release`

## Progress log

- 2026-03-12: avviata roadmap operativa unica per lo stream interno separata dalla dashboard management
- 2026-03-12: completata base copertura servizi con link espliciti e quick action inline
- 2026-03-12: completata visibilita dei buchi di collegamento in workspace cliente e lista clienti, con filtro globale per dati operativi incompleti
- 2026-03-12: aggiunto read model riusabile per copertura servizi e gap operativi, pronto per integrazione con layer management
- 2026-03-12: avviato `daily execution cockpit` sulla pagina clienti con viste cross-cliente `oggi`, `in ritardo` e `bloccate`
- 2026-03-12: esteso `daily execution cockpit` con vista `questa settimana` e filtri operativi per cliente, owner e priorita
- 2026-03-12: completati filtro per sede e vista `ricorrenti da riallineare` nel cockpit operativo cross-cliente
- 2026-03-12: introdotto `backlog critico` con criteri espliciti su ritardo, blocchi, priorita, owner, linea servizio e ricorrenze
- 2026-03-12: corretto un mismatch export nel modulo audit per mantenere la build verde durante il lavoro parallelo
- 2026-03-12: introdotta timeline cliente minima nella tab note con feed unificato di audit, task, scadenze, documenti e note
- 2026-03-12: prossimo task operativo fissato su `timeline arricchita con NC e segnali decisionali`
