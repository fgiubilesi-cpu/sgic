# FileMaker Sync Bridge

Endpoint interno per alimentare il layer staging direzionale senza letture live dalla UI.

## Endpoint

- `POST /api/management/filemaker-sync`

## Autenticazione

Header supportati:

- `Authorization: Bearer <MANAGEMENT_SYNC_API_KEY>`
- oppure `x-sgic-sync-key: <MANAGEMENT_SYNC_API_KEY>`

Variabili ambiente richieste:

- `MANAGEMENT_SYNC_API_KEY` oppure `INTERNAL_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`

## Payload minimo

```json
{
  "organization_slug": "sgic-demo",
  "source_system": "filemaker",
  "sync_scope": "direction",
  "sync_mode": "incremental",
  "clients": [
    {
      "source_record_id": "CLI-001",
      "name": "Cliente Demo",
      "client_code": "C001",
      "status": "active"
    }
  ],
  "service_lines": [
    {
      "source_record_id": "SER-001",
      "client_source_record_id": "CLI-001",
      "service_name": "Audit periodici",
      "service_area": "Audit",
      "cadence": "mensile",
      "annual_value": 12000
    }
  ],
  "contracts": [],
  "deadlines": [],
  "capacity": []
}
```

## Comportamento attuale

- la route crea una riga in `management_sync_runs`
- fa `upsert` non distruttivo sulle tabelle `management_*_staging`
- prova a riconciliare `client_id` verso i clienti SGIC gia presenti
- usa come chiave di conflitto:
  `organization_id, source_system, source_record_id`
- aggiorna lo stato finale del run a `success`, `warning` o `failed`
- `dry_run: true` valida e risolve l organizzazione ma non scrive nulla

Nota:

- `sync_mode: "full"` in questa V1 non cancella i record mancanti; tratta il payload come snapshot da upsertare

## Riconciliazione clienti

Ordine di matching:

- `client_id` esplicito nel payload, se appartiene all organizzazione corrente
- collegamento gia presente in `management_clients_staging` per lo stesso `source_record_id`
- `vat_number`, se univoco nel perimetro clienti SGIC
- `name` normalizzato, se univoco nel perimetro clienti SGIC

Le righe dipendenti (`service_lines`, `contracts`, `deadlines`, `capacity`) ereditano il `client_id`
risolto tramite `client_source_record_id` quando disponibile. In questo modo anche gli sync incrementali
parziali possono continuare ad agganciarsi ai clienti SGIC gia riconciliati.

Se un `client_id` esplicito non appartiene all organizzazione corrente, non viene scritto come link valido
e il run lo segnala nel blocco `reconciliation` della risposta.

## Tabelle target

- `management_clients_staging`
- `management_service_lines_staging`
- `management_contracts_staging`
- `management_deadlines_staging`
- `management_capacity_staging`
- `management_sync_runs`

## Esempio cURL

```bash
curl -X POST http://127.0.0.1:3000/api/management/filemaker-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MANAGEMENT_SYNC_API_KEY" \
  -d '{
    "organization_slug": "sgic-demo",
    "source_system": "filemaker",
    "sync_scope": "direction",
    "clients": [
      {
        "source_record_id": "CLI-001",
        "name": "Cliente Demo"
      }
    ]
  }'
```

## Dry run locale

Payload e script pronti:

- [scripts/fixtures/filemaker-management-sample.json](/Users/filippo/Desktop/sgic/scripts/fixtures/filemaker-management-sample.json)
- [scripts/filemaker-management-dry-run.sh](/Users/filippo/Desktop/sgic/scripts/filemaker-management-dry-run.sh)

Esempio:

```bash
export MANAGEMENT_SYNC_API_KEY="..."
bash scripts/filemaker-management-dry-run.sh
```

Con override dello slug reale del tenant:

```bash
export MANAGEMENT_SYNC_API_KEY="..."
bash scripts/filemaker-management-dry-run.sh http://127.0.0.1:3000 \
  scripts/fixtures/filemaker-management-sample.json \
  giubilesi-associati
```

Per fare un sync reale con lo stesso fixture:

```bash
export MANAGEMENT_SYNC_API_KEY="..."
export DRY_RUN_OVERRIDE=false
bash scripts/filemaker-management-dry-run.sh http://127.0.0.1:3000 \
  scripts/fixtures/filemaker-management-sample.json \
  giubilesi-associati
```

## Risposta

La risposta JSON include anche un blocco `reconciliation`, utile per capire quante righe sono state
agganciate automaticamente ai clienti SGIC e quante restano ancora non riconciliate.
