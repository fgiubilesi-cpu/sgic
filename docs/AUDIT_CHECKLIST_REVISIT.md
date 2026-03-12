# Audit Checklist Revisit

## Contesto

Nel dettaglio audit, il tab `Checklist` non mostra piu la checklist compilabile e cade nello stato:

- `No checklists configured for this audit.`

Dagli screenshot sembra un componente "sparito", ma la regressione reale e piu specifica:

- la pagina audit continua a montare `AuditChecklistWorkspace`
- `ChecklistManager` entra nell'empty state perche riceve `audit.checklists = []`

## Evidenza raccolta

### 1. Il componente non e stato rimosso

Il dettaglio audit continua a renderizzare:

- `src/app/(dashboard)/audits/[id]/page.tsx`
- `src/features/audits/components/audit-checklist-workspace.tsx`
- `src/features/audits/components/checklist-manager.tsx`

Il problema e nel dato passato al componente, non nel mount del componente stesso.

### 2. Il database ha ancora checklist e item

Verifica live su audit:

- `audit_id = 30000000-0000-4000-8000-000000000015`

Esito:

- audit presente
- checklist presente
- 8 checklist item presenti

Quindi la checklist non e stata cancellata a livello dato.

### 3. La query attuale di `getAudit` fallisce sulla relazione media

La query usata oggi in:

- `src/features/audits/queries/get-audit.ts`

include il nested join:

- `checklists -> checklist_items -> checklist_item_media`

Provando la stessa query contro il progetto remoto, il risultato e:

```text
code: PGRST200
message: Could not find a relationship between 'checklist_items' and 'checklist_item_media' in the schema cache
```

Quando questo succede:

- `checklistError` viene valorizzato
- il codice non lancia errore
- `checklists` resta `[]`
- la UI mostra falsamente `No checklists configured for this audit`

### 4. La stessa query senza `checklist_item_media` funziona

Verifica live:

- query `checklists -> checklist_items` senza join ai media
- risultato: `1 checklist`, `8 items`

Questo conferma che la regressione e stata introdotta dal layer media, non dalla checklist base.

## Root Cause Probabile

### Root cause applicativa confermata

`getAudit` ha una dipendenza fragile:

- se fallisce il join su `checklist_item_media`
- fallisce di fatto tutto il fetch checklist
- ma l'errore viene assorbito e trasformato in checklist vuota

Questa parte e confermata.

### Root cause infrastrutturale probabile

La causa piu probabile del `PGRST200` e una di queste:

1. la relazione FK `checklist_item_media.checklist_item_id -> checklist_items.id` non e realmente disponibile nel database remoto
2. la relazione esiste ma il PostgREST schema cache non la vede

Ipotesi forte da verificare:

- la migration `20260312195500_add_checklist_item_media.sql` usa `CREATE TABLE IF NOT EXISTS`
- se la tabella fosse gia esistita in una forma incompleta, la migration non avrebbe forzato la FK
- il codice e i types assumono la relazione
- PostgREST invece oggi non la trova

Nota:

- questa parte e un'inferenza tecnica forte, non ancora una prova SQL definitiva del constraint mancante

## Impatto

Impatto utente:

- la checklist sembra sparita
- l'audit appare vuoto o non configurato
- statistiche checklist e progress non vengono mostrate correttamente

Impatto tecnico:

- un problema opzionale dei media blocca la funzionalita core audit
- la pagina non distingue tra `nessuna checklist` e `errore fetch checklist`

## Fix Consigliato

### Fase 1. Hotfix applicativo immediato

Obiettivo:

- ripristinare subito la checklist anche se il join media continua a non funzionare

Strategia:

1. in `getAudit`, separare il fetch in due passaggi:
   - fetch checklist + checklist_items senza `checklist_item_media`
   - fetch media separato per `checklist_item_id`
2. se il fetch media fallisce:
   - loggare errore
   - restituire checklist comunque
   - mostrare media vuoti invece di svuotare tutta la checklist

Beneficio:

- la checklist core torna disponibile subito
- il problema media resta circoscritto

### Fase 2. Fix database / piattaforma

Obiettivo:

- ripristinare la relazione che PostgREST si aspetta

Azioni:

1. verificare sul remoto l'esistenza effettiva della FK `checklist_item_media_checklist_item_id_fkey`
2. se manca:
   - aggiungere migration correttiva con `ALTER TABLE ... ADD CONSTRAINT ...`
3. se esiste ma PostgREST non la vede:
   - forzare refresh/redeploy dei servizi che ricostruiscono schema cache

### Fase 3. Hardening

1. non silenziare piu `checklistError` in `getAudit`
2. introdurre un warning UI dedicato:
   - `Checklist presente ma errore nel caricamento media`
3. aggiungere smoke test per audit detail con checklist
4. aggiungere test di regressione per fetch checklist con media opzionali

## File Coinvolti

Diagnosi attuale:

- `src/app/(dashboard)/audits/[id]/page.tsx`
- `src/features/audits/queries/get-audit.ts`
- `src/features/audits/components/audit-checklist-workspace.tsx`
- `src/features/audits/components/checklist-manager.tsx`
- `supabase/migrations/20260312195500_add_checklist_item_media.sql`

Fix probabile:

- `src/features/audits/queries/get-audit.ts`
- eventuale nuova migration correttiva in `supabase/migrations/`

## Roadmap Operativa

1. Ripristinare checklist lato app con fetch checklist/items separato dai media.
2. Verificare FK remota o schema cache PostgREST.
3. Applicare migration correttiva se la relazione manca davvero.
4. Aggiungere logging esplicito e messaggio UI meno fuorviante.
5. Eseguire test manuale su audit con id `30000000-0000-4000-8000-000000000015`.

## Definizione di done

Il revisiting puo considerarsi chiuso quando:

- il tab `Checklist` mostra di nuovo gli item
- i media non possono piu far sparire l'intera checklist
- un audit senza checklist reale e distinguibile da un errore tecnico
- il dettaglio audit carica correttamente sia su dataset legacy sia su audit nuovi
