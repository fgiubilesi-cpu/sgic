# Organization Admin Console Plan

## Vision

Trasformare `Organization` da semplice pagina settings a vera console admin del tenant SGIC.

La pagina deve permettere all'amministratore di capire rapidamente:

- chi e l'organizzazione
- chi usa il sistema
- con quali regole operative il sistema lavora
- come vengono prodotti report, documenti e notifiche
- qual e lo stato generale del tenant

## UX target

La pagina deve diventare una console con:

- header forte con stato tenant e KPI
- checklist di setup
- tab di navigazione per aree admin
- CTA chiare e contestuali
- contenuto leggibile e orientato all'azione, non solo campi form

## Tabs definitive

1. `profile`
2. `access`
3. `rules`
4. `branding`
5. `notifications`
6. `system`

## Milestones

### M1 - Console shell

Obiettivo:

- creare shell admin console
- aggiungere header tenant
- aggiungere KPI overview
- aggiungere setup checklist
- aggiungere navigazione a tab

Done when:

- la pagina ha una struttura da console admin
- l'admin capisce subito lo stato del tenant
- i tab sono visibili e navigabili
- build verde

Stato:

- [x] completata

### M2 - Profile

Obiettivo:

- completare identita organizzazione
- migliorare form profilo
- preparare dati output/report

Done when:

- anagrafica piu chiara
- dati usabili nei report
- stato profilo completo/incompleto

Stato:

- [x] completata

### M3 - Access

Obiettivo:

- rendere accessi e ruoli una sezione centrale
- aggiungere piu contesto e stato utenti
- preparare base per inviti futuri

Done when:

- sezione leggibile e gestibile
- ruoli e perimetro cliente chiari

Stato:

- [x] completata

### M4 - Rules

Obiettivo:

- introdurre regole operative tenant-level
- soglie score
- finestre scadenza
- default operativi

Done when:

- regole modificabili da UI
- regole usate davvero da badge/dashboard/liste

Stato:

- [x] completata

### M5 - Branding

Obiettivo:

- branding export/report
- testi standard e intestazioni

Done when:

- branding centralizzato
- output coerenti

Stato:

- [x] completata

### M6 - Notifications

Obiettivo:

- configurazione reminder e digest
- governance notifiche tenant

Done when:

- trigger configurabili
- riceventi e frequenze chiare

Stato:

- [x] completata

### M7 - System

Obiettivo:

- stato tecnico tenant
- health e release hygiene
- informazioni utili all'admin

Done when:

- pannello tecnico leggibile
- warning utili e non decorativi

Stato:

- [x] completata

## Out of scope per M1

- inviti auth reali
- ruoli granulari per permesso
- nuove migration schema solo per la shell
- integrazioni email/AI non supportate

## Verification checklist

- `/organization` si apre senza errori
- header console renderizzato
- KPI coerenti
- checklist leggibile
- tab navigation funzionante
- `npm run verify:release`
- regole operative influenzano audit explorer e dashboard
- branding e notifiche sono modificabili dalla console
- system snapshot leggibile

## Progress log

- 2026-03-12: creato piano e avviata M1 sul branch `codex/organization-admin-console`
- 2026-03-12: completata M1 con shell console, header tenant, KPI overview, setup checklist e tab navigation
- 2026-03-12: completate M2-M6 con profilo tenant, accessi contestualizzati, regole operative, branding, notifiche e persistenza su `organizations.settings`
- 2026-03-12: completata M7 con system snapshot tenant, hygiene release e integrazione delle regole in dashboard/audit explorer
