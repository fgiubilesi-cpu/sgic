# Document Intelligence Plan

## Vision

Trasformare il modulo `Documents` da archivio statico a sistema di acquisizione operativa.

Ogni documento caricato deve poter diventare:

- un file archiviato e versionato
- una fonte di metadati strutturati
- un generatore di dati utili per i moduli cliente
- un trigger per scadenze, task e warning

## Product principle

`Documento = file + metadati + dati estratti + collegamenti operativi`

Il valore non e nel semplice upload del PDF.
Il valore e nella capacita del sistema di leggere il documento, proporre informazioni strutturate e alimentare il workspace cliente senza duplicazioni manuali inutili.

## Outcome target

Alla fine di questo stream l'utente deve poter:

- caricare un documento reale in piattaforma
- classificarlo correttamente
- ottenere una proposta di dati estratti
- confermare o correggere i dati
- salvare il documento nel modulo giusto
- generare automaticamente effetti operativi dove opportuno

Esempi:

- un `Contratto` aggiorna la tab `Contract`
- un `Organigramma` propone o crea record in `Org Chart`
- un `Certificato` crea una scadenza
- un `Manuale` o una `Procedura` entra nell'archivio cliente/sede con revisione e owner

## Scope del progetto

Dentro questo stream rientra:

- upload file reale
- storage e metadata documentali
- tassonomia documenti
- parsing / estrazione guidata di dati strutturati
- review UI per confermare i dati estratti
- collegamento con `Contract`, `Org Chart`, `Deadlines`, `Documents`
- versioning base del documento
- ricerca e filtri utili al lavoro interno

Fuori scope per questo stream:

- portale cliente esterno
- OCR avanzato enterprise multilingua
- firma elettronica
- workflow approvativi multi-step
- classificazione automatica perfetta senza revisione umana
- automazioni autonome che sovrascrivono dati sensibili senza conferma

## UX target

Il modulo documenti deve avere:

- upload semplice ma robusto
- categorie chiare e leggibili
- percorso guidato `upload -> parse -> review -> save`
- preview file + preview dati estratti
- differenza evidente tra `dato proposto` e `dato confermato`
- filtro forte per categoria, stato, ambito, scadenza, revisione
- versioni leggibili senza ambiguita

## Tassonomia documenti

Categorie iniziali da supportare:

1. `Contract`
2. `Org Chart`
3. `Manual`
4. `Procedure`
5. `Certificate`
6. `Authorization`
7. `Registry`
8. `Form`
9. `Report`
10. `Other`

Nota:

- lato tabella `documents` conviene avere un enum o un set di valori coerenti con il dominio reale
- `Manual` e `Procedure` restano categorie documento, non diventano moduli separati
- `Org Chart` non e il file finale soltanto: e anche una sorgente per `client_contacts`

## Livelli di collegamento

Ogni documento deve poter essere collegato a:

- `organization`
- `client`
- `location`
- `contact`
- `personnel`
- `audit`

Regola:

- un documento puo avere un livello principale e piu riferimenti secondari
- il legame primario deve essere esplicito per evitare archivi ambigui

## Modello dati target

### Esistente da riusare

- `documents`
- `document_versions`
- `clients`
- `locations`
- `client_contracts`
- `client_contacts`
- `client_deadlines`
- `client_tasks`

### Nuove entita probabili

1. `document_ingestions`
2. `document_entities`
3. `document_extraction_reviews`

### Reuse / extension rules

- `documents` resta la tabella canonica dell'archivio
- `document_versions` gestisce le revisioni del file
- `document_ingestions` traccia parsing, stato e payload estratto
- `client_contracts`, `client_contacts` e `client_deadlines` restano i target finali dei dati confermati
- non bisogna mettere JSON non governato dentro `documents` come soluzione permanente

## Dati minimi per documento

Ogni documento deve avere almeno:

- titolo
- categoria
- ambito primario
- client_id opzionale
- location_id opzionale
- contact_id opzionale o personnel_id opzionale
- status documento
- version / revision
- issue_date
- expiry_date
- owner interno
- file path / storage key
- mime type
- file size

## Dati estraibili per categoria

### 1. Contract

Campi da proporre:

- contract_type
- start_date
- renewal_date
- end_date
- internal_owner
- service_scope
- activity_frequency
- contractual_notes

Output target:

- aggiorna `client_contracts`
- crea scadenza rinnovo/scadenza in `client_deadlines`
- collega il file a `documents`

### 2. Org Chart

Campi da proporre:

- full_name
- role
- department
- email
- phone
- location
- is_primary

Output target:

- crea o propone record in `client_contacts`
- collega il file a `documents`

### 3. Manual / Procedure

Campi da proporre:

- title
- revision
- issue_date
- review_date
- owner
- applicable_scope
- location linkage

Output target:

- salva il file in `documents`
- crea eventuale `deadline` se esiste data revisione o scadenza

### 4. Certificate / Authorization

Campi da proporre:

- issuer
- document_number
- issue_date
- expiry_date
- applicable_scope
- location linkage

Output target:

- salva in `documents`
- crea `deadline`
- opzionalmente crea task di rinnovo

### 5. Registry / Report / Other

Campi da proporre:

- titolo
- date rilevanti
- note
- owner
- riferimenti cliente/sede

Output target:

- archiviazione ordinata
- nessuna scrittura automatica obbligatoria in altri moduli

## Stati del flusso intake

Ogni upload deve attraversare stati chiari:

1. `uploaded`
2. `parsed`
3. `review_required`
4. `reviewed`
5. `linked`
6. `archived`
7. `failed`

## Execution strategy

Implementazione a cascata, senza saltare avanti.

