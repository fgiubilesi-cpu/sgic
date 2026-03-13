# Management Dashboard Roadmap

## Obiettivo

Creare una nuova area direzionale interna in SGIC che legga:

- dati operativi nativi SGIC
- snapshot gestionali importati da FileMaker

senza sostituire FileMaker e senza leggere FileMaker live dalla UI.

## Principio architetturale

Ruoli dei sistemi:

- `FileMaker` resta la sorgente gestionale primaria per anagrafiche, copertura servizio, contratti e capacità.
- `SGIC` resta il sistema operativo interno per audit, task, documenti, NC/AC e lavoro quotidiano.
- il layer `management_*_staging` fa da cuscinetto tra i due sistemi.
- la route `/management` consuma un read model misto, leggendo SGIC nativo e staging FileMaker.

Flusso:

1. FileMaker esporta un payload minimo.
2. SGIC riceve il payload su `/api/management/filemaker-sync`.
3. Il bridge valida, riconcilia i clienti SGIC e scrive in staging.
4. La dashboard management legge KPI e liste dal read model server-side.

## KPI direzionali V1

Widget principali:

- `Portafoglio attivo`
- `Copertura servizi`
- `Clienti ad alta attenzione`
- `Scadenze trasversali`
- `Capacità interna`

Liste principali:

- `Portafoglio sotto presidio`
- `Copertura servizi per area`
- `Scadenze e rinnovi`
- `Stato dati e integrazione`

## Entità staging minime

- `management_sync_runs`
- `management_clients_staging`
- `management_service_lines_staging`
- `management_contracts_staging`
- `management_deadlines_staging`
- `management_capacity_staging`

## Regole V1

- niente letture live da FileMaker lato UI
- niente dashboard generica “piena di grafici”
- preferire card, warning, liste e drill-down
- usare staging come fallback quando il dato SGIC operativo non basta
- mantenere visibili anche i clienti importati ma non ancora riconciliati

## Roadmap

### V1

Focus:

- nuova area `/management`
- dashboard direzionale minima ma utile
- sync bridge FileMaker -> staging
- riconciliazione base dei clienti via `client_id`, `vat_number`, `name`
- drill-down verso moduli SGIC esistenti

Done when:

- la direzione vede portafoglio, copertura, scadenze e capacità in una sola vista
- il dato FileMaker non resta invisibile se non esiste ancora il corrispettivo operativo SGIC

### V2

Focus:

- migliorare mapping clienti e sedi
- arricchire relazione `contratto -> linee servizio -> task/scadenze`
- aggiungere letture per sede e per owner
- esporre mismatch tra “venduto”, “presidiato” ed “eseguito”

### V3

Focus:

- freshness dichiarata per ogni KPI
- snapshot incrementali governati
- KPI direzionali più maturi su rischio operativo e marginalità di presidio
- read model condivisi tra dashboard direzionale e workspace operativo

## File di riferimento

- [FILEMAKER_SYNC_BRIDGE.md](/Users/filippo/Desktop/sgic/docs/FILEMAKER_SYNC_BRIDGE.md)
- [SGIC_OPERATING_SYSTEM_ROADMAP.md](/Users/filippo/Desktop/sgic/docs/SGIC_OPERATING_SYSTEM_ROADMAP.md)