### M0 - Foundations

Obiettivo:

- definire tassonomia, pipeline e data model minimo

Lavoro:

- creare questo file e usarlo come riferimento unico
- allineare categorie documento con il dominio reale
- definire schema dei metadati documentali
- definire lo stato intake
- definire mapping `categoria -> modulo target`

Done when:

- esiste un contratto tecnico chiaro per il modulo

### M1 - Upload Base

Obiettivo:

- permettere upload reale di file

Lavoro:

- storage Supabase per documenti
- upload file via UI
- registrazione file in `documents`
- metadati minimi: titolo, categoria, scope, versione, date
- apertura / download file

Dipendenze:

- M0

Done when:

- il modulo documenti gestisce file reali e non solo URL

### M2 - Intake Model

Obiettivo:

- introdurre una pipeline tecnica per il parsing

Lavoro:

- migration `document_ingestions`
- stato parsing
- testo estratto
- payload strutturato proposto
- log errori / warnings
- collegamento a `document_id`

Dipendenze:

- M1

Done when:

- ogni upload ha un record intake tracciabile

### M3 - Parsing per categoria

Obiettivo:

- proporre dati strutturati in base alla categoria documento

Lavoro:

- parser `Contract`
- parser `Org Chart`
- parser `Manual / Procedure`
- parser `Certificate / Authorization`
- parser fallback `Other`

Dipendenze:

- M2

Done when:

- il sistema produce una proposta dati utile e leggibile

### M4 - Review UI

Obiettivo:

- far validare i dati estratti in modo chiaro

Lavoro:

- schermata review
- file preview
- campi proposti editabili
- stato `review_required`
- azioni `conferma`, `correggi`, `salva solo archivio`

Dipendenze:

- M3

Done when:

- nessun dato strutturato viene scritto senza una review umana

### M5 - Write-back ai moduli target

Obiettivo:

- usare il documento per aggiornare il workspace cliente

Lavoro:

- `Contract` -> `client_contracts`
- `Org Chart` -> `client_contacts`
- `Certificate / Authorization` -> `client_deadlines`
- `Manual / Procedure` -> `documents` + `deadlines` se serve
- task automatiche opzionali di follow-up

Dipendenze:

- M4

Done when:

- il documento produce effetto operativo reale nel sistema

### M6 - Versioning e Governance

Obiettivo:

- gestire correttamente revisioni e sostituzioni

Lavoro:

- revisione nuova versione
- stato `superseded`
- relazione tra versione attiva e precedenti
- owner documento
- microcopy chiara su documento corrente vs storico

Dipendenze:

- M1
- M5

Done when:

- manuali, procedure e contratti hanno ciclo di vita leggibile

### M7 - Archivio Operativo

Obiettivo:

- rendere il modulo documenti uno strumento quotidiano

Lavoro:

- filtri per categoria, stato, scadenza, ambito, revisione
- badge di rischio
- ricerca su titolo e testo estratto
- viste utili per cliente e sede

Dipendenze:

- M5
- M6

Done when:

- l'archivio e consultabile rapidamente e senza rumore

### M8 - Automazioni utili

Obiettivo:

- far reagire il sistema ai documenti critici

Lavoro:

- reminder scadenze documentali
- task di rinnovo automatiche opzionali
- warning in overview cliente
- mismatch detector tra dato estratto e dato gia presente

Dipendenze:

- M5
- M7

Done when:

- i documenti entrano davvero nel flusso operativo

### M9 - Final integration and polish

Obiettivo:

- chiudere il modulo in modo coerente e pronto per `main`

Lavoro:

- empty / error / loading states
- QA end-to-end upload -> parse -> review -> save
- pulizia microcopy
- verifica integrazioni con `Client Workspace`
- release verification

Dipendenze:

- M1-M8

Done when:

- il modulo documenti e affidabile, leggibile e usabile davvero

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

## Technical rules for this stream

- lavorare su branch dedicato
- una milestone alla volta
- evitare scritture automatiche irreversibili
- ogni estrazione deve essere reviewable
- build verde a fine milestone sostanziale
- non rompere il modulo `Documents` gia esistente mentre si introduce l'intake

## Verification checklist

- upload file reale funzionante
- documento salvato in storage e DB
- categorie coerenti e filtrabili
- parsing tracciato
- review UI leggibile
- contratto aggiornabile da documento
- organigramma convertibile in contatti cliente
- scadenze generate correttamente
- versioni documento leggibili
- `npm run verify:release`

## Progress log

- 2026-03-12: creato piano esecutivo `Document Intelligence` per estendere il modulo documenti con upload, parsing guidato e write-back strutturato verso il workspace cliente
- 2026-03-12: implementati M1-M2 base su branch `codex/client-workspace` con upload file su bucket `documents`, metadati file persistiti su `documents`, intake tracking in `document_ingestions`, categorie estese e apertura file via signed URL
- 2026-03-12: implementati M3-M5 core con parser euristico per categoria (`heuristics_v2`), review UI nel tab documenti cliente, salvataggio review in `document_extraction_reviews` e write-back operativo verso `client_contracts`, `client_contacts`, `client_deadlines`, `client_tasks` con tracciamento entità in `document_entities`
- 2026-03-12: implementato M7 base con filtro documentale esteso (ricerca testuale + stato intake) e coda review direttamente nella tabella documenti
- 2026-03-12: implementati M6 + M8 base con dialog `Governance` per storico versioni/review/link operativi, KPI documentali nel dossier cliente, alert su review queue e mismatch contratto
- 2026-03-12: sistemata la pipeline CSS globale in dev rimuovendo un import non valido da `globals.css`; UI tornata stabile su `3000`
